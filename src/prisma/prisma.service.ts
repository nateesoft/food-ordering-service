import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 3000,
    });
    const adapter = new PrismaPg(pool, { schema: 'food_ordering' });
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.tryConnect();
  }

  private async tryConnect(attempt = 1): Promise<void> {
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('connect timeout')), 5000),
      );
      await Promise.race([this.$connect(), timeout]);
      this.logger.log('Database connected');
    } catch (error) {
      this.logger.warn(
        `Database unavailable (attempt ${attempt}): ${(error as Error).message}. Retrying...`,
      );
      const delay = Math.min(5000 * attempt, 30000);
      setTimeout(() => this.tryConnect(attempt + 1), delay);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
