import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
