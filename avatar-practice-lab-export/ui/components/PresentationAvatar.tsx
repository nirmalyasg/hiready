import { useState, useEffect, useRef, useCallback } from 'react';
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskMode,
  TaskType,
  VoiceEmotion,
} from "@heygen/streaming-avatar";
import type { StartAvatarResponse } from "@heygen/streaming-avatar";

interface PresentationAvatarProps {
  avatarId: string;
  avatarName: string;
  knowledgeBase: string;
  isActive: boolean;
  onSessionReady?: () => void;
  onSessionEnded?: () => void;
  onAvatarSpeaking?: (isSpeaking: boolean) => void;
  onTranscriptUpdate?: (speaker: string, text: string) => void;
  initialGreeting?: string;
  className?: string;
}

export default function PresentationAvatar({
  avatarId,
  avatarName,
  knowledgeBase,
  isActive,
  onSessionReady,
  onSessionEnded,
  onAvatarSpeaking,
  onTranscriptUpdate,
  initialGreeting,
  className = ""
}: PresentationAvatarProps) {
  const [stream, setStream] = useState<MediaStream>();
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const avatarRef = useRef<StreamingAvatar | null>(null);
  const mediaStreamRef = useRef<HTMLVideoElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const greetingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAccessToken = useCallback(async () => {
    try {
      const response = await fetch("/api/avatar/get-access-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error("Error fetching access token:", error);
      return null;
    }
  }, []);

  const startSession = useCallback(async () => {
    if (!mountedRef.current || isSessionStarted || isLoading) {
      console.log(`[PresentationAvatar ${avatarName}] Skipping start - mounted:${mountedRef.current}, started:${isSessionStarted}, loading:${isLoading}`);
      return;
    }
    
    if (!avatarId) {
      console.error(`[PresentationAvatar ${avatarName}] No avatarId provided`);
      setError("No avatar selected");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`[PresentationAvatar ${avatarName}] Starting session for avatar: ${avatarId}`);
      const token = await fetchAccessToken();
      if (!token || !mountedRef.current) {
        console.error(`[PresentationAvatar ${avatarName}] Failed to get token or unmounted`);
        setError("Failed to get access token");
        setIsLoading(false);
        return;
      }

      console.log(`[PresentationAvatar ${avatarName}] Got token, creating StreamingAvatar...`);
      const avatar = new StreamingAvatar({ token });
      avatarRef.current = avatar;

      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        if (!mountedRef.current) return;
        console.log(`[PresentationAvatar ${avatarName}] Stream ready`);
        setStream(event.detail);
        setIsLoading(false);
        setIsSessionStarted(true);
        onSessionReady?.();
      });

      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        if (!mountedRef.current) return;
        console.log(`[PresentationAvatar ${avatarName}] Stream disconnected`);
        setIsSessionStarted(false);
        setStream(undefined);
        onSessionEnded?.();
      });

      avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
        if (!mountedRef.current) return;
        onAvatarSpeaking?.(true);
      });

      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, (event) => {
        if (!mountedRef.current) return;
        onAvatarSpeaking?.(false);
        if (event.detail?.message) {
          onTranscriptUpdate?.(avatarName, event.detail.message);
        }
      });

      avatar.on(StreamingEvents.USER_START, () => {
        if (!mountedRef.current) return;
      });

      avatar.on(StreamingEvents.USER_STOP, (event) => {
        if (!mountedRef.current) return;
        if (event.detail?.message) {
          onTranscriptUpdate?.("You", event.detail.message);
        }
      });

      console.log(`[PresentationAvatar ${avatarName}] Calling createStartAvatar with avatarId: ${avatarId}`);
      
      const avatarRequest: any = {
        quality: AvatarQuality.Low,
        avatarName: avatarId,
        language: "en",
      };
      
      if (knowledgeBase && knowledgeBase.trim().length > 0 && knowledgeBase.length < 5000) {
        avatarRequest.knowledgeBase = knowledgeBase;
        console.log(`[PresentationAvatar ${avatarName}] Using knowledgeBase, length: ${knowledgeBase.length}`);
      } else if (knowledgeBase && knowledgeBase.length >= 5000) {
        const truncated = knowledgeBase.substring(0, 4500);
        avatarRequest.knowledgeBase = truncated;
        console.log(`[PresentationAvatar ${avatarName}] Truncated knowledgeBase to 4500 chars`);
      }
      
      console.log(`[PresentationAvatar ${avatarName}] Avatar request:`, JSON.stringify(avatarRequest, null, 2));
      
      const sessionData = await avatar.createStartAvatar(avatarRequest);

      if (!mountedRef.current) {
        await avatar.stopAvatar();
        return;
      }

      sessionIdRef.current = sessionData?.session_id || null;
      console.log(`[PresentationAvatar ${avatarName}] Session started:`, sessionData?.session_id);

      keepAliveIntervalRef.current = setInterval(async () => {
        if (sessionIdRef.current && avatarRef.current) {
          try {
            await fetch("/api/avatar/keep-alive", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ session_id: sessionIdRef.current }),
            });
          } catch (e) {
            console.error("Keep-alive failed:", e);
          }
        }
      }, 30000);

    } catch (error: any) {
      console.error(`[PresentationAvatar ${avatarName}] Error starting session:`, error);
      console.error(`[PresentationAvatar ${avatarName}] Error details:`, {
        message: error.message,
        response: error.response,
        status: error.status,
      });
      if (mountedRef.current) {
        setError(error.message || "Failed to start avatar session");
        setIsLoading(false);
      }
    }
  }, [avatarId, avatarName, knowledgeBase, isSessionStarted, isLoading, fetchAccessToken, onSessionReady, onSessionEnded, onAvatarSpeaking, onTranscriptUpdate]);

  const stopSession = useCallback(async () => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
    if (greetingTimeoutRef.current) {
      clearTimeout(greetingTimeoutRef.current);
      greetingTimeoutRef.current = null;
    }
    
    if (avatarRef.current) {
      try {
        await avatarRef.current.stopAvatar();
      } catch (e) {
        console.error("Error stopping avatar:", e);
      }
      avatarRef.current = null;
    }
    
    sessionIdRef.current = null;
    setIsSessionStarted(false);
    setStream(undefined);
    setHasGreeted(false);
  }, []);

  const sendGreeting = useCallback(async () => {
    if (!avatarRef.current || hasGreeted || !isActive || !initialGreeting) return;
    
    setHasGreeted(true);
    
    try {
      await avatarRef.current.speak({
        text: initialGreeting,
        taskType: TaskType.TALK,
        taskMode: TaskMode.SYNC,
      });
    } catch (error) {
      console.error("Error sending greeting:", error);
    }
  }, [hasGreeted, isActive, initialGreeting]);

  const startVoiceChat = useCallback(async () => {
    if (!avatarRef.current || !isSessionStarted) return;
    
    try {
      await avatarRef.current.startVoiceChat({});
      console.log(`[PresentationAvatar ${avatarName}] Voice chat started`);
    } catch (error) {
      console.error("Error starting voice chat:", error);
    }
  }, [avatarName, isSessionStarted]);

  useEffect(() => {
    if (isActive && isSessionStarted && !hasGreeted && initialGreeting) {
      greetingTimeoutRef.current = setTimeout(() => {
        sendGreeting();
      }, 1500);
    }
    
    return () => {
      if (greetingTimeoutRef.current) {
        clearTimeout(greetingTimeoutRef.current);
      }
    };
  }, [isActive, isSessionStarted, hasGreeted, initialGreeting, sendGreeting]);

  useEffect(() => {
    if (isActive && isSessionStarted) {
      startVoiceChat();
    }
  }, [isActive, isSessionStarted, startVoiceChat]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (isActive && !isSessionStarted && !isLoading && !error) {
      console.log(`[PresentationAvatar ${avatarName}] Effect triggered - starting session`);
      const timer = setTimeout(() => {
        startSession();
      }, 500);
      return () => clearTimeout(timer);
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [isActive, isSessionStarted, isLoading, error, startSession, avatarName]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopSession();
    };
  }, [stopSession]);

  useEffect(() => {
    if (stream && mediaStreamRef.current) {
      mediaStreamRef.current.srcObject = stream;
      mediaStreamRef.current.play().catch(console.error);
    }
  }, [stream]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(false);
    setIsSessionStarted(false);
    setTimeout(() => {
      startSession();
    }, 500);
  }, [startSession]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-slate-800 ${className}`}>
        <div className="text-center p-2">
          <p className="text-red-400 text-xs mb-2">Connection failed</p>
          <button
            onClick={handleRetry}
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !stream) {
    return (
      <div className={`flex items-center justify-center bg-slate-800 ${className}`}>
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin mx-auto mb-2" />
          <div className="text-slate-400 text-xs">
            Connecting...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <video
        ref={mediaStreamRef}
        autoPlay
        playsInline
        muted={false}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
