import { Injectable, Logger } from '@nestjs/common';
import { MessageBroker } from '../messaging.interface';

// RabbitMQ routing key → Kafka topic name (dot notation is not recommended in Kafka)
const TOPIC_MAP: Record<string, string> = {
  'order.created': 'order-created',
  'order.status_changed': 'order-status-changed',
  'order.cancelled': 'order-cancelled',
};

@Injectable()
export class KafkaAdapter extends MessageBroker {
  private readonly logger = new Logger(KafkaAdapter.name);

  async publish<T>(
    eventType: string,
    payload: T,
    branchId?: string | null,
  ): Promise<void> {
    const topic = TOPIC_MAP[eventType] ?? eventType.replace(/\./g, '-');

    // TODO: inject Kafka producer (kafkajs / @nestjs/microservices ClientKafka)
    // and send message envelope here.
    this.logger.warn(
      `KafkaAdapter.publish not implemented — topic=${topic} branchId=${branchId ?? 'null'}`,
    );
  }
}
