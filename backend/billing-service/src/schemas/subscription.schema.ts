import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, default: 10 })
  totalCredits: number;

  @Prop({ required: true, default: 10 })
  remainingCredits: number;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  paymentId: string;

  @Prop({ type: Date })
  expiresAt?: Date; // Optional expiration date

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Indexes
SubscriptionSchema.index({ userId: 1, isActive: 1, remainingCredits: 1 }); // Covers userId+isActive queries too
SubscriptionSchema.index({ createdAt: -1 });
