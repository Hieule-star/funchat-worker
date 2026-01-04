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
import { 
  Users, 
  Loader2, 
  Camera, 
  UserPlus, 
  LogOut, 
  Trash2, 
  MoreVertical,
  Shield,
  ShieldOff,
  UserMinus,
  Pencil,
  Check,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AddMemberModal from "./AddMemberModal";

interface GroupMember {
  user_id: string;
  role: string;
  profiles: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

interface GroupInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: any;
  onUpdate?: () => void;
}

export default function GroupInfoModal({
  open,
  onOpenChange,
  conversation,
  onUpdate,
}: GroupInfoModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [groupName, setGroupName] = useState(conversation?.name || "");
  const [showAddMember, setShowAddMember] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (open && conversation?.id) {
      fetchMembers();
      setGroupName(conversation.name || "");
    }
  }, [open, conversation?.id]);

  const fetchMembers = async () => {
    if (!conversation?.id) return;
    setLoading(true);

    // Using type assertion as the role column was just added
    const { data, error } = await supabase
      .from("conversation_participants")
      .select(`
        user_id,
        role,
        profiles (id, username, avatar_url)
      `)
      .eq("conversation_id", conversation.id) as any;

    if (error) {
      console.error("Error fetching members:", error);
      setLoading(false);
      return;
    }

    setMembers(data as GroupMember[]);
    
    // Check if current user is admin
    const currentUserMember = data?.find(m => m.user_id === user?.id);
    setIsAdmin(currentUserMember?.role === 'admin');
    setLoading(false);
  };

  const handleUpdateName = async () => {
    if (!groupName.trim() || !conversation?.id) return;

    try {
      // Using type assertion as the function was just created
      const { error } = await (supabase.rpc as any)('update_group_info', {
        _conversation_id: conversation.id,
        _name: groupName.trim(),
        _avatar_url: null
      });

      if (error) throw error;

      toast({
        title: t("group.success"),
        description: t("group.nameUpdated"),
      });
      setEditingName(false);
      onUpdate?.();
    } catch (error) {
      console.error("Error updating group name:", error);
      toast({
        title: t("group.error"),
        description: t("group.updateFailed"),
        variant: "destructive",
      });
    }
  };

  const handleSetRole = async (userId: string, newRole: string) => {
    try {
      setActionLoading(true);
      // Using type assertion as the function was just created
      const { error } = await (supabase.rpc as any)('set_member_role', {
        _conversation_id: conversation.id,
        _user_id: userId,
        _role: newRole
      });

      if (error) throw error;

      toast({
        title: t("group.success"),
        description: newRole === 'admin' ? t("group.madeAdmin") : t("group.removedAdmin"),
      });
      fetchMembers();
    } catch (error) {
      console.error("Error setting role:", error);
      toast({
        title: t("group.error"),
        description: t("group.roleFailed"),
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      setActionLoading(true);
      const { error } = await supabase.rpc('remove_group_member', {
        _conversation_id: conversation.id,
        _user_id: userId
      });

      if (error) throw error;

      toast({
        title: t("group.success"),
        description: t("group.memberRemoved"),
      });
      fetchMembers();
      setShowRemoveDialog(null);
      onUpdate?.();
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: t("group.error"),
        description: t("group.removeFailed"),
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!user?.id) return;
    
    try {
      setActionLoading(true);
      const { error } = await supabase.rpc('remove_group_member', {
        _conversation_id: conversation.id,
        _user_id: user.id
      });

      if (error) throw error;

      toast({
        title: t("group.success"),
        description: t("group.leftGroup"),
      });
      onOpenChange(false);
      onUpdate?.();
    } catch (error) {
      console.error("Error leaving group:", error);
      toast({
        title: t("group.error"),
        description: t("group.leaveFailed"),
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
      setShowLeaveDialog(false);
    }
  };

  const handleMemberAdded = () => {
    fetchMembers();
    onUpdate?.();
  };

  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;
    return 0;
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("group.groupInfo")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Group avatar and name */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={conversation?.group_avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    <Users className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                {isAdmin && (
                  <button className="absolute -bottom-1 -right-1 p-1 bg-primary text-primary-foreground rounded-full">
                    <Camera className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <div className="flex-1">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={handleUpdateName}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingName(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{conversation?.name}</h3>
                    {isAdmin && (
                      <Button size="icon" variant="ghost" onClick={() => setEditingName(true)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  {members.length} {t("group.members")}
                </p>
              </div>
            </div>

            {/* Add member button */}
            {isAdmin && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowAddMember(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {t("group.addMember")}
              </Button>
            )}

            {/* Members list */}
            <div>
              <p className="text-sm font-medium mb-2">{t("group.participants")}</p>
              <ScrollArea className="h-[250px] pr-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    {sortedMembers.map((member) => (
                      <div 
                        key={member.user_id} 
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {member.profiles?.username?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {member.user_id === user?.id 
                                ? t("group.you") 
                                : member.profiles?.username}
                            </span>
                            {member.role === 'admin' && (
                              <Badge variant="default" className="text-xs">
                                {t("group.admin")}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Member actions (for admins, not on self) */}
                        {isAdmin && member.user_id !== user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {member.role === 'admin' ? (
                                <DropdownMenuItem 
                                  onClick={() => handleSetRole(member.user_id, 'member')}
                                  disabled={actionLoading}
                                >
                                  <ShieldOff className="h-4 w-4 mr-2" />
                                  {t("group.removeAdmin")}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => handleSetRole(member.user_id, 'admin')}
                                  disabled={actionLoading}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  {t("group.makeAdmin")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setShowRemoveDialog(member.user_id)}
                                className="text-destructive focus:text-destructive"
                                disabled={actionLoading}
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                {t("group.removeMember")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Leave group button */}
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => setShowLeaveDialog(true)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t("group.leaveGroup")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Modal */}
      <AddMemberModal
        open={showAddMember}
        onOpenChange={setShowAddMember}
        conversationId={conversation?.id}
        existingMemberIds={members.map(m => m.user_id)}
        onMemberAdded={handleMemberAdded}
      />

      {/* Leave Group Confirmation */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("group.leaveGroupTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("group.leaveGroupDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLeaveGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("group.leave")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!showRemoveDialog} onOpenChange={() => setShowRemoveDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("group.removeMemberTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("group.removeMemberDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => showRemoveDialog && handleRemoveMember(showRemoveDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("group.remove")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
