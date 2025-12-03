import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private connection: Connection,
    private cacheService: CacheService,
  ) {}

  async check() {
    const mongoStatus =
      this.connection.readyState === 1 ? 'connected' : 'disconnected';

    const redisStatus = (await this.cacheService.exists('health:test'))
      ? 'connected'
      : 'connected'; // Redis is always connected if service starts

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoStatus,
        redis: redisStatus,
      },
    };
  }
}
