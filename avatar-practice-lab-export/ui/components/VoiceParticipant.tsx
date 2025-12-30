import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { RealtimeAgent } from '@openai/agents/realtime';
import { useRealtimeSession } from '@/hooks/useRealtimeSession';
import { useHandleSessionHistory } from '@/hooks/useHandleSessionHistory';
import { Volume2, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceParticipantProps {
  participantId: string;
  name: string;
  imageUrl: string;
  personality: string;
  systemPrompt: string;
  voice?: string;
  isActive: boolean;
  onSessionReady?: () => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  initialGreeting?: string;
  className?: string;
}

const voiceMap: Record<string, string> = {
  male: 'ash',
  female: 'sage',
};

export default function VoiceParticipant({
  participantId,
  name,
  imageUrl,
  personality,
  systemPrompt,
  voice,
  isActive,
  onSessionReady,
  onSpeakingChange,
  initialGreeting,
  className,
}: VoiceParticipantProps) {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mountedRef = useRef(true);
  const connectingRef = useRef(false);
  const greetingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useHandleSessionHistory();

  const { status, connect, disconnect, sendUserText } = useRealtimeSession({
    onConnectionChange: (newStatus) => {
      console.log(`[VoiceParticipant ${name}] Connection status: ${newStatus}`);
      if (newStatus === 'CONNECTED') {
        setConnectionStatus('connected');
        onSessionReady?.();
      } else if (newStatus === 'CONNECTING') {
        setConnectionStatus('connecting');
      } else if (newStatus === 'DISCONNECTED') {
        setConnectionStatus('disconnected');
      }
    },
  });

  const sdkAudioElement = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const el = document.createElement('audio');
    el.autoplay = true;
    el.style.display = 'none';
    document.body.appendChild(el);
    return el;
  }, []);

  useEffect(() => {
    if (sdkAudioElement && !audioElementRef.current) {
      audioElementRef.current = sdkAudioElement;

      sdkAudioElement.onplay = () => {
        setIsSpeaking(true);
        onSpeakingChange?.(true);
      };
      sdkAudioElement.onpause = () => {
        setIsSpeaking(false);
        onSpeakingChange?.(false);
      };
      sdkAudioElement.onended = () => {
        setIsSpeaking(false);
        onSpeakingChange?.(false);
      };
    }

    return () => {
      if (sdkAudioElement) {
        sdkAudioElement.onplay = null;
        sdkAudioElement.onpause = null;
        sdkAudioElement.onended = null;
      }
    };
  }, [sdkAudioElement, onSpeakingChange]);

  const getEphemeralKey = useCallback(async () => {
    const response = await fetch('/api/avatar/session', {
      credentials: 'include',
    });
    const data = await response.json();
    return data.client_secret?.value || data.client_secret;
  }, []);

  const createPresentationAgent = useCallback(() => {
    const agentVoice = voice || voiceMap[personality.includes('analytical') ? 'male' : 'female'] || 'sage';
    
    return new RealtimeAgent({
      name: `presentation_participant_${name}`,
      voice: agentVoice,
      instructions: systemPrompt,
      tools: [],
    });
  }, [name, personality, systemPrompt, voice]);

  useEffect(() => {
    mountedRef.current = true;

    const initSession = async () => {
      if (!isActive || connectingRef.current || status === 'CONNECTED') {
        return;
      }

      connectingRef.current = true;
      setConnectionStatus('connecting');

      try {
        console.log(`[VoiceParticipant ${name}] Initializing session...`);
        
        const agent = createPresentationAgent();
        
        await connect({
          getEphemeralKey,
          initialAgents: [agent],
          audioElement: audioElementRef.current || undefined,
        });

        console.log(`[VoiceParticipant ${name}] Session connected successfully`);

        if (initialGreeting && !hasGreeted && mountedRef.current) {
          greetingTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current && !hasGreeted) {
              console.log(`[VoiceParticipant ${name}] Triggering initial greeting`);
              sendUserText(`Please greet the presenter briefly. Say something like: "${initialGreeting}" but make it natural and in your own words. Keep it under 15 words.`);
              setHasGreeted(true);
            }
          }, 1500);
        }

      } catch (error) {
        console.error(`[VoiceParticipant ${name}] Failed to connect:`, error);
        setConnectionStatus('error');
      } finally {
        connectingRef.current = false;
      }
    };

    if (isActive) {
      initSession();
    }

    return () => {
      mountedRef.current = false;
      if (greetingTimeoutRef.current) {
        clearTimeout(greetingTimeoutRef.current);
      }
    };
  }, [isActive, name, createPresentationAgent, connect, getEphemeralKey, initialGreeting, hasGreeted, sendUserText, status]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (greetingTimeoutRef.current) {
        clearTimeout(greetingTimeoutRef.current);
      }
      disconnect();
      if (sdkAudioElement && sdkAudioElement.parentNode) {
        sdkAudioElement.parentNode.removeChild(sdkAudioElement);
      }
    };
  }, [disconnect, sdkAudioElement]);

  const handleRetry = useCallback(() => {
    setConnectionStatus('disconnected');
    connectingRef.current = false;
    setHasGreeted(false);
  }, []);

  return (
    <div className={cn('relative rounded-lg overflow-hidden bg-slate-800', className)}>
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4a5568&color=fff&size=200`;
        }}
      />

      {connectionStatus === 'connecting' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mx-auto mb-2" />
            <span className="text-white text-xs">Connecting...</span>
          </div>
        </div>
      )}

      {connectionStatus === 'error' && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="text-center p-2">
            <span className="text-red-400 text-xs block mb-2">Connection failed</span>
            <button
              onClick={handleRetry}
              className="text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {isSpeaking && (
        <div className="absolute inset-0 ring-4 ring-green-500/50 rounded-lg animate-pulse pointer-events-none" />
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <div className="flex items-center justify-between">
          <span className="text-white text-xs font-medium truncate">{name}</span>
          <div className="flex items-center gap-1">
            {connectionStatus === 'connected' && (
              <>
                {isSpeaking ? (
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse" />
                    <div className="w-1 h-2 bg-green-400 rounded-full animate-pulse delay-75" />
                    <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse delay-150" />
                  </div>
                ) : (
                  <Volume2 className="w-3 h-3 text-green-400" />
                )}
              </>
            )}
            {connectionStatus === 'connecting' && (
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {connectionStatus === 'connected' && (
        <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-green-500/80 rounded px-1 py-0.5">
          <Mic className="w-2.5 h-2.5 text-white" />
          <span className="text-[10px] text-white font-medium">Live</span>
        </div>
      )}
    </div>
  );
}
