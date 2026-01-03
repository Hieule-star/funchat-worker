import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { FileText, Download, FileArchive, FileSpreadsheet, FileCode, File, CheckCheck, Trash2, MoreVertical, Reply, Forward, Smile, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ReactionPicker from "./ReactionPicker";
import MessageReactions from "./MessageReactions";

interface ReplyToMessage {
  id: string;
  content: string | null;
  sender: {
    username: string;
  } | null;
  media_type?: string | null;
}

interface ReactionData {
  reaction: string;
  count: number;
  hasReacted: boolean;
}

interface MessageBubbleProps {
  message: any;
  isSent: boolean;
  onDelete?: (messageId: string) => Promise<void>;
  isDeleting?: boolean;
  onReply?: (message: any) => void;
  replyToMessage?: ReplyToMessage | null;
  onForward?: (message: any) => void;
  reactions?: ReactionData[];
  onToggleReaction?: (messageId: string, emoji: string) => void;
  isPinned?: boolean;
  onTogglePin?: (messageId: string) => void;
}

export default function MessageBubble({ 
  message, 
  isSent, 
  onDelete, 
  isDeleting,
  onReply,
  replyToMessage,
  onForward,
  reactions = [],
  onToggleReaction,
  isPinned = false,
  onTogglePin
}: MessageBubbleProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const handlePin = () => {
    if (onTogglePin) {
      onTogglePin(message.id);
    }
  };

  const handleDownload = () => {
    if (message.media_url) {
      window.open(message.media_url, '_blank');
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleteLoading(true);
    try {
      await onDelete(message.id);
    } finally {
      setIsDeleteLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleReply = () => {
    if (onReply) {
      onReply(message);
    }
  };

  const handleForward = () => {
    if (onForward) {
      onForward(message);
    }
  };

  const handleReact = (emoji: string) => {
    if (onToggleReaction) {
      onToggleReaction(message.id, emoji);
    }
    setShowReactionPicker(false);
  };

  const getFileName = (url: string) => {
    const parts = url.split('/');
    const fullName = parts[parts.length - 1];
    const cleanName = fullName.replace(/^\d+-\w+\./, '');
    return cleanName || fullName;
  };

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase() || '';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return FileArchive;
    if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet;
    if (['js', 'ts', 'py', 'java', 'cpp', 'exe', 'dll'].includes(ext)) return FileCode;
    if (['doc', 'docx', 'txt', 'pdf'].includes(ext)) return FileText;
    return File;
  };

  const getReplyPreviewText = (reply: ReplyToMessage) => {
    if (reply.content) return reply.content;
    if (reply.media_type === "image") return "📷 Hình ảnh";
    if (reply.media_type === "video") return "🎥 Video";
    if (reply.media_type === "document") return "📄 Tài liệu";
    return "Tin nhắn";
  };

  const fileName = message.media_url ? getFileName(message.media_url) : 'File';
  const fileExtension = message.media_url ? message.media_url.split('.').pop()?.toUpperCase() || '' : '';
  const FileIcon = message.media_url ? getFileIcon(message.media_url) : File;

  // Message status based on actual data
  const isRead = message.is_read === true;

  return (
    <>
      <div 
        className={cn(
          "flex mb-1 transition-all duration-300",
          isSent ? "justify-end" : "justify-start",
          isDeleting && "opacity-0 scale-95 -translate-x-4"
        )}
      >
        <div className={cn("relative max-w-[75%] group")}>
          {/* Reaction picker */}
          <ReactionPicker
            isOpen={showReactionPicker}
            onClose={() => setShowReactionPicker(false)}
            onReact={handleReact}
            isSent={isSent}
          />

          {/* Action menu */}
          <div className={cn(
            "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1",
            isSent ? "-left-24" : "-right-24"
          )}>
            {/* Reaction button */}
            {onToggleReaction && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-background/80 hover:bg-background shadow-sm"
                onClick={() => setShowReactionPicker(true)}
              >
                <Smile className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}

            {/* Forward button */}
            {onForward && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-background/80 hover:bg-background shadow-sm"
                onClick={handleForward}
              >
                <Forward className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}

            {/* Reply button */}
            {onReply && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-background/80 hover:bg-background shadow-sm"
                onClick={handleReply}
              >
                <Reply className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
            
            {/* Delete menu for sent messages */}
            {isSent && onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full bg-background/80 hover:bg-background shadow-sm"
                  >
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  {onTogglePin && (
                    <DropdownMenuItem onClick={handlePin}>
                      <Pin className={cn("h-4 w-4 mr-2", isPinned && "fill-current")} />
                      {isPinned ? "Bỏ ghim" : "Ghim tin nhắn"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa tin nhắn
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* WhatsApp-style bubble tail */}
          <div
            className={cn(
              "absolute top-0 w-3 h-3",
              isSent 
                ? "right-[-6px] bg-[hsl(var(--wa-outgoing))]" 
                : "left-[-6px] bg-[hsl(var(--wa-incoming))]",
              isSent
                ? "[clip-path:polygon(0_0,100%_0,0_100%)]"
                : "[clip-path:polygon(100%_0,100%_100%,0_0)]"
            )}
          />
          
          <div
            className={cn(
              "relative rounded-lg overflow-hidden shadow-sm",
              isSent
                ? "bg-[hsl(var(--wa-outgoing))] text-foreground rounded-tr-none"
                : "bg-[hsl(var(--wa-incoming))] text-foreground rounded-tl-none"
            )}
          >
            {/* Reply preview */}
            {replyToMessage && (
              <div className={cn(
                "mx-2 mt-2 p-2 rounded-md border-l-2 cursor-pointer",
                isSent 
                  ? "bg-black/5 border-primary/50" 
                  : "bg-black/5 border-primary"
              )}>
                <p className="text-xs font-semibold text-primary truncate">
                  {replyToMessage.sender?.username || "Người dùng"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {getReplyPreviewText(replyToMessage)}
                </p>
              </div>
            )}

            {/* Sender name for group chats (received messages only) */}
            {!isSent && message.sender?.username && !replyToMessage && (
              <p className="px-3 pt-2 text-xs font-semibold text-primary">
                {message.sender.username}
              </p>
            )}

            {message.media_url && message.media_type === "image" && (
              <div className="p-1">
                <img 
                  src={message.media_url} 
                  alt="Shared image" 
                  className="max-w-full max-h-72 object-cover rounded cursor-pointer"
                  onClick={handleDownload}
                />
              </div>
            )}
            
            {message.media_url && message.media_type === "video" && (
              <div className="p-1">
                <video 
                  src={message.media_url} 
                  controls 
                  className="max-w-full max-h-72 rounded"
                />
              </div>
            )}

            {message.media_url && message.media_type === "document" && (
              <div className={cn(
                "px-3 py-2 flex items-center gap-3 min-w-[200px]",
                isSent ? "bg-[hsl(var(--wa-outgoing))]" : "bg-[hsl(var(--wa-incoming))]"
              )}>
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <FileIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileName}</p>
                  <p className="text-xs text-muted-foreground">{fileExtension}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}

            {message.content && (
              <div className="px-3 py-2 pb-4">
                <p className="text-sm break-words leading-relaxed">{message.content}</p>
              </div>
            )}

            {/* Timestamp and status - WhatsApp style (inside bubble, bottom right) */}
            <div className={cn(
              "absolute bottom-1 right-2 flex items-center gap-1",
              message.media_url && !message.content ? "bg-black/40 rounded px-1.5 py-0.5" : ""
            )}>
              <span className={cn(
                "text-[10px]",
                message.media_url && !message.content 
                  ? "text-white" 
                  : "text-muted-foreground"
              )}>
                {format(new Date(message.created_at), "HH:mm", { locale: vi })}
              </span>
              
              {isSent && (
                <span className={cn(
                  "transition-colors duration-200",
                  message.media_url && !message.content 
                    ? "text-white" 
                    : isRead ? "text-[hsl(var(--wa-double-tick))]" : "text-muted-foreground"
                )}>
                  <CheckCheck className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </div>

          {/* Reactions display */}
          <MessageReactions
            reactions={reactions}
            onToggleReaction={(emoji) => onToggleReaction?.(message.id, emoji)}
            isSent={isSent}
          />
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tin nhắn?</AlertDialogTitle>
            <AlertDialogDescription>
              Tin nhắn này sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleteLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleteLoading ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
