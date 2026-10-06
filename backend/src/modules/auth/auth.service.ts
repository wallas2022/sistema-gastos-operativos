import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './dto/password.dto';
import { EmailService } from './email.service';
import { LoginDto } from './dto/login.dto';
import { createResetToken, hashResetToken, validatePasswordPolicy } from './password-security';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService, private readonly jwtService: JwtService, private readonly prisma: PrismaService, private readonly config: ConfigService, private readonly email: EmailService) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.active || user.blocked || !(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException('Credenciales inválidas o cuenta no disponible');
    const permissions = await this.getUserPermissions(user.id);
    const payload = { sub: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId, managerId: user.managerId, costCenter: user.costCenter, position: user.position, permissions, credentialVersion: user.credentialVersion };
    return { access_token: await this.jwtService.signAsync(payload), user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId, managerId: user.managerId, costCenter: user.costCenter, position: user.position, permissions, forcePasswordChange: user.forcePasswordChange } };
  }

  async forgotPassword(dto: ForgotPasswordDto, ipAddress?: string) {
    const generic = { message: 'Si la cuenta existe, se ha enviado un enlace para restablecer la contraseña.' };
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.active || user.blocked) { await this.audit(user?.id, null, 'SOLICITUD_RECUPERACION', 'ACEPTADA', 'Respuesta genérica.', ipAddress); return generic; }
    const issued = await this.issueResetToken(user.id);
    await this.email.sendPasswordReset({ to: user.email, name: user.name, resetUrl: issued.resetUrl, expiresMinutes: issued.expiresMinutes });
    await this.audit(user.id, user.id, 'SOLICITUD_RECUPERACION', 'EXITOSA', 'Correo de recuperación generado.', ipAddress);
    return { ...generic, ...(process.env.NODE_ENV === 'production' ? {} : { developmentResetUrl: issued.resetUrl }) };
  }

  async resetPassword(dto: ResetPasswordDto, ipAddress?: string) {
    this.assertPassword(dto.newPassword, dto.confirmation);
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash: hashResetToken(dto.token) }, include: { user: true } });
    if (!record || record.usedAt) throw new BadRequestException('El enlace de recuperación ya no es válido.');
    if (record.expiresAt <= new Date()) { await this.audit(record.userId, record.userId, 'TOKEN_EXPIRADO', 'RECHAZADO', 'Token expirado.', ipAddress); throw new BadRequestException('El enlace de recuperación expiró y ya no es válido.'); }
    if (await bcrypt.compare(dto.newPassword, record.user.passwordHash)) throw new BadRequestException('La nueva contraseña no puede ser igual a la actual.');
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await bcrypt.hash(dto.newPassword, 10), passwordChangedAt: now, forcePasswordChange: false, credentialVersion: { increment: 1 } } }),
      this.prisma.passwordResetToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: now } }),
    ]);
    await this.audit(record.userId, record.userId, 'RECUPERACION_COMPLETADA', 'EXITOSA', 'Contraseña restablecida.', ipAddress);
    return { message: 'La contraseña fue restablecida correctamente.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto, ipAddress?: string) {
    this.assertPassword(dto.newPassword, dto.confirmation);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(dto.currentPassword, user.passwordHash))) throw new BadRequestException('La contraseña actual es incorrecta.');
    if (await bcrypt.compare(dto.newPassword, user.passwordHash)) throw new BadRequestException('La nueva contraseña no puede ser igual a la actual.');
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(dto.newPassword, 10), passwordChangedAt: now, forcePasswordChange: false, credentialVersion: { increment: 1 } } }),
      this.prisma.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: now } }),
    ]);
    await this.audit(userId, userId, 'CAMBIO_CONTRASENA', 'EXITOSA', 'Contraseña cambiada por el usuario.', ipAddress);
    return { message: 'Contraseña actualizada. Inicie sesión nuevamente.' };
  }

  async issueResetToken(userId: string) {
    const token = createResetToken(); const expiresMinutes = this.config.get<number>('password.resetTokenMinutes') || 60; const now = new Date();
    await this.prisma.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: now } });
    await this.prisma.passwordResetToken.create({ data: { userId, tokenHash: hashResetToken(token), expiresAt: new Date(Date.now() + expiresMinutes * 60000) } });
    const base = this.config.get<string>('password.frontendUrl') || 'http://localhost:5173';
    return { token, expiresMinutes, resetUrl: `${base}/restablecer-contrasena?token=${token}` };
  }

  async invalidateResetTokens(userId: string) { await this.prisma.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } }); }
  async audit(userId: string | null | undefined, actorUserId: string | null | undefined, action: string, result: string, comment?: string, ipAddress?: string) { await this.prisma.securityAudit.create({ data: { userId: userId || null, actorUserId: actorUserId || null, action, result, comment, ipAddress } }); }
  private assertPassword(password: string, confirmation: string) { if (!confirmation || password !== confirmation) throw new BadRequestException('La confirmación de contraseña no coincide.'); validatePasswordPolicy(password, this.config.get<number>('password.minimumLength') || 10, this.config.get<boolean>('password.requireComplexity') !== false); }
  private async getUserPermissions(userId: string): Promise<string[]> { const roles = await this.prisma.userRole.findMany({ where: { userId, role: { active: true } }, include: { role: { include: { permissions: { include: { permission: true } } } } } }); return Array.from(new Set(roles.flatMap((entry) => entry.role.permissions.filter((item) => item.permission.active).map((item) => item.permission.code)))); }
}
