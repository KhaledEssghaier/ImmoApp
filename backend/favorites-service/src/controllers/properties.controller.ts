import {
  Controller,
  Get,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FavoritesService } from '../services/favorites.service';

@ApiTags('Properties')
@Controller('properties')
export class PropertiesController {
  private readonly logger = new Logger(PropertiesController.name);

  constructor(private readonly favoritesService: FavoritesService) {}

  @Get(':propertyId/favorites/count')
  @ApiOperation({ summary: 'Get favorites count for a property' })
  @ApiParam({ name: 'propertyId', description: 'Property ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Count retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          propertyId: '64b8f5e2c1234567890abcde',
          favoritesCount: 42
        }
      }
    }
  })
  async getPropertyFavoritesCount(@Param('propertyId') propertyId: string) {
    this.logger.log(`Get favorites count: property=${propertyId}`);
    const count = await this.favoritesService.getPropertyFavoritesCount(propertyId);
    
    return {
      success: true,
      data: {
        propertyId,
        favoritesCount: count,
      },
    };
  }

  @Get(':propertyId/favorites')
  @ApiOperation({ summary: 'Get all users who favorited a property (admin/analytics)' })
  @ApiParam({ name: 'propertyId', description: 'Property ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({ status: 200, description: 'Favorites retrieved successfully' })
  async getPropertyFavorites(
    @Param('propertyId') propertyId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    this.logger.log(`Get property favorites: property=${propertyId}, page=${page}`);
    const result = await this.favoritesService.getPropertyFavorites(propertyId, page, limit);
    
    return {
      success: true,
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
      },
    };
  }
}
