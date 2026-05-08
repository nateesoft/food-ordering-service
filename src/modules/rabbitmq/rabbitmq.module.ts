import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQPublisher } from './rabbitmq.publisher';
import { RabbitMQConsumer } from './rabbitmq.consumer';
import { RabbitMQFileLogger } from '../../common/logger/rabbitmq-file-logger.service';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        exchanges: [
          {
            name: configService.get<string>(
              'RABBITMQ_EXCHANGE',
              'food_ordering.events',
            ),
            type: 'topic',
            options: { durable: true },
          },
        ],
        uri: configService.get<string>(
          'RABBITMQ_URL',
          'amqp://guest:guest@localhost:5672',
        ),
        connectionInitOptions: {
          wait: false,
        },
        registerHandlers: false,
        prefetchCount: Number(configService.get('RABBITMQ_PREFETCH', 10)),
      }),
    }),
  ],
  providers: [RabbitMQPublisher, RabbitMQConsumer, RabbitMQFileLogger],
  exports: [RabbitMQPublisher, RabbitMQModule],
})
export class RabbitMQBrokerModule {}
