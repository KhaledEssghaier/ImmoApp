import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { MarkReadDto } from './dto/mark-read.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('messages')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages for a conversation with pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of messages to return (default 50)' })
  @ApiQuery({ name: 'before', required: false, type: String, description: 'Message ID to paginate before' })
  @ApiResponse({ status: 200, description: 'Returns messages' })
  async getMessages(
    @Param('id') conversationId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ) {
    return this.messagesService.getConversationMessages(
      conversationId,
      limit ? parseInt(limit.toString()) : 50,
      before,
    );
  }

  @Post(':id/messages/mark-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  async markRead(@Body() markReadDto: MarkReadDto, @Req() req) {
    await this.messagesService.markMessagesRead(
      markReadDto.conversationId,
      markReadDto.messageIds,
      req.user.userId,
    );
    return { success: true, message: 'Messages marked as read' };
  }

  @Put('messages/:messageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Edit a message' })
  @ApiResponse({ status: 200, description: 'Message updated' })
  @ApiResponse({ status: 403, description: 'Not authorized to edit this message' })
  async editMessage(
    @Param('messageId') messageId: string,
    @Body('text') text: string,
    @Req() req,
  ) {
    const message = await this.messagesService.editMessage(
      messageId,
      text,
      req.user.userId,
    );
    return message;
  }
}
