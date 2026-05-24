-- AlterTable: change Branch.id from SERIAL (integer) to TEXT (UUID)
-- and update all branchId columns in every table that references Branch

-- ===================================================================
-- STEP 1: Add new UUID column to Branch
-- ===================================================================
ALTER TABLE "food_ordering"."Branch" ADD COLUMN "new_id" TEXT;
UPDATE "food_ordering"."Branch" SET "new_id" = gen_random_uuid()::TEXT;
ALTER TABLE "food_ordering"."Branch" ALTER COLUMN "new_id" SET NOT NULL;

-- ===================================================================
-- STEP 2: Add new_branchId TEXT columns to every referencing table
-- ===================================================================
ALTER TABLE "food_ordering"."MenuItem"             ADD COLUMN "new_branchId" TEXT;
ALTER TABLE "food_ordering"."AddOn"                ADD COLUMN "new_branchId" TEXT;
ALTER TABLE "food_ordering"."AddOnGroup"           ADD COLUMN "new_branchId" TEXT;
ALTER TABLE "food_ordering"."Order"                ADD COLUMN "new_branchId" TEXT;
ALTER TABLE "food_ordering"."QueueTicket"          ADD COLUMN "new_branchId" TEXT;
ALTER TABLE "food_ordering"."Table"                ADD COLUMN "new_branchId" TEXT;
ALTER TABLE "food_ordering"."TableStaffAssignment" ADD COLUMN "new_branchId" TEXT;
ALTER TABLE "food_ordering"."ServiceRequest"       ADD COLUMN "new_branchId" TEXT;
ALTER TABLE "food_ordering"."User"                 ADD COLUMN "new_branchId" TEXT;
ALTER TABLE "food_ordering"."Ingredient"           ADD COLUMN "new_branchId" TEXT;
ALTER TABLE "food_ordering"."Payment"              ADD COLUMN "new_branchId" TEXT;
ALTER TABLE "food_ordering"."Shift"                ADD COLUMN "new_branchId" TEXT;
ALTER TABLE "food_ordering"."Promotion"            ADD COLUMN "new_branchId" TEXT;
ALTER TABLE "food_ordering"."WebhookEndpoint"      ADD COLUMN "new_branchId" TEXT;
ALTER TABLE "food_ordering"."TableSession"         ADD COLUMN "new_branchId" TEXT;
ALTER TABLE "food_ordering"."AuditLog"             ADD COLUMN "new_branchId" TEXT;
ALTER TABLE "food_ordering"."GatewayTransaction"   ADD COLUMN "new_branchId" TEXT;
ALTER TABLE "food_ordering"."CompanyTaxInfo"       ADD COLUMN "new_branchId" TEXT;
ALTER TABLE "food_ordering"."TaxInvoice"           ADD COLUMN "new_branchId" TEXT;
ALTER TABLE "food_ordering"."KDSStation"           ADD COLUMN "new_branchId" TEXT;
ALTER TABLE "food_ordering"."SystemSetting"        ADD COLUMN "new_branchId" TEXT;
ALTER TABLE "food_ordering"."MqEventLog"           ADD COLUMN "new_branchId" TEXT;

-- ===================================================================
-- STEP 3: Populate new_branchId from Branch mapping (old id → new UUID)
-- ===================================================================
UPDATE "food_ordering"."MenuItem"             t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";
UPDATE "food_ordering"."AddOn"                t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";
UPDATE "food_ordering"."AddOnGroup"           t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";
UPDATE "food_ordering"."Order"                t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";
UPDATE "food_ordering"."QueueTicket"          t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";
UPDATE "food_ordering"."Table"                t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";
UPDATE "food_ordering"."TableStaffAssignment" t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";
UPDATE "food_ordering"."ServiceRequest"       t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";
UPDATE "food_ordering"."User"                 t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";
UPDATE "food_ordering"."Ingredient"           t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";
UPDATE "food_ordering"."Payment"              t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";
UPDATE "food_ordering"."Shift"                t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";
UPDATE "food_ordering"."Promotion"            t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";
UPDATE "food_ordering"."WebhookEndpoint"      t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";
UPDATE "food_ordering"."TableSession"         t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";
UPDATE "food_ordering"."AuditLog"             t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";
UPDATE "food_ordering"."GatewayTransaction"   t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";
UPDATE "food_ordering"."CompanyTaxInfo"       t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";
UPDATE "food_ordering"."TaxInvoice"           t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";
UPDATE "food_ordering"."KDSStation"           t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";
UPDATE "food_ordering"."SystemSetting"        t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";
UPDATE "food_ordering"."MqEventLog"           t SET "new_branchId" = b."new_id" FROM "food_ordering"."Branch" b WHERE t."branchId" = b."id";

