-- Budget currency is derived only when every existing version has exactly one
-- currency in its lines. Ambiguous historical data aborts the migration.
ALTER TABLE "BudgetVersion" ADD COLUMN "currencyId" TEXT;

-- ISO 4217 currencies explicitly required by this sprint. Existing rows are
-- preserved and code uniqueness prevents duplicates.
INSERT INTO "Currency" (id, code, name, symbol, active, "createdAt", "updatedAt")
VALUES
  (md5('OPEX-CURRENCY-USD')::uuid, 'USD', 'Dólar estadounidense', '$', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (md5('OPEX-CURRENCY-EUR')::uuid, 'EUR', 'Euro', '€', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "BudgetLine"
    GROUP BY "versionId"
    HAVING COUNT(DISTINCT currency) <> 1
  ) THEN
    RAISE EXCEPTION 'No se puede derivar la moneda: existe una versión presupuestaria con monedas mixtas';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "BudgetLine" bl
    LEFT JOIN "Currency" c ON c.code = UPPER(TRIM(bl.currency))
    WHERE c.id IS NULL
  ) THEN
    RAISE EXCEPTION 'No se puede derivar la moneda: una partida usa un código que no existe en Currency';
  END IF;
END $$;

UPDATE "BudgetVersion" bv
SET "currencyId" = source."currencyId"
FROM (
  SELECT bl."versionId", MIN(c.id) AS "currencyId"
  FROM "BudgetLine" bl
  JOIN "Currency" c ON c.code = UPPER(TRIM(bl.currency))
  GROUP BY bl."versionId"
) source
WHERE source."versionId" = bv.id;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "BudgetVersion" WHERE "currencyId" IS NULL) THEN
    RAISE EXCEPTION 'No se puede derivar la moneda de una versión presupuestaria sin partidas';
  END IF;
END $$;

ALTER TABLE "BudgetVersion" ALTER COLUMN "currencyId" SET NOT NULL;
ALTER TABLE "BudgetVersion"
  ADD CONSTRAINT "BudgetVersion_currencyId_fkey"
  FOREIGN KEY ("currencyId") REFERENCES "Currency"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "BudgetVersion_currencyId_idx" ON "BudgetVersion"("currencyId");

CREATE TABLE "ExchangeRate" (
  "id" TEXT NOT NULL,
  "fromCurrencyId" TEXT NOT NULL,
  "toCurrencyId" TEXT NOT NULL,
  "rate" DECIMAL(20,10) NOT NULL,
  "effectiveDate" DATE NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ExchangeRate_rate_positive" CHECK ("rate" > 0),
  CONSTRAINT "ExchangeRate_distinct_currencies" CHECK ("fromCurrencyId" <> "toCurrencyId"),
  CONSTRAINT "ExchangeRate_fromCurrencyId_fkey" FOREIGN KEY ("fromCurrencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ExchangeRate_toCurrencyId_fkey" FOREIGN KEY ("toCurrencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ExchangeRate_fromCurrencyId_toCurrencyId_effectiveDate_key"
  ON "ExchangeRate"("fromCurrencyId", "toCurrencyId", "effectiveDate");
CREATE INDEX "ExchangeRate_fromCurrencyId_toCurrencyId_active_effectiveDate_idx"
  ON "ExchangeRate"("fromCurrencyId", "toCurrencyId", "active", "effectiveDate");

CREATE TABLE "ExchangeRateAudit" (
  "id" TEXT NOT NULL,
  "exchangeRateId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "previousRate" DECIMAL(20,10),
  "newRate" DECIMAL(20,10),
  "previousActive" BOOLEAN,
  "newActive" BOOLEAN,
  "changedById" TEXT,
  "changedByName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExchangeRateAudit_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ExchangeRateAudit_exchangeRateId_fkey" FOREIGN KEY ("exchangeRateId") REFERENCES "ExchangeRate"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ExchangeRateAudit_exchangeRateId_createdAt_idx" ON "ExchangeRateAudit"("exchangeRateId", "createdAt");
CREATE INDEX "ExchangeRateAudit_changedById_createdAt_idx" ON "ExchangeRateAudit"("changedById", "createdAt");

ALTER TABLE "ExpenseRequest"
  ADD COLUMN "exchangeRate" DECIMAL(20,10) NOT NULL DEFAULT 1,
  ADD COLUMN "budgetAmount" DECIMAL(18,2),
  ADD COLUMN "budgetCurrencyId" TEXT;

UPDATE "ExpenseRequest" er
SET "budgetAmount" = er."estimatedAmount",
    "budgetCurrencyId" = COALESCE(bv."currencyId", er."currencyId")
FROM "BudgetVersion" bv
LEFT JOIN "BudgetLine" bl ON bl."versionId" = bv.id
WHERE bl.id = er."budgetLineId";

UPDATE "ExpenseRequest"
SET "budgetAmount" = "estimatedAmount",
    "budgetCurrencyId" = "currencyId"
WHERE "budgetAmount" IS NULL;

ALTER TABLE "ExpenseRequest"
  ADD CONSTRAINT "ExpenseRequest_budgetCurrencyId_fkey"
  FOREIGN KEY ("budgetCurrencyId") REFERENCES "Currency"(id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "ExpenseRequest_exchangeRate_positive" CHECK ("exchangeRate" > 0);
CREATE INDEX "ExpenseRequest_budgetCurrencyId_idx" ON "ExpenseRequest"("budgetCurrencyId");
