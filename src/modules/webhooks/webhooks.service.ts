import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWebhookDto, UpdateWebhookDto } from './dto';
import { WebhookEvent } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService) {}

  private generateSecret(): string {
    return `whsec_${crypto.randomBytes(24).toString('hex')}`;
  }

  async create(dto: CreateWebhookDto, branchId?: number) {
    const secret = this.generateSecret();

    const webhook = await this.prisma.webhookEndpoint.create({
      data: {
        name: dto.name,
        url: dto.url,
        secret,
        events: dto.events,
        isActive: dto.isActive ?? true,
        headers: dto.headers ?? undefined,
        description: dto.description,
        branchId,
      },
    });

    // Return with unmasked secret only on creation
    return { ...webhook, secret };
  }

  async findAll(branchId?: number) {
    const where: any = {};
    if (branchId) where.branchId = branchId;

    const webhooks = await this.prisma.webhookEndpoint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Mask secrets
    return webhooks.map((w) => ({
      ...w,
      secret: this.maskSecret(w.secret),
    }));
  }

  async findOne(id: number) {
    const webhook = await this.prisma.webhookEndpoint.findUnique({
      where: { id },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    return { ...webhook, secret: this.maskSecret(webhook.secret) };
  }

  async update(id: number, dto: UpdateWebhookDto) {
    await this.findOne(id);

    const webhook = await this.prisma.webhookEndpoint.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.events !== undefined && { events: dto.events }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.headers !== undefined && { headers: dto.headers }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });

    return { ...webhook, secret: this.maskSecret(webhook.secret) };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.webhookEndpoint.delete({ where: { id } });
    return { message: 'Webhook deleted successfully' };
  }

  async getDeliveries(webhookId: number, limit = 50) {
    await this.findOne(webhookId);

    return this.prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async testWebhook(id: number) {
    const webhook = await this.prisma.webhookEndpoint.findUnique({
      where: { id },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    const testPayload = {
      event: 'TEST',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        webhookId: webhook.id,
        webhookName: webhook.name,
      },
    };

    return this.deliverPayload(webhook, 'ORDER_CREATED' as WebhookEvent, testPayload, true);
  }

  async getEvents() {
    return Object.values(WebhookEvent).map((event) => ({
      value: event,
      label: this.getEventLabel(event),
    }));
  }

  // Called by webhook listener to dispatch to matching webhooks
  async dispatchEvent(event: WebhookEvent, payload: any, branchId?: number) {
    const where: any = {
      isActive: true,
      events: { has: event },
    };
    if (branchId) where.branchId = branchId;

    const webhooks = await this.prisma.webhookEndpoint.findMany({ where });

    for (const webhook of webhooks) {
      const body = {
        event,
        timestamp: new Date().toISOString(),
        data: payload,
      };

      // Fire-and-forget delivery
      this.deliverPayload(webhook, event, body, false).catch((err) => {
        this.logger.error(`Webhook delivery failed for ${webhook.name}: ${err}`);
      });
    }
  }

  private async deliverPayload(
    webhook: { id: number; url: string; secret: string; headers: any },
    event: WebhookEvent,
    body: any,
    isTest: boolean,
  ) {
    const bodyStr = JSON.stringify(body);
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(bodyStr)
      .digest('hex');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': event,
      'X-Webhook-Signature': `sha256=${signature}`,
      'X-Webhook-Timestamp': new Date().toISOString(),
      ...(webhook.headers as Record<string, string> || {}),
    };

    const maxAttempts = 3;
    let lastError: string | null = null;
    let responseStatus: number | null = null;
    let responseBody: string | null = null;
    let success = false;
    let duration = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: bodyStr,
          signal: controller.signal,
        });

        clearTimeout(timeout);
        duration = Date.now() - startTime;
        responseStatus = response.status;

        const text = await response.text();
        responseBody = text.substring(0, 1000);

        if (response.ok) {
          success = true;
          break;
        }

        lastError = `HTTP ${response.status}: ${responseBody}`;
      } catch (err: any) {
        duration = Date.now() - startTime;
        lastError = err.name === 'AbortError' ? 'Request timeout (10s)' : err.message;
      }

      // Exponential backoff before retry
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(4, attempt) * 250));
      }
    }

    // Save delivery log
    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event,
        payload: body,
        responseStatus,
        responseBody,
        success,
        attempts: success ? 1 : maxAttempts,
        error: lastError,
        duration,
      },
    });

    if (isTest) {
      return {
        success,
        responseStatus,
        responseBody,
        error: lastError,
        duration,
        delivery,
      };
    }

    if (!success) {
      this.logger.warn(
        `Webhook ${webhook.id} delivery failed after ${maxAttempts} attempts: ${lastError}`,
      );
    }

    return delivery;
  }

  private maskSecret(secret: string): string {
    if (secret.length <= 10) return '***';
    return secret.substring(0, 10) + '***';
  }

  private getEventLabel(event: WebhookEvent): string {
    const labels: Record<string, string> = {
      ORDER_CREATED: 'Order Created',
      ORDER_STATUS_CHANGED: 'Order Status Changed',
      ORDER_CANCELLED: 'Order Cancelled',
      PAYMENT_COMPLETED: 'Payment Completed',
      PAYMENT_REFUNDED: 'Payment Refunded',
      QUEUE_CREATED: 'Queue Ticket Created',
      QUEUE_STATUS_CHANGED: 'Queue Status Changed',
      MEMBER_REGISTERED: 'Member Registered',
      SHIFT_OPENED: 'Shift Opened',
      SHIFT_CLOSED: 'Shift Closed',
      LOW_STOCK_ALERT: 'Low Stock Alert',
    };
    return labels[event] || event;
  }
}
