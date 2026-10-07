import * as fs from 'fs'
import * as path from 'path'
import { ConfigService } from '@nestjs/config'
import { HealthInfoService } from './health-info.service'

const localMigrations = fs
  .readdirSync(path.join(process.cwd(), 'prisma', 'migrations'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort()

function build(overrides: { appliedMigrations?: string[]; brokerDown?: boolean; dbDown?: boolean } = {}) {
  const applied = overrides.appliedMigrations ?? localMigrations
  const prisma = {
    $queryRaw: jest.fn((strings: TemplateStringsArray) => {
      if (overrides.dbDown) return Promise.reject(new Error('ECONNREFUSED'))
      return strings.join('').includes('current_database')
        ? Promise.resolve([{ database: 'food_ordering', version: '16.2' }])
        : Promise.resolve([{ table_schema: 'food_ordering' }])
    }),
    $queryRawUnsafe: jest.fn(() =>
      Promise.resolve(
        applied.map((name) => ({ migration_name: name, finished_at: new Date('2026-01-01'), rolled_back_at: null })),
      ),
    ),
  }
  const redis = {
    ping: jest.fn(() => Promise.resolve('PONG')),
    getConnectionInfo: () => ({ host: 'localhost', port: 6379, db: 0, status: 'ready' }),
  }
  const upload = {
    checkStorage: jest.fn(() => Promise.resolve({ endpoint: 'http://localhost:9000', bucket: 'food-images', bucketExists: true })),
  }
  const broker = {
    isHealthy: jest.fn(() => (overrides.brokerDown ? Promise.reject(new Error('RabbitMQ check failed')) : Promise.resolve({}))),
  }
  const config = new ConfigService({
    RABBITMQ_URL: 'amqp://user:secret@mq-host:5672',
  })
  return new HealthInfoService(config, prisma as never, redis as never, upload as never, broker as never)
}

describe('HealthInfoService', () => {
  const originalUrl = process.env.DATABASE_URL

  beforeEach(() => {
    process.env.DATABASE_URL = 'postgresql://postgres:topsecret@db-host:5433/food_ordering'
  })
  afterAll(() => {
    process.env.DATABASE_URL = originalUrl
  })

  it('reports ok with port, database name and migration state when everything is up', async () => {
    const info = await build().getInfo()

    expect(info.status).toBe('ok')
    expect(info.service.port).toBe(Number(process.env.PORT || 5555))
    expect(info.database).toMatchObject({
      status: 'up',
      name: 'food_ordering',
      host: 'db-host',
      port: 5433,
      serverVersion: 'PostgreSQL 16.2',
      migrations: { complete: true, applied: localMigrations.length, pending: [] },
    })
    expect(info.broker).toMatchObject({ status: 'up', type: 'rabbitmq', host: 'mq-host:5672' })
  })

  it('never exposes credentials', async () => {
    const body = JSON.stringify(await build().getInfo())
    expect(body).not.toContain('topsecret')
    expect(body).not.toContain('secret@')
  })

  it('is degraded and lists pending migrations when the DB is behind', async () => {
    const info = await build({ appliedMigrations: localMigrations.slice(0, -1) }).getInfo()

    expect(info.status).toBe('degraded')
    expect(info.database.migrations).toMatchObject({ complete: false, pending: [localMigrations.at(-1)] })
  })

  it('is degraded with error details when a dependency is down', async () => {
    const info = await build({ brokerDown: true, dbDown: true }).getInfo()

    expect(info.status).toBe('degraded')
    expect(info.broker).toMatchObject({ status: 'down', error: 'RabbitMQ check failed' })
    expect(info.database).toMatchObject({ status: 'down', name: 'food_ordering', error: 'ECONNREFUSED' })
  })
})
