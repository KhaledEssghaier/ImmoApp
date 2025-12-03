import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';

describe('EventsService', () => {
  let service: EventsService;
  let mockNotificationsService: any;

  beforeEach(async () => {
    mockNotificationsService = {
      create: jest.fn(),
      createBulk: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'REDIS_URL') return 'redis://localhost:6379';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleChatMessage', () => {
    it('should create notifications for participants', async () => {
      const event = {
        conversationId: 'conv123',
        messageId: 'msg123',
        senderId: 'user1',
        senderName: 'John Doe',
        participantIds: ['user1', 'user2', 'user3'],
        text: 'Hello everyone!',
      };

      // Call the private method indirectly by publishing to the service
      // In a real integration test, we'd publish to Redis
      await service['handleChatMessage'](event);

      expect(mockNotificationsService.create).toHaveBeenCalledTimes(2); // user2 and user3
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user2',
          actorId: 'user1',
          type: 'message',
          title: 'New message from John Doe',
        }),
      );
    });
  });
});
