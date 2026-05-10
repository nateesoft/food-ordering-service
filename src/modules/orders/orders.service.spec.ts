import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { AuditService } from '../audit/audit.service';
import { RabbitMQPublisher } from '../rabbitmq/rabbitmq.publisher';
import { createMockPrismaService, MockPrismaService } from '../../test/prisma-mock';
import { mockOrder, mockOrderItem } from '../../test/fixtures';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: MockPrismaService;
  let inventoryService: {
    checkBulkAvailability: jest.Mock;
    deductStockForOrder: jest.Mock;
    restoreStockForOrder: jest.Mock;
  };
  let eventEmitter: { emit: jest.Mock };
  let auditService: { log: jest.Mock };

  beforeEach(async () => {
    prisma = createMockPrismaService();
    prisma.menuItem.findMany.mockResolvedValue([]);
    inventoryService = {
      checkBulkAvailability: jest.fn().mockResolvedValue([]),
      deductStockForOrder: jest.fn().mockResolvedValue({ processed: true, results: [] }),
      restoreStockForOrder: jest.fn().mockResolvedValue(undefined),
    };
    eventEmitter = { emit: jest.fn() };
    auditService = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: InventoryService, useValue: inventoryService },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: AuditService, useValue: auditService },
        { provide: RabbitMQPublisher, useValue: { publish: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      tableNumber: 'A1',
      totalAmount: 250,
      totalItems: 2,
      items: [
        { menuItemId: 1, quantity: 1, price: 150, diningOption: 'DINE_IN' },
        { menuItemId: 2, quantity: 1, price: 100, diningOption: 'DINE_IN' },
      ],
    };

    it('should check availability, create order, deduct stock, and emit event', async () => {
      const order = mockOrder();
      prisma.order.create.mockResolvedValue(order);

      const result = await service.create(createDto, 1);

      expect(inventoryService.checkBulkAvailability).toHaveBeenCalledWith([
        { menuItemId: 1, quantity: 1 },
        { menuItemId: 2, quantity: 1 },
      ]);
      expect(prisma.order.create).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('order.created', {
        data: order,
        branchId: 1,
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ORDER_CREATED' }),
      );
      expect(result).toEqual(order);
    });

    it('should throw BadRequestException when items are out of stock', async () => {
      inventoryService.checkBulkAvailability.mockResolvedValue([
        { menuItemId: 1, menuItemName: 'Rice', insufficientIngredients: ['Rice (need 10, have 5)'] },
      ]);

      await expect(service.create(createDto, 1)).rejects.toThrow(BadRequestException);
      expect(prisma.order.create).not.toHaveBeenCalled();
    });

    it('should generate orderId with ORD- prefix', async () => {
      prisma.order.create.mockResolvedValue(mockOrder());

      await service.create(createDto);

      const createCall = prisma.order.create.mock.calls[0][0];
      expect(createCall.data.orderId).toMatch(/^ORD-/);
    });
  });

  describe('findOne', () => {
    it('should return order with items when found', async () => {
      const order = mockOrder();
      prisma.order.findUnique.mockResolvedValue(order);

      const result = await service.findOne(1);
      expect(result).toEqual(order);
    });

    it('should throw NotFoundException when order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update order status and emit status_changed event', async () => {
      const order = mockOrder({ status: 'PENDING' });
      prisma.order.findUnique.mockResolvedValue(order);
      const updated = mockOrder({ status: 'PREPARING' });
      prisma.order.update.mockResolvedValue(updated);

      const result = await service.updateStatus(1, { status: 'PREPARING' as any });

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'PREPARING' },
        include: expect.any(Object),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('order.status_changed', expect.any(Object));
      expect(result.status).toBe('PREPARING');
    });

    it('should restore stock and emit order.cancelled when cancelling', async () => {
      const order = mockOrder({ status: 'PENDING' });
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.order.update.mockResolvedValue(mockOrder({ status: 'CANCELLED' }));

      await service.updateStatus(1, { status: 'CANCELLED' as any });

      expect(inventoryService.restoreStockForOrder).toHaveBeenCalledWith(
        order.orderId,
        order.items.map((i: any) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('order.cancelled', expect.any(Object));
    });

    it('should NOT restore stock when order is already cancelled', async () => {
      const order = mockOrder({ status: 'CANCELLED' });
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.order.update.mockResolvedValue(order);

      await service.updateStatus(1, { status: 'CANCELLED' as any });

      expect(inventoryService.restoreStockForOrder).not.toHaveBeenCalled();
    });

    it('should audit log with old and new status', async () => {
      const order = mockOrder({ status: 'PENDING' });
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.order.update.mockResolvedValue(mockOrder({ status: 'PREPARING' }));

      await service.updateStatus(1, { status: 'PREPARING' as any });

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ORDER_STATUS_CHANGED',
          oldValues: { status: 'PENDING' },
          newValues: { status: 'PREPARING' },
        }),
      );
    });
  });

  describe('updateItemStatus', () => {
    it('should update individual item status', async () => {
      const order = mockOrder();
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.orderItem.update.mockResolvedValue({ ...order.items[0], status: 'PREPARING' });

      const result = await service.updateItemStatus(1, 1, 'PREPARING');
      expect(prisma.orderItem.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'PREPARING' },
      });
    });

    it('should throw NotFoundException when item not in order', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder());

      await expect(
        service.updateItemStatus(1, 999, 'PREPARING'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('splitOrder', () => {
    const splitDto = {
      groups: [
        { itemIds: [1] },
        { itemIds: [2] },
      ],
    };

    it('should throw NotFoundException when order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.splitOrder(999, splitDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when order is cancelled', async () => {
      prisma.order.findUnique.mockResolvedValue(
        mockOrder({ status: 'CANCELLED', payments: [] }),
      );

      await expect(service.splitOrder(1, splitDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when order is already paid', async () => {
      prisma.order.findUnique.mockResolvedValue(
        mockOrder({ payments: [{ paymentStatus: 'PAID' }] }),
      );

      await expect(service.splitOrder(1, splitDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid item ID', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder({ payments: [] }));

      await expect(
        service.splitOrder(1, { groups: [{ itemIds: [1] }, { itemIds: [999] }] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for duplicate item IDs', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder({ payments: [] }));

      await expect(
        service.splitOrder(1, { groups: [{ itemIds: [1] }, { itemIds: [1] }] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when not all items are assigned', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder({ payments: [] }));

      await expect(
        service.splitOrder(1, { groups: [{ itemIds: [1] }] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create new orders via $transaction and cancel original', async () => {
      const order = mockOrder({ payments: [] });
      prisma.order.findUnique.mockResolvedValue(order);

      const newOrder1 = mockOrder({ id: 10, orderId: 'ORD-NEW-1' });
      const newOrder2 = mockOrder({ id: 11, orderId: 'ORD-NEW-2' });

      // $transaction receives a callback, we mock the tx methods
      prisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          order: {
            create: jest.fn()
              .mockResolvedValueOnce(newOrder1)
              .mockResolvedValueOnce(newOrder2),
            update: jest.fn().mockResolvedValue(mockOrder({ status: 'CANCELLED' })),
          },
        };
        return cb(tx);
      });

      const result = await service.splitOrder(1, splitDto);

      expect(result.originalOrderId).toBe(order.orderId);
      expect(result.splitOrders).toHaveLength(2);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ORDER_SPLIT' }),
      );
    });
  });
});
