import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema()
export class Session {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  refreshTokenHash: string;

  @Prop()
  userAgent?: string;

  @Prop()
  ip?: string;

  @Prop({ required: true, default: () => new Date() })
  createdAt: Date;

  @Prop({ required: true })
  expiresAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// TTL index to automatically delete expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for faster lookups
SessionSchema.index({ userId: 1 });
