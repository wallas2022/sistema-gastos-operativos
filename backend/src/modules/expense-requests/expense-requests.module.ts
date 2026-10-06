import { Module } from "@nestjs/common";
import { ExpenseRequestsController } from "./expense-requests.controller";
import { ExpenseRequestsService } from "./expense-requests.service";
import { PrismaService } from "../../prisma/prisma.service";
import { PoliciesModule } from "../policies/policies.module";
import { ApprovalModule } from "../approval/approval.module";
import { BudgetModule } from "../budget/budget.module";
import { ExchangeRatesModule } from "../exchange-rates/exchange-rates.module";

@Module({
  imports: [PoliciesModule, ApprovalModule, BudgetModule, ExchangeRatesModule],
  controllers: [ExpenseRequestsController],
  providers: [ExpenseRequestsService, PrismaService],
})
export class ExpenseRequestsModule {}
