import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, Smile, Paperclip, Mic, FileText, Camera, Image, File } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatInputProps {
  onSendMessage: (content: string, mediaUrl?: string, mediaType?: string) => void;
  onTyping?: (isTyping: boolean) => void;
}

export default function ChatInput({ onSendMessage, onTyping }: ChatInputProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (onTyping && value.length > 0) {
      onTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1000);
    } else if (onTyping && value.length === 0) {
      onTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4000 * 1024 * 1024) {
      toast({
        title: "File quá lớn",
        description: "Vui lòng chọn file nhỏ hơn 4000MB (4GB)",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
    
    setShowPreview(true);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleConfirmSend = async () => {
    if (!selectedFile) return;
    
    setShowPreview(false);
    
    const result = await uploadFile(selectedFile);
    if (result) {
      onSendMessage(message.trim(), result.url, result.type);
      setMessage("");
      
      if (onTyping) {
        onTyping(false);
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
    
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const uploadFile = async (file: globalThis.File): Promise<{ url: string; type: string } | null> => {
    try {
      setUploading(true);

      const { data, error } = await supabase.functions.invoke("generate-presigned-url", {
        body: {
          fileName: file.name,
          fileType: file.type,
          folder: "chat"
        }
      });

      if (error) throw error;
      
      if (!data.presignedUrl) {
        throw new Error("No presigned URL received from server");
      }

      console.log("Uploading to R2:", data.presignedUrl);

      const uploadResponse = await fetch(data.presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type
        }
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");

      const mediaType = file.type.startsWith("image/") ? "image" : 
                       file.type.startsWith("video/") ? "video" : "document";

      return { url: data.publicUrl, type: mediaType };
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Lỗi tải file",
        description: "Không thể tải file lên. Vui lòng thử lại.",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    onSendMessage(message.trim());
    setMessage("");
    
    if (onTyping) {
      onTyping(false);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const hasText = message.trim().length > 0;

  return (
    <>
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Xem trước file</DialogTitle>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-auto flex items-center justify-center bg-muted rounded-lg p-4">
            {selectedFile && (
              <>
                {selectedFile.type.startsWith("image/") && previewUrl && (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-w-full max-h-[50vh] object-contain rounded"
                  />
                )}
                
                {selectedFile.type.startsWith("video/") && previewUrl && (
                  <video 
                    src={previewUrl} 
                    controls 
                    className="max-w-full max-h-[50vh] rounded"
                  />
                )}
                
                {!selectedFile.type.startsWith("image/") && !selectedFile.type.startsWith("video/") && (
                  <div className="flex flex-col items-center gap-4 p-8">
                    <FileText className="h-20 w-20 text-muted-foreground" />
                    <div className="text-center">
                      <p className="font-medium text-lg">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {selectedFile.type || "Không xác định"}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelPreview}
              disabled={uploading}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSend}
              disabled={uploading}
              className="bg-primary hover:bg-primary/90"
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Gửi
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <form
        onSubmit={handleSubmit}
        className="bg-[hsl(var(--wa-chat-bg))] px-3 py-2"
      >
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="*/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Emoji button */}
          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            disabled={uploading}
            className="shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-transparent"
          >
            <Smile className="h-6 w-6" />
          </Button>

          {/* Attach dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon"
                disabled={uploading}
                className="shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-transparent"
              >
                <Paperclip className="h-6 w-6 rotate-45" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-card">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <File className="h-4 w-4 mr-2 text-purple-500" />
                Tài liệu
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Camera className="h-4 w-4 mr-2 text-red-500" />
                Camera
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Image className="h-4 w-4 mr-2 text-blue-500" />
                Thư viện
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Input field - WhatsApp style */}
          <div className="flex-1 bg-card rounded-3xl border border-border overflow-hidden">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn"
              rows={1}
              className="w-full px-4 py-2.5 text-sm bg-transparent resize-none outline-none max-h-[120px] min-h-[40px]"
              disabled={uploading}
            />
          </div>

          {/* Send or Mic button */}
          <Button 
            type={hasText ? "submit" : "button"}
            size="icon"
            disabled={uploading}
            className="shrink-0 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
          >
            {hasText ? (
              <Send className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
        </div>
      </form>
    </>
  );
}
