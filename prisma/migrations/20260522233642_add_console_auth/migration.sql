-- CreateEnum
CREATE TYPE "food_ordering"."ConsoleRole" AS ENUM ('CUSTOMER', 'SYSTEM_ADMIN');

-- AlterTable
ALTER TABLE "food_ordering"."Branch" ADD COLUMN     "consoleUserId" TEXT;

-- CreateTable
CREATE TABLE "food_ordering"."ConsoleUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "food_ordering"."ConsoleRole" NOT NULL DEFAULT 'CUSTOMER',
    "companyName" TEXT NOT NULL,
    "companyAddress" TEXT,
    "companyPhone" TEXT,
    "companyEmail" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsoleUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConsoleUser_email_key" ON "food_ordering"."ConsoleUser"("email");

-- CreateIndex
CREATE INDEX "Branch_consoleUserId_idx" ON "food_ordering"."Branch"("consoleUserId");

-- AddForeignKey
ALTER TABLE "food_ordering"."Branch" ADD CONSTRAINT "Branch_consoleUserId_fkey" FOREIGN KEY ("consoleUserId") REFERENCES "food_ordering"."ConsoleUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
