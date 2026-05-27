import { DynamicModule, Module, Type } from '@nestjs/common'
import { TerminusModule } from '@nestjs/terminus'
import { PrismaModule } from '../../prisma/prisma.module'
import { RabbitMQBrokerModule } from '../rabbitmq/rabbitmq.module'
import { HealthController } from './health.controller'
import { PrismaHealthIndicator } from './prisma-health.indicator'
import { RabbitMQHealthIndicator } from './rabbitmq-health.indicator'
import { KafkaHealthIndicator } from './kafka-health.indicator'
import { BrokerHealthIndicator } from './broker-health.indicator'

@Module({})
export class HealthModule {
  static forRoot(): DynamicModule {
    const broker = process.env.MESSAGE_BROKER ?? 'rabbitmq'
    const isRabbitMQ = broker !== 'kafka'

    const brokerProvider = {
      provide: BrokerHealthIndicator,
      useClass: isRabbitMQ ? RabbitMQHealthIndicator : KafkaHealthIndicator,
    }

    // Import RabbitMQBrokerModule only when needed — NestJS deduplicates the module
    // so it reuses the connection already created by MessagingModule (no double connection)
    const brokerImports: Type<unknown>[] = isRabbitMQ ? [RabbitMQBrokerModule] : []

    return {
      module: HealthModule,
      imports: [TerminusModule, PrismaModule, ...brokerImports],
      controllers: [HealthController],
      providers: [PrismaHealthIndicator, brokerProvider],
    }
  }
}
