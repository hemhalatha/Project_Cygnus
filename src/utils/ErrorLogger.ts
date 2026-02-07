/**
 * Comprehensive Error Logging System
 * 
 * Provides structured error logging with context, severity levels,
 * and alerting capabilities.
 */

import * as fs from 'fs';
import * as path from 'path';

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ErrorContext {
  agentDID?: string;
  transactionId?: string;
  operation: string;
  component?: string;
  metadata?: Record<string, any>;
}

export interface ErrorLog {
  id: string;
  timestamp: number;
  errorType: string;
  errorMessage: string;
  stackTrace: string;
  context: ErrorContext;
  severity: ErrorSeverity;
  resolved: boolean;
  resolvedAt?: number;
}

export interface ErrorLoggerConfig {
  logDirectory: string;
  maxLogSize: number; // bytes
  maxLogAge: number; // milliseconds
  enableConsole: boolean;
  enableFile: boolean;
  alertThreshold: ErrorSeverity;
  alertCallback?: (log: ErrorLog) => void;
}

export class ErrorLogger {
  private logs: ErrorLog[] = [];
  private logFilePath: string;

  private defaultConfig: ErrorLoggerConfig = {
    logDirectory: './logs',
    maxLogSize: 10 * 1024 * 1024, // 10MB
    maxLogAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    enableConsole: true,
    enableFile: true,
    alertThreshold: ErrorSeverity.HIGH,
    alertCallback: undefined,
  };

  constructor(private config: Partial<ErrorLoggerConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config };
    const cfg = this.config as ErrorLoggerConfig;

