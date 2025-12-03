import { IsEnum, IsString, IsOptional, IsArray, IsNotEmpty, MaxLength, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TargetType {
  PROPERTY = 'property',
  USER = 'user',
  MESSAGE = 'message',
}

export class CreateReportDto {
  @ApiProperty({ description: 'ID of user creating the report' })
  @IsMongoId()
  @IsNotEmpty()
  reporterId: string;

  @ApiProperty({ enum: TargetType, description: 'Type of entity being reported' })
  @IsEnum(TargetType)
  @IsNotEmpty()
  targetType: TargetType;

  @ApiProperty({ description: 'ID of the entity being reported' })
  @IsMongoId()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({ description: 'Reason for the report', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  reason: string;

  @ApiPropertyOptional({ description: 'Detailed description', maxLength: 1000 })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Media URLs as evidence', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mediaUrls?: string[];

  @ApiPropertyOptional({ description: 'Snapshot of the reported content' })
  @IsOptional()
  targetSnapshot?: any;
}
