import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { InventoryModule } from '../inventory/inventory.module';
import { RabbitMQBrokerModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [InventoryModule, RabbitMQBrokerModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
