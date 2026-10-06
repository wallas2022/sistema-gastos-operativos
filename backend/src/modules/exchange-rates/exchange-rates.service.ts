import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExchangeRateDto, ExchangeRateQueryDto, UpdateExchangeRateDto } from './dto/exchange-rate.dto';

@Injectable()
export class ExchangeRatesService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: ExchangeRateQueryDto) {
    return this.prisma.exchangeRate.findMany({
      where: {
        fromCurrencyId: query.fromCurrencyId,
        toCurrencyId: query.toCurrencyId,
        active: query.active === undefined ? undefined : query.active === 'true',
        effectiveDate: query.date ? { lte: this.date(query.date) } : undefined,
      },
      include: { fromCurrency: true, toCurrency: true, audits: { orderBy: { createdAt: 'desc' }, take: 5 } },
      orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async current(query: ExchangeRateQueryDto) {
    const where: any = { active: true, effectiveDate: { lte: query.date ? this.date(query.date) : this.today() } };
    if (query.fromCurrencyId) where.fromCurrencyId = query.fromCurrencyId;
    if (query.toCurrencyId) where.toCurrencyId = query.toCurrencyId;
    const rows = await this.prisma.exchangeRate.findMany({ where, include: { fromCurrency: true, toCurrency: true }, orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }] });
    const seen = new Set<string>();
    return rows.filter((row) => { const key = `${row.fromCurrencyId}:${row.toCurrencyId}`; if (seen.has(key)) return false; seen.add(key); return true; });
  }

  async create(dto: CreateExchangeRateDto, user: any) {
    this.validatePair(dto.fromCurrencyId, dto.toCurrencyId);
    await this.ensureCurrencies(dto.fromCurrencyId, dto.toCurrencyId);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const row = await tx.exchangeRate.create({ data: { fromCurrencyId: dto.fromCurrencyId, toCurrencyId: dto.toCurrencyId, rate: new Prisma.Decimal(dto.rate), effectiveDate: this.date(dto.effectiveDate) }, include: { fromCurrency: true, toCurrency: true } });
        await tx.exchangeRateAudit.create({ data: { exchangeRateId: row.id, action: 'CREATED', newRate: row.rate, newActive: row.active, changedById: user?.id, changedByName: user?.name || user?.email || 'Usuario autenticado' } });
        return row;
      });
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Ya existe una tasa para ese par de monedas y fecha.');
      throw error;
    }
  }

  async update(id: string, dto: UpdateExchangeRateDto, user: any) {
    const existing = await this.prisma.exchangeRate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tasa de cambio no encontrada.');
    try {
      return await this.prisma.$transaction(async (tx) => {
        const row = await tx.exchangeRate.update({ where: { id }, data: { rate: dto.rate === undefined ? undefined : new Prisma.Decimal(dto.rate), effectiveDate: dto.effectiveDate ? this.date(dto.effectiveDate) : undefined, active: dto.active }, include: { fromCurrency: true, toCurrency: true } });
        await tx.exchangeRateAudit.create({ data: { exchangeRateId: id, action: 'UPDATED', previousRate: existing.rate, newRate: row.rate, previousActive: existing.active, newActive: row.active, changedById: user?.id, changedByName: user?.name || user?.email || 'Usuario autenticado' } });
        return row;
      });
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Ya existe una tasa para ese par de monedas y fecha.');
      throw error;
    }
  }

  private async ensureCurrencies(from: string, to: string) {
    const count = await this.prisma.currency.count({ where: { id: { in: [from, to] }, active: true } });
    if (count !== 2) throw new BadRequestException('Las monedas deben existir y estar activas.');
  }
  private validatePair(from: string, to: string) { if (from === to) throw new BadRequestException('La tasa debe relacionar monedas diferentes.'); }
  private date(value: string) { const result = new Date(`${value.slice(0, 10)}T00:00:00.000Z`); if (Number.isNaN(result.getTime())) throw new BadRequestException('Fecha de vigencia inválida.'); return result; }
  private today() { const now = new Date(); return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())); }
}
