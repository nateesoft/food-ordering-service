import {
  Controller,
  Get,
  Post,
  Patch,
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
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrderStatus } from '@prisma/client';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'tableNumber', required: false })
  @ApiResponse({ status: 200, description: 'List of orders' })
  findAll(
    @Query('status') status?: OrderStatus,
    @Query('tableNumber') tableNumber?: string,
  ) {
    return this.ordersService.findAll(status, tableNumber);
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today orders' })
  @ApiResponse({ status: 200, description: 'List of today orders' })
  getTodayOrders() {
    return this.ordersService.getTodayOrders();
  }

  @Get('table/:tableNumber')
  @ApiOperation({ summary: 'Get orders by table number' })
  @ApiResponse({ status: 200, description: 'List of orders for table' })
  getOrdersByTable(@Param('tableNumber') tableNumber: string) {
    return this.ordersService.getOrdersByTable(tableNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Get('order-id/:orderId')
  @ApiOperation({ summary: 'Get order by order ID string' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findByOrderId(@Param('orderId') orderId: string) {
    return this.ordersService.findByOrderId(orderId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateStatusDto);
  }

  @Patch(':orderId/items/:itemId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order item status' })
  @ApiResponse({ status: 200, description: 'Order item status updated' })
  updateItemStatus(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body('status') status: string,
  ) {
    return this.ordersService.updateItemStatus(orderId, itemId, status);
  }
}
