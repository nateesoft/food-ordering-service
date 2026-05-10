import { Global, Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import pino, { Level } from 'pino';
import build from 'pino-elasticsearch';

@Global()
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      useFactory: () => {
        const level = (process.env.LOG_LEVEL || 'info') as Level;
        const streams: pino.StreamEntry[] = [
          { stream: process.stdout, level },
        ];

        if (process.env.ELASTICSEARCH_URL) {
          const esOptions: Parameters<typeof build>[0] = {
            index: process.env.ELASTICSEARCH_INDEX || 'food-ordering',
            node: process.env.ELASTICSEARCH_URL,
            esVersion: 8,
            flushBytes: 1000,
          };

          if (process.env.ELASTICSEARCH_USERNAME) {
            esOptions.auth = {
              username: process.env.ELASTICSEARCH_USERNAME,
              password: process.env.ELASTICSEARCH_PASSWORD || '',
            };
          }

          const esStream = build(esOptions);
          esStream.on('error', (err) =>
            console.error('Elasticsearch stream error:', err),
          );
          esStream.on('insertError', (err) =>
            console.error('Elasticsearch insert error:', err),
          );
          streams.push({ stream: esStream as unknown as NodeJS.WritableStream, level });
        }

        return {
          pinoHttp: [
            {
              level,
              timestamp: () => {
                const ts = new Date().toISOString();
                return `,"time":"${ts}","@timestamp":"${ts}"`;
              },
              base: { service: 'food-ordering-service' },
              formatters: {
                level: (label: string) => ({ level: label }),
              },
            },
            pino.multistream(streams),
          ],
        };
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
