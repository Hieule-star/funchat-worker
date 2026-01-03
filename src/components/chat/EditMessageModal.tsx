import { useState } from "react";
import {
  Dialog,
  DialogContent,
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

  const handleSave = async () => {
    if (!message || !content.trim()) return;
    
    setIsLoading(true);
    try {
      await onSave(message.id, content.trim());
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  // Update content when message changes
  if (message?.content !== undefined && content !== message.content && !isLoading) {
    setContent(message.content || "");
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa tin nhắn</DialogTitle>
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
