import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ConversationResponseDto, UserDto, LastMessageDto } from './dto/conversation-response.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    private httpService: HttpService,
  ) {}

  async createConversation(
    createConversationDto: CreateConversationDto,
    currentUserId: string,
  ): Promise<ConversationDocument> {
    const { participantIds, propertyId } = createConversationDto;

    // Add current user if not in list
    const allParticipants = Array.from(
      new Set([currentUserId, ...participantIds]),
    );

    if (allParticipants.length < 2) {
      throw new BadRequestException('Conversation must have at least 2 participants');
    }

    // Check if conversation already exists between these participants
    const existing = await this.findExistingConversation(allParticipants, propertyId);
    if (existing) {
      return existing;
    }

    // Create new conversation (only supports 2 participants with new schema)
    if (allParticipants.length !== 2) {
      throw new BadRequestException('Only 1-on-1 conversations are supported');
    }

    const [user1Id, user2Id] = allParticipants.map((id) => new Types.ObjectId(id));

    const conversation = await this.conversationModel.create({
      user1: user1Id,
      user2: user2Id,
      propertyId: propertyId ? new Types.ObjectId(propertyId) : undefined,
      lastMessage: undefined,
      lastMessageAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return conversation;
  }

  async findExistingConversation(
    participantIds: string[],
    propertyId?: string,
  ): Promise<ConversationDocument | null> {
    if (participantIds.length !== 2) {
      return null;
    }

    const [id1, id2] = participantIds.map((id) => new Types.ObjectId(id));

    const query: any = {
      $or: [
        { user1: id1, user2: id2 },
        { user1: id2, user2: id1 },
      ],
    };

    if (propertyId) {
      query.propertyId = new Types.ObjectId(propertyId);
    }

    return await this.conversationModel.findOne(query);
  }

  async findUserConversations(userId: string): Promise<ConversationDocument[]> {
    const userObjectId = new Types.ObjectId(userId);

    return await this.conversationModel
      .find({
        $or: [
          { user1: userObjectId },
          { user2: userObjectId }
        ],
        deletedBy: { $ne: userObjectId }
      })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
  }

  async findUserConversationsFormatted(userId: string): Promise<ConversationResponseDto[]> {
    const conversations = await this.findUserConversations(userId);
    
    const formatted = await Promise.all(
      conversations.map(async (conv) => {
        // Get the other user ID (not the current user)
        const user1Str = conv.user1.toString();
        const user2Str = conv.user2.toString();
        const otherUserId = user1Str === userId ? user2Str : user1Str;

        // Fetch user details from auth service
        let otherUser: UserDto = {
          id: otherUserId,
          name: 'Unknown User',
        };

        try {
          const response = await firstValueFrom(
            this.httpService.get(`http://localhost:3001/users/${otherUserId}`)
          );
          if (response.data) {
            otherUser = {
              id: response.data.id || response.data._id?.toString() || otherUserId,
              name: response.data.fullName || response.data.name || 'Unknown User',
              avatarUrl: response.data.avatar,
              isOnline: false,
            };
          }
        } catch (error) {
          console.error(`Failed to fetch user ${otherUserId}:`, error.message);
          // Keep the fallback with valid MongoDB ObjectId
          otherUser.id = otherUserId;
        }

        // Format last message properly (lastMessage is now just a string preview)
        let lastMessage: LastMessageDto | undefined;
        if (conv.lastMessage && conv.lastMessageAt) {
          lastMessage = {
            id: conv._id.toString() + '-last',
            conversationId: conv._id.toString(),
            senderId: otherUserId, // We don't store senderId in preview, assume it's the other user
            text: conv.lastMessage,
            attachments: [],
            createdAt: conv.lastMessageAt,
            readBy: [],
          };
        }

        // Get unread count for the current user
        const isUser1 = conv.user1.toString() === userId;
        const unreadCount = isUser1 ? conv.unreadCountUser1 : conv.unreadCountUser2;

        return {
          id: conv._id.toString(),
          otherUser,
          lastMessage,
          unreadCount,
          updatedAt: conv.updatedAt,
        };
      })
    );

    return formatted;
  }

  async formatConversation(
    conv: ConversationDocument,
    userId: string,
  ): Promise<ConversationResponseDto> {
    // Get the other user ID (not the current user)
    const user1Str = conv.user1.toString();
    const user2Str = conv.user2.toString();
    const otherUserId = user1Str === userId ? user2Str : user1Str;

    // Fetch user details from auth service
    let otherUser: UserDto = {
      id: otherUserId,
      name: 'Unknown User',
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(`http://localhost:3001/users/${otherUserId}`)
      );
      if (response.data) {
        otherUser = {
          id: response.data.id,
          name: response.data.fullName || response.data.name || 'Unknown User',
          avatarUrl: response.data.avatar,
          isOnline: false,
        };
      }
    } catch (error) {
      console.error(`Failed to fetch user ${otherUserId}:`, error.message);
    }

    // Format last message properly
    let lastMessage: LastMessageDto | undefined;
    if (conv.lastMessage && conv.lastMessageAt) {
      lastMessage = {
        id: conv._id.toString() + '-last',
        conversationId: conv._id.toString(),
        senderId: otherUserId,
        text: conv.lastMessage,
        attachments: [],
        createdAt: conv.lastMessageAt,
        readBy: [],
      };
    }

    // Get unread count for the current user
    const isUser1 = conv.user1.toString() === userId;
    const unreadCount = isUser1 ? conv.unreadCountUser1 : conv.unreadCountUser2;

    return {
      id: conv._id.toString(),
      otherUser,
      lastMessage,
      unreadCount,
      updatedAt: conv.updatedAt,
    };
  }

  async findById(conversationId: string): Promise<ConversationDocument> {
    const conversation = await this.conversationModel.findById(conversationId);
    
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async updateLastMessage(
    conversationId: string,
    senderId: string,
    text: string,
  ): Promise<void> {
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: text.substring(0, 100), // Store preview only
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async incrementUnreadCount(
    conversationId: string,
    excludeUserId: string,
  ): Promise<void> {
    const conversation = await this.findById(conversationId);
    
    // Increment unread count for the OTHER user (not the sender)
    const updateField = conversation.user1.toString() === excludeUserId 
      ? 'unreadCountUser2' 
      : 'unreadCountUser1';

    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $inc: { [updateField]: 1 },
    });
  }

  async resetUnreadCount(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.findById(conversationId);
    
    // Reset unread count for the current user
    const updateField = conversation.user1.toString() === userId 
      ? 'unreadCountUser1' 
      : 'unreadCountUser2';

    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $set: { [updateField]: 0 },
    });
  }

  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const conversation = await this.findById(conversationId);
    return conversation.user1.toString() === userId || conversation.user2.toString() === userId;
  }

  async getParticipants(conversationId: string): Promise<Types.ObjectId[]> {
    const conversation = await this.findById(conversationId);
    return [conversation.user1, conversation.user2];
  }

  async softDeleteForUser(conversationId: string, userId: string): Promise<void> {
    const userObjectId = new Types.ObjectId(userId);

    // Verify conversation exists and user is participant
    const conversation = await this.conversationModel.findById(conversationId).lean().exec();
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = 
      conversation.user1.toString() === userId || 
      conversation.user2.toString() === userId;
    
    if (!isParticipant) {
      throw new BadRequestException('You are not a participant of this conversation');
    }

    // Add user to deletedBy array
    await this.conversationModel.findByIdAndUpdate(
      conversationId, 
      { $addToSet: { deletedBy: userObjectId } },
      { new: true }
    ).exec();
  }

  async muteConversation(conversationId: string, userId: string): Promise<void> {
    const userObjectId = new Types.ObjectId(userId);

    // Verify conversation exists and user is participant
    const conversation = await this.conversationModel.findById(conversationId).lean().exec();
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = 
      conversation.user1.toString() === userId || 
      conversation.user2.toString() === userId;
    
    if (!isParticipant) {
      throw new BadRequestException('You are not a participant of this conversation');
    }

    await this.conversationModel.findByIdAndUpdate(
      conversationId,
      { $addToSet: { mutedBy: userObjectId } },
      { new: true }
    ).exec();
  }

  async unmuteConversation(conversationId: string, userId: string): Promise<void> {
    const userObjectId = new Types.ObjectId(userId);

    // Verify conversation exists and user is participant
    const conversation = await this.conversationModel.findById(conversationId).lean().exec();
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = 
      conversation.user1.toString() === userId || 
      conversation.user2.toString() === userId;
    
    if (!isParticipant) {
      throw new BadRequestException('You are not a participant of this conversation');
    }

    await this.conversationModel.findByIdAndUpdate(
      conversationId,
      { $pull: { mutedBy: userObjectId } },
      { new: true }
    ).exec();
  }

  async blockUser(conversationId: string, userId: string): Promise<void> {
    const userObjectId = new Types.ObjectId(userId);

    // Verify conversation exists and user is participant
    const conversation = await this.conversationModel.findById(conversationId).lean().exec();
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = 
      conversation.user1.toString() === userId || 
      conversation.user2.toString() === userId;
    
    if (!isParticipant) {
      throw new BadRequestException('You are not a participant of this conversation');
    }

    await this.conversationModel.findByIdAndUpdate(
      conversationId,
      { $addToSet: { blockedBy: userObjectId } },
      { new: true }
    ).exec();
  }

  async unblockUser(conversationId: string, userId: string): Promise<void> {
    const userObjectId = new Types.ObjectId(userId);

    // Verify conversation exists and user is participant
    const conversation = await this.conversationModel.findById(conversationId).lean().exec();
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = 
      conversation.user1.toString() === userId || 
      conversation.user2.toString() === userId;
    
    if (!isParticipant) {
      throw new BadRequestException('You are not a participant of this conversation');
    }

    await this.conversationModel.findByIdAndUpdate(
      conversationId,
      { $pull: { blockedBy: userObjectId } },
      { new: true }
    ).exec();
  }
}
