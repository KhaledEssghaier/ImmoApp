import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminUserDocument = AdminUser & Document;

export enum AdminRole {
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

@Schema({ timestamps: true })
export class AdminUser {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ type: String, enum: AdminRole, default: AdminRole.MODERATOR })
  role: AdminRole;

  @Prop({ required: true })
  name: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  lastLoginAt: Date;

  @Prop()
  lastLoginIp: string;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const AdminUserSchema = SchemaFactory.createForClass(AdminUser);

// Indexes (email already indexed via unique: true)
AdminUserSchema.index({ role: 1 });
AdminUserSchema.index({ isActive: 1 });
