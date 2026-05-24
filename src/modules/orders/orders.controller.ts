import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, SplitOrderDto } from './dto';
import { OrderStatus } from '@prisma/client';
import { BranchId } from '../../common/decorators/branch-id.decorator';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  async create(
    @BranchId() branchId: string,
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieSessionId: string | undefined = (req.cookies as Record<string, string>)?.['session_id'];
    const result = await this.ordersService.create(createOrderDto, branchId, cookieSessionId);

    const sessionIdToSet = result.newSessionId ?? createOrderDto.sessionId ?? cookieSessionId;
    if (sessionIdToSet) {
      res.cookie('session_id', sessionIdToSet, {
        httpOnly: false,
        maxAge: 3 * 60 * 60 * 1000,
        sameSite: 'lax',
        path: '/',
      });
    }

    return result.order;
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'tableNumber', required: false })
  @ApiQuery({ name: 'sessionId', required: false })
  @ApiResponse({ status: 200, description: 'List of orders' })
  findAll(
    @BranchId() branchId: string,
    @Query('status') status?: OrderStatus,
    @Query('tableNumber') tableNumber?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.ordersService.findAll(status, tableNumber, branchId, sessionId);
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today orders' })
  @ApiResponse({ status: 200, description: 'List of today orders' })
  getTodayOrders(@BranchId() branchId: string) {
    return this.ordersService.getTodayOrders(branchId);
  }

  @Get('unpaid')
  @ApiOperation({ summary: 'Get unpaid orders (COMPLETED/DELIVERED without PAID payment)' })
  @ApiResponse({ status: 200, description: 'List of unpaid orders' })
  getUnpaidOrders(@BranchId() branchId: string) {
    return this.ordersService.findUnpaidOrders(branchId);
  }

  @Get('table/:tableNumber')
  @ApiOperation({ summary: 'Get orders by table number' })
  @ApiResponse({ status: 200, description: 'List of orders for table' })
  getOrdersByTable(
    @BranchId() branchId: string,
    @Param('tableNumber') tableNumber: string,
  ) {
    return this.ordersService.getOrdersByTable(tableNumber, branchId);
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

  @Post(':id/split')
  @ApiOperation({ summary: 'Split an order into multiple sub-orders' })
  @ApiResponse({ status: 201, description: 'Order split successfully' })
  @ApiResponse({ status: 400, description: 'Invalid split request' })
  splitOrder(
    @BranchId() branchId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() splitOrderDto: SplitOrderDto,
  ) {
    return this.ordersService.splitOrder(id, splitOrderDto, branchId);
  }

  @Patch('complete-by-table/:tableNumber')
  @ApiOperation({ summary: 'Mark all PREPARING orders for a table as COMPLETED (request payment)' })
  @ApiResponse({ status: 200, description: 'Orders completed' })
  completeOrdersByTable(
    @BranchId() branchId: string,
    @Param('tableNumber') tableNumber: string,
  ) {
    return this.ordersService.completeOrdersByTable(tableNumber, branchId);
  }

  @Patch(':id/status')
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
