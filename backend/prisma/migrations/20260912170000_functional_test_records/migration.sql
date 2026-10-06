-- CreateEnum
CREATE TYPE "FunctionalTestRecordStatus" AS ENUM ('BORRADOR', 'EN_EJECUCION', 'CERRADO');

-- CreateEnum
CREATE TYPE "FunctionalTestCaseStatus" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'REALIZADA', 'NO_REALIZADA');

-- CreateEnum
CREATE TYPE "FunctionalTestResult" AS ENUM ('EXITOSA', 'NO_EXITOSA', 'NO_APLICA');

-- CreateTable
CREATE TABLE "FunctionalTestRecord" (
    "id" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "analystName" TEXT NOT NULL,
    "performedByName" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "comments" TEXT,
    "status" "FunctionalTestRecordStatus" NOT NULL DEFAULT 'BORRADOR',
    "companyId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FunctionalTestRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunctionalRequirement" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FunctionalRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunctionalTestCase" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "testDescription" TEXT NOT NULL,
    "acceptanceCriteria" TEXT NOT NULL,
    "estimatedTime" TEXT,
    "testDate" TIMESTAMP(3),
    "status" "FunctionalTestCaseStatus" NOT NULL DEFAULT 'PENDIENTE',
    "result" "FunctionalTestResult",
    "observedResult" TEXT,
    "observations" TEXT,
    "executedByUserId" TEXT,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FunctionalTestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunctionalTestEvidence" (
    "id" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FunctionalTestEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FunctionalTestRecord_companyId_status_idx" ON "FunctionalTestRecord"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FunctionalRequirement_code_name_key" ON "FunctionalRequirement"("code", "name");

-- CreateIndex
CREATE INDEX "FunctionalTestCase_recordId_status_idx" ON "FunctionalTestCase"("recordId", "status");

-- CreateIndex
CREATE INDEX "FunctionalTestCase_requirementId_idx" ON "FunctionalTestCase"("requirementId");

-- CreateIndex
CREATE INDEX "FunctionalTestEvidence_documentId_idx" ON "FunctionalTestEvidence"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "FunctionalTestEvidence_testCaseId_documentId_key" ON "FunctionalTestEvidence"("testCaseId", "documentId");
ALTER TABLE "FunctionalTestRecord" ADD CONSTRAINT "FunctionalTestRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunctionalTestRecord" ADD CONSTRAINT "FunctionalTestRecord_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunctionalTestCase" ADD CONSTRAINT "FunctionalTestCase_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "FunctionalTestRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunctionalTestCase" ADD CONSTRAINT "FunctionalTestCase_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "FunctionalRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunctionalTestCase" ADD CONSTRAINT "FunctionalTestCase_executedByUserId_fkey" FOREIGN KEY ("executedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunctionalTestEvidence" ADD CONSTRAINT "FunctionalTestEvidence_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "FunctionalTestCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunctionalTestEvidence" ADD CONSTRAINT "FunctionalTestEvidence_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunctionalTestEvidence" ADD CONSTRAINT "FunctionalTestEvidence_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
