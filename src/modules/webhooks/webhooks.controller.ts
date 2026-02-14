import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto, UpdateWebhookDto } from './dto';
import { BranchId } from '../../common/decorators/branch-id.decorator';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get('events')
  @ApiOperation({ summary: 'Get all available webhook events' })
  @ApiResponse({ status: 200, description: 'List of webhook events' })
  getEvents() {
    return this.webhooksService.getEvents();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new webhook endpoint' })
  @ApiResponse({ status: 201, description: 'Webhook created (secret shown once)' })
  create(@Body() dto: CreateWebhookDto, @BranchId() branchId: number) {
    return this.webhooksService.create(dto, branchId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all webhook endpoints' })
  @ApiResponse({ status: 200, description: 'List of webhooks' })
  findAll(@BranchId() branchId: number) {
    return this.webhooksService.findAll(branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get webhook by ID' })
  @ApiResponse({ status: 200, description: 'Webhook details' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.webhooksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook updated' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.webhooksService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.webhooksService.remove(id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Send a test webhook delivery' })
  @ApiResponse({ status: 200, description: 'Test delivery result' })
  test(@Param('id', ParseIntPipe) id: number) {
    return this.webhooksService.testWebhook(id);
  }

  @Get(':id/deliveries')
  @ApiOperation({ summary: 'Get webhook delivery logs' })
  @ApiResponse({ status: 200, description: 'List of deliveries' })
  getDeliveries(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: string,
  ) {
    return this.webhooksService.getDeliveries(id, limit ? parseInt(limit) : 50);
  }
}
