import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }))
  create(@Body() dto: CreateExpenseRequestPaymentDto, @UploadedFile() file: Express.Multer.File | undefined, @Req() req: any) {
    return this.paymentsService.create(dto, file, req.user);
  }

  @Get('pending')
  pending(@Req() req: any) { return this.paymentsService.pending(req.user); }

  @Get('expense-request/:expenseRequestId')
  findByExpenseRequest(@Param('expenseRequestId') expenseRequestId: string, @Req() req: any) {
    return this.paymentsService.findByExpenseRequest(expenseRequestId, req.user);
  }

  @Get('expense-request/:expenseRequestId/summary')
  getPaymentSummary(@Param('expenseRequestId') expenseRequestId: string, @Req() req: any) {
    return this.paymentsService.getPaymentSummary(expenseRequestId, req.user);
  }
}
