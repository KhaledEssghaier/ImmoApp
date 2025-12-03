import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { ChatGatewayModule } from './chat-gateway/chat-gateway.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        // Connection Pool Optimization
        maxPoolSize: 50,
        minPoolSize: 10,
        maxIdleTimeMS: 30000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 10000,
        retryWrites: true,
        retryReads: true,
        w: 'majority',
        compressors: ['zstd', 'zlib'],
        autoIndex: process.env.NODE_ENV !== 'production',
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),
    RedisModule,
    AuthModule,
    ConversationsModule,
    MessagesModule,
    ChatGatewayModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