-- ===================================================================
-- STEP 4: Drop composite unique constraints and FK constraints
-- ===================================================================

-- Drop FK from TableStaffAssignment to Table FIRST (it depends on Table_branchId_number_key index)
ALTER TABLE "food_ordering"."TableStaffAssignment" DROP CONSTRAINT "TableStaffAssignment_branchId_tableNumber_fkey";

-- Now safe to drop composite unique indexes
DROP INDEX IF EXISTS "food_ordering"."Table_branchId_number_key";
DROP INDEX IF EXISTS "food_ordering"."TableStaffAssignment_branchId_tableNumber_userId_key";
DROP INDEX IF EXISTS "food_ordering"."Ingredient_name_branchId_key";

-- FKs from child tables to Branch.id
ALTER TABLE "food_ordering"."MenuItem"           DROP CONSTRAINT "MenuItem_branchId_fkey";
ALTER TABLE "food_ordering"."AddOn"              DROP CONSTRAINT "AddOn_branchId_fkey";
ALTER TABLE "food_ordering"."AddOnGroup"         DROP CONSTRAINT "AddOnGroup_branchId_fkey";
ALTER TABLE "food_ordering"."Order"              DROP CONSTRAINT "Order_branchId_fkey";
ALTER TABLE "food_ordering"."QueueTicket"        DROP CONSTRAINT "QueueTicket_branchId_fkey";
ALTER TABLE "food_ordering"."Table"              DROP CONSTRAINT "Table_branchId_fkey";
ALTER TABLE "food_ordering"."ServiceRequest"     DROP CONSTRAINT "ServiceRequest_branchId_fkey";
ALTER TABLE "food_ordering"."User"               DROP CONSTRAINT "User_branchId_fkey";
ALTER TABLE "food_ordering"."Ingredient"         DROP CONSTRAINT "Ingredient_branchId_fkey";
ALTER TABLE "food_ordering"."Payment"            DROP CONSTRAINT "Payment_branchId_fkey";
ALTER TABLE "food_ordering"."Shift"              DROP CONSTRAINT "Shift_branchId_fkey";
ALTER TABLE "food_ordering"."Promotion"          DROP CONSTRAINT "Promotion_branchId_fkey";
ALTER TABLE "food_ordering"."WebhookEndpoint"    DROP CONSTRAINT "WebhookEndpoint_branchId_fkey";
ALTER TABLE "food_ordering"."TableSession"       DROP CONSTRAINT "TableSession_branchId_fkey";
ALTER TABLE "food_ordering"."GatewayTransaction" DROP CONSTRAINT "GatewayTransaction_branchId_fkey";
ALTER TABLE "food_ordering"."CompanyTaxInfo"     DROP CONSTRAINT "CompanyTaxInfo_branchId_fkey";
ALTER TABLE "food_ordering"."TaxInvoice"         DROP CONSTRAINT "TaxInvoice_branchId_fkey";
ALTER TABLE "food_ordering"."KDSStation"         DROP CONSTRAINT "KDSStation_branchId_fkey";
ALTER TABLE "food_ordering"."SystemSetting"      DROP CONSTRAINT "SystemSetting_branchId_fkey";

-- ===================================================================
-- STEP 5: Swap Branch.id (drop serial int, install UUID text)
-- ===================================================================
ALTER TABLE "food_ordering"."Branch" DROP CONSTRAINT "Branch_pkey";
ALTER TABLE "food_ordering"."Branch" DROP COLUMN "id";
ALTER TABLE "food_ordering"."Branch" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "food_ordering"."Branch" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::TEXT;
ALTER TABLE "food_ordering"."Branch" ADD CONSTRAINT "Branch_pkey" PRIMARY KEY ("id");

-- ===================================================================
-- STEP 6: Swap branchId columns in all referencing tables
-- ===================================================================
ALTER TABLE "food_ordering"."MenuItem"             DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."MenuItem"             RENAME COLUMN "new_branchId" TO "branchId";

ALTER TABLE "food_ordering"."AddOn"                DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."AddOn"                RENAME COLUMN "new_branchId" TO "branchId";

