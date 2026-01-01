import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Users, 
  Video,
  Phone,
  MessageSquare
} from "lucide-react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ReputationBar } from "@/components/profile/ReputationBar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useParams, useNavigate } from "react-router-dom";

interface UserProfileData {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  cover_url?: string;
  job_title?: string;
  location?: string;
  reputation_score?: number;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [friendsCount, setFriendsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId === user?.id) {
      navigate("/profile");
      return;
    }
    if (userId) fetchUserProfile();
  }, [userId, user]);

  const fetchUserProfile = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw error;
      setProfile(profileData as UserProfileData);

      const { count } = await supabase
        .from("friendships")
        .select("*", { count: "exact", head: true })
        .eq("status", "accepted")
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);
      setFriendsCount(count || 0);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast({ title: "Lỗi", description: "Không thể tải profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6"><p className="text-muted-foreground">Không tìm thấy người dùng</p></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <ProfileHeader
          profile={profile}
          isOwnProfile={false}
          postsCount={0}
          friendsCount={friendsCount}
          onEditClick={() => {}}
          onCoverEditClick={() => {}}
        />

        <Card className="border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-4">
              <Button onClick={() => navigate(`/chat`)} className="bg-primary">
                <MessageSquare className="h-4 w-4 mr-2" />Nhắn tin
              </Button>
              <Button variant="outline" onClick={() => navigate(`/call?channel=user-${userId}`)}>
                <Video className="h-4 w-4 mr-2" />Gọi Video
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <ReputationBar score={profile.reputation_score || 0} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="border-primary/20">
            <CardContent className="flex flex-col items-center py-6">
              <Users className="h-8 w-8 text-blue-500" />
              <p className="mt-2 text-2xl font-bold">{friendsCount}</p>
              <p className="text-sm text-muted-foreground">Bạn bè</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardContent className="flex flex-col items-center py-6">
              <MessageSquare className="h-8 w-8 text-primary" />
              <p className="mt-2 text-2xl font-bold">Chat</p>
              <p className="text-sm text-muted-foreground">Nhắn tin ngay</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}