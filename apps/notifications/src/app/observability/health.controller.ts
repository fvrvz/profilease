import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  MemoryHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { MetricsService, ObservabilitySnapshot } from './metrics.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly metrics: MetricsService
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Ensure heap does not exceed 300MB
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      // Ensure RSS does not exceed 500MB
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
    ]);
  }

  @Get('live')
  @HealthCheck()
  liveness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => Promise.resolve({ app_live: { status: 'up' } }),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
    ]);
  }

  @Get('metrics')
  getMetrics(): ObservabilitySnapshot {
    return this.metrics.getSnapshot();
  }
}
