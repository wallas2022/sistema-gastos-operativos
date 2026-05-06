-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'PAGADO', 'RECHAZADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CHEQUE', 'TRANSFERENCIA', 'DEPOSITO', 'EFECTIVO', 'OTRO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ExpenseRequestStatus" ADD VALUE 'ENVIADA';
ALTER TYPE "ExpenseRequestStatus" ADD VALUE 'EN_REVISION';
ALTER TYPE "ExpenseRequestStatus" ADD VALUE 'EN_LIQUIDACION';
ALTER TYPE "ExpenseRequestStatus" ADD VALUE 'LIQUIDADA';
ALTER TYPE "ExpenseRequestStatus" ADD VALUE 'CERRADA';
ALTER TYPE "ExpenseRequestStatus" ADD VALUE 'ANULADA';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "expenseRequestId" TEXT;

-- CreateTable
CREATE TABLE "ExpenseRequestPayment" (
    "id" TEXT NOT NULL,
    "expenseRequestId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDIENTE',
    "bankName" TEXT,
    "accountNumber" TEXT,
    "referenceNumber" TEXT,
    "checkNumber" TEXT,
    "amountPaid" DECIMAL(12,2) NOT NULL,
    "currencyId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "paidByUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseRequestPayment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_expenseRequestId_fkey" FOREIGN KEY ("expenseRequestId") REFERENCES "ExpenseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseRequestPayment" ADD CONSTRAINT "ExpenseRequestPayment_expenseRequestId_fkey" FOREIGN KEY ("expenseRequestId") REFERENCES "ExpenseRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseRequestPayment" ADD CONSTRAINT "ExpenseRequestPayment_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseRequestPayment" ADD CONSTRAINT "ExpenseRequestPayment_paidByUserId_fkey" FOREIGN KEY ("paidByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
