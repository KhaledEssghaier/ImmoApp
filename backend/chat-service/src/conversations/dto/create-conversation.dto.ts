import { IsNotEmpty, IsArray, IsOptional, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class CreateConversationDto {
  @ApiProperty({ description: 'Array of participant user IDs', example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'] })
  @IsArray()
  @IsNotEmpty()
  participantIds: string[];

  @ApiProperty({ description: 'Property ID if chat is about a property', required: false })
  @IsOptional()
  @IsMongoId()
  propertyId?: string;
}
