import { Module } from '@nestjs/common';
import { BranchController } from './branch.controller';
import { BranchService } from './branch.service';
import { ConsoleAuthModule } from '../console-auth/console-auth.module';

@Module({
  imports: [ConsoleAuthModule],
  controllers: [BranchController],
  providers: [BranchService],
  exports: [BranchService],
})
export class BranchModule {}
