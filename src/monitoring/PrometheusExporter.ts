/**
 * Prometheus Metrics Exporter
 *
 * Exports application metrics in Prometheus format
 */

import { MetricsCollector } from './MetricsCollector';

export interface PrometheusMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  help: string;
  value: number | string;
  labels?: Record<string, string>;
}

export class PrometheusExporter {
  private metrics: Map<string, PrometheusMetric> = new Map();

  constructor(private collector: MetricsCollector) {}

  /**
   * Register a metric
   */
  register(metric: PrometheusMetric): void {
    const key = this.getMetricKey(metric.name, metric.labels);
    this.metrics.set(key, metric);
  }

  /**
   * Update metric value
   */
  update(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    const metric = this.metrics.get(key);
    if (metric) {
      metric.value = value;
    }
  }

  /**
   * Increment counter
   */
  increment(name: string, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    const metric = this.metrics.get(key);
    if (metric && typeof metric.value === 'number') {
      metric.value++;
    }
  }

  /**
   * Export metrics in Prometheus format
   */
  export(): string {
    const lines: string[] = [];

    // Group metrics by name
    const grouped = new Map<string, PrometheusMetric[]>();
    this.metrics.forEach(metric => {
      if (!grouped.has(metric.name)) {
        grouped.set(metric.name, []);
      }
      grouped.get(metric.name)!.push(metric);
    });

    // Export each metric group
    grouped.forEach((metrics, name) => {
      const first = metrics[0];

      // Add HELP and TYPE
      lines.push(`# HELP ${name} ${first.help}`);
      lines.push(`# TYPE ${name} ${first.type}`);

      // Add metric values
      metrics.forEach(metric => {
        const labels = this.formatLabels(metric.labels);
        lines.push(`${metric.name}${labels} ${metric.value}`);
      });

      lines.push(''); // Empty line between metrics
    });

    // Add collector metrics
    lines.push(...this.exportCollectorMetrics());

    return lines.join('\n');
  }

  /**
   * Export collector metrics
   */
  private exportCollectorMetrics(): string[] {
    const lines: string[] = [];
    const summary = this.collector.getPerformanceSummary();

    // Settlement finality
    if (summary.settlementFinality) {
      lines.push('# HELP cygnus_settlement_duration_seconds Settlement finality duration');
      lines.push('# TYPE cygnus_settlement_duration_seconds summary');
      lines.push(
        `cygnus_settlement_duration_seconds{quantile="0.5"} ${summary.settlementFinality.p50 / 1000}`
      );
      lines.push(
        `cygnus_settlement_duration_seconds{quantile="0.95"} ${summary.settlementFinality.p95 / 1000}`
      );
      lines.push(
        `cygnus_settlement_duration_seconds{quantile="0.99"} ${summary.settlementFinality.p99 / 1000}`
      );
      lines.push(`cygnus_settlement_duration_seconds_sum ${summary.settlementFinality.sum / 1000}`);
      lines.push(`cygnus_settlement_duration_seconds_count ${summary.settlementFinality.count}`);
      lines.push('');
    }

    // Channel latency
    if (summary.channelLatency) {
      lines.push('# HELP cygnus_channel_latency_milliseconds Payment channel latency');
      lines.push('# TYPE cygnus_channel_latency_milliseconds summary');
      lines.push(
        `cygnus_channel_latency_milliseconds{quantile="0.5"} ${summary.channelLatency.p50}`
      );
      lines.push(
        `cygnus_channel_latency_milliseconds{quantile="0.95"} ${summary.channelLatency.p95}`
      );
      lines.push(
        `cygnus_channel_latency_milliseconds{quantile="0.99"} ${summary.channelLatency.p99}`
      );
      lines.push(`cygnus_channel_latency_milliseconds_sum ${summary.channelLatency.sum}`);
      lines.push(`cygnus_channel_latency_milliseconds_count ${summary.channelLatency.count}`);
      lines.push('');
    }

    // Agent decision time
    if (summary.agentDecision) {
      lines.push('# HELP cygnus_agent_decision_milliseconds Agent decision-making time');
      lines.push('# TYPE cygnus_agent_decision_milliseconds summary');
      lines.push(`cygnus_agent_decision_milliseconds{quantile="0.5"} ${summary.agentDecision.p50}`);
      lines.push(
        `cygnus_agent_decision_milliseconds{quantile="0.95"} ${summary.agentDecision.p95}`
      );
      lines.push(
        `cygnus_agent_decision_milliseconds{quantile="0.99"} ${summary.agentDecision.p99}`
      );
      lines.push(`cygnus_agent_decision_milliseconds_sum ${summary.agentDecision.sum}`);
      lines.push(`cygnus_agent_decision_milliseconds_count ${summary.agentDecision.count}`);
      lines.push('');
    }

    return lines;
  }

