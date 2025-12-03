import { IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinConversationDto {
  @ApiProperty({ description: 'Conversation ID to join' })
  @IsNotEmpty()
  @IsMongoId()
  conversationId: string;
}
