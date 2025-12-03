import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from '../messages/messages.service';
import { ConversationsService } from '../conversations/conversations.service';
import { RedisService } from '../redis/redis.service';
import { SendMessageDto } from '../messages/dto/send-message.dto';
import { MarkReadDto } from '../messages/dto/mark-read.dto';
import { TypingDto } from '../messages/dto/typing.dto';
import { JoinConversationDto } from './dto/join-conversation.dto';
import { createAdapter } from '@socket.io/redis-adapter';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private messagesService: MessagesService,
    private conversationsService: ConversationsService,
    private redisService: RedisService,
  ) {}

  afterInit(server: Server) {
    console.log('✅ Socket.IO initialized (Redis adapter disabled for single-instance mode)');
  }

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake
      const token = 
        client.handshake.auth?.token || 
        client.handshake.headers?.authorization?.replace('Bearer ', '') ||
        client.handshake.query?.token;

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      // Verify JWT
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const userId = payload.sub;

      // Store userId in socket data
      client.data.userId = userId;

      // Map socket to user in Redis for presence
      await this.redisService.mapSocketToUser(client.id, userId);
      await this.redisService.addUserSocket(userId, client.id);

      // Broadcast presence update
      const socketCount = await this.redisService.getUserSocketCount(userId);
      if (socketCount === 1) {
        // User just came online
        this.server.emit('presence_update', {
          userId,
          online: true,
        });
      }

      console.log(`✅ Client connected: ${client.id} (User: ${userId})`);
    } catch (error) {
      console.error('❌ Connection error:', error.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId) {
      // Remove socket from user's socket list
      await this.redisService.removeUserSocket(userId, client.id);
      await this.redisService.removeSocketMapping(client.id);

      // Check if user is now offline
      const isOnline = await this.redisService.isUserOnline(userId);
      if (!isOnline) {
        // User went offline
        this.server.emit('presence_update', {
          userId,
          online: false,
        });
      }

      console.log(`🔌 Client disconnected: ${client.id} (User: ${userId})`);
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinConversationDto,
  ) {
    try {
      const userId = client.data.userId;
      const { conversationId } = data;

      // Verify user is participant
      const isParticipant = await this.conversationsService.isParticipant(
        conversationId,
        userId,
      );

      if (!isParticipant) {
        client.emit('error', { message: 'Not authorized to join this conversation' });
        return;
      }

      // Join room
      await client.join(conversationId);
      console.log(`📥 User ${userId} joined conversation ${conversationId}`);

      // Mark all unread messages in this conversation as read
      await this.conversationsService.resetUnreadCount(conversationId, userId);
      
      // Get all unread messages and mark them as read
      const unreadMessages = await this.messagesService.getUnreadMessages(conversationId, userId);
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg._id.toString());
        await this.messagesService.markMessagesRead(conversationId, messageIds, userId);
        
        // Notify other participants that messages were read
        client.to(conversationId).emit('messages_read', {
          conversationId,
          messageIds,
          readBy: userId,
        });
      }

      client.emit('joined_conversation', { 
        conversationId,
        markedAsRead: unreadMessages.length 
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinConversationDto,
  ) {
    const { conversationId } = data;
    await client.leave(conversationId);
    console.log(`📤 User ${client.data.userId} left conversation ${conversationId}`);
  }

  @SubscribeMessage('message_send')
  async handleMessageSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto,
  ) {
    try {
      const userId = client.data.userId;

      // Check rate limit
      const allowed = await this.redisService.checkMessageRateLimit(userId);
      if (!allowed) {
        client.emit('error', { message: 'Rate limit exceeded. Please slow down.' });
        return;
      }

      // Save message
      const message = await this.messagesService.sendMessage(data, userId);

      // Broadcast to room
      this.server.to(data.conversationId).emit('message_new', {
        ...message.toObject(),
        localId: data.localId, // For optimistic UI matching
      });

      // Publish notification event
      const participants = await this.conversationsService.getParticipants(
        data.conversationId,
      );

      // Get sender name from JWT payload or use a default
      const token = client.handshake.auth.token;
      let senderName = 'User';
      try {
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get('JWT_SECRET'),
        });
        senderName = payload.firstName && payload.lastName 
          ? `${payload.firstName} ${payload.lastName}`
          : payload.email || 'User';
      } catch (e) {
        console.warn('Could not decode sender name from token');
      }

      await this.redisService.publishMessageCreated({
        conversationId: data.conversationId,
        messageId: message._id.toString(),
        senderId: userId,
        senderName: senderName,
        participantIds: participants.map((id) => id.toString()),
        text: message.text,
      });

      console.log(`💬 Message sent in conversation ${data.conversationId}`);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  // Edit and delete handlers removed - simplified schema

  @SubscribeMessage('message_read')
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MarkReadDto,
  ) {
    try {
      const userId = client.data.userId;

      await this.messagesService.markMessagesRead(
        data.conversationId,
        data.messageIds,
        userId,
      );

      // Broadcast read receipt update
      this.server.to(data.conversationId).emit('message_read_update', {
        conversationId: data.conversationId,
        userId,
        messageIds: data.messageIds,
      });

      console.log(`✅ Messages marked read in ${data.conversationId} by ${userId}`);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingDto,
  ) {
    const userId = client.data.userId;

    // Broadcast typing indicator to others in the room
    client.to(data.conversationId).emit('typing', {
      conversationId: data.conversationId,
      userId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('presence_subscribe')
  async handlePresenceSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const isOnline = await this.redisService.isUserOnline(data.userId);
    client.emit('presence_update', {
      userId: data.userId,
      online: isOnline,
    });
  }
}
