import { Controller, Get } from '@nestjs/common'
import { HealthCheck, HealthCheckService } from '@nestjs/terminus'
import { PrismaHealthIndicator } from './prisma-health.indicator'
import { RabbitMQHealthIndicator } from './rabbitmq-health.indicator'

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaIndicator: PrismaHealthIndicator,
    private rabbitmqIndicator: RabbitMQHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaIndicator.isHealthy('database'),
      () => this.rabbitmqIndicator.isHealthy('rabbitmq'),
    ])
  }
}