    // Ensure log directory exists
    if (cfg.enableFile) {
      if (!fs.existsSync(cfg.logDirectory)) {
        fs.mkdirSync(cfg.logDirectory, { recursive: true });
      }
      this.logFilePath = path.join(cfg.logDirectory, 'errors.log');
    } else {
      this.logFilePath = '';
    }
  }

  /**
   * Log an error
   */
  logError(
    error: Error,
    context: ErrorContext,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): ErrorLog {
    const errorLog: ErrorLog = {
      id: this.generateId(),
      timestamp: Date.now(),
      errorType: error.name,
      errorMessage: error.message,
      stackTrace: error.stack || '',
      context,
      severity,
      resolved: false,
    };

    this.logs.push(errorLog);

    // Console logging
    if ((this.config as ErrorLoggerConfig).enableConsole) {
      this.logToConsole(errorLog);
    }

    // File logging
    if ((this.config as ErrorLoggerConfig).enableFile) {
      this.logToFile(errorLog);
    }

    // Alert if severity meets threshold
    if (this.shouldAlert(severity)) {
      this.alert(errorLog);
    }

    // Cleanup old logs
    this.cleanup();

    return errorLog;
  }

  /**
   * Log transaction failure
   */
  logTransactionFailure(
    transactionId: string,
    error: Error,
    agentDID: string,
    operation: string
  ): ErrorLog {
    return this.logError(
      error,
      {
        agentDID,
        transactionId,
        operation,
        component: 'TransactionExecutor',
      },
      ErrorSeverity.HIGH
    );
  }

  /**
   * Log network failure
   */
  logNetworkFailure(
    error: Error,
    endpoint: string,
    operation: string
  ): ErrorLog {
    return this.logError(
      error,
      {
        operation,
        component: 'Network',
        metadata: { endpoint },
      },
      ErrorSeverity.MEDIUM
    );
  }

  /**
   * Log validation failure
   */
  logValidationFailure(
    error: Error,
    input: any,
    operation: string
  ): ErrorLog {
    return this.logError(
      error,
      {
        operation,
        component: 'Validation',
        metadata: { input: JSON.stringify(input) },
      },
      ErrorSeverity.LOW
    );
  }

  /**
   * Log cryptographic failure
   */
  logCryptographicFailure(
    error: Error,
    operation: string,
    agentDID?: string
  ): ErrorLog {
    return this.logError(
      error,
      {
        agentDID,
        operation,
        component: 'Cryptography',
      },
      ErrorSeverity.CRITICAL
    );
  }

  /**
   * Mark error as resolved
   */
  resolveError(errorId: string): void {
    const log = this.logs.find(l => l.id === errorId);
    if (log) {
      log.resolved = true;
      log.resolvedAt = Date.now();
      console.log(`[ErrorLogger] Error ${errorId} marked as resolved`);
    }
  }

  /**
   * Get all errors
   */
  getAllErrors(includeResolved: boolean = false): ErrorLog[] {
    if (includeResolved) {
      return [...this.logs];
    }
    return this.logs.filter(log => !log.resolved);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): ErrorLog[] {
    return this.logs.filter(log => log.severity === severity && !log.resolved);
  }

  /**
   * Get errors by component
   */
  getErrorsByComponent(component: string): ErrorLog[] {
    return this.logs.filter(
      log => log.context.component === component && !log.resolved
    );
  }

  /**
   * Get error statistics
   */
  getStats(): {
    total: number;
    unresolved: number;
    bySeverity: Record<ErrorSeverity, number>;
    byComponent: Record<string, number>;
  } {
    const unresolved = this.logs.filter(log => !log.resolved);

    const bySeverity = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0,
    };

    const byComponent: Record<string, number> = {};

    unresolved.forEach(log => {
      bySeverity[log.severity]++;
      const component = log.context.component || 'Unknown';
      byComponent[component] = (byComponent[component] || 0) + 1;
    });

    return {
      total: this.logs.length,
      unresolved: unresolved.length,
      bySeverity,
      byComponent,
    };
  }

  /**
   * Log to console
   */
  private logToConsole(log: ErrorLog): void {
    const severityColors = {
      [ErrorSeverity.LOW]: '\x1b[36m',      // Cyan
      [ErrorSeverity.MEDIUM]: '\x1b[33m',   // Yellow
      [ErrorSeverity.HIGH]: '\x1b[31m',     // Red
      [ErrorSeverity.CRITICAL]: '\x1b[35m', // Magenta
    };

    const color = severityColors[log.severity];
    const reset = '\x1b[0m';

    console.error(
      `${color}[${log.severity}]${reset} ${log.errorType}: ${log.errorMessage}`
    );
    console.error(`  Operation: ${log.context.operation}`);
    if (log.context.component) {
      console.error(`  Component: ${log.context.component}`);
    }
    if (log.context.agentDID) {
      console.error(`  Agent: ${log.context.agentDID}`);
    }
    if (log.context.transactionId) {
      console.error(`  Transaction: ${log.context.transactionId}`);
    }
  }

  /**
   * Log to file
   */
  private logToFile(log: ErrorLog): void {
    try {
      const logLine = JSON.stringify(log) + '\n';
      fs.appendFileSync(this.logFilePath, logLine);
    } catch (error) {
      console.error('[ErrorLogger] Failed to write to log file:', error);
    }
  }

  /**
   * Check if should alert
   */
  private shouldAlert(severity: ErrorSeverity): boolean {
    const config = this.config as ErrorLoggerConfig;
    const severityOrder = [
      ErrorSeverity.LOW,
      ErrorSeverity.MEDIUM,
      ErrorSeverity.HIGH,
      ErrorSeverity.CRITICAL,
    ];

    const currentIndex = severityOrder.indexOf(severity);
    const thresholdIndex = severityOrder.indexOf(config.alertThreshold);

    return currentIndex >= thresholdIndex;
  }

  /**
   * Send alert
   */
  private alert(log: ErrorLog): void {
    const config = this.config as ErrorLoggerConfig;

    console.error(
      `\n🚨 ALERT: ${log.severity} error detected!\n`,
      `Error: ${log.errorMessage}\n`,
      `Operation: ${log.context.operation}\n`
    );

    if (config.alertCallback) {
      try {
        config.alertCallback(log);
      } catch (error) {
        console.error('[ErrorLogger] Alert callback failed:', error);
      }
    }
  }

  /**
   * Cleanup old logs
   */
  private cleanup(): void {
    const config = this.config as ErrorLoggerConfig;
    const cutoff = Date.now() - config.maxLogAge;

    // Remove old logs from memory
    this.logs = this.logs.filter(log => log.timestamp >= cutoff);

    // Rotate log file if too large
    if (config.enableFile && fs.existsSync(this.logFilePath)) {
      const stats = fs.statSync(this.logFilePath);
      if (stats.size >= config.maxLogSize) {
        this.rotateLogFile();
      }
    }
  }

  /**
   * Rotate log file
   */
  private rotateLogFile(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archivePath = this.logFilePath.replace('.log', `-${timestamp}.log`);

    try {
      fs.renameSync(this.logFilePath, archivePath);
      console.log(`[ErrorLogger] Log file rotated to ${archivePath}`);
    } catch (error) {
      console.error('[ErrorLogger] Failed to rotate log file:', error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
    console.log('[ErrorLogger] All logs cleared');
  }
}

/**
 * Global error logger instance
 */
export const globalErrorLogger = new ErrorLogger();
