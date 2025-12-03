import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Message, MessageDocument } from './schemas/message.schema';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationsService } from '../conversations/conversations.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
    private conversationsService: ConversationsService,
    private configService: ConfigService,
  ) {}

  async sendMessage(
    sendMessageDto: SendMessageDto,
    senderId: string,
  ): Promise<MessageDocument> {
    const { conversationId, text, attachments } = sendMessageDto;

    // Verify user is participant
    const isParticipant = await this.conversationsService.isParticipant(
      conversationId,
      senderId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    // Create message
    const message = await this.messageModel.create({
      chatId: new Types.ObjectId(conversationId),
      senderId: new Types.ObjectId(senderId),
      text,
      images: attachments?.map(a => a.url || '') || [],
      isRead: false,
      createdAt: new Date(),
    });

    // Update conversation
    await this.conversationsService.updateLastMessage(conversationId, senderId, text);
    await this.conversationsService.incrementUnreadCount(conversationId, senderId);

    return message;
  }

  // Edit and delete functionality removed - simplified schema

  async markMessagesRead(
    conversationId: string,
    messageIds: string[],
    userId: string,
  ): Promise<void> {
    await this.messageModel.updateMany(
      {
        _id: { $in: messageIds.map((id) => new Types.ObjectId(id)) },
        chatId: new Types.ObjectId(conversationId),
      },
      {
        $set: { isRead: true },
      },
    );

    // Reset unread count for this user in conversation
    await this.conversationsService.resetUnreadCount(conversationId, userId);
  }

  async getConversationMessages(
    conversationId: string,
    limit: number = 50,
    before?: string,
  ): Promise<MessageDocument[]> {
    const query: any = {
      chatId: new Types.ObjectId(conversationId),
    };

    if (before) {
      // Pagination using timestamp or messageId
      const beforeMessage = await this.messageModel.findById(before);
      if (beforeMessage) {
        query.createdAt = { $lt: beforeMessage.createdAt };
      }
    }

    return await this.messageModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async getMessagesSince(
    conversationId: string,
    since: Date,
  ): Promise<MessageDocument[]> {
    return await this.messageModel
      .find({
        chatId: new Types.ObjectId(conversationId),
        createdAt: { $gt: since },
      })
      .sort({ createdAt: 1 })
      .lean()
      .exec();
  }

  async getUnreadMessages(
    conversationId: string,
    userId: string,
  ): Promise<MessageDocument[]> {
    return await this.messageModel
      .find({
        chatId: new Types.ObjectId(conversationId),
        senderId: { $ne: new Types.ObjectId(userId) }, // Not sent by current user
        isRead: false,
      })
      .sort({ createdAt: 1 })
      .lean()
      .exec();
  }

  async editMessage(
    messageId: string,
    newText: string,
    userId: string,
  ): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is the sender
    if (message.senderId.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    // Update message
    message.text = newText;
    message.edited = true;
    message.editedAt = new Date();

    await message.save();

    // Update conversation last message if this was the last message
    const conversation = await this.conversationsService.findById(
      message.chatId.toString(),
    );
    
    // Simple check - if text starts with same characters, update it
    if (conversation.lastMessage?.startsWith(message.text.substring(0, 20))) {
      await this.conversationsService.updateLastMessage(
        message.chatId.toString(),
        userId,
        newText,
      );
    }

    return message;
  }
}
