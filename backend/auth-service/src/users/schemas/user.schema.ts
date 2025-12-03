import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  fullName: string;

  @Prop()
  phone?: string;

  @Prop()
  profileImage?: string; // Base64 or URL

  @Prop()
  bio?: string;

  @Prop()
  address?: string;

  @Prop({
    type: String,
    enum: ['user', 'agent', 'admin'],
    default: 'user',
  })
  role: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({
    type: {
      isBanned: { type: Boolean, default: false },
      reason: { type: String },
      bannedAt: { type: Date },
      expiresAt: { type: Date },
      isPermanent: { type: Boolean, default: false },
    },
    default: {
      isBanned: false,
      reason: null,
      bannedAt: null,
      expiresAt: null,
      isPermanent: false,
    },
  })
  ban?: {
    isBanned: boolean;
    reason?: string;
    bannedAt?: Date;
    expiresAt?: Date;
    isPermanent?: boolean;
  };

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Exclude password from JSON responses
UserSchema.set('toJSON', {
  transform: function (doc, ret: any) {
    delete ret.passwordHash;
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