ALTER TABLE "food_ordering"."AddOnGroup"           DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."AddOnGroup"           RENAME COLUMN "new_branchId" TO "branchId";

ALTER TABLE "food_ordering"."Order"                DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."Order"                RENAME COLUMN "new_branchId" TO "branchId";

ALTER TABLE "food_ordering"."QueueTicket"          DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."QueueTicket"          RENAME COLUMN "new_branchId" TO "branchId";

ALTER TABLE "food_ordering"."Table"                DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."Table"                RENAME COLUMN "new_branchId" TO "branchId";

ALTER TABLE "food_ordering"."TableStaffAssignment" DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."TableStaffAssignment" RENAME COLUMN "new_branchId" TO "branchId";

ALTER TABLE "food_ordering"."ServiceRequest"       DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."ServiceRequest"       RENAME COLUMN "new_branchId" TO "branchId";

ALTER TABLE "food_ordering"."User"                 DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."User"                 RENAME COLUMN "new_branchId" TO "branchId";

ALTER TABLE "food_ordering"."Ingredient"           DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."Ingredient"           RENAME COLUMN "new_branchId" TO "branchId";

ALTER TABLE "food_ordering"."Payment"              DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."Payment"              RENAME COLUMN "new_branchId" TO "branchId";

ALTER TABLE "food_ordering"."Shift"                DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."Shift"                RENAME COLUMN "new_branchId" TO "branchId";

ALTER TABLE "food_ordering"."Promotion"            DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."Promotion"            RENAME COLUMN "new_branchId" TO "branchId";

ALTER TABLE "food_ordering"."WebhookEndpoint"      DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."WebhookEndpoint"      RENAME COLUMN "new_branchId" TO "branchId";

ALTER TABLE "food_ordering"."TableSession"         DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."TableSession"         RENAME COLUMN "new_branchId" TO "branchId";

ALTER TABLE "food_ordering"."AuditLog"             DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."AuditLog"             RENAME COLUMN "new_branchId" TO "branchId";

ALTER TABLE "food_ordering"."GatewayTransaction"   DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."GatewayTransaction"   RENAME COLUMN "new_branchId" TO "branchId";

ALTER TABLE "food_ordering"."CompanyTaxInfo"       DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."CompanyTaxInfo"       RENAME COLUMN "new_branchId" TO "branchId";

ALTER TABLE "food_ordering"."TaxInvoice"           DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."TaxInvoice"           RENAME COLUMN "new_branchId" TO "branchId";

ALTER TABLE "food_ordering"."KDSStation"           DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."KDSStation"           RENAME COLUMN "new_branchId" TO "branchId";

ALTER TABLE "food_ordering"."SystemSetting"        DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."SystemSetting"        RENAME COLUMN "new_branchId" TO "branchId";

ALTER TABLE "food_ordering"."MqEventLog"           DROP COLUMN "branchId";
ALTER TABLE "food_ordering"."MqEventLog"           RENAME COLUMN "new_branchId" TO "branchId";

-- ===================================================================
-- STEP 7: Recreate unique indexes first (some FKs depend on them)
-- ===================================================================
CREATE UNIQUE INDEX "Table_branchId_number_key"                          ON "food_ordering"."Table"                ("branchId", "number");
CREATE UNIQUE INDEX "TableStaffAssignment_branchId_tableNumber_userId_key" ON "food_ordering"."TableStaffAssignment" ("branchId", "tableNumber", "userId");
CREATE UNIQUE INDEX "Ingredient_name_branchId_key"                        ON "food_ordering"."Ingredient"           ("name", "branchId");

