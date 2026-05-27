import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus'

export abstract class BrokerHealthIndicator extends HealthIndicator {
  abstract isHealthy(key: string): Promise<HealthIndicatorResult>
}
