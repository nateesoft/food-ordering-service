import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentGatewayService } from './payment-gateway.service';
import { InitiatePaymentDto } from './dto';
import { BranchId } from '../../common/decorators/branch-id.decorator';

@ApiTags('Payment Gateway')
@Controller('payment-gateway')
export class PaymentGatewayController {
  constructor(private readonly paymentGatewayService: PaymentGatewayService) {}

  @Post()
  @ApiOperation({ summary: 'Initiate a gateway payment' })
  initiate(@Body() dto: InitiatePaymentDto, @BranchId() branchId?: number) {
    return this.paymentGatewayService.initiatePayment(dto, branchId);
  }

  @Get(':transactionId/status')
  @ApiOperation({ summary: 'Check payment status' })
  checkStatus(@Param('transactionId') transactionId: string) {
    return this.paymentGatewayService.checkStatus(transactionId);
  }

  @Post(':transactionId/simulate-complete')
  @ApiOperation({ summary: 'Simulate payment completion (for testing)' })
  simulateComplete(@Param('transactionId') transactionId: string) {
    return this.paymentGatewayService.simulateComplete(transactionId);
  }

  @Get()
  @ApiOperation({ summary: 'List gateway transactions' })
  findAll(@BranchId() branchId?: number) {
    return this.paymentGatewayService.findAll(branchId);
  }
}
