import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddFavoriteDto {
  @ApiProperty({ description: 'Property ID to favorite', example: '64b8f5e2c1234567890abcde' })
  @IsString()
  propertyId: string;

  @ApiPropertyOptional({ description: 'Source platform', enum: ['mobile', 'web', 'api'] })
  @IsOptional()
  @IsEnum(['mobile', 'web', 'api'])
  source?: string;
}

export class SyncFavoritesDto {
  @ApiProperty({ 
    description: 'Array of property IDs to sync', 
    type: [String],
    example: ['64b8f5e2c1234567890abcde', '64b8f5e2c1234567890abcdf'] 
  })
  @IsString({ each: true })
  propertyIds: string[];

  @ApiPropertyOptional({ description: 'Source platform', enum: ['mobile', 'web', 'api'] })
  @IsOptional()
  @IsEnum(['mobile', 'web', 'api'])
  source?: string;
}

export class GetFavoritesQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'User ID (admin only)' })
  @IsOptional()
  @IsString()
  userId?: string;
}
