import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Observability');

  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<{ method?: string; url?: string; originalUrl?: string }>();
    const res = httpCtx.getResponse<{ statusCode?: number }>();

    const method = req?.method || 'EVENT';
    const path = req?.originalUrl || req?.url || 'microservice.event';

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - start;
        const statusCode = res?.statusCode || 200;

        this.metricsService.recordMetric({
          path,
          method,
          statusCode,
          durationMs,
          timestamp: new Date().toISOString(),
        });

        this.logger.log(`[OBSERVABILITY] ${method} ${path} -> ${statusCode} in ${durationMs}ms`);
      })
    );
  }
}
