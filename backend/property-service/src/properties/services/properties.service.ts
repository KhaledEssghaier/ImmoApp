import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Property, PropertyDocument } from '../schemas/property.schema';
import { CreatePropertyDto } from '../dtos/create-property.dto';
import { UpdatePropertyDto } from '../dtos/update-property.dto';
import { FilterPropertyDto } from '../dtos/filter-property.dto';

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    @InjectModel(Property.name)
    private propertyModel: Model<PropertyDocument>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async create(
    createPropertyDto: CreatePropertyDto,
    ownerId: string,
  ): Promise<PropertyDocument> {
    // Deduct credit before creating property
    try {
      const billingServiceUrl = this.configService.get<string>('services.billing.url') || 'http://localhost:3012';
      
      this.logger.log(`Deducting credit for user: ${ownerId}`);
      
      const response = await firstValueFrom(
        this.httpService.post<{ success: boolean; remainingCredits: number }>(
          `${billingServiceUrl}/billing/subscriptions/deduct`,
          {
            userId: ownerId,
            propertyId: null, // Will be updated after property creation
          },
          { timeout: 5000 }
        )
      );

      if (!response.data.success) {
        throw new BadRequestException('Failed to deduct credit');
      }

      this.logger.log(`Credit deducted. Remaining: ${response.data.remainingCredits}`);
    } catch (error) {
      if (error.response?.status === 400) {
        throw new BadRequestException(
          error.response.data.message || 'No active subscription or insufficient credits'
        );
      }
      this.logger.error(`Credit deduction failed: ${error.message}`);
      throw new BadRequestException('Failed to deduct credit. Please check your subscription.');
    }

    // Create property after successful credit deduction
    const property = new this.propertyModel({
      ...createPropertyDto,
      ownerId: new Types.ObjectId(ownerId),
      location: {
        type: 'Point',
        coordinates: [
          createPropertyDto.location.longitude,
          createPropertyDto.location.latitude,
        ],
      },
      mediaIds: createPropertyDto.mediaIds?.map((id) => new Types.ObjectId(id)) || [],
      images: createPropertyDto.images || [],
    });

    const savedProperty = await property.save();
    this.logger.log(`Property created: ${savedProperty._id}`);
    
    return savedProperty;
  }

  async findAll(filters: FilterPropertyDto): Promise<{
    properties: PropertyDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: any = { 
      isDeleted: false,
    };

    // Filter by status - default to 'available' or null (for legacy properties without status)
    if (filters.status) {
      query.status = filters.status;
    } else {
      // Show available properties AND properties without status field (legacy data)
      query.$or = [
        { status: 'available' },
        { status: { $exists: false } },
        { status: null }
      ];
    }

    // Apply filters
    if (filters.city) {
      query['address.city'] = new RegExp(filters.city, 'i');
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
    }

    if (filters.propertyType) {
      query.propertyType = filters.propertyType;
    }

    if (filters.transactionType) {
      query.transactionType = filters.transactionType;
    }

    if (filters.bedrooms !== undefined) {
      query.bedrooms = filters.bedrooms;
    }

    if (filters.ownerId) {
      query.ownerId = new Types.ObjectId(filters.ownerId);
    }

    // Geo search
    if (filters.longitude !== undefined && filters.latitude !== undefined) {
      const maxDistance = filters.radius || 5000; // default 5km
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [filters.longitude, filters.latitude],
          },
          $maxDistance: maxDistance,
        },
      };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      this.propertyModel.find(query).skip(skip).limit(limit).lean().exec(),
      this.propertyModel.countDocuments(query).exec(),
    ]);

    // Transform location format for frontend
    const transformedProperties = properties.map((prop: any) => {
      if (prop.location) {
        prop.location = {
          longitude: prop.location.coordinates[0],
          latitude: prop.location.coordinates[1],
        };
      }
      return prop;
    });

    return {
      properties: transformedProperties,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid property ID');
    }

    const property = await this.propertyModel
      .findOne({ _id: id, isDeleted: false })
      .lean()
      .exec();

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Transform location format for frontend
    const obj: any = property;
    if (obj.location) {
      obj.location = {
        longitude: obj.location.coordinates[0],
        latitude: obj.location.coordinates[1],
      };
    }

    return obj;
  }

  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto,
    userId: string,
  ): Promise<PropertyDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid property ID');
    }

    const property = await this.propertyModel
      .findOne({ _id: id, isDeleted: false })
      .lean()
      .exec();

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Check ownership
    const propertyOwnerId = property.ownerId.toString();
    this.logger.log(`Update check - Property owner: ${propertyOwnerId}, User: ${userId}`);
    
    if (propertyOwnerId !== userId) {
      throw new ForbiddenException('You can only update your own properties');
    }

    const updateData: any = { ...updatePropertyDto };

    // Handle location update
    if (updatePropertyDto.location) {
      updateData.location = {
        type: 'Point',
        coordinates: [
          updatePropertyDto.location.longitude,
          updatePropertyDto.location.latitude,
        ],
      };
    }

    // Handle mediaIds update
    if (updatePropertyDto.mediaIds) {
      updateData.mediaIds = updatePropertyDto.mediaIds.map(
        (id) => new Types.ObjectId(id),
      );
    }

    // Log update info (without full image data to avoid console overflow)
    const updateInfo = {
      ...updateData,
      images: updateData.images ? `[${updateData.images.length} images]` : undefined,
    };
    this.logger.log(`Updating property ${id} with data:`, JSON.stringify(updateInfo));
    this.logger.log(`Update data fields: ${Object.keys(updateData).join(', ')}`);
    
    if (updateData.images) {
      this.logger.log(`Updating ${updateData.images.length} images for property ${id}`);
      updateData.images.forEach((img: string, idx: number) => {
        this.logger.log(`  Image ${idx + 1}: ${img.length} characters`);
      });
    }
    
    // Log specific important fields
    if (updateData.title) this.logger.log(`  Title: ${updateData.title}`);
    if (updateData.price !== undefined) this.logger.log(`  Price: ${updateData.price}`);
    if (updateData.description) this.logger.log(`  Description length: ${updateData.description.length}`);

    this.logger.log(`Executing findByIdAndUpdate for property ${id}`);
    const updated = await this.propertyModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: false })
      .exec();

    if (!updated) {
      this.logger.error(`Failed to update property ${id} - document not found after update`);
      throw new NotFoundException('Failed to update property');
    }

    this.logger.log(`Property ${id} updated successfully`);
    this.logger.log(`Updated property has ${updated.images?.length || 0} images in database`);
    this.logger.log(`Updated property title: ${updated.title}`);
    this.logger.log(`Updated property price: ${updated.price}`);

    // Transform location format for frontend
    const result: any = updated.toObject();
    if (result.location) {
      result.location = {
        longitude: result.location.coordinates[0],
        latitude: result.location.coordinates[1],
      };
    }

    return result;
  }

  async remove(id: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid property ID');
    }

    const property = await this.propertyModel
      .findOne({ _id: id, isDeleted: false })
      .lean()
      .exec();

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Check ownership
    const propertyOwnerId = property.ownerId.toString();
    this.logger.log(`Delete check - Property owner: ${propertyOwnerId}, User: ${userId}`);
    
    if (propertyOwnerId !== userId) {
      throw new ForbiddenException('You can only delete your own properties');
    }

    // Soft delete - atomic operation
    const result = await this.propertyModel.updateOne(
      { _id: id },
      { $set: { isDeleted: true } },
    );

    if (result.modifiedCount === 0) {
      throw new NotFoundException('Failed to delete property');
    }

    this.logger.log(`Property ${id} deleted successfully`);
  }

  async findByOwnerId(ownerId: string): Promise<any[]> {
    const properties = await this.propertyModel
      .find({ ownerId: new Types.ObjectId(ownerId), isDeleted: false })
      .lean()
      .exec();

    // Transform location format for frontend
    return properties.map((prop: any) => {
      const obj: any = prop;
      if (obj.location) {
        obj.location = {
          longitude: obj.location.coordinates[0],
          latitude: obj.location.coordinates[1],
        };
      }
      return obj;
    });
  }

  // Admin methods - bypass ownership checks
  async adminSoftDelete(id: string, reason: string): Promise<{ ownerId: string; title: string }> {
    const property = await this.propertyModel.findById(id).lean().exec();
    
    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    // Soft delete without ownership check
    await this.propertyModel
      .findByIdAndUpdate(id, { 
        isDeleted: true,
        deletedAt: new Date(),
        deletionReason: reason,
      })
      .exec();

    // Return owner info for notification purposes
    return {
      ownerId: property.ownerId.toString(),
      title: property.title,
    };
  }

  async adminHardDelete(id: string): Promise<{ ownerId: string; title: string }> {
    const property = await this.propertyModel.findById(id).lean().exec();
    
    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    const propertyInfo = {
      ownerId: property.ownerId.toString(),
      title: property.title,
    };

    // Permanently delete
    await this.propertyModel.findByIdAndDelete(id).exec();

    return propertyInfo;
  }
}
