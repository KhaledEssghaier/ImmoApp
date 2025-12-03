import { IsMongoId, IsString, IsInt, IsOptional, Min, Max, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BanUserDto {
  @ApiProperty({ description: 'ID of user to ban' })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Reason for ban', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({ description: 'Ban duration in days (null for permanent)', minimum: 1, maximum: 3650 })
  @IsInt()
  @Min(1)
  @Max(3650)
  @IsOptional()
  durationDays?: number;

  @ApiPropertyOptional({ description: 'Related report ID if ban is based on a report' })
  @IsMongoId()
  @IsOptional()
  relatedReportId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: any;
}
