import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminUsersService } from './admin-users.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { AdminRole } from '../../schemas/admin-user.schema';

@ApiTags('Admin Users')
@Controller('users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Post('login')
  @ApiOperation({ summary: 'Admin login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.adminUsersService.login(loginDto, ip, userAgent);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Req() req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await this.adminUsersService.logout(token);
    }
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current admin user' })
  @ApiResponse({ status: 200, description: 'Returns current admin user' })
  getMe(@CurrentAdmin() admin: any) {
    return this.adminUsersService.findOne(admin.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPERADMIN)
  @UseInterceptors(AuditInterceptor)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new admin user' })
  @ApiResponse({ status: 201, description: 'Admin user created successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  create(@Body() createDto: CreateAdminUserDto) {
    return this.adminUsersService.create(createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all admin users' })
  @ApiResponse({ status: 200, description: 'Returns paginated admin users' })
  findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.adminUsersService.findAll(page, limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin user by ID' })
  @ApiResponse({ status: 200, description: 'Returns admin user details' })
  @ApiResponse({ status: 404, description: 'Admin user not found' })
  findOne(@Param('id') id: string) {
    return this.adminUsersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPERADMIN)
  @UseInterceptors(AuditInterceptor)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update admin user' })
  @ApiResponse({ status: 200, description: 'Admin user updated successfully' })
  @ApiResponse({ status: 404, description: 'Admin user not found' })
  update(@Param('id') id: string, @Body() updateDto: UpdateAdminUserDto) {
    return this.adminUsersService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPERADMIN)
  @UseInterceptors(AuditInterceptor)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete admin user' })
  @ApiResponse({ status: 200, description: 'Admin user deleted successfully' })
  @ApiResponse({ status: 404, description: 'Admin user not found' })
  async remove(@Param('id') id: string) {
    await this.adminUsersService.remove(id);
    return { message: 'Admin user deleted successfully' };
  }
}
