import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  Notification,
  NotificationDocument,
  NotificationChannel,
} from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectQueue('notifications') private notificationQueue: Queue,
    private configService: ConfigService,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const ttlDays = this.configService.get<number>('NOTIF_DEFAULT_TTL_DAYS', 30);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    const notification = new this.notificationModel({
      ...createNotificationDto,
      userId: new Types.ObjectId(createNotificationDto.userId),
      actorId: createNotificationDto.actorId
        ? new Types.ObjectId(createNotificationDto.actorId)
        : null,
      expiresAt,
      createdAt: new Date(),
    });

    const saved = await notification.save();

    // Enqueue push/email jobs if needed
    if (
      createNotificationDto.channel?.includes(NotificationChannel.PUSH) ||
      !createNotificationDto.channel
    ) {
      await this.notificationQueue.add(
        'send-push',
        {
          notificationId: saved._id.toString(),
          userId: createNotificationDto.userId,
          title: createNotificationDto.title,
          message: createNotificationDto.message,
          data: createNotificationDto.data,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
    }

    if (createNotificationDto.channel?.includes(NotificationChannel.EMAIL)) {
      await this.notificationQueue.add(
        'send-email',
        {
          notificationId: saved._id.toString(),
          userId: createNotificationDto.userId,
          title: createNotificationDto.title,
          message: createNotificationDto.message,
          data: createNotificationDto.data,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
    }

    return saved;
  }

  async createBulk(notifications: CreateNotificationDto[]) {
    const results = await Promise.allSettled(
      notifications.map((dto) => this.create(dto)),
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return {
      total: notifications.length,
      successful,
      failed,
    };
  }

  async findAll(query: QueryNotificationsDto) {
    const { userId, unreadOnly, page = 1, limit = 20 } = query;

    const filter: any = {
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    };

    if (unreadOnly) {
      filter.read = false;
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.notificationModel.countDocuments(filter),
    ]);

    return {
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      read: false,
      isDeleted: false,
    });

    return { count };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationModel.findById(id);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    notification.read = true;
    await notification.save();

    return notification;
  }

  async markAllAsRead(userId: string) {
    const result = await this.notificationModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        read: false,
        isDeleted: false,
      },
      {
        $set: { read: true },
      },
    );

    return { modifiedCount: result.modifiedCount };
  }

  async softDelete(id: string, userId: string) {
    const notification = await this.notificationModel.findById(id);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    notification.isDeleted = true;
    await notification.save();

    return { message: 'Notification deleted' };
  }
}
