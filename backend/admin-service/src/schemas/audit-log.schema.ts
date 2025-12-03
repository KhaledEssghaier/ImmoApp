import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: Types.ObjectId, required: true })
  actorId: Types.ObjectId;

  @Prop({ required: true })
  action: string;

  @Prop({ type: Object, required: true })
  resource: {
    type: string;
    id: string;
  };

  @Prop({ type: Object })
  before: Record<string, any>;

  @Prop({ type: Object })
  after: Record<string, any>;

  @Prop()
  ip: string;

  @Prop()
  userAgent: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop()
  createdAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Indexes
AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ 'resource.type': 1, 'resource.id': 1 });
AuditLogSchema.index({ createdAt: -1 });
