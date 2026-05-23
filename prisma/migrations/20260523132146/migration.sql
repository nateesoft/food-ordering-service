/*
  Warnings:

  - A unique constraint covering the columns `[sessionId]` on the table `TableSession` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "food_ordering"."UserRole" ADD VALUE 'CASHIER';
ALTER TYPE "food_ordering"."UserRole" ADD VALUE 'WAITER';

-- AlterTable
ALTER TABLE "food_ordering"."Branch" ADD COLUMN     "logo" TEXT;

-- AlterTable
ALTER TABLE "food_ordering"."TableSession" ADD COLUMN     "sessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TableSession_sessionId_key" ON "food_ordering"."TableSession"("sessionId");

-- CreateIndex
CREATE INDEX "TableSession_sessionId_idx" ON "food_ordering"."TableSession"("sessionId");
