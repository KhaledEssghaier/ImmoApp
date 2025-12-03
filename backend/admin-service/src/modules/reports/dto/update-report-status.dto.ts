import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportStatus {
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
  INVALID = 'invalid',
}

export class UpdateReportStatusDto {
  @ApiProperty({ enum: ReportStatus, description: 'New status for the report' })
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @ApiPropertyOptional({ description: 'Notes about the status change', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
