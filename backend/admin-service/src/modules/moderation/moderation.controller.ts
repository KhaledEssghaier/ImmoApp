import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { BanUserDto } from './dto/ban-user.dto';
import { RemovePropertyDto } from './dto/remove-property.dto';
import { WarningDto } from './dto/warning.dto';
import { RestoreDto } from './dto/restore.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { AdminRole } from '../../schemas/admin-user.schema';

@ApiTags('Moderation')
@ApiBearerAuth()
@Controller('actions')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('ban-user')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Ban a user' })
  @ApiResponse({ status: 201, description: 'User banned successfully' })
  @ApiResponse({ status: 400, description: 'Failed to ban user' })
  banUser(@Body() banUserDto: BanUserDto, @CurrentAdmin() admin: any) {
    return this.moderationService.banUser(banUserDto, admin.sub);
  }

  @Post('unban-user/:userId')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Unban a user' })
  @ApiResponse({ status: 201, description: 'User unbanned successfully' })
  unbanUser(
    @Param('userId') userId: string,
    @Body('reason') reason: string,
    @CurrentAdmin() admin: any,
  ) {
    return this.moderationService.unbanUser(userId, reason, admin.sub);
  }

  @Post('remove-property')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Remove a property' })
  @ApiResponse({ status: 201, description: 'Property removed successfully' })
  @ApiResponse({ status: 400, description: 'Failed to remove property' })
  removeProperty(@Body() removePropertyDto: RemovePropertyDto, @CurrentAdmin() admin: any) {
    return this.moderationService.removeProperty(removePropertyDto, admin.sub);
  }

  @Post('restore-property/:propertyId')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Restore a removed property' })
  @ApiResponse({ status: 201, description: 'Property restored successfully' })
  restoreProperty(
    @Param('propertyId') propertyId: string,
    @Body('reason') reason: string,
    @CurrentAdmin() admin: any,
  ) {
    return this.moderationService.restoreProperty(propertyId, reason, admin.sub);
  }

  @Post('warning')
  @Roles(AdminRole.MODERATOR, AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Issue a warning' })
  @ApiResponse({ status: 201, description: 'Warning issued successfully' })
  issueWarning(@Body() warningDto: WarningDto, @CurrentAdmin() admin: any) {
    return this.moderationService.issueWarning(warningDto, admin.sub);
  }

  @Get('banned-users')
  @Roles(AdminRole.MODERATOR, AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get all banned users' })
  @ApiResponse({ status: 200, description: 'Returns list of banned users' })
  getBannedUsers(@Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.moderationService.getBannedUsers(page, limit);
  }

  @Get()
  @Roles(AdminRole.MODERATOR, AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get all moderation actions' })
  @ApiResponse({ status: 200, description: 'Returns paginated moderation actions' })
  findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.moderationService.findAll(page, limit);
  }

  @Get(':id')
  @Roles(AdminRole.MODERATOR, AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get moderation action by ID' })
  @ApiResponse({ status: 200, description: 'Returns action details' })
  @ApiResponse({ status: 404, description: 'Action not found' })
  findOne(@Param('id') id: string) {
    return this.moderationService.findOne(id);
  }
}
