import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const userAgent = request.get('user-agent') || '';
    const ip = request.ip;

    const now = Date.now();

    this.logger.log(
      `Incoming Request: ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`,
    );

    if (Object.keys(body || {}).length > 0) {
      this.logger.debug(`Body: ${JSON.stringify(body)}`);
    }
    if (Object.keys(query || {}).length > 0) {
      this.logger.debug(`Query: ${JSON.stringify(query)}`);
    }
    if (Object.keys(params || {}).length > 0) {
      this.logger.debug(`Params: ${JSON.stringify(params)}`);
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - now;
          this.logger.log(
            `Response: ${method} ${url} - ${responseTime}ms - Status: 200`,
          );
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          this.logger.error(
            `Error: ${method} ${url} - ${responseTime}ms - ${error.message}`,
          );
        },
      }),
    );
  }
}
