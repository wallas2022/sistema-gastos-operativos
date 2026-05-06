import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { requirePermission } from '../auth/permissions.util';
import { SecurityService } from './security.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@UseGuards(JwtAuthGuard)
@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  // ─── Users ────────────────────────────────────────────────────────────────

  @Get('users')
  findAllUsers(@Req() req: any) {
    requirePermission(req.user, 'SECURITY_USERS_READ');
    return this.securityService.findAllUsers();
  }

  @Get('users/:id')
  findOneUser(@Param('id') id: string, @Req() req: any) {
    requirePermission(req.user, 'SECURITY_USERS_READ');
    return this.securityService.findOneUser(id);
  }

  @Post('users')
  createUser(@Body() dto: CreateUserDto, @Req() req: any) {
    requirePermission(req.user, 'SECURITY_USERS_WRITE');
    return this.securityService.createUser(dto);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req: any) {
    requirePermission(req.user, 'SECURITY_USERS_WRITE');
    return this.securityService.updateUser(id, dto);
  }

  @Patch('users/:id/activate')
  activateUser(@Param('id') id: string, @Req() req: any) {
    requirePermission(req.user, 'SECURITY_USERS_WRITE');
    return this.securityService.activateUser(id);
  }

  @Patch('users/:id/deactivate')
  deactivateUser(@Param('id') id: string, @Req() req: any) {
    requirePermission(req.user, 'SECURITY_USERS_WRITE');
    return this.securityService.deactivateUser(id);
  }

  // ─── Roles ────────────────────────────────────────────────────────────────

  @Get('roles')
  findAllRoles(@Req() req: any) {
    requirePermission(req.user, 'SECURITY_ROLES_READ');
    return this.securityService.findAllRoles();
  }

  @Get('roles/:id')
  findOneRole(@Param('id') id: string, @Req() req: any) {
    requirePermission(req.user, 'SECURITY_ROLES_READ');
    return this.securityService.findOneRole(id);
  }

  @Post('roles')
  createRole(@Body() dto: CreateRoleDto, @Req() req: any) {
    requirePermission(req.user, 'SECURITY_ROLES_WRITE');
    return this.securityService.createRole(dto);
  }

  @Patch('roles/:id')
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto, @Req() req: any) {
    requirePermission(req.user, 'SECURITY_ROLES_WRITE');
    return this.securityService.updateRole(id, dto);
  }

  // ─── Permissions ──────────────────────────────────────────────────────────

  @Get('permissions')
  findAllPermissions(@Req() req: any) {
    requirePermission(req.user, 'SECURITY_PERMISSIONS_READ');
    return this.securityService.findAllPermissions();
  }

  @Post('permissions')
  createPermission(@Body() dto: CreatePermissionDto, @Req() req: any) {
    requirePermission(req.user, 'SECURITY_PERMISSIONS_WRITE');
    return this.securityService.createPermission(dto);
  }

  @Patch('permissions/:id')
  updatePermission(@Param('id') id: string, @Body() dto: UpdatePermissionDto, @Req() req: any) {
    requirePermission(req.user, 'SECURITY_PERMISSIONS_WRITE');
    return this.securityService.updatePermission(id, dto);
  }

  // ─── Asignaciones User ↔ Role ─────────────────────────────────────────────

  @Post('users/:userId/roles/:roleId')
  assignRoleToUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Req() req: any,
  ) {
    requirePermission(req.user, 'SECURITY_ASSIGNMENTS_WRITE');
    return this.securityService.assignRoleToUser(userId, roleId);
  }

  @Delete('users/:userId/roles/:roleId')
  removeRoleFromUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Req() req: any,
  ) {
    requirePermission(req.user, 'SECURITY_ASSIGNMENTS_WRITE');
    return this.securityService.removeRoleFromUser(userId, roleId);
  }

  // ─── Asignaciones Role ↔ Permission ──────────────────────────────────────

  @Post('roles/:roleId/permissions/:permissionId')
  assignPermissionToRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
    @Req() req: any,
  ) {
    requirePermission(req.user, 'SECURITY_ASSIGNMENTS_WRITE');
    return this.securityService.assignPermissionToRole(roleId, permissionId);
  }

  @Delete('roles/:roleId/permissions/:permissionId')
  removePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
    @Req() req: any,
  ) {
    requirePermission(req.user, 'SECURITY_ASSIGNMENTS_WRITE');
    return this.securityService.removePermissionFromRole(roleId, permissionId);
  }

  // ─── Access Matrix ────────────────────────────────────────────────────────

  @Get('access-matrix')
  getAccessMatrix(@Req() req: any) {
    requirePermission(req.user, 'SECURITY_MATRIX_READ');
    return this.securityService.getAccessMatrix();
  }
}
