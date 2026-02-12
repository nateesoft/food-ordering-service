import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, QueueStatus, TableStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverviewStats(branchId?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const branchFilter = branchId ? { branchId } : {};

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
        where: { createdAt: { gte: today }, ...branchFilter },
      }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: today }, ...branchFilter },
        _sum: { totalAmount: true },
      }),
      this.prisma.queueTicket.count({
        where: { createdAt: { gte: today }, ...branchFilter },
      }),
      this.prisma.order.count({
        where: {
          status: { in: [OrderStatus.PREPARING] },
          ...branchFilter,
        },
      }),
      this.prisma.serviceRequest.count({
        where: { status: 'PENDING', ...branchFilter },
      }),
      this.prisma.table.count({
        where: { status: TableStatus.OCCUPIED, ...branchFilter },
      }),
      this.prisma.table.count({ where: { ...branchFilter } }),
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

  async getQueueStats(branchId?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const branchFilter = branchId ? { branchId } : {};

    const [waiting, preparing, ready, completed, cancelled] = await Promise.all(
      [
        this.prisma.queueTicket.count({
          where: { createdAt: { gte: today }, status: QueueStatus.WAITING, ...branchFilter },
        }),
        this.prisma.queueTicket.count({
          where: { createdAt: { gte: today }, status: QueueStatus.PREPARING, ...branchFilter },
        }),
        this.prisma.queueTicket.count({
          where: { createdAt: { gte: today }, status: QueueStatus.READY, ...branchFilter },
        }),
        this.prisma.queueTicket.count({
          where: { createdAt: { gte: today }, status: QueueStatus.COMPLETED, ...branchFilter },
        }),
        this.prisma.queueTicket.count({
          where: { createdAt: { gte: today }, status: QueueStatus.CANCELLED, ...branchFilter },
        }),
      ],
    );

    // Calculate average wait time for completed tickets
    const completedTickets = await this.prisma.queueTicket.findMany({
      where: {
        createdAt: { gte: today },
        status: QueueStatus.COMPLETED,
        completedAt: { not: null },
        ...branchFilter,
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

  async getOrderStats(branchId?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const branchFilter = branchId ? { branchId } : {};

    const [preparing, completed, delivered, cancelled] = await Promise.all([
      this.prisma.order.count({
        where: { createdAt: { gte: today }, status: OrderStatus.PREPARING, ...branchFilter },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: today }, status: OrderStatus.COMPLETED, ...branchFilter },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: today }, status: OrderStatus.DELIVERED, ...branchFilter },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: today }, status: OrderStatus.CANCELLED, ...branchFilter },
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

  async getPopularItems(limit: number = 10, branchId?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orderItems = await this.prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        createdAt: { gte: today },
        ...(branchId ? { order: { branchId } } : {}),
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

  async getRevenueByHour(branchId?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const branchFilter = branchId ? { branchId } : {};

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: today }, ...branchFilter },
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

  // ===== Report Methods =====

  async getRevenueReport(startDate: Date, endDate: Date, branchId?: number) {
    const branchFilter = branchId ? { branchId } : {};

    const payments = await this.prisma.payment.findMany({
      where: {
        paymentStatus: PaymentStatus.PAID,
        paidAt: { gte: startDate, lte: endDate },
        ...branchFilter,
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalTransactions = payments.length;
    const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const totalDiscount = payments.reduce((sum, p) => sum + p.discountAmount, 0);
    const totalPointsRedeemed = payments.reduce((sum, p) => sum + p.discountPoints, 0);
    const totalPointsEarned = payments.reduce((sum, p) => sum + p.pointsEarned, 0);

    // Breakdown by payment method
    const methodBreakdown: Record<string, { count: number; amount: number }> = {};
    payments.forEach((p) => {
      if (!methodBreakdown[p.paymentMethod]) {
        methodBreakdown[p.paymentMethod] = { count: 0, amount: 0 };
      }
      methodBreakdown[p.paymentMethod].count++;
      methodBreakdown[p.paymentMethod].amount += p.totalAmount;
    });

    // Revenue by hour
    const revenueByHour: number[] = new Array(24).fill(0);
    payments.forEach((p) => {
      if (p.paidAt) {
        const hour = p.paidAt.getHours();
        revenueByHour[hour] += p.totalAmount;
      }
    });

    return {
      totalRevenue,
      totalTransactions,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      totalDiscount,
      totalPointsRedeemed,
      totalPointsEarned,
      methodBreakdown: Object.entries(methodBreakdown).map(([method, data]) => ({
        method,
        ...data,
      })),
      revenueByHour: revenueByHour.map((revenue, hour) => ({ hour, revenue })),
    };
  }

  async getOrdersReport(startDate: Date, endDate: Date, branchId?: number) {
    const branchFilter = branchId ? { branchId } : {};

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ...branchFilter,
      },
      include: { items: true },
    });

    const totalOrders = orders.length;
    const statusCount: Record<string, number> = {};
    let totalItemsCount = 0;
    let dineInCount = 0;
    let kioskCount = 0;

    orders.forEach((o) => {
      statusCount[o.status] = (statusCount[o.status] || 0) + 1;
      totalItemsCount += o.totalItems;
      if (o.tableNumber) {
        dineInCount++;
      } else {
        kioskCount++;
      }
    });

    const cancellationRate =
      totalOrders > 0
        ? Math.round(((statusCount['CANCELLED'] || 0) / totalOrders) * 10000) / 100
        : 0;
    const avgItemsPerOrder =
      totalOrders > 0 ? Math.round((totalItemsCount / totalOrders) * 100) / 100 : 0;

    // Orders by hour
    const ordersByHour: number[] = new Array(24).fill(0);
    orders.forEach((o) => {
      const hour = o.createdAt.getHours();
      ordersByHour[hour]++;
    });

    return {
      totalOrders,
      statusCount: Object.entries(statusCount).map(([status, count]) => ({
        status,
        count,
      })),
      cancellationRate,
      avgItemsPerOrder,
      dineInCount,
      kioskCount,
      ordersByHour: ordersByHour.map((count, hour) => ({ hour, count })),
    };
  }

  async getMenuPerformanceReport(startDate: Date, endDate: Date, branchId?: number) {
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ...(branchId ? { order: { branchId } } : {}),
      },
      include: { menuItem: true },
    });

    // Aggregate by menu item
    const itemMap: Record<
      number,
      { name: string; category: string; quantity: number; revenue: number; rating: number | null }
    > = {};

    orderItems.forEach((oi) => {
      if (!itemMap[oi.menuItemId]) {
        itemMap[oi.menuItemId] = {
          name: oi.menuItem.name,
          category: oi.menuItem.category,
          quantity: 0,
          revenue: 0,
          rating: oi.menuItem.rating,
        };
      }
      itemMap[oi.menuItemId].quantity += oi.quantity;
      itemMap[oi.menuItemId].revenue += oi.price * oi.quantity;
    });

    const allItems = Object.values(itemMap);
    const totalRevenue = allItems.reduce((sum, i) => sum + i.revenue, 0);

    // Sort by quantity desc
    allItems.sort((a, b) => b.quantity - a.quantity);

    const top20 = allItems.slice(0, 20).map((item) => ({
      ...item,
      revenue: Math.round(item.revenue * 100) / 100,
      percentage: totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 10000) / 100 : 0,
    }));

    const bottom10 = [...allItems].sort((a, b) => a.quantity - b.quantity).slice(0, 10).map((item) => ({
      ...item,
      revenue: Math.round(item.revenue * 100) / 100,
    }));

    // Revenue by category
    const categoryMap: Record<string, number> = {};
    allItems.forEach((item) => {
      categoryMap[item.category] = (categoryMap[item.category] || 0) + item.revenue;
    });

    const revenueByCategory = Object.entries(categoryMap)
      .map(([category, revenue]) => ({
        category,
        revenue: Math.round(revenue * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return { top20, bottom10, revenueByCategory, totalRevenue };
  }

  async getMemberAnalytics() {
    const members = await this.prisma.member.findMany();

    const totalMembers = members.length;
    const tierCount: Record<string, number> = {};
    let totalPoints = 0;

    members.forEach((m) => {
      tierCount[m.tier] = (tierCount[m.tier] || 0) + 1;
      totalPoints += m.points;
    });

    // New members this month
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);
    const newMembersThisMonth = members.filter(
      (m) => m.createdAt >= firstOfMonth,
    ).length;

    // Top 10 by points
    const top10 = [...members]
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
      .map((m) => ({
        name: m.name,
        memberId: m.memberId,
        phone: m.phone,
        tier: m.tier,
        points: m.points,
      }));

    // Total points used (from payments)
    const pointsUsed = await this.prisma.payment.aggregate({
      where: { paymentStatus: PaymentStatus.PAID },
      _sum: { discountPoints: true },
    });

    return {
      totalMembers,
      newMembersThisMonth,
      tierCount: Object.entries(tierCount).map(([tier, count]) => ({
        tier,
        count,
      })),
      totalPoints,
      totalPointsUsed: pointsUsed._sum.discountPoints || 0,
      top10,
    };
  }

  async getDailySummary(startDate: Date, endDate: Date, branchId?: number) {
    const branchFilter = branchId ? { branchId } : {};

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: startDate, lte: endDate }, ...branchFilter },
      select: { createdAt: true, totalAmount: true },
    });

    const payments = await this.prisma.payment.findMany({
      where: {
        paymentStatus: PaymentStatus.PAID,
        paidAt: { gte: startDate, lte: endDate },
        ...branchFilter,
      },
      select: { paidAt: true, totalAmount: true },
    });

    const members = await this.prisma.member.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true },
    });

    // Build daily map
    const dailyMap: Record<
      string,
      { revenue: number; orderCount: number; newMembers: number }
    > = {};

    // Initialize all days in range
    const current = new Date(startDate);
    while (current <= endDate) {
      const key = current.toISOString().split('T')[0];
      dailyMap[key] = { revenue: 0, orderCount: 0, newMembers: 0 };
      current.setDate(current.getDate() + 1);
    }

    orders.forEach((o) => {
      const key = o.createdAt.toISOString().split('T')[0];
      if (dailyMap[key]) {
        dailyMap[key].orderCount++;
      }
    });

    payments.forEach((p) => {
      if (p.paidAt) {
        const key = p.paidAt.toISOString().split('T')[0];
        if (dailyMap[key]) {
          dailyMap[key].revenue += p.totalAmount;
        }
      }
    });

    members.forEach((m) => {
      const key = m.createdAt.toISOString().split('T')[0];
      if (dailyMap[key]) {
        dailyMap[key].newMembers++;
      }
    });

    return Object.entries(dailyMap).map(([date, data]) => ({
      date,
      ...data,
      revenue: Math.round(data.revenue * 100) / 100,
      avgOrderValue:
        data.orderCount > 0
          ? Math.round((data.revenue / data.orderCount) * 100) / 100
          : 0,
    }));
  }
}
