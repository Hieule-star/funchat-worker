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
import { Search, MessageCircle, Phone, User, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NewConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated?: (conversationId: string) => void;
}

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export default function NewConversationModal({
  open,
  onOpenChange,
  onConversationCreated,
}: NewConversationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [phoneQuery, setPhoneQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchFriends();
    }
  }, [open, user]);

  const fetchFriends = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("friendships")
      .select("*")
      .eq("status", "accepted")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (error) {
      console.error("Error fetching friends:", error);
      return;
    }

    const friendIds = data?.map(f => 
      f.user_id === user.id ? f.friend_id : f.user_id
    ) || [];

    if (friendIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, phone_number")
        .in("id", friendIds);

      setFriends((profiles as UserProfile[]) || []);
    } else {
      setFriends([]);
    }
  };

  // Search users by username (no friendship required)
  const searchByUsername = async (query: string) => {
    if (!user || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, phone_number")
      .ilike("username", `%${query}%`)
      .neq("id", user.id)
      .limit(20);

    if (error) {
      console.error("Error searching users:", error);
    } else {
      setSearchResults((data as UserProfile[]) || []);
    }
    setSearching(false);
  };

  // Search users by phone number
  const searchByPhone = async (phone: string) => {
    if (!user || phone.length < 9) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    
    // Normalize phone number - remove leading 0 and add country code if not present
    let normalizedPhone = phone.replace(/\D/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = normalizedPhone.substring(1);
    }
    
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, phone_number")
      .or(`phone_number.ilike.%${normalizedPhone}%,phone_number.ilike.%${phone}%`)
      .neq("id", user.id)
      .limit(20);

    if (error) {
      console.error("Error searching by phone:", error);
    } else {
      setSearchResults((data as UserProfile[]) || []);
    }
    setSearching(false);
  };

  // Create or open conversation (no friendship check - WhatsApp-like)
  const createOrOpenConversation = async (targetUserId: string) => {
    if (!user) return;

    try {
      setLoading(true);

      // Use RPC function to create conversation with participants
      const { data: conversationId, error } = await supabase.rpc(
        'create_conversation_with_participants',
        {
          target_user_id: targetUserId
        }
      );

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã tạo cuộc trò chuyện mới",
      });

      onOpenChange(false);
      if (onConversationCreated) {
        onConversationCreated(conversationId);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo cuộc trò chuyện",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserList = (users: UserProfile[], emptyMessage: string, emptySubMessage?: string) => {
    if (searching) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>{emptyMessage}</p>
          {emptySubMessage && <p className="text-sm mt-1">{emptySubMessage}</p>}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {users.map((userProfile) => (
          <button
            key={userProfile.id}
            onClick={() => createOrOpenConversation(userProfile.id)}
            disabled={loading}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={userProfile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userProfile.username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <span className="font-medium block">{userProfile.username}</span>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cuộc trò chuyện mới</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Bạn bè</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Tìm kiếm</span>
            </TabsTrigger>
            <TabsTrigger value="phone" className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">SĐT</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Lọc bạn bè..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[300px] pr-4">
              {renderUserList(
                filteredFriends, 
                "Không có bạn bè",
                "Hãy kết bạn hoặc tìm kiếm người dùng mới!"
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="search" className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo username..."
                onChange={(e) => {
                  const value = e.target.value;
                  searchByUsername(value);
                }}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[300px] pr-4">
              {renderUserList(
                searchResults,
                "Nhập tên để tìm kiếm",
                "Tìm và chat với bất kỳ ai!"
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="phone" className="space-y-4 mt-4">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nhập số điện thoại..."
                value={phoneQuery}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setPhoneQuery(value);
                  searchByPhone(value);
                }}
                className="pl-10"
                type="tel"
              />
            </div>

            <ScrollArea className="h-[300px] pr-4">
              {renderUserList(
                searchResults,
                "Nhập số điện thoại để tìm",
                "Tìm người dùng theo số điện thoại!"
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
