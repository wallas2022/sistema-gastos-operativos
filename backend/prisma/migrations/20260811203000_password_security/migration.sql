ALTER TABLE "User"
ADD COLUMN "blocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "forcePasswordChange" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "credentialVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "passwordChangedAt" TIMESTAMP(3);

CREATE TABLE "PasswordResetToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SecurityAudit" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "actorUserId" TEXT,
  "action" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "comment" TEXT,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SecurityAudit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SecurityAudit_userId_createdAt_idx" ON "SecurityAudit"("userId", "createdAt");
CREATE INDEX "SecurityAudit_action_createdAt_idx" ON "SecurityAudit"("action", "createdAt");
ALTER TABLE "SecurityAudit" ADD CONSTRAINT "SecurityAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SecurityAudit" ADD CONSTRAINT "SecurityAudit_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
