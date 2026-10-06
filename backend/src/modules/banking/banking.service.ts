import { authorizedCompanyId } from '../auth/permissions.util';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBankAccountDto, CreateBankDto, UpdateBankAccountDto, UpdateBankDto } from './dto/banking.dto';

@Injectable()
export class BankingService {
  constructor(private readonly prisma: PrismaService) {}

  banks(activeOnly = true) { return this.prisma.bank.findMany({ where: activeOnly ? { active: true } : {}, orderBy: { name: 'asc' } }); }

  async createBank(dto: CreateBankDto, user: any) {
    this.assertAdmin(user);
    try { return await this.prisma.bank.create({ data: { code: dto.code.trim().toUpperCase(), name: dto.name.trim() } }); }
    catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('El banco ya existe.'); throw error; }
  }

  async updateBank(id: string, dto: UpdateBankDto, user: any) {
    this.assertAdmin(user);
    await this.requireBank(id);
    return this.prisma.bank.update({ where: { id }, data: { ...dto, code: dto.code?.trim().toUpperCase(), name: dto.name?.trim() } });
  }

  accounts(user: any, currencyId?: string) {
    return this.prisma.applicantBankAccount.findMany({ where: { userId: user.id, currencyId: currencyId || undefined }, include: { bank: true, currency: true, audits: { orderBy: { createdAt: 'desc' } } }, orderBy: [{ active: 'desc' }, { isDefault: 'desc' }, { createdAt: 'desc' }] });
  }

  activeAccountsForUser(userId: string, currencyId: string, user: any) {
    if (user.id !== userId && !['ADMIN', 'TESORERIA', 'FINANZAS'].includes(user.role)) throw new ForbiddenException('No tiene acceso a las cuentas del solicitante.');
    return this.prisma.applicantBankAccount.findMany({ where: { userId, user: { companyId: authorizedCompanyId(user, undefined, '') }, currencyId, active: true }, include: { bank: true, currency: true }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
  }

  async createAccount(dto: CreateBankAccountDto, user: any) {
    const accountNumber = this.normalize(dto.accountNumber);
    await Promise.all([this.requireBank(dto.bankId), this.requireCurrency(dto.currencyId)]);
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.isDefault) await tx.applicantBankAccount.updateMany({ where: { userId: user.id, currencyId: dto.currencyId, isDefault: true }, data: { isDefault: false } });
        const account = await tx.applicantBankAccount.create({ data: { userId: user.id, bankId: dto.bankId, accountType: dto.accountType, accountNumber, holderName: dto.holderName.trim(), currencyId: dto.currencyId, isDefault: dto.isDefault || false } });
        await tx.bankAccountAudit.create({ data: { bankAccountId: account.id, userId: user.id, action: 'ALTA_CUENTA', result: 'EXITOSO', metadata: { currencyId: dto.currencyId, isDefault: dto.isDefault || false } } });
        return account;
      });
    } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('La cuenta bancaria ya está registrada.'); throw error; }
  }

  async updateAccount(id: string, dto: UpdateBankAccountDto, user: any) {
    const current = await this.requireOwned(id, user.id);
    const currencyId = dto.currencyId || current.currencyId;
    if (dto.bankId) await this.requireBank(dto.bankId);
    if (dto.currencyId) await this.requireCurrency(dto.currencyId);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) await tx.applicantBankAccount.updateMany({ where: { userId: user.id, currencyId, isDefault: true, id: { not: id } }, data: { isDefault: false } });
      const account = await tx.applicantBankAccount.update({ where: { id }, data: { bankId: dto.bankId, accountType: dto.accountType, accountNumber: dto.accountNumber ? this.normalize(dto.accountNumber) : undefined, holderName: dto.holderName?.trim(), currencyId: dto.currencyId, active: dto.active, isDefault: dto.active === false ? false : dto.isDefault } });
      await tx.bankAccountAudit.create({ data: { bankAccountId: id, userId: user.id, action: dto.active === false ? 'DESACTIVACION_CUENTA' : 'MODIFICACION_CUENTA', comment: dto.comment, result: 'EXITOSO', metadata: { previous: current as any, changes: dto as any } } });
      return account;
    });
  }

  async removeAccount(id: string, user: any) {
    await this.requireOwned(id, user.id);
    const used = await this.prisma.expenseRequestPayment.count({ where: { bankAccountId: id } });
    if (used) throw new BadRequestException('No puede eliminar una cuenta utilizada en un desembolso histórico; desactívela.');
    await this.prisma.applicantBankAccount.delete({ where: { id } });
    return { deleted: true };
  }

  private normalize(value: string) { return value.replace(/[\s-]/g, '').toUpperCase(); }
  private assertAdmin(user: any) { if (user.role !== 'ADMIN') throw new ForbiddenException('Sólo Administración puede gestionar bancos.'); }
  private async requireBank(id: string) { const bank = await this.prisma.bank.findUnique({ where: { id } }); if (!bank || !bank.active) throw new BadRequestException('El banco no existe o está inactivo.'); return bank; }
  private async requireCurrency(id: string) { const currency = await this.prisma.currency.findUnique({ where: { id } }); if (!currency || !currency.active) throw new BadRequestException('La moneda no existe o está inactiva.'); return currency; }
  private async requireOwned(id: string, userId: string) { const account = await this.prisma.applicantBankAccount.findFirst({ where: { id, userId } }); if (!account) throw new NotFoundException('Cuenta bancaria no encontrada.'); return account; }
}
