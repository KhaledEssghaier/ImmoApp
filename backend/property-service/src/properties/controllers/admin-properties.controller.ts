import {
  Controller,
  Delete,
  Param,
  Body,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { PropertiesService } from '../services/properties.service';
import { InternalApiGuard } from '../../common/guards/internal-api.guard';

@Controller('admin/properties')
@UseGuards(InternalApiGuard)
export class AdminPropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Patch(':id/soft-delete')
  async softDelete(
    @Param('id') id: string,
    @Body() body: { reason: string; deletedBy?: string },
  ) {
    const propertyInfo = await this.propertiesService.adminSoftDelete(id, body.reason);
    return { 
      message: 'Property soft-deleted successfully',
      propertyId: id,
      ownerId: propertyInfo.ownerId,
      title: propertyInfo.title,
    };
  }

  @Delete(':id/hard-delete')
  async hardDelete(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    const propertyInfo = await this.propertiesService.adminHardDelete(id);
    return { 
      message: 'Property permanently deleted',
      propertyId: id,
      ownerId: propertyInfo.ownerId,
      title: propertyInfo.title,
    };
  }
}
