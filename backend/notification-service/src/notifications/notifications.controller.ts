import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  BulkCreateNotificationDto,
} from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { InternalApiGuard } from '../common/guards/internal-api.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Internal API - Create notification(s)
  @Post()
  @UseGuards(InternalApiGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Post('bulk')
  @UseGuards(InternalApiGuard)
  @HttpCode(HttpStatus.CREATED)
  async createBulk(@Body() bulkCreateDto: BulkCreateNotificationDto) {
    return this.notificationsService.createBulk(bulkCreateDto.notifications);
  }

  // User API - List notifications
  @Get()
  @UseGuards(AuthGuard)
  async findAll(
    @CurrentUser() user: any,
    @Query() query: QueryNotificationsDto,
  ) {
    // Override userId with authenticated user
    query.userId = user.userId || user.sub;
    return this.notificationsService.findAll(query);
  }

  // User API - Get unread count
  @Get('unread-count')
  @UseGuards(AuthGuard)
  async getUnreadCount(@CurrentUser() user: any) {
    const userId = user.userId || user.sub;
    return this.notificationsService.getUnreadCount(userId);
  }

  // User API - Mark as read
  @Post(':id/read')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    const userId = user.userId || user.sub;
    return this.notificationsService.markAsRead(id, userId);
  }

  // User API - Mark all as read
  @Post('mark-all-read')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUser() user: any) {
    const userId = user.userId || user.sub;
    return this.notificationsService.markAllAsRead(userId);
  }

  // User API - Soft delete
  @Post(':id/delete')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async softDelete(@Param('id') id: string, @CurrentUser() user: any) {
    const userId = user.userId || user.sub;
    return this.notificationsService.softDelete(id, userId);
  }
}
