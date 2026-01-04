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
import { Search, Users, Loader2, Check, Camera, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated?: (conversationId: string) => void;
}

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export default function CreateGroupModal({
  open,
  onOpenChange,
  onGroupCreated,
}: CreateGroupModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState<"select" | "name">("select");

  useEffect(() => {
    if (open && user) {
      fetchFriends();
      // Reset state
      setSelectedMembers([]);
      setGroupName("");
      setStep("select");
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

    if (friendIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", friendIds);

      setFriends((profiles as UserProfile[]) || []);
    } else {
      setFriends([]);
    }
    setLoading(false);
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleNext = () => {
    if (selectedMembers.length < 1) {
      toast({
        title: t("group.error"),
        description: t("group.minMembers"),
        variant: "destructive",
      });
      return;
    }
    setStep("name");
  };

  const handleBack = () => {
    setStep("select");
  };

  const handleCreateGroup = async () => {
    if (!user) return;
    if (!groupName.trim()) {
      toast({
        title: t("group.error"),
        description: t("group.nameRequired"),
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);

      // Using type assertion as the function was just created
      const { data: conversationId, error } = await (supabase.rpc as any)(
        'create_group_conversation',
        {
          group_name: groupName.trim(),
          member_ids: selectedMembers,
          avatar_url: null
        }
      );

      if (error) throw error;

      toast({
        title: t("group.success"),
        description: t("group.created"),
      });

      onOpenChange(false);
      if (onGroupCreated && conversationId) {
        onGroupCreated(conversationId as string);
      }
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: t("group.error"),
        description: t("group.createFailed"),
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProfiles = friends.filter(f => selectedMembers.includes(f.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {step === "select" ? t("group.addMembers") : t("group.createGroup")}
          </DialogTitle>
        </DialogHeader>

        {step === "select" ? (
          <div className="space-y-4">
            {/* Selected members chips */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedProfiles.map(member => (
                  <Badge 
                    key={member.id} 
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-1"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {member.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{member.username}</span>
                    <button 
                      onClick={() => toggleMember(member.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

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
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t("group.noFriends")}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredFriends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => toggleMember(friend.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Checkbox 
                        checked={selectedMembers.includes(friend.id)}
                        className="pointer-events-none"
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={friend.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {friend.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{friend.username}</span>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Next button */}
            <Button 
              onClick={handleNext}
              disabled={selectedMembers.length < 1}
              className="w-full"
            >
              {t("group.next")} ({selectedMembers.length} {t("group.selected")})
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Group avatar and name */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    <Users className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <button className="absolute -bottom-1 -right-1 p-1 bg-primary text-primary-foreground rounded-full">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <Input
                placeholder={t("group.groupNamePlaceholder")}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="flex-1"
                autoFocus
              />
            </div>

            {/* Selected members preview */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {t("group.participants")}: {selectedMembers.length + 1}
              </p>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {/* Current user as admin */}
                  <div className="flex items-center gap-3 p-2">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {t("group.you")[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="font-medium">{t("group.you")}</span>
                    </div>
                    <Badge variant="default">{t("group.admin")}</Badge>
                  </div>
                  {selectedProfiles.map(member => (
                    <div key={member.id} className="flex items-center gap-3 p-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {member.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.username}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                {t("group.back")}
              </Button>
              <Button 
                onClick={handleCreateGroup}
                disabled={creating || !groupName.trim()}
                className="flex-1"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("group.create")
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
