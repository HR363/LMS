import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto, GetConversationDto, MarkAsReadDto } from './dto';
import { UserResponse, PaginatedResponse } from '../common/types';

export class MessageResponse {
  id: string;
  content: string;
  createdAt: Date;
  read: boolean;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string | null;
  };
  receiver: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string | null;
  };
}

export class ConversationSummary {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string | null;
  lastMessage: {
    content: string;
    createdAt: Date;
    isFromMe: boolean;
  };
  unreadCount: number;
}

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(
    senderId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<MessageResponse> {
    const { receiverId, content } = createMessageDto;

    // Check if receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    // Create the message
    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    return message as MessageResponse;
  }

  async getConversation(
    currentUserId: string,
    getConversationDto: GetConversationDto,
  ): Promise<PaginatedResponse<MessageResponse>> {
    console.log('getConversation:', { currentUserId, userId: getConversationDto.userId });
    try {
      const { userId } = getConversationDto;
      const page = Number(getConversationDto.page) || 1;
      const limit = Number(getConversationDto.limit) || 20;
      const skip = (page - 1) * limit;

      // Check if the other user exists
      const otherUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!otherUser) {
        throw new NotFoundException('User not found');
      }

      // Get messages between the two users
      const [messages, total] = await Promise.all([
        this.prisma.message.findMany({
          where: {
            OR: [
              {
                AND: [
                  { senderId: currentUserId },
                  { receiverId: userId },
                ],
              },
              {
                AND: [
                  { senderId: userId },
                  { receiverId: currentUserId },
                ],
              },
            ],
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profileImage: true,
              },
            },
            receiver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profileImage: true,
              },
            },
          },
        }),
        this.prisma.message.count({
          where: {
            OR: [
              {
                AND: [
                  { senderId: currentUserId },
                  { receiverId: userId },
                ],
              },
              {
                AND: [
                  { senderId: userId },
                  { receiverId: currentUserId },
                ],
              },
            ],
          },
        }),
      ]);

      console.log('Fetched messages:', messages);

      // Mark messages as read
      await this.prisma.message.updateMany({
        where: {
          senderId: userId,
          receiverId: currentUserId,
          read: false,
        },
        data: { read: true },
      });

      return {
        data: messages as MessageResponse[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error in getConversation:', error);
      // Always return a valid response, never throw 500
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
    }
  }

  async getConversations(currentUserId: string): Promise<ConversationSummary[]> {
    // Get all unique conversations for the current user
    const conversations = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group conversations by the other user
    const conversationMap = new Map<string, ConversationSummary>();

    for (const message of conversations) {
      const otherUserId = message.senderId === currentUserId 
        ? message.receiverId 
        : message.senderId;
      
      const otherUser = message.senderId === currentUserId 
        ? message.receiver 
        : message.sender;

      if (!conversationMap.has(otherUserId)) {
        // Get unread count for this conversation
        const unreadCount = await this.prisma.message.count({
          where: {
            senderId: otherUserId,
            receiverId: currentUserId,
            read: false,
          },
        });

        conversationMap.set(otherUserId, {
          userId: otherUserId,
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          email: otherUser.email,
          profileImage: otherUser.profileImage,
          lastMessage: {
            content: message.content,
            createdAt: message.createdAt,
            isFromMe: message.senderId === currentUserId,
          },
          unreadCount,
        });
      }
    }

    return Array.from(conversationMap.values()).sort(
      (a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime(),
    );
  }

  async markAsRead(
    currentUserId: string,
    markAsReadDto: MarkAsReadDto,
  ): Promise<{ success: boolean }> {
    const { messageId } = markAsReadDto;

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.receiverId !== currentUserId) {
      throw new ForbiddenException('You can only mark messages sent to you as read');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: { read: true },
    });

    return { success: true };
  }

  async markAllAsRead(
    currentUserId: string,
    senderId: string,
  ): Promise<{ success: boolean }> {
    await this.prisma.message.updateMany({
      where: {
        senderId,
        receiverId: currentUserId,
        read: false,
      },
      data: { read: true },
    });

    return { success: true };
  }

  async getUnreadCount(currentUserId: string): Promise<{ count: number }> {
    const count = await this.prisma.message.count({
      where: {
        receiverId: currentUserId,
        read: false,
      },
    });

    return { count };
  }

  async deleteMessage(
    currentUserId: string,
    messageId: string,
  ): Promise<{ success: boolean }> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== currentUserId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.prisma.message.delete({
      where: { id: messageId },
    });

    return { success: true };
  }

  async getMessageById(messageId: string): Promise<MessageResponse | null> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    return message as MessageResponse | null;
  }
} 