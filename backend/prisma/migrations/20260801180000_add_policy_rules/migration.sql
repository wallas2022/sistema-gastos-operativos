-- CreateEnum
CREATE TYPE "PolicyField" AS ENUM ('AMOUNT', 'COMPANY', 'COUNTRY', 'COST_CENTER', 'BUDGET_ACCOUNT', 'EXPENSE_TYPE', 'PRIORITY', 'REQUESTER_ROLE', 'DESTINATION', 'CURRENCY', 'DAYS');

-- CreateEnum
CREATE TYPE "PolicyOperator" AS ENUM ('EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN', 'LESS_THAN_OR_EQUAL', 'CONTAINS', 'IN');

-- CreateEnum
CREATE TYPE "PolicyResultStatus" AS ENUM ('OK', 'WARNING', 'ERROR', 'APPROVAL_REQUIRED', 'NOT_APPLICABLE');

-- CreateTable
CREATE TABLE "PolicyRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "field" "PolicyField" NOT NULL,
    "operator" "PolicyOperator" NOT NULL,
    "comparisonValue" TEXT NOT NULL,
    "action" "PolicyResultStatus" NOT NULL,
    "message" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "companyId" TEXT,
    "expenseType" "ExpenseType",
    "active" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PolicyRule_code_key" ON "PolicyRule"("code");

-- CreateIndex
CREATE INDEX "PolicyRule_active_deletedAt_validFrom_validTo_idx" ON "PolicyRule"("active", "deletedAt", "validFrom", "validTo");

-- CreateIndex
CREATE INDEX "PolicyRule_companyId_expenseType_priority_idx" ON "PolicyRule"("companyId", "expenseType", "priority");

-- CreateIndex
CREATE INDEX "PolicyRule_field_action_idx" ON "PolicyRule"("field", "action");

-- AddForeignKey
ALTER TABLE "PolicyRule" ADD CONSTRAINT "PolicyRule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
