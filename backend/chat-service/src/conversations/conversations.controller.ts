import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ConversationResponseDto } from './dto/conversation-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all conversations for current user' })
  @ApiResponse({ status: 200, description: 'Returns user conversations' })
  async getUserConversations(@Req() req): Promise<ConversationResponseDto[]> {
    return this.conversationsService.findUserConversationsFormatted(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiResponse({ status: 200, description: 'Returns conversation details' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversation(@Param('id') id: string) {
    return this.conversationsService.findById(id);
  }

  @Get(':id/participants')
  @ApiOperation({ summary: 'Get conversation participants' })
  @ApiResponse({ status: 200, description: 'Returns participant IDs' })
  async getParticipants(@Param('id') id: string) {
    const participants = await this.conversationsService.getParticipants(id);
    return { participantIds: participants.map((id) => id.toString()) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new conversation or return existing' })
  @ApiResponse({ status: 201, description: 'Conversation created or found' })
  async createConversation(
    @Body() createConversationDto: CreateConversationDto,
    @Req() req,
  ) {
    const conversation = await this.conversationsService.createConversation(
      createConversationDto,
      req.user.userId,
    );
    
    // Format the response like GET /conversations
    const formatted = await this.conversationsService.formatConversation(
      conversation,
      req.user.userId,
    );
    
    return formatted;
  }

  @Post(':id/mark-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all messages in conversation as read' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  async markConversationRead(@Param('id') id: string, @Req() req) {
    await this.conversationsService.resetUnreadCount(id, req.user.userId);
    return { success: true, message: 'Conversation marked as read' };
  }

  @Post(':id/delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete conversation for current user' })
  @ApiResponse({ status: 200, description: 'Conversation deleted' })
  async deleteConversation(@Param('id') id: string, @Req() req) {
    await this.conversationsService.softDeleteForUser(id, req.user.userId);
    return { success: true, message: 'Conversation deleted' };
  }

  @Post(':id/mute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mute conversation notifications' })
  @ApiResponse({ status: 200, description: 'Conversation muted' })
  async muteConversation(@Param('id') id: string, @Req() req) {
    await this.conversationsService.muteConversation(id, req.user.userId);
    return { success: true, message: 'Conversation muted' };
  }

  @Post(':id/unmute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unmute conversation notifications' })
  @ApiResponse({ status: 200, description: 'Conversation unmuted' })
  async unmuteConversation(@Param('id') id: string, @Req() req) {
    await this.conversationsService.unmuteConversation(id, req.user.userId);
    return { success: true, message: 'Conversation unmuted' };
  }

  @Post(':id/block')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block user in conversation' })
  @ApiResponse({ status: 200, description: 'User blocked' })
  async blockUser(@Param('id') id: string, @Req() req) {
    await this.conversationsService.blockUser(id, req.user.userId);
    return { success: true, message: 'User blocked' };
  }

  @Post(':id/unblock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unblock user in conversation' })
  @ApiResponse({ status: 200, description: 'User unblocked' })
  async unblockUser(@Param('id') id: string, @Req() req) {
    await this.conversationsService.unblockUser(id, req.user.userId);
    return { success: true, message: 'User unblocked' };
  }
}
