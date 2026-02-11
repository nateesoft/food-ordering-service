import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { OrderStatus } from '@prisma/client';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  private generateOrderId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  async create(createOrderDto: CreateOrderDto) {
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

  async findAll(status?: OrderStatus, tableNumber?: string) {
    const where: any = {};

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

    return this.prisma.order.update({
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
  }

  async updateItemStatus(orderId: number, itemId: number, status: string) {
    const order = await this.findOne(orderId);
    const item = order.items.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException(
        `Order item with ID ${itemId} not found in order ${orderId}`,
      );
    }

    return this.prisma.orderItem.update({
      where: { id: itemId },
      data: { status },
    });
  }

  async getOrdersByTable(tableNumber: string) {
    return this.prisma.order.findMany({
      where: {
        tableNumber,
        status: {
          in: [OrderStatus.PREPARING, OrderStatus.COMPLETED],
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

  async findUnpaidOrders() {
    return this.prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.COMPLETED, OrderStatus.DELIVERED],
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

  async getTodayOrders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: today,
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
}
