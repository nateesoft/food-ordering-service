import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { PrismaService } from '../../prisma/prisma.service';
import { RabbitMQFileLogger } from '../../common/logger/rabbitmq-file-logger.service';
import { RabbitMQMessageEnvelope, ROUTING_KEYS } from './events';

type MqMessage = RabbitMQMessageEnvelope<unknown>;

@Injectable()
export class RabbitMQConsumer {
  private readonly logger = new Logger(RabbitMQConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileLogger: RabbitMQFileLogger,
  ) {}

  @RabbitSubscribe({
    exchange: 'food_ordering.events',
    routingKey: ROUTING_KEYS.ORDER_CREATED,
    queue: 'food-ordering-service.order-created-log',
    queueOptions: { durable: true },
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handleOrderCreated(message: any): Promise<void> {
    await this.processEvent(message as MqMessage, ROUTING_KEYS.ORDER_CREATED);
  }

  @RabbitSubscribe({
    exchange: 'food_ordering.events',
    routingKey: ROUTING_KEYS.ORDER_STATUS_CHANGED,
    queue: 'food-ordering-service.order-status-changed-log',
    queueOptions: { durable: true },
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handleOrderStatusChanged(message: any): Promise<void> {
    await this.processEvent(message as MqMessage, ROUTING_KEYS.ORDER_STATUS_CHANGED);
  }

  @RabbitSubscribe({
    exchange: 'food_ordering.events',
    routingKey: ROUTING_KEYS.ORDER_CANCELLED,
    queue: 'food-ordering-service.order-cancelled-log',
    queueOptions: { durable: true },
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handleOrderCancelled(message: any): Promise<void> {
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
