import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MessagesService, MessageResponse, ConversationSummary } from './messages.service';
import { CreateMessageDto, GetConversationDto, MarkAsReadDto } from './dto';
import { UserResponse, ApiResponse as ApiResponseType } from '../common/types';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message to another user' })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
    type: MessageResponse,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Receiver not found' })
  async sendMessage(
    @Request() req: { user: UserResponse },
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<ApiResponseType<MessageResponse>> {
    const message = await this.messagesService.sendMessage(
      req.user.id,
      createMessageDto,
    );

    return {
      success: true,
      data: message,
      message: 'Message sent successfully',
    };
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Conversations retrieved successfully',
    type: [ConversationSummary],
  })
  async getConversations(
    @Request() req: { user: UserResponse },
  ): Promise<ApiResponseType<ConversationSummary[]>> {
    const conversations = await this.messagesService.getConversations(
      req.user.id,
    );

    return {
      success: true,
      data: conversations,
      message: 'Conversations retrieved successfully',
    };
  }

  @Get('conversation/:userId')
  @ApiOperation({ summary: 'Get conversation with a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID to get conversation with' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Messages per page' })
  @ApiResponse({
    status: 200,
    description: 'Conversation retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getConversation(
    @Request() req: { user: UserResponse },
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<ApiResponseType<any>> {
    const conversation = await this.messagesService.getConversation(
      req.user.id,
      { userId, page, limit },
    );

    return {
      success: true,
      data: conversation,
      message: 'Conversation retrieved successfully',
    };
  }

  @Put('read/:messageId')
  @ApiOperation({ summary: 'Mark a specific message as read' })
  @ApiParam({ name: 'messageId', description: 'Message ID to mark as read' })
  @ApiResponse({
    status: 200,
    description: 'Message marked as read successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not your message' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async markAsRead(
    @Request() req: { user: UserResponse },
    @Param('messageId') messageId: string,
  ): Promise<ApiResponseType<{ success: boolean }>> {
    const result = await this.messagesService.markAsRead(
      req.user.id,
      { messageId },
    );

    return {
      success: true,
      data: result,
      message: 'Message marked as read successfully',
    };
  }

  @Put('read-all/:senderId')
  @ApiOperation({ summary: 'Mark all messages from a sender as read' })
  @ApiParam({ name: 'senderId', description: 'Sender ID to mark all messages as read' })
  @ApiResponse({
    status: 200,
    description: 'All messages marked as read successfully',
  })
  async markAllAsRead(
    @Request() req: { user: UserResponse },
    @Param('senderId') senderId: string,
  ): Promise<ApiResponseType<{ success: boolean }>> {
    const result = await this.messagesService.markAllAsRead(
      req.user.id,
      senderId,
    );

    return {
      success: true,
      data: result,
      message: 'All messages marked as read successfully',
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of unread messages' })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
  })
  async getUnreadCount(
    @Request() req: { user: UserResponse },
  ): Promise<ApiResponseType<{ count: number }>> {
    const result = await this.messagesService.getUnreadCount(req.user.id);

    return {
      success: true,
      data: result,
      message: 'Unread count retrieved successfully',
    };
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'Delete a message (only sender can delete)' })
  @ApiParam({ name: 'messageId', description: 'Message ID to delete' })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not your message' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async deleteMessage(
    @Request() req: { user: UserResponse },
    @Param('messageId') messageId: string,
  ): Promise<ApiResponseType<{ success: boolean }>> {
    const result = await this.messagesService.deleteMessage(
      req.user.id,
      messageId,
    );

    return {
      success: true,
      data: result,
      message: 'Message deleted successfully',
    };
  }
} 