/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascading failures by stopping requests to failing services
 * and allowing them time to recover.
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, rejecting requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening
  successThreshold: number;      // Number of successes to close from half-open
  timeout: number;               // Time to wait before half-open (ms)
  monitoringPeriod: number;      // Time window for failure counting (ms)
  volumeThreshold: number;       // Minimum requests before circuit can open
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  totalRequests: number;
  lastFailureTime?: number;
  lastStateChange: number;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private consecutiveSuccesses: number = 0;
  private consecutiveFailures: number = 0;
  private lastFailureTime?: number;
  private lastStateChange: number = Date.now();
  private requestLog: { timestamp: number; success: boolean }[] = [];

  private defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000, // 1 minute
    monitoringPeriod: 120000, // 2 minutes
    volumeThreshold: 10,
  };

  constructor(
    private name: string,
    private config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Execute operation through circuit breaker
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new Error(
          `Circuit breaker [${this.name}] is OPEN. Service unavailable.`
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Execute with fallback
   */
  async executeWithFallback<T>(
    operation: () => Promise<T>,
    fallback: () => Promise<T>
  ): Promise<T> {
    try {
      return await this.execute(operation);
    } catch (error) {
      console.warn(
        `[CircuitBreaker] ${this.name} failed, using fallback:`,
        error
      );
      return await fallback();
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.successes++;
    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;

    this.recordRequest(true);

    if (this.state === CircuitState.HALF_OPEN) {
      const config = this.config as CircuitBreakerConfig;
      if (this.consecutiveSuccesses >= config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.failures++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = Date.now();

    this.recordRequest(false);

    if (this.state === CircuitState.HALF_OPEN) {
      // Immediately open on failure in half-open state
      this.transitionTo(CircuitState.OPEN);
      return;
    }

    if (this.state === CircuitState.CLOSED) {
      const config = this.config as CircuitBreakerConfig;
      const recentRequests = this.getRecentRequests();

      // Check if we have enough volume and failure rate
      if (recentRequests.length >= config.volumeThreshold) {
        const recentFailures = recentRequests.filter(r => !r.success).length;
        const failureRate = recentFailures / recentRequests.length;

        if (
          this.consecutiveFailures >= config.failureThreshold ||
          failureRate >= 0.5
        ) {
          this.transitionTo(CircuitState.OPEN);
        }
      }
    }
  }

  /**
   * Check if circuit should attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;

    const config = this.config as CircuitBreakerConfig;
    const timeSinceLastFailure = Date.now() - this.lastFailureTime;

    return timeSinceLastFailure >= config.timeout;
  }

  /**
   * Transition to new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();

    console.log(
      `[CircuitBreaker] ${this.name} transitioned from ${oldState} to ${newState}`
    );

    // Reset counters on state change
    if (newState === CircuitState.CLOSED) {
      this.consecutiveFailures = 0;
      this.consecutiveSuccesses = 0;
    } else if (newState === CircuitState.HALF_OPEN) {
      this.consecutiveSuccesses = 0;
    }
  }

  /**
   * Record request in log
   */
  private recordRequest(success: boolean): void {
    const config = this.config as CircuitBreakerConfig;
    const now = Date.now();

    this.requestLog.push({ timestamp: now, success });

    // Clean old entries
    const cutoff = now - config.monitoringPeriod;
    this.requestLog = this.requestLog.filter(r => r.timestamp >= cutoff);
  }

  /**
   * Get recent requests within monitoring period
   */
  private getRecentRequests(): { timestamp: number; success: boolean }[] {
    const config = this.config as CircuitBreakerConfig;
    const cutoff = Date.now() - config.monitoringPeriod;
    return this.requestLog.filter(r => r.timestamp >= cutoff);
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      totalRequests: this.failures + this.successes,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
      consecutiveSuccesses: this.consecutiveSuccesses,
      consecutiveFailures: this.consecutiveFailures,
    };
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Force state change (for testing/admin)
   */
  forceState(state: CircuitState): void {
    this.transitionTo(state);
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.consecutiveSuccesses = 0;
    this.consecutiveFailures = 0;
    this.lastFailureTime = undefined;
    this.lastStateChange = Date.now();
    this.requestLog = [];
    console.log(`[CircuitBreaker] ${this.name} reset`);
  }
}

/**
 * Circuit Breaker Manager for multiple services
 */
export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create circuit breaker for service
   */
  getBreaker(
    serviceName: string,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      this.breakers.set(serviceName, new CircuitBreaker(serviceName, config));
    }
    return this.breakers.get(serviceName)!;
  }

  /**
   * Get all breaker stats
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats();
    });
    return stats;
  }

  /**
   * Reset all breakers
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }
}
