import { IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteMessageDto {
  @ApiProperty({ description: 'Message ID to delete' })
  @IsNotEmpty()
  @IsMongoId()
  messageId: string;
}
