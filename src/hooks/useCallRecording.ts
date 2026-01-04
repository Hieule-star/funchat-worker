import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RecordingState {
  isRecording: boolean;
  resourceId: string | null;
  sid: string | null;
  uid: number | null;
  startTime: Date | null;
}

export function useCallRecording(channelName: string, mode: 'video' | 'audio' = 'video') {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    resourceId: null,
    sid: null,
    uid: null,
    startTime: null,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const startRecording = useCallback(async () => {
    if (recordingState.isRecording || isLoading) {
      console.log('[Recording] Already recording or loading');
      return;
    }

    setIsLoading(true);
    console.log('[Recording] Starting recording for channel:', channelName);

    try {
      // Step 1: Acquire resource ID
      const { data: acquireData, error: acquireError } = await supabase.functions.invoke('agora-recording', {
        body: {
          action: 'acquire',
          channelName,
        },
      });

      if (acquireError) {
        throw new Error(`Acquire failed: ${acquireError.message}`);
      }

      console.log('[Recording] Acquired resource:', acquireData);
      const { resourceId, uid } = acquireData;

      // Step 2: Start recording
      const { data: startData, error: startError } = await supabase.functions.invoke('agora-recording', {
        body: {
          action: 'start',
          channelName,
          resourceId,
          uid,
          mode,
        },
      });

      if (startError) {
        throw new Error(`Start failed: ${startError.message}`);
      }

      console.log('[Recording] Started recording:', startData);

      // Update state
      setRecordingState({
        isRecording: true,
        resourceId,
        sid: startData.sid,
        uid,
        startTime: new Date(),
      });

      // Start duration timer
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      toast.success("Đã bắt đầu ghi âm cuộc gọi");
    } catch (error) {
      console.error('[Recording] Start error:', error);
      toast.error("Không thể bắt đầu ghi âm: " + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [channelName, recordingState.isRecording, isLoading, mode]);

  const stopRecording = useCallback(async () => {
    if (!recordingState.isRecording || !recordingState.resourceId || !recordingState.sid) {
      console.log('[Recording] Not recording or missing state');
      return null;
    }

    setIsLoading(true);
    console.log('[Recording] Stopping recording for channel:', channelName);

    try {
      const { data: stopData, error: stopError } = await supabase.functions.invoke('agora-recording', {
        body: {
          action: 'stop',
          channelName,
          resourceId: recordingState.resourceId,
          sid: recordingState.sid,
          uid: recordingState.uid,
        },
      });

      if (stopError) {
        throw new Error(`Stop failed: ${stopError.message}`);
      }

      console.log('[Recording] Stopped recording:', stopData);

      // Clear timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      // Reset state
      setRecordingState({
        isRecording: false,
        resourceId: null,
        sid: null,
        uid: null,
        startTime: null,
      });
      setRecordingDuration(0);

      toast.success("Đã dừng ghi âm cuộc gọi");

      // Return file info if available
      return stopData.serverResponse?.fileList || null;
    } catch (error) {
      console.error('[Recording] Stop error:', error);
      toast.error("Không thể dừng ghi âm: " + (error instanceof Error ? error.message : 'Unknown error'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [channelName, recordingState]);

  const queryRecording = useCallback(async () => {
    if (!recordingState.resourceId || !recordingState.sid) {
      console.log('[Recording] No active recording to query');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('agora-recording', {
        body: {
          action: 'query',
          channelName,
          resourceId: recordingState.resourceId,
          sid: recordingState.sid,
        },
      });

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      console.log('[Recording] Query result:', data);
      return data;
    } catch (error) {
      console.error('[Recording] Query error:', error);
      return null;
    }
  }, [channelName, recordingState]);

  // Format recording duration
  const formatDuration = useCallback(() => {
    const mins = Math.floor(recordingDuration / 60);
    const secs = recordingDuration % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [recordingDuration]);

  // Cleanup on unmount
  const cleanup = useCallback(async () => {
    if (recordingState.isRecording) {
      await stopRecording();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  }, [recordingState.isRecording, stopRecording]);

  return {
    isRecording: recordingState.isRecording,
    isLoading,
    recordingDuration,
    formatDuration,
    startRecording,
    stopRecording,
    queryRecording,
    cleanup,
  };
}
