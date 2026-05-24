import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryAuditLogsDto } from './dto';
import { BranchId } from '../../common/decorators/branch-id.decorator';
import { AuditEntityType } from '@prisma/client';

@ApiTags('Audit Logs')
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Query audit logs with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated audit logs' })
  findAll(@BranchId() branchId: string, @Query() query: QueryAuditLogsDto) {
    return this.auditService.findAll({
      ...query,
      branchId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate
        ? new Date(query.endDate + 'T23:59:59.999Z')
        : undefined,
      entityType: query.entityType as any,
      action: query.action as any,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get audit log statistics' })
  @ApiResponse({ status: 200, description: 'Audit log stats by action' })
  getStats(
    @BranchId() branchId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate + 'T23:59:59.999Z') : undefined,
      branchId,
    );
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get audit trail for a specific entity' })
  @ApiResponse({ status: 200, description: 'Audit trail for entity' })
  findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseIntPipe) entityId: number,
  ) {
    return this.auditService.findByEntity(
      entityType as AuditEntityType,
      entityId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiResponse({ status: 200, description: 'Single audit log entry' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.auditService.findOne(id);
  }
}
