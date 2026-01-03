import { useEffect, useRef, useState, useMemo } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";

interface TypingUser {
  userId: string;
  username: string;
  avatarUrl?: string;
}

interface MessageListProps {
  messages: any[];
  currentUserId?: string;
  typingUsers?: TypingUser[];
  onDeleteMessage?: (messageId: string) => Promise<void>;
  onReplyMessage?: (message: any) => void;
}

export default function MessageList({ 
  messages, 
  currentUserId, 
  typingUsers = [],
  onDeleteMessage,
  onReplyMessage
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);

  // Create a map of message IDs to messages for quick reply lookup
  const messagesMap = useMemo(() => {
    const map = new Map<string, any>();
    messages.forEach(msg => map.set(msg.id, msg));
    return map;
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const formatDateDivider = (date: Date) => {
    if (isToday(date)) {
      return "Hôm nay";
    } else if (isYesterday(date)) {
      return "Hôm qua";
    } else {
      return format(date, "dd MMMM, yyyy", { locale: vi });
    }
  };

  const shouldShowDateDivider = (currentMessage: any, previousMessage: any) => {
    if (!previousMessage) return true;
    const currentDate = new Date(currentMessage.created_at);
    const previousDate = new Date(previousMessage.created_at);
    return !isSameDay(currentDate, previousDate);
  };

  const handleDelete = async (messageId: string) => {
    if (!onDeleteMessage) return;
    setDeletingMessageId(messageId);
    // Wait for animation to start
    await new Promise(resolve => setTimeout(resolve, 50));
    await onDeleteMessage(messageId);
    setDeletingMessageId(null);
  };

  const getReplyToMessage = (replyToId: string | null) => {
    if (!replyToId) return null;
    const replyMsg = messagesMap.get(replyToId);
    if (!replyMsg) return null;
    return {
      id: replyMsg.id,
      content: replyMsg.content,
      sender: replyMsg.sender,
      media_type: replyMsg.media_type
    };
  };

  return (
    <ScrollArea className="flex-1 bg-[hsl(var(--wa-chat-bg))]">
      {/* WhatsApp-style wallpaper pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="relative px-4 md:px-16 py-4 min-h-full">
        <div className="space-y-1">
          {messages.map((message, index) => {
            const previousMessage = index > 0 ? messages[index - 1] : null;
            const showDateDivider = shouldShowDateDivider(message, previousMessage);
            const replyToMessage = getReplyToMessage(message.reply_to_id);
            
            return (
              <div key={message.id}>
                {showDateDivider && (
                  <div className="flex justify-center my-4">
                    <div className="bg-card/90 text-muted-foreground text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm">
                      {formatDateDivider(new Date(message.created_at))}
                    </div>
                  </div>
                )}
                <MessageBubble
                  message={message}
                  isSent={message.sender_id === currentUserId}
                  onDelete={onDeleteMessage ? handleDelete : undefined}
                  isDeleting={deletingMessageId === message.id}
                  onReply={onReplyMessage}
                  replyToMessage={replyToMessage}
                />
              </div>
            );
          })}
          <TypingIndicator typingUsers={typingUsers} />
          <div ref={scrollRef} />
        </div>
      </div>
    </ScrollArea>
  );
}
