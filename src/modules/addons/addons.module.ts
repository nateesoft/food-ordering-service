import { Module } from '@nestjs/common';
import { AddonsController } from './addons.controller';
import { AddonsService } from './addons.service';
import { ConsoleAuthModule } from '../console-auth/console-auth.module';

@Module({
  imports: [ConsoleAuthModule],
  controllers: [AddonsController],
  providers: [AddonsService],
  exports: [AddonsService],
})
export class AddonsModule {}
