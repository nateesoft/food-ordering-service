import { Module, forwardRef } from '@nestjs/common';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [forwardRef(() => StaffModule)],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}
