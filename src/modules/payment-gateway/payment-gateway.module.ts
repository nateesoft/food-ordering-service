import { Module } from '@nestjs/common';
import { PaymentGatewayController } from './payment-gateway.controller';
import { PaymentGatewayService } from './payment-gateway.service';
import { MockPaymentProvider } from './providers/mock.provider';

@Module({
  controllers: [PaymentGatewayController],
  providers: [PaymentGatewayService, MockPaymentProvider],
  exports: [PaymentGatewayService],
})
export class PaymentGatewayModule {}
