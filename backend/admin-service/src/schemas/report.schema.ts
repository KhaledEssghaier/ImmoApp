import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReportDocument = Report & Document;

export enum ReportStatus {
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
  INVALID = 'invalid',
}

export enum TargetType {
  PROPERTY = 'property',
  USER = 'user',
  MESSAGE = 'message',
}

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: Types.ObjectId, required: true })
  reporterId: Types.ObjectId;

  @Prop({ type: String, enum: TargetType, required: true })
  targetType: TargetType;

  @Prop({ type: Types.ObjectId, required: true })
  targetId: Types.ObjectId;

  @Prop({ required: true })
  reason: string;

  @Prop()
  description: string;

  @Prop({ type: String, enum: ReportStatus, default: ReportStatus.OPEN })
  status: ReportStatus;

  @Prop({ type: Types.ObjectId, default: null })
  assignedTo: Types.ObjectId;

  @Prop({ type: Object })
  targetSnapshot: Record<string, any>;

  @Prop({ type: [String], default: [] })
  mediaUrls: string[];

  @Prop()
  reporterIp: string;

  @Prop()
  reporterUserAgent: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

// Indexes
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ targetType: 1, targetId: 1 });
ReportSchema.index({ reporterId: 1 });
ReportSchema.index({ assignedTo: 1 });
