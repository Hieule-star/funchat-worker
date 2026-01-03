import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface TypingUser {
  userId: string;
  username: string;
  avatarUrl?: string;
}

// Map of conversationId -> array of typing users
type TypingState = Record<string, TypingUser[]>;

export const useConversationsTyping = (
  conversationIds: string[],
  currentUserId: string | undefined
) => {
  const [typingState, setTypingState] = useState<TypingState>({});
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());

  useEffect(() => {
    if (!currentUserId || conversationIds.length === 0) return;

    // Subscribe to typing for each conversation
    conversationIds.forEach((conversationId) => {
      // Skip if already subscribed
      if (channelsRef.current.has(conversationId)) return;

      const channelName = `typing:${conversationId}`;
      const channel = supabase.channel(channelName);

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const users: TypingUser[] = [];

          Object.keys(state).forEach((key) => {
            const presences = state[key];
            presences.forEach((presence: any) => {
              if (presence.userId !== currentUserId && presence.isTyping) {
                users.push({
                  userId: presence.userId,
                  username: presence.username,
                  avatarUrl: presence.avatarUrl,
                });
              }
            });
          });

          setTypingState((prev) => ({
            ...prev,
            [conversationId]: users,
          }));
        })
        .subscribe();

      channelsRef.current.set(conversationId, channel);
    });

    // Cleanup: remove channels that are no longer needed
    const currentIds = new Set(conversationIds);
    channelsRef.current.forEach((channel, id) => {
      if (!currentIds.has(id)) {
        supabase.removeChannel(channel);
        channelsRef.current.delete(id);
      }
    });

    return () => {
      // Cleanup all channels on unmount
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();
    };
  }, [conversationIds.join(","), currentUserId]);

  const getTypingUsers = (conversationId: string): TypingUser[] => {
    return typingState[conversationId] || [];
  };

  return { typingState, getTypingUsers };
};
