import { NotImplementedException } from '@nestjs/common';
import { BudgetSourceType } from '@prisma/client';
import { IBudgetSourceProvider } from './budget-source-provider.interface';

export class OracleJdeProvider implements IBudgetSourceProvider {
  readonly sourceType = BudgetSourceType.ORACLE_JDE_API;
  async parse(): Promise<never> { throw new NotImplementedException('El proveedor Oracle JD Edwards está preparado pero aún no está configurado.'); }
}
