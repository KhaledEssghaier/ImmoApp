import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ModerationActionDocument = ModerationAction & Document;

export enum ActionType {
  REMOVE_PROPERTY = 'remove_property',
  BAN_USER = 'ban_user',
  WARNING = 'warning',
  RESTORE_PROPERTY = 'restore_property',
  UNBAN_USER = 'unban_user',
  REMOVE_MESSAGE = 'remove_message',
  FEATURE_PROPERTY = 'feature_property',
}

export enum TargetType {
  PROPERTY = 'property',
  USER = 'user',
  MESSAGE = 'message',
}

@Schema({ timestamps: true })
export class ModerationAction {
  @Prop({ type: String, enum: ActionType, required: true })
  actionType: ActionType;

  @Prop({ type: Types.ObjectId, required: true })
  performedBy: Types.ObjectId;

  @Prop({ type: String, enum: TargetType, required: true })
  targetType: TargetType;

  @Prop({ type: Types.ObjectId, required: true })
  targetId: Types.ObjectId;

  @Prop({ required: true })
  reason: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: Types.ObjectId, default: null })
  relatedReportId: Types.ObjectId;

  @Prop({ type: Number, default: null })
  durationDays: number;

  @Prop({ type: Date, default: null })
  expiresAt: Date;

  @Prop()
  createdAt: Date;
}

export const ModerationActionSchema = SchemaFactory.createForClass(ModerationAction);

// Indexes
ModerationActionSchema.index({ performedBy: 1, createdAt: -1 });
ModerationActionSchema.index({ targetType: 1, targetId: 1 });
ModerationActionSchema.index({ actionType: 1 });
ModerationActionSchema.index({ expiresAt: 1 }, { sparse: true });
