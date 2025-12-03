import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { NotificationsModule } from './notifications/notifications.module';
import { DevicesModule } from './devices/devices.module';
import { EventsModule } from './events/events.module';
import { FcmModule } from './fcm/fcm.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
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
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: configService.get<string>('REDIS_URL'),
      }),
      inject: [ConfigService],
    }),
    NotificationsModule,
    DevicesModule,
    EventsModule,
    FcmModule,
    EmailModule,
  ],
})
export class AppModule {}
