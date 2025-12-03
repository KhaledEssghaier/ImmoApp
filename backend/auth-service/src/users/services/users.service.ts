import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto, ChangePasswordDto } from '../dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findById(id: string): Promise<any> {
    const user = await this.userModel.findById(id).lean();
    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }
    // Transform _id to id for consistency
    const { _id, __v, passwordHash, ...userWithoutSensitive } = user as any;
    return {
      ...userWithoutSensitive,
      id: _id.toString(),
    };
  }

  async findByEmail(email: string): Promise<any | null> {
    return this.userModel.findOne({ email, isDeleted: false }).lean();
  }

  async getBannedUsers(page: number = 1, limit: number = 20): Promise<{ data: any[]; total: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.userModel
        .find({ 'ban.isBanned': true, isDeleted: false })
        .select('-password -refreshTokens')
        .sort({ 'ban.bannedAt': -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.userModel.countDocuments({ 'ban.isBanned': true, isDeleted: false }),
    ]);

    return { data, total };
  }

  async banUser(userId: string, reason: string, durationDays?: number): Promise<UserDocument> {
    console.log(`Attempting to ban user: ${userId}, reason: ${reason}, duration: ${durationDays}`);
    
    const user = await this.userModel.findById(userId);
    if (!user) {
      console.error(`User not found with ID: ${userId}`);
      throw new NotFoundException('User not found');
    }

    console.log(`User found: ${user.email}, currently banned: ${user.ban?.isBanned}`);

    const bannedAt = new Date();
    const expiresAt = durationDays 
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : undefined;

    user.ban = {
      isBanned: true,
      reason,
      bannedAt,
      expiresAt,
      isPermanent: !durationDays,
    };

    await user.save();
    console.log(`User ${user.email} banned successfully`);
    return user;
  }

  async unbanUser(userId: string, reason: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.ban = {
      isBanned: false,
      reason: `Unbanned: ${reason}`,
      bannedAt: user.ban?.bannedAt || new Date(),
      expiresAt: undefined,
      isPermanent: false,
    };

    await user.save();
    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<any> {
    console.log(`Updating profile for user: ${userId}`, updateProfileDto);

    const user = await this.userModel.findById(userId);
    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.userModel.findOne({
        email: updateProfileDto.email,
        isDeleted: false,
        _id: { $ne: userId },
      });
      if (existingUser) {
        throw new ConflictException('Email is already in use');
      }
      user.email = updateProfileDto.email;
    }

    // Update other fields
    if (updateProfileDto.fullName !== undefined) {
      user.fullName = updateProfileDto.fullName;
    }
    if (updateProfileDto.phone !== undefined) {
      user.phone = updateProfileDto.phone;
    }
    if (updateProfileDto.profileImage !== undefined) {
      user.profileImage = updateProfileDto.profileImage;
    }
    if (updateProfileDto.bio !== undefined) {
      user.bio = updateProfileDto.bio;
    }
    if (updateProfileDto.address !== undefined) {
      user.address = updateProfileDto.address;
    }

    await user.save();
    console.log(`Profile updated successfully for user: ${userId}`);

    // Return user without sensitive data
    const userObject = user.toObject();
    const { _id, __v, passwordHash, ...userWithoutSensitive } = userObject;
    return {
      ...userWithoutSensitive,
      id: (_id as any).toString(),
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    console.log(`Changing password for user: ${userId}`);

    const user = await this.userModel.findById(userId);
    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, saltRounds);
    user.passwordHash = newPasswordHash;

    await user.save();
    console.log(`Password changed successfully for user: ${userId}`);

    return { message: 'Password changed successfully' };
  }
}
