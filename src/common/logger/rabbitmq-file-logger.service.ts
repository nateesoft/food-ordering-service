import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RabbitMQFileLogger implements OnModuleInit, OnModuleDestroy {
  private readonly logsDir = path.join(process.cwd(), 'logs');
  private logStream: fs.WriteStream | null = null;

  onModuleInit() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
    const logFile = path.join(this.logsDir, 'mq-events.log');
    this.logStream = fs.createWriteStream(logFile, { flags: 'a', encoding: 'utf8' });
  }

  onModuleDestroy() {
    this.logStream?.end();
  }

  private write(entry: Record<string, unknown>): void {
    const line = JSON.stringify({ timestamp: new Date().toISOString(), ...entry }) + '\n';
    this.logStream?.write(line);
  }

  logReceived(routingKey: string, message: Record<string, unknown>): void {
    this.write({
      level: 'INFO',
      event: 'MQ_RECEIVED',
      routingKey,
      eventId: message.eventId,
      eventType: message.eventType,
      source: message.source,
      branchId: message.branchId,
      payload: message.payload,
    });
  }

  logProcessed(routingKey: string, eventId: string, dbLogId: number): void {
    this.write({
      level: 'INFO',
      event: 'MQ_PROCESSED',
      routingKey,
      eventId,
      dbLogId,
    });
  }

  logFailed(routingKey: string, eventId: string, error: string): void {
    this.write({
      level: 'ERROR',
      event: 'MQ_FAILED',
      routingKey,
      eventId,
      error,
    });
  }

  logDropped(routingKey: string, eventId: string, reason: string): void {
    this.write({
      level: 'WARN',
      event: 'MQ_DROPPED',
      routingKey,
      eventId,
      reason,
    });
  }
}
