import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private redis: Redis;
  private isAvailable = false;

  async onModuleInit() {
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });

    this.redis.on('connect', () => {
      this.isAvailable = true;
      this.logger.log('Redis connected');
    });

    this.redis.on('error', (error: unknown) => {
      this.isAvailable = false;
      const message = error instanceof Error ? error.message : 'Unknown Redis error';
      this.logger.warn(`Redis unavailable: ${message}`);
    });

    try {
      await this.redis.connect();
    } catch {
      this.isAvailable = false;
      this.logger.warn('Starting without Redis cache');
    }
  }

  async get(key: string) {
    if (!this.isAvailable) {
      return null;
    }

    try {
      return await this.redis.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number) {
    if (!this.isAvailable) {
      return null;
    }

    try {
      if (ttl) {
        return await this.redis.set(key, value, 'EX', ttl);
      }

      return await this.redis.set(key, value);
    } catch {
      return null;
    }
  }

  async del(key: string) {
    if (!this.isAvailable) {
      return 0;
    }

    try {
      return await this.redis.del(key);
    } catch {
      return 0;
    }
  }

  async incr(key: string) {
    if (!this.isAvailable) {
      return 0;
    }

    try {
      return await this.redis.incr(key);
    } catch {
      return 0;
    }
  }
}
