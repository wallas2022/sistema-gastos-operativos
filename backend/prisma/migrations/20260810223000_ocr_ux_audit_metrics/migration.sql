ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'ASOCIADO_SOLICITUD';

ALTER TABLE "OCRResult"
ADD COLUMN "reviewStartedAt" TIMESTAMP(3),
ADD COLUMN "confirmedAt" TIMESTAMP(3),
ADD COLUMN "fieldsDetectedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "fieldsOmittedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "modificationCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "OCRResult" result
SET "fieldsDetectedCount" = (SELECT COUNT(*) FROM "ExtractedField" field WHERE field."ocrResultId" = result."id");

CREATE TABLE "OCRFieldCorrection" (
  "id" TEXT NOT NULL,
  "extractedFieldId" TEXT NOT NULL,
  "ocrValue" TEXT,
  "previousValue" TEXT,
  "finalValue" TEXT NOT NULL,
  "reason" TEXT,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OCRFieldCorrection_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OCRFieldCorrection_extractedFieldId_createdAt_idx" ON "OCRFieldCorrection"("extractedFieldId", "createdAt");
CREATE INDEX "OCRFieldCorrection_userId_createdAt_idx" ON "OCRFieldCorrection"("userId", "createdAt");
ALTER TABLE "OCRFieldCorrection" ADD CONSTRAINT "OCRFieldCorrection_extractedFieldId_fkey" FOREIGN KEY ("extractedFieldId") REFERENCES "ExtractedField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OCRFieldCorrection" ADD CONSTRAINT "OCRFieldCorrection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "OCRValidationRun" (
  "id" TEXT NOT NULL,
  "ocrResultId" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "expectedResult" JSONB NOT NULL,
  "obtainedResult" JSONB NOT NULL,
  "correct" BOOLEAN NOT NULL,
  "observations" TEXT,
  "executedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OCRValidationRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OCRValidationRun_ocrResultId_createdAt_idx" ON "OCRValidationRun"("ocrResultId", "createdAt");
CREATE INDEX "OCRValidationRun_documentType_correct_createdAt_idx" ON "OCRValidationRun"("documentType", "correct", "createdAt");
ALTER TABLE "OCRValidationRun" ADD CONSTRAINT "OCRValidationRun_ocrResultId_fkey" FOREIGN KEY ("ocrResultId") REFERENCES "OCRResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OCRValidationRun" ADD CONSTRAINT "OCRValidationRun_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
