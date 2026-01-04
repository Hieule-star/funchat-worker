import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  MessageSquare, 
  Heart, 
  Users, 
  Loader2,
  LayoutGrid,
  FileText,
  Award,
  Activity
} from "lucide-react";
import EditProfileModal from "@/components/EditProfileModal";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ReputationBar } from "@/components/profile/ReputationBar";
import { BadgesSection } from "@/components/profile/BadgesSection";
import { SocialLinks } from "@/components/profile/SocialLinks";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  id: string;
  username: string;
  bio: string;
  avatar_url: string;
  cover_url?: string;
  job_title?: string;
  location?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_tiktok?: string;
  social_twitter?: string;
  social_website?: string;
  badges?: any[];
  reputation_score?: number;
}

interface StatsData {
  friendsCount: number;
  messagesCount: number;
}

interface ActivityItem {
  id: string;
  reward_type: string;
  amount: number;
  description: string;
  created_at: string;
}

export default function Profile() {
  const { user, profile: authProfile } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<StatsData>({
    friendsCount: 0,
    messagesCount: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch full profile data
      const { data: fullProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfileData(fullProfile as ProfileData);

      // Count friends (accepted friendships)
      const { count: friendsCount } = await supabase
        .from("friendships")
        .select("*", { count: "exact", head: true })
        .eq("status", "accepted")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      // Count messages sent
      const { count: messagesCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("sender_id", user.id);

      setStats({
        friendsCount: friendsCount || 0,
        messagesCount: messagesCount || 0,
      });

      // Fetch achievements (table doesn't exist yet - skip for now)
      // const { data: achievementsData } = await supabase
      //   .from("user_achievements")
      //   .select("*")
      //   .eq("user_id", user.id);
      // setAchievements(achievementsData || []);
      setAchievements([]);

    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: t("common.error"),
        description: t("profile.loadError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const getActivityIcon = (type: string) => {
    const icons: Record<string, any> = {
      registration: Users,
      message: MessageSquare,
      friend: Users,
      call: Activity,
    };
    return icons[type] || Activity;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profileData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6">
          <p className="text-muted-foreground">{t("profile.pleaseLogin")}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Profile Header */}
          <ProfileHeader
            profile={profileData}
            isOwnProfile={true}
            postsCount={0}
            friendsCount={stats.friendsCount}
            onEditClick={() => setEditModalOpen(true)}
            onCoverEditClick={() => setEditModalOpen(true)}
          />

          {/* Reputation Bar */}
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <ReputationBar score={profileData.reputation_score || 0} />
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { icon: Users, label: t("profile.friends"), value: stats.friendsCount, color: "text-blue-500" },
              { icon: MessageSquare, label: t("profile.messages"), value: stats.messagesCount, color: "text-primary" },
              { icon: Heart, label: t("profile.calls"), value: 0, color: "text-red-500" },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="border-primary/20">
                  <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                    <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="gap-1 text-xs sm:text-sm">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">{t("profile.overview")}</span>
              </TabsTrigger>
              <TabsTrigger value="friends" className="gap-1 text-xs sm:text-sm">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">{t("profile.friends")}</span>
              </TabsTrigger>
              <TabsTrigger value="badges" className="gap-1 text-xs sm:text-sm">
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">{t("profile.badges")}</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Social Links */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      {t("profile.socialLinks")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SocialLinks
                      facebook={profileData.social_facebook}
                      instagram={profileData.social_instagram}
                      twitter={profileData.social_twitter}
                      tiktok={profileData.social_tiktok}
                      website={profileData.social_website}
                    />
                  </CardContent>
                </Card>

                {/* About */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {t("profile.about")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {profileData.bio || t("profile.noBio")}
                    </p>
                    {profileData.job_title && (
                      <p className="mt-2 text-sm">
                        <span className="font-medium">{t("profile.job")}:</span> {profileData.job_title}
                      </p>
                    )}
                    {profileData.location && (
                      <p className="text-sm">
                        <span className="font-medium">{t("profile.location")}:</span> {profileData.location}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Friends Tab */}
            <TabsContent value="friends" className="mt-6">
              <Card className="border-primary/20">
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">{t("friends.manageFriends")}</p>
                  <a href="/friends" className="text-primary hover:underline">
                    {t("friends.viewFriends")} →
                  </a>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Badges Tab */}
            <TabsContent value="badges" className="mt-6">
              <BadgesSection badges={profileData.badges || []} achievements={achievements} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <EditProfileModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        currentUsername={profileData.username || ""}
        currentBio={profileData.bio || ""}
        currentAvatarUrl={profileData.avatar_url || ""}
        currentCoverUrl={profileData.cover_url || ""}
        currentJobTitle={profileData.job_title || ""}
        currentLocation={profileData.location || ""}
        currentSocialFacebook={profileData.social_facebook || ""}
        currentSocialInstagram={profileData.social_instagram || ""}
        currentSocialTiktok={profileData.social_tiktok || ""}
        currentSocialTwitter={profileData.social_twitter || ""}
        currentSocialWebsite={profileData.social_website || ""}
        onProfileUpdate={fetchUserData}
      />
    </div>
  );
}