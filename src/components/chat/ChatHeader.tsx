import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, Phone, Video, ArrowLeft, Search, Pin, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface TypingUser {
  userId: string;
  username: string;
  avatarUrl?: string;
}

interface ChatHeaderProps {
  conversation: any;
  onVideoCall?: () => void;
  onVoiceCall?: () => void;
  onBack?: () => void;
  onlineUsers?: Set<string>;
  typingUsers?: TypingUser[];
  pinnedCount?: number;
  onOpenPinnedMessages?: () => void;
  onOpenWallpaperSelector?: () => void;
}

export default function ChatHeader({ 
  conversation, 
  onVideoCall, 
  onVoiceCall, 
  onBack, 
  onlineUsers, 
  typingUsers,
  pinnedCount = 0,
  onOpenPinnedMessages,
  onOpenWallpaperSelector
}: ChatHeaderProps) {
  const otherUser = conversation.participants[0]?.profiles;
  const otherUserId = conversation.participants[0]?.user_id;
  const isOnline = otherUserId && onlineUsers ? onlineUsers.has(otherUserId) : false;
  const isTyping = typingUsers && typingUsers.length > 0;

  const formatLastSeen = (lastSeen: string | null | undefined) => {
    if (!lastSeen) return "Offline";
    return `Hoạt động ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true, locale: vi })}`;
  };

  return (
    <div className="h-14 bg-[hsl(var(--wa-header-bg))] px-2 md:px-4 flex items-center gap-2 shadow-sm">
      {/* Back button for mobile */}
      {onBack && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          className="md:hidden text-primary-foreground hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Avatar and user info */}
      <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:bg-white/5 rounded-lg px-2 py-1 -ml-2">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser?.avatar_url} />
            <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">
              {otherUser?.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 bg-[hsl(var(--wa-light-green))] border-2 border-[hsl(var(--wa-header-bg))] rounded-full" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-primary-foreground truncate">
            {otherUser?.username || "Người dùng"}
          </h3>
          <p className="text-xs text-primary-foreground/70 truncate flex items-center gap-1">
            {isTyping ? (
              <>
                <span className="text-[hsl(var(--wa-light-green))]">Đang nhập</span>
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 bg-[hsl(var(--wa-light-green))] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-[hsl(var(--wa-light-green))] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 bg-[hsl(var(--wa-light-green))] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </>
            ) : isOnline ? (
              "Đang hoạt động"
            ) : (
              formatLastSeen(otherUser?.last_seen)
            )}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onVideoCall} 
          className="text-primary-foreground hover:bg-white/10"
        >
          <Video className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onVoiceCall} 
          className="text-primary-foreground hover:bg-white/10"
        >
          <Phone className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground hover:bg-white/10"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card">
            {pinnedCount > 0 && (
              <DropdownMenuItem onClick={onOpenPinnedMessages}>
                <Pin className="h-4 w-4 mr-2" />
                Tin nhắn đã ghim ({pinnedCount})
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <Search className="h-4 w-4 mr-2" />
              Tìm kiếm
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenWallpaperSelector}>
              <Image className="h-4 w-4 mr-2" />
              Thay đổi hình nền
            </DropdownMenuItem>
            <DropdownMenuItem>Xem hồ sơ</DropdownMenuItem>
            <DropdownMenuItem>Tắt thông báo</DropdownMenuItem>
            <DropdownMenuItem>Xóa cuộc trò chuyện</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
