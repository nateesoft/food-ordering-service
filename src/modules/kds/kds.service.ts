import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateKDSStationDto, UpdateKDSStationDto } from './dto';
import { OrderStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class KDSService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // === KDS Orders ===
  async getActiveOrders(branchId?: string, stationId?: number) {
    // Get categories for station filter
    let categoryFilter: string[] | undefined;
    if (stationId) {
      const station = await this.prisma.kDSStation.findUnique({ where: { id: stationId } });
      if (station) {
        categoryFilter = station.categories;
      }
    }

    const where: any = {
      status: { in: [OrderStatus.PREPARING] },
    };
    if (branchId) where.branchId = branchId;

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: { menuItem: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Filter items by station categories if applicable
    if (categoryFilter && categoryFilter.length > 0) {
      return orders
        .map((order) => ({
          ...order,
          items: order.items.filter(
            (item) => item.menuItem && categoryFilter!.includes(item.menuItem.category),
          ),
        }))
        .filter((order) => order.items.length > 0);
    }

    return orders;
  }

  async bumpItem(orderId: number, itemId: number, status: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const item = order.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException(`Item ${itemId} not found in order ${orderId}`);

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

    // Check if all items are completed → update order status
    const allItems = await this.prisma.orderItem.findMany({
      where: { orderId: order.id },
    });
    const allCompleted = allItems.every((i) => i.status === 'COMPLETED');

    if (allCompleted && order.status === OrderStatus.PREPARING) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.COMPLETED },
      });

      this.eventEmitter.emit('order.status_changed', {
        data: { ...order, status: OrderStatus.COMPLETED },
        branchId: order.branchId,
      });
    }

    return updated;
  }

  // === KDS Stations ===
  async getStations(branchId?: string) {
    const where: any = {};
    if (branchId) where.branchId = branchId;

    return this.prisma.kDSStation.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createStation(dto: CreateKDSStationDto, branchId?: string) {
    return this.prisma.kDSStation.create({
      data: {
        ...dto,
        branchId,
      },
    });
  }

  async updateStation(id: number, dto: UpdateKDSStationDto) {
    const station = await this.prisma.kDSStation.findUnique({ where: { id } });
    if (!station) throw new NotFoundException(`Station ${id} not found`);

    return this.prisma.kDSStation.update({
      where: { id },
      data: dto,
    });
  }

  async deleteStation(id: number) {
    const station = await this.prisma.kDSStation.findUnique({ where: { id } });
    if (!station) throw new NotFoundException(`Station ${id} not found`);

    return this.prisma.kDSStation.delete({ where: { id } });
  }
}
