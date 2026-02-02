import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { OrderStatus } from '@prisma/client';
import { InventoryIntegrationService } from '../inventory-integration/inventory-integration.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private inventoryIntegration: InventoryIntegrationService,
  ) {}

  private generateOrderId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  async create(createOrderDto: CreateOrderDto) {
    const { items, ...orderData } = createOrderDto;

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
      const result = await this.inventoryIntegration.deductStockForOrder({
        orderId,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      });

      if (result) {
        this.logger.log(
          `Stock deduction successful for order ${orderId}: ${result.results.length} menu items processed`,
        );
      } else {
        this.logger.warn(
          `Stock deduction failed or inventory service unavailable for order ${orderId}`,
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
    await this.findOne(id);

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
