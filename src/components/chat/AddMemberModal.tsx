import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  existingMemberIds: string[];
  onMemberAdded?: () => void;
}

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export default function AddMemberModal({
  open,
  onOpenChange,
  conversationId,
  existingMemberIds,
  onMemberAdded,
}: AddMemberModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      fetchFriends();
    }
  }, [open, user]);

  const fetchFriends = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("friendships")
      .select("*")
      .eq("status", "accepted")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (error) {
      console.error("Error fetching friends:", error);
      setLoading(false);
      return;
    }

    const friendIds = data?.map(f => 
      f.user_id === user.id ? f.friend_id : f.user_id
    ) || [];

    // Filter out existing members
    const availableFriendIds = friendIds.filter(id => !existingMemberIds.includes(id));

    if (availableFriendIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", availableFriendIds);

      setFriends((profiles as UserProfile[]) || []);
    } else {
      setFriends([]);
    }
    setLoading(false);
  };

  const handleAddMember = async (userId: string) => {
    try {
      setAddingId(userId);
      // Using type assertion as the function was just created
      const { error } = await (supabase.rpc as any)('add_group_member', {
        _conversation_id: conversationId,
        _user_id: userId
      });

      if (error) throw error;

      toast({
        title: t("group.success"),
        description: t("group.memberAdded"),
      });

      // Remove from list and notify parent
      setFriends(prev => prev.filter(f => f.id !== userId));
      onMemberAdded?.();
    } catch (error) {
      console.error("Error adding member:", error);
      toast({
        title: t("group.error"),
        description: t("group.addFailed"),
        variant: "destructive",
      });
    } finally {
      setAddingId(null);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t("group.addMember")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("group.searchFriends")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Friends list */}
          <ScrollArea className="h-[300px] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{t("group.noFriendsToAdd")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={friend.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {friend.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium flex-1">{friend.username}</span>
                    <Button
                      size="sm"
                      onClick={() => handleAddMember(friend.id)}
                      disabled={addingId === friend.id}
                    >
                      {addingId === friend.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-1" />
                          {t("group.add")}
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
