import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret')!,
    });
  }

  async validate(payload: { sub: string; credentialVersion?: number }) {
    const current = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, name: true, role: true, companyId: true, managerId: true, costCenter: true, position: true, active: true, blocked: true, credentialVersion: true, forcePasswordChange: true, roles: { where: { role: { active: true } }, include: { role: { include: { permissions: { include: { permission: true } } } } } } } });
    if (!current || !current.active || current.blocked || current.credentialVersion !== (payload.credentialVersion ?? 0)) throw new UnauthorizedException('La sesión ya no es válida.');
    const permissions = Array.from(new Set(current.roles.flatMap((entry) => entry.role.permissions.filter((item) => item.permission.active).map((item) => item.permission.code))));
    return {
      id: current.id,
      email: current.email,
      name: current.name,
      role: current.roles[0]?.role.code || current.role,
      companyId: current.companyId,
      managerId: current.managerId,
      costCenter: current.costCenter,
      position: current.position,
      permissions,
      forcePasswordChange: current.forcePasswordChange,
    };
  }
}
