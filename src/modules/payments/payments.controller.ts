import {
  Controller,
  Get,
  Post,
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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, CreateMergedPaymentDto } from './dto';
import { PaymentMethod } from '@prisma/client';
import { BranchId } from '../../common/decorators/branch-id.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create payment for an order' })
  @ApiResponse({ status: 201, description: 'Payment created' })
  @ApiResponse({ status: 400, description: 'Invalid payment' })
  @ApiResponse({ status: 409, description: 'Order already paid' })
  create(@BranchId() branchId: number, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.createPayment(createPaymentDto, branchId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  @ApiQuery({ name: 'today', required: false, type: Boolean })
  @ApiQuery({ name: 'paymentMethod', required: false, enum: PaymentMethod })
  @ApiResponse({ status: 200, description: 'List of payments' })
  findAll(
    @BranchId() branchId: number,
    @Query('today') today?: string,
    @Query('paymentMethod') paymentMethod?: PaymentMethod,
  ) {
    return this.paymentsService.findAll(
      today === 'true',
      paymentMethod,
      branchId,
    );
  }

  @Get('summary/today')
  @ApiOperation({ summary: 'Get today payment summary' })
  @ApiResponse({ status: 200, description: 'Today payment summary' })
  getTodaySummary(@BranchId() branchId: number) {
    return this.paymentsService.getTodaySummary(branchId);
  }

  @Get('receipt/:receiptNumber')
  @ApiOperation({ summary: 'Get payment by receipt number' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  findByReceipt(@Param('receiptNumber') receiptNumber: string) {
    return this.paymentsService.findByReceiptNumber(receiptNumber);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get payments by order ID' })
  @ApiResponse({ status: 200, description: 'Payments for order' })
  findByOrder(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.paymentsService.findByOrderId(orderId);
  }

  @Post('merge')
  @ApiOperation({ summary: 'Create merged payment for multiple orders (same table)' })
  @ApiResponse({ status: 201, description: 'Merged payment created' })
  @ApiResponse({ status: 400, description: 'Invalid merge request' })
  @ApiResponse({ status: 409, description: 'One or more orders already paid' })
  createMerged(
    @BranchId() branchId: number,
    @Body() dto: CreateMergedPaymentDto,
  ) {
    return this.paymentsService.createMergedPayment(dto, branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund a payment' })
  @ApiResponse({ status: 200, description: 'Payment refunded' })
  @ApiResponse({ status: 400, description: 'Cannot refund' })
  refund(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.refundPayment(id);
  }
}
