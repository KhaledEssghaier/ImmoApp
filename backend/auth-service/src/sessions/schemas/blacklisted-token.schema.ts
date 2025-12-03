import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlacklistedTokenDocument = BlacklistedToken & Document;

@Schema()
export class BlacklistedToken {
  @Prop({ required: true, unique: true, index: true })
  token: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ required: true, default: () => new Date() })
  blacklistedAt: Date;
}

export const BlacklistedTokenSchema = SchemaFactory.createForClass(BlacklistedToken);

// TTL index to automatically delete expired blacklisted tokens
BlacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
