import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ShiftsService } from './shifts.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../../test/prisma-mock';
import { mockShift, mockUser, mockPayment } from '../../test/fixtures';

describe('ShiftsService', () => {
  let service: ShiftsService;
  let prisma: MockPrismaService;
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    prisma = createMockPrismaService();
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<ShiftsService>(ShiftsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('openShift', () => {
    it('should throw UnauthorizedException for invalid PIN', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.openShift({ pin: '9999', openingAmount: 1000 }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive staff', async () => {
      prisma.user.findUnique.mockResolvedValue(
        mockUser({ isActive: false }),
      );

      await expect(
        service.openShift({ pin: '1234', openingAmount: 1000 }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when an OPEN shift already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser());
      prisma.shift.findFirst.mockResolvedValue(mockShift());

      await expect(
        service.openShift({ pin: '1234', openingAmount: 1000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create shift with correct data and emit event', async () => {
      const staff = mockUser({ id: 5, name: 'Cashier A' });
      prisma.user.findUnique.mockResolvedValue(staff);
      prisma.shift.findFirst.mockResolvedValue(null);
      prisma.shift.count.mockResolvedValue(2);
      const shift = mockShift({ userId: 5, cashierName: 'Cashier A' });
      prisma.shift.create.mockResolvedValue(shift);

      const result = await service.openShift({ pin: '1234', openingAmount: 1000 }, 1);

      expect(prisma.shift.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 5,
          cashierName: 'Cashier A',
          openingAmount: 1000,
          branchId: 1,
        }),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('shift.opened', {
        data: shift,
        branchId: 1,
      });
      expect(result).toEqual(shift);
    });
  });

  describe('closeShift', () => {
    it('should throw NotFoundException when shift not found', async () => {
      prisma.shift.findUnique.mockResolvedValue(null);

      await expect(
        service.closeShift(999, { closingAmount: 5000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when shift is already CLOSED', async () => {
      prisma.shift.findUnique.mockResolvedValue(mockShift({ status: 'CLOSED' }));

      await expect(
        service.closeShift(1, { closingAmount: 5000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should aggregate payments by method and calculate cash difference', async () => {
      prisma.shift.findUnique.mockResolvedValue(mockShift({ openingAmount: 1000 }));
      prisma.payment.findMany.mockResolvedValue([
        mockPayment({ paymentMethod: 'CASH', totalAmount: 200 }),
        mockPayment({ paymentMethod: 'CASH', totalAmount: 300 }),
        mockPayment({ paymentMethod: 'TRANSFER', totalAmount: 150 }),
        mockPayment({ paymentMethod: 'CREDIT_CARD', totalAmount: 100 }),
      ]);
      const closedShift = mockShift({ status: 'CLOSED' });
      prisma.shift.update.mockResolvedValue(closedShift);

      await service.closeShift(1, { closingAmount: 1450 });

      expect(prisma.shift.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'CLOSED',
          cashTotal: 500,
          transferTotal: 150,
          creditCardTotal: 100,
          totalRevenue: 750,
          totalOrders: 4,
          expectedCashAmount: 1500, // 1000 + 500
          cashDifference: -50, // 1450 - 1500
        }),
      });
    });

    it('should emit shift.closed event', async () => {
      prisma.shift.findUnique.mockResolvedValue(mockShift());
      prisma.payment.findMany.mockResolvedValue([]);
      const closedShift = mockShift({ status: 'CLOSED' });
      prisma.shift.update.mockResolvedValue(closedShift);

      await service.closeShift(1, { closingAmount: 1000 });

      expect(eventEmitter.emit).toHaveBeenCalledWith('shift.closed', {
        data: closedShift,
        branchId: closedShift.branchId,
      });
    });
  });

  describe('getActiveShift', () => {
    it('should return OPEN shift for branch', async () => {
      const shift = mockShift();
      prisma.shift.findFirst.mockResolvedValue(shift);

      const result = await service.getActiveShift(1);

      expect(result).toEqual(shift);
      expect(prisma.shift.findFirst).toHaveBeenCalledWith({
        where: { status: 'OPEN', branchId: 1 },
      });
    });

    it('should return null when no active shift', async () => {
      prisma.shift.findFirst.mockResolvedValue(null);

      const result = await service.getActiveShift(1);
      expect(result).toBeNull();
    });
  });
});
