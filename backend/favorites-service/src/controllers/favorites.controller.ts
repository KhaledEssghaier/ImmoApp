import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { FavoritesService } from '../services/favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AddFavoriteDto, SyncFavoritesDto, GetFavoritesQueryDto } from '../dto/favorites.dto';

@ApiTags('Favorites')
@Controller('favorites')
export class FavoritesController {
  private readonly logger = new Logger(FavoritesController.name);

  constructor(private readonly favoritesService: FavoritesService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      status: 'ok',
      service: 'favorites-service',
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a favorite property' })
  @ApiResponse({ status: 201, description: 'Favorite added successfully' })
  @ApiResponse({ status: 200, description: 'Favorite already exists (idempotent)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addFavorite(
    @CurrentUser() user: { userId: string },
    @Body() dto: AddFavoriteDto,
  ) {
    this.logger.log(`Add favorite: user=${user.userId}, property=${dto.propertyId}`);
    const favorite = await this.favoritesService.addFavorite(user.userId, dto);
    return {
      success: true,
      data: favorite,
      message: 'Favorite added successfully',
    };
  }

  @Delete(':propertyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a favorite property' })
  @ApiParam({ name: 'propertyId', description: 'Property ID to unfavorite' })
  @ApiResponse({ status: 204, description: 'Favorite removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeFavorite(
    @CurrentUser() user: { userId: string },
    @Param('propertyId') propertyId: string,
  ) {
    this.logger.log(`Remove favorite: user=${user.userId}, property=${propertyId}`);
    await this.favoritesService.removeFavorite(user.userId, propertyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user favorites (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Favorites retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserFavorites(
    @CurrentUser() user: { userId: string },
    @Query() query: GetFavoritesQueryDto,
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    
    this.logger.log(`Get favorites: user=${user.userId}, page=${page}, limit=${limit}`);
    const result = await this.favoritesService.getUserFavorites(user.userId, page, limit);
    
    return {
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        pages: result.pages,
      },
    };
  }

  @Get('ids')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user favorite property IDs (for quick sync)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Property IDs retrieved successfully',
    schema: {
      example: {
        success: true,
        data: ['64b8f5e2c1234567890abcde', '64b8f5e2c1234567890abcdf'],
        count: 2
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserFavoriteIds(@CurrentUser() user: { userId: string }) {
    this.logger.log(`Get favorite IDs: user=${user.userId}`);
    const propertyIds = await this.favoritesService.getUserFavoriteIds(user.userId);
    
    return {
      success: true,
      data: propertyIds,
      count: propertyIds.length,
    };
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync favorites (reconcile client state with server)' })
  @ApiResponse({ status: 200, description: 'Sync completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async syncFavorites(
    @CurrentUser() user: { userId: string },
    @Body() dto: SyncFavoritesDto,
  ) {
    this.logger.log(`Sync favorites: user=${user.userId}, clientCount=${dto.propertyIds.length}`);
    const result = await this.favoritesService.syncFavorites(user.userId, dto);
    
    return {
      success: true,
      data: result,
      message: `Sync complete: ${result.added.length} added, ${result.removed.length} removed`,
    };
  }

  @Get('check/:propertyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if property is favorited by current user' })
  @ApiParam({ name: 'propertyId', description: 'Property ID to check' })
  @ApiResponse({ status: 200, description: 'Check completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkFavorite(
    @CurrentUser() user: { userId: string },
    @Param('propertyId') propertyId: string,
  ) {
    const isFavorited = await this.favoritesService.isFavorited(user.userId, propertyId);
    
    return {
      success: true,
      data: {
        propertyId,
        isFavorited,
      },
    };
  }
}
