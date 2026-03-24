import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQPublisher } from './rabbitmq.publisher';

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
          // Don't block app startup if RabbitMQ is unavailable
          wait: false,
        },
        prefetchCount: Number(configService.get('RABBITMQ_PREFETCH', 10)),
      }),
    }),
  ],
  providers: [RabbitMQPublisher],
  exports: [RabbitMQPublisher],
})
export class RabbitMQBrokerModule {}
