import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenShiftDto, CloseShiftDto } from './dto';
import { ShiftStatus, PaymentStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ShiftsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  private async generateShiftNumber(branchId?: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const where: any = { openedAt: { gte: startOfDay } };
    if (branchId) where.branchId = branchId;

    const count = await this.prisma.shift.count({ where });
    const runningNumber = String(count + 1).padStart(3, '0');
    return `SH-${dateStr}-${runningNumber}`;
  }

  async openShift(dto: OpenShiftDto, branchId?: string) {
    // 1. Verify PIN
    const staff = await this.prisma.user.findUnique({
      where: { pin: dto.pin },
      select: { id: true, name: true, role: true, isActive: true },
    });

    if (!staff) {
      throw new UnauthorizedException('PIN ไม่ถูกต้อง');
    }
    if (!staff.isActive) {
      throw new UnauthorizedException('บัญชีพนักงานถูกระงับ');
    }

    // 2. Check no OPEN shift for this branch
    const existingShift = await this.prisma.shift.findFirst({
      where: { status: ShiftStatus.OPEN, branchId: branchId || null },
    });

    if (existingShift) {
      throw new BadRequestException(
        `มีกะที่เปิดอยู่แล้ว (${existingShift.shiftNumber}) โดย ${existingShift.cashierName}`,
      );
    }

    // 3. Generate shift number and create
    const shiftNumber = await this.generateShiftNumber(branchId);

    const shift = await this.prisma.shift.create({
      data: {
        shiftNumber,
        userId: staff.id,
        cashierName: staff.name,
        branchId,
        openingAmount: dto.openingAmount,
        openingCashCount: dto.openingCashCount || undefined,
        notes: dto.notes || null,
      },
    });

    this.eventEmitter.emit('shift.opened', { data: shift, branchId });

    return shift;
  }

  async closeShift(id: number, dto: CloseShiftDto) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });

    if (!shift) {
      throw new NotFoundException(`ไม่พบกะ ID ${id}`);
    }
    if (shift.status !== ShiftStatus.OPEN) {
      throw new BadRequestException('กะนี้ถูกปิดไปแล้ว');
    }

    // Aggregate payments for this shift
    const payments = await this.prisma.payment.findMany({
      where: { shiftId: id, paymentStatus: PaymentStatus.PAID },
    });

    let cashTotal = 0;
    let transferTotal = 0;
    let creditCardTotal = 0;
    let totalRevenue = 0;

    for (const p of payments) {
      totalRevenue += p.totalAmount;
      switch (p.paymentMethod) {
        case 'CASH':
          cashTotal += p.totalAmount;
          break;
        case 'TRANSFER':
          transferTotal += p.totalAmount;
          break;
        case 'CREDIT_CARD':
          creditCardTotal += p.totalAmount;
          break;
      }
    }

    const expectedCashAmount = shift.openingAmount + cashTotal;
    const cashDifference = dto.closingAmount - expectedCashAmount;

    const closedShift = await this.prisma.shift.update({
      where: { id },
      data: {
        status: ShiftStatus.CLOSED,
        closedAt: new Date(),
        closingAmount: dto.closingAmount,
        closingCashCount: dto.closingCashCount || undefined,
        closingNotes: dto.notes || null,
        expectedCashAmount,
        cashDifference,
        totalRevenue,
        totalOrders: payments.length,
        cashTotal,
        transferTotal,
        creditCardTotal,
      },
    });

    this.eventEmitter.emit('shift.closed', { data: closedShift, branchId: closedShift.branchId });

    return closedShift;
  }

  async getActiveShift(branchId?: string) {
    return this.prisma.shift.findFirst({
      where: { status: ShiftStatus.OPEN, branchId: branchId || null },
    });
  }

  async findAll(
    branchId?: string,
    status?: ShiftStatus,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: any = {};

    if (branchId) where.branchId = branchId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.openedAt = {};
      if (startDate) where.openedAt.gte = startDate;
      if (endDate) where.openedAt.lte = endDate;
    }

    return this.prisma.shift.findMany({
      where,
      orderBy: { openedAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`ไม่พบกะ ID ${id}`);
    }
    return shift;
  }

  async getShiftSummary(id: number) {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: {
        payments: {
          where: { paymentStatus: PaymentStatus.PAID },
          include: {
            order: {
              include: {
                items: { include: { menuItem: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException(`ไม่พบกะ ID ${id}`);
    }

    // Calculate live summary for OPEN shifts
    if (shift.status === ShiftStatus.OPEN) {
      let cashTotal = 0;
      let transferTotal = 0;
      let creditCardTotal = 0;
      let totalRevenue = 0;

      for (const p of shift.payments) {
        totalRevenue += p.totalAmount;
        switch (p.paymentMethod) {
          case 'CASH':
            cashTotal += p.totalAmount;
            break;
          case 'TRANSFER':
            transferTotal += p.totalAmount;
            break;
          case 'CREDIT_CARD':
            creditCardTotal += p.totalAmount;
            break;
        }
      }

      return {
        ...shift,
        totalRevenue,
        totalOrders: shift.payments.length,
        cashTotal,
        transferTotal,
        creditCardTotal,
        expectedCashAmount: shift.openingAmount + cashTotal,
      };
    }

    return shift;
  }
}
