import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2, User, AlertCircle, CheckCircle2, Wifi, Users, Monitor, MonitorOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGroupAgoraCall } from "@/hooks/useGroupAgoraCall";
import { toast } from "sonner";
import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";

interface GroupCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  groupName: string;
  groupAvatar?: string;
  participants: Array<{
    user_id: string;
    profiles: {
      username: string;
      avatar_url?: string;
    };
  }>;
  mode: 'video' | 'audio';
  selectedVideoDeviceId?: string;
  selectedAudioDeviceId?: string;
}

type CallStatus = 'connecting' | 'waiting' | 'connected' | 'failed' | 'ended';

// Component for each remote user video tile
function RemoteUserTile({ 
  user, 
  participant,
  mode 
}: { 
  user: IAgoraRTCRemoteUser;
  participant?: {
    user_id: string;
    profiles: {
      username: string;
      avatar_url?: string;
    };
  };
  mode: 'video' | 'audio';
}) {
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === 'video' && user.videoTrack && videoRef.current) {
      user.videoTrack.play(videoRef.current);
      console.log('[GroupCallModal] Playing video for user:', user.uid);
    }
    return () => {
      user.videoTrack?.stop();
    };
  }, [user, mode]);

  const username = participant?.profiles?.username || `User ${user.uid}`;
  const avatarUrl = participant?.profiles?.avatar_url;

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
      {mode === 'video' && user.videoTrack ? (
        <div ref={videoRef} className="w-full h-full" />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Avatar className="h-16 w-16 border-2 border-white/20">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-primary/20 text-primary text-xl">
              {username[0]?.toUpperCase() || <User className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>
          <span className="text-white text-sm font-medium">{username}</span>
        </div>
      )}
      {/* User label */}
      <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
        {username}
      </div>
      {/* Audio indicator */}
      {user.audioTrack && (
        <div className="absolute top-2 right-2 bg-green-500/80 p-1 rounded-full">
          <Mic className="h-3 w-3 text-white" />
        </div>
      )}
    </div>
  );
}

