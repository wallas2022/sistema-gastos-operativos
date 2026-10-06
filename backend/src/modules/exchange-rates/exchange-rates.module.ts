import { Module } from '@nestjs/common';
import { ExchangeRatesController } from './exchange-rates.controller';
import { ExchangeRatesService } from './exchange-rates.service';
import { MoneyService } from './money.service';

@Module({ controllers: [ExchangeRatesController], providers: [ExchangeRatesService, MoneyService], exports: [ExchangeRatesService, MoneyService] })
export class ExchangeRatesModule {}
