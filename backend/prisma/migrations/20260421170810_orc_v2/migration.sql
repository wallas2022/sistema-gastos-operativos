-- AlterTable
ALTER TABLE "ExtractedField" ADD COLUMN     "normalizedValue" TEXT,
ADD COLUMN     "rawLabel" TEXT;

-- AlterTable
ALTER TABLE "OCRResult" ADD COLUMN     "countryDetected" TEXT,
ADD COLUMN     "currencyCode" TEXT,
ADD COLUMN     "currencySymbol" TEXT,
ADD COLUMN     "decimalSeparator" TEXT,
ADD COLUMN     "documentTypeDetected" TEXT,
ADD COLUMN     "languageDetected" TEXT,
ADD COLUMN     "subtotalAmount" DECIMAL(14,2),
ADD COLUMN     "taxAmount" DECIMAL(14,2),
ADD COLUMN     "taxIncludedInPrices" BOOLEAN,
ADD COLUMN     "thousandsSeparator" TEXT,
ADD COLUMN     "totalAmount" DECIMAL(14,2);

-- CreateTable
CREATE TABLE "ExtractedExtraField" (
    "id" TEXT NOT NULL,
    "ocrResultId" TEXT NOT NULL,
    "rawLabel" TEXT,
    "rawValue" TEXT,
    "confidence" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtractedExtraField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractedLineItem" (
    "id" TEXT NOT NULL,
    "ocrResultId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "article" TEXT,
    "description" TEXT,
    "quantity" DECIMAL(12,2),
    "unitPrice" DECIMAL(12,2),
    "lineSubtotal" DECIMAL(12,2),
    "lineTax" DECIMAL(12,2),
    "lineTotal" DECIMAL(12,2),
    "taxIncluded" BOOLEAN,
    "confidence" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtractedLineItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExtractedExtraField" ADD CONSTRAINT "ExtractedExtraField_ocrResultId_fkey" FOREIGN KEY ("ocrResultId") REFERENCES "OCRResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedLineItem" ADD CONSTRAINT "ExtractedLineItem_ocrResultId_fkey" FOREIGN KEY ("ocrResultId") REFERENCES "OCRResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
