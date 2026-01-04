import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Check, CheckCheck, Image, Video, FileText, Mic, Users } from "lucide-react";

interface TypingUser {
  userId: string;
  username: string;
  avatarUrl?: string;
}

interface ConversationItemProps {
  conversation: any;
  isSelected: boolean;
  onClick: () => void;
  onlineUsers?: Set<string>;
  typingUsers?: TypingUser[];
}

export default function ConversationItem({
  conversation,
  isSelected,
  onClick,
  onlineUsers,
  typingUsers,
}: ConversationItemProps) {
  const isGroup = conversation.is_group;
  const otherUser = !isGroup ? conversation.participants[0]?.profiles : null;
  const otherUserId = !isGroup ? conversation.participants[0]?.user_id : null;
  const lastMessage = conversation.lastMessage;
  
  // For groups, count online participants
  const onlineCount = isGroup && onlineUsers 
    ? conversation.participants.filter((p: any) => onlineUsers.has(p.user_id)).length 
    : 0;
  
  // Use real online status from presence and real unread count
  const isOnline = !isGroup && otherUserId && onlineUsers ? onlineUsers.has(otherUserId) : false;
  const isTyping = typingUsers && typingUsers.length > 0;
  const unreadCount = conversation.unreadCount || 0;

  const formatLastSeen = () => {
    if (!otherUser?.last_seen) return "";
    return formatDistanceToNow(new Date(otherUser.last_seen), { 
      addSuffix: true, 
      locale: vi 
    });
  };

  const getMessagePreview = () => {
    if (!lastMessage) return isGroup ? "Nhóm đã được tạo" : "Bắt đầu cuộc trò chuyện";
    
    // For group chats, show sender name
    const senderPrefix = isGroup && lastMessage.sender_username 
      ? `${lastMessage.sender_username}: ` 
      : "";
    
    if (lastMessage.media_type === "image") {
      return (
        <span className="flex items-center gap-1">
          {senderPrefix && <span>{senderPrefix}</span>}
          <Image className="h-3.5 w-3.5" />
          Hình ảnh
        </span>
      );
    }
    if (lastMessage.media_type === "video") {
      return (
        <span className="flex items-center gap-1">
          {senderPrefix && <span>{senderPrefix}</span>}
          <Video className="h-3.5 w-3.5" />
          Video
        </span>
      );
    }
    if (lastMessage.media_type === "document") {
      return (
        <span className="flex items-center gap-1">
          {senderPrefix && <span>{senderPrefix}</span>}
          <FileText className="h-3.5 w-3.5" />
          Tài liệu
        </span>
      );
    }
    if (lastMessage.media_type === "audio") {
      return (
        <span className="flex items-center gap-1">
          {senderPrefix && <span>{senderPrefix}</span>}
          <Mic className="h-3.5 w-3.5" />
          Tin nhắn thoại
        </span>
      );
    }
    
    return senderPrefix + (lastMessage.content || (isGroup ? "Nhóm đã được tạo" : "Bắt đầu cuộc trò chuyện"));
  };

  const formatTime = () => {
    if (!lastMessage?.created_at) return "";
    const date = new Date(lastMessage.created_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return "Hôm qua";
    } else if (diffDays < 7) {
      return date.toLocaleDateString('vi-VN', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' });
    }
  };

  const getDisplayName = () => {
    if (isGroup) {
      return conversation.name || "Nhóm chưa có tên";
    }
    return otherUser?.username || "Người dùng";
  };

  const getAvatarContent = () => {
    if (isGroup) {
      return (
        <Avatar className="h-12 w-12">
          <AvatarImage src={conversation.group_avatar} />
          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
            <Users className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
      );
    }
    return (
      <Avatar className="h-12 w-12">
        <AvatarImage src={otherUser?.avatar_url} />
        <AvatarFallback className="bg-primary/20 text-primary font-semibold">
          {otherUser?.username?.[0]?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
    );
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-border/50",
        isSelected 
          ? "bg-muted" 
          : "hover:bg-muted/50"
      )}
    >
      {/* Avatar with online indicator */}
      <div className="relative flex-shrink-0">
        {getAvatarContent()}
        {!isGroup && isOnline ? (
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-[hsl(var(--wa-light-green))] border-2 border-card rounded-full" />
        ) : !isGroup && otherUser?.last_seen && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground whitespace-nowrap bg-card px-1 rounded">
            {formatLastSeen()}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="font-semibold text-[15px] truncate text-foreground">
            {getDisplayName()}
          </h3>
          <span className={cn(
            "text-xs flex-shrink-0 ml-2",
            unreadCount > 0 ? "text-[hsl(var(--wa-light-green))] font-medium" : "text-muted-foreground"
          )}>
            {formatTime()}
          </span>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
            {isTyping ? (
              <>
                <span className="text-[hsl(var(--wa-light-green))] italic">
                  {isGroup && typingUsers?.[0]?.username 
                    ? `${typingUsers[0].username} đang nhập` 
                    : "đang nhập"}
                </span>
                <span className="flex gap-0.5 ml-0.5">
                  <span className="w-1 h-1 bg-[hsl(var(--wa-light-green))] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-[hsl(var(--wa-light-green))] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 bg-[hsl(var(--wa-light-green))] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </>
            ) : (
              <>
                {/* Show tick for sent messages */}
                {lastMessage && !isGroup && (
                  <CheckCheck className="h-4 w-4 text-[hsl(var(--wa-double-tick))] flex-shrink-0" />
                )}
                <span className="truncate">{getMessagePreview()}</span>
              </>
            )}
          </p>
          
          {/* Group online count or unread badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isGroup && onlineCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {onlineCount} online
              </span>
            )}
            {unreadCount > 0 && (
              <span className="h-5 min-w-5 px-1.5 flex items-center justify-center text-xs font-semibold bg-[hsl(var(--wa-light-green))] text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
