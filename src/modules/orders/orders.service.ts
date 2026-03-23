import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto, SplitOrderDto } from './dto';
import { OrderStatus } from '@prisma/client';
import { InventoryService } from '../inventory/inventory.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private eventEmitter: EventEmitter2,
    private auditService: AuditService,
  ) {}

  private generateOrderId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  async create(createOrderDto: CreateOrderDto, branchId?: number) {
    const { items, ...orderData } = createOrderDto;

    // Pre-check stock availability
    const unavailableItems = await this.inventoryService.checkBulkAvailability(
      items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
    );

    if (unavailableItems.length > 0) {
      throw new BadRequestException({
        message: 'Some menu items are out of stock',
        unavailableItems,
      });
    }

    const order = await this.prisma.order.create({
      data: {
        ...orderData,
        branchId,
        orderId: this.generateOrderId(),
        items: {
          create: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            specialInstructions: item.specialInstructions,
            diningOption: item.diningOption,
            selectedAddOns: item.selectedAddOns,
            selectedAddOnGroups: item.selectedAddOnGroups,
            selectedNestedOptions: item.selectedNestedOptions,
          })),
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    // Deduct stock from inventory system
    this.deductInventoryStock(order.orderId, items);

    // Emit webhook event
    this.eventEmitter.emit('order.created', { data: order, branchId });

    // Audit log
    this.auditService.log({
      action: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: order.id,
      entityRef: order.orderId,
      branchId,
      newValues: {
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        totalItems: order.totalItems,
        tableNumber: order.tableNumber,
        status: order.status,
      },
      metadata: {
        tableNumber: order.tableNumber,
        sessionId: createOrderDto.sessionId,
        itemCount: order.items.length,
      },
    });

    return order;
  }

  private async deductInventoryStock(
    orderId: string,
    items: { menuItemId: number; quantity: number }[],
  ) {
    try {
      const result = await this.inventoryService.deductStockForOrder(
        orderId,
        items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      );

      if (result.processed) {
        this.logger.log(
          `Stock deduction completed for order ${orderId}: ${result.results.length} ingredients processed`,
        );
      } else {
        this.logger.log(
          `No recipes found for order ${orderId}, no stock deduction needed`,
        );
      }
    } catch (error) {
      this.logger.error(`Error deducting stock for order ${orderId}: ${error}`);
    }
  }

  async findAll(status?: OrderStatus, tableNumber?: string, branchId?: number) {
    const where: any = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (status) {
      where.status = status;
    }

    if (tableNumber) {
      where.tableNumber = tableNumber;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findByOrderId(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return order;
  }

  async updateStatus(id: number, updateStatusDto: UpdateOrderStatusDto) {
    const order = await this.findOne(id);

    // If cancelling, restore stock
    if (
      updateStatusDto.status === OrderStatus.CANCELLED &&
      order.status !== OrderStatus.CANCELLED
    ) {
      try {
        await this.inventoryService.restoreStockForOrder(
          order.orderId,
          order.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
          })),
        );
        this.logger.log(`Stock restored for cancelled order ${order.orderId}`);
      } catch (error) {
        this.logger.error(
          `Failed to restore stock for order ${order.orderId}: ${error}`,
        );
      }
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: updateStatusDto.status,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    // Emit webhook event
    if (updateStatusDto.status === OrderStatus.CANCELLED) {
      this.eventEmitter.emit('order.cancelled', { data: updatedOrder, branchId: updatedOrder.branchId });
    } else {
      this.eventEmitter.emit('order.status_changed', { data: updatedOrder, branchId: updatedOrder.branchId });
    }

    // Audit log
    this.auditService.log({
      action: updateStatusDto.status === OrderStatus.CANCELLED ? 'ORDER_CANCELLED' : 'ORDER_STATUS_CHANGED',
      entityType: 'ORDER',
      entityId: updatedOrder.id,
      entityRef: updatedOrder.orderId,
      branchId: updatedOrder.branchId ?? undefined,
      oldValues: { status: order.status },
      newValues: { status: updatedOrder.status },
      metadata: { tableNumber: updatedOrder.tableNumber },
    });

    return updatedOrder;
  }

  async updateItemStatus(orderId: number, itemId: number, status: string) {
    const order = await this.findOne(orderId);
    const item = order.items.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException(
        `Order item with ID ${itemId} not found in order ${orderId}`,
      );
    }

    const updated = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { status },
    });

    // Emit event for WebSocket
    this.eventEmitter.emit('order.itemStatusChanged', {
      orderId: order.id,
      orderRef: order.orderId,
      itemId,
      menuItemId: item.menuItemId,
      oldStatus: item.status,
      newStatus: status,
      branchId: order.branchId,
    });

    // Audit log
    this.auditService.log({
      action: 'ORDER_ITEM_STATUS_CHANGED',
      entityType: 'ORDER_ITEM',
      entityId: itemId,
      entityRef: order.orderId,
      branchId: order.branchId ?? undefined,
      oldValues: { status: item.status },
      newValues: { status },
      metadata: {
        orderId: order.id,
        orderRef: order.orderId,
        menuItemId: item.menuItemId,
      },
    });

    return updated;
  }

  async getOrdersByTable(tableNumber: string) {
    return this.prisma.order.findMany({
      where: {
        tableNumber,
        status: {
          notIn: [OrderStatus.CANCELLED],
        },
        payments: {
          none: {
            paymentStatus: 'PAID',
          },
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findUnpaidOrders(branchId?: number) {
    const where: any = {
      status: {
        in: [OrderStatus.COMPLETED, OrderStatus.DELIVERED],
      },
      payments: {
        none: {
          paymentStatus: 'PAID',
        },
      },
    };
    if (branchId) where.branchId = branchId;

    return this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getTodayOrders(branchId?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {
      createdAt: { gte: today },
    };
    if (branchId) where.branchId = branchId;

    return this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async splitOrder(orderId: number, dto: SplitOrderDto, branchId?: number) {
    // 1. Fetch the original order
    const original = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { menuItem: true } },
        payments: true,
      },
    });

    if (!original) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (original.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot split a cancelled order');
    }

    const existingPaid = original.payments.find(
      (p) => p.paymentStatus === 'PAID',
    );
    if (existingPaid) {
      throw new BadRequestException('Cannot split an already paid order');
    }

    // 2. Validate item IDs
    const allItemIds = dto.groups.flatMap((g) => g.itemIds);
    const orderItemIds = original.items.map((i) => i.id);

    for (const itemId of allItemIds) {
      if (!orderItemIds.includes(itemId)) {
        throw new BadRequestException(
          `Item ${itemId} does not belong to order ${orderId}`,
        );
      }
    }

    if (new Set(allItemIds).size !== allItemIds.length) {
      throw new BadRequestException('Duplicate item IDs across groups');
    }

    if (allItemIds.length !== orderItemIds.length) {
      throw new BadRequestException(
        'All items must be assigned to a group',
      );
    }

    // 3. Create new orders in transaction
    const itemMap = new Map(original.items.map((i) => [i.id, i]));

    const newOrders = await this.prisma.$transaction(async (tx) => {
      const results: any[] = [];

      for (const group of dto.groups) {
        const groupItems = group.itemIds.map((id) => itemMap.get(id)!);
        const totalAmount = groupItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
        const totalItems = groupItems.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );

        const newOrder = await tx.order.create({
          data: {
            orderId: this.generateOrderId(),
            totalAmount,
            totalItems,
            status: original.status,
            tableNumber: original.tableNumber,
            branchId: original.branchId,
            splitFromOrderId: original.id,
            items: {
              create: groupItems.map((item) => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price: item.price,
                specialInstructions: item.specialInstructions,
                diningOption: item.diningOption,
                status: item.status,
                selectedAddOns: item.selectedAddOns ?? undefined,
                selectedAddOnGroups: item.selectedAddOnGroups ?? undefined,
                selectedNestedOptions:
                  item.selectedNestedOptions ?? undefined,
              })),
            },
          },
          include: {
            items: { include: { menuItem: true } },
          },
        });
        results.push(newOrder);
      }

      // Cancel original order directly (no stock restore - items just moved)
      await tx.order.update({
        where: { id: original.id },
        data: { status: OrderStatus.CANCELLED },
      });

      return results;
    });

    // Audit log
    this.auditService.log({
      action: 'ORDER_SPLIT',
      entityType: 'ORDER',
      entityId: orderId,
      entityRef: original.orderId,
      branchId: original.branchId ?? undefined,
      oldValues: {
        orderId: original.orderId,
        totalAmount: original.totalAmount,
        totalItems: original.totalItems,
        status: original.status,
      },
      newValues: {
        splitInto: newOrders.map((o) => ({
          id: o.id,
          orderId: o.orderId,
          totalAmount: o.totalAmount,
          totalItems: o.totalItems,
        })),
      },
      metadata: {
        tableNumber: original.tableNumber,
        groupCount: dto.groups.length,
      },
    });

    return {
      originalOrderId: original.orderId,
      splitOrders: newOrders,
    };
  }
}
