import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type MoneyConversion = {
  originalAmount: Prisma.Decimal;
  originalCurrencyId: string;
  budgetAmount: Prisma.Decimal;
  budgetCurrencyId: string;
  exchangeRate: Prisma.Decimal;
  exchangeRateId: string | null;
};

@Injectable()
export class MoneyService {
  constructor(private readonly prisma: PrismaService) {}

  decimal(value: Prisma.Decimal.Value): Prisma.Decimal {
    try {
      return new Prisma.Decimal(value);
    } catch {
      throw new BadRequestException('El importe monetario no es válido.');
    }
  }

  roundAmount(value: Prisma.Decimal.Value): Prisma.Decimal {
    return this.decimal(value).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  }

  async convert(
    amount: Prisma.Decimal.Value,
    fromCurrencyId: string,
    toCurrencyId: string,
    date: Date,
    tx: any = this.prisma,
  ): Promise<MoneyConversion> {
    const originalAmount = this.roundAmount(amount);
    if (originalAmount.isNegative()) throw new BadRequestException('El importe no puede ser negativo.');
    if (fromCurrencyId === toCurrencyId) {
      return { originalAmount, originalCurrencyId: fromCurrencyId, budgetAmount: originalAmount, budgetCurrencyId: toCurrencyId, exchangeRate: new Prisma.Decimal(1), exchangeRateId: null };
    }
    const rate = await tx.exchangeRate.findFirst({
      where: { fromCurrencyId, toCurrencyId, active: true, effectiveDate: { lte: this.dateOnly(date) } },
      orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
    });
    if (!rate) throw new NotFoundException('No existe una tasa de cambio vigente para la moneda y fecha de la solicitud.');
    return {
      originalAmount,
      originalCurrencyId: fromCurrencyId,
      budgetAmount: this.roundAmount(originalAmount.mul(rate.rate)),
      budgetCurrencyId: toCurrencyId,
      exchangeRate: rate.rate,
      exchangeRateId: rate.id,
    };
  }

  private dateOnly(value: Date): Date {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
}
