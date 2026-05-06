-- CreateEnum
CREATE TYPE "ExpenseRequestStatus" AS ENUM ('BORRADOR', 'VALIDADA', 'PENDIENTE_APROBACION', 'APROBADA', 'RECHAZADA', 'OBSERVADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('GASTO_OPERATIVO', 'GASTO_VIAJE', 'PAGO_PROVEEDOR', 'COMPRA_INSUMO', 'SERVICIO', 'OTRO');

-- CreateEnum
CREATE TYPE "RequestPriority" AS ENUM ('BAJA', 'NORMAL', 'ALTA', 'URGENTE');

-- CreateTable
CREATE TABLE "ExpenseRequest" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "ExpenseType" NOT NULL,
    "status" "ExpenseRequestStatus" NOT NULL DEFAULT 'BORRADOR',
    "priority" "RequestPriority" NOT NULL DEFAULT 'NORMAL',
    "requesterId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterRole" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "costCenter" TEXT NOT NULL,
    "budgetAccount" TEXT,
    "concept" TEXT NOT NULL,
    "justification" TEXT,
    "destination" TEXT,
    "days" INTEGER,
    "estimatedDate" TIMESTAMP(3),
    "estimatedAmount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GTQ',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseRequestItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitAmount" DECIMAL(14,2) NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "policyStatus" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseRequestValidation" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseRequestValidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseRequestTrace" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userName" TEXT,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseRequestTrace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseRequest_code_key" ON "ExpenseRequest"("code");

-- AddForeignKey
ALTER TABLE "ExpenseRequestItem" ADD CONSTRAINT "ExpenseRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ExpenseRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseRequestValidation" ADD CONSTRAINT "ExpenseRequestValidation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ExpenseRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseRequestTrace" ADD CONSTRAINT "ExpenseRequestTrace_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ExpenseRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
