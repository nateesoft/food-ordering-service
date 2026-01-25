-- CreateEnum
CREATE TYPE "MenuType" AS ENUM ('SINGLE', 'SET', 'GROUP');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PREPARING', 'COMPLETED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('WAITING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED');

-- CreateEnum
CREATE TYPE "ServiceRequestType" AS ENUM ('STAFF', 'UTENSILS', 'PAYMENT');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF', 'CHEF');

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "image" TEXT,
    "description" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "type" "MenuType" NOT NULL DEFAULT 'SINGLE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetComponent" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "menuItemId" INTEGER NOT NULL,

    CONSTRAINT "SetComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddOn" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddOnGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddOnGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddOnGroupItem" (
    "id" SERIAL NOT NULL,
    "addOnId" INTEGER NOT NULL,
    "addOnGroupId" INTEGER NOT NULL,

    CONSTRAINT "AddOnGroupItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemAddOn" (
    "id" SERIAL NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "addOnId" INTEGER NOT NULL,

    CONSTRAINT "MenuItemAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemAddOnGroup" (
    "id" SERIAL NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "addOnGroupId" INTEGER NOT NULL,

    CONSTRAINT "MenuItemAddOnGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NestedMenuOption" (
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
CREATE TABLE "NestedMenuConfig" (
    "id" SERIAL NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "requireSelection" BOOLEAN NOT NULL DEFAULT true,
    "minSelections" INTEGER NOT NULL DEFAULT 1,
    "maxSelections" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "NestedMenuConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NestedMenuConfigOption" (
    "id" SERIAL NOT NULL,
    "configId" INTEGER NOT NULL,
    "nestedOptionId" INTEGER NOT NULL,

    CONSTRAINT "NestedMenuConfigOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PREPARING',
    "tableNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
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
CREATE TABLE "QueueTicket" (
    "id" SERIAL NOT NULL,
    "queueId" TEXT NOT NULL,
    "queueNumber" INTEGER NOT NULL,
    "orderType" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'WAITING',
    "estimatedTime" INTEGER,
    "customerName" TEXT,
    "memberId" TEXT,
    "paymentMethod" TEXT,
    "items" JSONB NOT NULL,
    "calledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueueTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Table" (
    "id" SERIAL NOT NULL,
    "number" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE',
    "size" TEXT NOT NULL,
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionY" DOUBLE PRECISION NOT NULL,
    "currentGuests" INTEGER,
    "mergedWith" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" SERIAL NOT NULL,
    "requestId" TEXT NOT NULL,
    "type" "ServiceRequestType" NOT NULL,
    "tableNumber" TEXT,
    "details" TEXT,
    "items" TEXT[],
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
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
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AddOnGroupItem_addOnId_addOnGroupId_key" ON "AddOnGroupItem"("addOnId", "addOnGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemAddOn_menuItemId_addOnId_key" ON "MenuItemAddOn"("menuItemId", "addOnId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemAddOnGroup_menuItemId_addOnGroupId_key" ON "MenuItemAddOnGroup"("menuItemId", "addOnGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "NestedMenuConfig_menuItemId_key" ON "NestedMenuConfig"("menuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "NestedMenuConfigOption_configId_nestedOptionId_key" ON "NestedMenuConfigOption"("configId", "nestedOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderId_key" ON "Order"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "QueueTicket_queueId_key" ON "QueueTicket"("queueId");

-- CreateIndex
CREATE UNIQUE INDEX "Table_number_key" ON "Table"("number");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_requestId_key" ON "ServiceRequest"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_memberId_key" ON "Member"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "SetComponent" ADD CONSTRAINT "SetComponent_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddOnGroupItem" ADD CONSTRAINT "AddOnGroupItem_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "AddOn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddOnGroupItem" ADD CONSTRAINT "AddOnGroupItem_addOnGroupId_fkey" FOREIGN KEY ("addOnGroupId") REFERENCES "AddOnGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemAddOn" ADD CONSTRAINT "MenuItemAddOn_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemAddOn" ADD CONSTRAINT "MenuItemAddOn_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "AddOn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemAddOnGroup" ADD CONSTRAINT "MenuItemAddOnGroup_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemAddOnGroup" ADD CONSTRAINT "MenuItemAddOnGroup_addOnGroupId_fkey" FOREIGN KEY ("addOnGroupId") REFERENCES "AddOnGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NestedMenuOption" ADD CONSTRAINT "NestedMenuOption_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NestedMenuOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NestedMenuConfig" ADD CONSTRAINT "NestedMenuConfig_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NestedMenuConfigOption" ADD CONSTRAINT "NestedMenuConfigOption_configId_fkey" FOREIGN KEY ("configId") REFERENCES "NestedMenuConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NestedMenuConfigOption" ADD CONSTRAINT "NestedMenuConfigOption_nestedOptionId_fkey" FOREIGN KEY ("nestedOptionId") REFERENCES "NestedMenuOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
