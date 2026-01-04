import { useState, useRef, useCallback } from "react";
import AgoraRTC, { 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
  ILocalVideoTrack
} from "agora-rtc-sdk-ng";
import { supabase } from "@/integrations/supabase/client";
import { getAgoraClient, resetAgoraClient } from "@/lib/agoraClient";
import { toast } from "sonner";

interface UseAgoraCallReturn {
  localVideoRef: React.RefObject<HTMLDivElement>;
  remoteVideoRef: React.RefObject<HTMLDivElement>;
  joinChannel: (channelName: string, mode: 'video' | 'audio', videoDeviceId?: string, audioDeviceId?: string) => Promise<void>;
  leaveChannel: () => Promise<void>;
  toggleAudio: (enabled: boolean) => void;
  toggleVideo: (enabled: boolean) => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  isJoined: boolean;
  remoteUsers: IAgoraRTCRemoteUser[];
  isScreenSharing: boolean;
}

// Helper to get specific error message
function getJoinErrorMessage(error: any): string {
  const errorStr = error?.message || error?.toString() || '';
  
  if (error?.name === 'NotReadableError' || errorStr.includes('NotReadableError')) {
    return 'Thiết bị đang được sử dụng bởi ứng dụng khác. Vui lòng đóng các ứng dụng khác và thử lại.';
  }
  if (error?.name === 'NotAllowedError' || errorStr.includes('NotAllowedError')) {
    return 'Quyền truy cập camera/mic bị từ chối. Vui lòng cho phép trong cài đặt trình duyệt.';
  }
  if (error?.name === 'NotFoundError' || errorStr.includes('NotFoundError')) {
    return 'Không tìm thấy camera hoặc microphone trên thiết bị này.';
  }
  if (errorStr.includes('Token fetch failed') || errorStr.includes('token')) {
    return 'Không thể xác thực cuộc gọi. Vui lòng kiểm tra kết nối mạng.';
  }
  if (errorStr.includes('network') || errorStr.includes('Network')) {
    return 'Lỗi kết nối mạng. Vui lòng kiểm tra internet.';
  }
  if (errorStr.includes('VITE_AGORA_TOKEN_URL')) {
    return 'Cấu hình cuộc gọi chưa được thiết lập. Vui lòng liên hệ quản trị viên.';
  }
  
  return `Lỗi kết nối cuộc gọi: ${errorStr}`;
}

