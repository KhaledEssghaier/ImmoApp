import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SessionsModule } from './sessions/sessions.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        // Connection Pool Optimization
        maxPoolSize: 50,
        minPoolSize: 10,
        maxIdleTimeMS: 30000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 10000,
        // Performance Settings
        retryWrites: true,
        retryReads: true,
        w: 'majority',
        compressors: ['zstd', 'zlib'],
        // Auto Index
        autoIndex: process.env.NODE_ENV !== 'production',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    SessionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
