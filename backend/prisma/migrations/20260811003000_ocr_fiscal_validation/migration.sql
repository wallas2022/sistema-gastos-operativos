ALTER TYPE "PolicyField" ADD VALUE IF NOT EXISTS 'DOCUMENT_TYPE';

CREATE TYPE "DocumentVoucherType" AS ENUM ('FACTURA', 'RECIBO', 'COMPROBANTE_DE_PAGO', 'NOTA_DE_CREDITO', 'NOTA_DE_DEBITO', 'OTRO');
CREATE TYPE "FiscalReceiverType" AS ENUM ('EMPRESA', 'CONSUMIDOR_FINAL', 'NO_IDENTIFICADO');
CREATE TYPE "DocumentComplianceResult" AS ENUM ('VALIDACION_FISCAL_APROBADA', 'VALIDACION_FISCAL_RECHAZADA', 'VALIDACION_FISCAL_PENDIENTE_REVISION', 'DOCUMENTO_PERMITIDO_POR_POLITICA', 'DOCUMENTO_NO_PERMITIDO', 'OCR_ERROR');

ALTER TABLE "Company" ADD COLUMN "legalName" TEXT, ADD COLUMN "tradeName" TEXT, ADD COLUMN "taxId" TEXT;
UPDATE "Company" SET "legalName" = "name", "tradeName" = "name";
CREATE UNIQUE INDEX "Company_taxId_key" ON "Company"("taxId");

ALTER TABLE "OCRResult"
ADD COLUMN "detectedVoucherType" "DocumentVoucherType",
ADD COLUMN "finalVoucherType" "DocumentVoucherType",
ADD COLUMN "receiverTaxId" TEXT,
ADD COLUMN "receiverName" TEXT,
ADD COLUMN "receiverType" "FiscalReceiverType" NOT NULL DEFAULT 'NO_IDENTIFICADO',
ADD COLUMN "complianceResult" "DocumentComplianceResult",
ADD COLUMN "complianceReason" TEXT,
ADD COLUMN "eligibleForSettlement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "usedInSettlement" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "OCRComplianceDecision" (
  "id" TEXT NOT NULL,
  "ocrResultId" TEXT NOT NULL,
  "documentType" "DocumentVoucherType" NOT NULL,
  "companyId" TEXT,
  "expectedTaxId" TEXT,
  "foundTaxId" TEXT,
  "receiverName" TEXT,
  "receiverType" "FiscalReceiverType" NOT NULL,
  "receiverConfidence" DECIMAL(5,2),
  "appliedRule" TEXT NOT NULL,
  "appliedPolicyId" TEXT,
  "appliedPolicyCode" TEXT,
  "appliedPolicyName" TEXT,
  "result" "DocumentComplianceResult" NOT NULL,
  "reason" TEXT NOT NULL,
  "actorUserId" TEXT,
  "actorName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OCRComplianceDecision_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OCRComplianceDecision_ocrResultId_createdAt_idx" ON "OCRComplianceDecision"("ocrResultId", "createdAt");
CREATE INDEX "OCRComplianceDecision_companyId_result_createdAt_idx" ON "OCRComplianceDecision"("companyId", "result", "createdAt");
CREATE INDEX "OCRComplianceDecision_documentType_result_createdAt_idx" ON "OCRComplianceDecision"("documentType", "result", "createdAt");
ALTER TABLE "OCRComplianceDecision" ADD CONSTRAINT "OCRComplianceDecision_ocrResultId_fkey" FOREIGN KEY ("ocrResultId") REFERENCES "OCRResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OCRComplianceDecision" ADD CONSTRAINT "OCRComplianceDecision_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OCRComplianceDecision" ADD CONSTRAINT "OCRComplianceDecision_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
