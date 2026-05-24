-- CreateTable
CREATE TABLE "food_ordering"."MenuCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MenuCategory_branchId_idx" ON "food_ordering"."MenuCategory"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuCategory_name_branchId_key" ON "food_ordering"."MenuCategory"("name", "branchId");

-- AddForeignKey
ALTER TABLE "food_ordering"."MenuCategory" ADD CONSTRAINT "MenuCategory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
