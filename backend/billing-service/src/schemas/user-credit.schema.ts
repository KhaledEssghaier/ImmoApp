import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserCreditDocument = UserCredit & Document;

@Schema({ timestamps: true })
export class UserCredit {
  @Prop({ type: Types.ObjectId, required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  credits: number;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const UserCreditSchema = SchemaFactory.createForClass(UserCredit);

// Indexes (userId already indexed via unique: true)
UserCreditSchema.index({ credits: 1 });
