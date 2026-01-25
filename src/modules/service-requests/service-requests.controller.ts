import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ServiceRequestsService } from './service-requests.service';
import { CreateServiceRequestDto, UpdateServiceRequestDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ServiceRequestStatus, ServiceRequestType } from '@prisma/client';

@ApiTags('Service Requests')
@Controller('service-requests')
export class ServiceRequestsController {
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create new service request' })
  @ApiResponse({ status: 201, description: 'Service request created' })
  create(@Body() createServiceRequestDto: CreateServiceRequestDto) {
    return this.serviceRequestsService.create(createServiceRequestDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all service requests' })
  @ApiQuery({ name: 'status', required: false, enum: ServiceRequestStatus })
  @ApiQuery({ name: 'type', required: false, enum: ServiceRequestType })
  @ApiQuery({ name: 'tableNumber', required: false })
  @ApiResponse({ status: 200, description: 'List of service requests' })
  findAll(
    @Query('status') status?: ServiceRequestStatus,
    @Query('type') type?: ServiceRequestType,
    @Query('tableNumber') tableNumber?: string,
  ) {
    return this.serviceRequestsService.findAll(status, type, tableNumber);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending service requests' })
  @ApiResponse({
    status: 200,
    description: 'List of pending service requests',
  })
  getPendingRequests() {
    return this.serviceRequestsService.getPendingRequests();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get service request statistics' })
  @ApiResponse({ status: 200, description: 'Service request statistics' })
  getRequestStats() {
    return this.serviceRequestsService.getRequestStats();
  }

  @Get('table/:tableNumber')
  @ApiOperation({ summary: 'Get service requests by table' })
  @ApiResponse({
    status: 200,
    description: 'List of service requests for table',
  })
  getRequestsByTable(@Param('tableNumber') tableNumber: string) {
    return this.serviceRequestsService.getRequestsByTable(tableNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service request by ID' })
  @ApiResponse({ status: 200, description: 'Service request details' })
  @ApiResponse({ status: 404, description: 'Service request not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviceRequestsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update service request status' })
  @ApiResponse({ status: 200, description: 'Service request status updated' })
  @ApiResponse({ status: 404, description: 'Service request not found' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateServiceRequestDto,
  ) {
    return this.serviceRequestsService.updateStatus(id, updateStatusDto);
  }
}
