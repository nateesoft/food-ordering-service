import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InventoryIntegrationService } from './inventory-integration.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [InventoryIntegrationService],
  exports: [InventoryIntegrationService],
})
export class InventoryIntegrationModule {}