  /**
   * Format labels for Prometheus
   */
  private formatLabels(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }

    const pairs = Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');

    return `{${pairs}}`;
  }

  /**
   * Get metric key
   */
  private getMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }

    const labelString = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join(',');

    return `${name}{${labelString}}`;
  }

  /**
   * Create HTTP handler for metrics endpoint
   */
  createHandler() {
    return (_req: any, res: any) => {
      res.setHeader('Content-Type', 'text/plain; version=0.0.4');
      res.send(this.export());
    };
  }
}

/**
 * Default Prometheus metrics
 */
export function createDefaultMetrics(exporter: PrometheusExporter): void {
  // Error counters
  exporter.register({
    name: 'cygnus_errors_total',
    type: 'counter',
    help: 'Total number of errors',
    value: 0,
    labels: { severity: 'low' },
  });

  exporter.register({
    name: 'cygnus_errors_total',
    type: 'counter',
    help: 'Total number of errors',
    value: 0,
    labels: { severity: 'medium' },
  });

  exporter.register({
    name: 'cygnus_errors_total',
    type: 'counter',
    help: 'Total number of errors',
    value: 0,
    labels: { severity: 'high' },
  });

  exporter.register({
    name: 'cygnus_errors_total',
    type: 'counter',
    help: 'Total number of errors',
    value: 0,
    labels: { severity: 'critical' },
  });

  // Transaction counters
  exporter.register({
    name: 'cygnus_transactions_total',
    type: 'counter',
    help: 'Total number of transactions',
    value: 0,
    labels: { type: 'payment' },
  });

  exporter.register({
    name: 'cygnus_transactions_total',
    type: 'counter',
    help: 'Total number of transactions',
    value: 0,
    labels: { type: 'loan' },
  });

  exporter.register({
    name: 'cygnus_transactions_total',
    type: 'counter',
    help: 'Total number of transactions',
    value: 0,
    labels: { type: 'trade' },
  });

  // Circuit breaker state
  exporter.register({
    name: 'cygnus_circuit_breaker_state',
    type: 'gauge',
    help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
    value: 0,
    labels: { service: 'stellar-api' },
  });

  // Active resources
  exporter.register({
    name: 'cygnus_active_loans',
    type: 'gauge',
    help: 'Number of active loans',
    value: 0,
  });

  exporter.register({
    name: 'cygnus_active_escrows',
    type: 'gauge',
    help: 'Number of active escrows',
    value: 0,
  });

  exporter.register({
    name: 'cygnus_active_channels',
    type: 'gauge',
    help: 'Number of active payment channels',
    value: 0,
  });

  // Credit score
  exporter.register({
    name: 'cygnus_credit_score',
    type: 'gauge',
    help: 'Agent credit score',
    value: 500,
  });

  // Rate limiting
  exporter.register({
    name: 'cygnus_rate_limit_exceeded_total',
    type: 'counter',
    help: 'Total number of rate limit exceeded events',
    value: 0,
  });
}
