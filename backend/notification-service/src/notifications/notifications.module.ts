import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationProcessor } from './notifications.processor';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { DevicesModule } from '../devices/devices.module';
import { FcmModule } from '../fcm/fcm.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    BullModule.registerQueue({
      name: 'notifications',
    }),
    DevicesModule,
    FcmModule,
    EmailModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
