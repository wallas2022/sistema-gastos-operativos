ALTER TABLE "OCRResult"
  ADD COLUMN "processingDurationMs" INTEGER,
  ADD COLUMN "pageCount" INTEGER,
  ADD COLUMN "ocrPageCount" INTEGER,
  ADD COLUMN "directTextPageCount" INTEGER,
  ADD COLUMN "retryCount" INTEGER,
  ADD COLUMN "engineVersion" TEXT;
