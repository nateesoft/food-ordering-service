import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  namespace: '/queue',
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('QueueGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:queue')
  handleSubscribe(client: Socket) {
    client.join('queue-updates');
    this.logger.log(`Client ${client.id} subscribed to queue updates`);
    return { event: 'subscribed', data: { room: 'queue-updates' } };
  }

  @SubscribeMessage('unsubscribe:queue')
  handleUnsubscribe(client: Socket) {
    client.leave('queue-updates');
    this.logger.log(`Client ${client.id} unsubscribed from queue updates`);
    return { event: 'unsubscribed', data: { room: 'queue-updates' } };
  }

  // Methods to emit events
  emitQueueCreated(ticket: any) {
    this.server.to('queue-updates').emit('queue:created', ticket);
  }

  emitQueueCalled(ticket: any) {
    this.server.to('queue-updates').emit('queue:called', ticket);
  }

  emitQueueStatusChanged(ticket: any) {
    this.server.to('queue-updates').emit('queue:statusChanged', ticket);
  }
}
