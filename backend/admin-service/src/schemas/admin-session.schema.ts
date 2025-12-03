import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdminSessionDocument = AdminSession & Document;

@Schema({ timestamps: true })
export class AdminSession {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop()
  ip: string;

  @Prop()
  userAgent: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ default: false })
  revoked: boolean;

  @Prop()
  createdAt: Date;
}

export const AdminSessionSchema = SchemaFactory.createForClass(AdminSession);

// Indexes (token already indexed via unique: true)
AdminSessionSchema.index({ userId: 1 });
AdminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
AdminSessionSchema.index({ revoked: 1 });
