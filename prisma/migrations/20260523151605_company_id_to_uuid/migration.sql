-- AlterTable: change Company.id from SERIAL (integer) to TEXT (UUID)

-- Step 1: Drop primary key constraint
ALTER TABLE "food_ordering"."Company" DROP CONSTRAINT "Company_pkey";

-- Step 2: Add a temporary UUID column
ALTER TABLE "food_ordering"."Company" ADD COLUMN "new_id" TEXT;

-- Step 3: Populate existing rows with new UUIDs
UPDATE "food_ordering"."Company" SET "new_id" = gen_random_uuid()::TEXT;

-- Step 4: Make it NOT NULL
ALTER TABLE "food_ordering"."Company" ALTER COLUMN "new_id" SET NOT NULL;

-- Step 5: Drop old integer id column (also drops the sequence)
ALTER TABLE "food_ordering"."Company" DROP COLUMN "id";

-- Step 6: Rename new column to id
ALTER TABLE "food_ordering"."Company" RENAME COLUMN "new_id" TO "id";

-- Step 7: Set default for future inserts
ALTER TABLE "food_ordering"."Company" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::TEXT;

-- Step 8: Re-add primary key
ALTER TABLE "food_ordering"."Company" ADD CONSTRAINT "Company_pkey" PRIMARY KEY ("id");
