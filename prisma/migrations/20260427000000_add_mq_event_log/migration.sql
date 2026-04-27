-- CreateTable
CREATE TABLE IF NOT EXISTS food_ordering."MqEventLog" (
    "id" SERIAL NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "routingKey" TEXT NOT NULL,
    "source" TEXT,
    "branchId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "payload" JSONB NOT NULL,
    "error" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MqEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MqEventLog_eventId_key" ON food_ordering."MqEventLog"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MqEventLog_eventType_idx" ON food_ordering."MqEventLog"("eventType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MqEventLog_routingKey_idx" ON food_ordering."MqEventLog"("routingKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MqEventLog_status_idx" ON food_ordering."MqEventLog"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MqEventLog_branchId_idx" ON food_ordering."MqEventLog"("branchId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MqEventLog_createdAt_idx" ON food_ordering."MqEventLog"("createdAt");
