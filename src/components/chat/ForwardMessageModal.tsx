import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, Send, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: {
    id: string;
    content: string | null;
    media_url?: string | null;
    media_type?: string | null;
    sender?: {
      username: string;
    };
  } | null;
  conversations: Conversation[];
  onForward: (conversationId: string, message: any) => Promise<void>;
}

export function ForwardMessageModal({
  isOpen,
  onClose,
  message,
  conversations,
  onForward,
}: ForwardMessageModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isForwarding, setIsForwarding] = useState(false);

  const filteredConversations = conversations.filter((conv) =>
    conv.otherUser.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleForward = async () => {
    if (!selectedConversation || !message) return;

    setIsForwarding(true);
    try {
      await onForward(selectedConversation, message);
      onClose();
      setSelectedConversation(null);
      setSearchQuery("");
    } finally {
      setIsForwarding(false);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedConversation(null);
    setSearchQuery("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chuyển tiếp tin nhắn</DialogTitle>
        </DialogHeader>

        {/* Message Preview */}
        {message && (
          <div className="bg-muted/50 rounded-lg p-3 mb-4">
            <p className="text-xs text-muted-foreground mb-1">
              Từ: {message.sender?.username || "Bạn"}
            </p>
            <p className="text-sm line-clamp-2">
              {message.content || (message.media_type ? `[${message.media_type}]` : "[Media]")}
            </p>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm cuộc trò chuyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Conversations List */}
        <ScrollArea className="h-[300px] -mx-6 px-6">
          <div className="space-y-1">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  selectedConversation === conv.id
                    ? "bg-primary/10 border border-primary"
                    : "hover:bg-muted"
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={conv.otherUser.avatar_url || undefined} />
                  <AvatarFallback>
                    {conv.otherUser.username?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-left font-medium">
                  {conv.otherUser.username || "Unknown"}
                </span>
                {selectedConversation === conv.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </button>
            ))}

            {filteredConversations.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Không tìm thấy cuộc trò chuyện
              </p>
            )}
          </div>
        </ScrollArea>

        {/* Forward Button */}
        <Button
          onClick={handleForward}
          disabled={!selectedConversation || isForwarding}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {isForwarding ? "Đang gửi..." : "Chuyển tiếp"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
