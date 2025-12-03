import { IsString, IsEnum, IsOptional } from 'class-validator';
import { DevicePlatform } from '../schemas/device.schema';

export class RegisterDeviceDto {
  @IsString()
  deviceToken: string;

  @IsEnum(DevicePlatform)
  platform: DevicePlatform;

  @IsOptional()
  @IsString()
  deviceInfo?: string;
}
