import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface EditMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: {
    id: string;
    content: string | null;
  } | null;
  onSave: (messageId: string, newContent: string) => Promise<void>;
}

export default function EditMessageModal({
  isOpen,
  onClose,
  message,
  onSave,
}: EditMessageModalProps) {
  const [content, setContent] = useState(message?.content || "");
  const [isLoading, setIsLoading] = useState(false);

  // Update content when message changes
  useEffect(() => {
    if (message?.content !== undefined) {
      setContent(message.content || "");
    }
  }, [message]);

  // Reset content when modal closes
  useEffect(() => {
    if (!isOpen) {
      setContent("");
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!message || !content.trim()) return;
    
    setIsLoading(true);
    try {
      await onSave(message.id, content.trim());
      onClose();
    } catch (error) {
      console.error("Error saving message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa tin nhắn</DialogTitle>
          <DialogDescription>
            Chỉnh sửa nội dung tin nhắn của bạn
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập nội dung tin nhắn..."
            className="min-h-[100px] resize-none"
            autoFocus
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !content.trim()}
          >
            {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
