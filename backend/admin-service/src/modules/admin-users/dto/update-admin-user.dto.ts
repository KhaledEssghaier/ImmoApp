import { IsString, IsEnum, IsOptional, IsArray, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdminRole } from './create-admin-user.dto';

export class UpdateAdminUserDto {
  @ApiPropertyOptional({ description: 'Admin full name', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ enum: AdminRole, description: 'Admin role' })
  @IsEnum(AdminRole)
  @IsOptional()
  role?: AdminRole;

  @ApiPropertyOptional({ description: 'Custom permissions', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];

  @ApiPropertyOptional({ description: 'Account active status' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'New password', minLength: 8, maxLength: 100 })
  @IsString()
  @IsOptional()
  @MinLength(8)
  @MaxLength(100)
  password?: string;
}
