/**
 * Unit Tests for CircuitBreaker
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitBreaker, CircuitState } from '../../src/utils/CircuitBreaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('test-service', {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
      monitoringPeriod: 5000,
      volumeThreshold: 5,
    });
  });

  describe('state transitions', () => {
    it('should start in CLOSED state', () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should open after failure threshold', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failed'));

      // Execute enough times to meet volume threshold
      for (let i = 0; i < 5; i++) {
        await expect(breaker.execute(operation)).rejects.toThrow();
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should transition to HALF_OPEN after timeout', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failed'));

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        await expect(breaker.execute(operation)).rejects.toThrow();
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Next execution should transition to HALF_OPEN
      operation.mockResolvedValue('success');
      await breaker.execute(operation);

      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
    });

    it('should close from HALF_OPEN after success threshold', async () => {
      // Open the circuit
      const failOp = vi.fn().mockRejectedValue(new Error('Failed'));
      for (let i = 0; i < 5; i++) {
        await expect(breaker.execute(failOp)).rejects.toThrow();
      }

      // Wait and transition to HALF_OPEN
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Succeed enough times to close
      const successOp = vi.fn().mockResolvedValue('success');
      await breaker.execute(successOp);
      await breaker.execute(successOp);

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should reopen from HALF_OPEN on failure', async () => {
      // Open the circuit
      const failOp = vi.fn().mockRejectedValue(new Error('Failed'));
      for (let i = 0; i < 5; i++) {
        await expect(breaker.execute(failOp)).rejects.toThrow();
      }

      // Wait and transition to HALF_OPEN
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Fail in HALF_OPEN state
      await expect(breaker.execute(failOp)).rejects.toThrow();

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('execute', () => {
    it('should execute operation when CLOSED', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await breaker.execute(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should reject when OPEN', async () => {
      // Open the circuit
      const failOp = vi.fn().mockRejectedValue(new Error('Failed'));
      for (let i = 0; i < 5; i++) {
        await expect(breaker.execute(failOp)).rejects.toThrow();
      }

      // Try to execute when OPEN
      const operation = vi.fn().mockResolvedValue('success');
      await expect(breaker.execute(operation)).rejects.toThrow(
        'Circuit breaker [test-service] is OPEN'
      );

      expect(operation).not.toHaveBeenCalled();
    });
  });

  describe('executeWithFallback', () => {
    it('should use fallback when circuit is OPEN', async () => {
      // Open the circuit
      const failOp = vi.fn().mockRejectedValue(new Error('Failed'));
      for (let i = 0; i < 5; i++) {
        await expect(breaker.execute(failOp)).rejects.toThrow();
      }

      // Execute with fallback
      const operation = vi.fn().mockResolvedValue('primary');
      const fallback = vi.fn().mockResolvedValue('fallback');

      const result = await breaker.executeWithFallback(operation, fallback);

      expect(result).toBe('fallback');
      expect(fallback).toHaveBeenCalled();
    });

    it('should use primary when circuit is CLOSED', async () => {
      const operation = vi.fn().mockResolvedValue('primary');
      const fallback = vi.fn().mockResolvedValue('fallback');

      const result = await breaker.executeWithFallback(operation, fallback);

      expect(result).toBe('primary');
      expect(fallback).not.toHaveBeenCalled();
    });
  });

  describe('statistics', () => {
    it('should track statistics correctly', async () => {
      const successOp = vi.fn().mockResolvedValue('success');
      const failOp = vi.fn().mockRejectedValue(new Error('Failed'));

      await breaker.execute(successOp);
      await breaker.execute(successOp);
      await expect(breaker.execute(failOp)).rejects.toThrow();

      const stats = breaker.getStats();

      expect(stats.successes).toBe(2);
      expect(stats.failures).toBe(1);
      expect(stats.totalRequests).toBe(3);
      expect(stats.consecutiveSuccesses).toBe(0);
      expect(stats.consecutiveFailures).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset circuit breaker state', async () => {
      // Open the circuit
      const failOp = vi.fn().mockRejectedValue(new Error('Failed'));
      for (let i = 0; i < 5; i++) {
        await expect(breaker.execute(failOp)).rejects.toThrow();
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Reset
      breaker.reset();

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      const stats = breaker.getStats();
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
    });
  });
});
