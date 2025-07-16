import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:4200',
    credentials: true,
  },
  namespace: '/messages',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.user = payload;

      // Store user connection
      if (client.userId) {
        this.connectedUsers.set(client.userId, client.id);
      }
      
      // Join user to their personal room
      await client.join(`user:${client.userId}`);
      
      // Emit user online status to all connected users
      this.server.emit('user:online', { userId: client.userId });
      
      console.log(`User ${client.userId} connected. Socket ID: ${client.id}`);
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      // Remove user from connected users
      this.connectedUsers.delete(client.userId);
      
      // Emit user offline status
      this.server.emit('user:offline', { userId: client.userId });
      
      console.log(`User ${client.userId} disconnected`);
    }
  }

  @SubscribeMessage('send:message')
  async handleSendMessage(
    @MessageBody() data: CreateMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      // Save message to database
      const message = await this.messagesService.sendMessage(client.userId, data);
      
      // Emit to sender
      client.emit('message:sent', message);
      
      // Emit to receiver if online
      const receiverSocketId = this.connectedUsers.get(data.receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('message:received', message);
      }
      
      // Emit to both users' rooms for conversation updates
      this.server.to(`user:${client.userId}`).emit('conversation:updated', {
        userId: data.receiverId,
        lastMessage: message,
      });
      
      this.server.to(`user:${data.receiverId}`).emit('conversation:updated', {
        userId: client.userId,
        lastMessage: message,
      });

      return { success: true, message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { error: 'Failed to send message' };
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @MessageBody() data: { receiverId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('typing:started', {
        userId: client.userId,
      });
    }
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @MessageBody() data: { receiverId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('typing:stopped', {
        userId: client.userId,
      });
    }
  }

  @SubscribeMessage('mark:read')
  async handleMarkAsRead(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    try {
      await this.messagesService.markAsRead(client.userId, { messageId: data.messageId });
      
      // Emit read receipt to message sender
      const message = await this.messagesService.getMessageById(data.messageId);
      if (message && message.sender.id !== client.userId) {
        const senderSocketId = this.connectedUsers.get(message.sender.id);
        if (senderSocketId) {
          this.server.to(senderSocketId).emit('message:read', {
            messageId: data.messageId,
            readBy: client.userId,
          });
        }
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  @SubscribeMessage('mark:all:read')
  async handleMarkAllAsRead(
    @MessageBody() data: { senderId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    try {
      await this.messagesService.markAllAsRead(client.userId, data.senderId);
      
      // Emit to sender that all messages were read
      const senderSocketId = this.connectedUsers.get(data.senderId);
      if (senderSocketId) {
        this.server.to(senderSocketId).emit('messages:all:read', {
          readBy: client.userId,
        });
      }
    } catch (error) {
      console.error('Error marking all messages as read:', error);
    }
  }

  // Helper method to get online users
  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Helper method to check if user is online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
} 