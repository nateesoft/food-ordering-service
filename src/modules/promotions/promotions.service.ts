import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePromotionDto, UpdatePromotionDto, ValidateCouponDto } from './dto';
import { PromotionType, PromotionStatus } from '@prisma/client';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePromotionDto, branchId?: number) {
    const data: any = {
      name: dto.name,
      description: dto.description,
      type: dto.type,
      discountValue: dto.discountValue,
      maxDiscount: dto.maxDiscount,
      couponCode: dto.couponCode ? dto.couponCode.toUpperCase() : null,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      startTime: dto.startTime,
      endTime: dto.endTime,
      minOrderAmount: dto.minOrderAmount,
      categories: dto.categories || [],
      maxUses: dto.maxUses,
      branchId: branchId || null,
    };

    return this.prisma.promotion.create({ data });
  }

  async findAll(branchId?: number, status?: PromotionStatus) {
    const where: any = {};
    if (branchId) {
      where.OR = [{ branchId }, { branchId: null }];
    }
    if (status) {
      where.status = status;
    }

    return this.prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
    });
    if (!promotion) {
      throw new NotFoundException(`Promotion #${id} not found`);
    }
    return promotion;
  }

  async update(id: number, dto: UpdatePromotionDto) {
    await this.findOne(id);

    const data: any = { ...dto };
    if (dto.couponCode) {
      data.couponCode = dto.couponCode.toUpperCase();
    }
    if (dto.startDate) {
      data.startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      data.endDate = new Date(dto.endDate);
    }

    return this.prisma.promotion.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.prisma.promotion.update({
      where: { id },
      data: { status: PromotionStatus.INACTIVE },
    });
  }

  async getAvailablePromotions(branchId?: number, subtotal?: number) {
    const now = new Date();

    const where: any = {
      status: PromotionStatus.ACTIVE,
      startDate: { lte: now },
      endDate: { gte: now },
      type: { not: PromotionType.COUPON },
    };

    if (branchId) {
      where.OR = [{ branchId }, { branchId: null }];
    }

    const promotions = await this.prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return promotions.filter((promo) => {
      // Check max uses
      if (promo.maxUses !== null && promo.currentUses >= promo.maxUses) {
        return false;
      }
      // Check min order amount
      if (
        subtotal !== undefined &&
        promo.minOrderAmount !== null &&
        subtotal < promo.minOrderAmount
      ) {
        return false;
      }
      // Check Happy Hour time
      if (promo.type === PromotionType.HAPPY_HOUR) {
        return this.isWithinTimeRange(promo.startTime, promo.endTime);
      }
      return true;
    });
  }

  async validateCoupon(dto: ValidateCouponDto, branchId?: number) {
    const { couponCode, subtotal } = dto;

    const promotion = await this.prisma.promotion.findUnique({
      where: { couponCode: couponCode.toUpperCase() },
    });

    if (!promotion) {
      return { valid: false, message: 'ไม่พบรหัสคูปองนี้' };
    }

    if (promotion.status !== PromotionStatus.ACTIVE) {
      return { valid: false, message: 'คูปองนี้ไม่ได้เปิดใช้งาน' };
    }

    const now = new Date();
    if (now < promotion.startDate || now > promotion.endDate) {
      return { valid: false, message: 'คูปองนี้หมดอายุแล้วหรือยังไม่เริ่มใช้งาน' };
    }

    if (promotion.maxUses !== null && promotion.currentUses >= promotion.maxUses) {
      return { valid: false, message: 'คูปองนี้ถูกใช้งานครบจำนวนแล้ว' };
    }

    if (
      promotion.minOrderAmount !== null &&
      subtotal < promotion.minOrderAmount
    ) {
      return {
        valid: false,
        message: `ยอดสั่งซื้อขั้นต่ำ ${promotion.minOrderAmount} บาท`,
      };
    }

    if (branchId && promotion.branchId !== null && promotion.branchId !== branchId) {
      return { valid: false, message: 'คูปองนี้ไม่สามารถใช้ได้กับสาขานี้' };
    }

    const discountAmount = this.calculateDiscountAmount(promotion, subtotal);

    return {
      valid: true,
      promotion,
      discountAmount,
      message: `ใช้คูปอง "${promotion.name}" สำเร็จ ลด ${discountAmount} บาท`,
    };
  }

  calculateDiscountAmount(
    promotion: { type: PromotionType; discountValue: number; maxDiscount: number | null },
    subtotal: number,
  ): number {
    if (
      promotion.type === PromotionType.PERCENTAGE ||
      promotion.type === PromotionType.HAPPY_HOUR
    ) {
      const discount = (subtotal * promotion.discountValue) / 100;
      if (promotion.maxDiscount !== null) {
        return Math.min(discount, promotion.maxDiscount);
      }
      return Math.round(discount * 100) / 100;
    }
    // FIXED_AMOUNT or COUPON with fixed
    return Math.min(promotion.discountValue, subtotal);
  }

  async calculateDiscount(promotionId: number, subtotal: number) {
    const promotion = await this.findOne(promotionId);
    return this.calculateDiscountAmount(promotion, subtotal);
  }

  async incrementUsage(promotionId: number) {
    await this.prisma.promotion.update({
      where: { id: promotionId },
      data: { currentUses: { increment: 1 } },
    });
  }

  async decrementUsage(promotionId: number) {
    const promotion = await this.findOne(promotionId);
    if (promotion.currentUses > 0) {
      await this.prisma.promotion.update({
        where: { id: promotionId },
        data: { currentUses: { decrement: 1 } },
      });
    }
  }

  async getPromotionStats(branchId?: number) {
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const branchFilter: any = branchId
      ? { OR: [{ branchId }, { branchId: null }] }
      : {};

    const [totalActive, todayPayments] = await Promise.all([
      this.prisma.promotion.count({
        where: {
          status: PromotionStatus.ACTIVE,
          startDate: { lte: now },
          endDate: { gte: now },
          ...branchFilter,
        },
      }),
      this.prisma.payment.findMany({
        where: {
          promotionId: { not: null },
          paidAt: { gte: todayStart },
          paymentStatus: 'PAID',
        },
        select: {
          promotionDiscount: true,
        },
      }),
    ]);

    const totalUsesToday = todayPayments.length;
    const totalDiscountToday = todayPayments.reduce(
      (sum, p) => sum + p.promotionDiscount,
      0,
    );

    return {
      totalActive,
      totalUsesToday,
      totalDiscountToday,
    };
  }

  private isWithinTimeRange(
    startTime: string | null,
    endTime: string | null,
  ): boolean {
    if (!startTime || !endTime) return true;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }
    // Crosses midnight
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
}
