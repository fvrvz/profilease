import { describe, it, expect, beforeEach } from 'vitest';
import { HealthController } from './health.controller';
import { HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import { MetricsService } from './metrics.service';

describe('HealthController', () => {
  let controller: HealthController;
  let metricsService: MetricsService;

  beforeEach(() => {
    metricsService = new MetricsService();
    const mockHealthService = {
      check: (indicators: Array<() => Promise<unknown>>) =>
        Promise.all(indicators.map((fn) => fn())).then(() => ({
          status: 'ok',
          info: { memory_heap: { status: 'up' } },
          error: {},
          details: { memory_heap: { status: 'up' } },
        })),
    } as unknown as HealthCheckService;

    const mockMemory = {
      checkHeap: () => Promise.resolve({ memory_heap: { status: 'up' } }),
      checkRSS: () => Promise.resolve({ memory_rss: { status: 'up' } }),
    } as unknown as MemoryHealthIndicator;

    controller = new HealthController(mockHealthService, mockMemory, metricsService);
  });

  it('should return metrics snapshot with uptime and request stats', () => {
    metricsService.recordMetric({
      path: '/api/notifications/dispatch',
      method: 'POST',
      statusCode: 200,
      durationMs: 42,
      timestamp: new Date().toISOString(),
    });

    const snapshot = controller.getMetrics();
    expect(snapshot.totalRequests).toBe(1);
    expect(snapshot.averageDurationMs).toBe(42);
    expect(snapshot.recentRequests.length).toBe(1);
  });

  it('should check health status', async () => {
    const res = await controller.check();
    expect(res.status).toBe('ok');
  });
});
