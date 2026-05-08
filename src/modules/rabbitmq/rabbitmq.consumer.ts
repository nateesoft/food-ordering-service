import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { PrismaService } from '../../prisma/prisma.service';
import { RabbitMQFileLogger } from '../../common/logger/rabbitmq-file-logger.service';
import { RabbitMQMessageEnvelope, ROUTING_KEYS } from './events';

type MqMessage = RabbitMQMessageEnvelope<unknown>;

interface SubscribeOptions {
  exchange: string;
  routingKey: string;
  queue: string;
  queueOptions?: Record<string, unknown>;
}

@Injectable()
export class RabbitMQConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(RabbitMQConsumer.name);

  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly prisma: PrismaService,
    private readonly fileLogger: RabbitMQFileLogger,
  ) {}

  onApplicationBootstrap() {
    this.registerSubscriber(
      ROUTING_KEYS.ORDER_CREATED,
      'food-ordering-service.order-created-log',
      (msg) => this.handleOrderCreated(msg),
    );
    this.registerSubscriber(
      ROUTING_KEYS.ORDER_STATUS_CHANGED,
      'food-ordering-service.order-status-changed-log',
      (msg) => this.handleOrderStatusChanged(msg),
    );
    this.registerSubscriber(
      ROUTING_KEYS.ORDER_CANCELLED,
      'food-ordering-service.order-cancelled-log',
      (msg) => this.handleOrderCancelled(msg),
    );
  }

  private registerSubscriber(
    routingKey: string,
    queue: string,
    handler: (msg: unknown) => Promise<void>,
  ) {
    const opts: SubscribeOptions = {
      exchange: 'food_ordering.events',
      routingKey,
      queue,
      queueOptions: { durable: true },
    };
    // fire-and-forget: addSetup resolves immediately, consumer activates when RabbitMQ connects
    void this.amqpConnection.createSubscriber(
      handler,
      opts as Parameters<typeof this.amqpConnection.createSubscriber>[1],
      queue,
    );
    this.logger.log(`Registered subscriber: ${routingKey} -> ${queue}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleOrderCreated(message: any): Promise<void> {
    await this.processEvent(message as MqMessage, ROUTING_KEYS.ORDER_CREATED);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleOrderStatusChanged(message: any): Promise<void> {
    await this.processEvent(message as MqMessage, ROUTING_KEYS.ORDER_STATUS_CHANGED);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleOrderCancelled(message: any): Promise<void> {
    await this.processEvent(message as MqMessage, ROUTING_KEYS.ORDER_CANCELLED);
  }

  private async processEvent(message: MqMessage, routingKey: string): Promise<void> {
    this.logger.log(`[MQ RECEIVED] routingKey=${routingKey} eventId=${message.eventId}`);
    this.fileLogger.logReceived(routingKey, message as unknown as Record<string, unknown>);

    let logId: number | undefined;
    try {
      const log = await this.prisma.mqEventLog.create({
        data: {
          eventId: message.eventId,
          eventType: message.eventType,
          routingKey,
          source: message.source ?? null,
          branchId: message.branchId ?? null,
          status: 'RECEIVED',
          payload: message.payload as object,
        },
      });
      logId = log.id;

      await this.prisma.mqEventLog.update({
        where: { id: log.id },
        data: { status: 'PROCESSED', processedAt: new Date() },
      });

      this.fileLogger.logProcessed(routingKey, message.eventId, log.id);
      this.logger.log(`[MQ PROCESSED] routingKey=${routingKey} eventId=${message.eventId} dbLogId=${log.id}`);
    } catch (error) {
      const errMsg = (error as Error)?.message ?? String(error);
      this.logger.error(`[MQ FAILED] routingKey=${routingKey} eventId=${message.eventId} error=${errMsg}`);
      this.fileLogger.logFailed(routingKey, message.eventId, errMsg);

      if (logId) {
        await this.prisma.mqEventLog
          .update({ where: { id: logId }, data: { status: 'FAILED', error: errMsg } })
          .catch(() => {});
      }
    }
  }
}
