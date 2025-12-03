import { IsNotEmpty, IsString, IsMongoId, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EditMessageDto {
  @ApiProperty({ description: 'Message ID to edit' })
  @IsNotEmpty()
  @IsMongoId()
  messageId: string;

  @ApiProperty({ description: 'New message text', maxLength: 5000 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  newText: string;
}
