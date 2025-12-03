import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation } from '../src/conversations/schemas/conversation.schema';
import { Message } from '../src/messages/schemas/message.schema';

describe('ChatGateway (e2e)', () => {
  let app: INestApplication;
  let client1: Socket;
  let client2: Socket;
  let conversationId: string;
  let serverPort: number;
  let jwtService: JwtService;
  let testToken1: string;
  let testToken2: string;
  let conversationModel: Model<Conversation>;
  let messageModel: Model<Message>;

  const userId1 = '673762f5e85740f6248f2801';
  const userId2 = '673762f5e85740f6248f2802';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0);
    serverPort = app.getHttpServer().address().port;

    // Get services and models
    jwtService = app.get(JwtService);
    conversationModel = app.get(getModelToken(Conversation.name));
    messageModel = app.get(getModelToken(Message.name));
    
    // Generate valid test tokens
    testToken1 = jwtService.sign({
      sub: userId1,
      email: 'user1@test.com',
      role: 'user',
    });
    
    testToken2 = jwtService.sign({
      sub: userId2,
      email: 'user2@test.com',
      role: 'user',
    });

    // Create test conversation in MongoDB
    const conversation = await conversationModel.create({
      participantIds: [userId1, userId2],
      propertyId: null,
      lastMessage: {
        text: 'Test message',
        senderId: userId1,
        createdAt: new Date(),
      },
      unreadCounts: {
        [userId1]: 0,
        [userId2]: 0,
      },
      isGroup: false,
    });
    
    conversationId = conversation._id.toString();
  });

  afterAll(async () => {
    // Cleanup test data
    await conversationModel.deleteMany({ participantIds: { $in: [userId1, userId2] } });
    await messageModel.deleteMany({ senderId: { $in: [userId1, userId2] } });
    
    if (client1?.connected) {
      client1.disconnect();
    }
    if (client2?.connected) {
      client2.disconnect();
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    await app.close();
  });

  beforeEach((done) => {
    client1 = io(`http://localhost:${serverPort}/chat`, {
      auth: { token: testToken1 },
      transports: ['websocket'],
    });

    client2 = io(`http://localhost:${serverPort}/chat`, {
      auth: { token: testToken2 },
      transports: ['websocket'],
    });

    let connectedCount = 0;
    const checkConnected = () => {
      connectedCount++;
      if (connectedCount === 2) {
        done();
      }
    };

    client1.on('connect', checkConnected);
    client2.on('connect', checkConnected);
  });

  afterEach(() => {
    if (client1?.connected) {
      client1.disconnect();
    }
    if (client2?.connected) {
      client2.disconnect();
    }
  });

  describe('Connection', () => {
    it('should connect successfully with valid token', (done) => {
      expect(client1.connected).toBe(true);
      expect(client2.connected).toBe(true);
      done();
    });

    it('should disconnect with invalid token', (done) => {
      const badClient = io(`http://localhost:${serverPort}/chat`, {
        auth: { token: 'invalid-token' },
        transports: ['websocket'],
      });

      badClient.on('disconnect', () => {
        expect(badClient.connected).toBe(false);
        badClient.close();
        done();
      });
    });
  });

  describe('Message Exchange', () => {
    it('should send and receive messages between two clients', (done) => {
      const testMessage = {
        conversationId,
        text: 'Hello from client1!',
      };

      // Client2 joins the conversation room
      client2.emit('join_conversation', { conversationId });

      // Client2 listens for the message
      client2.on('message_new', (data) => {
        expect(data.text).toBe(testMessage.text);
        expect(data.senderId).toBe(userId1);
        done();
      });

      // Client1 sends the message after a short delay (to ensure client2 joined)
      setTimeout(() => {
        client1.emit('message_send', testMessage);
      }, 100);
    }, 10000); // Increase timeout to 10s

    it('should handle typing indicators', (done) => {
      // Both clients join the conversation
      client1.emit('join_conversation', { conversationId });
      client2.emit('join_conversation', { conversationId });

      client2.on('typing', (data) => {
        expect(data.conversationId).toBe(conversationId);
        expect(data.userId).toBe(userId1);
        expect(data.isTyping).toBe(true);
        done();
      });

      setTimeout(() => {
        client1.emit('typing', { conversationId, isTyping: true });
      }, 200);
    }, 10000);

    it('should handle read receipts', (done) => {
      const messageIds = ['673762f5e85740f6248f2804', '673762f5e85740f6248f2805'];

      // Both clients join
      client1.emit('join_conversation', { conversationId });
      client2.emit('join_conversation', { conversationId });

      client1.on('message_read_update', (data) => {
        expect(data.conversationId).toBe(conversationId);
        expect(data.userId).toBe(userId2);
        done();
      });

      setTimeout(() => {
        client2.emit('message_read', { conversationId, messageIds });
      }, 200);
    }, 10000);
  });

  describe('Presence', () => {
    it('should handle presence subscription', (done) => {
      // Test the presence_subscribe event instead
      client1.on('presence_update', (data) => {
        expect(data.userId).toBe(userId2);
        expect(data.online).toBeDefined();
        done();
      });

      // Subscribe to user2's presence
      client1.emit('presence_subscribe', { userId: userId2 });
    }, 5000);
  });

  describe('Error Handling', () => {
    it('should emit error for unauthorized conversation access', (done) => {
      const unauthorizedConversationId = '000000000000000000000000';

      client1.on('error', (data) => {
        expect(data.message).toContain('Conversation not found');
        done();
      });

      client1.emit('join_conversation', { conversationId: unauthorizedConversationId });
    });
  });
});
