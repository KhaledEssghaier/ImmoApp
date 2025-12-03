import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MessagesService } from './messages.service';
import { ConversationsService } from '../conversations/conversations.service';
import { Message } from './schemas/message.schema';
import { ConfigService } from '@nestjs/config';

describe('MessagesService', () => {
  let service: MessagesService;
  let mockMessageModel: any;
  let mockConversationsService: any;

  beforeEach(async () => {
    mockMessageModel = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
      updateMany: jest.fn(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    mockConversationsService = {
      isParticipant: jest.fn(),
      updateLastMessage: jest.fn(),
      incrementUnreadCount: jest.fn(),
      resetUnreadCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getModelToken(Message.name),
          useValue: mockMessageModel,
        },
        {
          provide: ConversationsService,
          useValue: mockConversationsService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === 'MESSAGE_EDIT_WINDOW_MINUTES') return 15;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  describe('sendMessage', () => {
    it('should create and save a message', async () => {
      const senderId = '673762f5e85740f6248f2801';
      const conversationId = '673762f5e85740f6248f2803';
      const messageDto = {
        conversationId,
        text: 'Test message',
        attachments: [],
      };

      mockConversationsService.isParticipant.mockResolvedValue(true);
      mockMessageModel.create.mockResolvedValue({
        _id: '673762f5e85740f6248f2804',
        ...messageDto,
        senderId,
        createdAt: new Date(),
        toObject: () => ({ ...messageDto, senderId }),
      });

      const result = await service.sendMessage(messageDto, senderId);

      expect(mockConversationsService.isParticipant).toHaveBeenCalledWith(conversationId, senderId);
      expect(mockMessageModel.create).toHaveBeenCalled();
      expect(mockConversationsService.updateLastMessage).toHaveBeenCalled();
      expect(mockConversationsService.incrementUnreadCount).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not participant', async () => {
      mockConversationsService.isParticipant.mockResolvedValue(false);

      await expect(
        service.sendMessage(
          {
            conversationId: '673762f5e85740f6248f2803',
            text: 'Test',
            attachments: [],
          },
          '673762f5e85740f6248f2801',
        ),
      ).rejects.toThrow('You are not a participant in this conversation');
    });
  });

  describe('markMessagesRead', () => {
    it('should mark messages as read and reset unread count', async () => {
      const conversationId = '673762f5e85740f6248f2803';
      const messageIds = ['673762f5e85740f6248f2804', '673762f5e85740f6248f2805'];
      const userId = '673762f5e85740f6248f2801';

      mockMessageModel.updateMany.mockResolvedValue({ modifiedCount: 2 });

      await service.markMessagesRead(conversationId, messageIds, userId);

      expect(mockMessageModel.updateMany).toHaveBeenCalled();
      expect(mockConversationsService.resetUnreadCount).toHaveBeenCalledWith(conversationId, userId);
    });
  });
});
