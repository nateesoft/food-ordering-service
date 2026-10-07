import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { UploadService } from '../upload/upload.service'
import { BrokerHealthIndicator } from './broker-health.indicator'

const CHECK_TIMEOUT_MS = 3000
const DB_SCHEMA = 'food_ordering'

type Status = 'up' | 'down'

interface MigrationRow {
  migration_name: string
  finished_at: Date | null
  rolled_back_at: Date | null
}

function withTimeout<T>(promise: Promise<T>, ms = CHECK_TIMEOUT_MS): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

@Injectable()
export class HealthInfoService {
  private readonly startedAt = new Date()
  private readonly packageInfo = this.readPackageInfo()

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly upload: UploadService,
    private readonly broker: BrokerHealthIndicator,
  ) {}

  async getInfo() {
    const [database, redis, broker, storage] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkBroker(),
      this.checkStorage(),
    ])

    const allUp = [database, redis, broker, storage].every((c) => c.status === 'up')
    const migrationsComplete = database.migrations?.complete === true

    return {
      status: allUp && migrationsComplete ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: {
        name: this.packageInfo.name,
        version: this.packageInfo.version,
        environment: process.env.NODE_ENV ?? 'development',
        port: Number(process.env.PORT || 5555),
        apiPrefix: '/api',
        hostname: os.hostname(),
        platform: `${process.platform} ${os.release()} (${process.arch})`,
        nodeVersion: process.version,
        pid: process.pid,
        pm2: process.env.pm_id !== undefined ? { id: Number(process.env.pm_id), name: process.env.name } : null,
        cwd: process.cwd(),
        startedAt: this.startedAt.toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
        memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      database,
      redis,
      broker,
      storage,
    }
  }

  private async checkDatabase() {
    const target = this.parseDatabaseUrl()
    const started = Date.now()
    try {
      const [info] = await withTimeout(
        this.prisma.$queryRaw<{ database: string; version: string }[]>`
          SELECT current_database() AS database, current_setting('server_version') AS version`,
      )
      const latencyMs = Date.now() - started
      return {
        status: 'up' as Status,
        name: info.database,
        schema: DB_SCHEMA,
        host: target.host,
        port: target.port,
        serverVersion: `PostgreSQL ${info.version}`,
        latencyMs,
        migrations: await this.checkMigrations().catch((error) => ({ complete: false, error: errorMessage(error) })),
      }
    } catch (error) {
      return {
        status: 'down' as Status,
        name: target.name,
        schema: DB_SCHEMA,
        host: target.host,
        port: target.port,
        error: errorMessage(error),
        migrations: undefined,
      }
    }
  }

  private async checkMigrations() {
    const local = this.readLocalMigrations()

    // _prisma_migrations lives in whichever schema the migrations were run against; find it.
    const tables = await this.prisma.$queryRaw<{ table_schema: string }[]>`
      SELECT table_schema FROM information_schema.tables
      WHERE table_name = '_prisma_migrations'
      ORDER BY (table_schema = ${DB_SCHEMA}) DESC
      LIMIT 1`
    if (tables.length === 0) {
      return { complete: false, table: null, applied: 0, latest: null, pending: local ?? [], failed: [] as string[], localCount: local?.length ?? null }
    }

    const schema = tables[0].table_schema.replace(/"/g, '""')
    const rows = await this.prisma.$queryRawUnsafe<MigrationRow[]>(
      `SELECT migration_name, finished_at, rolled_back_at FROM "${schema}"."_prisma_migrations" ORDER BY started_at`,
    )
    const applied = rows.filter((r) => r.finished_at && !r.rolled_back_at)
    const failed = rows.filter((r) => !r.finished_at && !r.rolled_back_at).map((r) => r.migration_name)
    const appliedNames = new Set(applied.map((r) => r.migration_name))
    const latest = applied[applied.length - 1]
    const pending = local ? local.filter((name) => !appliedNames.has(name)) : []

    return {
      complete: pending.length === 0 && failed.length === 0,
      table: `${tables[0].table_schema}._prisma_migrations`,
      applied: applied.length,
      latest: latest ? { name: latest.migration_name, appliedAt: latest.finished_at } : null,
      pending,
      failed,
      // null when the prisma/migrations folder is not deployed next to the app
      localCount: local?.length ?? null,
    }
  }

  private async checkRedis() {
    const info = this.redis.getConnectionInfo()
    const started = Date.now()
    try {
      await withTimeout(this.redis.ping())
      return { status: 'up' as Status, host: info.host, port: info.port, db: info.db, latencyMs: Date.now() - started }
    } catch (error) {
      return { status: 'down' as Status, host: info.host, port: info.port, db: info.db, connection: info.status, error: errorMessage(error) }
    }
  }

  private async checkBroker() {
    const type = this.config.get<string>('MESSAGE_BROKER', 'rabbitmq')
    const details =
      type === 'kafka'
        ? { type }
        : {
            type,
            host: this.safeHost(this.config.get<string>('RABBITMQ_URL')),
            exchange: this.config.get<string>('RABBITMQ_EXCHANGE', 'food_ordering.events'),
          }
    try {
      await withTimeout(this.broker.isHealthy('broker'))
      return { status: 'up' as Status, ...details }
    } catch (error) {
      return { status: 'down' as Status, ...details, error: errorMessage(error) }
    }
  }

  private async checkStorage() {
    try {
      const info = await withTimeout(this.upload.checkStorage())
      return { status: (info.bucketExists ? 'up' : 'down') as Status, type: 'minio', ...info }
    } catch (error) {
      return {
        status: 'down' as Status,
        type: 'minio',
        endpoint: this.config.get<string>('MINIO_ENDPOINT'),
        bucket: this.config.get<string>('MINIO_BUCKET', 'food-images'),
        error: errorMessage(error),
      }
    }
  }

  /** Host/port/db name from DATABASE_URL — never returns credentials. */
  private parseDatabaseUrl(): { host?: string; port?: number; name?: string } {
    try {
      const url = new URL(process.env.DATABASE_URL ?? '')
      return { host: url.hostname, port: Number(url.port || 5432), name: url.pathname.replace(/^\//, '') }
    } catch {
      return {}
    }
  }

  /** "host:port" from a connection URL — never returns credentials. */
  private safeHost(raw?: string): string | undefined {
    if (!raw) return undefined
    try {
      return new URL(raw).host
    } catch {
      return undefined
    }
  }

  private readLocalMigrations(): string[] | null {
    const dir = path.join(process.cwd(), 'prisma', 'migrations')
    try {
      return fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isDirectory() && fs.existsSync(path.join(dir, d.name, 'migration.sql')))
        .map((d) => d.name)
        .sort()
    } catch {
      return null
    }
  }

  private readPackageInfo(): { name: string; version: string } {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')) as {
        name: string
        version: string
      }
      return { name: pkg.name, version: pkg.version }
    } catch {
      return { name: 'food-ordering-service', version: 'unknown' }
    }
  }
}
