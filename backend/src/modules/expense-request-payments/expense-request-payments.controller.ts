import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateExpenseRequestPaymentDto } from './dto/create-expense-request-payment.dto';
import { ExpenseRequestPaymentsService } from './expense-request-payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('expense-request-payments')
@UseGuards(JwtAuthGuard)
export class ExpenseRequestPaymentsController {
  constructor(
    private readonly paymentsService: ExpenseRequestPaymentsService,
  ) {}

  @Post()
  create(@Body() dto: CreateExpenseRequestPaymentDto, @Req() req: any) {
    return this.paymentsService.create(dto, req.user?.id);
  }

  @Get('expense-request/:expenseRequestId')
  findByExpenseRequest(@Param('expenseRequestId') expenseRequestId: string) {
    return this.paymentsService.findByExpenseRequest(expenseRequestId);
  }

  @Get('expense-request/:expenseRequestId/summary')
  getPaymentSummary(@Param('expenseRequestId') expenseRequestId: string) {
    return this.paymentsService.getPaymentSummary(expenseRequestId);
  }
}