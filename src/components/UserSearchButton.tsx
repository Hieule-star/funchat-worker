import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  email: string | null;
}

export default function UserSearchButton() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("username");

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchUsers = async () => {
      setLoading(true);
      try {
        let searchQuery = supabase
          .from("profiles")
          .select("id, username, avatar_url, phone_number, email")
          .neq("id", user?.id || "");

        if (activeTab === "username") {
          searchQuery = searchQuery.ilike("username", `%${query}%`);
        } else if (activeTab === "email") {
          searchQuery = searchQuery.ilike("email", `%${query}%`);
        } else if (activeTab === "phone") {
          const normalizedPhone = query.replace(/\D/g, "");
          searchQuery = searchQuery.ilike("phone_number", `%${normalizedPhone}%`);
        }

        const { data, error } = await searchQuery.limit(10);

        if (error) throw error;
        setResults(data || []);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [query, activeTab, user?.id]);

  const handleUserClick = async (targetUser: UserProfile) => {
    if (!user) return;

    try {
      const { data: conversationId, error } = await supabase.rpc(
        "create_conversation_with_participants",
        { target_user_id: targetUser.id }
      );

      if (error) throw error;

      setOpen(false);
      setQuery("");
      setResults([]);
      navigate(`/?conversation=${conversationId}`);
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      toast.error(t("userSearch.error"));
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setQuery("");
    setResults([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Search className="h-4 w-4" />
          <span className="sr-only">{t("userSearch.search")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4">
          <h4 className="font-medium mb-3">{t("userSearch.title")}</h4>
          
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full mb-3">
              <TabsTrigger value="username" className="flex-1 text-xs">
                {t("userSearch.byUsername")}
              </TabsTrigger>
              <TabsTrigger value="email" className="flex-1 text-xs">
                {t("userSearch.byEmail")}
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex-1 text-xs">
                {t("userSearch.byPhone")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="username" className="mt-0">
              <Input
                placeholder={t("userSearch.usernamePlaceholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="mb-3"
              />
            </TabsContent>

            <TabsContent value="email" className="mt-0">
              <Input
                type="email"
                placeholder={t("userSearch.emailPlaceholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="mb-3"
              />
            </TabsContent>

            <TabsContent value="phone" className="mt-0">
              <Input
                placeholder={t("userSearch.phonePlaceholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="mb-3"
              />
            </TabsContent>
          </Tabs>

          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1">
                {results.map((userProfile) => (
                  <button
                    key={userProfile.id}
                    onClick={() => handleUserClick(userProfile)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={userProfile.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {userProfile.username?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {userProfile.username || t("userSearch.unknownUser")}
                      </p>
                      {userProfile.phone_number && (
                        <p className="text-xs text-muted-foreground truncate">
                          {userProfile.phone_number}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : query.trim() ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("userSearch.noResults")}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("userSearch.hint")}
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
