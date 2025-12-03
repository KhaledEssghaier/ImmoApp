import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { PropertiesService } from '../services/properties.service';
import { CreatePropertyDto } from '../dtos/create-property.dto';
import { UpdatePropertyDto } from '../dtos/update-property.dto';
import { FilterPropertyDto } from '../dtos/filter-property.dto';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createPropertyDto: CreatePropertyDto, @Request() req) {
    return this.propertiesService.create(createPropertyDto, req.user.userId);
  }

  @Get()
  async findAll(@Query(ValidationPipe) filters: FilterPropertyDto) {
    return this.propertiesService.findAll(filters);
  }

  @Get('owner/my-properties')
  @UseGuards(JwtAuthGuard)
  async getMyProperties(@Request() req) {
    return this.propertiesService.findByOwnerId(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Request() req,
  ) {
    console.log(`[PropertyController] Received update request for property: ${id}`);
    console.log(`[PropertyController] User ID: ${req.user.userId}`);
    console.log(`[PropertyController] Update data keys:`, Object.keys(updatePropertyDto));
    console.log(`[PropertyController] Has images: ${updatePropertyDto.images !== undefined}`);
    if (updatePropertyDto.images) {
      console.log(`[PropertyController] Images count: ${updatePropertyDto.images.length}`);
      if (updatePropertyDto.images.length > 0) {
        console.log(`[PropertyController] First image length: ${updatePropertyDto.images[0].length} chars`);
      }
    }
    
    return this.propertiesService.update(
      id,
      updatePropertyDto,
      req.user.userId,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Request() req) {
    await this.propertiesService.remove(id, req.user.userId);
    return { message: 'Property deleted successfully' };
  }
}
