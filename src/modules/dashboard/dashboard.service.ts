import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, QueueStatus, TableStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverviewStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todayOrders,
      todayRevenue,
      todayQueueTickets,
      activeOrders,
      pendingServiceRequests,
      occupiedTables,
      totalTables,
    ] = await Promise.all([
      this.prisma.order.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { totalAmount: true },
      }),
      this.prisma.queueTicket.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.order.count({
        where: {
          status: { in: [OrderStatus.PREPARING] },
        },
      }),
      this.prisma.serviceRequest.count({
        where: { status: 'PENDING' },
      }),
      this.prisma.table.count({
        where: { status: TableStatus.OCCUPIED },
      }),
      this.prisma.table.count(),
    ]);

    return {
      today: {
        orders: todayOrders,
        revenue: todayRevenue._sum.totalAmount || 0,
        queueTickets: todayQueueTickets,
      },
      active: {
        orders: activeOrders,
        pendingServiceRequests,
        occupiedTables,
        totalTables,
      },
    };
  }

  async getQueueStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [waiting, preparing, ready, completed, cancelled] = await Promise.all(
      [
        this.prisma.queueTicket.count({
          where: { createdAt: { gte: today }, status: QueueStatus.WAITING },
        }),
        this.prisma.queueTicket.count({
          where: { createdAt: { gte: today }, status: QueueStatus.PREPARING },
        }),
        this.prisma.queueTicket.count({
          where: { createdAt: { gte: today }, status: QueueStatus.READY },
        }),
        this.prisma.queueTicket.count({
          where: { createdAt: { gte: today }, status: QueueStatus.COMPLETED },
        }),
        this.prisma.queueTicket.count({
          where: { createdAt: { gte: today }, status: QueueStatus.CANCELLED },
        }),
      ],
    );

    // Calculate average wait time for completed tickets
    const completedTickets = await this.prisma.queueTicket.findMany({
      where: {
        createdAt: { gte: today },
        status: QueueStatus.COMPLETED,
        completedAt: { not: null },
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
    });

    let avgWaitTime = 0;
    if (completedTickets.length > 0) {
      const totalWaitTime = completedTickets.reduce((sum, ticket) => {
        const waitTime =
          (ticket.completedAt!.getTime() - ticket.createdAt.getTime()) / 60000;
        return sum + waitTime;
      }, 0);
      avgWaitTime = Math.round(totalWaitTime / completedTickets.length);
    }

    return {
      waiting,
      preparing,
      ready,
      completed,
      cancelled,
      total: waiting + preparing + ready + completed + cancelled,
      avgWaitTimeMinutes: avgWaitTime,
    };
  }

  async getOrderStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [preparing, completed, delivered, cancelled] = await Promise.all([
      this.prisma.order.count({
        where: { createdAt: { gte: today }, status: OrderStatus.PREPARING },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: today }, status: OrderStatus.COMPLETED },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: today }, status: OrderStatus.DELIVERED },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: today }, status: OrderStatus.CANCELLED },
      }),
    ]);

    return {
      preparing,
      completed,
      delivered,
      cancelled,
      total: preparing + completed + delivered + cancelled,
    };
  }

  async getPopularItems(limit: number = 10) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orderItems = await this.prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        createdAt: { gte: today },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    const menuItemIds = orderItems.map((item) => item.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));

    return orderItems.map((item) => ({
      menuItem: menuItemMap.get(item.menuItemId),
      totalQuantity: item._sum.quantity,
    }));
  }

  async getRevenueByHour() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: today } },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    const hourlyRevenue: { [hour: number]: number } = {};

    for (let i = 0; i < 24; i++) {
      hourlyRevenue[i] = 0;
    }

    orders.forEach((order) => {
      const hour = order.createdAt.getHours();
      hourlyRevenue[hour] += order.totalAmount;
    });

    return Object.entries(hourlyRevenue).map(([hour, revenue]) => ({
      hour: parseInt(hour),
      revenue,
    }));
  }
}
