import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  VoiceEmotion,
  VoiceChatTransport,
} from "@heygen/streaming-avatar";
import type { StartAvatarResponse } from "@heygen/streaming-avatar";

interface PreWarmConfig {
  avatarId: string;
  knowledgeId?: string;
  knowledgeBase?: string;
  language?: string;
}

interface PreWarmedSession {
  token: string;
  avatar: StreamingAvatar;
  sessionData: StartAvatarResponse | null;
  stream: MediaStream | null;
  avatarId: string;
  knowledgeId?: string;
  knowledgeBase?: string;
  isReady: boolean;
  createdAt: number;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

interface WarmingState {
  isWarming: boolean;
  progress: number;
  status: string;
}

interface AvatarSessionContextType {
  preWarmedSession: PreWarmedSession | null;
  isWarming: boolean;
  warmingProgress: number;
  warmingStatus: string;
  startWarming: (config: PreWarmConfig) => Promise<void>;
  restartWarming: (config: PreWarmConfig) => Promise<void>;
  consumePreWarmedSession: (expectedKnowledgeBase?: string) => PreWarmedSession | null;
  cancelWarming: () => void;
  preWarmToken: () => Promise<void>;
}

const TOKEN_CACHE_DURATION = 10 * 60 * 1000;
const SESSION_MAX_AGE = 15 * 60 * 1000;

const globalSessionState: {
  preWarmedSession: PreWarmedSession | null;
  previousSession: PreWarmedSession | null;
  cachedToken: CachedToken | null;
  warmingState: WarmingState;
  warmingRef: { current: boolean };
  avatarRef: { current: StreamingAvatar | null };
  listeners: Set<() => void>;
  tokenFetchPromise: Promise<string | null> | null;
} = {
  preWarmedSession: null,
  previousSession: null,
  cachedToken: null,
  warmingState: { isWarming: false, progress: 0, status: "" },
  warmingRef: { current: false },
  avatarRef: { current: null },
  listeners: new Set(),
  tokenFetchPromise: null,
};

function notifyListeners() {
  globalSessionState.listeners.forEach(listener => listener());
}

const AvatarSessionContext = createContext<AvatarSessionContextType | null>(null);

export function AvatarSessionProvider({ children }: { children: React.ReactNode }) {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const listener = () => forceUpdate({});
    globalSessionState.listeners.add(listener);
    return () => {
      globalSessionState.listeners.delete(listener);
    };
  }, []);

  const fetchAccessToken = async (forceRefresh = false): Promise<string | null> => {
    if (!forceRefresh && globalSessionState.cachedToken) {
      const { token, expiresAt } = globalSessionState.cachedToken;
      if (Date.now() < expiresAt) {
        console.log("Using cached token");
        return token;
      }
    }

    if (globalSessionState.tokenFetchPromise) {
      console.log("Waiting for existing token fetch...");
      return globalSessionState.tokenFetchPromise;
    }

    console.log("Fetching new access token...");
    globalSessionState.tokenFetchPromise = (async () => {
      try {
        const response = await fetch("/api/avatar/get-access-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Token fetch failed: ${response.status}`);
        }

        const token = await response.text();
        if (!token || token.trim() === "") {
          throw new Error("Received empty token");
        }

        const trimmedToken = token.trim();
        
        globalSessionState.cachedToken = {
          token: trimmedToken,
          expiresAt: Date.now() + TOKEN_CACHE_DURATION,
        };

        return trimmedToken;
      } catch (error) {
        console.error("Error fetching access token for pre-warming:", error);
        return null;
      } finally {
        globalSessionState.tokenFetchPromise = null;
      }
    })();

    return globalSessionState.tokenFetchPromise;
  };

  const updateWarmingState = (updates: Partial<WarmingState>) => {
    globalSessionState.warmingState = { ...globalSessionState.warmingState, ...updates };
    notifyListeners();
  };

  const cleanupSession = async (session: PreWarmedSession | null) => {
    if (session?.avatar) {
      try {
        await session.avatar.stopAvatar();
      } catch (e) {
        console.error("Error stopping avatar:", e);
      }
    }
  };

  const preWarmToken = useCallback(async () => {
    await fetchAccessToken();
  }, []);

  const startWarming = useCallback(async (config: PreWarmConfig, retryCount = 0) => {
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 3000;
    
    if (globalSessionState.warmingRef.current) {
      console.log("Already warming, skipping...");
      return;
    }

    if (globalSessionState.preWarmedSession?.isReady) {
      const session = globalSessionState.preWarmedSession;
      if (session.avatarId === config.avatarId && 
          session.knowledgeBase === config.knowledgeBase &&
          Date.now() - session.createdAt < SESSION_MAX_AGE) {
        console.log("Valid session already exists, skipping warm...");
        return;
      }
    }

    globalSessionState.warmingRef.current = true;
    updateWarmingState({ isWarming: true, progress: 10, status: "Preparing AI assistant..." });

    let createdAvatar: StreamingAvatar | null = null;

    try {
      updateWarmingState({ progress: 25, status: "Getting access token..." });
      const token = await fetchAccessToken();
      
      if (!token) {
        throw new Error("Failed to get access token");
      }

      if (!globalSessionState.warmingRef.current) {
        console.log("Warming cancelled during token fetch");
        return;
      }

      updateWarmingState({ progress: 45, status: "Initializing avatar..." });

      const avatar = new StreamingAvatar({
        token: token,
      });

      createdAvatar = avatar;
      globalSessionState.avatarRef.current = avatar;

      let streamReady: MediaStream | null = null;
      let streamPromiseResolve: ((stream: MediaStream | null) => void) | null = null;
      
      const streamPromise = new Promise<MediaStream | null>((resolve) => {
        streamPromiseResolve = resolve;
        setTimeout(() => resolve(null), 8000);
      });

      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        console.log("Pre-warm: Stream is ready");
        streamReady = event.detail;
        if (streamPromiseResolve) {
          streamPromiseResolve(event.detail);
        }
      });

      avatar.on(StreamingEvents.STREAM_DISCONNECTED, (event) => {
        console.error("Pre-warm stream disconnected:", event);
      });

      updateWarmingState({ progress: 60, status: "Starting avatar session..." });

      if (!globalSessionState.warmingRef.current) {
        console.log("Warming cancelled before createStartAvatar");
        await avatar.stopAvatar();
        createdAvatar = null;
        return;
      }

      // HeyGen v2 API parameters:
      // - Using activityIdleTimeout (300 seconds = 5 min) per SDK 2.0.16+
      // - disableIdleTimeout is deprecated - use activityIdleTimeout instead
      // - Valid range: 30-3600 seconds
      // - version:'v2' required for v2 API features
      const sessionData = await avatar.createStartAvatar({
        quality: AvatarQuality.Low,
        avatarName: config.avatarId,
        knowledgeId: config.knowledgeId,
        knowledgeBase: config.knowledgeBase || "",
        voice: {
          rate: 1.0,
          emotion: VoiceEmotion.FRIENDLY,
        },
        language: config.language || "en",
        voiceChatTransport: VoiceChatTransport.WEBSOCKET,
      });

      if (!globalSessionState.warmingRef.current) {
        console.log("Warming cancelled after createStartAvatar");
        await avatar.stopAvatar();
        createdAvatar = null;
        return;
      }

      updateWarmingState({ progress: 85, status: "Waiting for stream..." });

      const resolvedStream = await streamPromise;

      updateWarmingState({ progress: 100, status: "Ready!" });

      if (globalSessionState.previousSession) {
        await cleanupSession(globalSessionState.previousSession);
        globalSessionState.previousSession = null;
      }

      globalSessionState.preWarmedSession = {
        token,
        avatar,
        sessionData,
        stream: resolvedStream || streamReady,
        avatarId: config.avatarId,
        knowledgeId: config.knowledgeId,
        knowledgeBase: config.knowledgeBase,
        isReady: true,
        createdAt: Date.now(),
      };

      createdAvatar = null;
      console.log("Pre-warming complete! Session ready:", sessionData?.session_id);
      notifyListeners();

    } catch (error: any) {
      console.error("Error during pre-warming:", error);
      
      // Check for concurrent limit error (code 10004) and retry
      const isConcurrentLimitError = error?.responseText?.includes("10004") || 
                                      error?.message?.includes("Concurrent limit");
      
      if (isConcurrentLimitError && retryCount < MAX_RETRIES) {
        console.log(`Concurrent limit hit, retrying in ${RETRY_DELAY}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        updateWarmingState({ status: "Server busy, retrying..." });
        
        // Clean up current attempt
        if (createdAvatar) {
          try {
            await createdAvatar.stopAvatar();
          } catch (e) {
            console.error("Error cleaning up before retry:", e);
          }
          createdAvatar = null;
        }
        
        globalSessionState.warmingRef.current = false;
        
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        
        if (globalSessionState.preWarmedSession?.isReady) {
          console.log("Session already ready after retry delay, skipping retry");
          return;
        }
        
        return startWarming(config, retryCount + 1);
      }
      
      // Show friendlier message for the user
      updateWarmingState({ status: "Will connect on start" });
      globalSessionState.preWarmedSession = null;
    } finally {
      if (createdAvatar && !globalSessionState.preWarmedSession) {
        console.log("Cleaning up orphaned avatar in finally block");
        try {
          await createdAvatar.stopAvatar();
        } catch (e) {
          console.error("Error stopping orphaned avatar:", e);
        }
      }
      updateWarmingState({ isWarming: false });
      globalSessionState.warmingRef.current = false;
    }
  }, []);

  const consumePreWarmedSession = useCallback((expectedKnowledgeBase?: string) => {
    let sessionToUse = globalSessionState.preWarmedSession;
    
    if (sessionToUse?.isReady) {
      const age = Date.now() - sessionToUse.createdAt;
      if (age > SESSION_MAX_AGE) {
        console.log("Pre-warmed session expired, discarding");
        cleanupSession(sessionToUse);
        globalSessionState.preWarmedSession = null;
        sessionToUse = null;
      }
    }
    
    if (sessionToUse?.isReady) {
      if (expectedKnowledgeBase && sessionToUse.knowledgeBase !== expectedKnowledgeBase) {
        console.log("Pre-warmed session knowledgeBase mismatch, checking previous session...");
        
        if (globalSessionState.previousSession?.isReady && 
            globalSessionState.previousSession.knowledgeBase === expectedKnowledgeBase) {
          console.log("Using previous session with matching config");
          sessionToUse = globalSessionState.previousSession;
          globalSessionState.previousSession = null;
        } else {
          cleanupSession(sessionToUse);
          globalSessionState.preWarmedSession = null;
          updateWarmingState({ progress: 0, status: "" });
          globalSessionState.avatarRef.current = null;
          notifyListeners();
          return null;
        }
      }
      
      globalSessionState.preWarmedSession = null;
      updateWarmingState({ progress: 0, status: "" });
      globalSessionState.avatarRef.current = null;
      console.log("Pre-warmed session consumed");
      notifyListeners();
      return sessionToUse;
    }
    return null;
  }, []);

  const restartWarming = useCallback(async (config: PreWarmConfig) => {
    console.log("Restarting warming with new config");
    
    globalSessionState.warmingRef.current = false;
    
    if (globalSessionState.preWarmedSession?.isReady) {
      if (globalSessionState.previousSession) {
        await cleanupSession(globalSessionState.previousSession);
      }
      globalSessionState.previousSession = globalSessionState.preWarmedSession;
      console.log("Keeping previous session as fallback");
    }
    
    globalSessionState.preWarmedSession = null;
    globalSessionState.avatarRef.current = null;
    updateWarmingState({ isWarming: false, progress: 0, status: "" });
    notifyListeners();
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    await startWarming(config);
  }, [startWarming]);

  const cancelWarming = useCallback(() => {
    globalSessionState.warmingRef.current = false;
    updateWarmingState({ isWarming: false, progress: 0, status: "" });
    
    if (globalSessionState.avatarRef.current) {
      globalSessionState.avatarRef.current.stopAvatar().catch(console.error);
      globalSessionState.avatarRef.current = null;
    }
    
    globalSessionState.preWarmedSession = null;
    notifyListeners();
    console.log("Pre-warming cancelled");
  }, []);

  return (
    <AvatarSessionContext.Provider
      value={{
        preWarmedSession: globalSessionState.preWarmedSession,
        isWarming: globalSessionState.warmingState.isWarming,
        warmingProgress: globalSessionState.warmingState.progress,
        warmingStatus: globalSessionState.warmingState.status,
        startWarming,
        restartWarming,
        consumePreWarmedSession,
        cancelWarming,
        preWarmToken,
      }}
    >
      {children}
    </AvatarSessionContext.Provider>
  );
}

export function useAvatarSession() {
  const context = useContext(AvatarSessionContext);
  if (!context) {
    return null;
  }
  return context;
}

export function useAvatarSessionRequired() {
  const context = useContext(AvatarSessionContext);
  if (!context) {
    throw new Error("useAvatarSessionRequired must be used within AvatarSessionProvider");
  }
  return context;
}
