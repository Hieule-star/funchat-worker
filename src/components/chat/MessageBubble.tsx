import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { FileText, Download, FileArchive, FileSpreadsheet, FileCode, File, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageBubbleProps {
  message: any;
  isSent: boolean;
}

export default function MessageBubble({ message, isSent }: MessageBubbleProps) {
  const handleDownload = () => {
    if (message.media_url) {
      window.open(message.media_url, '_blank');
    }
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

  const fileName = message.media_url ? getFileName(message.media_url) : 'File';
  const fileExtension = message.media_url ? message.media_url.split('.').pop()?.toUpperCase() || '' : '';
  const FileIcon = message.media_url ? getFileIcon(message.media_url) : File;

  // Message status based on actual data
  // - Sent: message exists (always true if we're rendering it)
  // - Delivered: message is in database (always true for rendered messages)
  // - Read: is_read = true (recipient has opened the conversation)
  const isRead = message.is_read === true;

  return (
    <div className={cn("flex mb-1", isSent ? "justify-end" : "justify-start")}>
      <div className={cn("relative max-w-[75%] group")}>
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
          {/* Sender name for group chats (received messages only) */}
          {!isSent && message.sender?.username && (
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
                {isRead ? (
                  <CheckCheck className="h-3.5 w-3.5" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
