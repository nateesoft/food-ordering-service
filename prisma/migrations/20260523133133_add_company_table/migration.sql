-- CreateTable
CREATE TABLE "food_ordering"."Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "website" TEXT,
    "description" TEXT,
    "businessType" TEXT,
    "consoleUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_consoleUserId_key" ON "food_ordering"."Company"("consoleUserId");

-- CreateIndex
CREATE INDEX "Company_consoleUserId_idx" ON "food_ordering"."Company"("consoleUserId");

-- AddForeignKey
ALTER TABLE "food_ordering"."Company" ADD CONSTRAINT "Company_consoleUserId_fkey" FOREIGN KEY ("consoleUserId") REFERENCES "food_ordering"."ConsoleUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
