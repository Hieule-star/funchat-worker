import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  User, 
  Link, 
  Facebook, 
  Instagram, 
  Twitter, 
  Globe,
  Music2,
  Camera,
  X
} from "lucide-react";
import { useDirectUpload } from "@/hooks/useDirectUpload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileData {
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
}

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUsername: string;
  currentBio: string;
  currentAvatarUrl: string;
  currentCoverUrl?: string;
  currentJobTitle?: string;
  currentLocation?: string;
  currentSocialFacebook?: string;
  currentSocialInstagram?: string;
  currentSocialTiktok?: string;
  currentSocialTwitter?: string;
  currentSocialWebsite?: string;
  onProfileUpdate: () => void;
}

export default function EditProfileModal({
  open,
  onOpenChange,
  currentUsername,
  currentBio,
  currentAvatarUrl,
  currentCoverUrl = "",
  currentJobTitle = "",
  currentLocation = "",
  currentSocialFacebook = "",
  currentSocialInstagram = "",
  currentSocialTiktok = "",
  currentSocialTwitter = "",
  currentSocialWebsite = "",
  onProfileUpdate,
}: EditProfileModalProps) {
  const [username, setUsername] = useState(currentUsername);
  const [bio, setBio] = useState(currentBio);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [coverUrl, setCoverUrl] = useState(currentCoverUrl);
  const [jobTitle, setJobTitle] = useState(currentJobTitle);
  const [location, setLocation] = useState(currentLocation);
  const [socialFacebook, setSocialFacebook] = useState(currentSocialFacebook);
  const [socialInstagram, setSocialInstagram] = useState(currentSocialInstagram);
  const [socialTiktok, setSocialTiktok] = useState(currentSocialTiktok);
  const [socialTwitter, setSocialTwitter] = useState(currentSocialTwitter);
  const [socialWebsite, setSocialWebsite] = useState(currentSocialWebsite);
  
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setUsername(currentUsername);
      setBio(currentBio);
      setAvatarUrl(currentAvatarUrl);
      setCoverUrl(currentCoverUrl);
      setJobTitle(currentJobTitle);
      setLocation(currentLocation);
      setSocialFacebook(currentSocialFacebook);
      setSocialInstagram(currentSocialInstagram);
      setSocialTiktok(currentSocialTiktok);
      setSocialTwitter(currentSocialTwitter);
      setSocialWebsite(currentSocialWebsite);
    }
  }, [open, currentUsername, currentBio, currentAvatarUrl, currentCoverUrl, currentJobTitle, currentLocation, currentSocialFacebook, currentSocialInstagram, currentSocialTiktok, currentSocialTwitter, currentSocialWebsite]);

  const { upload } = useDirectUpload();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const result = await upload(file);
      if (result.success && result.cdnUrl) {
        setAvatarUrl(result.cdnUrl);
        toast({
          title: t("profile.uploadSuccess"),
          description: t("profile.avatarUploaded"),
        });
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: t("common.error"),
        description: t("profile.uploadError"),
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      const result = await upload(file);
      if (result.success && result.cdnUrl) {
        setCoverUrl(result.cdnUrl);
        toast({
          title: t("profile.uploadSuccess"),
          description: t("profile.coverUploaded"),
        });
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading cover:", error);
      toast({
        title: t("common.error"),
        description: t("profile.uploadError"),
        variant: "destructive",
      });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: t("common.error"),
          description: t("profile.pleaseLogin"),
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          username,
          bio,
          avatar_url: avatarUrl,
          cover_url: coverUrl,
          job_title: jobTitle,
          location,
          social_facebook: socialFacebook,
          social_instagram: socialInstagram,
          social_tiktok: socialTiktok,
          social_twitter: socialTwitter,
          social_website: socialWebsite,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: t("profile.updateSuccess"),
      });
      
      onProfileUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: t("common.error"),
        description: t("profile.updateError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvatarFallback = () => {
    if (username) return username.substring(0, 2).toUpperCase();
    return "U";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("profile.editProfile")}</DialogTitle>
          <DialogDescription>
            {t("profile.editProfileDesc")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic" className="gap-2">
              <User className="h-4 w-4" />
              {t("profile.info")}
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2">
              <Link className="h-4 w-4" />
              {t("profile.social")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            {/* Cover Upload */}
            <div className="space-y-2">
              <Label>{t("profile.coverPhoto")}</Label>
              <div 
                className="relative h-32 w-full rounded-lg bg-gradient-hero overflow-hidden cursor-pointer group"
                onClick={() => coverInputRef.current?.click()}
              >
                {coverUrl && (
                  <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadingCover ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </div>
                {coverUrl && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCoverUrl("");
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
            </div>

            {/* Avatar Upload */}
            <div className="space-y-2">
              <Label>{t("profile.avatar")}</Label>
              <div className="flex items-center gap-4">
                <div 
                  className="relative cursor-pointer group"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Avatar className="h-20 w-20 border-2 border-primary/20">
                    {avatarUrl && <AvatarImage src={avatarUrl} />}
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {getAvatarFallback()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploadingAvatar ? (
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    ) : (
                      <Camera className="h-5 w-5 text-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {t("profile.avatarHint")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("profile.avatarFormat")}
                  </p>
                </div>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">{t("profile.username")}</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("profile.usernamePlaceholder")}
              />
            </div>

            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="jobTitle">{t("profile.job")}</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder={t("profile.jobPlaceholder")}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">{t("profile.location")}</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("profile.locationPlaceholder")}
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">{t("profile.about")}</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t("profile.bioPlaceholder")}
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Facebook className="h-4 w-4 text-blue-600" />
                Facebook
              </Label>
              <Input
                value={socialFacebook}
                onChange={(e) => setSocialFacebook(e.target.value)}
                placeholder="https://facebook.com/username"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Instagram className="h-4 w-4 text-pink-600" />
                Instagram
              </Label>
              <Input
                value={socialInstagram}
                onChange={(e) => setSocialInstagram(e.target.value)}
                placeholder="https://instagram.com/username"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Music2 className="h-4 w-4" />
                TikTok
              </Label>
              <Input
                value={socialTiktok}
                onChange={(e) => setSocialTiktok(e.target.value)}
                placeholder="https://tiktok.com/@username"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Twitter className="h-4 w-4 text-sky-500" />
                Twitter / X
              </Label>
              <Input
                value={socialTwitter}
                onChange={(e) => setSocialTwitter(e.target.value)}
                placeholder="https://twitter.com/username"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Website
              </Label>
              <Input
                value={socialWebsite}
                onChange={(e) => setSocialWebsite(e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={loading || uploadingAvatar || uploadingCover}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("profile.saveChanges")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
