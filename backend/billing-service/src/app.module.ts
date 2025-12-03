import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import configuration from './config/configuration';
import { PaymentsModule } from './modules/payments/payments.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { StripeModule } from './modules/stripe/stripe.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),

    // MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongodb.uri'),
        // Connection Pool Optimization
        maxPoolSize: 50,
        minPoolSize: 10,
        maxIdleTimeMS: 30000,
        socketTimeoutMS: 60000,
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        retryWrites: true,
        retryReads: true,
        w: 'majority',
        compressors: ['zstd', 'zlib'],
        autoIndex: process.env.NODE_ENV !== 'production',
      }),
    }),

    // Event Emitter
    EventEmitterModule.forRoot(),

    // Feature Modules
    StripeModule,
    PaymentsModule,
    SubscriptionsModule,
    WebhookModule,
  ],
})
export class AppModule {}
