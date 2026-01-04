import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Play, Download, Clock, Calendar } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CallRecord {
  id: string;
  caller_id: string;
  receiver_id: string;
  status: string;
  call_type: string;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  duration: number | null;
  recording_url: string | null;
  caller: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
  receiver: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

export default function CallHistory() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchCallHistory();
    }
  }, [user?.id]);

  const fetchCallHistory = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("calls")
        .select(`
          *,
          caller:profiles!caller_id(id, username, avatar_url),
          receiver:profiles!receiver_id(id, username, avatar_url)
        `)
        .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setCalls((data || []) as CallRecord[]);
    } catch (error) {
      console.error("Error fetching call history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCallIcon = (call: CallRecord) => {
    const isOutgoing = call.caller_id === user?.id;
    
    if (call.status === "missed" || call.status === "rejected") {
      return <PhoneMissed className="h-4 w-4 text-destructive" />;
    }
    if (isOutgoing) {
      return <PhoneOutgoing className="h-4 w-4 text-green-500" />;
    }
    return <PhoneIncoming className="h-4 w-4 text-blue-500" />;
  };

  const getCallTypeIcon = (callType: string) => {
    return callType === "video" ? (
      <Video className="h-4 w-4 text-muted-foreground" />
    ) : (
      <Phone className="h-4 w-4 text-muted-foreground" />
    );
  };

  const getOtherUser = (call: CallRecord) => {
    const isOutgoing = call.caller_id === user?.id;
    return isOutgoing ? call.receiver : call.caller;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusText = (call: CallRecord) => {
    const isOutgoing = call.caller_id === user?.id;
    switch (call.status) {
      case "ended":
        return "Đã kết thúc";
      case "missed":
        return isOutgoing ? "Không trả lời" : "Cuộc gọi nhỡ";
      case "rejected":
        return isOutgoing ? "Bị từ chối" : "Đã từ chối";
      default:
        return call.status;
    }
  };

  const recordingsOnly = calls.filter((call) => call.recording_url);

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const CallItem = ({ call }: { call: CallRecord }) => {
    const otherUser = getOtherUser(call);

    return (
      <Card className="hover:bg-accent/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={otherUser?.avatar_url || undefined} />
              <AvatarFallback>
                {otherUser?.username?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">
                  {otherUser?.username || "Người dùng"}
                </span>
                {getCallTypeIcon(call.call_type)}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {getCallIcon(call)}
                <span>{getStatusText(call)}</span>
                {call.duration && (
                  <>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(call.duration)}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(call.created_at), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </span>
              </div>

              {call.recording_url && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedRecording(call.recording_url)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Xem
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                  >
                    <a
                      href={call.recording_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Lịch sử cuộc gọi</h1>
        <p className="text-muted-foreground">Xem lại các cuộc gọi và bản ghi</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="all">Tất cả ({calls.length})</TabsTrigger>
          <TabsTrigger value="recordings">
            Bản ghi ({recordingsOnly.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {calls.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Chưa có cuộc gọi nào</p>
              </CardContent>
            </Card>
          ) : (
            calls.map((call) => <CallItem key={call.id} call={call} />)
          )}
        </TabsContent>

        <TabsContent value="recordings" className="space-y-3">
          {recordingsOnly.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Chưa có bản ghi nào</p>
              </CardContent>
            </Card>
          ) : (
            recordingsOnly.map((call) => <CallItem key={call.id} call={call} />)
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedRecording} onOpenChange={() => setSelectedRecording(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bản ghi cuộc gọi</DialogTitle>
          </DialogHeader>
          {selectedRecording && (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={selectedRecording}
                controls
                autoPlay
                className="w-full h-full"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
