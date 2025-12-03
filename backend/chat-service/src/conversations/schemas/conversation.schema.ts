import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true, collection: 'chats' })
export class Conversation {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  user1: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  user2: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null })
  propertyId: Types.ObjectId | null;

  @Prop({ type: String })
  lastMessage: string;

  @Prop({ type: Date })
  lastMessageAt: Date;

  @Prop({ type: Number, default: 0 })
  unreadCountUser1: number;

  @Prop({ type: Number, default: 0 })
  unreadCountUser2: number;

  @Prop({ type: [Types.ObjectId], default: [] })
  mutedBy: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], default: [] })
  blockedBy: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], default: [] })
  deletedBy: Types.ObjectId[];

  @Prop({ required: true })
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  // Computed property for backward compatibility
  get participantIds(): Types.ObjectId[] {
    return [this.user1, this.user2];
  }
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Indexes for efficient queries
ConversationSchema.index({ user1: 1, user2: 1 });
ConversationSchema.index({ user1: 1, propertyId: 1 });
ConversationSchema.index({ user2: 1, propertyId: 1 });
ConversationSchema.index({ updatedAt: -1 });
