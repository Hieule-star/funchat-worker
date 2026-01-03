import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ReactionData {
  reaction: string;
  count: number;
  hasReacted: boolean;
}

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
}

export function useMessageReactions(conversationId: string | null) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Record<string, ReactionData[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch reactions for all messages in conversation
  const fetchReactions = useCallback(async (messageIds: string[]) => {
    if (!messageIds.length || !user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("message_reactions")
        .select("*")
        .in("message_id", messageIds);

      if (error) throw error;

      // Group reactions by message
      const groupedReactions: Record<string, ReactionData[]> = {};

      messageIds.forEach(messageId => {
        const messageReactions = data?.filter(r => r.message_id === messageId) || [];
        const reactionCounts: Record<string, { count: number; hasReacted: boolean }> = {};

        messageReactions.forEach((r: MessageReaction) => {
          if (!reactionCounts[r.reaction]) {
            reactionCounts[r.reaction] = { count: 0, hasReacted: false };
          }
          reactionCounts[r.reaction].count++;
          if (r.user_id === user.id) {
            reactionCounts[r.reaction].hasReacted = true;
          }
        });

        groupedReactions[messageId] = Object.entries(reactionCounts).map(
          ([reaction, data]) => ({
            reaction,
            count: data.count,
            hasReacted: data.hasReacted,
          })
        );
      });

      setReactions(groupedReactions);
    } catch (error) {
      console.error("Error fetching reactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Toggle reaction
  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;

    // Check if user already reacted with this emoji
    const currentReactions = reactions[messageId] || [];
    const existingReaction = currentReactions.find(
      r => r.reaction === emoji && r.hasReacted
    );

    try {
      if (existingReaction) {
        // Remove reaction
        await supabase
          .from("message_reactions")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", user.id)
          .eq("reaction", emoji);
      } else {
        // Add reaction
        await supabase
          .from("message_reactions")
          .insert({
            message_id: messageId,
            user_id: user.id,
            reaction: emoji,
          });
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  }, [user, reactions]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`reactions-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        async (payload) => {
          // Refetch reactions for affected message
          const messageId = (payload.new as any)?.message_id || (payload.old as any)?.message_id;
          if (messageId) {
            const { data, error } = await supabase
              .from("message_reactions")
              .select("*")
              .eq("message_id", messageId);

            if (!error && data) {
              const reactionCounts: Record<string, { count: number; hasReacted: boolean }> = {};

              data.forEach((r: MessageReaction) => {
                if (!reactionCounts[r.reaction]) {
                  reactionCounts[r.reaction] = { count: 0, hasReacted: false };
                }
                reactionCounts[r.reaction].count++;
                if (r.user_id === user?.id) {
                  reactionCounts[r.reaction].hasReacted = true;
                }
              });

              setReactions(prev => ({
                ...prev,
                [messageId]: Object.entries(reactionCounts).map(
                  ([reaction, data]) => ({
                    reaction,
                    count: data.count,
                    hasReacted: data.hasReacted,
                  })
                ),
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id]);

  return {
    reactions,
    fetchReactions,
    toggleReaction,
    isLoading,
  };
}
