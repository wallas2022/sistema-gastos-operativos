CREATE TYPE "FiscalCompanyIdentificationMethod" AS ENUM ('OCR', 'CORRECCION_MANUAL');
CREATE TYPE "FiscalCompanyIdentificationStatus" AS ENUM ('EMPRESA_NO_IDENTIFICADA', 'EMPRESA_IDENTIFICADA');

ALTER TABLE "OCRResult"
ADD COLUMN "receiverTradeName" TEXT,
ADD COLUMN "fiscalCompanyId" TEXT,
ADD COLUMN "fiscalCompanyTaxId" TEXT,
ADD COLUMN "fiscalCompanyLegalName" TEXT,
ADD COLUMN "fiscalCompanyTradeName" TEXT,
ADD COLUMN "fiscalCompanyIdentifiedAt" TIMESTAMP(3),
ADD COLUMN "fiscalCompanyIdentificationMethod" "FiscalCompanyIdentificationMethod",
ADD COLUMN "fiscalCompanyIdentificationStatus" "FiscalCompanyIdentificationStatus" NOT NULL DEFAULT 'EMPRESA_NO_IDENTIFICADA',
ADD COLUMN "fiscalCompanyWarning" TEXT;

CREATE INDEX "OCRResult_fiscalCompanyId_fiscalCompanyIdentificationStatus_idx"
ON "OCRResult"("fiscalCompanyId", "fiscalCompanyIdentificationStatus");

ALTER TABLE "OCRResult"
ADD CONSTRAINT "OCRResult_fiscalCompanyId_fkey"
FOREIGN KEY ("fiscalCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
