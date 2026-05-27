import { DynamicModule, Logger, Module } from '@nestjs/common';
import { MessageBroker } from './messaging.interface';
import { RabbitMQAdapter } from './adapters/rabbitmq.adapter';
import { KafkaAdapter } from './adapters/kafka.adapter';
import { RabbitMQBrokerModule } from '../rabbitmq/rabbitmq.module';

@Module({})
export class MessagingModule {
  static forRoot(): DynamicModule {
    const broker = process.env.MESSAGE_BROKER ?? 'rabbitmq';
    const logger = new Logger(MessagingModule.name);
    logger.log(`Message broker: ${broker}`);

    if (broker === 'kafka') {
      return {
        global: true,
        module: MessagingModule,
        providers: [{ provide: MessageBroker, useClass: KafkaAdapter }],
        exports: [MessageBroker],
      };
    }

    // Default: RabbitMQ
    // RabbitMQBrokerModule provides AmqpConnection + RabbitMQFileLogger (exported)
    return {
      global: true,
      module: MessagingModule,
      imports: [RabbitMQBrokerModule],
      providers: [{ provide: MessageBroker, useClass: RabbitMQAdapter }],
      exports: [MessageBroker],
    };
  }
}
