import { Injectable, NestMiddleware } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: Logger) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const meta = {
        method,
        url: originalUrl,
        statusCode: res.statusCode,
        duration,
        ip,
        userAgent,
      };

      if (res.statusCode >= 500) {
        this.logger.error(meta, 'HTTP_REQUEST');
      } else if (res.statusCode >= 400) {
        this.logger.warn(meta, 'HTTP_REQUEST');
      } else {
        this.logger.log(meta, 'HTTP_REQUEST');
      }
    });

    next();
  }
}
