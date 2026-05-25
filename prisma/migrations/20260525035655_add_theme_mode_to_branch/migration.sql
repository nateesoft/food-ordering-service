-- CreateEnum
CREATE TYPE "food_ordering"."ThemeMode" AS ENUM ('LIGHT', 'DARK');

-- AlterTable
ALTER TABLE "food_ordering"."Branch" ADD COLUMN     "themeMode" "food_ordering"."ThemeMode" NOT NULL DEFAULT 'LIGHT';
