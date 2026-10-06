CREATE TYPE "SettlementCertificationStatus" AS ENUM ('PENDIENTE', 'CERTIFICADA');

ALTER TABLE "ExpenseSettlement"
ADD COLUMN "certificationStatus" "SettlementCertificationStatus" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN "certifiedAt" TIMESTAMP(3),
ADD COLUMN "certifiedByUserId" TEXT;

ALTER TABLE "SettlementRefund"
ADD COLUMN "bankId" TEXT,
ADD COLUMN "observations" TEXT;

CREATE INDEX "SettlementRefund_bankId_idx" ON "SettlementRefund"("bankId");

ALTER TABLE "ExpenseSettlement"
ADD CONSTRAINT "ExpenseSettlement_certifiedByUserId_fkey"
FOREIGN KEY ("certifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SettlementRefund"
ADD CONSTRAINT "SettlementRefund_bankId_fkey"
FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Document.expenseRequestId is intentionally preserved for historical records and
-- technical evidence. ExpenseSettlementDocument remains the only functional link
-- between OCR receipts and an expense settlement.
