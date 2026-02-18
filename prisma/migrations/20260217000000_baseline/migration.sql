Loaded Prisma config from prisma.config.ts.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "food_ordering";

-- CreateEnum
CREATE TYPE "food_ordering"."MenuType" AS ENUM ('SINGLE', 'SET', 'GROUP');

-- CreateEnum
CREATE TYPE "food_ordering"."OrderStatus" AS ENUM ('PREPARING', 'COMPLETED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "food_ordering"."QueueStatus" AS ENUM ('WAITING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "food_ordering"."TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'BILLING', 'CLEANING');

-- CreateEnum
CREATE TYPE "food_ordering"."ServiceRequestType" AS ENUM ('STAFF', 'UTENSILS', 'PAYMENT');

-- CreateEnum
CREATE TYPE "food_ordering"."ServiceRequestStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "food_ordering"."UserRole" AS ENUM ('ADMIN', 'STAFF', 'CHEF');

-- CreateEnum
CREATE TYPE "food_ordering"."IngredientUnit" AS ENUM ('GRAM', 'KILOGRAM', 'MILLILITER', 'LITER', 'PIECE', 'TABLESPOON', 'TEASPOON', 'CUP');

-- CreateEnum
CREATE TYPE "food_ordering"."TransactionType" AS ENUM ('STOCK_IN', 'STOCK_OUT', 'ORDER_DEDUCTION', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "food_ordering"."ShiftStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "food_ordering"."PromotionType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'COUPON', 'HAPPY_HOUR');

-- CreateEnum
CREATE TYPE "food_ordering"."PromotionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "food_ordering"."PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'CREDIT_CARD');

-- CreateEnum
CREATE TYPE "food_ordering"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "food_ordering"."WebhookEvent" AS ENUM ('ORDER_CREATED', 'ORDER_STATUS_CHANGED', 'ORDER_CANCELLED', 'PAYMENT_COMPLETED', 'PAYMENT_REFUNDED', 'QUEUE_CREATED', 'QUEUE_STATUS_CHANGED', 'MEMBER_REGISTERED', 'SHIFT_OPENED', 'SHIFT_CLOSED', 'LOW_STOCK_ALERT');

-- CreateEnum
CREATE TYPE "food_ordering"."AuditAction" AS ENUM ('ORDER_CREATED', 'ORDER_STATUS_CHANGED', 'ORDER_CANCELLED', 'ORDER_ITEM_STATUS_CHANGED', 'ORDER_SPLIT', 'ORDER_TABLE_TRANSFERRED', 'PAYMENT_CREATED', 'PAYMENT_MERGED', 'PAYMENT_REFUNDED');

-- CreateEnum
CREATE TYPE "food_ordering"."AuditEntityType" AS ENUM ('ORDER', 'ORDER_ITEM', 'PAYMENT');

