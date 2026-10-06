ALTER TABLE "ExpenseRequest" ADD COLUMN "budgetLineId" TEXT;
ALTER TABLE "ExpenseRequest" ADD COLUMN "budgetPeriodId" TEXT;
ALTER TABLE "BudgetReservation" ADD COLUMN "budgetPeriodId" TEXT;

UPDATE "ExpenseRequest" request
SET "budgetLineId" = reservation."budgetLineId"
FROM "BudgetReservation" reservation
WHERE reservation."expenseRequestId" = request."id"
  AND request."budgetLineId" IS NULL;

UPDATE "ExpenseRequest" request
SET "budgetPeriodId" = period."id"
FROM "BudgetPeriod" period
WHERE period."budgetLineId" = request."budgetLineId"
  AND period."month" = EXTRACT(MONTH FROM COALESCE(request."estimatedDate", request."createdAt"))::INTEGER
  AND period."fiscalYear" = EXTRACT(YEAR FROM COALESCE(request."estimatedDate", request."createdAt"))::INTEGER
  AND request."budgetPeriodId" IS NULL;

UPDATE "BudgetReservation" reservation
SET "budgetPeriodId" = request."budgetPeriodId"
FROM "ExpenseRequest" request
WHERE request."id" = reservation."expenseRequestId"
  AND reservation."budgetPeriodId" IS NULL;

CREATE INDEX "ExpenseRequest_budgetLineId_budgetPeriodId_idx" ON "ExpenseRequest"("budgetLineId", "budgetPeriodId");
CREATE INDEX "BudgetReservation_budgetPeriodId_status_idx" ON "BudgetReservation"("budgetPeriodId", "status");
CREATE UNIQUE INDEX "BudgetVersion_one_active_per_year_idx" ON "BudgetVersion"("fiscalYear") WHERE "active" = true;

ALTER TABLE "ExpenseRequest" ADD CONSTRAINT "ExpenseRequest_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExpenseRequest" ADD CONSTRAINT "ExpenseRequest_budgetPeriodId_fkey" FOREIGN KEY ("budgetPeriodId") REFERENCES "BudgetPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BudgetReservation" ADD CONSTRAINT "BudgetReservation_budgetPeriodId_fkey" FOREIGN KEY ("budgetPeriodId") REFERENCES "BudgetPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
