import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FavoritesService } from '../services/favorites.service';
import { RedisService } from '../services/redis.service';
import { Favorite } from '../schemas/favorite.schema';
import { Types, Connection } from 'mongoose';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let mockFavoriteModel: any;
  let mockRedisService: any;
  let mockEventEmitter: any;
  let mockConnection: any;

  beforeEach(async () => {
    mockFavoriteModel = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      deleteOne: jest.fn(),
      exists: jest.fn(),
    };

    mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      incr: jest.fn(),
      decr: jest.fn(),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    mockConnection = {
      collection: jest.fn().mockReturnValue({
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: getModelToken(Favorite.name),
          useValue: mockFavoriteModel,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: Connection,
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
  });

  describe('addFavorite', () => {
    it('should add a new favorite successfully', async () => {
      const userId = new Types.ObjectId().toString();
      const propertyId = new Types.ObjectId().toString();
      const dto = { propertyId, source: 'mobile' };

      const mockFavorite = {
        userId: new Types.ObjectId(userId),
        propertyId: new Types.ObjectId(propertyId),
        source: 'mobile',
        save: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          userId,
          propertyId,
          source: 'mobile',
        }),
      };

      mockFavoriteModel.prototype = mockFavorite;
      mockFavoriteModel.mockImplementation(() => mockFavorite);

      mockRedisService.del.mockResolvedValue(undefined);

      const result = await service.addFavorite(userId, dto);

      expect(mockFavorite.save).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'favorite.added',
        expect.objectContaining({
          userId,
          propertyId,
          source: 'mobile',
        }),
      );
      expect(mockRedisService.del).toHaveBeenCalledWith(`favorites:ids:${userId}`);
    });

    it('should be idempotent - return existing favorite on duplicate', async () => {
      const userId = new Types.ObjectId().toString();
      const propertyId = new Types.ObjectId().toString();
      const dto = { propertyId };

      const existingFavorite = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        propertyId: new Types.ObjectId(propertyId),
        source: 'api',
      };

      const mockFavorite = {
        save: jest.fn().mockRejectedValue({ code: 11000 }), // Duplicate key error
      };

      mockFavoriteModel.mockImplementation(() => mockFavorite);
      mockFavoriteModel.findOne = jest.fn().mockResolvedValue(existingFavorite);

      const result = await service.addFavorite(userId, dto);

      expect(result).toEqual(existingFavorite);
      expect(mockFavoriteModel.findOne).toHaveBeenCalled();
    });
  });

  describe('removeFavorite', () => {
    it('should remove favorite successfully', async () => {
      const userId = new Types.ObjectId().toString();
      const propertyId = new Types.ObjectId().toString();

      mockFavoriteModel.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
      mockRedisService.del.mockResolvedValue(undefined);

      await service.removeFavorite(userId, propertyId);

      expect(mockFavoriteModel.deleteOne).toHaveBeenCalledWith({
        userId: new Types.ObjectId(userId),
        propertyId: new Types.ObjectId(propertyId),
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'favorite.removed',
        expect.objectContaining({
          userId,
          propertyId,
        }),
      );
    });

    it('should be idempotent - no error when favorite does not exist', async () => {
      const userId = new Types.ObjectId().toString();
      const propertyId = new Types.ObjectId().toString();

      mockFavoriteModel.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 0 });

      await expect(service.removeFavorite(userId, propertyId)).resolves.not.toThrow();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('getUserFavoriteIds', () => {
    it('should return cached IDs if available', async () => {
      const userId = new Types.ObjectId().toString();
      const cachedIds = ['id1', 'id2', 'id3'];

      mockRedisService.get.mockResolvedValue(cachedIds);

      const result = await service.getUserFavoriteIds(userId);

      expect(result).toEqual(cachedIds);
      expect(mockRedisService.get).toHaveBeenCalledWith(`favorites:ids:${userId}`);
      expect(mockFavoriteModel.find).not.toHaveBeenCalled();
    });

    it('should query database and cache result on cache miss', async () => {
      const userId = new Types.ObjectId().toString();
      const favorites = [
        { propertyId: new Types.ObjectId('64b8f5e2c1234567890abcde') },
        { propertyId: new Types.ObjectId('64b8f5e2c1234567890abcdf') },
      ];

      mockRedisService.get.mockResolvedValue(null);
      mockFavoriteModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(favorites),
        }),
      });

      const result = await service.getUserFavoriteIds(userId);

      expect(result).toEqual([
        '64b8f5e2c1234567890abcde',
        '64b8f5e2c1234567890abcdf',
      ]);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `favorites:ids:${userId}`,
        expect.any(Array),
        30,
      );
    });
  });

  describe('syncFavorites', () => {
    it('should add missing favorites and remove extras', async () => {
      const userId = new Types.ObjectId().toString();
      const serverIds = ['id1', 'id2'];
      const clientIds = ['id2', 'id3', 'id4'];

      // Mock getUserFavoriteIds to return server state
      jest.spyOn(service, 'getUserFavoriteIds')
        .mockResolvedValueOnce(serverIds) // Initial call
        .mockResolvedValueOnce(['id2', 'id3', 'id4']); // Final state after sync

      // Mock add/remove
      jest.spyOn(service, 'addFavorite').mockResolvedValue(null as any);
      jest.spyOn(service, 'removeFavorite').mockResolvedValue(undefined);

      const result = await service.syncFavorites(userId, {
        propertyIds: clientIds,
        source: 'mobile',
      });

      expect(result.added).toEqual(['id3', 'id4']);
      expect(result.removed).toEqual(['id1']);
      expect(result.current).toEqual(['id2', 'id3', 'id4']);
    });
  });

  describe('getPropertyFavoritesCount', () => {
    it('should return cached count if available', async () => {
      const propertyId = new Types.ObjectId().toString();
      const cachedCount = 42;

      mockRedisService.get.mockResolvedValue(cachedCount);

      const result = await service.getPropertyFavoritesCount(propertyId);

      expect(result).toBe(cachedCount);
      expect(mockFavoriteModel.countDocuments).not.toHaveBeenCalled();
    });

    it('should query database and cache on cache miss', async () => {
      const propertyId = new Types.ObjectId().toString();
      const count = 15;

      mockRedisService.get.mockResolvedValue(null);
      mockFavoriteModel.countDocuments = jest.fn().mockResolvedValue(count);

      const result = await service.getPropertyFavoritesCount(propertyId);

      expect(result).toBe(count);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `property:favorites:count:${propertyId}`,
        count,
        300,
      );
    });
  });

  describe('isFavorited', () => {
    it('should return true if favorite exists', async () => {
      const userId = new Types.ObjectId().toString();
      const propertyId = new Types.ObjectId().toString();

      mockFavoriteModel.exists = jest.fn().mockResolvedValue({ _id: new Types.ObjectId() });

      const result = await service.isFavorited(userId, propertyId);

      expect(result).toBe(true);
    });

    it('should return false if favorite does not exist', async () => {
      const userId = new Types.ObjectId().toString();
      const propertyId = new Types.ObjectId().toString();

      mockFavoriteModel.exists = jest.fn().mockResolvedValue(null);

      const result = await service.isFavorited(userId, propertyId);

      expect(result).toBe(false);
    });
  });
});
