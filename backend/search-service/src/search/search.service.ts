import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument } from './schemas/property.schema';
import { SearchDto, PolygonSearchDto, AutocompleteDto } from './dto/search.dto';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
    private cacheService: CacheService,
  ) {}

  /**
   * Main search function with MongoDB Atlas Search
   */
  async search(searchDto: SearchDto) {
    // Generate cache key
    const cacheKey = this.cacheService.generateKey('search', searchDto);

    // Check cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      this.logger.log('✅ Cache hit for search query');
      return cached;
    }

    const { query, filters, geo, sort, page, limit } = searchDto;
    const skip = (page - 1) * limit;

    // Build MongoDB aggregation pipeline
    const pipeline: any[] = [];

    // MongoDB constraints:
    // - $geoNear must be first stage if used
    // - $text search must be first stage if used
    // - We can only have one of them as first stage
    
    if (geo) {
      // Geo search takes priority, include text search in the query if provided
      const radiusInMeters = (geo.radiusKm || 10) * 1000;
      const geoQuery: any = { isDeleted: { $ne: true } };
      
      // If text search is also requested, we can't use $text with $geoNear
      // So we'll use regex search instead
      if (query && query.trim()) {
        geoQuery.$or = [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { 'address.city': { $regex: query, $options: 'i' } },
        ];
      }
      
      pipeline.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [geo.lng, geo.lat],
          },
          distanceField: 'distance',
          maxDistance: radiusInMeters,
          spherical: true,
          query: geoQuery,
        },
      });
    } else if (query && query.trim()) {
      // Text search without geo
      pipeline.push({
        $match: {
          $text: {
            $search: query,
            $caseSensitive: false,
            $diacriticSensitive: false,
          },
          isDeleted: { $ne: true },
        },
      });

      // Add text score for relevance sorting
      pipeline.push({
        $addFields: {
          textScore: { $meta: 'textScore' },
        },
      });
    } else {
      // No geo, no text search - just filter non-deleted properties
      pipeline.push({
        $match: { isDeleted: { $ne: true } },
      });
    }

    // Stage: Apply filters
    const matchFilters: any = {};

    if (filters) {
      // Price range
      if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
        matchFilters.price = {};
        if (filters.priceMin !== undefined) {
          matchFilters.price.$gte = filters.priceMin;
        }
        if (filters.priceMax !== undefined) {
          matchFilters.price.$lte = filters.priceMax;
        }
      }

      // Property type
      if (filters.propertyType) {
        matchFilters.propertyType = filters.propertyType.toLowerCase();
      }

      // Transaction type
      if (filters.transactionType) {
        matchFilters.transactionType = filters.transactionType.toLowerCase();
      }

      // Bedrooms range
      if (filters.bedroomsMin !== undefined || filters.bedroomsMax !== undefined) {
        matchFilters.bedrooms = {};
        if (filters.bedroomsMin !== undefined) {
          matchFilters.bedrooms.$gte = filters.bedroomsMin;
        }
        if (filters.bedroomsMax !== undefined) {
          matchFilters.bedrooms.$lte = filters.bedroomsMax;
        }
      }

      // Bathrooms range
      if (filters.bathroomsMin !== undefined || filters.bathroomsMax !== undefined) {
        matchFilters.bathrooms = {};
        if (filters.bathroomsMin !== undefined) {
          matchFilters.bathrooms.$gte = filters.bathroomsMin;
        }
        if (filters.bathroomsMax !== undefined) {
          matchFilters.bathrooms.$lte = filters.bathroomsMax;
        }
      }

      // Surface area range
      if (filters.surfaceMin !== undefined || filters.surfaceMax !== undefined) {
        matchFilters.surface = {};
        if (filters.surfaceMin !== undefined) {
          matchFilters.surface.$gte = filters.surfaceMin;
        }
        if (filters.surfaceMax !== undefined) {
          matchFilters.surface.$lte = filters.surfaceMax;
        }
      }

      // Amenities (all must match)
      if (filters.amenities && filters.amenities.length > 0) {
        matchFilters.amenities = {
          $all: filters.amenities,
        };
      }

      // City
      if (filters.city) {
        matchFilters['address.city'] = {
          $regex: filters.city,
          $options: 'i',
        };
      }
    }

    if (Object.keys(matchFilters).length > 0) {
      pipeline.push({ $match: matchFilters });
    }

    // Stage 5: Sorting
    const sortStage: any = {};

    switch (sort) {
      case 'price_asc':
        sortStage.price = 1;
        break;
      case 'price_desc':
        sortStage.price = -1;
        break;
      case 'nearest':
        if (geo) {
          sortStage.distance = 1;
        } else {
          sortStage.createdAt = -1; // fallback to newest
        }
        break;
      case 'newest':
      default:
        sortStage.createdAt = -1;
        break;
    }

    // If text search, prioritize by relevance
    if (query && query.trim() && !geo) {
      pipeline.push({ $sort: { textScore: -1, ...sortStage } });
    } else {
      pipeline.push({ $sort: sortStage });
    }

    // Stage 6: Count total documents
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await this.propertyModel.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Stage 7: Pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Stage 8: Project fields
    pipeline.push({
      $project: {
        title: 1,
        description: 1,
        propertyType: 1,
        transactionType: 1,
        price: 1,
        surface: 1,
        bedrooms: 1,
        bathrooms: 1,
        address: 1,
        location: 1,
        mediaIds: 1,
        amenities: 1,
        ownerId: 1,
        createdAt: 1,
        distance: 1,
        textScore: 1,
      },
    });

    // Execute search
    const properties = await this.propertyModel.aggregate(pipeline);

    const result = {
      data: properties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: filters || {},
      sort,
    };

    // Cache result
    await this.cacheService.set(cacheKey, result, 60);

    return result;
  }

  /**
   * Polygon search
   */
  async searchWithinPolygon(polygonDto: PolygonSearchDto) {
    const cacheKey = this.cacheService.generateKey('polygon', polygonDto);

    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      this.logger.log('✅ Cache hit for polygon search');
      return cached;
    }

    const { polygon, filters, sort, page, limit } = polygonDto;
    const skip = (page - 1) * limit;

    // Convert polygon coordinates to GeoJSON format
    const polygonCoords = polygon.map((coord) => [coord.lng, coord.lat]);
    // Close the polygon
    polygonCoords.push(polygonCoords[0]);

    const pipeline: any[] = [];

    // Geo search within polygon
    pipeline.push({
      $match: {
        isDeleted: { $ne: true },
        'location.coordinates': {
          $geoWithin: {
            $geometry: {
              type: 'Polygon',
              coordinates: [polygonCoords],
            },
          },
        },
      },
    });

    // Apply filters (same as main search)
    if (filters) {
      const matchFilters: any = {};

      if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
        matchFilters.price = {};
        if (filters.priceMin) matchFilters.price.$gte = filters.priceMin;
        if (filters.priceMax) matchFilters.price.$lte = filters.priceMax;
      }

      if (filters.propertyType) {
        matchFilters.propertyType = filters.propertyType.toLowerCase();
      }

      if (filters.transactionType) {
        matchFilters.transactionType = filters.transactionType.toLowerCase();
      }

      if (Object.keys(matchFilters).length > 0) {
        pipeline.push({ $match: matchFilters });
      }
    }

    // Sorting
    const sortStage: any = {};
    switch (sort) {
      case 'price_asc':
        sortStage.price = 1;
        break;
      case 'price_desc':
        sortStage.price = -1;
        break;
      case 'newest':
      default:
        sortStage.createdAt = -1;
        break;
    }

    pipeline.push({ $sort: sortStage });

    // Count total
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await this.propertyModel.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const properties = await this.propertyModel.aggregate(pipeline);

    const result = {
      data: properties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    await this.cacheService.set(cacheKey, result, 60);

    return result;
  }

  /**
   * Autocomplete suggestions
   */
  async autocomplete(autocompleteDto: AutocompleteDto) {
    const { q, limit } = autocompleteDto;

    const cacheKey = this.cacheService.generateKey('autocomplete', { q, limit });

    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Search in titles and cities
    const suggestions = await this.propertyModel
      .aggregate([
        {
          $match: {
            isDeleted: { $ne: true },
            $or: [
              { title: { $regex: q, $options: 'i' } },
              { 'address.city': { $regex: q, $options: 'i' } },
            ],
          },
        },
        {
          $group: {
            _id: null,
            titles: { $addToSet: '$title' },
            cities: { $addToSet: '$address.city' },
          },
        },
        {
          $project: {
            suggestions: {
              $concatArrays: ['$titles', '$cities'],
            },
          },
        },
      ])
      .limit(1);

    const result = suggestions[0]?.suggestions?.slice(0, limit) || [];

    await this.cacheService.set(cacheKey, result, 300); // Cache for 5 minutes

    return result;
  }

  /**
   * Get property by ID
   */
  async getPropertyById(id: string) {
    return this.propertyModel.findById(id);
  }
}
