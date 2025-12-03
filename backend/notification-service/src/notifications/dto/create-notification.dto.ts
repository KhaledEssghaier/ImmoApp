import {
  IsString,
  IsEnum,
  IsArray,
  IsObject,
  IsOptional,
  IsMongoId,
} from 'class-validator';
import {
  NotificationType,
  NotificationChannel,
} from '../schemas/notification.schema';

export class CreateNotificationDto {
  @IsMongoId()
  userId: string;

  @IsOptional()
  @IsMongoId()
  actorId?: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channel?: NotificationChannel[];
}

export class BulkCreateNotificationDto {
  @IsArray()
  notifications: CreateNotificationDto[];
}
