import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import {
  CreateIngredientDto,
  UpdateIngredientDto,
  CreateRecipeDto,
  AdjustStockDto,
} from './dto';
import { TransactionType } from '@prisma/client';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ===== INGREDIENTS =====

  @Post('ingredients')
  @ApiOperation({ summary: 'Create ingredient' })
  @ApiResponse({ status: 201, description: 'Ingredient created' })
  createIngredient(@Body() dto: CreateIngredientDto) {
    return this.inventoryService.createIngredient(dto);
  }

  @Get('ingredients')
  @ApiOperation({ summary: 'Get all ingredients' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of ingredients' })
  findAllIngredients(@Query('isActive') isActive?: string) {
    const active = isActive !== undefined ? isActive === 'true' : undefined;
    return this.inventoryService.findAllIngredients(active);
  }

  @Get('ingredients/:id')
  @ApiOperation({ summary: 'Get ingredient by ID' })
  @ApiResponse({ status: 200, description: 'Ingredient details' })
  findOneIngredient(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.findOneIngredient(id);
  }

  @Put('ingredients/:id')
  @ApiOperation({ summary: 'Update ingredient' })
  @ApiResponse({ status: 200, description: 'Ingredient updated' })
  updateIngredient(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIngredientDto,
  ) {
    return this.inventoryService.updateIngredient(id, dto);
  }

  @Delete('ingredients/:id')
  @ApiOperation({ summary: 'Delete ingredient' })
  @ApiResponse({ status: 200, description: 'Ingredient deleted' })
  deleteIngredient(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.deleteIngredient(id);
  }

  // ===== RECIPES =====

  @Post('recipes')
  @ApiOperation({ summary: 'Set recipe for menu item' })
  @ApiResponse({ status: 201, description: 'Recipe saved' })
  setRecipe(@Body() dto: CreateRecipeDto) {
    return this.inventoryService.setRecipe(dto);
  }

  @Get('recipes')
  @ApiOperation({ summary: 'Get all recipes' })
  @ApiResponse({ status: 200, description: 'List of recipes' })
  getAllRecipes() {
    return this.inventoryService.getAllRecipes();
  }

  @Get('recipes/:menuItemId')
  @ApiOperation({ summary: 'Get recipe for a menu item' })
  @ApiResponse({ status: 200, description: 'Recipe details' })
  getRecipe(@Param('menuItemId', ParseIntPipe) menuItemId: number) {
    return this.inventoryService.getRecipe(menuItemId);
  }

  @Delete('recipes/:menuItemId')
  @ApiOperation({ summary: 'Delete recipe for menu item' })
  @ApiResponse({ status: 200, description: 'Recipe deleted' })
  deleteRecipe(@Param('menuItemId', ParseIntPipe) menuItemId: number) {
    return this.inventoryService.deleteRecipe(menuItemId);
  }

  // ===== STOCK OPERATIONS =====

  @Post('stock/adjust')
  @ApiOperation({ summary: 'Adjust ingredient stock' })
  @ApiResponse({ status: 200, description: 'Stock adjusted' })
  adjustStock(@Body() dto: AdjustStockDto) {
    return this.inventoryService.adjustStock(dto);
  }

  // ===== ALERTS & MONITORING =====

  @Get('alerts/low-stock')
  @ApiOperation({ summary: 'Get low stock alerts' })
  @ApiResponse({ status: 200, description: 'Low stock ingredients' })
  getLowStockAlerts() {
    return this.inventoryService.getLowStockAlerts();
  }

  @Get('menu-availability')
  @ApiOperation({ summary: 'Get menu item availability based on stock' })
  @ApiResponse({ status: 200, description: 'Menu availability list' })
  getMenuAvailability() {
    return this.inventoryService.getMenuAvailability();
  }

  @Get('stock-overview')
  @ApiOperation({ summary: 'Get stock overview' })
  @ApiResponse({ status: 200, description: 'Stock overview data' })
  getStockOverview() {
    return this.inventoryService.getStockOverview();
  }

  // ===== TRANSACTIONS =====

  @Get('transactions')
  @ApiOperation({ summary: 'Get inventory transactions' })
  @ApiQuery({ name: 'ingredientId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: TransactionType })
  @ApiResponse({ status: 200, description: 'Transaction history' })
  getTransactions(
    @Query('ingredientId') ingredientId?: string,
    @Query('type') type?: TransactionType,
  ) {
    return this.inventoryService.getTransactions({
      ingredientId: ingredientId ? Number(ingredientId) : undefined,
      type,
    });
  }
}