-- CreateTable
CREATE TABLE "food_ordering"."Branch" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."MenuItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "image" TEXT,
    "description" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "type" "food_ordering"."MenuType" NOT NULL DEFAULT 'SINGLE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."SetComponent" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "menuItemId" INTEGER NOT NULL,

    CONSTRAINT "SetComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."AddOn" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."AddOnGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddOnGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."AddOnGroupItem" (
    "id" SERIAL NOT NULL,
    "addOnId" INTEGER NOT NULL,
    "addOnGroupId" INTEGER NOT NULL,

    CONSTRAINT "AddOnGroupItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."MenuItemAddOn" (
    "id" SERIAL NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "addOnId" INTEGER NOT NULL,

    CONSTRAINT "MenuItemAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."MenuItemAddOnGroup" (
    "id" SERIAL NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "addOnGroupId" INTEGER NOT NULL,

    CONSTRAINT "MenuItemAddOnGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."NestedMenuOption" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "image" TEXT,
    "type" TEXT NOT NULL DEFAULT 'single',
    "requireChildSelection" BOOLEAN NOT NULL DEFAULT false,
    "minChildSelections" INTEGER,
    "maxChildSelections" INTEGER,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NestedMenuOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."NestedMenuConfig" (
    "id" SERIAL NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "requireSelection" BOOLEAN NOT NULL DEFAULT true,
    "minSelections" INTEGER NOT NULL DEFAULT 1,
    "maxSelections" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "NestedMenuConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."NestedMenuConfigOption" (
    "id" SERIAL NOT NULL,
    "configId" INTEGER NOT NULL,
    "nestedOptionId" INTEGER NOT NULL,

    CONSTRAINT "NestedMenuConfigOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."Order" (
    "id" SERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "serviceCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "food_ordering"."OrderStatus" NOT NULL DEFAULT 'PREPARING',
    "tableNumber" TEXT,
    "sessionId" INTEGER,
    "splitFromOrderId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."OrderItem" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,
    "specialInstructions" TEXT,
    "diningOption" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'preparing',
    "selectedAddOns" JSONB,
    "selectedAddOnGroups" JSONB,
    "selectedNestedOptions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."QueueTicket" (
    "id" SERIAL NOT NULL,
    "queueId" TEXT NOT NULL,
    "queueNumber" INTEGER NOT NULL,
    "orderType" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "status" "food_ordering"."QueueStatus" NOT NULL DEFAULT 'WAITING',
    "estimatedTime" INTEGER,
    "customerName" TEXT,
    "memberId" TEXT,
    "paymentMethod" TEXT,
    "items" JSONB NOT NULL,
    "calledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueueTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."Table" (
    "id" SERIAL NOT NULL,
    "number" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "food_ordering"."TableStatus" NOT NULL DEFAULT 'AVAILABLE',
    "size" TEXT NOT NULL,
    "shape" TEXT NOT NULL DEFAULT 'square',
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionY" DOUBLE PRECISION NOT NULL,
    "currentGuests" INTEGER,
    "mergedWith" INTEGER[],
    "zone" TEXT,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."ServiceRequest" (
    "id" SERIAL NOT NULL,
    "requestId" TEXT NOT NULL,
    "type" "food_ordering"."ServiceRequestType" NOT NULL,
    "tableNumber" TEXT,
    "details" TEXT,
    "items" TEXT[],
    "status" "food_ordering"."ServiceRequestStatus" NOT NULL DEFAULT 'PENDING',
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."Member" (
    "id" SERIAL NOT NULL,
    "memberId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'bronze',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "pin" TEXT,
    "role" "food_ordering"."UserRole" NOT NULL DEFAULT 'STAFF',
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."TableStaffAssignment" (
    "id" SERIAL NOT NULL,
    "tableNumber" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TableStaffAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."Ingredient" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "unit" "food_ordering"."IngredientUnit" NOT NULL,
    "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costPerUnit" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."MenuItemIngredient" (
    "id" SERIAL NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantityUsed" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MenuItemIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."InventoryTransaction" (
    "id" SERIAL NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "type" "food_ordering"."TransactionType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "previousStock" DOUBLE PRECISION NOT NULL,
    "newStock" DOUBLE PRECISION NOT NULL,
    "orderId" TEXT,
    "notes" TEXT,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."Payment" (
    "id" SERIAL NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "paymentMethod" "food_ordering"."PaymentMethod" NOT NULL,
    "paymentStatus" "food_ordering"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "serviceCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountPoints" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "changeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "memberId" TEXT,
    "memberName" TEXT,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "cashierName" TEXT,
    "note" TEXT,
    "paidAt" TIMESTAMP(3),
    "branchId" INTEGER,
    "shiftId" INTEGER,
    "promotionId" INTEGER,
    "promotionDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "promotionName" TEXT,
    "couponCode" TEXT,
    "mergedOrderIds" INTEGER[],
    "splitPayments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."Shift" (
    "id" SERIAL NOT NULL,
    "shiftNumber" TEXT NOT NULL,
    "status" "food_ordering"."ShiftStatus" NOT NULL DEFAULT 'OPEN',
    "userId" INTEGER NOT NULL,
    "cashierName" TEXT NOT NULL,
    "branchId" INTEGER,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "openingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closingAmount" DOUBLE PRECISION,
    "expectedCashAmount" DOUBLE PRECISION,
    "cashDifference" DOUBLE PRECISION,
    "totalRevenue" DOUBLE PRECISION,
    "totalOrders" INTEGER,
    "cashTotal" DOUBLE PRECISION,
    "transferTotal" DOUBLE PRECISION,
    "creditCardTotal" DOUBLE PRECISION,
    "openingCashCount" JSONB,
    "closingCashCount" JSONB,
    "notes" TEXT,
    "closingNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."Promotion" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "food_ordering"."PromotionType" NOT NULL,
    "status" "food_ordering"."PromotionStatus" NOT NULL DEFAULT 'ACTIVE',
    "discountValue" DOUBLE PRECISION NOT NULL,
    "maxDiscount" DOUBLE PRECISION,
    "couponCode" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "minOrderAmount" DOUBLE PRECISION,
    "categories" TEXT[],
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."WebhookEndpoint" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" "food_ordering"."WebhookEvent"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "branchId" INTEGER,
    "headers" JSONB,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."WebhookDelivery" (
    "id" SERIAL NOT NULL,
    "webhookId" INTEGER NOT NULL,
    "event" "food_ordering"."WebhookEvent" NOT NULL,
    "payload" JSONB NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "error" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."TableSession" (
    "id" SERIAL NOT NULL,
    "tableId" INTEGER NOT NULL,
    "openedBy" TEXT NOT NULL,
    "customerCount" INTEGER NOT NULL DEFAULT 1,
    "customerGender" TEXT,
    "customerNationality" TEXT,
    "orderType" TEXT NOT NULL DEFAULT 'dine_in',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "branchId" INTEGER,

    CONSTRAINT "TableSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ordering"."AuditLog" (
    "id" SERIAL NOT NULL,
    "action" "food_ordering"."AuditAction" NOT NULL,
    "entityType" "food_ordering"."AuditEntityType" NOT NULL,
    "entityId" INTEGER NOT NULL,
    "entityRef" TEXT,
    "performedBy" TEXT,
    "branchId" INTEGER,
    "oldValues" JSONB,
    "newValues" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "food_ordering"."Branch"("code");

-- CreateIndex
CREATE INDEX "MenuItem_branchId_idx" ON "food_ordering"."MenuItem"("branchId");

-- CreateIndex
CREATE INDEX "AddOn_branchId_idx" ON "food_ordering"."AddOn"("branchId");

-- CreateIndex
CREATE INDEX "AddOnGroup_branchId_idx" ON "food_ordering"."AddOnGroup"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "AddOnGroupItem_addOnId_addOnGroupId_key" ON "food_ordering"."AddOnGroupItem"("addOnId", "addOnGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemAddOn_menuItemId_addOnId_key" ON "food_ordering"."MenuItemAddOn"("menuItemId", "addOnId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemAddOnGroup_menuItemId_addOnGroupId_key" ON "food_ordering"."MenuItemAddOnGroup"("menuItemId", "addOnGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "NestedMenuConfig_menuItemId_key" ON "food_ordering"."NestedMenuConfig"("menuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "NestedMenuConfigOption_configId_nestedOptionId_key" ON "food_ordering"."NestedMenuConfigOption"("configId", "nestedOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderId_key" ON "food_ordering"."Order"("orderId");

-- CreateIndex
CREATE INDEX "Order_branchId_idx" ON "food_ordering"."Order"("branchId");

-- CreateIndex
CREATE INDEX "Order_splitFromOrderId_idx" ON "food_ordering"."Order"("splitFromOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "QueueTicket_queueId_key" ON "food_ordering"."QueueTicket"("queueId");

-- CreateIndex
CREATE INDEX "QueueTicket_branchId_idx" ON "food_ordering"."QueueTicket"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Table_number_key" ON "food_ordering"."Table"("number");

-- CreateIndex
CREATE INDEX "Table_branchId_idx" ON "food_ordering"."Table"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_requestId_key" ON "food_ordering"."ServiceRequest"("requestId");

-- CreateIndex
CREATE INDEX "ServiceRequest_branchId_idx" ON "food_ordering"."ServiceRequest"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_memberId_key" ON "food_ordering"."Member"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "food_ordering"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_pin_key" ON "food_ordering"."User"("pin");

-- CreateIndex
CREATE INDEX "User_branchId_idx" ON "food_ordering"."User"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "TableStaffAssignment_tableNumber_userId_key" ON "food_ordering"."TableStaffAssignment"("tableNumber", "userId");

-- CreateIndex
CREATE INDEX "Ingredient_branchId_idx" ON "food_ordering"."Ingredient"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_branchId_key" ON "food_ordering"."Ingredient"("name", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemIngredient_menuItemId_ingredientId_key" ON "food_ordering"."MenuItemIngredient"("menuItemId", "ingredientId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_ingredientId_idx" ON "food_ordering"."InventoryTransaction"("ingredientId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_type_idx" ON "food_ordering"."InventoryTransaction"("type");

-- CreateIndex
CREATE INDEX "InventoryTransaction_createdAt_idx" ON "food_ordering"."InventoryTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "InventoryTransaction_orderId_idx" ON "food_ordering"."InventoryTransaction"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_receiptNumber_key" ON "food_ordering"."Payment"("receiptNumber");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "food_ordering"."Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_paymentStatus_idx" ON "food_ordering"."Payment"("paymentStatus");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "food_ordering"."Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_branchId_idx" ON "food_ordering"."Payment"("branchId");

-- CreateIndex
CREATE INDEX "Payment_shiftId_idx" ON "food_ordering"."Payment"("shiftId");

-- CreateIndex
CREATE INDEX "Payment_promotionId_idx" ON "food_ordering"."Payment"("promotionId");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_shiftNumber_key" ON "food_ordering"."Shift"("shiftNumber");

-- CreateIndex
CREATE INDEX "Shift_branchId_idx" ON "food_ordering"."Shift"("branchId");

-- CreateIndex
CREATE INDEX "Shift_status_idx" ON "food_ordering"."Shift"("status");

-- CreateIndex
CREATE INDEX "Shift_openedAt_idx" ON "food_ordering"."Shift"("openedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_couponCode_key" ON "food_ordering"."Promotion"("couponCode");

-- CreateIndex
CREATE INDEX "Promotion_branchId_idx" ON "food_ordering"."Promotion"("branchId");

-- CreateIndex
CREATE INDEX "Promotion_type_idx" ON "food_ordering"."Promotion"("type");

-- CreateIndex
CREATE INDEX "Promotion_status_idx" ON "food_ordering"."Promotion"("status");

-- CreateIndex
CREATE INDEX "Promotion_startDate_endDate_idx" ON "food_ordering"."Promotion"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_branchId_idx" ON "food_ordering"."WebhookEndpoint"("branchId");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_isActive_idx" ON "food_ordering"."WebhookEndpoint"("isActive");

-- CreateIndex
CREATE INDEX "WebhookDelivery_webhookId_idx" ON "food_ordering"."WebhookDelivery"("webhookId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_event_idx" ON "food_ordering"."WebhookDelivery"("event");

-- CreateIndex
CREATE INDEX "WebhookDelivery_createdAt_idx" ON "food_ordering"."WebhookDelivery"("createdAt");

-- CreateIndex
CREATE INDEX "WebhookDelivery_success_idx" ON "food_ordering"."WebhookDelivery"("success");

-- CreateIndex
CREATE INDEX "TableSession_tableId_idx" ON "food_ordering"."TableSession"("tableId");

-- CreateIndex
CREATE INDEX "TableSession_status_idx" ON "food_ordering"."TableSession"("status");

-- CreateIndex
CREATE INDEX "TableSession_branchId_idx" ON "food_ordering"."TableSession"("branchId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "food_ordering"."AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "food_ordering"."AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_performedBy_idx" ON "food_ordering"."AuditLog"("performedBy");

-- CreateIndex
CREATE INDEX "AuditLog_branchId_idx" ON "food_ordering"."AuditLog"("branchId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "food_ordering"."AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "food_ordering"."MenuItem" ADD CONSTRAINT "MenuItem_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."SetComponent" ADD CONSTRAINT "SetComponent_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "food_ordering"."MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."AddOn" ADD CONSTRAINT "AddOn_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."AddOnGroup" ADD CONSTRAINT "AddOnGroup_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."AddOnGroupItem" ADD CONSTRAINT "AddOnGroupItem_addOnGroupId_fkey" FOREIGN KEY ("addOnGroupId") REFERENCES "food_ordering"."AddOnGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."AddOnGroupItem" ADD CONSTRAINT "AddOnGroupItem_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "food_ordering"."AddOn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."MenuItemAddOn" ADD CONSTRAINT "MenuItemAddOn_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "food_ordering"."AddOn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."MenuItemAddOn" ADD CONSTRAINT "MenuItemAddOn_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "food_ordering"."MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."MenuItemAddOnGroup" ADD CONSTRAINT "MenuItemAddOnGroup_addOnGroupId_fkey" FOREIGN KEY ("addOnGroupId") REFERENCES "food_ordering"."AddOnGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."MenuItemAddOnGroup" ADD CONSTRAINT "MenuItemAddOnGroup_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "food_ordering"."MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."NestedMenuOption" ADD CONSTRAINT "NestedMenuOption_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "food_ordering"."NestedMenuOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."NestedMenuConfig" ADD CONSTRAINT "NestedMenuConfig_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "food_ordering"."MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."NestedMenuConfigOption" ADD CONSTRAINT "NestedMenuConfigOption_configId_fkey" FOREIGN KEY ("configId") REFERENCES "food_ordering"."NestedMenuConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."NestedMenuConfigOption" ADD CONSTRAINT "NestedMenuConfigOption_nestedOptionId_fkey" FOREIGN KEY ("nestedOptionId") REFERENCES "food_ordering"."NestedMenuOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."Order" ADD CONSTRAINT "Order_splitFromOrderId_fkey" FOREIGN KEY ("splitFromOrderId") REFERENCES "food_ordering"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."Order" ADD CONSTRAINT "Order_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."OrderItem" ADD CONSTRAINT "OrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "food_ordering"."MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "food_ordering"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."QueueTicket" ADD CONSTRAINT "QueueTicket_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."Table" ADD CONSTRAINT "Table_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."ServiceRequest" ADD CONSTRAINT "ServiceRequest_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."TableStaffAssignment" ADD CONSTRAINT "TableStaffAssignment_tableNumber_fkey" FOREIGN KEY ("tableNumber") REFERENCES "food_ordering"."Table"("number") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."TableStaffAssignment" ADD CONSTRAINT "TableStaffAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "food_ordering"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."Ingredient" ADD CONSTRAINT "Ingredient_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."MenuItemIngredient" ADD CONSTRAINT "MenuItemIngredient_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "food_ordering"."MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."MenuItemIngredient" ADD CONSTRAINT "MenuItemIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "food_ordering"."Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "food_ordering"."Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "food_ordering"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."Payment" ADD CONSTRAINT "Payment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."Payment" ADD CONSTRAINT "Payment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "food_ordering"."Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."Payment" ADD CONSTRAINT "Payment_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "food_ordering"."Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."Shift" ADD CONSTRAINT "Shift_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."Promotion" ADD CONSTRAINT "Promotion_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "food_ordering"."WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."TableSession" ADD CONSTRAINT "TableSession_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "food_ordering"."Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ordering"."TableSession" ADD CONSTRAINT "TableSession_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "food_ordering"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

