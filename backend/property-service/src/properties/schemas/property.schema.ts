import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PropertyDocument = Property & Document;

@Schema({ timestamps: true })
export class Property {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, index: true })
  price: number;

  @Prop({
    required: true,
    enum: ['apartment', 'house', 'studio', 'land', 'office', 'villa', 'duplex'],
  })
  propertyType: string;

  @Prop({ required: true, enum: ['rent', 'sale'] })
  transactionType: string;

  @Prop({ default: 0 })
  bedrooms: number;

  @Prop({ default: 0 })
  bathrooms: number;

  @Prop({ required: true })
  surface: number;

  @Prop({ type: [String], default: [] })
  amenities: string[];

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: [Number],
  })
  location: {
    type: string;
    coordinates: number[];
  };

  @Prop({
    type: {
      country: { type: String, required: true },
      city: { type: String, required: true, index: true },
      street: String,
      zipcode: String,
    },
    required: true,
  })
  address: {
    country: string;
    city: string;
    street?: string;
    zipcode?: string;
  };

  @Prop({ type: [Types.ObjectId], default: [] })
  mediaIds: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ 
    type: String, 
    enum: ['available', 'sold', 'rented'], 
    default: 'available' 
  })
  status: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const PropertySchema = SchemaFactory.createForClass(Property);

// Create 2dsphere index for geospatial queries on location field
PropertySchema.index({ location: '2dsphere' });

// Create text index for fast text search
PropertySchema.index({ title: 'text', description: 'text', 'address.city': 'text' });
