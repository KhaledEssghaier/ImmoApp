import { IsOptional, IsMongoId, IsBoolean, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryNotificationsDto {
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  unreadOnly?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
