import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import Redis from 'ioredis';
import { FavoritesController } from './controllers/favorites.controller';
import { PropertiesController } from './controllers/properties.controller';
import { FavoritesService } from './services/favorites.service';
import { RedisService } from './services/redis.service';
import { Favorite, FavoriteSchema } from './schemas/favorite.schema';
import { JwtStrategy } from './auth/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URI || 'MONGO_URI=mongodb+srv://khaledessghaier01_db_user:NzloQ2m8x5wbXhWy@khaledessghaier.kygzqup.mongodb.net/immobilier_app?retryWrites=true&w=majority&appName=KhaledEssghaier', {
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
    MongooseModule.forFeature([{ name: Favorite.name, schema: FavoriteSchema }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
    EventEmitterModule.forRoot(),
  ],
  controllers: [FavoritesController, PropertiesController],
  providers: [
    FavoritesService,
    RedisService,
    JwtStrategy,
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
        redis.on('connect', () => console.log('✓ Redis connected'));
        redis.on('error', (err) => console.error('✗ Redis error:', err));
        return redis;
      },
    },
  ],
})
export class AppModule {}
