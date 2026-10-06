CREATE TYPE "SettlementStatus" AS ENUM ('BORRADOR', 'PENDIENTE_REVISION', 'OBSERVADA', 'APROBADA', 'CERRADA', 'RECHAZADA');
CREATE TYPE "SettlementBalanceStatus" AS ENUM ('PENDIENTE_DEVOLUCION', 'DEVOLUCION_EN_VALIDACION', 'CUADRADA', 'EXCESO_DE_RENDICION');
CREATE TYPE "SettlementRefundStatus" AS ENUM ('PENDIENTE', 'EN_VALIDACION', 'VALIDADA', 'RECHAZADA');

CREATE TABLE "ExpenseSettlement" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "expenseRequestId" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "companyId" TEXT,
  "preparedByUserId" TEXT NOT NULL,
  "currencyId" TEXT NOT NULL,
  "disbursedAmount" DECIMAL(14,2) NOT NULL,
  "documentsTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "validatedRefundTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "differenceAmount" DECIMAL(14,2) NOT NULL,
  "status" "SettlementStatus" NOT NULL DEFAULT 'BORRADOR',
  "balanceStatus" "SettlementBalanceStatus" NOT NULL DEFAULT 'PENDIENTE_DEVOLUCION',
  "currentObservation" TEXT,
  "submittedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "approvalFlowId" TEXT,
  CONSTRAINT "ExpenseSettlement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExpenseSettlementDocument" (
  "id" TEXT NOT NULL,
  "settlementId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "selectedByUserId" TEXT NOT NULL,
  "originalAmount" DECIMAL(14,2) NOT NULL,
  "originalCurrencyId" TEXT NOT NULL,
  "exchangeRate" DECIMAL(20,10) NOT NULL,
  "exchangeRateId" TEXT,
  "settlementCurrencyAmount" DECIMAL(14,2) NOT NULL,
  "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExpenseSettlementDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SettlementRefund" (
  "id" TEXT NOT NULL,
  "settlementId" TEXT NOT NULL,
  "paymentMethod" "PaymentMethod" NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "currencyId" TEXT NOT NULL,
  "exchangeRate" DECIMAL(20,10) NOT NULL,
  "exchangeRateId" TEXT,
  "settlementAmount" DECIMAL(14,2) NOT NULL,
  "operationDate" TIMESTAMP(3) NOT NULL,
  "referenceNumber" TEXT NOT NULL,
  "evidenceDocumentId" TEXT NOT NULL,
  "status" "SettlementRefundStatus" NOT NULL DEFAULT 'EN_VALIDACION',
  "createdByUserId" TEXT NOT NULL,
  "validatedByUserId" TEXT,
  "validatedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SettlementRefund_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SettlementAudit" (
  "id" TEXT NOT NULL,
  "settlementId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT,
  "description" TEXT NOT NULL,
  "metadata" JSONB,
  "userId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "userRole" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SettlementAudit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExpenseSettlement_code_key" ON "ExpenseSettlement"("code");
CREATE UNIQUE INDEX "ExpenseSettlement_expenseRequestId_key" ON "ExpenseSettlement"("expenseRequestId");
CREATE UNIQUE INDEX "ExpenseSettlement_approvalFlowId_key" ON "ExpenseSettlement"("approvalFlowId");
CREATE INDEX "ExpenseSettlement_companyId_status_createdAt_idx" ON "ExpenseSettlement"("companyId", "status", "createdAt");
CREATE INDEX "ExpenseSettlement_preparedByUserId_status_idx" ON "ExpenseSettlement"("preparedByUserId", "status");
CREATE UNIQUE INDEX "ExpenseSettlementDocument_documentId_key" ON "ExpenseSettlementDocument"("documentId");
CREATE INDEX "ExpenseSettlementDocument_settlementId_idx" ON "ExpenseSettlementDocument"("settlementId");
CREATE UNIQUE INDEX "SettlementRefund_evidenceDocumentId_key" ON "SettlementRefund"("evidenceDocumentId");
CREATE INDEX "SettlementRefund_settlementId_status_idx" ON "SettlementRefund"("settlementId", "status");
CREATE INDEX "SettlementAudit_settlementId_createdAt_idx" ON "SettlementAudit"("settlementId", "createdAt");

ALTER TABLE "ExpenseSettlement" ADD CONSTRAINT "ExpenseSettlement_expenseRequestId_fkey" FOREIGN KEY ("expenseRequestId") REFERENCES "ExpenseRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExpenseSettlement" ADD CONSTRAINT "ExpenseSettlement_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "ExpenseRequestPayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExpenseSettlement" ADD CONSTRAINT "ExpenseSettlement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExpenseSettlement" ADD CONSTRAINT "ExpenseSettlement_preparedByUserId_fkey" FOREIGN KEY ("preparedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExpenseSettlement" ADD CONSTRAINT "ExpenseSettlement_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExpenseSettlement" ADD CONSTRAINT "ExpenseSettlement_approvalFlowId_fkey" FOREIGN KEY ("approvalFlowId") REFERENCES "ApprovalFlow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExpenseSettlementDocument" ADD CONSTRAINT "ExpenseSettlementDocument_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "ExpenseSettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExpenseSettlementDocument" ADD CONSTRAINT "ExpenseSettlementDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExpenseSettlementDocument" ADD CONSTRAINT "ExpenseSettlementDocument_selectedByUserId_fkey" FOREIGN KEY ("selectedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExpenseSettlementDocument" ADD CONSTRAINT "ExpenseSettlementDocument_originalCurrencyId_fkey" FOREIGN KEY ("originalCurrencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SettlementRefund" ADD CONSTRAINT "SettlementRefund_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "ExpenseSettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SettlementRefund" ADD CONSTRAINT "SettlementRefund_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SettlementRefund" ADD CONSTRAINT "SettlementRefund_evidenceDocumentId_fkey" FOREIGN KEY ("evidenceDocumentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SettlementRefund" ADD CONSTRAINT "SettlementRefund_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SettlementRefund" ADD CONSTRAINT "SettlementRefund_validatedByUserId_fkey" FOREIGN KEY ("validatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SettlementAudit" ADD CONSTRAINT "SettlementAudit_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "ExpenseSettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SettlementAudit" ADD CONSTRAINT "SettlementAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
