CREATE TYPE "BudgetSourceType" AS ENUM ('EXCEL', 'ORACLE_JDE_API', 'ORACLE_JDE_DATABASE', 'ETL');
CREATE TYPE "BudgetVersionStatus" AS ENUM ('VALIDATED', 'ACTIVE', 'SUPERSEDED', 'REJECTED');
CREATE TYPE "BudgetReservationStatus" AS ENUM ('RESERVED', 'RELEASED', 'EXECUTED');

CREATE TABLE "BudgetVersion" (
  "id" TEXT NOT NULL, "fiscalYear" INTEGER NOT NULL, "versionNumber" INTEGER NOT NULL,
  "sourceType" "BudgetSourceType" NOT NULL, "sourceFileName" TEXT, "sourceHash" TEXT NOT NULL,
  "sourceSheet" TEXT, "sourceUpdatedAt" TEXT, "comment" TEXT,
  "status" "BudgetVersionStatus" NOT NULL DEFAULT 'VALIDATED', "active" BOOLEAN NOT NULL DEFAULT false,
  "importedByUserId" TEXT NOT NULL, "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rowCount" INTEGER NOT NULL, "warningCount" INTEGER NOT NULL DEFAULT 0,
  "approvedTotal" DECIMAL(18,2) NOT NULL, "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BudgetVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BudgetLine" (
  "id" TEXT NOT NULL, "versionId" TEXT NOT NULL, "naturalKey" TEXT NOT NULL, "sourceRow" INTEGER NOT NULL,
  "sourceCountryCode" TEXT NOT NULL, "countryId" TEXT, "companyId" TEXT,
  "businessUnit" TEXT NOT NULL, "objectCode" TEXT NOT NULL, "subCode" TEXT NOT NULL,
  "accountCode" TEXT NOT NULL, "accountDescription" TEXT NOT NULL, "detailDescription" TEXT NOT NULL,
  "area" TEXT NOT NULL, "frequency" TEXT, "currency" TEXT NOT NULL DEFAULT 'USD',
  "annualAmount" DECIMAL(18,2) NOT NULL, "sourceAnnualAmount" DECIMAL(18,2), "sourceComment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BudgetLine_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BudgetPeriod" (
  "id" TEXT NOT NULL, "budgetLineId" TEXT NOT NULL, "fiscalYear" INTEGER NOT NULL, "month" INTEGER NOT NULL,
  "approvedAmount" DECIMAL(18,2) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BudgetPeriod_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BudgetReservation" (
  "id" TEXT NOT NULL, "expenseRequestId" TEXT NOT NULL, "budgetLineId" TEXT NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL, "currency" TEXT NOT NULL,
  "status" "BudgetReservationStatus" NOT NULL DEFAULT 'RESERVED',
  "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "releasedAt" TIMESTAMP(3), "executedAt" TIMESTAMP(3),
  "releaseReason" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BudgetReservation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BudgetVersion_fiscalYear_versionNumber_key" ON "BudgetVersion"("fiscalYear", "versionNumber");
CREATE UNIQUE INDEX "BudgetVersion_fiscalYear_sourceHash_key" ON "BudgetVersion"("fiscalYear", "sourceHash");
CREATE INDEX "BudgetVersion_fiscalYear_active_status_idx" ON "BudgetVersion"("fiscalYear", "active", "status");
CREATE UNIQUE INDEX "BudgetLine_versionId_naturalKey_key" ON "BudgetLine"("versionId", "naturalKey");
CREATE INDEX "BudgetLine_versionId_accountCode_businessUnit_idx" ON "BudgetLine"("versionId", "accountCode", "businessUnit");
CREATE INDEX "BudgetLine_companyId_countryId_accountCode_idx" ON "BudgetLine"("companyId", "countryId", "accountCode");
CREATE UNIQUE INDEX "BudgetPeriod_budgetLineId_fiscalYear_month_key" ON "BudgetPeriod"("budgetLineId", "fiscalYear", "month");
CREATE INDEX "BudgetPeriod_fiscalYear_month_idx" ON "BudgetPeriod"("fiscalYear", "month");
CREATE INDEX "BudgetReservation_budgetLineId_status_idx" ON "BudgetReservation"("budgetLineId", "status");
CREATE UNIQUE INDEX "BudgetReservation_expenseRequestId_budgetLineId_key" ON "BudgetReservation"("expenseRequestId", "budgetLineId");
ALTER TABLE "BudgetVersion" ADD CONSTRAINT "BudgetVersion_importedByUserId_fkey" FOREIGN KEY ("importedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "BudgetVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BudgetPeriod" ADD CONSTRAINT "BudgetPeriod_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BudgetReservation" ADD CONSTRAINT "BudgetReservation_expenseRequestId_fkey" FOREIGN KEY ("expenseRequestId") REFERENCES "ExpenseRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BudgetReservation" ADD CONSTRAINT "BudgetReservation_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
