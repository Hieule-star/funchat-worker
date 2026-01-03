import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePresence } from "@/hooks/usePresence";
import { useSoundSettings } from "@/hooks/useSoundSettings";
import { useConversationsTyping } from "@/hooks/useConversationsTyping";
import ConversationItem from "./ConversationItem";
import { Button } from "@/components/ui/button";
import { Search, MoreVertical, MessageSquarePlus, Camera, Users, Volume2, VolumeX } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import NewConversationModal from "./NewConversationModal";

interface ChatSidebarProps {
  selectedConversation: any;
  onSelectConversation: (conversation: any) => void;
}

export default function ChatSidebar({
  selectedConversation,
  onSelectConversation,
}: ChatSidebarProps) {
  const { user, profile } = useAuth();
  const { onlineUsers } = usePresence(user?.id);
  const { messageNotificationEnabled, toggleMessageNotification } = useSoundSettings();
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  
  // Get typing state for all conversations
  const conversationIds = conversations.map(c => c.id);
  const { getTypingUsers } = useConversationsTyping(conversationIds, user?.id);

  // Extracted fetchConversations to be callable from handleConversationCreated
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("conversation_participants")
      .select(`
        conversation_id,
        conversations (
          id,
          created_at,
          updated_at
        )
      `)
      .eq("user_id", user.id);

    if (!error && data) {
      const conversationsWithDetails = await Promise.all(
        data.map(async (item: any) => {
          const { data: participants } = await supabase
            .from("conversation_participants")
            .select(`
              user_id,
              profiles (id, username, avatar_url, last_seen, is_online)
            `)
            .eq("conversation_id", item.conversations.id)
            .neq("user_id", user.id);

          const { data: lastMessage } = await supabase
            .from("messages")
            .select("content, created_at, media_type")
            .eq("conversation_id", item.conversations.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          // Fetch unread count - only count messages from other users that are unread
          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", item.conversations.id)
            .eq("is_read", false)
            .neq("sender_id", user.id);

          return {
            ...item.conversations,
            participants: participants || [],
            lastMessage,
            unreadCount: unreadCount || 0,
          };
        })
      );

      // Sort by last message time
      conversationsWithDetails.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.created_at;
        const bTime = b.lastMessage?.created_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setConversations(conversationsWithDetails);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchConversations();

    // Subscribe to conversations, participants, and messages changes
    const channel = supabase
      .channel("conversations-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => fetchConversations()
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_participants",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchConversations()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  const handleConversationCreated = async (conversationId: string) => {
    // Refetch all conversations to update the sidebar
    await fetchConversations();

    // Fetch the newly created conversation details
    const { data: conversation } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (conversation) {
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select(`
          user_id,
          profiles (id, username, avatar_url)
        `)
        .eq("conversation_id", conversationId)
        .neq("user_id", user?.id);

      // Select the new conversation
      onSelectConversation({
        ...conversation,
        participants: participants || [],
        lastMessage: null,
      });
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.participants.some((p: any) =>
      p.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="w-80 border-r border-border bg-[hsl(var(--wa-sidebar-bg))] flex flex-col">
      {/* WhatsApp-style Header */}
      <div className="h-14 bg-[hsl(var(--wa-header-bg))] px-4 flex items-center justify-between">
        {/* User avatar */}
        <Avatar className="h-10 w-10 cursor-pointer">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">
            {profile?.username?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-primary-foreground hover:bg-white/10"
          >
            <Users className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-primary-foreground hover:bg-white/10"
          >
            <Camera className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowNewConversationModal(true)}
            className="text-primary-foreground hover:bg-white/10"
          >
            <MessageSquarePlus className="h-5 w-5" />
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
            <DropdownMenuContent align="end" className="w-56 bg-card">
              <DropdownMenuItem onClick={toggleMessageNotification} className="flex items-center gap-2">
                {messageNotificationEnabled ? (
                  <>
                    <Volume2 className="h-4 w-4" />
                    <span>Âm thanh thông báo: Bật</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4" />
                    <span>Âm thanh thông báo: Tắt</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Nhóm mới</DropdownMenuItem>
              <DropdownMenuItem>Tin nhắn mới</DropdownMenuItem>
              <DropdownMenuItem>Tin nhắn có gắn dấu sao</DropdownMenuItem>
              <DropdownMenuItem>Cài đặt</DropdownMenuItem>
              <DropdownMenuItem>Đăng xuất</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
        
      {/* Search Bar */}
      <div className="px-2 py-2 bg-[hsl(var(--wa-sidebar-bg))]">
        <div className="relative flex items-center bg-muted rounded-lg">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm hoặc bắt đầu cuộc trò chuyện mới"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <MessageSquarePlus className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium">Chưa có cuộc trò chuyện nào</p>
            <p className="text-sm mt-1">Nhấn nút + để bắt đầu chat</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedConversation?.id === conversation.id}
              onClick={() => {
                onSelectConversation(conversation);
                // Optimistic update: reset unread count immediately
                setConversations(prev => 
                  prev.map(c => 
                    c.id === conversation.id 
                      ? { ...c, unreadCount: 0 } 
                      : c
                  )
                );
              }}
              onlineUsers={onlineUsers}
              typingUsers={getTypingUsers(conversation.id)}
            />
          ))
        )}
      </ScrollArea>

      <NewConversationModal
        open={showNewConversationModal}
        onOpenChange={setShowNewConversationModal}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
}
