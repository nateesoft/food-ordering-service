import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateIngredientDto,
  UpdateIngredientDto,
  CreateRecipeDto,
  AdjustStockDto,
} from './dto';
import { TransactionType } from '@prisma/client';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private prisma: PrismaService) {}

  // ===== INGREDIENT CRUD =====

  async createIngredient(dto: CreateIngredientDto, branchId?: number) {
    return this.prisma.ingredient.create({ data: { ...dto, branchId } });
  }

  async findAllIngredients(isActive?: boolean, branchId?: number) {
    const where: any = {};
    if (branchId) {
      where.branchId = branchId;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    return this.prisma.ingredient.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOneIngredient(id: number) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
    });
    if (!ingredient) {
      throw new NotFoundException(`Ingredient with ID ${id} not found`);
    }
    return ingredient;
  }

  async updateIngredient(id: number, dto: UpdateIngredientDto) {
    await this.findOneIngredient(id);
    return this.prisma.ingredient.update({
      where: { id },
      data: dto,
    });
  }

  async deleteIngredient(id: number) {
    await this.findOneIngredient(id);
    return this.prisma.ingredient.delete({ where: { id } });
  }

  // ===== RECIPE MANAGEMENT =====

  async setRecipe(dto: CreateRecipeDto) {
    // Delete existing recipe, then create new one
    await this.prisma.menuItemIngredient.deleteMany({
      where: { menuItemId: dto.menuItemId },
    });

    if (dto.ingredients.length > 0) {
      await this.prisma.menuItemIngredient.createMany({
        data: dto.ingredients.map((ing) => ({
          menuItemId: dto.menuItemId,
          ingredientId: ing.ingredientId,
          quantityUsed: ing.quantityUsed,
        })),
      });
    }

    return this.getRecipe(dto.menuItemId);
  }

  async getRecipe(menuItemId: number) {
    return this.prisma.menuItemIngredient.findMany({
      where: { menuItemId },
      include: { ingredient: true },
    });
  }

  async getAllRecipes() {
    return this.prisma.menuItem.findMany({
      where: {
        ingredients: { some: {} },
      },
      select: {
        id: true,
        name: true,
        ingredients: {
          include: { ingredient: true },
        },
      },
    });
  }

  async deleteRecipe(menuItemId: number) {
    return this.prisma.menuItemIngredient.deleteMany({
      where: { menuItemId },
    });
  }

  // ===== STOCK OPERATIONS =====

  async adjustStock(dto: AdjustStockDto, performedBy?: string) {
    const ingredient = await this.findOneIngredient(dto.ingredientId);

    const quantityChange =
      dto.type === 'STOCK_OUT' ? -Math.abs(dto.quantity) : dto.quantity;
    const newStock = ingredient.currentStock + quantityChange;

    if (newStock < 0) {
      throw new BadRequestException(
        `Insufficient stock for ${ingredient.name}. Current: ${ingredient.currentStock}, Requested: ${Math.abs(dto.quantity)}`,
      );
    }

    const [updatedIngredient] = await this.prisma.$transaction([
      this.prisma.ingredient.update({
        where: { id: dto.ingredientId },
        data: { currentStock: newStock },
      }),
      this.prisma.inventoryTransaction.create({
        data: {
          ingredientId: dto.ingredientId,
          type: dto.type as TransactionType,
          quantity: quantityChange,
          previousStock: ingredient.currentStock,
          newStock,
          notes: dto.notes,
          performedBy: performedBy || 'ADMIN',
        },
      }),
    ]);

    return updatedIngredient;
  }

  async deductStockForOrder(
    orderId: string,
    items: { menuItemId: number; quantity: number }[],
  ) {
    // Get all recipes for ordered menu items
    const menuItemIds = items.map((i) => i.menuItemId);
    const recipes = await this.prisma.menuItemIngredient.findMany({
      where: { menuItemId: { in: menuItemIds } },
      include: { ingredient: true },
    });

    if (recipes.length === 0) {
      this.logger.log(
        `No recipes found for order ${orderId}, skipping stock deduction`,
      );
      return { orderId, processed: false, results: [] };
    }

    // Calculate total deductions per ingredient
    const deductions = new Map<
      number,
      { ingredientId: number; totalDeduction: number; name: string }
    >();

    for (const item of items) {
      const itemRecipes = recipes.filter(
        (r) => r.menuItemId === item.menuItemId,
      );
      for (const recipe of itemRecipes) {
        const totalNeeded = recipe.quantityUsed * item.quantity;
        const existing = deductions.get(recipe.ingredientId);
        if (existing) {
          existing.totalDeduction += totalNeeded;
        } else {
          deductions.set(recipe.ingredientId, {
            ingredientId: recipe.ingredientId,
            totalDeduction: totalNeeded,
            name: recipe.ingredient.name,
          });
        }
      }
    }

    // Deduct stock in a transaction
    const results: {
      ingredientId: number;
      name: string;
      deducted: number;
      success: boolean;
    }[] = [];

    for (const [ingredientId, deduction] of deductions) {
      try {
        const ingredient = await this.prisma.ingredient.findUnique({
          where: { id: ingredientId },
        });

        if (!ingredient) {
          results.push({
            ingredientId,
            name: deduction.name,
            deducted: 0,
            success: false,
          });
          continue;
        }

        const newStock = ingredient.currentStock - deduction.totalDeduction;

        await this.prisma.$transaction([
          this.prisma.ingredient.update({
            where: { id: ingredientId },
            data: { currentStock: Math.max(0, newStock) },
          }),
          this.prisma.inventoryTransaction.create({
            data: {
              ingredientId,
              type: TransactionType.ORDER_DEDUCTION,
              quantity: -deduction.totalDeduction,
              previousStock: ingredient.currentStock,
              newStock: Math.max(0, newStock),
              orderId,
              notes: `Auto deduction for order ${orderId}`,
              performedBy: 'SYSTEM',
            },
          }),
        ]);

        results.push({
          ingredientId,
          name: deduction.name,
          deducted: deduction.totalDeduction,
          success: true,
        });
      } catch (error) {
        this.logger.error(
          `Failed to deduct ingredient ${ingredientId} for order ${orderId}: ${error}`,
        );
        results.push({
          ingredientId,
          name: deduction.name,
          deducted: 0,
          success: false,
        });
      }
    }

    return { orderId, processed: true, results };
  }

  async restoreStockForOrder(
    orderId: string,
    items: { menuItemId: number; quantity: number }[],
  ) {
    const menuItemIds = items.map((i) => i.menuItemId);
    const recipes = await this.prisma.menuItemIngredient.findMany({
      where: { menuItemId: { in: menuItemIds } },
      include: { ingredient: true },
    });

    if (recipes.length === 0) return;

    // Calculate total restorations per ingredient
    const restorations = new Map<
      number,
      { ingredientId: number; totalRestore: number }
    >();

    for (const item of items) {
      const itemRecipes = recipes.filter(
        (r) => r.menuItemId === item.menuItemId,
      );
      for (const recipe of itemRecipes) {
        const totalRestore = recipe.quantityUsed * item.quantity;
        const existing = restorations.get(recipe.ingredientId);
        if (existing) {
          existing.totalRestore += totalRestore;
        } else {
          restorations.set(recipe.ingredientId, {
            ingredientId: recipe.ingredientId,
            totalRestore,
          });
        }
      }
    }

    for (const [ingredientId, restoration] of restorations) {
      try {
        const ingredient = await this.prisma.ingredient.findUnique({
          where: { id: ingredientId },
        });
        if (!ingredient) continue;

        const newStock = ingredient.currentStock + restoration.totalRestore;

        await this.prisma.$transaction([
          this.prisma.ingredient.update({
            where: { id: ingredientId },
            data: { currentStock: newStock },
          }),
          this.prisma.inventoryTransaction.create({
            data: {
              ingredientId,
              type: TransactionType.ADJUSTMENT,
              quantity: restoration.totalRestore,
              previousStock: ingredient.currentStock,
              newStock,
              orderId,
              notes: `Stock restored - order ${orderId} cancelled`,
              performedBy: 'SYSTEM',
            },
          }),
        ]);
      } catch (error) {
        this.logger.error(
          `Failed to restore ingredient ${ingredientId} for order ${orderId}: ${error}`,
        );
      }
    }
  }

  async checkBulkAvailability(
    items: { menuItemId: number; quantity: number }[],
  ): Promise<
    { menuItemId: number; menuItemName: string; insufficientIngredients: string[] }[]
  > {
    const menuItemIds = items.map((i) => i.menuItemId);
    const recipes = await this.prisma.menuItemIngredient.findMany({
      where: { menuItemId: { in: menuItemIds } },
      include: {
        ingredient: true,
        menuItem: { select: { name: true } },
      },
    });

    const unavailable: {
      menuItemId: number;
      menuItemName: string;
      insufficientIngredients: string[];
    }[] = [];

    for (const item of items) {
      const itemRecipes = recipes.filter(
        (r) => r.menuItemId === item.menuItemId,
      );
      if (itemRecipes.length === 0) continue; // No recipe = no stock check

      const insufficient: string[] = [];
      for (const recipe of itemRecipes) {
        const needed = recipe.quantityUsed * item.quantity;
        if (recipe.ingredient.currentStock < needed) {
          insufficient.push(
            `${recipe.ingredient.name} (need ${needed} ${recipe.ingredient.unit}, have ${recipe.ingredient.currentStock})`,
          );
        }
      }

      if (insufficient.length > 0) {
        unavailable.push({
          menuItemId: item.menuItemId,
          menuItemName: itemRecipes[0]?.menuItem?.name || `Menu #${item.menuItemId}`,
          insufficientIngredients: insufficient,
        });
      }
    }

    return unavailable;
  }

  // ===== ALERTS & MONITORING =====

  async getLowStockAlerts(branchId?: number) {
    // Prisma doesn't support field-to-field comparison, use raw query
    const branchCondition = branchId ? `AND "branchId" = ${branchId}` : '';
    const alerts = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT id, name, unit, "currentStock", "minStock", "costPerUnit", "isActive",
             "minStock" - "currentStock" as deficit
      FROM food_ordering."Ingredient"
      WHERE "currentStock" <= "minStock" AND "isActive" = true ${branchCondition}
      ORDER BY ("minStock" - "currentStock") DESC
    `);
    return alerts;
  }

  async getMenuAvailability(branchId?: number) {
    const where: any = { isActive: true };
    if (branchId) where.branchId = branchId;

    const menuItems = await this.prisma.menuItem.findMany({
      where,
      select: {
        id: true,
        name: true,
        ingredients: {
          include: { ingredient: true },
        },
      },
    });

    return menuItems.map((item) => {
      if (item.ingredients.length === 0) {
        return {
          menuItemId: item.id,
          available: true,
          insufficientIngredients: [],
        };
      }

      const insufficient = item.ingredients
        .filter((r) => r.ingredient.currentStock < r.quantityUsed)
        .map((r) => r.ingredient.name);

      return {
        menuItemId: item.id,
        available: insufficient.length === 0,
        insufficientIngredients: insufficient,
      };
    });
  }

  async getStockOverview(branchId?: number) {
    const where: any = { isActive: true };
    if (branchId) where.branchId = branchId;

    const ingredients = await this.prisma.ingredient.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    const totalIngredients = ingredients.length;
    const lowStock = ingredients.filter(
      (i) => i.currentStock <= i.minStock && i.currentStock > 0,
    ).length;
    const outOfStock = ingredients.filter((i) => i.currentStock <= 0).length;

    return {
      totalIngredients,
      lowStock,
      outOfStock,
      ingredients,
    };
  }

  async getTransactions(filters?: {
    ingredientId?: number;
    type?: TransactionType;
  }) {
    const where: any = {};
    if (filters?.ingredientId) {
      where.ingredientId = filters.ingredientId;
    }
    if (filters?.type) {
      where.type = filters.type;
    }

    return this.prisma.inventoryTransaction.findMany({
      where,
      include: { ingredient: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
