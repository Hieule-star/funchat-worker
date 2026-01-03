import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface UseFollowersOptions {
  userId: string;
}

// Note: followers table doesn't exist yet - returning stub data
export function useFollowers({ userId }: UseFollowersOptions) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [followersCount] = useState(0);
  const [followingCount] = useState(0);
  const [isFollowing] = useState(false);
  const [loading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFollowData = useCallback(async () => {
    // followers table doesn't exist yet
    return;
  }, [userId, user]);

  const toggleFollow = async () => {
    if (!user) {
      toast({
        title: "Thông báo",
        description: "Vui lòng đăng nhập để theo dõi",
        variant: "destructive",
      });
      return;
    }

    if (user.id === userId) {
      return;
    }

    setActionLoading(true);
    // followers table doesn't exist yet - show placeholder message
    toast({
      title: "Thông báo",
      description: "Tính năng theo dõi đang được phát triển",
    });
    setActionLoading(false);
  };

  return {
    followersCount,
    followingCount,
    isFollowing,
    loading,
    actionLoading,
    toggleFollow,
    refetch: fetchFollowData,
  };
}
