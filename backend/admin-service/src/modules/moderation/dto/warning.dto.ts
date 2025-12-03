import { IsMongoId, IsString, IsEnum, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WarningTargetType {
  USER = 'user',
  PROPERTY = 'property',
}

export class WarningDto {
  @ApiProperty({ enum: WarningTargetType, description: 'Type of entity to warn' })
  @IsEnum(WarningTargetType)
  @IsNotEmpty()
  targetType: WarningTargetType;

  @ApiProperty({ description: 'ID of entity to warn' })
  @IsMongoId()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({ description: 'Warning message', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({ description: 'Related report ID' })
  @IsMongoId()
  @IsOptional()
  relatedReportId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: any;
}
