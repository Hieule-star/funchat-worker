import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Check, CheckCheck, Image, Video, FileText, Mic } from "lucide-react";

interface ConversationItemProps {
  conversation: any;
  isSelected: boolean;
  onClick: () => void;
}

export default function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: ConversationItemProps) {
  const otherUser = conversation.participants[0]?.profiles;
  const lastMessage = conversation.lastMessage;
  
  // Use real unread count from props, mock online status for now
  const isOnline = otherUser?.is_online || false;
  const unreadCount = conversation.unreadCount || 0;

  const getMessagePreview = () => {
    if (!lastMessage) return "Bắt đầu cuộc trò chuyện";
    
    if (lastMessage.media_type === "image") {
      return (
        <span className="flex items-center gap-1">
          <Image className="h-3.5 w-3.5" />
          Hình ảnh
        </span>
      );
    }
    if (lastMessage.media_type === "video") {
      return (
        <span className="flex items-center gap-1">
          <Video className="h-3.5 w-3.5" />
          Video
        </span>
      );
    }
    if (lastMessage.media_type === "document") {
      return (
        <span className="flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          Tài liệu
        </span>
      );
    }
    if (lastMessage.media_type === "audio") {
      return (
        <span className="flex items-center gap-1">
          <Mic className="h-3.5 w-3.5" />
          Tin nhắn thoại
        </span>
      );
    }
    
    return lastMessage.content || "Bắt đầu cuộc trò chuyện";
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
        <Avatar className="h-12 w-12">
          <AvatarImage src={otherUser?.avatar_url} />
          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
            {otherUser?.username?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-[hsl(var(--wa-light-green))] border-2 border-card rounded-full" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="font-semibold text-[15px] truncate text-foreground">
            {otherUser?.username || "Người dùng"}
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
            {/* Show tick for sent messages */}
            {lastMessage && (
              <CheckCheck className="h-4 w-4 text-[hsl(var(--wa-double-tick))] flex-shrink-0" />
            )}
            <span className="truncate">{getMessagePreview()}</span>
          </p>
          
          {unreadCount > 0 && (
            <span className="flex-shrink-0 h-5 min-w-5 px-1.5 flex items-center justify-center text-xs font-semibold bg-[hsl(var(--wa-light-green))] text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
