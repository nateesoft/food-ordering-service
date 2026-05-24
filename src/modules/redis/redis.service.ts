import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const SESSION_PREFIX = 'table_session:';
const TABLE_ACTIVE_PREFIX = 'table_active:';
const SESSION_TTL_SECONDS = 3 * 60 * 60; // 3 hours

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.client = new Redis(url, { lazyConnect: false });
    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err) => this.logger.error('Redis error', err.message));
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  async registerSession(sessionId: string, tableNumber: string, branchId: string): Promise<void> {
    const sessionKey = `${SESSION_PREFIX}${sessionId}`;
    const tableKey = `${TABLE_ACTIVE_PREFIX}${branchId}:${tableNumber}`;
    const value = JSON.stringify({ tableNumber, branchId });
    const pipeline = this.client.pipeline();
    pipeline.setex(sessionKey, SESSION_TTL_SECONDS, value);
    pipeline.setex(tableKey, SESSION_TTL_SECONDS, sessionId);
    await pipeline.exec();
  }

  async validateSession(sessionId: string): Promise<{ tableNumber: string; branchId: string } | null> {
    const key = `${SESSION_PREFIX}${sessionId}`;
    const value = await this.client.get(key);
    if (!value) return null;
    return JSON.parse(value);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const sessionData = await this.validateSession(sessionId);
    const pipeline = this.client.pipeline();
    pipeline.del(`${SESSION_PREFIX}${sessionId}`);
    if (sessionData) {
      pipeline.del(`${TABLE_ACTIVE_PREFIX}${sessionData.branchId}:${sessionData.tableNumber}`);
    }
    await pipeline.exec();
  }

  async getActiveSessionForTable(tableNumber: string, branchId: string): Promise<string | null> {
    return this.client.get(`${TABLE_ACTIVE_PREFIX}${branchId}:${tableNumber}`);
  }

  async clearSessionForTable(tableNumber: string, branchId: string): Promise<void> {
    const tableKey = `${TABLE_ACTIVE_PREFIX}${branchId}:${tableNumber}`;
    const sessionId = await this.client.get(tableKey);
    if (!sessionId) return;
    const pipeline = this.client.pipeline();
    pipeline.del(`${SESSION_PREFIX}${sessionId}`);
    pipeline.del(tableKey);
    await pipeline.exec();
  }

  async getSessionTTL(sessionId: string): Promise<number> {
    return this.client.ttl(`${SESSION_PREFIX}${sessionId}`);
  }
}
