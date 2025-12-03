import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { MailService } from './mail.service';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private mailService: MailService,
  ) {}

  // Generate 6-digit code
  private generateResetCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ 
      email: email.toLowerCase(),
      isDeleted: false 
    });

    // Don't reveal if user exists for security
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return { 
        message: 'If an account exists with this email, a verification code has been sent.' 
      };
    }

    // Generate 6-digit code
    const resetCode = this.generateResetCode();
    
    // Hash code before storing
    const hashedCode = crypto
      .createHash('sha256')
      .update(resetCode)
      .digest('hex');

    // Store hashed code with 10 minute expiration
    user.passwordResetToken = hashedCode;
    user.passwordResetExpires = new Date(Date.now() + 600000); // 10 minutes
    await user.save();

    // Send email with the code
    try {
      await this.mailService.sendPasswordResetCode(user.email, user.fullName, resetCode);
      console.log(`Password reset code sent to: ${user.email}`);
    } catch (error) {
      console.error('Failed to send password reset code:', error);
      // Clear the token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw new BadRequestException('Failed to send verification code. Please try again later.');
    }

    return { 
      message: 'If an account exists with this email, a verification code has been sent.' 
    };
  }

  async verifyResetCode(email: string, code: string): Promise<{ valid: boolean; message: string }> {
    const user = await this.userModel.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    });

    if (!user) {
      return { valid: false, message: 'Invalid email or code' };
    }

    const hashedCode = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');

    if (user.passwordResetToken !== hashedCode) {
      return { valid: false, message: 'Invalid verification code' };
    }

    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return { valid: false, message: 'Verification code has expired' };
    }

    return { valid: true, message: 'Code verified successfully' };
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userModel.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    });

    if (!user) {
      throw new BadRequestException('Invalid email or code');
    }

    const hashedCode = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');

    if (user.passwordResetToken !== hashedCode) {
      throw new BadRequestException('Invalid verification code');
    }

    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Verification code has expired');
    }

    // Hash new password
    const saltRounds = 10;
    user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Clear reset token fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    await user.save();

    console.log(`Password reset successful for: ${user.email}`);

    return { message: 'Password has been reset successfully' };
  }
}
