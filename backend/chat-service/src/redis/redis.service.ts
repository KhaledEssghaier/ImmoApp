import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private publisher: Redis;
  private subscriber: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const redisConfig = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    };

    this.client = new Redis(redisConfig);
    this.publisher = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);

    console.log('✅ Redis clients initialized');
  }

  onModuleDestroy() {
    this.client.disconnect();
    this.publisher.disconnect();
    this.subscriber.disconnect();
  }

  getClient(): Redis {
    return this.client;
  }

  getPublisher(): Redis {
    return this.publisher;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  // Presence management
  async addUserSocket(userId: string, socketId: string): Promise<void> {
    await this.client.sadd(`user:${userId}:sockets`, socketId);
    await this.client.set(`user:${userId}:online`, 'true');
  }

  async removeUserSocket(userId: string, socketId: string): Promise<void> {
    await this.client.srem(`user:${userId}:sockets`, socketId);
    
    // Check if user has any other active sockets
    const socketCount = await this.client.scard(`user:${userId}:sockets`);
    if (socketCount === 0) {
      await this.client.set(`user:${userId}:online`, 'false');
      return; // User is offline
    }
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const online = await this.client.get(`user:${userId}:online`);
    return online === 'true';
  }

  async getUserSocketCount(userId: string): Promise<number> {
    return await this.client.scard(`user:${userId}:sockets`);
  }

  // Socket mapping
  async mapSocketToUser(socketId: string, userId: string): Promise<void> {
    await this.client.set(`socket:${socketId}:user`, userId);
  }

  async getUserFromSocket(socketId: string): Promise<string | null> {
    return await this.client.get(`socket:${socketId}:user`);
  }

  async removeSocketMapping(socketId: string): Promise<void> {
    await this.client.del(`socket:${socketId}:user`);
  }

  // Pub/Sub for notifications
  async publishMessageCreated(data: {
    conversationId: string;
    messageId: string;
    senderId: string;
    senderName: string;
    participantIds: string[];
    text: string;
  }): Promise<void> {
    const channel = this.configService.get<string>('NOTIFICATION_REDIS_CHANNEL', 'chat.message.created');
    await this.publisher.publish(channel, JSON.stringify(data));
  }

  // Rate limiting helper
  async checkMessageRateLimit(userId: string): Promise<boolean> {
    const key = `rate:message:${userId}`;
    const limit = this.configService.get<number>('MESSAGE_RATE_LIMIT', 20);
    const window = this.configService.get<number>('MESSAGE_RATE_WINDOW', 60000);

    const current = await this.client.incr(key);
    
    if (current === 1) {
      await this.client.pexpire(key, window);
    }

    return current <= limit;
  }
}
