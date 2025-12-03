import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SearchService } from './search.service';
import { Property } from './schemas/property.schema';
import { CacheService } from '../cache/cache.service';

describe('SearchService', () => {
  let service: SearchService;
  let mockPropertyModel: any;
  let mockCacheService: any;

  beforeEach(async () => {
    mockPropertyModel = {
      aggregate: jest.fn().mockReturnThis(),
      findById: jest.fn(),
    };

    mockCacheService = {
      generateKey: jest.fn((prefix, data) => `${prefix}:testkey`),
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: getModelToken(Property.name),
          useValue: mockPropertyModel,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('should return cached results if available', async () => {
      const mockCachedData = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      };

      mockCacheService.get.mockResolvedValue(mockCachedData);

      const result = await service.search({
        query: 'villa',
        page: 1,
        limit: 20,
      });

      expect(result).toEqual(mockCachedData);
      expect(mockCacheService.get).toHaveBeenCalledWith('search:testkey');
    });

    it('should perform full-text search with query', async () => {
      mockCacheService.get.mockResolvedValue(null);

      mockPropertyModel.aggregate = jest.fn().mockResolvedValue([
        {
          title: 'Luxury Villa',
          price: 500000,
        },
      ]);

      const result = await service.search({
        query: 'luxury villa',
        page: 1,
        limit: 20,
      });

      expect(mockPropertyModel.aggregate).toHaveBeenCalled();
    });

    it('should apply price filters correctly', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPropertyModel.aggregate = jest.fn().mockResolvedValue([]);

      await service.search({
        filters: {
          priceMin: 100000,
          priceMax: 500000,
        },
        page: 1,
        limit: 20,
      });

      expect(mockPropertyModel.aggregate).toHaveBeenCalled();
    });

    it('should perform geo search with radius', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPropertyModel.aggregate = jest.fn().mockResolvedValue([]);

      await service.search({
        geo: {
          lat: 36.8,
          lng: 10.2,
          radiusKm: 10,
        },
        page: 1,
        limit: 20,
      });

      expect(mockPropertyModel.aggregate).toHaveBeenCalled();
    });

    it('should sort by price ascending', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPropertyModel.aggregate = jest.fn().mockResolvedValue([]);

      await service.search({
        sort: 'price_asc',
        page: 1,
        limit: 20,
      });

      expect(mockPropertyModel.aggregate).toHaveBeenCalled();
    });
  });

  describe('searchWithinPolygon', () => {
    it('should search properties within polygon', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPropertyModel.aggregate = jest.fn().mockResolvedValue([]);

      const polygon = [
        { lng: 10.0, lat: 36.0 },
        { lng: 10.5, lat: 36.0 },
        { lng: 10.5, lat: 36.5 },
        { lng: 10.0, lat: 36.5 },
      ];

      await service.searchWithinPolygon({
        polygon,
        page: 1,
        limit: 20,
      });

      expect(mockPropertyModel.aggregate).toHaveBeenCalled();
    });
  });

  describe('autocomplete', () => {
    it('should return autocomplete suggestions', async () => {
      mockCacheService.get.mockResolvedValue(null);

      mockPropertyModel.aggregate = jest
        .fn()
        .mockReturnThis()
        .mockReturnThis();

      (mockPropertyModel.aggregate as jest.Mock).mockImplementation(() => ({
        limit: jest.fn().mockResolvedValue([
          {
            suggestions: ['Villa Moderne', 'Paris', 'Villa Luxe'],
          },
        ]),
      }));

      const result = await service.autocomplete({
        q: 'vil',
        limit: 10,
      });

      expect(result).toBeDefined();
    });
  });
});
