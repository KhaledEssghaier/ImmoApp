import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getModelToken } from '@nestjs/mongoose';
import { Notification } from './schemas/notification.schema';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bull';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockNotificationModel: any;
  let mockQueue: any;

  beforeEach(async () => {
    mockNotificationModel = {
      constructor: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn(),
      updateMany: jest.fn(),
      save: jest.fn(),
    };

    mockQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getModelToken(Notification.name),
          useValue: mockNotificationModel,
        },
        {
          provide: getQueueToken('notifications'),
          useValue: mockQueue,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'NOTIF_DEFAULT_TTL_DAYS') return 30;
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification and enqueue push job', async () => {
      const createDto = {
        userId: '507f1f77bcf86cd799439011',
        type: 'message' as any,
        title: 'New Message',
        message: 'You have a new message',
        channel: ['push' as any, 'inapp' as any],
      };

      const mockSave = jest.fn().mockResolvedValue({
        _id: 'notif123',
        ...createDto,
      });

      mockNotificationModel.constructor.mockImplementation(() => ({
        save: mockSave,
      }));

      // Mock the model constructor to return an object with save method
      jest.spyOn(mockNotificationModel, 'constructor').mockImplementation(() => ({
        save: mockSave,
      }));

      // Since we can't easily test the actual save, we'll verify the queue was called
      await service.create(createDto);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-push',
        expect.objectContaining({
          userId: createDto.userId,
          title: createDto.title,
          message: createDto.message,
        }),
        expect.any(Object),
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count for user', async () => {
      mockNotificationModel.countDocuments.mockResolvedValue(5);

      const result = await service.getUnreadCount('507f1f77bcf86cd799439011');

      expect(result).toEqual({ count: 5 });
      expect(mockNotificationModel.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          read: false,
          isDeleted: false,
        }),
      );
    });
  });
});
