import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // === Room subscriptions ===

  @SubscribeMessage('subscribe:orders')
  handleSubscribeOrders(client: Socket) {
    client.join('orders');
    this.logger.log(`Client ${client.id} subscribed to orders`);
    return { event: 'subscribed', data: { room: 'orders' } };
  }

  @SubscribeMessage('unsubscribe:orders')
  handleUnsubscribeOrders(client: Socket) {
    client.leave('orders');
    return { event: 'unsubscribed', data: { room: 'orders' } };
  }

  @SubscribeMessage('subscribe:payments')
  handleSubscribePayments(client: Socket) {
    client.join('payments');
    this.logger.log(`Client ${client.id} subscribed to payments`);
    return { event: 'subscribed', data: { room: 'payments' } };
  }

  @SubscribeMessage('unsubscribe:payments')
  handleUnsubscribePayments(client: Socket) {
    client.leave('payments');
    return { event: 'unsubscribed', data: { room: 'payments' } };
  }

  @SubscribeMessage('subscribe:kds')
  handleSubscribeKDS(client: Socket) {
    client.join('kds');
    this.logger.log(`Client ${client.id} subscribed to KDS`);
    return { event: 'subscribed', data: { room: 'kds' } };
  }

  @SubscribeMessage('unsubscribe:kds')
  handleUnsubscribeKDS(client: Socket) {
    client.leave('kds');
    return { event: 'unsubscribed', data: { room: 'kds' } };
  }

  @SubscribeMessage('subscribe:shifts')
  handleSubscribeShifts(client: Socket) {
    client.join('shifts');
    this.logger.log(`Client ${client.id} subscribed to shifts`);
    return { event: 'subscribed', data: { room: 'shifts' } };
  }

  @SubscribeMessage('unsubscribe:shifts')
  handleUnsubscribeShifts(client: Socket) {
    client.leave('shifts');
    return { event: 'unsubscribed', data: { room: 'shifts' } };
  }

  @SubscribeMessage('subscribe:queue')
  handleSubscribeQueue(client: Socket) {
    client.join('queue');
    this.logger.log(`Client ${client.id} subscribed to queue`);
    return { event: 'subscribed', data: { room: 'queue' } };
  }

  @SubscribeMessage('unsubscribe:queue')
  handleUnsubscribeQueue(client: Socket) {
    client.leave('queue');
    return { event: 'unsubscribed', data: { room: 'queue' } };
  }

  // === Event listeners (from EventEmitter2) ===

  @OnEvent('order.created')
  handleOrderCreated(payload: any) {
    this.server.to('orders').emit('order:created', payload.data);
    this.server.to('kds').emit('kds:newOrder', payload.data);
    this.logger.debug(`Order created event emitted: ${payload.data?.orderId}`);
  }

  @OnEvent('order.status_changed')
  handleOrderStatusChanged(payload: any) {
    this.server.to('orders').emit('order:statusChanged', payload.data);
    this.server.to('kds').emit('kds:orderStatusChanged', payload.data);
    this.logger.debug(`Order status changed: ${payload.data?.orderId} -> ${payload.data?.status}`);
  }

  @OnEvent('order.cancelled')
  handleOrderCancelled(payload: any) {
    this.server.to('orders').emit('order:cancelled', payload.data);
    this.server.to('kds').emit('kds:orderCancelled', payload.data);
    this.logger.debug(`Order cancelled: ${payload.data?.orderId}`);
  }

  @OnEvent('order.itemStatusChanged')
  handleOrderItemStatusChanged(payload: any) {
    this.server.to('orders').emit('order:itemStatusChanged', payload);
    this.server.to('kds').emit('kds:itemStatusChanged', payload);
    this.logger.debug(`Order item status changed: ${payload.orderId} item ${payload.itemId}`);
  }

  @OnEvent('payment.completed')
  handlePaymentCompleted(payload: any) {
    this.server.to('payments').emit('payment:completed', payload.data);
    this.logger.debug(`Payment completed: ${payload.data?.receiptNumber}`);
  }

  @OnEvent('payment.refunded')
  handlePaymentRefunded(payload: any) {
    this.server.to('payments').emit('payment:refunded', payload.data);
    this.logger.debug(`Payment refunded: ${payload.data?.receiptNumber}`);
  }

  @OnEvent('shift.opened')
  handleShiftOpened(payload: any) {
    this.server.to('shifts').emit('shift:opened', payload.data);
    this.logger.debug(`Shift opened: ${payload.data?.shiftNumber}`);
  }

  @OnEvent('shift.closed')
  handleShiftClosed(payload: any) {
    this.server.to('shifts').emit('shift:closed', payload.data);
    this.logger.debug(`Shift closed: ${payload.data?.shiftNumber}`);
  }

  @OnEvent('queue.created')
  handleQueueCreated(payload: any) {
    this.server.to('queue').emit('queue:created', payload.data);
    this.logger.debug(`Queue created: ${payload.data?.queueId}`);
  }

  @OnEvent('queue.statusChanged')
  handleQueueStatusChanged(payload: any) {
    this.server.to('queue').emit('queue:statusChanged', payload.data);
    this.logger.debug(`Queue status changed: ${payload.data?.queueId}`);
  }

  @OnEvent('queue.called')
  handleQueueCalled(payload: any) {
    this.server.to('queue').emit('queue:called', payload.data);
    this.logger.debug(`Queue called: ${payload.data?.queueId}`);
  }
}
