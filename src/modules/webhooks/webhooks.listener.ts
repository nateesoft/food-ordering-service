import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebhooksService } from './webhooks.service';
import { WebhookEvent } from '@prisma/client';

@Injectable()
export class WebhooksListener {
  private readonly logger = new Logger(WebhooksListener.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @OnEvent('order.created')
  handleOrderCreated(payload: { data: any; branchId?: string }) {
    this.dispatch(WebhookEvent.ORDER_CREATED, payload.data, payload.branchId);
  }

  @OnEvent('order.status_changed')
  handleOrderStatusChanged(payload: { data: any; branchId?: string }) {
    this.dispatch(WebhookEvent.ORDER_STATUS_CHANGED, payload.data, payload.branchId);
  }

  @OnEvent('order.cancelled')
  handleOrderCancelled(payload: { data: any; branchId?: string }) {
    this.dispatch(WebhookEvent.ORDER_CANCELLED, payload.data, payload.branchId);
  }

  @OnEvent('payment.completed')
  handlePaymentCompleted(payload: { data: any; branchId?: string }) {
    this.dispatch(WebhookEvent.PAYMENT_COMPLETED, payload.data, payload.branchId);
  }

  @OnEvent('payment.refunded')
  handlePaymentRefunded(payload: { data: any; branchId?: string }) {
    this.dispatch(WebhookEvent.PAYMENT_REFUNDED, payload.data, payload.branchId);
  }

  @OnEvent('queue.created')
  handleQueueCreated(payload: { data: any; branchId?: string }) {
    this.dispatch(WebhookEvent.QUEUE_CREATED, payload.data, payload.branchId);
  }

  @OnEvent('queue.status_changed')
  handleQueueStatusChanged(payload: { data: any; branchId?: string }) {
    this.dispatch(WebhookEvent.QUEUE_STATUS_CHANGED, payload.data, payload.branchId);
  }

  @OnEvent('member.registered')
  handleMemberRegistered(payload: { data: any; branchId?: string }) {
    this.dispatch(WebhookEvent.MEMBER_REGISTERED, payload.data, payload.branchId);
  }

  @OnEvent('shift.opened')
  handleShiftOpened(payload: { data: any; branchId?: string }) {
    this.dispatch(WebhookEvent.SHIFT_OPENED, payload.data, payload.branchId);
  }

  @OnEvent('shift.closed')
  handleShiftClosed(payload: { data: any; branchId?: string }) {
    this.dispatch(WebhookEvent.SHIFT_CLOSED, payload.data, payload.branchId);
  }

  @OnEvent('stock.low_alert')
  handleLowStockAlert(payload: { data: any; branchId?: string }) {
    this.dispatch(WebhookEvent.LOW_STOCK_ALERT, payload.data, payload.branchId);
  }

  private dispatch(event: WebhookEvent, data: any, branchId?: string) {
    this.logger.log(`Dispatching webhook event: ${event}`);
    this.webhooksService.dispatchEvent(event, data, branchId).catch((err) => {
      this.logger.error(`Failed to dispatch ${event}: ${err}`);
    });
  }
}
