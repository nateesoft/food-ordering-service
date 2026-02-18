import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../../test/prisma-mock';
import { mockIngredient, mockRecipe } from '../../test/fixtures';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('adjustStock', () => {
    it('should increase stock for STOCK_IN type', async () => {
      const ingredient = mockIngredient({ currentStock: 100 });
      prisma.ingredient.findUnique.mockResolvedValue(ingredient);
      prisma.$transaction.mockResolvedValue([mockIngredient({ currentStock: 150 })]);

      const result = await service.adjustStock({
        ingredientId: 1,
        type: 'STOCK_IN',
        quantity: 50,
      });

      expect(result.currentStock).toBe(150);
    });

    it('should decrease stock for STOCK_OUT type', async () => {
      const ingredient = mockIngredient({ currentStock: 100 });
      prisma.ingredient.findUnique.mockResolvedValue(ingredient);
      prisma.$transaction.mockResolvedValue([mockIngredient({ currentStock: 80 })]);

      const result = await service.adjustStock({
        ingredientId: 1,
        type: 'STOCK_OUT',
        quantity: 20,
      });

      expect(result.currentStock).toBe(80);
    });

    it('should throw BadRequestException when resulting stock is negative', async () => {
      prisma.ingredient.findUnique.mockResolvedValue(mockIngredient({ currentStock: 5 }));

      await expect(
        service.adjustStock({ ingredientId: 1, type: 'STOCK_OUT', quantity: 10 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create inventory transaction record', async () => {
      const ingredient = mockIngredient({ currentStock: 100 });
      prisma.ingredient.findUnique.mockResolvedValue(ingredient);
      prisma.$transaction.mockResolvedValue([mockIngredient({ currentStock: 150 })]);

      await service.adjustStock({
        ingredientId: 1,
        type: 'STOCK_IN',
        quantity: 50,
        notes: 'Restocking',
      });

      // $transaction is called with an array of promises
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.ingredient.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { currentStock: 150 },
      });
      expect(prisma.inventoryTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ingredientId: 1,
          type: 'STOCK_IN',
          quantity: 50,
          previousStock: 100,
          newStock: 150,
          notes: 'Restocking',
        }),
      });
    });
  });

  describe('deductStockForOrder', () => {
    it('should return processed=false when no recipes found', async () => {
      prisma.menuItemIngredient.findMany.mockResolvedValue([]);

      const result = await service.deductStockForOrder('ORD-001', [
        { menuItemId: 1, quantity: 2 },
      ]);

      expect(result.processed).toBe(false);
      expect(result.results).toEqual([]);
    });

    it('should calculate deductions across shared ingredients', async () => {
      const recipes = [
        mockRecipe({ menuItemId: 1, ingredientId: 1, quantityUsed: 0.5 }),
        mockRecipe({ menuItemId: 2, ingredientId: 1, quantityUsed: 0.3 }),
      ];
      prisma.menuItemIngredient.findMany.mockResolvedValue(recipes);
      prisma.ingredient.findUnique.mockResolvedValue(mockIngredient({ currentStock: 100 }));
      prisma.$transaction.mockResolvedValue([]);

      const result = await service.deductStockForOrder('ORD-001', [
        { menuItemId: 1, quantity: 2 },
        { menuItemId: 2, quantity: 1 },
      ]);

      expect(result.processed).toBe(true);
      // Total deduction: (0.5*2) + (0.3*1) = 1.3
      expect(result.results[0].deducted).toBe(1.3);
      expect(result.results[0].success).toBe(true);
    });

    it('should clamp stock at 0 when deduction exceeds current stock', async () => {
      const recipes = [
        mockRecipe({ menuItemId: 1, ingredientId: 1, quantityUsed: 100 }),
      ];
      prisma.menuItemIngredient.findMany.mockResolvedValue(recipes);
      prisma.ingredient.findUnique.mockResolvedValue(mockIngredient({ currentStock: 10 }));
      prisma.$transaction.mockResolvedValue([]);

      await service.deductStockForOrder('ORD-001', [{ menuItemId: 1, quantity: 1 }]);

      expect(prisma.ingredient.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { currentStock: 0 }, // Math.max(0, 10 - 100)
      });
    });

    it('should handle ingredient failure gracefully and continue', async () => {
      const recipes = [
        mockRecipe({ menuItemId: 1, ingredientId: 1, quantityUsed: 1 }),
        mockRecipe({ menuItemId: 2, ingredientId: 2, quantityUsed: 1, ingredient: mockIngredient({ id: 2, name: 'Salt' }) }),
      ];
      prisma.menuItemIngredient.findMany.mockResolvedValue(recipes);
      prisma.ingredient.findUnique
        .mockResolvedValueOnce(null) // ingredient 1 not found
        .mockResolvedValueOnce(mockIngredient({ id: 2, currentStock: 50 }));
      prisma.$transaction.mockResolvedValue([]);

      const result = await service.deductStockForOrder('ORD-001', [
        { menuItemId: 1, quantity: 1 },
        { menuItemId: 2, quantity: 1 },
      ]);

      expect(result.results).toHaveLength(2);
      expect(result.results[0].success).toBe(false);
      expect(result.results[1].success).toBe(true);
    });
  });

  describe('restoreStockForOrder', () => {
    it('should restore stock per recipe for cancelled order', async () => {
      const recipes = [
        mockRecipe({ menuItemId: 1, ingredientId: 1, quantityUsed: 0.5 }),
      ];
      prisma.menuItemIngredient.findMany.mockResolvedValue(recipes);
      prisma.ingredient.findUnique.mockResolvedValue(mockIngredient({ currentStock: 50 }));
      prisma.$transaction.mockResolvedValue([]);

      await service.restoreStockForOrder('ORD-001', [{ menuItemId: 1, quantity: 2 }]);

      expect(prisma.ingredient.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { currentStock: 51 }, // 50 + (0.5 * 2)
      });
      expect(prisma.inventoryTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'ADJUSTMENT',
          quantity: 1,
          orderId: 'ORD-001',
        }),
      });
    });

    it('should return early when no recipes found', async () => {
      prisma.menuItemIngredient.findMany.mockResolvedValue([]);

      await service.restoreStockForOrder('ORD-001', [{ menuItemId: 1, quantity: 1 }]);

      expect(prisma.ingredient.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('checkBulkAvailability', () => {
    it('should return empty array when all items have sufficient stock', async () => {
      const recipes = [
        mockRecipe({
          menuItemId: 1,
          ingredientId: 1,
          quantityUsed: 0.5,
          ingredient: mockIngredient({ currentStock: 100 }),
        }),
      ];
      prisma.menuItemIngredient.findMany.mockResolvedValue(recipes);

      const result = await service.checkBulkAvailability([
        { menuItemId: 1, quantity: 2 },
      ]);

      expect(result).toEqual([]);
    });

    it('should return unavailable items when stock is insufficient', async () => {
      const recipes = [
        mockRecipe({
          menuItemId: 1,
          ingredientId: 1,
          quantityUsed: 10,
          ingredient: mockIngredient({ currentStock: 5, name: 'Rice', unit: 'kg' }),
        }),
      ];
      prisma.menuItemIngredient.findMany.mockResolvedValue(recipes);

      const result = await service.checkBulkAvailability([
        { menuItemId: 1, quantity: 2 },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].menuItemId).toBe(1);
      expect(result[0].insufficientIngredients).toHaveLength(1);
    });

    it('should skip items with no recipes', async () => {
      prisma.menuItemIngredient.findMany.mockResolvedValue([]);

      const result = await service.checkBulkAvailability([
        { menuItemId: 99, quantity: 1 },
      ]);

      expect(result).toEqual([]);
    });
  });

  describe('findOneIngredient', () => {
    it('should throw NotFoundException when ingredient not found', async () => {
      prisma.ingredient.findUnique.mockResolvedValue(null);

      await expect(service.findOneIngredient(999)).rejects.toThrow(NotFoundException);
    });
  });
});
