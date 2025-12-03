import { IsNotEmpty, IsString, IsArray, IsOptional, IsMongoId, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class AttachmentDto {
  @ApiProperty({ description: 'Media ID from Media Service' })
  @IsMongoId()
  mediaId: string;

  @ApiProperty({ description: 'Optional URL for the attachment', required: false })
  @IsOptional()
  @IsString()
  url?: string;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsNotEmpty()
  @IsMongoId()
  conversationId: string;

  @ApiProperty({ description: 'Message text content', maxLength: 5000 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  text: string;

  @ApiProperty({ description: 'Optional attachments', type: [AttachmentDto], required: false })
  @IsOptional()
  @IsArray()
  attachments?: AttachmentDto[];

  @ApiProperty({ description: 'Local ID for optimistic UI', required: false })
  @IsOptional()
  @IsString()
  localId?: string;
}
