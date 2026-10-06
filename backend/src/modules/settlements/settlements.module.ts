import { Module } from '@nestjs/common';
import { ApprovalModule } from '../approval/approval.module';
import { StorageModule } from '../documents/storage/storage.module';
import { ExchangeRatesModule } from '../exchange-rates/exchange-rates.module';
import { PoliciesModule } from '../policies/policies.module';
import { SettlementsController } from './settlements.controller';
import { SettlementsService } from './settlements.service';

@Module({
  imports: [StorageModule, ExchangeRatesModule, PoliciesModule, ApprovalModule],
  controllers: [SettlementsController],
  providers: [SettlementsService],
  exports: [SettlementsService],
})
export class SettlementsModule {}
