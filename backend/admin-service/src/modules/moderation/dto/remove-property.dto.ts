import { IsMongoId, IsString, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RemovePropertyDto {
  @ApiProperty({ description: 'ID of property to remove' })
  @IsMongoId()
  @IsNotEmpty()
  propertyId: string;

  @ApiProperty({ description: 'Reason for removal', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({ description: 'Related report ID if removal is based on a report' })
  @IsMongoId()
  @IsOptional()
  relatedReportId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: any;
}
