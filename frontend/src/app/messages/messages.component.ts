import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagesService, Message, ConversationSummary } from '../services/messages.service';
import { WebSocketService, TypingEvent, OnlineStatusEvent, MessageEvent, ConversationUpdateEvent, ReadReceiptEvent } from '../services/websocket.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Subscription, timer } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { UsersService } from '../services/users.service';
import { SharedNavbar } from '../shared/navbar/navbar.component';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedNavbar],
  template: `
    <app-shared-navbar class="w-full"></app-shared-navbar>
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <div class="flex-1 flex flex-col">
        <div class="w-full flex-1 flex flex-col">
          <div class="bg-white rounded-lg shadow-lg overflow-hidden flex-1 flex flex-col">
            <!-- Header -->
            <div class="bg-blue-600 text-white px-6 py-4">
              <div class="flex items-center justify-between">
                <div>
                  <h1 class="text-2xl font-bold">Messages</h1>
                  <p class="text-blue-100">Connect with instructors and students</p>
                </div>
                <div class="flex items-center space-x-2">
                  <div class="flex items-center space-x-1">
                    <div class="w-2 h-2 rounded-full" [class.bg-green-400]="isConnected" [class.bg-red-400]="!isConnected"></div>
                    <span class="text-sm">{{ isConnected ? 'Online' : 'Offline' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-1 h-0 min-h-0" style="height:auto;">
              <!-- Conversations List -->
              <div class="w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col">
                <div class="p-4 border-b border-gray-200">
                  <h2 class="text-lg font-semibold text-gray-800">Conversations</h2>
                  <div class="mt-2 text-sm text-gray-600">
                    {{ unreadCount }} unread messages
                  </div>
                </div>
                <div class="overflow-y-auto flex-1">
                  <div 
                    *ngFor="let conversation of conversations" 
                    (click)="selectConversation(conversation)"
                    class="p-4 border-b border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
                    [class.bg-blue-50]="selectedConversation?.userId === conversation.userId"
                  >
                    <div class="flex items-center space-x-3">
                      <div class="relative">
                        <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {{ conversation.firstName.charAt(0) }}{{ conversation.lastName.charAt(0) }}
                        </div>
                        <div 
                          *ngIf="isUserOnline(conversation.userId)"
                          class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"
                        ></div>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                          <h3 class="text-sm font-medium text-gray-900 truncate">
                            {{ conversation.firstName }} {{ conversation.lastName }}
                          </h3>
                          <span 
                            *ngIf="conversation.unreadCount > 0"
                            class="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center"
                          >
                            {{ conversation.unreadCount }}
                          </span>
                        </div>
                        <p class="text-sm text-gray-500 truncate">
                          {{ conversation.lastMessage.content }}
                        </p>
                        <p class="text-xs text-gray-400">
                          {{ formatMessageTime(conversation.lastMessage.createdAt) }}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div *ngIf="conversations.length === 0" class="p-4 text-center text-gray-500">
                    No conversations yet
                  </div>
                </div>
              </div>

              <!-- Chat Area -->
              <div class="flex-1 flex flex-col min-h-0 overflow-y-auto h-full max-h-screen">
                <div *ngIf="selectedConversation" class="flex-1 flex flex-col min-h-0">
                  <!-- Chat Header -->
                  <div class="p-4 border-b border-gray-200 bg-white">
                    <div class="flex items-center space-x-3">
                      <div class="relative">
                        <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {{ selectedConversation.firstName.charAt(0) }}{{ selectedConversation.lastName.charAt(0) }}
                        </div>
                        <div 
                          *ngIf="isUserOnline(selectedConversation.userId)"
                          class="absolute -bottom-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-white"
                        ></div>
                      </div>
                      <div>
                        <h3 class="font-semibold text-gray-900">
                          {{ selectedConversation.firstName }} {{ selectedConversation.lastName }}
                        </h3>
                        <p class="text-sm text-gray-500">
                          {{ selectedConversation.email }}
                          <span *ngIf="isUserOnline(selectedConversation.userId)" class="text-green-500">• Online</span>
                        </p>
                      </div>
                    </div>
                    <!-- Typing Indicator -->
                    <div *ngIf="isTyping" class="mt-2 text-sm text-gray-500 italic">
                      {{ selectedConversation.firstName }} is typing...
                    </div>
                  </div>

                  <!-- Messages -->
                  <div class="flex-1 min-h-0 overflow-y-auto p-4 space-y-4" #messagesContainer>
                    <div 
                      *ngFor="let message of messages" 
                      class="flex"
                      [class.justify-end]="isFromCurrentUser(message)"
                      [class.justify-start]="!isFromCurrentUser(message)"
                    >
                      <div 
                        class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg"
                        [class.bg-blue-500]="isFromCurrentUser(message)"
                        [class.text-white]="isFromCurrentUser(message)"
                        [class.bg-gray-200]="!isFromCurrentUser(message)"
                        [class.text-gray-900]="!isFromCurrentUser(message)"
                      >
                        <p class="text-sm">{{ message.content }}</p>
                        <p class="text-xs mt-1 opacity-70">
                          {{ formatMessageTime(message.createdAt) }}
                          <span *ngIf="isFromCurrentUser(message)">
                            <span [ngClass]="message.read ? 'text-green-500' : 'text-gray-400'">
                              {{ message.read ? '✓✓' : '✓' }}
                            </span>
                          </span>
                        </p>
                      </div>
                    </div>
                    <div *ngIf="messages.length === 0" class="text-center text-gray-500">
                      No messages yet. Start the conversation!
                    </div>
                  </div>

                  <!-- Message Input -->
                  <div class="p-4 border-t border-gray-200 bg-white">
                    <form (ngSubmit)="sendMessage()" class="flex space-x-2">
                      <input
                        type="text"
                        [(ngModel)]="newMessage"
                        name="newMessage"
                        placeholder="Type your message..."
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        [disabled]="sending"
                        (input)="onTyping()"
                      >
                      <button
                        type="submit"
                        [disabled]="!newMessage.trim() || sending"
                        class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {{ sending ? 'Sending...' : 'Send' }}
                      </button>
                    </form>
                  </div>
                </div>
                <!-- No Conversation Selected -->
                <div *ngIf="!selectedConversation" class="flex-1 flex items-center justify-center">
                  <div class="text-center text-gray-500">
                    <div class="text-6xl mb-4">💬</div>
                    <h3 class="text-lg font-medium mb-2">Select a conversation</h3>
                    <p>Choose a conversation from the list to start messaging</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class MessagesComponent implements OnInit, OnDestroy {
  conversations: ConversationSummary[] = [];
  selectedConversation: ConversationSummary | null = null;
  messages: Message[] = [];
  newMessage = '';
  sending = false;
  unreadCount = 0;
  isConnected = false;
  isTyping = false;
  onlineUsers: string[] = [];
  pendingUserId: string | null = null;
  
  private subscriptions: Subscription[] = [];
  private typingTimer: any;

  constructor(
    private messagesService: MessagesService,
    private webSocketService: WebSocketService,
    private authService: AuthService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private usersService: UsersService
  ) {}

  ngOnInit() {
    this.connectWebSocket();
    this.loadConversations();
    this.loadUnreadCount();
    this.setupWebSocketListeners();
    this.route.queryParams.subscribe(params => {
      const userId = params['userId'];
      if (userId) {
        this.pendingUserId = userId;
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    this.webSocketService.disconnect();
  }

  private connectWebSocket() {
    this.webSocketService.connect();
    
    this.subscriptions.push(
      this.webSocketService.getConnectionStatus().subscribe(
        status => {
          this.isConnected = status;
          if (status) {
            console.log('WebSocket connected successfully');
          } else {
            console.log('WebSocket disconnected');
          }
        }
      )
    );
  }

  private setupWebSocketListeners() {
    // Listen for incoming messages
    this.subscriptions.push(
      this.webSocketService.onMessageReceived().subscribe(
        (event: MessageEvent) => {
          this.handleIncomingMessage(event.message);
        }
      )
    );

    // Listen for sent message confirmation
    this.subscriptions.push(
      this.webSocketService.onMessageSent().subscribe(
        (event: MessageEvent) => {
          this.handleSentMessage(event.message);
        }
      )
    );

    // Listen for typing events
    this.subscriptions.push(
      this.webSocketService.onTypingStarted().subscribe(
        (event: TypingEvent) => {
          if (this.selectedConversation?.userId === event.userId) {
            this.isTyping = true;
          }
        }
      )
    );

    this.subscriptions.push(
      this.webSocketService.onTypingStopped().subscribe(
        (event: TypingEvent) => {
          if (this.selectedConversation?.userId === event.userId) {
            this.isTyping = false;
          }
        }
      )
    );

    // Listen for online/offline events
    this.subscriptions.push(
      this.webSocketService.onUserOnline().subscribe(
        (event: OnlineStatusEvent) => {
          if (!this.onlineUsers.includes(event.userId)) {
            this.onlineUsers.push(event.userId);
          }
        }
      )
    );

    this.subscriptions.push(
      this.webSocketService.onUserOffline().subscribe(
        (event: OnlineStatusEvent) => {
          this.onlineUsers = this.onlineUsers.filter(id => id !== event.userId);
        }
      )
    );

    // Listen for conversation updates
    this.subscriptions.push(
      this.webSocketService.onConversationUpdated().subscribe(
        (event: ConversationUpdateEvent) => {
          this.updateConversation(event);
        }
      )
    );

    // Listen for read receipts
    this.subscriptions.push(
      this.webSocketService.onMessageRead().subscribe(
        (event: ReadReceiptEvent) => {
          this.updateMessageReadStatus(event.messageId);
        }
      )
    );
  }

  private handleIncomingMessage(message: Message) {
    const currentUserId = this.authService.currentUser?.id;
    const otherUserId = this.selectedConversation?.userId;
    const isRelevant =
      !!currentUserId && !!otherUserId &&
      ((message.sender.id === currentUserId && message.receiver.id === otherUserId) ||
       (message.sender.id === otherUserId && message.receiver.id === currentUserId));
    if (isRelevant) {
      this.messages.push(message);
      this.scrollToBottom();
      // Mark as read if we're in the conversation
      this.webSocketService.markAsRead(message.id);
    }
    // Update conversations list
    this.loadConversations();
    this.loadUnreadCount();

    // Always reload messages if the new message is for the selected conversation
    if (this.selectedConversation && isRelevant) {
      this.loadMessages(this.selectedConversation.userId);
    }
  }

  private handleSentMessage(message: Message) {
    if (!message || !message.sender) {
      // Invalid message, skip
      return;
    }
    const currentUserId = this.authService.currentUser?.id;
    const otherUserId = this.selectedConversation?.userId;
    const isRelevant =
      !!currentUserId && !!otherUserId &&
      ((message.sender.id === currentUserId && message.receiver.id === otherUserId) ||
       (message.sender.id === otherUserId && message.receiver.id === currentUserId));
    if (isRelevant) {
      this.messages.push(message);
      this.scrollToBottom();
    }
    // Update conversations list
    this.loadConversations();
  }

  private updateConversation(event: ConversationUpdateEvent) {
    // Update conversation in the list
    const conversationIndex = this.conversations.findIndex(c => c.userId === event.userId);
    if (conversationIndex !== -1) {
      this.conversations[conversationIndex].lastMessage = {
        content: event.lastMessage.content,
        createdAt: event.lastMessage.createdAt,
        isFromMe: event.lastMessage.sender.id === this.authService.currentUser?.id
      };
      
      // Move conversation to top
      const conversation = this.conversations.splice(conversationIndex, 1)[0];
      this.conversations.unshift(conversation);
    }
  }

  private updateMessageReadStatus(messageId: string) {
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.read = true;
    }
  }

  loadConversations() {
    this.messagesService.getConversations().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.conversations = response.data;
          // Auto-select if pendingUserId is set
          if (this.pendingUserId) {
            let conv = this.conversations.find(c => c.userId === this.pendingUserId);
            if (!conv) {
              // If no conversation exists, create a temporary one for starting a new chat
              conv = {
                userId: this.pendingUserId,
                firstName: 'New User', // Optionally fetch real name from usersService
                lastName: '',
                email: '',
                profileImage: '',
                lastMessage: {
                  content: '',
                  createdAt: new Date(),
                  isFromMe: false
                },
                unreadCount: 0
              };
              this.conversations.unshift(conv);
            }
            this.selectConversation(conv);
            this.pendingUserId = null;
          }
        }
      },
      error: (error) => {
        console.error('Error loading conversations:', error);
        this.toastService.show('Error loading conversations', 'error');
      }
    });
  }

  loadUnreadCount() {
    this.messagesService.getUnreadCount().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.unreadCount = response.data.count;
        }
      },
      error: (error) => {
        console.error('Error loading unread count:', error);
      }
    });
  }

  selectConversation(conversation: ConversationSummary) {
    this.selectedConversation = conversation;
    this.loadMessages(conversation.userId);
    
    // Mark messages as read
    if (conversation.unreadCount > 0) {
      this.webSocketService.markAllAsRead(conversation.userId);
      conversation.unreadCount = 0;
      this.loadUnreadCount();
    }
  }

  loadMessages(userId: string) {
    console.log('Calling getConversation for userId:', userId);
    this.messagesService.getConversation(userId).subscribe({
      next: (response) => {
        console.log('API response:', response);
        if (response.success && response.data) {
          if (Array.isArray(response.data.data)) {
            this.messages = response.data.data.reverse();
            console.log('Messages set:', this.messages);
          } else if (Array.isArray(response.data)) {
            this.messages = response.data.reverse();
            console.log('Messages set (fallback):', this.messages);
          } else {
            this.messages = [];
            console.log('No messages array found in response.');
          }
          this.scrollToBottom();
        } else {
          this.messages = [];
          console.log('No messages found for userId:', userId);
        }
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.toastService.show('Error loading messages', 'error');
        this.messages = [];
      }
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation || this.sending) {
      return;
    }

    this.sending = true;
    
    // Send via WebSocket for real-time delivery
    this.webSocketService.sendMessage(this.selectedConversation.userId, this.newMessage.trim());
    
    // Stop typing indicator
    this.webSocketService.stopTyping(this.selectedConversation.userId);
    
    this.newMessage = '';
    this.sending = false;
  }

  onTyping() {
    if (!this.selectedConversation) return;
    
    // Start typing indicator
    this.webSocketService.startTyping(this.selectedConversation.userId);
    
    // Clear existing timer
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    
    // Stop typing indicator after 2 seconds of no input
    this.typingTimer = setTimeout(() => {
      this.webSocketService.stopTyping(this.selectedConversation!.userId);
    }, 2000);
  }

  isFromCurrentUser(message: Message): boolean {
    const currentUser = this.authService.currentUser;
    return currentUser ? message.sender.id === currentUser.id : false;
  }

  isUserOnline(userId: string): boolean {
    return this.webSocketService.isUserOnline(userId);
  }

  formatMessageTime(date: Date): string {
    return this.messagesService.formatMessageTime(date);
  }

  private scrollToBottom() {
    setTimeout(() => {
      const container = document.querySelector('.overflow-y-auto');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }
} 