CREATE TYPE "BankAccountType" AS ENUM ('AHORRO', 'MONETARIA', 'CORRIENTE', 'OTRO');

ALTER TYPE "SettlementRefundStatus" ADD VALUE 'DEVOLUCION_REGISTRADA';
ALTER TYPE "SettlementRefundStatus" ADD VALUE 'DEVOLUCION_EN_REVISION';
ALTER TYPE "SettlementRefundStatus" ADD VALUE 'DEVOLUCION_VALIDADA';
ALTER TYPE "SettlementRefundStatus" ADD VALUE 'DEVOLUCION_RECHAZADA';
ALTER TYPE "SettlementRefundStatus" ADD VALUE 'CORRECCION_SOLICITADA';

CREATE TABLE "Bank" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Bank_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicantBankAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bankId" TEXT NOT NULL,
  "accountType" "BankAccountType" NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "holderName" TEXT NOT NULL,
  "currencyId" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApplicantBankAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BankAccountAudit" (
  "id" TEXT NOT NULL,
  "bankAccountId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "comment" TEXT,
  "result" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BankAccountAudit_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ExpenseRequestPayment" ADD COLUMN "bankAccountId" TEXT;
ALTER TABLE "ExpenseRequestPayment" ADD COLUMN "evidenceDocumentId" TEXT;

CREATE UNIQUE INDEX "Bank_code_key" ON "Bank"("code");
CREATE UNIQUE INDEX "Bank_name_key" ON "Bank"("name");
CREATE UNIQUE INDEX "ApplicantBankAccount_userId_bankId_accountNumber_key" ON "ApplicantBankAccount"("userId", "bankId", "accountNumber");
CREATE INDEX "ApplicantBankAccount_userId_currencyId_active_idx" ON "ApplicantBankAccount"("userId", "currencyId", "active");
CREATE INDEX "BankAccountAudit_bankAccountId_createdAt_idx" ON "BankAccountAudit"("bankAccountId", "createdAt");
CREATE UNIQUE INDEX "ExpenseRequestPayment_evidenceDocumentId_key" ON "ExpenseRequestPayment"("evidenceDocumentId");

ALTER TABLE "ApplicantBankAccount" ADD CONSTRAINT "ApplicantBankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApplicantBankAccount" ADD CONSTRAINT "ApplicantBankAccount_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApplicantBankAccount" ADD CONSTRAINT "ApplicantBankAccount_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BankAccountAudit" ADD CONSTRAINT "BankAccountAudit_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "ApplicantBankAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BankAccountAudit" ADD CONSTRAINT "BankAccountAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExpenseRequestPayment" ADD CONSTRAINT "ExpenseRequestPayment_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "ApplicantBankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExpenseRequestPayment" ADD CONSTRAINT "ExpenseRequestPayment_evidenceDocumentId_fkey" FOREIGN KEY ("evidenceDocumentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "Bank" ("id", "code", "name", "active", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'BI', 'Banco Industrial', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'BAM', 'Banco Agromercantil', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'BANRURAL', 'Banrural', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'GYT', 'Banco G&T Continental', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
