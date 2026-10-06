CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'MICROSOFT_TEAMS', 'PUSH', 'WEBHOOK');
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ');

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
  "eventType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
  "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
  "link" TEXT,
  "entityType" TEXT,
  "entityId" TEXT,
  "metadata" JSONB,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SlaRule" (
  "id" TEXT NOT NULL,
  "priority" "RequestPriority" NOT NULL,
  "targetMinutes" INTEGER NOT NULL,
  "warningMinutes" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SlaRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_status_createdAt_idx" ON "Notification"("userId", "status", "createdAt");
CREATE INDEX "Notification_userId_eventType_createdAt_idx" ON "Notification"("userId", "eventType", "createdAt");
CREATE INDEX "Notification_entityType_entityId_idx" ON "Notification"("entityType", "entityId");
CREATE UNIQUE INDEX "SlaRule_priority_key" ON "SlaRule"("priority");
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "SlaRule" ("id", "priority", "targetMinutes", "warningMinutes", "updatedAt") VALUES
  (gen_random_uuid()::text, 'URGENTE', 240, 60, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ALTA', 480, 120, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'NORMAL', 1440, 240, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'BAJA', 2880, 480, CURRENT_TIMESTAMP);
