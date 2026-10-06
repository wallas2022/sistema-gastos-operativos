import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateExchangeRateDto, ExchangeRateQueryDto, UpdateExchangeRateDto } from './dto/exchange-rate.dto';
import { ExchangeRatesService } from './exchange-rates.service';

@Controller('exchange-rates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExchangeRatesController {
  constructor(private readonly service: ExchangeRatesService) {}

  @Get() list(@Query() query: ExchangeRateQueryDto) { return this.service.list(query); }
  @Get('current') current(@Query() query: ExchangeRateQueryDto) { return this.service.current(query); }

  @Post()
  @Roles('ADMIN', 'FINANZAS')
  create(@Body() dto: CreateExchangeRateDto, @Req() req: any) { return this.service.create(dto, req.user); }

  @Patch(':id')
  @Roles('ADMIN', 'FINANZAS')
  update(@Param('id') id: string, @Body() dto: UpdateExchangeRateDto, @Req() req: any) { return this.service.update(id, dto, req.user); }
}
