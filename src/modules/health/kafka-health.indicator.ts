import { Injectable } from '@nestjs/common'
import { HealthIndicatorResult } from '@nestjs/terminus'
import { BrokerHealthIndicator } from './broker-health.indicator'

@Injectable()
export class KafkaHealthIndicator extends BrokerHealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    // TODO: implement Kafka producer ping when KafkaAdapter is wired up
    return this.getStatus(key, true)
  }
}
