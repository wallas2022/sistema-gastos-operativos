CREATE TYPE "ApprovalFlowStatus" AS ENUM ('PENDIENTE', 'EN_REVISION', 'APROBADA', 'RECHAZADA', 'OBSERVADA', 'EXPIRADA', 'CANCELADA');
CREATE TYPE "ApprovalStepStatus" AS ENUM ('PENDIENTE', 'ASIGNADA', 'EN_REVISION', 'APROBADA', 'RECHAZADA', 'OBSERVADA', 'OMITIDA', 'EXPIRADA', 'CANCELADA');

CREATE TABLE "PolicyApprovalStep" (
    "id" TEXT NOT NULL,
    "policyRuleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "approverRoleId" TEXT,
    "approverUserId" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PolicyApprovalStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApprovalFlow" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "expenseRequestId" TEXT,
    "status" "ApprovalFlowStatus" NOT NULL DEFAULT 'PENDIENTE',
    "currentStepOrder" INTEGER,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledByUserId" TEXT,
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApprovalFlow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApprovalStep" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "sourcePolicyRuleId" TEXT,
    "sourcePolicyRuleCode" TEXT,
    "approverRoleCode" TEXT,
    "assignedUserId" TEXT,
    "delegatedFromUserId" TEXT,
    "status" "ApprovalStepStatus" NOT NULL DEFAULT 'PENDIENTE',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "decidedByUserId" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApprovalStep_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PolicyApprovalStep_policyRuleId_order_key" ON "PolicyApprovalStep"("policyRuleId", "order");
CREATE INDEX "PolicyApprovalStep_approverRoleId_idx" ON "PolicyApprovalStep"("approverRoleId");
CREATE INDEX "PolicyApprovalStep_approverUserId_idx" ON "PolicyApprovalStep"("approverUserId");
CREATE UNIQUE INDEX "ApprovalFlow_expenseRequestId_key" ON "ApprovalFlow"("expenseRequestId");
CREATE UNIQUE INDEX "ApprovalFlow_entityType_entityId_key" ON "ApprovalFlow"("entityType", "entityId");
CREATE INDEX "ApprovalFlow_status_currentStepOrder_idx" ON "ApprovalFlow"("status", "currentStepOrder");
CREATE UNIQUE INDEX "ApprovalStep_flowId_order_key" ON "ApprovalStep"("flowId", "order");
CREATE INDEX "ApprovalStep_assignedUserId_status_idx" ON "ApprovalStep"("assignedUserId", "status");
CREATE INDEX "ApprovalStep_flowId_status_idx" ON "ApprovalStep"("flowId", "status");

ALTER TABLE "PolicyApprovalStep" ADD CONSTRAINT "PolicyApprovalStep_policyRuleId_fkey" FOREIGN KEY ("policyRuleId") REFERENCES "PolicyRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PolicyApprovalStep" ADD CONSTRAINT "PolicyApprovalStep_approverRoleId_fkey" FOREIGN KEY ("approverRoleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PolicyApprovalStep" ADD CONSTRAINT "PolicyApprovalStep_approverUserId_fkey" FOREIGN KEY ("approverUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApprovalFlow" ADD CONSTRAINT "ApprovalFlow_expenseRequestId_fkey" FOREIGN KEY ("expenseRequestId") REFERENCES "ExpenseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "ApprovalFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_delegatedFromUserId_fkey" FOREIGN KEY ("delegatedFromUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
