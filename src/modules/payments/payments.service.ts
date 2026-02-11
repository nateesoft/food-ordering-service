import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MembersService } from '../members/members.service';
import { CreatePaymentDto } from './dto';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private membersService: MembersService,
  ) {}

  private async generateReceiptNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Count today's payments to get running number
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const count = await this.prisma.payment.count({
      where: {
        createdAt: { gte: startOfDay },
      },
    });

    const runningNumber = String(count + 1).padStart(3, '0');
    return `RCP-${dateStr}-${runningNumber}`;
  }

  async createPayment(dto: CreatePaymentDto) {
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

    // 5. Calculate amounts
    const totalAmount = subtotal - discountAmount;
    const changeAmount =
      dto.paymentMethod === PaymentMethod.CASH
        ? Math.max(0, dto.paidAmount - totalAmount)
        : 0;

    // Validate paid amount
    if (dto.paidAmount < totalAmount) {
      throw new BadRequestException(
        `Insufficient payment. Required: ${totalAmount}, Received: ${dto.paidAmount}`,
      );
    }

    // 6. Generate receipt number
    const receiptNumber = await this.generateReceiptNumber();

    // 7. Calculate points earned (1 point per 25 baht of totalAmount)
    if (memberId) {
      pointsEarned = Math.floor(totalAmount / 25);
    }

    // 8. Create payment
    const payment = await this.prisma.payment.create({
      data: {
        receiptNumber,
        orderId: order.id,
        paymentMethod: dto.paymentMethod,
        paymentStatus: PaymentStatus.PAID,
        subtotal,
        discountAmount,
        discountPoints,
        totalAmount,
        paidAmount: dto.paidAmount,
        changeAmount,
        memberId,
        memberName,
        pointsEarned,
        cashierName: dto.cashierName || null,
        note: dto.note || null,
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

    // 9. Handle member points (redeem + earn)
    if (memberId) {
      if (discountPoints > 0) {
        await this.membersService.redeemPoints(memberId, discountPoints);
      }
      if (pointsEarned > 0) {
        await this.membersService.addPoints(memberId, pointsEarned);
      }
    }

    return payment;
  }

  async findAll(today?: boolean, paymentMethod?: PaymentMethod) {
    const where: any = {};

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

  async getTodaySummary() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: { gte: startOfDay },
        paymentStatus: PaymentStatus.PAID,
      },
    });

    const summary = {
      totalRevenue: 0,
      totalTransactions: payments.length,
      byMethod: {
        CASH: { count: 0, amount: 0 },
        TRANSFER: { count: 0, amount: 0 },
        CREDIT_CARD: { count: 0, amount: 0 },
      },
      totalDiscount: 0,
      totalPointsEarned: 0,
      totalPointsRedeemed: 0,
    };

    for (const payment of payments) {
      summary.totalRevenue += payment.totalAmount;
      summary.totalDiscount += payment.discountAmount;
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

    return updated;
  }
}