-- ===================================================================
-- STEP 8: Recreate FK constraints (nullable → ON DELETE SET NULL)
-- ===================================================================
ALTER TABLE "food_ordering"."MenuItem"           ADD CONSTRAINT "MenuItem_branchId_fkey"           FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_ordering"."AddOn"              ADD CONSTRAINT "AddOn_branchId_fkey"              FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_ordering"."AddOnGroup"         ADD CONSTRAINT "AddOnGroup_branchId_fkey"         FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_ordering"."Order"              ADD CONSTRAINT "Order_branchId_fkey"              FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_ordering"."QueueTicket"        ADD CONSTRAINT "QueueTicket_branchId_fkey"        FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_ordering"."Table"              ADD CONSTRAINT "Table_branchId_fkey"              FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_ordering"."ServiceRequest"     ADD CONSTRAINT "ServiceRequest_branchId_fkey"     FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_ordering"."User"               ADD CONSTRAINT "User_branchId_fkey"               FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_ordering"."Ingredient"         ADD CONSTRAINT "Ingredient_branchId_fkey"         FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_ordering"."Payment"            ADD CONSTRAINT "Payment_branchId_fkey"            FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_ordering"."Shift"              ADD CONSTRAINT "Shift_branchId_fkey"              FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_ordering"."Promotion"          ADD CONSTRAINT "Promotion_branchId_fkey"          FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_ordering"."WebhookEndpoint"    ADD CONSTRAINT "WebhookEndpoint_branchId_fkey"    FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_ordering"."TableSession"       ADD CONSTRAINT "TableSession_branchId_fkey"       FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_ordering"."GatewayTransaction" ADD CONSTRAINT "GatewayTransaction_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_ordering"."CompanyTaxInfo"     ADD CONSTRAINT "CompanyTaxInfo_branchId_fkey"     FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_ordering"."TaxInvoice"         ADD CONSTRAINT "TaxInvoice_branchId_fkey"         FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_ordering"."KDSStation"         ADD CONSTRAINT "KDSStation_branchId_fkey"         FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_ordering"."SystemSetting"      ADD CONSTRAINT "SystemSetting_branchId_fkey"      FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Composite FK: TableStaffAssignment(branchId, tableNumber) → Table(branchId, number)
-- Must be created after Table_branchId_number_key unique index exists
ALTER TABLE "food_ordering"."TableStaffAssignment" ADD CONSTRAINT "TableStaffAssignment_branchId_tableNumber_fkey"
  FOREIGN KEY ("branchId", "tableNumber") REFERENCES "food_ordering"."Table"("branchId", "number") ON DELETE CASCADE ON UPDATE CASCADE;

-- ===================================================================
-- STEP 9: Recreate indexes on branchId columns
-- ===================================================================
CREATE INDEX "MenuItem_branchId_idx"           ON "food_ordering"."MenuItem"           ("branchId");
CREATE INDEX "AddOn_branchId_idx"              ON "food_ordering"."AddOn"              ("branchId");
CREATE INDEX "AddOnGroup_branchId_idx"         ON "food_ordering"."AddOnGroup"         ("branchId");
CREATE INDEX "Order_branchId_idx"              ON "food_ordering"."Order"              ("branchId");
CREATE INDEX "QueueTicket_branchId_idx"        ON "food_ordering"."QueueTicket"        ("branchId");
CREATE INDEX "Table_branchId_idx"              ON "food_ordering"."Table"              ("branchId");
CREATE INDEX "ServiceRequest_branchId_idx"     ON "food_ordering"."ServiceRequest"     ("branchId");
CREATE INDEX "User_branchId_idx"               ON "food_ordering"."User"               ("branchId");
CREATE INDEX "Ingredient_branchId_idx"         ON "food_ordering"."Ingredient"         ("branchId");
CREATE INDEX "Payment_branchId_idx"            ON "food_ordering"."Payment"            ("branchId");
CREATE INDEX "Shift_branchId_idx"              ON "food_ordering"."Shift"              ("branchId");
CREATE INDEX "Promotion_branchId_idx"          ON "food_ordering"."Promotion"          ("branchId");
CREATE INDEX "WebhookEndpoint_branchId_idx"    ON "food_ordering"."WebhookEndpoint"    ("branchId");
CREATE INDEX "TableSession_branchId_idx"       ON "food_ordering"."TableSession"       ("branchId");
CREATE INDEX "AuditLog_branchId_idx"           ON "food_ordering"."AuditLog"           ("branchId");
CREATE INDEX "GatewayTransaction_branchId_idx" ON "food_ordering"."GatewayTransaction" ("branchId");
CREATE INDEX "CompanyTaxInfo_branchId_idx"     ON "food_ordering"."CompanyTaxInfo"     ("branchId");
CREATE INDEX "TaxInvoice_branchId_idx"         ON "food_ordering"."TaxInvoice"         ("branchId");
CREATE INDEX "KDSStation_branchId_idx"         ON "food_ordering"."KDSStation"         ("branchId");
CREATE INDEX "SystemSetting_branchId_idx"      ON "food_ordering"."SystemSetting"      ("branchId");
CREATE INDEX "MqEventLog_branchId_idx"         ON "food_ordering"."MqEventLog"         ("branchId");
