import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  Min,
  IsLongitude,
  IsLatitude,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FilterPropertyDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsEnum(['apartment', 'house', 'studio', 'land', 'office', 'villa', 'duplex'])
  propertyType?: string;

  @IsOptional()
  @IsEnum(['rent', 'sale'])
  transactionType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bedrooms?: number;

  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  radius?: number; // in meters

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsEnum(['available', 'sold', 'rented'])
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}
