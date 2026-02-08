/**
 * Performance Metrics Collection System
 *
 * Collects and tracks performance metrics for transaction finality,
 * payment channel latency, x402 handshake duration, and agent decision-making.
 */

export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface MetricStats {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface PerformanceThresholds {
  settlementFinality: number; // ms
  channelLatency: number; // ms
  x402Handshake: number; // ms
  agentDecision: number; // ms
  contractExecution: number; // ms
}

export class MetricsCollector {
  private metrics: Map<string, number[]> = new Map();
  private thresholds: PerformanceThresholds = {
    settlementFinality: 5000, // 5 seconds
    channelLatency: 100, // 100ms
    x402Handshake: 500, // 500ms
    agentDecision: 1000, // 1 second
    contractExecution: 3000, // 3 seconds
  };

  private alertCallback?: (metric: string, value: number, threshold: number) => void;

  constructor(
    thresholds?: Partial<PerformanceThresholds>,
    alertCallback?: (metric: string, value: number, threshold: number) => void
  ) {
    if (thresholds) {
      this.thresholds = { ...this.thresholds, ...thresholds };
    }
    this.alertCallback = alertCallback;
  }

  /**
   * Record a metric
   */
  record(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.getMetricKey(name, tags);

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    this.metrics.get(key)!.push(value);

    // Check threshold and alert if exceeded
    this.checkThreshold(name, value);
  }

  /**
   * Record settlement finality time
   */
  recordSettlementFinality(durationMs: number, transactionId?: string): void {
    this.record('settlement.finality', durationMs, {
      transactionId: transactionId || 'unknown',
    });
  }

  /**
   * Record payment channel latency
   */
  recordChannelLatency(durationMs: number, channelId?: string): void {
    this.record('channel.latency', durationMs, {
      channelId: channelId || 'unknown',
    });
  }

  /**
   * Record x402 handshake duration
   */
  recordX402Handshake(durationMs: number, endpoint?: string): void {
    this.record('x402.handshake', durationMs, {
      endpoint: endpoint || 'unknown',
    });
  }

  /**
   * Record agent decision-making time
   */
  recordAgentDecision(durationMs: number, decisionType?: string): void {
    this.record('agent.decision', durationMs, {
      type: decisionType || 'unknown',
    });
  }

  /**
   * Record contract execution time
   */
  recordContractExecution(durationMs: number, contractType?: string): void {
    this.record('contract.execution', durationMs, {
      type: contractType || 'unknown',
    });
  }

  /**
   * Record opportunity evaluation time
   */
  recordOpportunityEvaluation(durationMs: number, opportunityType?: string): void {
    this.record('opportunity.evaluation', durationMs, {
      type: opportunityType || 'unknown',
    });
  }

  /**
   * Record risk assessment time
   */
  recordRiskAssessment(durationMs: number): void {
    this.record('risk.assessment', durationMs);
  }

  /**
   * Record transaction execution time
   */
  recordTransactionExecution(durationMs: number, transactionType?: string): void {
    this.record('transaction.execution', durationMs, {
      type: transactionType || 'unknown',
    });
  }

  /**
   * Get statistics for a metric
   */
  getStats(name: string, tags?: Record<string, string>): MetricStats | null {
    const key = this.getMetricKey(name, tags);
    const values = this.metrics.get(key);

    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);

    return {
      count: values.length,
      sum,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p50: this.percentile(sorted, 0.5),
      p95: this.percentile(sorted, 0.95),
      p99: this.percentile(sorted, 0.99),
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, number[]> {
    return new Map(this.metrics);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): Record<string, MetricStats | null> {
    return {
      settlementFinality: this.getStats('settlement.finality'),
      channelLatency: this.getStats('channel.latency'),
      x402Handshake: this.getStats('x402.handshake'),
      agentDecision: this.getStats('agent.decision'),
      contractExecution: this.getStats('contract.execution'),
      opportunityEvaluation: this.getStats('opportunity.evaluation'),
      riskAssessment: this.getStats('risk.assessment'),
      transactionExecution: this.getStats('transaction.execution'),
    };
  }

  /**
   * Check if metric exceeds threshold
   */
  private checkThreshold(name: string, value: number): void {
    let threshold: number | undefined;

    switch (name) {
      case 'settlement.finality':
        threshold = this.thresholds.settlementFinality;
        break;
      case 'channel.latency':
        threshold = this.thresholds.channelLatency;
        break;
      case 'x402.handshake':
        threshold = this.thresholds.x402Handshake;
        break;
      case 'agent.decision':
        threshold = this.thresholds.agentDecision;
        break;
      case 'contract.execution':
        threshold = this.thresholds.contractExecution;
        break;
    }

    if (threshold && value > threshold) {
      console.warn(
        `[MetricsCollector] Performance threshold exceeded: ${name} = ${value}ms (threshold: ${threshold}ms)`
      );

      if (this.alertCallback) {
        this.alertCallback(name, value, threshold);
      }
    }
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get metric key with tags
   */
  private getMetricKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return name;
    }

    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join(',');

    return `${name}{${tagString}}`;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Clear metrics older than specified age
   */
  clearOld(maxAgeMs: number): void {
    // Note: This implementation keeps all values in memory
    // In production, you'd want to use a time-series database
    console.log(`[MetricsCollector] Clearing metrics older than ${maxAgeMs}ms`);
  }

  /**
   * Export metrics for external monitoring
   */
  export(): Record<string, any> {
    const exported: Record<string, any> = {};

    this.metrics.forEach((values, key) => {
      const stats = this.getStats(key.split('{')[0], undefined);
      exported[key] = {
        values: values.slice(-100), // Last 100 values
        stats,
      };
    });

    return exported;
  }
}

/**
 * Timer utility for measuring durations
 */
export class Timer {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Get elapsed time in milliseconds
   */
  elapsed(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Reset timer
   */
  reset(): void {
    this.startTime = Date.now();
  }

  /**
   * Stop timer and return elapsed time
   */
  stop(): number {
    return this.elapsed();
  }
}

/**
 * Decorator for automatic timing
 */
export function Timed(metricName: string, collector: MetricsCollector) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const timer = new Timer();
      try {
        const result = await originalMethod.apply(this, args);
        collector.record(metricName, timer.elapsed());
        return result;
      } catch (error) {
        collector.record(`${metricName}.error`, timer.elapsed());
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Global metrics collector instance
 */
export const globalMetrics = new MetricsCollector();
