import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  MESSAGE = 'message',
  PROPERTY_VIEW = 'property_view',
  PROPERTY_PUBLISHED = 'property_published',
  SYSTEM = 'system',
  PROMOTION = 'promotion',
  ADMIN = 'admin',
}

export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  INAPP = 'inapp',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null })
  actorId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(NotificationType),
    required: true,
  })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object, default: {} })
  data: Record<string, any>;

  @Prop({
    type: [String],
    enum: Object.values(NotificationChannel),
    default: ['inapp'],
  })
  channel: NotificationChannel[];

  @Prop({ default: false })
  read: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  expiresAt: Date;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// TTL index for automatic cleanup
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for user queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1, isDeleted: 1 });
