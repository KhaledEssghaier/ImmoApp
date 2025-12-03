import { Test, TestingModule } from '@nestjs/testing';
import { DevicesService } from './devices.service';
import { getModelToken } from '@nestjs/mongoose';
import { Device } from './schemas/device.schema';

describe('DevicesService', () => {
  let service: DevicesService;
  let mockDeviceModel: any;

  beforeEach(async () => {
    mockDeviceModel = {
      findOne: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn(),
      deleteOne: jest.fn(),
      constructor: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesService,
        {
          provide: getModelToken(Device.name),
          useValue: mockDeviceModel,
        },
      ],
    }).compile();

    service = module.get<DevicesService>(DevicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new device', async () => {
      const registerDto = {
        deviceToken: 'token123',
        platform: 'android' as any,
      };

      mockDeviceModel.findOne.mockResolvedValue(null);

      const mockSave = jest.fn().mockResolvedValue({
        _id: 'device123',
        userId: '507f1f77bcf86cd799439011',
        ...registerDto,
      });

      mockDeviceModel.constructor.mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await service.register('507f1f77bcf86cd799439011', registerDto);

      expect(mockDeviceModel.findOne).toHaveBeenCalledWith({
        deviceToken: registerDto.deviceToken,
      });
    });

    it('should update existing device', async () => {
      const registerDto = {
        deviceToken: 'token123',
        platform: 'android' as any,
      };

      const existingDevice = {
        _id: 'device123',
        userId: '507f1f77bcf86cd799439010',
        deviceToken: 'token123',
        platform: 'android',
        isInvalid: true,
        save: jest.fn().mockResolvedValue(true),
      };

      mockDeviceModel.findOne.mockResolvedValue(existingDevice);

      await service.register('507f1f77bcf86cd799439011', registerDto);

      expect(existingDevice.save).toHaveBeenCalled();
      expect(existingDevice.isInvalid).toBe(false);
    });
  });

  describe('removeInvalidTokens', () => {
    it('should mark tokens as invalid', async () => {
      const tokens = ['token1', 'token2', 'token3'];

      mockDeviceModel.updateMany.mockResolvedValue({ modifiedCount: 3 });

      const result = await service.removeInvalidTokens(tokens);

      expect(mockDeviceModel.updateMany).toHaveBeenCalledWith(
        { deviceToken: { $in: tokens } },
        { $set: { isInvalid: true } },
      );
      expect(result.modifiedCount).toBe(3);
    });
  });
});
