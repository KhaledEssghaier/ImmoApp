import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PaymentType {
  SINGLE_POST = 'single_post',
  SUBSCRIPTION = 'subscription',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ enum: PaymentType, required: true })
  type: PaymentType;

  @Prop({ required: true })
  amount: number;

  @Prop({ enum: PaymentStatus, required: true, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ required: true })
  stripeSessionId: string;

  @Prop()
  stripePaymentIntentId?: string;

  @Prop({ type: Types.ObjectId })
  propertyId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  subscriptionId?: Types.ObjectId;

  @Prop({ type: Object })
  metadata?: any;

  @Prop({ type: Date })
  paidAt?: Date;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Indexes
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ stripeSessionId: 1 }, { unique: true });
PaymentSchema.index({ propertyId: 1 });
PaymentSchema.index({ createdAt: -1 });
