import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Device, DeviceDocument } from './schemas/device.schema';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    @InjectModel(Device.name)
    private deviceModel: Model<DeviceDocument>,
  ) {}

  async register(userId: string, registerDeviceDto: RegisterDeviceDto) {
    try {
      // Check if device already exists
      const existing = await this.deviceModel.findOne({
        deviceToken: registerDeviceDto.deviceToken,
      });

      if (existing) {
        // Update user if different, refresh lastSeenAt
        existing.userId = new Types.ObjectId(userId);
        existing.platform = registerDeviceDto.platform;
        existing.lastSeenAt = new Date();
        existing.isInvalid = false;
        await existing.save();
        this.logger.log(`Device token updated for user ${userId}`);
        return existing;
      }

      // Create new device
      const device = new this.deviceModel({
        userId: new Types.ObjectId(userId),
        deviceToken: registerDeviceDto.deviceToken,
        platform: registerDeviceDto.platform,
        createdAt: new Date(),
        lastSeenAt: new Date(),
      });

      const saved = await device.save();
      this.logger.log(`New device registered for user ${userId}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to register device: ${error.message}`);
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<DeviceDocument[]> {
    return this.deviceModel
      .find({
        userId: new Types.ObjectId(userId),
        isInvalid: false,
      })
      .exec();
  }

  async findByToken(token: string): Promise<DeviceDocument | null> {
    return this.deviceModel.findOne({ deviceToken: token }).exec();
  }

  async remove(id: string, userId: string) {
    const device = await this.deviceModel.findById(id);

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (device.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await device.deleteOne();
    this.logger.log(`Device ${id} removed for user ${userId}`);
    return { message: 'Device removed' };
  }

  async removeByToken(token: string, userId: string) {
    const device = await this.deviceModel.findOne({ deviceToken: token });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (device.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await device.deleteOne();
    this.logger.log(`Device token removed for user ${userId}`);
    return { message: 'Device removed' };
  }

  async removeInvalidTokens(tokens: string[]) {
    const result = await this.deviceModel.updateMany(
      { deviceToken: { $in: tokens } },
      { $set: { isInvalid: true } },
    );

    this.logger.warn(`Marked ${result.modifiedCount} tokens as invalid`);
    return result;
  }

  async updateLastSeen(token: string) {
    await this.deviceModel.updateOne(
      { deviceToken: token },
      { $set: { lastSeenAt: new Date() } },
    );
  }
}
