import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { DeductCreditDto } from '../../dto/deduct-credit.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get(':userId')
  getSubscriptionStatus(@Param('userId') userId: string) {
    return this.subscriptionsService.getSubscriptionStatus(userId);
  }

  @Get('history/:userId')
  getUserSubscriptions(@Param('userId') userId: string) {
    return this.subscriptionsService.getUserSubscriptions(userId);
  }

  @Get('credits/:userId')
  async getUserCredits(@Param('userId') userId: string) {
    const credits = await this.subscriptionsService.getUserCredits(userId);
    return { credits };
  }

  @Post('deduct')
  deductCredit(@Body() dto: DeductCreditDto) {
    return this.subscriptionsService.deductCredit(dto.userId, dto.propertyId);
  }
}
