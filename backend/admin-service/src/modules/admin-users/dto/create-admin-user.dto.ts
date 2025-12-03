import { IsEmail, IsString, IsEnum, IsOptional, IsArray, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AdminRole {
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

export class CreateAdminUserDto {
  @ApiProperty({ description: 'Admin email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Password', minLength: 8, maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @ApiProperty({ description: 'Admin full name', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: AdminRole, description: 'Admin role', default: AdminRole.MODERATOR })
  @IsEnum(AdminRole)
  @IsOptional()
  role?: AdminRole = AdminRole.MODERATOR;

  @ApiPropertyOptional({ description: 'Custom permissions', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}
