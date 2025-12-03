import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription, SubscriptionDocument } from '../../schemas/subscription.schema';
import { UserCredit, UserCreditDocument } from '../../schemas/user-credit.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(UserCredit.name) private userCreditModel: Model<UserCreditDocument>,
    private configService: ConfigService,
  ) {}

  async createSubscription(userId: string, paymentId: string): Promise<SubscriptionDocument> {
    try {
      const totalCredits = this.configService.get<number>('pricing.subscriptionCredits');
      const price = this.configService.get<number>('pricing.subscription');

      // Create subscription
      const subscription = new this.subscriptionModel({
        userId: new Types.ObjectId(userId),
        totalCredits,
        remainingCredits: totalCredits,
        price,
        paymentId,
        isActive: true,
      });

      await subscription.save();

      // Update user credits
      await this.addCreditsToUser(userId, totalCredits);

      this.logger.log(`Subscription created: ${subscription._id} for user: ${userId}`);

      return subscription;
    } catch (error) {
      this.logger.error(`Failed to create subscription: ${error.message}`);
      throw error;
    }
  }

  async getActiveSubscription(userId: string): Promise<any> {
    return this.subscriptionModel.findOne({
      userId: new Types.ObjectId(userId),
      isActive: true,
      remainingCredits: { $gt: 0 },
    }).lean().exec();
  }

  async getUserSubscriptions(userId: string): Promise<any[]> {
    return this.subscriptionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async deductCredit(userId: string, propertyId: string): Promise<{ success: boolean; remainingCredits: number }> {
    // Atomic update: decrement credits and deactivate if needed
    const result = await this.subscriptionModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        isActive: true,
        remainingCredits: { $gt: 0 },
      },
      [
        {
          $set: {
            remainingCredits: { $subtract: ['$remainingCredits', 1] },
            isActive: {
              $cond: {
                if: { $eq: [{ $subtract: ['$remainingCredits', 1] }, 0] },
                then: false,
                else: '$isActive',
              },
            },
          },
        },
      ],
      { new: true, lean: true },
    ).exec();

    if (!result) {
      throw new BadRequestException('No active subscription with available credits');
    }

    // Update user credits atomically
    await this.updateUserCredits(userId, -1);

    return {
      success: true,
      remainingCredits: result.remainingCredits,
    };
  }

  async getUserCredits(userId: string): Promise<number> {
    const userCredit = await this.userCreditModel.findOne({
      userId: new Types.ObjectId(userId),
    }).lean().exec();

    return userCredit?.credits || 0;
  }

  async getSubscriptionStatus(userId: string): Promise<{
    hasSubscription: boolean;
    remainingCredits: number;
    totalCredits: number;
    subscriptionId?: string;
  }> {
    const subscription = await this.getActiveSubscription(userId);
    const totalCredits = await this.getUserCredits(userId);

    if (!subscription) {
      return {
        hasSubscription: false,
        remainingCredits: 0,
        totalCredits,
      };
    }

    return {
      hasSubscription: true,
      remainingCredits: subscription.remainingCredits,
      totalCredits,
      subscriptionId: subscription._id.toString(),
    };
  }

  private async addCreditsToUser(userId: string, credits: number): Promise<void> {
    await this.userCreditModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $inc: { credits } },
      { upsert: true, new: true },
    );
  }

  private async updateUserCredits(userId: string, credits: number): Promise<void> {
    await this.userCreditModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $inc: { credits } },
      { upsert: true, new: true },
    );
  }
}
