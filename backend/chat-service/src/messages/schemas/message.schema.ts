import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

class Attachment {
  @Prop({ type: Types.ObjectId, required: true })
  mediaId: Types.ObjectId;

  @Prop()
  url?: string;
}

class MessageMeta {
  @Prop({ default: false })
  edited: boolean;

  @Prop({ default: null })
  editedAt: Date | null;
}

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'messages' })
export class Message {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  chatId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  text: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ default: false })
  edited: boolean;

  @Prop({ default: null })
  editedAt: Date | null;

  @Prop({ index: true })
  createdAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Compound index for pagination queries
MessageSchema.index({ chatId: 1, createdAt: -1 });
