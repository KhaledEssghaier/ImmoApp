import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SearchService } from './search.service';
import { SearchDto, PolygonSearchDto, AutocompleteDto } from './dto/search.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * Main search endpoint
   * POST /api/v1/search
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  async search(@Body() searchDto: SearchDto) {
    return this.searchService.search(searchDto);
  }

  /**
   * Polygon search endpoint
   * POST /api/v1/search/polygon
   */
  @Post('polygon')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async searchPolygon(@Body() polygonDto: PolygonSearchDto) {
    return this.searchService.searchWithinPolygon(polygonDto);
  }

  /**
   * Autocomplete suggestions
   * GET /api/v1/search/suggest?q=villa&limit=10
   */
  @Get('suggest')
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // More generous for autocomplete
  async suggest(@Query() query: AutocompleteDto) {
    return this.searchService.autocomplete(query);
  }

  /**
   * Get property by ID
   * GET /api/v1/search/:id
   */
  @Get(':id')
  async getProperty(@Param('id') id: string) {
    return this.searchService.getPropertyById(id);
  }
}