export function useAgoraCall(): UseAgoraCallReturn {
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const screenTrackRef = useRef<ILocalVideoTrack | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const isJoinedRef = useRef(false);

  const joinChannel = useCallback(async (channelName: string, mode: 'video' | 'audio', videoDeviceId?: string, audioDeviceId?: string) => {
    // Prevent double joining
    if (isJoinedRef.current) {
      console.log('[Agora] Already joined, skipping');
      return;
    }

    try {
      console.log('[Agora] Joining channel:', channelName, 'mode:', mode);
      
      // 1. Get token from Cloudflare Worker with timeout
      const TOKEN_SERVER = import.meta.env.VITE_AGORA_TOKEN_URL;
      if (!TOKEN_SERVER) {
        throw new Error('VITE_AGORA_TOKEN_URL is not configured');
      }
      
      console.log('[Agora] Fetching token from Cloudflare Worker...');

      // Get Supabase session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      // Fetch token with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      let tokenResponse: Response;
      try {
        tokenResponse = await fetch(TOKEN_SERVER, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ channelName, uid: 0 }),
          signal: controller.signal
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Token fetch timeout - server không phản hồi');
        }
        throw fetchError;
      }
      clearTimeout(timeoutId);

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        console.error('[Agora] Token fetch error:', errorData);
        throw new Error(`Token fetch failed (${tokenResponse.status}): ${errorData.error || 'Unknown error'}`);
      }

      const data = await tokenResponse.json();

      if (!data?.token) {
        throw new Error("Không có token trả về từ server");
      }

      const { token, appId } = data;
      console.log('[Agora] ===== DEBUG INFO =====');
      console.log('[Agora] Channel:', channelName);
      console.log('[Agora] Mode:', mode);
      console.log('[Agora] App ID:', appId);
      console.log('[Agora] Token received successfully');
      console.log('[Agora] ===== END DEBUG =====');

      // 2. Get or create Agora client using singleton pattern
      const client = getAgoraClient();

      // 3. Setup event handlers
      client.on("user-published", async (user, mediaType) => {
        console.log('[Agora] User published:', user.uid, mediaType);
        await client.subscribe(user, mediaType);
        
        if (mediaType === "video") {
          setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
          
          requestAnimationFrame(() => {
            setTimeout(() => {
              if (remoteVideoRef.current && user.videoTrack) {
                user.videoTrack.play(remoteVideoRef.current);
                console.log('[Agora] Playing remote video for user:', user.uid);
              } else {
                console.warn('[Agora] Remote video element not ready for user:', user.uid);
              }
            }, 100);
          });
        }
        
        if (mediaType === "audio") {
          user.audioTrack?.play();
          console.log('[Agora] Playing remote audio');
          setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
        }
      });

      client.on("user-unpublished", (user, mediaType) => {
        console.log('[Agora] User unpublished:', user.uid, mediaType);
        if (mediaType === "video") {
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        }
      });

      client.on("user-left", (user) => {
        console.log('[Agora] User left:', user.uid);
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });

      // 4. Join channel
      await client.join(appId, channelName, token, null);
      console.log('[Agora] Joined channel successfully');

      // 5. Create local tracks with retry for device access errors
      let audioTrack: IMicrophoneAudioTrack;
      
      const createAudioWithRetry = async (retries = 2): Promise<IMicrophoneAudioTrack> => {
        try {
          return await AgoraRTC.createMicrophoneAudioTrack(
            audioDeviceId ? { microphoneId: audioDeviceId } : undefined
          );
        } catch (error: any) {
          if (error?.name === 'NotReadableError' && retries > 0) {
            console.log('[Agora] Device busy, retrying after delay...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return createAudioWithRetry(retries - 1);
          }
          throw error;
        }
      };
      
      audioTrack = await createAudioWithRetry();
      localAudioTrackRef.current = audioTrack;

      const tracksToPublish: (IMicrophoneAudioTrack | ICameraVideoTrack)[] = [audioTrack];

      // Only create video track if mode is 'video'
      if (mode === 'video') {
        const createVideoWithRetry = async (retries = 2): Promise<ICameraVideoTrack> => {
          try {
            return await AgoraRTC.createCameraVideoTrack(
              videoDeviceId ? { cameraId: videoDeviceId } : undefined
            );
          } catch (error: any) {
            if (error?.name === 'NotReadableError' && retries > 0) {
              console.log('[Agora] Camera busy, retrying after delay...');
              await new Promise(resolve => setTimeout(resolve, 1000));
              return createVideoWithRetry(retries - 1);
            }
            throw error;
          }
        };
        
        const videoTrack = await createVideoWithRetry();
        localVideoTrackRef.current = videoTrack;
        tracksToPublish.push(videoTrack);

        // Play local video
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
          console.log('[Agora] Playing local video');
        }
      } else {
        console.log('[Agora] Audio-only mode, skipping video track');
      }

      // Publish tracks
      await client.publish(tracksToPublish);
      console.log('[Agora] Published local tracks:', mode);

      isJoinedRef.current = true;
      setIsJoined(true);
    } catch (error: any) {
      console.error('[Agora] Join error:', error);
      
      // Show user-friendly error message
      const errorMessage = getJoinErrorMessage(error);
      toast.error(errorMessage);
      
      // Cleanup on error
      localAudioTrackRef.current?.close();
      localVideoTrackRef.current?.close();
      localAudioTrackRef.current = null;
      localVideoTrackRef.current = null;
      
      throw error;
    }
  }, []);

  const leaveChannel = useCallback(async () => {
    console.log('[Agora] Leaving channel');
    
    try {
      // Stop screen share if active
      if (screenTrackRef.current) {
        screenTrackRef.current.close();
        screenTrackRef.current = null;
        setIsScreenSharing(false);
      }
      
      // Stop and close local tracks
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }
      
      // Get client and leave
      const client = getAgoraClient();
      if (client.connectionState === 'CONNECTED' || client.connectionState === 'CONNECTING') {
        await client.leave();
      }
      
      // Reset client for next use
      resetAgoraClient();
      
      // Reset state
      isJoinedRef.current = false;
      setIsJoined(false);
      setRemoteUsers([]);
      
      console.log('[Agora] Left channel successfully');
    } catch (error) {
      console.error('[Agora] Leave channel error:', error);
      // Still reset state even on error
      isJoinedRef.current = false;
      setIsJoined(false);
      setRemoteUsers([]);
      resetAgoraClient();
    }
  }, []);

  const toggleAudio = useCallback((enabled: boolean) => {
    localAudioTrackRef.current?.setEnabled(enabled);
    console.log('[Agora] Audio toggled:', enabled);
  }, []);

  const toggleVideo = useCallback((enabled: boolean) => {
    localVideoTrackRef.current?.setEnabled(enabled);
    console.log('[Agora] Video toggled:', enabled);
  }, []);

  const startScreenShare = useCallback(async () => {
    const client = getAgoraClient();
    if (!client || isScreenSharing) return;

    try {
      console.log('[Agora] Starting screen share...');
      
      const screenTrack = await AgoraRTC.createScreenVideoTrack({}, "disable");
      
      if (!screenTrack) {
        console.log('[Agora] Screen share cancelled by user');
        return;
      }

      const videoTrack = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;
      screenTrackRef.current = videoTrack;

      if (localVideoTrackRef.current) {
        await client.unpublish(localVideoTrackRef.current);
        localVideoTrackRef.current.stop();
      }

      await client.publish(videoTrack);
      
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      videoTrack.on("track-ended", () => {
        console.log('[Agora] Screen share ended by user');
        stopScreenShare();
      });

      setIsScreenSharing(true);
      console.log('[Agora] Screen share started successfully');
    } catch (error) {
      console.error('[Agora] Screen share error:', error);
      throw error;
    }
  }, [isScreenSharing]);

  const stopScreenShare = useCallback(async () => {
    const client = getAgoraClient();
    if (!client || !screenTrackRef.current) return;

    try {
      console.log('[Agora] Stopping screen share...');
      
      await client.unpublish(screenTrackRef.current);
      screenTrackRef.current.close();
      screenTrackRef.current = null;

      if (localVideoTrackRef.current) {
        await client.publish(localVideoTrackRef.current);
        if (localVideoRef.current) {
          localVideoTrackRef.current.play(localVideoRef.current);
        }
      }

      setIsScreenSharing(false);
      console.log('[Agora] Screen share stopped successfully');
    } catch (error) {
      console.error('[Agora] Stop screen share error:', error);
    }
  }, []);

  return {
    localVideoRef,
    remoteVideoRef,
    joinChannel,
    leaveChannel,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    isJoined,
    remoteUsers,
    isScreenSharing,
  };
}