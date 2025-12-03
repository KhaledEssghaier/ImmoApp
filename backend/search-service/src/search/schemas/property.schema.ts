import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PropertyDocument = Property & Document;

@Schema({ timestamps: true, collection: 'properties' })
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
    index: true,
  })
  propertyType: string;

  @Prop({ required: true, enum: ['rent', 'sale'], index: true })
  transactionType: string;

  @Prop({ default: 0, index: true })
  bedrooms: number;

  @Prop({ default: 0, index: true })
  bathrooms: number;

  @Prop({ required: true, index: true })
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
      city: { type: String, required: true },
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

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  @Prop({ index: true })
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const PropertySchema = SchemaFactory.createForClass(Property);

// Create 2dsphere index for geospatial queries
PropertySchema.index({ location: '2dsphere' });

// Text index for full-text search
PropertySchema.index({
  title: 'text',
  description: 'text',
  'address.city': 'text',
  amenities: 'text',
});

// Compound indexes for common queries
PropertySchema.index({ propertyType: 1, transactionType: 1, price: 1 });
PropertySchema.index({ transactionType: 1, price: 1, createdAt: -1 });
PropertySchema.index({ transactionType: 1, propertyType: 1, bedrooms: 1, price: 1 });
PropertySchema.index({ isDeleted: 1, transactionType: 1 });
