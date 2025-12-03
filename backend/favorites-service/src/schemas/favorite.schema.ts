import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type FavoriteDocument = Favorite & Document;

@Schema({ timestamps: true })
export class Favorite {
  @ApiProperty({ description: 'User ID who favorited the property' })
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Property ID that was favorited' })
  @Prop({ type: Types.ObjectId, required: true })
  propertyId: Types.ObjectId;

  @ApiProperty({ description: 'Source of the favorite action', enum: ['mobile', 'web', 'api'] })
  @Prop({ type: String, enum: ['mobile', 'web', 'api'], default: 'api' })
  source?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt?: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt?: Date;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

// Compound unique index to prevent duplicates
FavoriteSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

// Index for property favorites count
FavoriteSchema.index({ propertyId: 1 });

// Index for retrieving user favorites sorted by newest
FavoriteSchema.index({ userId: 1, createdAt: -1 });
