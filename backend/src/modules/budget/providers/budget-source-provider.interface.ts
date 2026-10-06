import { BudgetSourceType } from '@prisma/client';
import { BudgetSourceDocument } from '../domain/budget-source.types';

export interface IBudgetSourceProvider {
  readonly sourceType: BudgetSourceType;
  parse(input: { buffer: Buffer; fileName: string; currencyCode: string }): Promise<BudgetSourceDocument>;
}
