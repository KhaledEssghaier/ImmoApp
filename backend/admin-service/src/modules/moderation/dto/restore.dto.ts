import { IsMongoId, IsString, IsEnum, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RestoreTargetType {
  USER = 'user',
  PROPERTY = 'property',
}

export class RestoreDto {
  @ApiProperty({ enum: RestoreTargetType, description: 'Type of entity to restore' })
  @IsEnum(RestoreTargetType)
  @IsNotEmpty()
  targetType: RestoreTargetType;

  @ApiProperty({ description: 'ID of entity to restore' })
  @IsMongoId()
  @IsNotEmpty()
  targetId: string;

  @ApiPropertyOptional({ description: 'Reason for restoration', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: any;
}
