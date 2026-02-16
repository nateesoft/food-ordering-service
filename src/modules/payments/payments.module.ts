import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MembersModule } from '../members/members.module';
import { PromotionsModule } from '../promotions/promotions.module';

@Module({
  imports: [MembersModule, PromotionsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
