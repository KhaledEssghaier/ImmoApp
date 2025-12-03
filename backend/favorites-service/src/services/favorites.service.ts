import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Favorite, FavoriteDocument } from '../schemas/favorite.schema';
import { RedisService } from './redis.service';
import { AddFavoriteDto, SyncFavoritesDto } from '../dto/favorites.dto';
import { FAVORITE_EVENTS } from '../events/favorite.events';
import { InjectConnection } from '@nestjs/mongoose';

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);
  private readonly CACHE_TTL = parseInt(process.env.FAVORITES_CACHE_TTL || '30');

  constructor(
    @InjectModel(Favorite.name) private favoriteModel: Model<FavoriteDocument>,
    @InjectConnection() private connection: Connection,
    private redisService: RedisService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Add a favorite (idempotent)
   */
  async addFavorite(userId: string, dto: AddFavoriteDto): Promise<FavoriteDocument> {
    const userObjectId = new Types.ObjectId(userId);
    const propertyObjectId = new Types.ObjectId(dto.propertyId);

    try {
      // Try to create new favorite
      const favorite = new this.favoriteModel({
        userId: userObjectId,
        propertyId: propertyObjectId,
        source: dto.source || 'api',
      });

      const saved = await favorite.save();

      // Update property favorites count atomically
      await this.incrementPropertyFavoritesCount(dto.propertyId, 1);

      // Invalidate cache
      await this.invalidateUserCache(userId);

      // Emit event for other services
      this.eventEmitter.emit(FAVORITE_EVENTS.ADDED, {
        userId,
        propertyId: dto.propertyId,
        source: dto.source || 'api',
        timestamp: new Date(),
      });

      this.logger.log(`Favorite added: user=${userId}, property=${dto.propertyId}`);
      return saved;
    } catch (error) {
      // Handle duplicate key error (E11000) - idempotent behavior
      if (error.code === 11000) {
        this.logger.debug(`Favorite already exists: user=${userId}, property=${dto.propertyId}`);
        return this.favoriteModel.findOne({
          userId: userObjectId,
          propertyId: propertyObjectId,
        });
      }
      throw error;
    }
  }

  /**
   * Remove a favorite (idempotent)
   */
  async removeFavorite(userId: string, propertyId: string): Promise<void> {
    const userObjectId = new Types.ObjectId(userId);
    const propertyObjectId = new Types.ObjectId(propertyId);

    const result = await this.favoriteModel.deleteOne({
      userId: userObjectId,
      propertyId: propertyObjectId,
    });

    if (result.deletedCount > 0) {
      // Update property favorites count atomically
      await this.incrementPropertyFavoritesCount(propertyId, -1);

      // Invalidate cache
      await this.invalidateUserCache(userId);

      // Emit event
      this.eventEmitter.emit(FAVORITE_EVENTS.REMOVED, {
        userId,
        propertyId,
        timestamp: new Date(),
      });

      this.logger.log(`Favorite removed: user=${userId}, property=${propertyId}`);
    } else {
      this.logger.debug(`Favorite not found for removal: user=${userId}, property=${propertyId}`);
    }
  }

  /**
   * Get user favorites with pagination
   */
  async getUserFavorites(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: any[]; total: number; page: number; pages: number }> {
    const userObjectId = new Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.favoriteModel
        .find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.favoriteModel.countDocuments({ userId: userObjectId }),
    ]);

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get user favorite property IDs (cached for fast sync)
   */
  async getUserFavoriteIds(userId: string): Promise<string[]> {
    const cacheKey = `favorites:ids:${userId}`;

    // Try cache first
    const cached = await this.redisService.get<string[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for favorites:ids:${userId}`);
      return cached;
    }

    // Query database
    this.logger.debug(`Cache MISS for favorites:ids:${userId}`);
    const userObjectId = new Types.ObjectId(userId);
    const favorites = await this.favoriteModel
      .find({ userId: userObjectId })
      .select('propertyId')
      .lean()
      .exec();

    const propertyIds = favorites.map((f) => f.propertyId.toString());

    // Cache result
    await this.redisService.set(cacheKey, propertyIds, this.CACHE_TTL);

    return propertyIds;
  }

  /**
   * Sync favorites (reconcile client state with server)
   */
  async syncFavorites(userId: string, dto: SyncFavoritesDto): Promise<{
    added: string[];
    removed: string[];
    current: string[];
  }> {
    const serverIds = await this.getUserFavoriteIds(userId);
    const clientIds = dto.propertyIds;

    const serverSet = new Set(serverIds);
    const clientSet = new Set(clientIds);

    // Items to add (in client but not in server)
    const toAdd = clientIds.filter((id) => !serverSet.has(id));

    // Items to remove (in server but not in client)
    const toRemove = serverIds.filter((id) => !clientSet.has(id));

    // Process additions
    for (const propertyId of toAdd) {
      try {
        await this.addFavorite(userId, { propertyId, source: dto.source || 'api' });
      } catch (error) {
        this.logger.error(`Error adding favorite during sync: ${propertyId}`, error);
      }
    }

    // Process removals
    for (const propertyId of toRemove) {
      try {
        await this.removeFavorite(userId, propertyId);
      } catch (error) {
        this.logger.error(`Error removing favorite during sync: ${propertyId}`, error);
      }
    }

    // Get final state
    const current = await this.getUserFavoriteIds(userId);

    this.logger.log(`Sync complete for user=${userId}: added=${toAdd.length}, removed=${toRemove.length}`);

    return {
      added: toAdd,
      removed: toRemove,
      current,
    };
  }

  /**
   * Get favorites count for a property
   */
  async getPropertyFavoritesCount(propertyId: string): Promise<number> {
    const cacheKey = `property:favorites:count:${propertyId}`;

    // Try cache
    const cached = await this.redisService.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Query database
    const propertyObjectId = new Types.ObjectId(propertyId);
    const count = await this.favoriteModel.countDocuments({ propertyId: propertyObjectId });

    // Cache result
    await this.redisService.set(cacheKey, count, 300); // 5 min TTL

    return count;
  }

  /**
   * Check if user favorited a property
   */
  async isFavorited(userId: string, propertyId: string): Promise<boolean> {
    const userObjectId = new Types.ObjectId(userId);
    const propertyObjectId = new Types.ObjectId(propertyId);

    const exists = await this.favoriteModel.exists({
      userId: userObjectId,
      propertyId: propertyObjectId,
    });

    return !!exists;
  }

  /**
   * Update property favorites count in properties collection (atomic)
   */
  private async incrementPropertyFavoritesCount(propertyId: string, increment: number): Promise<void> {
    try {
      // Use MongoDB atomic $inc operation on properties collection
      const propertiesCollection = this.connection.collection('properties');
      await propertiesCollection.updateOne(
        { _id: new Types.ObjectId(propertyId) },
        { $inc: { favoritesCount: increment } },
      );

      // Invalidate property count cache
      await this.redisService.del(`property:favorites:count:${propertyId}`);
    } catch (error) {
      this.logger.error(`Error updating property favorites count: ${propertyId}`, error);
    }
  }

  /**
   * Invalidate user favorites cache
   */
  private async invalidateUserCache(userId: string): Promise<void> {
    await this.redisService.del(`favorites:ids:${userId}`);
  }

  /**
   * Get all favorites for a property (admin/analytics)
   */
  async getPropertyFavorites(propertyId: string, page = 1, limit = 50): Promise<{
    data: any[];
    total: number;
  }> {
    const propertyObjectId = new Types.ObjectId(propertyId);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.favoriteModel
        .find({ propertyId: propertyObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.favoriteModel.countDocuments({ propertyId: propertyObjectId }),
    ]);

    return { data, total };
  }
}
