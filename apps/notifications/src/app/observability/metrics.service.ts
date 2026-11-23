import { Injectable } from '@nestjs/common';

export interface RouteMetric {
  readonly path: string;
  readonly method: string;
  readonly statusCode: number;
  readonly durationMs: number;
  readonly timestamp: string;
}

export interface ObservabilitySnapshot {
  readonly uptimeSeconds: number;
  readonly memoryUsage: NodeJS.MemoryUsage;
  readonly totalRequests: number;
  readonly averageDurationMs: number;
  readonly recentRequests: readonly RouteMetric[];
}

@Injectable()
export class MetricsService {
  private readonly startTime = Date.now();
  private readonly metricsHistory: RouteMetric[] = [];
  private totalRequests = 0;
  private totalDurationMs = 0;

  recordMetric(metric: RouteMetric): void {
    this.totalRequests++;
    this.totalDurationMs += metric.durationMs;
    this.metricsHistory.unshift(metric);
    if (this.metricsHistory.length > 50) {
      this.metricsHistory.pop();
    }
  }

  getSnapshot(): ObservabilitySnapshot {
    const avg = this.totalRequests > 0 ? this.totalDurationMs / this.totalRequests : 0;
    return {
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      memoryUsage: process.memoryUsage(),
      totalRequests: this.totalRequests,
      averageDurationMs: Math.round(avg * 100) / 100,
      recentRequests: this.metricsHistory.slice(0, 10),
    };
  }
}
