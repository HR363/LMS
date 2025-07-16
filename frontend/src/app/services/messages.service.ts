import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Message {
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

export interface ConversationSummary {
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

export interface CreateMessageRequest {
  receiverId: string;
  content: string;
}

export interface ConversationResponse {
  data: Message[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  private apiUrl = 'http://localhost:3000/api/messages';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Send a message to another user
  sendMessage(receiverId: string, content: string): Observable<ApiResponse<Message>> {
    const payload: CreateMessageRequest = { receiverId, content };
    return this.http.post<ApiResponse<Message>>(this.apiUrl, payload, {
      headers: this.getHeaders()
    });
  }

  // Get all conversations for the current user
  getConversations(): Observable<ApiResponse<ConversationSummary[]>> {
    return this.http.get<ApiResponse<ConversationSummary[]>>(`${this.apiUrl}/conversations`, {
      headers: this.getHeaders()
    });
  }

  // Get conversation with a specific user
  getConversation(userId: string, page: number = 1, limit: number = 20): Observable<ApiResponse<ConversationResponse>> {
    return this.http.get<ApiResponse<ConversationResponse>>(`${this.apiUrl}/conversation/${userId}`, {
      headers: this.getHeaders(),
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  // Mark a specific message as read
  markAsRead(messageId: string): Observable<ApiResponse<{ success: boolean }>> {
    return this.http.put<ApiResponse<{ success: boolean }>>(`${this.apiUrl}/read/${messageId}`, {}, {
      headers: this.getHeaders()
    });
  }

  // Mark all messages from a sender as read
  markAllAsRead(senderId: string): Observable<ApiResponse<{ success: boolean }>> {
    return this.http.put<ApiResponse<{ success: boolean }>>(`${this.apiUrl}/read-all/${senderId}`, {}, {
      headers: this.getHeaders()
    });
  }

  // Get count of unread messages
  getUnreadCount(): Observable<ApiResponse<{ count: number }>> {
    return this.http.get<ApiResponse<{ count: number }>>(`${this.apiUrl}/unread-count`, {
      headers: this.getHeaders()
    });
  }

  // Delete a message (only sender can delete)
  deleteMessage(messageId: string): Observable<ApiResponse<{ success: boolean }>> {
    return this.http.delete<ApiResponse<{ success: boolean }>>(`${this.apiUrl}/${messageId}`, {
      headers: this.getHeaders()
    });
  }

  // Helper method to get user display name
  getUserDisplayName(user: { firstName: string; lastName: string }): string {
    return `${user.firstName} ${user.lastName}`;
  }

  // Helper method to format message time
  formatMessageTime(date: Date | string): string {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return messageDate.toLocaleDateString();
    }
  }

  // Helper method to check if message is from current user
  isFromCurrentUser(message: Message, currentUserId: string): boolean {
    return message.sender.id === currentUserId;
  }
} 