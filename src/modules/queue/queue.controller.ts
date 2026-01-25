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
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
import { CreateQueueTicketDto, UpdateQueueStatusDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { QueueStatus } from '@prisma/client';

@ApiTags('Queue')
@Controller('queue')
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
    private readonly queueGateway: QueueGateway,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create new queue ticket' })
  @ApiResponse({ status: 201, description: 'Queue ticket created' })
  async create(@Body() createQueueTicketDto: CreateQueueTicketDto) {
    const ticket = await this.queueService.create(createQueueTicketDto);
    this.queueGateway.emitQueueCreated(ticket);
    return ticket;
  }

  @Get()
  @ApiOperation({ summary: 'Get all queue tickets' })
  @ApiQuery({ name: 'status', required: false, enum: QueueStatus })
  @ApiResponse({ status: 200, description: 'List of queue tickets' })
  findAll(@Query('status') status?: QueueStatus) {
    return this.queueService.findAll(status);
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today queue tickets' })
  @ApiResponse({ status: 200, description: 'List of today queue tickets' })
  getTodayQueue() {
    return this.queueService.getTodayQueue();
  }

  @Get('waiting')
  @ApiOperation({ summary: 'Get waiting queue tickets' })
  @ApiResponse({ status: 200, description: 'List of waiting queue tickets' })
  getWaitingQueue() {
    return this.queueService.getWaitingQueue();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Get ready queue tickets' })
  @ApiResponse({ status: 200, description: 'List of ready queue tickets' })
  getReadyQueue() {
    return this.queueService.getReadyQueue();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiResponse({ status: 200, description: 'Queue statistics' })
  getQueueStats() {
    return this.queueService.getQueueStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get queue ticket by ID' })
  @ApiResponse({ status: 200, description: 'Queue ticket details' })
  @ApiResponse({ status: 404, description: 'Queue ticket not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.queueService.findOne(id);
  }

  @Get('queue-id/:queueId')
  @ApiOperation({ summary: 'Get queue ticket by queue ID string' })
  @ApiResponse({ status: 200, description: 'Queue ticket details' })
  @ApiResponse({ status: 404, description: 'Queue ticket not found' })
  findByQueueId(@Param('queueId') queueId: string) {
    return this.queueService.findByQueueId(queueId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update queue ticket status' })
  @ApiResponse({ status: 200, description: 'Queue ticket status updated' })
  @ApiResponse({ status: 404, description: 'Queue ticket not found' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateQueueStatusDto,
  ) {
    const ticket = await this.queueService.updateStatus(id, updateStatusDto);
    this.queueGateway.emitQueueStatusChanged(ticket);
    return ticket;
  }

  @Post(':id/call')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Call queue ticket' })
  @ApiResponse({ status: 200, description: 'Queue ticket called' })
  @ApiResponse({ status: 404, description: 'Queue ticket not found' })
  async callQueue(@Param('id', ParseIntPipe) id: number) {
    const ticket = await this.queueService.callQueue(id);
    this.queueGateway.emitQueueCalled(ticket);
    return ticket;
  }
}
