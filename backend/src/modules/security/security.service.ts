import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class SecurityService {
  constructor(private prisma: PrismaService) {}

  // ─── Users ────────────────────────────────────────────────────────────────

  async findAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        costCenter: true,
        position: true,
        companyId: true,
        managerId: true,
        createdAt: true,
        roles: {
          select: {
            role: { select: { id: true, code: true, name: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOneUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        costCenter: true,
        position: true,
        companyId: true,
        managerId: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: {
              select: {
                id: true,
                code: true,
                name: true,
                permissions: {
                  select: {
                    permission: {
                      select: { id: true, code: true, name: true, module: true, action: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`);
    return user;
  }

  async createUser(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException(`El email ${dto.email} ya está registrado`);

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const { password: _, ...rest } = dto;

    return this.prisma.user.create({
      data: { ...rest, passwordHash },
      select: {
        id: true, name: true, email: true, active: true,
        costCenter: true, position: true, companyId: true, managerId: true, createdAt: true,
      },
    });
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    await this.findOneUser(id);
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true, name: true, email: true, active: true,
        costCenter: true, position: true, companyId: true, managerId: true, updatedAt: true,
      },
    });
  }

  async activateUser(id: string) {
    await this.findOneUser(id);
    return this.prisma.user.update({ where: { id }, data: { active: true }, select: { id: true, active: true } });
  }

  async deactivateUser(id: string) {
    await this.findOneUser(id);
    return this.prisma.user.update({ where: { id }, data: { active: false }, select: { id: true, active: true } });
  }

  // ─── Roles ────────────────────────────────────────────────────────────────

  async findAllRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          select: {
            permission: { select: { id: true, code: true, name: true, module: true, action: true } },
          },
        },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOneRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          select: {
            permission: { select: { id: true, code: true, name: true, module: true, action: true } },
          },
        },
        users: {
          select: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    if (!role) throw new NotFoundException(`Rol ${id} no encontrado`);
    return role;
  }

  async createRole(dto: CreateRoleDto) {
    const exists = await this.prisma.role.findUnique({ where: { code: dto.code } });
    if (exists) throw new ConflictException(`El código de rol "${dto.code}" ya existe`);
    return this.prisma.role.create({ data: dto });
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    await this.findOneRole(id);
    return this.prisma.role.update({ where: { id }, data: dto });
  }

  // ─── Permissions ──────────────────────────────────────────────────────────

  async findAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }

  async createPermission(dto: CreatePermissionDto) {
    const exists = await this.prisma.permission.findUnique({ where: { code: dto.code } });
    if (exists) throw new ConflictException(`El permiso "${dto.code}" ya existe`);
    return this.prisma.permission.create({ data: dto });
  }

  async updatePermission(id: string, dto: UpdatePermissionDto) {
    const exists = await this.prisma.permission.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Permiso ${id} no encontrado`);
    return this.prisma.permission.update({ where: { id }, data: dto });
  }

  // ─── Asignaciones User ↔ Role ─────────────────────────────────────────────

  async assignRoleToUser(userId: string, roleId: string) {
    await this.findOneUser(userId);
    await this.findOneRole(roleId);

    const existing = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });
    if (existing) throw new ConflictException('El usuario ya tiene ese rol asignado');

    return this.prisma.userRole.create({
      data: { userId, roleId },
      include: { role: { select: { id: true, code: true, name: true } } },
    });
  }

  async removeRoleFromUser(userId: string, roleId: string) {
    const existing = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });
    if (!existing) throw new NotFoundException('El usuario no tiene ese rol asignado');

    await this.prisma.userRole.delete({ where: { userId_roleId: { userId, roleId } } });
    return { message: 'Rol removido correctamente' };
  }

  // ─── Asignaciones Role ↔ Permission ──────────────────────────────────────

  async assignPermissionToRole(roleId: string, permissionId: string) {
    await this.findOneRole(roleId);
    const perm = await this.prisma.permission.findUnique({ where: { id: permissionId } });
    if (!perm) throw new NotFoundException(`Permiso ${permissionId} no encontrado`);

    const existing = await this.prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
    if (existing) throw new ConflictException('El rol ya tiene ese permiso asignado');

    return this.prisma.rolePermission.create({
      data: { roleId, permissionId },
      include: { permission: { select: { id: true, code: true, name: true, module: true, action: true } } },
    });
  }

  async removePermissionFromRole(roleId: string, permissionId: string) {
    const existing = await this.prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
    if (!existing) throw new NotFoundException('El rol no tiene ese permiso asignado');

    await this.prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
    return { message: 'Permiso removido del rol correctamente' };
  }

  // ─── Access Matrix ────────────────────────────────────────────────────────

  async getAccessMatrix() {
    const roles = await this.prisma.role.findMany({
      where: { active: true },
      select: {
        id: true,
        code: true,
        name: true,
        permissions: {
          select: {
            permission: {
              select: { id: true, code: true, name: true, module: true, action: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const allPermissions = await this.prisma.permission.findMany({
      where: { active: true },
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    const matrix = roles.map((role) => {
      const permCodes = new Set(role.permissions.map((rp) => rp.permission.code));
      const permsByModule: Record<string, Record<string, boolean>> = {};

      for (const perm of allPermissions) {
        if (!permsByModule[perm.module]) permsByModule[perm.module] = {};
        permsByModule[perm.module][perm.action] = permCodes.has(perm.code);
      }

      return {
        roleId: role.id,
        roleCode: role.code,
        roleName: role.name,
        permissions: permsByModule,
        permissionCodes: [...permCodes],
      };
    });

    return {
      roles: matrix,
      permissions: allPermissions,
    };
  }
}
