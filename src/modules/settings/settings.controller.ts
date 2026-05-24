import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { BranchId } from '../../common/decorators/branch-id.decorator';
import { ConsoleJwtAuthGuard } from '../console-auth/guards/console-jwt-auth.guard';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(ConsoleJwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get(':key')
  @ApiOperation({ summary: 'Get a setting by key for current branch' })
  @ApiResponse({ status: 200, description: 'Setting value or null' })
  get(@Param('key') key: string, @BranchId() branchId: string) {
    return this.settingsService.get(key, branchId).then(value => ({ key, value }));
  }

  @Put(':key')
  @ApiOperation({ summary: 'Upsert a setting by key for current branch' })
  @ApiResponse({ status: 200, description: 'Setting saved' })
  upsert(
    @Param('key') key: string,
    @Body() body: { value: any },
    @BranchId() branchId: string,
  ) {
    return this.settingsService.upsert(key, body.value, branchId);
  }
}
