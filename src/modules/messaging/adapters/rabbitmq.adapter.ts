import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';
import { RabbitMQFileLogger } from '../../../common/logger/rabbitmq-file-logger.service';
import { MessageBroker } from '../messaging.interface';
import { RabbitMQMessageEnvelope } from '../../rabbitmq/events';

@Injectable()
export class RabbitMQAdapter extends MessageBroker {
  private readonly logger = new Logger(RabbitMQAdapter.name);
  private readonly exchange: string;

  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly configService: ConfigService,
    private readonly fileLogger: RabbitMQFileLogger,
  ) {
    super();
    this.exchange = this.configService.get<string>(
      'RABBITMQ_EXCHANGE',
      'food_ordering.events',
    );
  }

  async publish<T>(
    eventType: string,
    payload: T,
    branchId?: string | null,
  ): Promise<void> {
    const message: RabbitMQMessageEnvelope<T> = {
      eventId: crypto.randomUUID(),
      eventType,
      timestamp: new Date().toISOString(),
      version: '1.0',
      source: 'food-ordering-service',
      branchId: branchId ?? null,
      payload,
    };

    if (!this.amqpConnection.connected) {
      this.logger.warn(
        `RabbitMQ not connected, dropping publish [${eventType}] eventId=${message.eventId}`,
      );
      this.fileLogger.logDropped(eventType, message.eventId, 'not_connected');
      return;
    }

    try {
      await this.amqpConnection.publish(this.exchange, eventType, message, {
        persistent: true,
      });
      this.logger.debug(`Published [${eventType}] eventId=${message.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish [${eventType}]: ${error?.message ?? error}`,
      );
      this.fileLogger.logFailed(
        eventType,
        message.eventId,
        error?.message ?? String(error),
      );
    }
  }
}
