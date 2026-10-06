import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BankingService } from './banking.service';
import { CreateBankAccountDto, CreateBankDto, UpdateBankAccountDto, UpdateBankDto } from './dto/banking.dto';

@Controller('banking')
@UseGuards(JwtAuthGuard)
export class BankingController {
  constructor(private readonly service: BankingService) {}
  @Get('banks') banks(@Query('all') all?: string) { return this.service.banks(all !== 'true'); }
  @Post('banks') createBank(@Body() dto: CreateBankDto, @Req() req: any) { return this.service.createBank(dto, req.user); }
  @Patch('banks/:id') updateBank(@Param('id') id: string, @Body() dto: UpdateBankDto, @Req() req: any) { return this.service.updateBank(id, dto, req.user); }
  @Get('accounts/me') accounts(@Req() req: any, @Query('currencyId') currencyId?: string) { return this.service.accounts(req.user, currencyId); }
  @Get('accounts/user/:userId') userAccounts(@Param('userId') userId: string, @Query('currencyId') currencyId: string, @Req() req: any) { return this.service.activeAccountsForUser(userId, currencyId, req.user); }
  @Post('accounts') create(@Body() dto: CreateBankAccountDto, @Req() req: any) { return this.service.createAccount(dto, req.user); }
  @Patch('accounts/:id') update(@Param('id') id: string, @Body() dto: UpdateBankAccountDto, @Req() req: any) { return this.service.updateAccount(id, dto, req.user); }
  @Delete('accounts/:id') remove(@Param('id') id: string, @Req() req: any) { return this.service.removeAccount(id, req.user); }
}
