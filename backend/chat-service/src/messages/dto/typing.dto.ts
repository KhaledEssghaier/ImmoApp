import { IsNotEmpty, IsBoolean, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TypingDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsNotEmpty()
  @IsMongoId()
  conversationId: string;

  @ApiProperty({ description: 'Is user typing' })
  @IsBoolean()
  isTyping: boolean;
}
