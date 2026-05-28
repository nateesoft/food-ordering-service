-- CreateEnum
CREATE TYPE "food_ordering"."ConsolePlan" AS ENUM ('FREE', 'BASIC', 'PRO');

-- AlterTable
ALTER TABLE "food_ordering"."ConsoleUser" ADD COLUMN     "plan" "food_ordering"."ConsolePlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "planUpdatedAt" TIMESTAMP(3);
