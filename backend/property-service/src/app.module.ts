import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PropertiesModule } from './properties/properties.module';
import { JwtStrategy } from './common/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('MONGO_URI') || 'MONGO_URI=mongodb+srv://khaledessghaier01_db_user:NzloQ2m8x5wbXhWy@khaledessghaier.kygzqup.mongodb.net/immobilier_app?retryWrites=true&w=majority&appName=KhaledEssghaier',
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
        autoIndex: process.env.NODE_ENV !== 'production',
      }),
    }),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
    }),
    PropertiesModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule {}
