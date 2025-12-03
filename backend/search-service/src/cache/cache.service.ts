import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import * as crypto from 'crypto';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: Redis;
  private readonly defaultTTL: number;

  constructor(private configService: ConfigService) {
    this.defaultTTL = this.configService.get<number>('CACHE_TTL', 60);
  }

  async onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');

    this.redisClient = new Redis({
      host,
      port,
      password: password || undefined,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 30, 1000);
      },
    });

    this.redisClient.on('error', (err) => {
      this.logger.error('Redis error:', err.message);
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  /**
   * Generate cache key from object
   */
  generateKey(prefix: string, data: any): string {
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
    return `${prefix}:${hash}`;
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisClient.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Failed to get cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cache value with TTL
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const ttl = ttlSeconds || this.defaultTTL;
      await this.redisClient.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      this.logger.error(`Failed to set cache key ${key}:`, error);
    }
  }

  /**
   * Delete cache key
   */
  async del(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete cache key ${key}:`, error);
    }
  }

  /**
   * Delete keys by pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
        this.logger.log(`Deleted ${keys.length} keys matching ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete keys by pattern ${pattern}:`, error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check key existence ${key}:`, error);
      return false;
    }
  }
}
