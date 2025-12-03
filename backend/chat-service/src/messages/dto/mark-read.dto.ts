import { IsNotEmpty, IsArray, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkReadDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsNotEmpty()
  @IsMongoId()
  conversationId: string;

  @ApiProperty({ description: 'Array of message IDs to mark as read' })
  @IsArray()
  @IsMongoId({ each: true })
  messageIds: string[];
}
