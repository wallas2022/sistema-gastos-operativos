CREATE TYPE "PaymentModality" AS ENUM ('REEMBOLSO', 'ANTICIPO_VIATICOS', 'PAGO_PROVEEDOR', 'PAGO_SERVICIO', 'PAGO_DIRECTO');
CREATE TYPE "FinancialOperationType" AS ENUM ('DESEMBOLSO_SOLICITANTE', 'PAGO_DIRECTO');

ALTER TABLE "ExpenseRequest"
  ADD COLUMN "paymentModality" "PaymentModality" NOT NULL DEFAULT 'REEMBOLSO',
  ADD COLUMN "intendedBeneficiaryName" TEXT,
  ADD COLUMN "intendedBeneficiaryTaxId" TEXT;

ALTER TABLE "ExpenseRequestPayment"
  ADD COLUMN "operationType" "FinancialOperationType" NOT NULL DEFAULT 'DESEMBOLSO_SOLICITANTE',
  ADD COLUMN "beneficiaryName" TEXT,
  ADD COLUMN "beneficiaryTaxId" TEXT;

UPDATE "ExpenseRequestPayment" payment
SET "beneficiaryName" = request."requesterName"
FROM "ExpenseRequest" request
WHERE payment."expenseRequestId" = request.id
  AND payment."beneficiaryName" IS NULL;

ALTER TABLE "ExpenseRequestPayment"
  ALTER COLUMN "beneficiaryName" SET NOT NULL;

CREATE INDEX "ExpenseRequest_paymentModality_status_idx" ON "ExpenseRequest"("paymentModality", "status");
CREATE INDEX "ExpenseRequestPayment_operationType_paymentStatus_idx" ON "ExpenseRequestPayment"("operationType", "paymentStatus");
