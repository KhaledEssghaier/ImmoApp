import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus } from './update-report-status.dto';
import { TargetType } from './create-report.dto';

export class QueryReportsDto {
  @ApiPropertyOptional({ enum: ReportStatus })
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @ApiPropertyOptional({ enum: TargetType })
  @IsEnum(TargetType)
  @IsOptional()
  targetType?: TargetType;

  @ApiPropertyOptional({ description: 'Filter by assigned admin ID' })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search term for reason or description' })
  @IsString()
  @IsOptional()
  search?: string;
}
