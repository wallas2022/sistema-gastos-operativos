DROP INDEX IF EXISTS "BudgetVersion_one_active_per_year_idx";
CREATE UNIQUE INDEX "BudgetVersion_one_active_per_year_currency_idx"
  ON "BudgetVersion"("fiscalYear", "currencyId")
  WHERE "active" = true;
