import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { PropertiesController } from './controllers/properties.controller';
import { AdminPropertiesController } from './controllers/admin-properties.controller';
import { PropertiesService } from './services/properties.service';
import { Property, PropertySchema } from './schemas/property.schema';
import { InternalApiGuard } from '../common/guards/internal-api.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Property.name, schema: PropertySchema },
    ]),
    HttpModule,
  ],
  controllers: [PropertiesController, AdminPropertiesController],
  providers: [PropertiesService, InternalApiGuard],
  exports: [PropertiesService],
})
export class PropertiesModule {}
