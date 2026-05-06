-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RoleName" ADD VALUE 'GERENTE';
ALTER TYPE "RoleName" ADD VALUE 'FINANZAS';
ALTER TYPE "RoleName" ADD VALUE 'TESORERIA';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "costCenter" TEXT,
ADD COLUMN     "managerId" TEXT,
ADD COLUMN     "position" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
