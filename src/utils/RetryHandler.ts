/**
 * Retry Handler with Exponential Backoff
 *
 * Provides retry logic for network operations and external dependencies
 * with configurable exponential backoff and jitter.
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  exponentialBase: number;
  jitter: boolean;
  retryableErrors?: string[];
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDelay: number;
}

export class RetryHandler {
  private defaultConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    exponentialBase: 2,
    jitter: true,
    retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH', 'EAI_AGAIN'],
  };

  constructor(private config: Partial<RetryConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Execute operation with retry logic
   */
  async execute<T>(operation: () => Promise<T>, operationName: string = 'operation'): Promise<T> {
    const config = this.config as RetryConfig;
    let lastError: Error | undefined;
    let totalDelay = 0;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await operation();

        if (attempt > 0) {
          console.log(`[RetryHandler] ${operationName} succeeded after ${attempt} retries`);
        }

        return result;
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        if (!this.isRetryable(error as Error)) {
          console.error(`[RetryHandler] ${operationName} failed with non-retryable error:`, error);
          throw error;
        }

        // Don't retry if we've exhausted attempts
        if (attempt === config.maxRetries) {
          console.error(`[RetryHandler] ${operationName} failed after ${attempt + 1} attempts`);
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt);
        totalDelay += delay;

        console.warn(
          `[RetryHandler] ${operationName} failed (attempt ${attempt + 1}/${
            config.maxRetries + 1
          }), retrying in ${delay}ms...`,
          error
        );

        await this.sleep(delay);
      }
    }

    throw lastError || new Error(`${operationName} failed after retries`);
  }

  /**
   * Execute with result wrapper (doesn't throw)
   */
  async executeWithResult<T>(
    operation: () => Promise<T>,
    _operationName: string = 'operation'
  ): Promise<RetryResult<T>> {
    const config = this.config as RetryConfig;
    let lastError: Error | undefined;
    let totalDelay = 0;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await operation();
        return {
          success: true,
          result,
          attempts: attempt + 1,
          totalDelay,
        };
      } catch (error) {
        lastError = error as Error;

        if (!this.isRetryable(error as Error) || attempt === config.maxRetries) {
          return {
            success: false,
            error: lastError,
            attempts: attempt + 1,
            totalDelay,
          };
        }

        const delay = this.calculateDelay(attempt);
        totalDelay += delay;
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: config.maxRetries + 1,
      totalDelay,
    };
  }

  /**
   * Calculate delay with exponential backoff and optional jitter
   */
  private calculateDelay(attempt: number): number {
    const config = this.config as RetryConfig;

    // Exponential backoff: baseDelay * (exponentialBase ^ attempt)
    let delay = config.baseDelay * Math.pow(config.exponentialBase, attempt);

    // Cap at maxDelay
    delay = Math.min(delay, config.maxDelay);

    // Add jitter to prevent thundering herd
    if (config.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay = delay + (Math.random() * jitterAmount * 2 - jitterAmount);
    }

    return Math.floor(delay);
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: Error): boolean {
      const config = this.config as RetryConfig;

      // Check error code
      if ('code' in error && config.retryableErrors) {
        return config.retryableErrors.includes((error as any).code);
      }

      // Check error message for common retryable patterns (case-insensitive)
      const message = error.message.toUpperCase();
      const retryablePatterns = [
        'TIMEOUT',
        'ETIMEDOUT',
        'ECONNREFUSED',
        'ENOTFOUND',
        'ENETUNREACH',
        'EAI_AGAIN',
        'NETWORK',
        'TEMPORARY',
        'UNAVAILABLE',
        'RATE LIMIT',
        'TOO MANY REQUESTS',
      ];

      return retryablePatterns.some(pattern => message.includes(pattern));
    }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Decorator for automatic retry
 */
export function Retry(config?: Partial<RetryConfig>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const retryHandler = new RetryHandler(config);

    descriptor.value = async function (...args: any[]) {
      return retryHandler.execute(
        () => originalMethod.apply(this, args),
        `${target.constructor.name}.${propertyKey}`
      );
    };

    return descriptor;
  };
}
