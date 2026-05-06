import { Module } from "@nestjs/common";
import { ExpenseRequestsController } from "./expense-requests.controller";
import { ExpenseRequestsService } from "./expense-requests.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  controllers: [ExpenseRequestsController],
  providers: [ExpenseRequestsService, PrismaService],
})
export class ExpenseRequestsModule {}