import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';
import { StaffModule } from '../staff/staff.module';
import { ConsoleAuthModule } from '../console-auth/console-auth.module';

@Module({
  imports: [ConfigModule, forwardRef(() => StaffModule), ConsoleAuthModule],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}
