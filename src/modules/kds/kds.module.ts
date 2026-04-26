import { Module } from '@nestjs/common';
import { KDSController } from './kds.controller';
import { KDSService } from './kds.service';

@Module({
  controllers: [KDSController],
  providers: [KDSService],
  exports: [KDSService],
})
export class KDSModule {}
