import { X, Pin, FileText, Image as ImageIcon, Video } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface PinnedMessage {
  id: string;
  message_id: string;
  pinned_at: string;
  message?: {
    id: string;
    content: string | null;
    media_type: string | null;
    media_url: string | null;
    created_at: string;
    sender: {
      id: string;
      username: string;
      avatar_url: string | null;
    } | null;
  };
}

interface PinnedMessagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  pinnedMessages: PinnedMessage[];
  onUnpin: (messageId: string) => void;
  onJumpToMessage?: (messageId: string) => void;
}

export default function PinnedMessagesPanel({
  isOpen,
  onClose,
  pinnedMessages,
  onUnpin,
  onJumpToMessage,
}: PinnedMessagesPanelProps) {
  const getMessagePreview = (message: PinnedMessage["message"]) => {
    if (!message) return "Tin nhắn không tồn tại";
    if (message.content) return message.content;
    if (message.media_type === "image") return "Hình ảnh";
    if (message.media_type === "video") return "Video";
    if (message.media_type === "document") return "Tài liệu";
    return "Tin nhắn";
  };

  const getMediaIcon = (mediaType: string | null) => {
    if (mediaType === "image") return <ImageIcon className="h-4 w-4" />;
    if (mediaType === "video") return <Video className="h-4 w-4" />;
    if (mediaType === "document") return <FileText className="h-4 w-4" />;
    return null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-background border-l shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Pin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Tin nhắn đã ghim</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {pinnedMessages.length}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              {pinnedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                  <Pin className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">
                    Chưa có tin nhắn nào được ghim
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Nhấn giữ tin nhắn để ghim
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  <AnimatePresence mode="popLayout">
                    {pinnedMessages.map((pinned, index) => (
                      <motion.div
                        key={pinned.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                        )}
                        onClick={() => onJumpToMessage?.(pinned.message_id)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={pinned.message?.sender?.avatar_url || ""} />
                            <AvatarFallback className="text-xs">
                              {pinned.message?.sender?.username?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm truncate">
                                {pinned.message?.sender?.username || "Người dùng"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {pinned.message?.created_at &&
                                  format(new Date(pinned.message.created_at), "dd/MM/yyyy", {
                                    locale: vi,
                                  })}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              {pinned.message?.media_type && (
                                <span className="text-primary">
                                  {getMediaIcon(pinned.message.media_type)}
                                </span>
                              )}
                              <p className="truncate">{getMessagePreview(pinned.message)}</p>
                            </div>
                          </div>

                          {/* Unpin button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnpin(pinned.message_id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
