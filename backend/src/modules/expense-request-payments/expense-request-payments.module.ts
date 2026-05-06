import { Module } from '@nestjs/common';
import { ExpenseRequestPaymentsController } from './expense-request-payments.controller';
import { ExpenseRequestPaymentsService } from './expense-request-payments.service';

@Module({
  controllers: [ExpenseRequestPaymentsController],
  providers: [ExpenseRequestPaymentsService],
  exports: [ExpenseRequestPaymentsService],
})
export class ExpenseRequestPaymentsModule {}