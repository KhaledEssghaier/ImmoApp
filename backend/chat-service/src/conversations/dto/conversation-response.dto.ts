export class UserDto {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

export class LastMessageDto {
  id?: string;
  conversationId: string;
  senderId: string;
  text: string;
  attachments: any[];
  createdAt: Date;
  readBy: string[];
}

export class ConversationResponseDto {
  id: string;
  otherUser: UserDto;
  lastMessage?: LastMessageDto;
  unreadCount: number;
  updatedAt: Date;
}
