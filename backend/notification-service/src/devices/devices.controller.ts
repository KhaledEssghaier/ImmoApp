import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('devices')
@UseGuards(AuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @CurrentUser() user: any,
    @Body() registerDeviceDto: RegisterDeviceDto,
  ) {
    const userId = user.userId || user.sub;
    return this.devicesService.register(userId, registerDeviceDto);
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    const userId = user.userId || user.sub;
    return this.devicesService.findByUserId(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const userId = user.userId || user.sub;
    return this.devicesService.remove(id, userId);
  }

  @Delete('token/:token')
  @HttpCode(HttpStatus.OK)
  async removeByToken(@Param('token') token: string, @CurrentUser() user: any) {
    const userId = user.userId || user.sub;
    return this.devicesService.removeByToken(token, userId);
  }
}
