import {
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsOptional,
  IsNotEmpty,
  Min,
  ValidateNested,
  IsLongitude,
  IsLatitude,
} from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @IsLongitude()
  longitude: number;

  @IsLatitude()
  latitude: number;
}

class AddressDto {
  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  zipcode?: string;
}

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(['apartment', 'house', 'studio', 'land', 'office', 'villa', 'duplex'])
  propertyType: string;

  @IsEnum(['rent', 'sale'])
  transactionType: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  bedrooms?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  bathrooms?: number;

  @IsNumber()
  @Min(0)
  surface: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsArray()
  @IsOptional()
  mediaIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsEnum(['available', 'sold', 'rented'])
  @IsOptional()
  status?: string;
}
