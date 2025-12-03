import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DeviceDocument = Device & Document;

export enum DevicePlatform {
  ANDROID = 'android',
  IOS = 'ios',
  WEB = 'web',
}

@Schema({ timestamps: true })
export class Device {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  deviceToken: string;

  @Prop({
    type: String,
    enum: Object.values(DevicePlatform),
    required: true,
  })
  platform: DevicePlatform;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  lastSeenAt: Date;

  @Prop({ default: false })
  isInvalid: boolean;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

// Compound indexes
DeviceSchema.index({ userId: 1, platform: 1 });
DeviceSchema.index({ deviceToken: 1 }, { unique: true });
DeviceSchema.index({ lastSeenAt: 1 });
DeviceSchema.index({ isInvalid: 1 });
