import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const jsonTransportFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: () => ({
        level: process.env.LOG_LEVEL || 'info',
        defaultMeta: { service: 'food-ordering-service' },
        transports: [
          new winston.transports.Console({ format: jsonTransportFormat }),
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: jsonTransportFormat,
          }),
          new winston.transports.File({
            filename: 'logs/app.log',
            format: jsonTransportFormat,
          }),
        ],
      }),
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
