/**
 * Project Cygnus Server
 * 
 * HTTP server for health checks, metrics, and API endpoints.
 */

import * as http from 'http';
import { PrometheusExporter } from './monitoring/PrometheusExporter.js';
import { MetricsCollector } from './monitoring/MetricsCollector.js';

export interface ServerConfig {
  port: number;
  host: string;
}

/**
 * HTTP Server for Project Cygnus
 */
export class CygnusServer {
  private server: http.Server | null = null;
  private config: ServerConfig;
  private metricsCollector: MetricsCollector;
  private prometheusExporter: PrometheusExporter;

  constructor(config: ServerConfig) {
    this.config = config;
    this.metricsCollector = new MetricsCollector();
    this.prometheusExporter = new PrometheusExporter(this.metricsCollector);
  }

  /**
   * Start the HTTP server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.on('error', (error) => {
        console.error('[Server] Error:', error);
        reject(error);
      });

      this.server.listen(this.config.port, this.config.host, () => {
        console.log(`[Server] Listening on http://${this.config.host}:${this.config.port}`);
        resolve();
      });
    });
  }

  /**
   * Stop the HTTP server
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close((error) => {
        if (error) {
          reject(error);
        } else {
          console.log('[Server] Stopped');
          resolve();
        }
      });
    });
  }

  /**
   * Handle HTTP requests
   */
  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const url = req.url || '/';

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Route handling
    if (url === '/health') {
      this.handleHealth(req, res);
    } else if (url === '/metrics') {
      this.handleMetrics(req, res);
    } else if (url === '/status') {
      this.handleStatus(req, res);
    } else if (url === '/') {
      this.handleRoot(req, res);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  }

  /**
   * Health check endpoint
   */
  private handleHealth(_req: http.IncomingMessage, res: http.ServerResponse): void {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }));
  }

  /**
   * Metrics endpoint (Prometheus format)
   */
  private handleMetrics(_req: http.IncomingMessage, res: http.ServerResponse): void {
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
    res.end(this.prometheusExporter.export());
  }

  /**
   * Status endpoint
   */
  private handleStatus(_req: http.IncomingMessage, res: http.ServerResponse): void {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'Project Cygnus',
      version: '0.7.0',
      status: 'running',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * Root endpoint
   */
  private handleRoot(_req: http.IncomingMessage, res: http.ServerResponse): void {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'Project Cygnus',
      version: '0.7.0',
      description: 'Machine Economy Stack - Autonomous Agentic Ecosystem',
      endpoints: {
        health: '/health',
        metrics: '/metrics',
        status: '/status',
      },
    }));
  }

  /**
   * Get metrics collector
   */
  getMetricsCollector(): MetricsCollector {
    return this.metricsCollector;
  }
}
