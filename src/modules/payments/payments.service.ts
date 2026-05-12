import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MembersService } from '../members/members.service';
import { PromotionsService } from '../promotions/promotions.service';
import { CreatePaymentDto, CreateMergedPaymentDto } from './dto';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditService } from '../audit/audit.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private membersService: MembersService,
    private promotionsService: PromotionsService,
    private eventEmitter: EventEmitter2,
    private auditService: AuditService,
    private redisService: RedisService,
  ) {}

  private async generateReceiptNumber(branchId?: number, offset = 0): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `RCP-${dateStr}-`;

    // Find the latest receipt number for today
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const where: any = {
      createdAt: { gte: startOfDay },
      receiptNumber: { startsWith: prefix },
    };
    if (branchId) where.branchId = branchId;

    const lastPayment = await this.prisma.payment.findFirst({
      where,
      orderBy: { receiptNumber: 'desc' },
      select: { receiptNumber: true },
    });

    let nextNumber = 1;
    if (lastPayment) {
      const lastNum = parseInt(lastPayment.receiptNumber.slice(prefix.length), 10);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }

    const runningNumber = String(nextNumber + offset).padStart(3, '0');
    return `${prefix}${runningNumber}`;
  }

  async createPayment(dto: CreatePaymentDto, branchId?: number) {
    // 1. Find the order
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        items: {
          include: { menuItem: true },
        },
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${dto.orderId} not found`);
    }

    // 2. Check order status
    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Cannot pay for a cancelled order');
    }

    // 3. Check if already paid
    const existingPaid = order.payments.find(
      (p) => p.paymentStatus === PaymentStatus.PAID,
    );
    if (existingPaid) {
      throw new ConflictException(
        `Order already paid. Receipt: ${existingPaid.receiptNumber}`,
      );
    }

    const subtotal = order.totalAmount;
    let discountAmount = 0;
    let discountPoints = 0;
    let memberId: string | null = null;
    let memberName: string | null = null;
    let pointsEarned = 0;

    // 4. Handle member discount
    if (dto.memberId) {
      try {
        const member = await this.membersService.findByMemberId(dto.memberId);
        memberId = member.memberId;
        memberName = member.name;

        if (dto.discountPoints && dto.discountPoints > 0) {
          if (dto.discountPoints > member.points) {
            throw new BadRequestException(
              `Insufficient points. Available: ${member.points}, Requested: ${dto.discountPoints}`,
            );
          }

          discountPoints = Math.min(dto.discountPoints, Math.floor(subtotal));
          discountAmount = discountPoints; // 1 point = 1 baht
        }
      } catch (error) {
        if (error instanceof BadRequestException) throw error;
        if (error instanceof NotFoundException) {
          throw new BadRequestException(`Member ${dto.memberId} not found`);
        }
        throw error;
      }
    }

    // 5. Handle promotion/coupon discount
    let promotionId: number | null = null;
    let promotionDiscount = 0;
    let promotionName: string | null = null;
    let couponCode: string | null = null;

    if (dto.couponCode) {
      const couponResult = await this.promotionsService.validateCoupon(
        { couponCode: dto.couponCode, subtotal },
        branchId,
      );
      if (!couponResult.valid) {
        throw new BadRequestException(couponResult.message);
      }
      promotionId = couponResult.promotion!.id;
      promotionDiscount = couponResult.discountAmount!;
      promotionName = couponResult.promotion!.name;
      couponCode = dto.couponCode.toUpperCase();
    } else if (dto.promotionId) {
      const promotion = await this.promotionsService.findOne(dto.promotionId);
      promotionDiscount = this.promotionsService.calculateDiscountAmount(
        promotion,
        subtotal,
      );
      promotionId = promotion.id;
      promotionName = promotion.name;
    }

    // 6. Calculate amounts
    const totalAmount = subtotal - discountAmount - promotionDiscount;

    // Handle split payments
    let effectivePaidAmount = dto.paidAmount;
    let changeAmount: number;
    let splitPaymentsData: any = null;

    if (dto.splitPayments && dto.splitPayments.length > 0) {
      splitPaymentsData = dto.splitPayments;
      effectivePaidAmount = dto.splitPayments.reduce((sum, sp) => sum + sp.amount, 0);

      const cashSplit = dto.splitPayments.find((sp) => sp.method === PaymentMethod.CASH);
      const nonCashTotal = dto.splitPayments
        .filter((sp) => sp.method !== PaymentMethod.CASH)
        .reduce((sum, sp) => sum + sp.amount, 0);
      const cashNeeded = Math.max(0, totalAmount - nonCashTotal);

      changeAmount = cashSplit ? Math.max(0, cashSplit.amount - cashNeeded) : 0;
    } else {
      changeAmount =
        dto.paymentMethod === PaymentMethod.CASH
          ? Math.max(0, dto.paidAmount - totalAmount)
          : 0;
    }

    // Validate paid amount
    if (effectivePaidAmount < totalAmount) {
      throw new BadRequestException(
        `Insufficient payment. Required: ${totalAmount}, Received: ${effectivePaidAmount}`,
      );
    }

    // 7. Calculate points earned (1 point per 25 baht of totalAmount)
    if (memberId) {
      pointsEarned = Math.floor(totalAmount / 25);
    }

    // 8. Create payment with retry on receipt number collision
    const MAX_RETRIES = 5;
    let payment: any;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const receiptNumber = await this.generateReceiptNumber(branchId, attempt);
      try {
        payment = await this.prisma.payment.create({
          data: {
            receiptNumber,
            orderId: order.id,
            branchId,
            paymentMethod: dto.paymentMethod,
            paymentStatus: PaymentStatus.PAID,
            subtotal,
            serviceCharge: dto.serviceCharge ?? 0,
            vat: dto.vat ?? 0,
            discountAmount,
            discountPoints,
            totalAmount,
            paidAmount: effectivePaidAmount,
            changeAmount,
            memberId,
            memberName,
            pointsEarned,
            cashierName: dto.cashierName || null,
            note: dto.note || null,
            shiftId: dto.shiftId || null,
            promotionId,
            promotionDiscount,
            promotionName,
            couponCode,
            splitPayments: splitPaymentsData,
            paidAt: new Date(),
          },
          include: {
            order: {
              include: {
                items: {
                  include: { menuItem: true },
                },
              },
            },
          },
        });
        break;
      } catch (error: any) {
        // P2002 = unique constraint violation on receiptNumber
        if (error.code === 'P2002') {
          if (attempt === MAX_RETRIES - 1) throw error;
          continue;
        }
        throw error;
      }
    }

    // 10. Increment promotion usage
    if (promotionId) {
      await this.promotionsService.incrementUsage(promotionId);
    }

    // 11. Handle member points (redeem + earn)
    if (memberId) {
      if (discountPoints > 0) {
        await this.membersService.redeemPoints(memberId, discountPoints);
      }
      if (pointsEarned > 0) {
        await this.membersService.addPoints(memberId, pointsEarned);
      }
    }

    // Clear Redis session for the table (bill is paid — table is now free)
    if (order.tableNumber && branchId) {
      this.redisService.clearSessionForTable(order.tableNumber, branchId).catch(() => {});
    }

    // Emit webhook event
    this.eventEmitter.emit('payment.completed', { data: payment, branchId });

    // Audit log
    this.auditService.log({
      action: 'PAYMENT_CREATED',
      entityType: 'PAYMENT',
      entityId: payment.id,
      entityRef: payment.receiptNumber,
      performedBy: dto.cashierName,
      branchId,
      newValues: {
        receiptNumber: payment.receiptNumber,
        orderId: payment.orderId,
        paymentMethod: payment.paymentMethod,
        subtotal: payment.subtotal,
        discountAmount: payment.discountAmount,
        promotionDiscount: payment.promotionDiscount,
        totalAmount: payment.totalAmount,
        paidAmount: payment.paidAmount,
        changeAmount: payment.changeAmount,
      },
      metadata: {
        memberId: payment.memberId,
        promotionId: payment.promotionId,
        promotionName: payment.promotionName,
        couponCode: payment.couponCode,
        shiftId: payment.shiftId,
        tableNumber: order.tableNumber,
      },
    });

    return payment;
  }

  async createMergedPayment(dto: CreateMergedPaymentDto, branchId?: number) {
    // 1. Fetch all orders
    const orders = await this.prisma.order.findMany({
      where: { id: { in: dto.orderIds } },
      include: {
        items: { include: { menuItem: true } },
        payments: true,
      },
      orderBy: { id: 'asc' },
    });

    // 2. Validate all orders exist
    if (orders.length !== dto.orderIds.length) {
      throw new NotFoundException('One or more orders not found');
    }

    // 3. Validate same table
    const tableNumbers = new Set(orders.map((o) => o.tableNumber || ''));
    if (tableNumbers.size > 1) {
      throw new BadRequestException(
        'All orders must be from the same table to merge',
      );
    }

    // 4. Validate each order
    for (const order of orders) {
      if (order.status === 'CANCELLED') {
        throw new BadRequestException(
          `Order ${order.orderId} is cancelled`,
        );
      }
      const existingPaid = order.payments.find(
        (p) => p.paymentStatus === PaymentStatus.PAID,
      );
      if (existingPaid) {
        throw new ConflictException(
          `Order ${order.orderId} is already paid. Receipt: ${existingPaid.receiptNumber}`,
        );
      }
    }

    // 5. Calculate combined subtotal
    const combinedSubtotal = orders.reduce(
      (sum, o) => sum + o.totalAmount,
      0,
    );

    // 6. Handle member discount
    let discountAmount = 0;
    let discountPoints = 0;
    let memberId: string | null = null;
    let memberName: string | null = null;
    let pointsEarned = 0;

    if (dto.memberId) {
      try {
        const member = await this.membersService.findByMemberId(dto.memberId);
        memberId = member.memberId;
        memberName = member.name;

        if (dto.discountPoints && dto.discountPoints > 0) {
          if (dto.discountPoints > member.points) {
            throw new BadRequestException(
              `Insufficient points. Available: ${member.points}, Requested: ${dto.discountPoints}`,
            );
          }
          discountPoints = Math.min(
            dto.discountPoints,
            Math.floor(combinedSubtotal),
          );
          discountAmount = discountPoints;
        }
      } catch (error) {
        if (error instanceof BadRequestException) throw error;
        if (error instanceof NotFoundException) {
          throw new BadRequestException(`Member ${dto.memberId} not found`);
        }
        throw error;
      }
    }

    // 7. Handle promotion/coupon discount
    let promotionId: number | null = null;
    let promotionDiscount = 0;
    let promotionName: string | null = null;
    let couponCode: string | null = null;

    if (dto.couponCode) {
      const couponResult = await this.promotionsService.validateCoupon(
        { couponCode: dto.couponCode, subtotal: combinedSubtotal },
        branchId,
      );
      if (!couponResult.valid) {
        throw new BadRequestException(couponResult.message);
      }
      promotionId = couponResult.promotion!.id;
      promotionDiscount = couponResult.discountAmount!;
      promotionName = couponResult.promotion!.name;
      couponCode = dto.couponCode.toUpperCase();
    } else if (dto.promotionId) {
      const promotion = await this.promotionsService.findOne(dto.promotionId);
      promotionDiscount = this.promotionsService.calculateDiscountAmount(
        promotion,
        combinedSubtotal,
      );
      promotionId = promotion.id;
      promotionName = promotion.name;
    }

    // 8. Calculate amounts
    const totalAmount = combinedSubtotal - discountAmount - promotionDiscount;

    // Handle split payments
    let effectivePaidAmount = dto.paidAmount;
    let changeAmount: number;
    let splitPaymentsData: any = null;

    if (dto.splitPayments && dto.splitPayments.length > 0) {
      splitPaymentsData = dto.splitPayments;
      effectivePaidAmount = dto.splitPayments.reduce((sum, sp) => sum + sp.amount, 0);

      const cashSplit = dto.splitPayments.find((sp) => sp.method === PaymentMethod.CASH);
      const nonCashTotal = dto.splitPayments
        .filter((sp) => sp.method !== PaymentMethod.CASH)
        .reduce((sum, sp) => sum + sp.amount, 0);
      const cashNeeded = Math.max(0, totalAmount - nonCashTotal);

      changeAmount = cashSplit ? Math.max(0, cashSplit.amount - cashNeeded) : 0;
    } else {
      changeAmount =
        dto.paymentMethod === PaymentMethod.CASH
          ? Math.max(0, dto.paidAmount - totalAmount)
          : 0;
    }

    if (effectivePaidAmount < totalAmount) {
      throw new BadRequestException(
        `Insufficient payment. Required: ${totalAmount}, Received: ${effectivePaidAmount}`,
      );
    }

    // 9. Calculate points earned
    if (memberId) {
      pointsEarned = Math.floor(totalAmount / 25);
    }

    // 10. Create primary payment with retry on receipt number collision
    const MAX_RETRIES = 5;
    let primaryPayment: any;
    let receiptNumber: string;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      receiptNumber = await this.generateReceiptNumber(branchId, attempt);
      try {
        primaryPayment = await this.prisma.payment.create({
          data: {
            receiptNumber,
            orderId: orders[0].id,
            branchId,
            paymentMethod: dto.paymentMethod,
            paymentStatus: PaymentStatus.PAID,
            subtotal: combinedSubtotal,
            discountAmount,
            discountPoints,
            totalAmount,
            paidAmount: effectivePaidAmount,
            changeAmount,
            memberId,
            memberName,
            pointsEarned,
            cashierName: dto.cashierName || null,
            note: dto.note || null,
            shiftId: dto.shiftId || null,
            promotionId,
            promotionDiscount,
            promotionName,
            couponCode,
            mergedOrderIds: dto.orderIds,
            splitPayments: splitPaymentsData,
            paidAt: new Date(),
          },
          include: {
            order: {
              include: {
                items: { include: { menuItem: true } },
              },
            },
          },
        });
        break;
      } catch (error: any) {
        if (error.code === 'P2002') {
          if (attempt === MAX_RETRIES - 1) throw error;
          continue;
        }
        throw error;
      }
    }

    // 11. Create marker payments for remaining orders (so they appear as paid)
    for (let i = 1; i < orders.length; i++) {
      await this.prisma.payment.create({
        data: {
          receiptNumber: `${receiptNumber!}/M${i + 1}`,
          orderId: orders[i].id,
          branchId,
          paymentMethod: dto.paymentMethod,
          paymentStatus: PaymentStatus.PAID,
          subtotal: orders[i].totalAmount,
          discountAmount: 0,
          discountPoints: 0,
          totalAmount: 0,
          paidAmount: 0,
          changeAmount: 0,
          cashierName: dto.cashierName || null,
          note: `รวมจ่ายในใบเสร็จ ${receiptNumber!}`,
          shiftId: dto.shiftId || null,
          mergedOrderIds: dto.orderIds,
          paidAt: new Date(),
        },
      });
    }

    // 13. Increment promotion usage
    if (promotionId) {
      await this.promotionsService.incrementUsage(promotionId);
    }

    // 14. Handle member points
    if (memberId) {
      if (discountPoints > 0) {
        await this.membersService.redeemPoints(memberId, discountPoints);
      }
      if (pointsEarned > 0) {
        await this.membersService.addPoints(memberId, pointsEarned);
      }
    }

    // Clear Redis session for the table (bill is paid — table is now free)
    const tableNumber = orders[0].tableNumber;
    if (tableNumber && branchId) {
      this.redisService.clearSessionForTable(tableNumber, branchId).catch(() => {});
    }

    // Emit webhook event
    this.eventEmitter.emit('payment.completed', { data: primaryPayment, branchId });

    // Audit log
    this.auditService.log({
      action: 'PAYMENT_MERGED',
      entityType: 'PAYMENT',
      entityId: primaryPayment.id,
      entityRef: primaryPayment.receiptNumber,
      performedBy: dto.cashierName,
      branchId,
      newValues: {
        receiptNumber: primaryPayment.receiptNumber,
        paymentMethod: primaryPayment.paymentMethod,
        subtotal: combinedSubtotal,
        totalAmount: primaryPayment.totalAmount,
        paidAmount: primaryPayment.paidAmount,
        mergedOrderIds: dto.orderIds,
      },
      metadata: {
        orderCount: dto.orderIds.length,
        mergedOrderIds: dto.orderIds,
        tableNumber: orders[0].tableNumber,
      },
    });

    return {
      payment: primaryPayment,
      mergedOrders: orders.map((o) => ({
        id: o.id,
        orderId: o.orderId,
        tableNumber: o.tableNumber,
        totalAmount: o.totalAmount,
        items: o.items,
      })),
    };
  }

  async findAll(today?: boolean, paymentMethod?: PaymentMethod, branchId?: number) {
    const where: any = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (today) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      where.createdAt = { gte: startOfDay };
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    return this.prisma.payment.findMany({
      where,
      include: {
        order: {
          include: {
            items: {
              include: { menuItem: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: {
              include: { menuItem: true },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async findByReceiptNumber(receiptNumber: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { receiptNumber },
      include: {
        order: {
          include: {
            items: {
              include: { menuItem: true },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment with receipt ${receiptNumber} not found`,
      );
    }

    return payment;
  }

  async findByOrderId(orderId: number) {
    return this.prisma.payment.findMany({
      where: { orderId },
      include: {
        order: {
          include: {
            items: {
              include: { menuItem: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTodaySummary(branchId?: number) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const where: any = {
      createdAt: { gte: startOfDay },
      paymentStatus: PaymentStatus.PAID,
    };
    if (branchId) where.branchId = branchId;

    const payments = await this.prisma.payment.findMany({ where });

    const summary = {
      totalRevenue: 0,
      totalTransactions: payments.length,
      byMethod: {
        CASH: { count: 0, amount: 0 },
        TRANSFER: { count: 0, amount: 0 },
        CREDIT_CARD: { count: 0, amount: 0 },
      },
      totalDiscount: 0,
      totalPointsDiscount: 0,
      totalPromotionDiscount: 0,
      totalPointsEarned: 0,
      totalPointsRedeemed: 0,
    };

    for (const payment of payments) {
      summary.totalRevenue += payment.totalAmount;
      summary.totalDiscount += payment.discountAmount + payment.promotionDiscount;
      summary.totalPointsDiscount += payment.discountAmount;
      summary.totalPromotionDiscount += payment.promotionDiscount;
      summary.totalPointsEarned += payment.pointsEarned;
      summary.totalPointsRedeemed += payment.discountPoints;

      const method = payment.paymentMethod as keyof typeof summary.byMethod;
      if (summary.byMethod[method]) {
        summary.byMethod[method].count++;
        summary.byMethod[method].amount += payment.totalAmount;
      }
    }

    return summary;
  }

  async refundPayment(id: number) {
    const payment = await this.findOne(id);

    if (payment.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Can only refund paid payments');
    }

    // Update payment status
    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        paymentStatus: PaymentStatus.REFUNDED,
      },
      include: {
        order: {
          include: {
            items: {
              include: { menuItem: true },
            },
          },
        },
      },
    });

    // Decrement promotion usage if applicable
    if (payment.promotionId) {
      await this.promotionsService.decrementUsage(payment.promotionId);
    }

    // Restore member points if applicable
    if (payment.memberId) {
      // Restore redeemed points
      if (payment.discountPoints > 0) {
        await this.membersService.addPoints(
          payment.memberId,
          payment.discountPoints,
        );
      }
      // Deduct earned points
      if (payment.pointsEarned > 0) {
        try {
          await this.membersService.redeemPoints(
            payment.memberId,
            payment.pointsEarned,
          );
        } catch {
          // If member doesn't have enough points to deduct, skip
        }
      }
    }

    // Emit webhook event
    this.eventEmitter.emit('payment.refunded', { data: updated, branchId: updated.branchId });

    // Audit log
    this.auditService.log({
      action: 'PAYMENT_REFUNDED',
      entityType: 'PAYMENT',
      entityId: updated.id,
      entityRef: updated.receiptNumber,
      performedBy: payment.cashierName ?? undefined,
      branchId: updated.branchId ?? undefined,
      oldValues: {
        paymentStatus: 'PAID',
        totalAmount: payment.totalAmount,
      },
      newValues: {
        paymentStatus: 'REFUNDED',
      },
      metadata: {
        orderId: payment.orderId,
        receiptNumber: payment.receiptNumber,
        memberId: payment.memberId,
        promotionId: payment.promotionId,
      },
    });

    return updated;
  }
}
