import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Message, ConversationSummary } from './messages.service';

export interface TypingEvent {
  userId: string;
}

export interface OnlineStatusEvent {
  userId: string;
}

export interface MessageEvent {
  message: Message;
}

export interface ConversationUpdateEvent {
  userId: string;
  lastMessage: Message;
}

export interface ReadReceiptEvent {
  messageId: string;
  readBy: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private onlineUsers = new BehaviorSubject<string[]>([]);

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No access token found');
      return;
    }

    this.socket = io('http://localhost:3000/messages', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.connectionStatus.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
      this.connectionStatus.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
      this.connectionStatus.next(false);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.connectionStatus.next(false);
    }
  }

  // Send message
  sendMessage(receiverId: string, content: string): void {
    if (this.socket?.connected) {
      this.socket.emit('send:message', { receiverId, content });
    }
  }

  // Typing indicators
  startTyping(receiverId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing:start', { receiverId });
    }
  }

  stopTyping(receiverId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing:stop', { receiverId });
    }
  }

  // Mark messages as read
  markAsRead(messageId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('mark:read', { messageId });
    }
  }

  markAllAsRead(senderId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('mark:all:read', { senderId });
    }
  }

  // Listen for incoming messages
  onMessageReceived(): Observable<MessageEvent> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('message:received', (data: MessageEvent) => {
          observer.next(data);
        });
      }
    });
  }

  // Listen for sent message confirmation
  onMessageSent(): Observable<MessageEvent> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('message:sent', (data: MessageEvent) => {
          observer.next(data);
        });
      }
    });
  }

  // Listen for typing events
  onTypingStarted(): Observable<TypingEvent> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('typing:started', (data: TypingEvent) => {
          observer.next(data);
        });
      }
    });
  }

  onTypingStopped(): Observable<TypingEvent> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('typing:stopped', (data: TypingEvent) => {
          observer.next(data);
        });
      }
    });
  }

  // Listen for online/offline events
  onUserOnline(): Observable<OnlineStatusEvent> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('user:online', (data: OnlineStatusEvent) => {
          observer.next(data);
        });
      }
    });
  }

  onUserOffline(): Observable<OnlineStatusEvent> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('user:offline', (data: OnlineStatusEvent) => {
          observer.next(data);
        });
      }
    });
  }

  // Listen for conversation updates
  onConversationUpdated(): Observable<ConversationUpdateEvent> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('conversation:updated', (data: ConversationUpdateEvent) => {
          observer.next(data);
        });
      }
    });
  }

  // Listen for read receipts
  onMessageRead(): Observable<ReadReceiptEvent> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('message:read', (data: ReadReceiptEvent) => {
          observer.next(data);
        });
      }
    });
  }

  onAllMessagesRead(): Observable<{ readBy: string }> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('messages:all:read', (data: { readBy: string }) => {
          observer.next(data);
        });
      }
    });
  }

  // Connection status
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  isSocketConnected(): boolean {
    return this.isConnected;
  }

  // Helper method to check if a user is online
  isUserOnline(userId: string): boolean {
    return this.onlineUsers.value.includes(userId);
  }

  // Get online users
  getOnlineUsers(): Observable<string[]> {
    return this.onlineUsers.asObservable();
  }
} 