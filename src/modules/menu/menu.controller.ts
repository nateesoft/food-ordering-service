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
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto';
import { BranchId } from '../../common/decorators/branch-id.decorator';
import { ConsoleJwtAuthGuard } from '../console-auth/guards/console-jwt-auth.guard';

@ApiTags('Menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({ summary: 'Get all menu items' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of menu items' })
  findAll(
    @BranchId() branchId: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBoolean =
      isActive !== undefined ? isActive === 'true' : undefined;
    return this.menuService.findAll(category, isActiveBoolean, branchId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all menu categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  getCategories(@BranchId() branchId: string) {
    return this.menuService.getCategories(branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get menu item by ID' })
  @ApiResponse({ status: 200, description: 'Menu item details' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.findOne(id);
  }

  @Post()
  @UseGuards(ConsoleJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new menu item (Console admin only)' })
  @ApiResponse({ status: 201, description: 'Menu item created' })
  create(@BranchId() branchId: string, @Body() createMenuItemDto: CreateMenuItemDto) {
    return this.menuService.create(createMenuItemDto, branchId);
  }

  @Put(':id')
  @UseGuards(ConsoleJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update menu item (Console admin only)' })
  @ApiResponse({ status: 200, description: 'Menu item updated' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
  ) {
    return this.menuService.update(id, updateMenuItemDto);
  }

  @Delete(':id')
  @UseGuards(ConsoleJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete menu item (Console admin only)' })
  @ApiResponse({ status: 200, description: 'Menu item deleted' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.remove(id);
  }
}
