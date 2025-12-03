import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FiltersDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @IsOptional()
  @IsString()
  propertyType?: string; // apartment, house, villa, land, office, studio, duplex

  @IsOptional()
  @IsString()
  transactionType?: string; // rent, sale

  @IsOptional()
  @IsNumber()
  @Min(0)
  bedroomsMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bedroomsMax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bathroomsMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bathroomsMax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  surfaceMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  surfaceMax?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[]; // ['WiFi', 'Parking', 'Pool', 'Garden', 'Balcony', etc.]

  @IsOptional()
  @IsString()
  city?: string;
}

export class GeoSearchDto {
  @IsNumber()
  lat: number; // latitude

  @IsNumber()
  lng: number; // longitude

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(100)
  radiusKm?: number = 10; // default 10 km
}

export class SearchDto {
  @IsOptional()
  @IsString()
  query?: string; // full-text search query

  @IsOptional()
  @ValidateNested()
  @Type(() => FiltersDto)
  filters?: FiltersDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoSearchDto)
  geo?: GeoSearchDto;

  @IsOptional()
  @IsEnum(['price_asc', 'price_desc', 'newest', 'nearest'])
  sort?: string = 'newest';

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class PolygonSearchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoordinateDto)
  polygon: CoordinateDto[]; // Array of [lng, lat] coordinates

  @IsOptional()
  @ValidateNested()
  @Type(() => FiltersDto)
  filters?: FiltersDto;

  @IsOptional()
  @IsEnum(['price_asc', 'price_desc', 'newest'])
  sort?: string = 'newest';

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class CoordinateDto {
  @IsNumber()
  lng: number;

  @IsNumber()
  lat: number;
}

export class AutocompleteDto {
  @IsString()
  q: string; // query string

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number = 10;
}