export default function GroupCallModal({
  open,
  onOpenChange,
  conversationId,
  groupName,
  groupAvatar,
  participants,
  mode,
  selectedVideoDeviceId,
  selectedAudioDeviceId,
}: GroupCallModalProps) {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(mode === 'video');
  const [callStatus, setCallStatus] = useState<CallStatus>('connecting');
  const [connectionTime, setConnectionTime] = useState(0);
  
  const hasJoinedRef = useRef(false);
  const isJoiningRef = useRef(false);
  const connectionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    localVideoRef,
    joinChannel,
    leaveChannel,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    isJoined,
    remoteUsers,
    localUid,
    isScreenSharing,
  } = useGroupAgoraCall();

  // Connection timer
  useEffect(() => {
    if (callStatus === 'connected') {
      connectionTimerRef.current = setInterval(() => {
        setConnectionTime(prev => prev + 1);
      }, 1000);
    } else {
      if (connectionTimerRef.current) {
        clearInterval(connectionTimerRef.current);
        connectionTimerRef.current = null;
      }
    }
    return () => {
      if (connectionTimerRef.current) {
        clearInterval(connectionTimerRef.current);
      }
    };
  }, [callStatus]);

  // Join channel when modal opens
  useEffect(() => {
    if (open && !hasJoinedRef.current && !isJoiningRef.current) {
      const channelName = `group-call-${conversationId}`;
      console.log('[GroupCallModal] Attempting to join channel:', channelName);
      
      setCallStatus('connecting');
      setConnectionTime(0);
      isJoiningRef.current = true;
      
      joinChannel(channelName, mode, selectedVideoDeviceId, selectedAudioDeviceId)
        .then(() => {
          console.log('[GroupCallModal] Joined successfully, waiting for other members');
          hasJoinedRef.current = true;
          isJoiningRef.current = false;
          setCallStatus('waiting');
        })
        .catch((error) => {
          console.error('[GroupCallModal] Join failed:', error);
          isJoiningRef.current = false;
          setCallStatus('failed');
          toast.error("Không thể kết nối cuộc gọi");
        });
    }
  }, [open, conversationId, mode, selectedVideoDeviceId, selectedAudioDeviceId, joinChannel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hasJoinedRef.current) {
        console.log('[GroupCallModal] Cleanup: leaving channel');
        leaveChannel();
        hasJoinedRef.current = false;
        isJoiningRef.current = false;
      }
    };
  }, []);

  // Update status when remote users join
  useEffect(() => {
    if (remoteUsers.length > 0) {
      console.log('[GroupCallModal] Remote user(s) joined, status -> connected');
      setCallStatus('connected');
    } else if (isJoined && callStatus === 'connected') {
      // All remote users left
      setCallStatus('waiting');
    }
  }, [remoteUsers.length, isJoined, callStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusConfig = () => {
    switch (callStatus) {
      case 'connecting':
        return {
          icon: <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />,
          text: 'Đang kết nối...',
          bgColor: 'bg-yellow-500/20 border-yellow-500/30',
          textColor: 'text-yellow-400'
        };
      case 'waiting':
        return {
          icon: <Wifi className="h-4 w-4 text-blue-400 animate-pulse" />,
          text: 'Chờ thành viên tham gia...',
          bgColor: 'bg-blue-500/20 border-blue-500/30',
          textColor: 'text-blue-400'
        };
      case 'connected':
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-green-400" />,
          text: `${remoteUsers.length + 1} người • ${formatTime(connectionTime)}`,
          bgColor: 'bg-green-500/20 border-green-500/30',
          textColor: 'text-green-400'
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-4 w-4 text-red-400" />,
          text: 'Kết nối thất bại',
          bgColor: 'bg-red-500/20 border-red-500/30',
          textColor: 'text-red-400'
        };
      case 'ended':
        return {
          icon: <PhoneOff className="h-4 w-4 text-gray-400" />,
          text: 'Cuộc gọi đã kết thúc',
          bgColor: 'bg-gray-500/20 border-gray-500/30',
          textColor: 'text-gray-400'
        };
    }
  };

  const statusConfig = getStatusConfig();

  const handleToggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    toggleAudio(newState);
  };

  const handleToggleVideo = () => {
    const newState = !videoEnabled;
    setVideoEnabled(newState);
    toggleVideo(newState);
  };

  const handleToggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        await stopScreenShare();
        toast.success("Đã dừng chia sẻ màn hình");
      } else {
        await startScreenShare();
        toast.success("Đang chia sẻ màn hình");
      }
    } catch (error) {
      console.error('[GroupCallModal] Screen share toggle error:', error);
      toast.error("Không thể chia sẻ màn hình");
    }
  };

  const handleEndCall = async () => {
    await leaveChannel();
    hasJoinedRef.current = false;
    setCallStatus('ended');
    onOpenChange(false);
  };

  // Calculate grid layout based on number of participants
  const getGridCols = () => {
    const totalUsers = remoteUsers.length + 1;
    if (totalUsers <= 1) return 'grid-cols-1';
    if (totalUsers <= 2) return 'grid-cols-2';
    if (totalUsers <= 4) return 'grid-cols-2';
    if (totalUsers <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-6xl h-[90vh] p-0 overflow-hidden [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="relative w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/30">
                <AvatarImage src={groupAvatar} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  <Users className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-white">{groupName}</h3>
                <p className="text-sm text-gray-400">
                  {mode === 'video' ? 'Video call' : 'Voice call'}
                </p>
              </div>
            </div>
            
            {/* Status indicator */}
            <div className={`backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 border ${statusConfig.bgColor}`}>
              {statusConfig.icon}
              <span className={`text-sm font-medium ${statusConfig.textColor}`}>
                {statusConfig.text}
              </span>
            </div>
          </div>

          {/* Video Grid */}
          <div className="flex-1 p-4 overflow-auto">
            {callStatus === 'failed' ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <AlertCircle className="h-16 w-16 text-red-400 mx-auto" />
                  <p className="text-white text-lg">Không thể kết nối cuộc gọi</p>
                  <p className="text-gray-400 text-sm">Vui lòng kiểm tra kết nối mạng và thử lại</p>
                  <Button 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                    className="mt-4"
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            ) : (
              <div className={`grid ${getGridCols()} gap-4 h-full`}>
                {/* Local user tile */}
                <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                  {mode === 'video' && (videoEnabled || isScreenSharing) ? (
                    <div ref={localVideoRef} className="w-full h-full" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Avatar className="h-16 w-16 border-2 border-primary/30">
                        <AvatarFallback className="bg-primary/20 text-primary text-xl">
                          <User className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white text-sm font-medium">Bạn</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                    Bạn
                    {!audioEnabled && <MicOff className="h-3 w-3 text-red-400" />}
                  </div>
                  {isScreenSharing && (
                    <div className="absolute top-2 left-2 bg-red-500/80 px-1.5 py-0.5 rounded text-xs text-white flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      Đang chia sẻ
                    </div>
                  )}
                  {audioEnabled && (
                    <div className="absolute top-2 right-2 bg-green-500/80 p-1 rounded-full">
                      <Mic className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Remote user tiles */}
                {remoteUsers.map((user) => (
                  <RemoteUserTile
                    key={user.uid}
                    user={user}
                    participant={participants.find(p => p.user_id === String(user.uid))}
                    mode={mode}
                  />
                ))}

                {/* Placeholder tiles for waiting users */}
                {callStatus === 'waiting' && remoteUsers.length === 0 && (
                  <div className="bg-gray-800/50 rounded-lg aspect-video flex items-center justify-center border-2 border-dashed border-gray-600">
                    <div className="text-center text-gray-400">
                      <Users className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Đang chờ thành viên...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-6 flex justify-center gap-4 border-t border-white/10">
            <Button
              variant={audioEnabled ? "secondary" : "destructive"}
              size="icon"
              className="h-14 w-14 rounded-full"
              onClick={handleToggleAudio}
            >
              {audioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            </Button>

            {mode === 'video' && (
              <>
                <Button
                  variant={videoEnabled ? "secondary" : "destructive"}
                  size="icon"
                  className="h-14 w-14 rounded-full"
                  onClick={handleToggleVideo}
                  disabled={isScreenSharing}
                >
                  {videoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                </Button>

                <Button
                  variant={isScreenSharing ? "destructive" : "secondary"}
                  size="icon"
                  className="h-14 w-14 rounded-full"
                  onClick={handleToggleScreenShare}
                >
                  {isScreenSharing ? <MonitorOff className="h-6 w-6" /> : <Monitor className="h-6 w-6" />}
                </Button>
              </>
            )}

            <Button
              variant="destructive"
              size="icon"
              className="h-16 w-16 rounded-full"
              onClick={handleEndCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>

          {/* Debug info */}
          <div className="absolute bottom-28 left-4 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg text-xs font-mono space-y-1">
            <div className="text-gray-400">
              Channel: group-call-{conversationId.slice(0, 8)}...
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Status:</span>
              <span className={`font-bold ${isJoined ? 'text-green-400' : 'text-yellow-400'}`}>
                {isJoined ? 'joined' : 'joining...'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Remote:</span>
              <span className={`font-bold ${remoteUsers.length > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                {remoteUsers.length} user(s)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">My UID:</span>
              <span className="text-gray-300">{localUid || 'N/A'}</span>
            </div>
            {isScreenSharing && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Screen:</span>
                <span className="font-bold text-red-400">sharing</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
