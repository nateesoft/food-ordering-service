import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { KDSService } from './kds.service';
import { CreateKDSStationDto, UpdateKDSStationDto, BumpItemDto } from './dto';
import { BranchId } from '../../common/decorators/branch-id.decorator';

@ApiTags('KDS')
@Controller('kds')
export class KDSController {
  constructor(private readonly kdsService: KDSService) {}

  @Get('orders')
  @ApiOperation({ summary: 'Get active orders for KDS' })
  @ApiQuery({ name: 'stationId', required: false, type: Number })
  getOrders(
    @BranchId() branchId?: string,
    @Query('stationId') stationId?: string,
  ) {
    return this.kdsService.getActiveOrders(branchId, stationId ? parseInt(stationId, 10) : undefined);
  }

  @Patch('orders/:orderId/items/:itemId/bump')
  @ApiOperation({ summary: 'Bump (complete) an order item' })
  bumpItem(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: BumpItemDto,
  ) {
    return this.kdsService.bumpItem(orderId, itemId, dto.status);
  }

  // === Stations ===

  @Get('stations')
  @ApiOperation({ summary: 'Get KDS stations' })
  getStations(@BranchId() branchId?: string) {
    return this.kdsService.getStations(branchId);
  }

  @Post('stations')
  @ApiOperation({ summary: 'Create KDS station' })
  createStation(@Body() dto: CreateKDSStationDto, @BranchId() branchId?: string) {
    return this.kdsService.createStation(dto, branchId);
  }

  @Patch('stations/:id')
  @ApiOperation({ summary: 'Update KDS station' })
  updateStation(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateKDSStationDto) {
    return this.kdsService.updateStation(id, dto);
  }

  @Delete('stations/:id')
  @ApiOperation({ summary: 'Delete KDS station' })
  deleteStation(@Param('id', ParseIntPipe) id: number) {
    return this.kdsService.deleteStation(id);
  }
}
