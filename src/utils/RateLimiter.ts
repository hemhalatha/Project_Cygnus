/**
 * Rate Limiter Implementation
 *
 * Provides rate limiting using token bucket and sliding window algorithms
 * to prevent denial-of-service attacks.
 */

export interface RateLimitConfig {
  maxRequests: number; // Maximum requests per window
  windowMs: number; // Time window in milliseconds
  algorithm: 'token-bucket' | 'sliding-window';
  keyGenerator?: (req: any) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Token Bucket Rate Limiter
 */
export class TokenBucketRateLimiter {
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();

  constructor(
    private maxTokens: number,
    private refillRate: number, // tokens per second
    private refillInterval: number = 1000 // ms
  ) {}

  /**
   * Check if request is allowed
   */
  async checkLimit(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = {
        tokens: this.maxTokens - 1,
        lastRefill: now,
      };
      this.buckets.set(key, bucket);

      return {
        allowed: true,
        remaining: bucket.tokens,
        resetTime: now + this.refillInterval,
      };
    }

    // Refill tokens based on time elapsed
    const timeSinceRefill = now - bucket.lastRefill;
    const tokensToAdd = Math.floor((timeSinceRefill / 1000) * this.refillRate);

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    // Check if tokens available
    if (bucket.tokens > 0) {
      bucket.tokens--;
      return {
        allowed: true,
        remaining: bucket.tokens,
        resetTime: now + this.refillInterval,
      };
    }

    // Rate limited
    const timeUntilRefill = this.refillInterval - (now - bucket.lastRefill);
    return {
      allowed: false,
      remaining: 0,
      resetTime: now + timeUntilRefill,
      retryAfter: Math.ceil(timeUntilRefill / 1000),
    };
  }

  /**
   * Reset bucket for key
   */
  reset(key: string): void {
    this.buckets.delete(key);
  }

  /**
   * Clear all buckets
   */
  clearAll(): void {
    this.buckets.clear();
  }
}

/**
 * Sliding Window Rate Limiter
 */
export class SlidingWindowRateLimiter {
  private windows: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  /**
   * Check if request is allowed
   */
  async checkLimit(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get or create window
    let requests = this.windows.get(key) || [];

    // Remove old requests outside window
    requests = requests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (requests.length >= this.maxRequests) {
      const oldestRequest = requests[0];
      const resetTime = oldestRequest + this.windowMs;
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter,
      };
    }

    // Add current request
    requests.push(now);
    this.windows.set(key, requests);

    return {
      allowed: true,
      remaining: this.maxRequests - requests.length,
      resetTime: now + this.windowMs,
    };
  }

  /**
   * Reset window for key
   */
  reset(key: string): void {
    this.windows.delete(key);
  }

  /**
   * Clear all windows
   */
  clearAll(): void {
    this.windows.clear();
  }

  /**
   * Cleanup old windows
   */
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    this.windows.forEach((requests, key) => {
      const filtered = requests.filter(timestamp => timestamp > windowStart);
      if (filtered.length === 0) {
        this.windows.delete(key);
      } else {
        this.windows.set(key, filtered);
      }
    });
  }
}

/**
 * Rate Limiter with configurable algorithm
 */
export class RateLimiter {
  private limiter: TokenBucketRateLimiter | SlidingWindowRateLimiter;
  private keyGenerator: (req: any) => string;

  constructor(config: RateLimitConfig) {
    if (config.algorithm === 'token-bucket') {
      const refillRate = config.maxRequests / (config.windowMs / 1000);
      this.limiter = new TokenBucketRateLimiter(config.maxRequests, refillRate, config.windowMs);
    } else {
      this.limiter = new SlidingWindowRateLimiter(config.maxRequests, config.windowMs);
    }

    this.keyGenerator = config.keyGenerator || this.defaultKeyGenerator;
  }

  /**
   * Check rate limit for request
   */
  async checkLimit(req: any): Promise<RateLimitResult> {
    const key = this.keyGenerator(req);
    return this.limiter.checkLimit(key);
  }

  /**
   * Express middleware
   */
  middleware() {
    return async (req: any, res: any, next: any) => {
      const result = await this.checkLimit(req);

      // Set rate limit headers
      res.setHeader(
        'X-RateLimit-Limit',
        this.limiter instanceof TokenBucketRateLimiter
          ? (this.limiter as any).maxTokens
          : (this.limiter as any).maxRequests
      );
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.resetTime);

      if (!result.allowed) {
        res.setHeader('Retry-After', result.retryAfter || 60);
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
        });
      }

      next();
    };
  }

  /**
   * Default key generator (uses IP address)
   */
  private defaultKeyGenerator(req: any): string {
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  /**
   * Reset rate limit for key
   */
  reset(key: string): void {
    this.limiter.reset(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.limiter.clearAll();
  }
}

/**
 * Rate Limiter Manager for multiple endpoints
 */
export class RateLimiterManager {
  private limiters: Map<string, RateLimiter> = new Map();

  /**
   * Create rate limiter for endpoint
   */
  createLimiter(endpoint: string, config: RateLimitConfig): RateLimiter {
    const limiter = new RateLimiter(config);
    this.limiters.set(endpoint, limiter);
    return limiter;
  }

  /**
   * Get rate limiter for endpoint
   */
  getLimiter(endpoint: string): RateLimiter | undefined {
    return this.limiters.get(endpoint);
  }

  /**
   * Check rate limit for endpoint
   */
  async checkLimit(endpoint: string, req: any): Promise<RateLimitResult> {
    const limiter = this.limiters.get(endpoint);
    if (!limiter) {
      throw new Error(`No rate limiter configured for ${endpoint}`);
    }
    return limiter.checkLimit(req);
  }

  /**
   * Create middleware for endpoint
   */
  middleware(endpoint: string) {
    return async (req: any, res: any, next: any) => {
      const limiter = this.limiters.get(endpoint);
      if (!limiter) {
        return next();
      }
      return limiter.middleware()(req, res, next);
    };
  }

  /**
   * Reset all rate limiters
   */
  resetAll(): void {
    this.limiters.forEach(limiter => limiter.clearAll());
  }
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  // Strict: 10 requests per minute
  STRICT: {
    maxRequests: 10,
    windowMs: 60 * 1000,
    algorithm: 'sliding-window' as const,
  },

  // Standard: 100 requests per minute
  STANDARD: {
    maxRequests: 100,
    windowMs: 60 * 1000,
    algorithm: 'sliding-window' as const,
  },

  // Relaxed: 1000 requests per minute
  RELAXED: {
    maxRequests: 1000,
    windowMs: 60 * 1000,
    algorithm: 'token-bucket' as const,
  },

  // Payment endpoints: 50 requests per minute
  PAYMENT: {
    maxRequests: 50,
    windowMs: 60 * 1000,
    algorithm: 'sliding-window' as const,
  },

  // Authentication: 5 requests per minute
  AUTH: {
    maxRequests: 5,
    windowMs: 60 * 1000,
    algorithm: 'sliding-window' as const,
  },
};
