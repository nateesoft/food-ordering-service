-- CreateEnum
CREATE TYPE "food_ordering"."GatewayTransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- DropForeignKey
ALTER TABLE "food_ordering"."TableStaffAssignment" DROP CONSTRAINT IF EXISTS "TableStaffAssignment_tableNumber_fkey";

-- DropIndex
DROP INDEX IF EXISTS "food_ordering"."Table_number_key";

-- DropIndex
DROP INDEX IF EXISTS "food_ordering"."TableStaffAssignment_tableNumber_userId_key";

-- AlterTable: add missing columns
ALTER TABLE "food_ordering"."MenuItem" ADD COLUMN IF NOT EXISTS "code" TEXT NOT NULL DEFAULT '';
ALTER TABLE "food_ordering"."OrderItem" ADD COLUMN IF NOT EXISTS "code" TEXT;
ALTER TABLE "food_ordering"."TableStaffAssignment"
  ADD COLUMN IF NOT EXISTS "branchId" INTEGER,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable: GatewayTransaction
CREATE TABLE IF NOT EXISTS "food_ordering"."GatewayTransaction" (
    "id" SERIAL NOT NULL,
    "transactionId" TEXT NOT NULL,
    "paymentMethod" "food_ordering"."PaymentMethod" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "status" "food_ordering"."GatewayTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "providerRef" TEXT,
    "qrCodeData" TEXT,
    "metadata" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branchId" INTEGER,
    CONSTRAINT "GatewayTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CompanyTaxInfo
CREATE TABLE IF NOT EXISTS "food_ordering"."CompanyTaxInfo" (
    "id" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyNameEn" TEXT,
    "taxId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "branchNumber" TEXT NOT NULL DEFAULT '00000',
    "branchName" TEXT,
    "isHeadOffice" BOOLEAN NOT NULL DEFAULT true,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyTaxInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TaxInvoice
CREATE TABLE IF NOT EXISTS "food_ordering"."TaxInvoice" (
    "id" SERIAL NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "receiptNumber" TEXT,
    "buyerName" TEXT NOT NULL,
    "buyerTaxId" TEXT NOT NULL,
    "buyerAddress" TEXT NOT NULL,
    "buyerBranch" TEXT NOT NULL DEFAULT '00000',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "vatAmount" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "items" JSONB,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaxInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable: KDSStation
CREATE TABLE IF NOT EXISTS "food_ordering"."KDSStation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "categories" TEXT[],
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "alertTimeout" INTEGER NOT NULL DEFAULT 300,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KDSStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SystemSetting
CREATE TABLE IF NOT EXISTS "food_ordering"."SystemSetting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "branchId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "GatewayTransaction_transactionId_key" ON "food_ordering"."GatewayTransaction"("transactionId");
CREATE INDEX IF NOT EXISTS "GatewayTransaction_status_idx" ON "food_ordering"."GatewayTransaction"("status");
CREATE INDEX IF NOT EXISTS "GatewayTransaction_branchId_idx" ON "food_ordering"."GatewayTransaction"("branchId");
CREATE INDEX IF NOT EXISTS "CompanyTaxInfo_branchId_idx" ON "food_ordering"."CompanyTaxInfo"("branchId");
CREATE UNIQUE INDEX IF NOT EXISTS "TaxInvoice_invoiceNumber_key" ON "food_ordering"."TaxInvoice"("invoiceNumber");
CREATE INDEX IF NOT EXISTS "TaxInvoice_paymentId_idx" ON "food_ordering"."TaxInvoice"("paymentId");
CREATE INDEX IF NOT EXISTS "TaxInvoice_branchId_idx" ON "food_ordering"."TaxInvoice"("branchId");
CREATE INDEX IF NOT EXISTS "TaxInvoice_issuedAt_idx" ON "food_ordering"."TaxInvoice"("issuedAt");
CREATE INDEX IF NOT EXISTS "KDSStation_branchId_idx" ON "food_ordering"."KDSStation"("branchId");
CREATE UNIQUE INDEX IF NOT EXISTS "SystemSetting_key_key" ON "food_ordering"."SystemSetting"("key");
CREATE INDEX IF NOT EXISTS "SystemSetting_branchId_idx" ON "food_ordering"."SystemSetting"("branchId");
CREATE UNIQUE INDEX IF NOT EXISTS "Table_branchId_number_key" ON "food_ordering"."Table"("branchId", "number");
CREATE UNIQUE INDEX IF NOT EXISTS "TableStaffAssignment_branchId_tableNumber_userId_key" ON "food_ordering"."TableStaffAssignment"("branchId", "tableNumber", "userId");

-- AddForeignKey
ALTER TABLE "food_ordering"."TableStaffAssignment"
  ADD CONSTRAINT "TableStaffAssignment_branchId_tableNumber_fkey"
  FOREIGN KEY ("branchId", "tableNumber") REFERENCES "food_ordering"."Table"("branchId", "number") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "food_ordering"."GatewayTransaction"
  ADD CONSTRAINT "GatewayTransaction_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "food_ordering"."CompanyTaxInfo"
  ADD CONSTRAINT "CompanyTaxInfo_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "food_ordering"."TaxInvoice"
  ADD CONSTRAINT "TaxInvoice_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "food_ordering"."KDSStation"
  ADD CONSTRAINT "KDSStation_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "food_ordering"."SystemSetting"
  ADD CONSTRAINT "SystemSetting_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
