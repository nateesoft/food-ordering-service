import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MembersService } from '../members/members.service';
import { PromotionsService } from '../promotions/promotions.service';
import { AuditService } from '../audit/audit.service';
import { createMockPrismaService, MockPrismaService } from '../../test/prisma-mock';
import { mockOrder, mockPayment } from '../../test/fixtures';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: MockPrismaService;
  let membersService: Record<string, jest.Mock>;
  let promotionsService: Record<string, jest.Mock>;
  let eventEmitter: { emit: jest.Mock };
  let auditService: { log: jest.Mock };

  beforeEach(async () => {
    prisma = createMockPrismaService();
    membersService = {
      findByMemberId: jest.fn(),
      redeemPoints: jest.fn(),
      addPoints: jest.fn(),
    };
    promotionsService = {
      validateCoupon: jest.fn(),
      findOne: jest.fn(),
      calculateDiscountAmount: jest.fn(),
      incrementUsage: jest.fn(),
      decrementUsage: jest.fn(),
    };
    eventEmitter = { emit: jest.fn() };
    auditService = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MembersService, useValue: membersService },
        { provide: PromotionsService, useValue: promotionsService },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const baseDto = {
    orderId: 1,
    paymentMethod: 'CASH' as any,
    paidAmount: 300,
  };

  describe('createPayment', () => {
    beforeEach(() => {
      const order = mockOrder({ totalAmount: 250, payments: [] });
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.findFirst.mockResolvedValue(null); // no existing receipt
      prisma.payment.create.mockResolvedValue(mockPayment({ totalAmount: 250 }));
    });

    it('should throw NotFoundException when order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.createPayment(baseDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when order is CANCELLED', async () => {
      prisma.order.findUnique.mockResolvedValue(
        mockOrder({ status: 'CANCELLED', payments: [] }),
      );

      await expect(service.createPayment(baseDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when order already paid', async () => {
      prisma.order.findUnique.mockResolvedValue(
        mockOrder({ payments: [{ paymentStatus: 'PAID', receiptNumber: 'RCP-001' }] }),
      );

      await expect(service.createPayment(baseDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when payment is insufficient', async () => {
      await expect(
        service.createPayment({ ...baseDto, paidAmount: 100 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate change for CASH payments', async () => {
      await service.createPayment(baseDto);

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          changeAmount: 50, // 300 - 250
          paymentMethod: 'CASH',
        }),
        include: expect.any(Object),
      });
    });

    it('should set change to 0 for non-CASH payments', async () => {
      await service.createPayment({
        ...baseDto,
        paymentMethod: 'TRANSFER' as any,
        paidAmount: 250,
      });

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ changeAmount: 0 }),
        include: expect.any(Object),
      });
    });

    it('should handle member point discount', async () => {
      membersService.findByMemberId.mockResolvedValue({
        memberId: 'M001',
        name: 'Member',
        points: 100,
      });

      await service.createPayment({
        ...baseDto,
        memberId: 'M001',
        discountPoints: 50,
        paidAmount: 250,
      });

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          discountPoints: 50,
          discountAmount: 50,
          totalAmount: 200, // 250 - 50
          memberId: 'M001',
        }),
        include: expect.any(Object),
      });
      expect(membersService.redeemPoints).toHaveBeenCalledWith('M001', 50);
    });

    it('should throw BadRequestException for insufficient member points', async () => {
      membersService.findByMemberId.mockResolvedValue({
        memberId: 'M001',
        name: 'Member',
        points: 10,
      });

      await expect(
        service.createPayment({
          ...baseDto,
          memberId: 'M001',
          discountPoints: 50,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate and apply coupon discount', async () => {
      promotionsService.validateCoupon.mockResolvedValue({
        valid: true,
        promotion: { id: 1, name: 'Summer10' },
        discountAmount: 25,
      });

      await service.createPayment({
        ...baseDto,
        couponCode: 'SUMMER10',
      });

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          promotionId: 1,
          promotionDiscount: 25,
          promotionName: 'Summer10',
          couponCode: 'SUMMER10',
          totalAmount: 225, // 250 - 25
        }),
        include: expect.any(Object),
      });
      expect(promotionsService.incrementUsage).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException for invalid coupon', async () => {
      promotionsService.validateCoupon.mockResolvedValue({
        valid: false,
        message: 'Coupon expired',
      });

      await expect(
        service.createPayment({ ...baseDto, couponCode: 'EXPIRED' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should apply promotion discount via promotionId', async () => {
      promotionsService.findOne.mockResolvedValue({ id: 2, name: '20% Off' });
      promotionsService.calculateDiscountAmount.mockReturnValue(50);

      await service.createPayment({
        ...baseDto,
        promotionId: 2,
      });

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          promotionId: 2,
          promotionDiscount: 50,
          totalAmount: 200, // 250 - 50
        }),
        include: expect.any(Object),
      });
    });

    it('should calculate points earned (1 per 25 baht)', async () => {
      membersService.findByMemberId.mockResolvedValue({
        memberId: 'M001',
        name: 'Member',
        points: 100,
      });

      await service.createPayment({
        ...baseDto,
        memberId: 'M001',
        paidAmount: 250,
      });

      // 250 / 25 = 10 points
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ pointsEarned: 10 }),
        include: expect.any(Object),
      });
      expect(membersService.addPoints).toHaveBeenCalledWith('M001', 10);
    });

    it('should handle split payments with sum of amounts', async () => {
      await service.createPayment({
        ...baseDto,
        splitPayments: [
          { method: 'CASH', amount: 150 },
          { method: 'TRANSFER', amount: 100 },
        ],
        paidAmount: 250,
      });

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          paidAmount: 250,
          splitPayments: [
            { method: 'CASH', amount: 150 },
            { method: 'TRANSFER', amount: 100 },
          ],
        }),
        include: expect.any(Object),
      });
    });

    it('should emit payment.completed event', async () => {
      await service.createPayment(baseDto);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'payment.completed',
        expect.any(Object),
      );
    });

    it('should retry receipt number on P2002 unique constraint violation', async () => {
      prisma.payment.create
        .mockRejectedValueOnce({ code: 'P2002' })
        .mockResolvedValueOnce(mockPayment());

      await service.createPayment(baseDto);

      expect(prisma.payment.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('refundPayment', () => {
    it('should throw BadRequestException when payment is not PAID', async () => {
      prisma.payment.findUnique.mockResolvedValue(
        mockPayment({ paymentStatus: 'REFUNDED' }),
      );

      await expect(service.refundPayment(1)).rejects.toThrow(BadRequestException);
    });

    it('should update status to REFUNDED', async () => {
      prisma.payment.findUnique.mockResolvedValue(mockPayment());
      prisma.payment.update.mockResolvedValue(mockPayment({ paymentStatus: 'REFUNDED' }));

      const result = await service.refundPayment(1);

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { paymentStatus: 'REFUNDED' },
        include: expect.any(Object),
      });
    });

    it('should decrement promotion usage when promotion was applied', async () => {
      prisma.payment.findUnique.mockResolvedValue(
        mockPayment({ promotionId: 5 }),
      );
      prisma.payment.update.mockResolvedValue(
        mockPayment({ paymentStatus: 'REFUNDED', promotionId: 5 }),
      );

      await service.refundPayment(1);

      expect(promotionsService.decrementUsage).toHaveBeenCalledWith(5);
    });

    it('should restore redeemed points and deduct earned points on refund', async () => {
      prisma.payment.findUnique.mockResolvedValue(
        mockPayment({
          memberId: 'M001',
          discountPoints: 30,
          pointsEarned: 10,
        }),
      );
      prisma.payment.update.mockResolvedValue(
        mockPayment({ paymentStatus: 'REFUNDED', memberId: 'M001' }),
      );

      await service.refundPayment(1);

      expect(membersService.addPoints).toHaveBeenCalledWith('M001', 30);
      expect(membersService.redeemPoints).toHaveBeenCalledWith('M001', 10);
    });

    it('should emit payment.refunded event', async () => {
      prisma.payment.findUnique.mockResolvedValue(mockPayment());
      prisma.payment.update.mockResolvedValue(
        mockPayment({ paymentStatus: 'REFUNDED' }),
      );

      await service.refundPayment(1);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'payment.refunded',
        expect.any(Object),
      );
    });

    it('should audit log with PAYMENT_REFUNDED', async () => {
      prisma.payment.findUnique.mockResolvedValue(mockPayment());
      prisma.payment.update.mockResolvedValue(
        mockPayment({ paymentStatus: 'REFUNDED' }),
      );

      await service.refundPayment(1);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PAYMENT_REFUNDED' }),
      );
    });
  });

  describe('createMergedPayment', () => {
    it('should throw BadRequestException when orders from different tables', async () => {
      prisma.order.findMany.mockResolvedValue([
        mockOrder({ id: 1, tableNumber: 'A1', payments: [] }),
        mockOrder({ id: 2, tableNumber: 'B2', payments: [] }),
      ]);

      await expect(
        service.createMergedPayment({
          orderIds: [1, 2],
          paymentMethod: 'CASH' as any,
          paidAmount: 500,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
