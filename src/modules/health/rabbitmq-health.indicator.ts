import { Injectable } from '@nestjs/common'
import { HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus'
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq'
import { BrokerHealthIndicator } from './broker-health.indicator'

@Injectable()
export class RabbitMQHealthIndicator extends BrokerHealthIndicator {
  constructor(private readonly amqpConnection: AmqpConnection) {
    super()
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isConnected = this.amqpConnection.connected
    if (!isConnected) {
      throw new HealthCheckError('RabbitMQ check failed', this.getStatus(key, false))
    }
    return this.getStatus(key, true)
  }
}
