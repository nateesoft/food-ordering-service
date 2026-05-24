import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';
import { RabbitMQFileLogger } from '../../common/logger/rabbitmq-file-logger.service';
import { RabbitMQMessageEnvelope, RoutingKey } from './events';

@Injectable()
export class RabbitMQPublisher {
  private readonly logger = new Logger(RabbitMQPublisher.name);
  private readonly exchange: string;

  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly configService: ConfigService,
    private readonly fileLogger: RabbitMQFileLogger,
  ) {
    this.exchange = this.configService.get<string>(
      'RABBITMQ_EXCHANGE',
      'food_ordering.events',
    );
  }

  async publish<T>(
    routingKey: RoutingKey,
    payload: T,
    branchId?: string | null,
  ): Promise<void> {
    const message: RabbitMQMessageEnvelope<T> = {
      eventId: crypto.randomUUID(),
      eventType: routingKey,
      timestamp: new Date().toISOString(),
      version: '1.0',
      source: 'food-ordering-service',
      branchId: branchId ?? null,
      payload,
    };

    if (!this.amqpConnection.connected) {
      this.logger.warn(`RabbitMQ not connected, dropping publish [${routingKey}] eventId=${message.eventId}`);
      this.fileLogger.logDropped(routingKey, message.eventId, 'not_connected');
      return;
    }

    try {
      await this.amqpConnection.publish(this.exchange, routingKey, message, {
        persistent: true,
      });
      this.logger.debug(`Published [${routingKey}] eventId=${message.eventId}`);
    } catch (error) {
      // Log only — never throw so RabbitMQ failure won't affect main order flow
      this.logger.error(
        `Failed to publish [${routingKey}]: ${error?.message ?? error}`,
      );
      this.fileLogger.logFailed(routingKey, message.eventId, error?.message ?? String(error));
    }
  }
}
