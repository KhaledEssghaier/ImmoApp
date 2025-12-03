import { Controller, Get, Post, Put, UseGuards, Req, Param, NotFoundException, Query, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UsersService } from '../services/users.service';
import { UpdateProfileDto, ChangePasswordDto } from '../dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req) {
    return this.usersService.findById(req.user.userId);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    console.log('PUT /users/me called', updateProfileDto);
    return this.usersService.updateProfile(req.user.userId, updateProfileDto);
  }

  @Post('me/change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Req() req, @Body() changePasswordDto: ChangePasswordDto) {
    console.log('POST /users/me/change-password called');
    return this.usersService.changePassword(req.user.userId, changePasswordDto);
  }

  @Get('banned')
  async getBannedUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    console.log('GET /users/banned called');
    return this.usersService.getBannedUsers(page, limit);
  }

  @Post(':id/ban')
  async banUser(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Body('durationDays') durationDays?: number,
  ) {
    console.log(`POST /users/${id}/ban called with reason: ${reason}, duration: ${durationDays}`);
    return this.usersService.banUser(id, reason, durationDays);
  }

  @Post(':id/unban')
  async unbanUser(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    console.log(`POST /users/${id}/unban called`);
    return this.usersService.unbanUser(id, reason);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    console.log(`GET /users/${id} called`);
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
