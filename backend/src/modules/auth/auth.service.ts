import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const validPassword = await bcrypt.compare(dto.password, user.passwordHash);

    if (!validPassword) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const permissions = await this.getUserPermissions(user.id);

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      managerId: user.managerId,
      costCenter: user.costCenter,
      position: user.position,
      permissions,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        managerId: user.managerId,
        costCenter: user.costCenter,
        position: user.position,
        permissions,
      },
    };
  }

  private async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        role: {
          active: true,
        },
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissions: string[] = userRoles.flatMap((userRole) =>
      userRole.role.permissions
        .filter((rolePermission) => rolePermission.permission.active)
        .map((rolePermission) => rolePermission.permission.code),
    );

    return Array.from(new Set(permissions));
  }
}