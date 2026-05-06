import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExpenseRequestsService } from './expense-requests.service';
import { CreateExpenseRequestDto } from './dto/create-expense-request.dto';
import { requirePermission } from '../auth/permissions.util';

@Controller('expense-requests')
@UseGuards(JwtAuthGuard)
export class ExpenseRequestsController {
  constructor(
    private readonly expenseRequestsService: ExpenseRequestsService,
  ) {}

  @Post()
  create(@Body() dto: CreateExpenseRequestDto, @Req() req: any) {
    requirePermission(req.user, 'EXPENSE_REQUEST_CREATE');
    return this.expenseRequestsService.create(dto, req.user);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.expenseRequestsService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.expenseRequestsService.findOne(id, req.user);
  }
}