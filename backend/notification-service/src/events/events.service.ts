import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationType,
  NotificationChannel,
} from '../notifications/schemas/notification.schema';

@Injectable()
export class EventsService implements OnModuleInit {
  private readonly logger = new Logger(EventsService.name);
  private subscriber: Redis;
  private publisher: Redis;

  constructor(
    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    this.subscriber = new Redis(redisUrl);
    this.publisher = new Redis(redisUrl);

    this.logger.log('Redis Pub/Sub initialized');

    // Subscribe to event channels
    await this.subscribeToChannels();
  }

  private async subscribeToChannels() {
    const channels = [
      'chat.message.created',
      'property.published',
      'property.viewed',
      'user.followed',
      'payment.succeeded',
      'system.alert',
    ];

    await this.subscriber.subscribe(...channels);

    this.subscriber.on('message', (channel, message) => {
      this.handleEvent(channel, message);
    });

    this.logger.log(`Subscribed to channels: ${channels.join(', ')}`);
  }

  private async handleEvent(channel: string, message: string) {
    try {
      const event = JSON.parse(message);
      this.logger.log(`Received event: ${channel}`, event);

      switch (channel) {
        case 'chat.message.created':
          await this.handleChatMessage(event);
          break;
        case 'property.published':
          await this.handlePropertyPublished(event);
          break;
        case 'property.viewed':
          await this.handlePropertyViewed(event);
          break;
        case 'user.followed':
          await this.handleUserFollowed(event);
          break;
        case 'payment.succeeded':
          await this.handlePaymentSucceeded(event);
          break;
        case 'system.alert':
          await this.handleSystemAlert(event);
          break;
        default:
          this.logger.warn(`Unknown event channel: ${channel}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle event from ${channel}: ${error.message}`,
        error.stack,
      );
    }
  }

  private async handleChatMessage(event: any) {
    const { conversationId, messageId, senderId, senderName, participantIds, text } = event;

    // Send notification to all participants except sender
    const recipients = participantIds.filter((id) => id !== senderId);

    for (const recipientId of recipients) {
      await this.notificationsService.create({
        userId: recipientId,
        actorId: senderId,
        type: NotificationType.MESSAGE,
        title: `New message from ${senderName}`,
        message: text?.substring(0, 100) || 'Sent you a message',
        data: {
          conversationId,
          messageId,
          route: `/conversations/${conversationId}`,
        },
        channel: [NotificationChannel.PUSH, NotificationChannel.INAPP],
      });
    }

    this.logger.log(`Sent message notifications to ${recipients.length} recipients`);
  }

  private async handlePropertyPublished(event: any) {
    const { propertyId, ownerId, ownerName, title, location } = event;

    // TODO: Get followers/subscribers from user service
    // For now, this is a placeholder for the notification logic

    this.logger.log(`Property published: ${propertyId} by ${ownerName}`);

    // Example: Notify followers
    // const followers = await this.getFollowers(ownerId);
    // for (const followerId of followers) {
    //   await this.notificationsService.create({...});
    // }
  }

  private async handlePropertyViewed(event: any) {
    const { propertyId, ownerId, viewerId, viewerName } = event;

    // Notify property owner about view
    if (ownerId && ownerId !== viewerId) {
      await this.notificationsService.create({
        userId: ownerId,
        actorId: viewerId,
        type: NotificationType.PROPERTY_VIEW,
        title: 'Someone viewed your property',
        message: `${viewerName || 'A user'} viewed your property`,
        data: {
          propertyId,
          viewerId,
          route: `/properties/${propertyId}`,
        },
        channel: [NotificationChannel.INAPP],
      });
    }

    this.logger.log(`Property view notification sent to owner ${ownerId}`);
  }

  private async handleUserFollowed(event: any) {
    const { followerId, followerName, followedId } = event;

    await this.notificationsService.create({
      userId: followerId,
      actorId: followerId,
      type: NotificationType.ADMIN,
      title: 'New Follower',
      message: `${followerName} started following you`,
      data: {
        followerId,
        route: `/profile/${followerId}`,
      },
      channel: [NotificationChannel.PUSH, NotificationChannel.INAPP],
    });

    this.logger.log(`Follower notification sent to user ${followedId}`);
  }

  private async handlePaymentSucceeded(event: any) {
    const { paymentId, userId, amount, propertyId, promotionType } = event;

    await this.notificationsService.create({
      userId,
      type: NotificationType.ADMIN,
      title: 'Payment Successful',
      message: `Your payment of $${amount} for ${promotionType} was successful`,
      data: {
        paymentId,
        propertyId,
        amount,
        route: `/properties/${propertyId}`,
      },
      channel: [
        NotificationChannel.PUSH,
        NotificationChannel.INAPP,
        NotificationChannel.EMAIL,
      ],
    });

    this.logger.log(`Payment notification sent to user ${userId}`);
  }

  private async handleSystemAlert(event: any) {
    const { title, body, userIds, route } = event;

    // Fan-out to multiple users
    if (userIds && userIds.length > 0) {
      const notifications = userIds.map((userId) => ({
        userId,
        type: NotificationType.SYSTEM,
        title,
        message: body,
        data: { route },
        channel: [NotificationChannel.PUSH, NotificationChannel.INAPP],
      }));

      await this.notificationsService.createBulk(notifications);
      this.logger.log(`System alert sent to ${userIds.length} users`);
    }
  }

  // Publish event to Redis (for testing or internal use)
  async publishEvent(channel: string, data: any) {
    await this.publisher.publish(channel, JSON.stringify(data));
    this.logger.log(`Published event to ${channel}`);
  }
}
