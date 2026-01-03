import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PinnedMessage {
  id: string;
  message_id: string;
  conversation_id: string;
  pinned_by: string;
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

export function usePinnedMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [pinnedMessageIds, setPinnedMessageIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Fetch pinned messages
  const fetchPinnedMessages = useCallback(async () => {
    if (!conversationId || !user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("pinned_messages")
        .select(`
          *,
          message:messages(
            id,
            content,
            media_type,
            media_url,
            created_at,
            sender:profiles(id, username, avatar_url)
          )
        `)
        .eq("conversation_id", conversationId)
        .order("pinned_at", { ascending: false });

      if (error) throw error;

      setPinnedMessages(data || []);
      setPinnedMessageIds(new Set(data?.map(p => p.message_id) || []));
    } catch (error) {
      console.error("Error fetching pinned messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, user]);

  // Pin a message
  const pinMessage = useCallback(async (messageId: string) => {
    if (!conversationId || !user) return false;

    try {
      const { error } = await supabase
        .from("pinned_messages")
        .insert({
          message_id: messageId,
          conversation_id: conversationId,
          pinned_by: user.id,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error pinning message:", error);
      return false;
    }
  }, [conversationId, user]);

  // Unpin a message
  const unpinMessage = useCallback(async (messageId: string) => {
    if (!conversationId || !user) return false;

    try {
      const { error } = await supabase
        .from("pinned_messages")
        .delete()
        .eq("message_id", messageId)
        .eq("conversation_id", conversationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error unpinning message:", error);
      return false;
    }
  }, [conversationId, user]);

  // Toggle pin status
  const togglePin = useCallback(async (messageId: string) => {
    const isPinned = pinnedMessageIds.has(messageId);
    if (isPinned) {
      return unpinMessage(messageId);
    } else {
      return pinMessage(messageId);
    }
  }, [pinnedMessageIds, pinMessage, unpinMessage]);

  // Check if message is pinned
  const isMessagePinned = useCallback((messageId: string) => {
    return pinnedMessageIds.has(messageId);
  }, [pinnedMessageIds]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!conversationId) return;

    fetchPinnedMessages();

    const channel = supabase
      .channel(`pinned-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pinned_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          fetchPinnedMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchPinnedMessages]);

  return {
    pinnedMessages,
    pinnedMessageIds,
    isLoading,
    pinMessage,
    unpinMessage,
    togglePin,
    isMessagePinned,
    fetchPinnedMessages,
  };
}
