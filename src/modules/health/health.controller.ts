import { Controller, Get } from '@nestjs/common'
import { HealthCheck, HealthCheckService } from '@nestjs/terminus'
import { PrismaHealthIndicator } from './prisma-health.indicator'
import { BrokerHealthIndicator } from './broker-health.indicator'
import { HealthInfoService } from './health-info.service'

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaIndicator: PrismaHealthIndicator,
    private brokerIndicator: BrokerHealthIndicator,
    private healthInfo: HealthInfoService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaIndicator.isHealthy('database'),
      () => this.brokerIndicator.isHealthy('broker'),
    ])
  }

  /**
   * Installation / runtime details: port, database name + migration state, Redis, broker, storage.
   * Always returns 200; check `status` ('ok' | 'degraded') and each component's `status`.
   */
  @Get('info')
  info() {
    return this.healthInfo.getInfo()
  }
}
