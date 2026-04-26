import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { OpenShiftDto, CloseShiftDto } from './dto';
import { BranchId } from '../../common/decorators/branch-id.decorator';
import { ShiftStatus } from '@prisma/client';

@ApiTags('Shifts')
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post('open')
  @ApiOperation({ summary: 'Open a new shift' })
  @ApiResponse({ status: 201, description: 'Shift opened successfully' })
  openShift(@Body() dto: OpenShiftDto, @BranchId() branchId: number) {
    return this.shiftsService.openShift(dto, branchId);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close a shift' })
  @ApiResponse({ status: 200, description: 'Shift closed successfully' })
  closeShift(@Param('id') id: string, @Body() dto: CloseShiftDto) {
    return this.shiftsService.closeShift(+id, dto);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get currently active shift' })
  @ApiResponse({ status: 200, description: 'Active shift or null' })
  getActiveShift(@BranchId() branchId: number) {
    return this.shiftsService.getActiveShift(branchId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shifts' })
  @ApiQuery({ name: 'status', required: false, enum: ShiftStatus })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of shifts' })
  findAll(
    @BranchId() branchId: number,
    @Query('status') status?: ShiftStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.shiftsService.findAll(
      branchId,
      status,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate + 'T23:59:59.999Z') : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shift by ID' })
  @ApiResponse({ status: 200, description: 'Shift details' })
  findOne(@Param('id') id: string) {
    return this.shiftsService.findOne(+id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get shift summary with payments' })
  @ApiResponse({ status: 200, description: 'Shift summary' })
  getShiftSummary(@Param('id') id: string) {
    return this.shiftsService.getShiftSummary(+id);
  }
}
