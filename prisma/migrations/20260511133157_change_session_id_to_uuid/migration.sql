-- AlterTable
ALTER TABLE "food_ordering"."CompanyTaxInfo" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "food_ordering"."GatewayTransaction" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "food_ordering"."KDSStation" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "food_ordering"."MenuItem" ALTER COLUMN "code" DROP DEFAULT;

-- AlterTable
ALTER TABLE "food_ordering"."Order" ALTER COLUMN "sessionId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "food_ordering"."SystemSetting" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "food_ordering"."TableStaffAssignment" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "food_ordering"."TaxInvoice" ALTER COLUMN "updatedAt" DROP DEFAULT;
