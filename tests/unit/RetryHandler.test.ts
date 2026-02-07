/**
 * Unit Tests for RetryHandler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RetryHandler } from '../../src/utils/RetryHandler';

describe('RetryHandler', () => {
  let retryHandler: RetryHandler;

  beforeEach(() => {
    retryHandler = new RetryHandler({
      maxRetries: 3,
      baseDelay: 100,
      maxDelay: 1000,
      exponentialBase: 2,
      jitter: false,
    });
  });

  describe('execute', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await retryHandler.execute(operation, 'test-op');
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable error', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockResolvedValue('success');

      const result = await retryHandler.execute(operation, 'test-op');
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(
        retryHandler.execute(operation, 'test-op')
      ).rejects.toThrow('ECONNREFUSED');
      
      expect(operation).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should not retry non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Invalid input'));

      await expect(
        retryHandler.execute(operation, 'test-op')
      ).rejects.toThrow('Invalid input');
      
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should calculate exponential backoff correctly', async () => {
      const delays: number[] = [];
      const operation = vi.fn().mockRejectedValue(new Error('ETIMEDOUT'));

      const originalSleep = (retryHandler as any).sleep;
      (retryHandler as any).sleep = vi.fn((ms: number) => {
        delays.push(ms);
        return originalSleep.call(retryHandler, 0); // Don't actually wait
      });

      await expect(
        retryHandler.execute(operation, 'test-op')
      ).rejects.toThrow();

      expect(delays).toHaveLength(3);
      expect(delays[0]).toBe(100); // baseDelay * 2^0
      expect(delays[1]).toBe(200); // baseDelay * 2^1
      expect(delays[2]).toBe(400); // baseDelay * 2^2
    });
  });

  describe('executeWithResult', () => {
    it('should return success result', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await retryHandler.executeWithResult(operation, 'test-op');
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(1);
    });

    it('should return failure result after retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failed'));
      const result = await retryHandler.executeWithResult(operation, 'test-op');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.attempts).toBe(4);
    });
  });

  describe('configuration', () => {
    it('should respect custom configuration', async () => {
      const customHandler = new RetryHandler({
        maxRetries: 1,
        baseDelay: 50,
      });

      const operation = vi.fn().mockRejectedValue(new Error('ETIMEDOUT'));

      await expect(
        customHandler.execute(operation, 'test-op')
      ).rejects.toThrow();
      
      expect(operation).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });

    it('should update configuration', async () => {
      retryHandler.updateConfig({ maxRetries: 1 });

      const operation = vi.fn().mockRejectedValue(new Error('ETIMEDOUT'));

      await expect(
        retryHandler.execute(operation, 'test-op')
      ).rejects.toThrow();
      
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });
});
