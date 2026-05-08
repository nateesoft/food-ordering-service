import { Module } from '@nestjs/common'
import { TerminusModule } from '@nestjs/terminus'
import { PrismaModule } from '../../prisma/prisma.module'
import { RabbitMQBrokerModule } from '../rabbitmq/rabbitmq.module'
import { HealthController } from './health.controller'
import { PrismaHealthIndicator } from './prisma-health.indicator'
import { RabbitMQHealthIndicator } from './rabbitmq-health.indicator'

@Module({
  imports: [TerminusModule, PrismaModule, RabbitMQBrokerModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator, RabbitMQHealthIndicator],
})
export class HealthModule {}
