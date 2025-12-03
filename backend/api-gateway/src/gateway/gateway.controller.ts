import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  Req,
  UseGuards,
  Version,
} from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  // ==================== AUTH ROUTES ====================

  @Public()
  @Post('auth/signup')
  @Version('1')
  async signup(@Body() body: any) {
    return this.gatewayService.forwardToAuth('/auth/signup', 'POST', body);
  }

  @Public()
  @Post('auth/register')
  @Version('1')
  async register(@Body() body: any) {
    return this.gatewayService.forwardToAuth('/auth/register', 'POST', body);
  }

  @Public()
  @Post('auth/login')
  @Version('1')
  async login(@Body() body: any) {
    return this.gatewayService.forwardToAuth('/auth/login', 'POST', body);
  }

  @Public()
  @Post('auth/refresh')
  @Version('1')
  async refreshToken(@Body() body: any) {
    return this.gatewayService.forwardToAuth('/auth/refresh', 'POST', body);
  }

  @Post('auth/logout')
  @Version('1')
  async logout(@Body() body: any, @Headers('authorization') auth: string) {
    return this.gatewayService.forwardToAuth(
      '/auth/logout',
      'POST',
      body,
      auth,
    );
  }

  @Post('auth/forgot-password')
  @Version('1')
  @Public()
  async forgotPassword(@Body() body: any) {
    return this.gatewayService.forwardToAuth(
      '/auth/forgot-password',
      'POST',
      body,
    );
  }

  @Post('auth/reset-password')
  @Version('1')
  @Public()
  async resetPassword(@Body() body: any) {
    return this.gatewayService.forwardToAuth(
      '/auth/reset-password',
      'POST',
      body,
    );
  }

  // ==================== USER ROUTES ====================

  @Get('users/me')
  @Version('1')
  async getCurrentUser(@Headers('authorization') auth: string) {
    return this.gatewayService.forwardToAuth('/users/me', 'GET', null, auth);
  }

  @Get('users/:id')
  @Version('1')
  async getUserById(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToAuth(`/users/${id}`, 'GET', null, auth);
  }

  @Put('users/me')
  @Version('1')
  async updateCurrentUser(
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToAuth('/users/me', 'PUT', body, auth);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('users')
  @Version('1')
  async getAllUsers(
    @Query() query: any,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToAuth('/users', 'GET', null, auth);
  }

  // ==================== PROPERTY ROUTES ====================

  @Public()
  @Get('properties')
  @Version('1')
  async getProperties(@Query() query: any) {
    const queryString = new URLSearchParams(query).toString();
    const url = `/properties${queryString ? `?${queryString}` : ''}`;
    return this.gatewayService.forwardToProperty(url, 'GET');
  }

  @Public()
  @Get('properties/:id')
  @Version('1')
  async getPropertyById(@Param('id') id: string) {
    return this.gatewayService.forwardToProperty(`/properties/${id}`, 'GET');
  }

  @Post('properties')
  @Version('1')
  async createProperty(
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToProperty(
      '/properties',
      'POST',
      body,
      auth,
    );
  }

  @Put('properties/:id')
  @Version('1')
  async updateProperty(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToProperty(
      `/properties/${id}`,
      'PUT',
      body,
      auth,
    );
  }

  @Delete('properties/:id')
  @Version('1')
  async deleteProperty(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToProperty(
      `/properties/${id}`,
      'DELETE',
      null,
      auth,
    );
  }

  @Get('properties/owner/my-properties')
  @Version('1')
  async getMyProperties(@Headers('authorization') auth: string) {
    return this.gatewayService.forwardToProperty(
      '/properties/owner/my-properties',
      'GET',
      null,
      auth,
    );
  }

  // ==================== FAVORITE ROUTES ====================

  @Get('favorites/ids')
  @Version('1')
  async getFavoriteIds(@Headers('authorization') auth: string) {
    return this.gatewayService.forwardToFavorite('/api/v1/favorites/ids', 'GET', null, auth);
  }

  @Get('favorites')
  @Version('1')
  async getFavorites(@Headers('authorization') auth: string) {
    return this.gatewayService.forwardToFavorite('/api/v1/favorites', 'GET', null, auth);
  }

  @Post('favorites/sync')
  @Version('1')
  async syncFavorites(
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToFavorite(
      '/api/v1/favorites/sync',
      'POST',
      body,
      auth,
    );
  }

  @Get('favorites/check/:propertyId')
  @Version('1')
  async checkFavorite(
    @Param('propertyId') propertyId: string,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToFavorite(
      `/api/v1/favorites/check/${propertyId}`,
      'GET',
      null,
      auth,
    );
  }

  @Post('favorites')
  @Version('1')
  async addFavorite(
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToFavorite(
      '/api/v1/favorites',
      'POST',
      body,
      auth,
    );
  }

  @Delete('favorites/:propertyId')
  @Version('1')
  async removeFavorite(
    @Param('propertyId') propertyId: string,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToFavorite(
      `/api/v1/favorites/${propertyId}`,
      'DELETE',
      null,
      auth,
    );
  }

  // ==================== CHAT ROUTES ====================

  @Get('chat/conversations')
  @Version('1')
  async getConversations(@Headers('authorization') auth: string) {
    return this.gatewayService.forwardToChat(
      '/conversations',
      'GET',
      null,
      auth,
    );
  }

  @Post('chat/conversations')
  @Version('1')
  async createConversation(
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToChat(
      '/conversations',
      'POST',
      body,
      auth,
    );
  }

  @Get('chat/conversations/:id/messages')
  @Version('1')
  async getMessages(
    @Param('id') id: string,
    @Query() query: any,
    @Headers('authorization') auth: string,
  ) {
    const queryString = new URLSearchParams(query).toString();
    const url = `/conversations/${id}/messages${queryString ? `?${queryString}` : ''}`;
    return this.gatewayService.forwardToChat(url, 'GET', null, auth);
  }

  @Post('chat/send')
  @Version('1')
  async sendMessage(
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToChat('/messages/send', 'POST', body, auth);
  }

  @Post('chat/conversations/:id/delete')
  @Version('1')
  async deleteConversation(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToChat(
      `/conversations/${id}/delete`,
      'POST',
      null,
      auth,
    );
  }

  @Post('chat/conversations/:id/mute')
  @Version('1')
  async muteConversation(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToChat(
      `/conversations/${id}/mute`,
      'POST',
      null,
      auth,
    );
  }

  @Post('chat/conversations/:id/unmute')
  @Version('1')
  async unmuteConversation(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToChat(
      `/conversations/${id}/unmute`,
      'POST',
      null,
      auth,
    );
  }

  @Post('chat/conversations/:id/block')
  @Version('1')
  async blockUser(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToChat(
      `/conversations/${id}/block`,
      'POST',
      null,
      auth,
    );
  }

  @Post('chat/conversations/:id/unblock')
  @Version('1')
  async unblockUser(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToChat(
      `/conversations/${id}/unblock`,
      'POST',
      null,
      auth,
    );
  }

  @Post('chat/conversations/:id/mark-read')
  @Version('1')
  async markConversationRead(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToChat(
      `/conversations/${id}/mark-read`,
      'POST',
      null,
      auth,
    );
  }

  @Put('chat/messages/:messageId')
  @Version('1')
  async editMessage(
    @Param('messageId') messageId: string,
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToChat(
      `/messages/${messageId}`,
      'PUT',
      body,
      auth,
    );
  }

  // ==================== NOTIFICATION ROUTES ====================

  @Get('notifications')
  @Version('1')
  async getNotifications(
    @Query() query: any,
    @Headers('authorization') auth: string,
  ) {
    const queryString = new URLSearchParams(query).toString();
    const url = `/notifications${queryString ? `?${queryString}` : ''}`;
    return this.gatewayService.forwardToNotification(url, 'GET', null, auth);
  }

  @Put('notifications/:id/read')
  @Version('1')
  async markAsRead(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToNotification(
      `/notifications/${id}/read`,
      'PUT',
      null,
      auth,
    );
  }

  @Delete('notifications/:id')
  @Version('1')
  async deleteNotification(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToNotification(
      `/notifications/${id}`,
      'DELETE',
      null,
      auth,
    );
  }

  // ==================== BILLING ROUTES ====================

  @Get('billing/subscriptions/:userId')
  @Version('1')
  async getSubscription(
    @Param('userId') userId: string,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToBilling(
      `/billing/subscriptions/${userId}`,
      'GET',
      null,
      auth,
    );
  }

  @Get('billing/payments/user/:userId')
  @Version('1')
  async getUserPayments(
    @Param('userId') userId: string,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToBilling(
      `/billing/payments/user/${userId}`,
      'GET',
      null,
      auth,
    );
  }

  @Get('billing/credits/:userId')
  @Version('1')
  async getUserCredits(
    @Param('userId') userId: string,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToBilling(
      `/billing/subscriptions/credits/${userId}`,
      'GET',
      null,
      auth,
    );
  }

  @Post('billing/deduct')
  @Version('1')
  async deductCredit(
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToBilling(
      `/billing/subscriptions/deduct`,
      'POST',
      body,
      auth,
    );
  }

  @Post('billing/create-payment-session')
  @Version('1')
  async createPaymentSession(
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    return this.gatewayService.forwardToBilling(
      `/billing/payments/create-session`,
      'POST',
      body,
      auth,
    );
  }

  // ==================== HEALTH CHECK ====================

  @Public()
  @Get('health')
  async healthCheck() {
    return {
      success: true,
      message: 'API Gateway is healthy',
      timestamp: new Date().toISOString(),
      services: await this.gatewayService.checkServicesHealth(),
    };
  }
}
