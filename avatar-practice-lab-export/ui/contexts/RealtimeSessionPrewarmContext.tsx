import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import {
  RealtimeSession,
  RealtimeAgent,
  OpenAIRealtimeWebRTC,
} from "@openai/agents/realtime";
import { audioFormatForCodec, applyCodecPreferences } from "@/lib/codecUtils";

interface CachedToken {
  value: string;
  expiresAt: number;
}

interface CachedResearch {
  key: string;
  data: string;
  fetchedAt: number;
}

interface PreconnectedSession {
  session: RealtimeSession;
  scenarioKey: string;
  connectedAt: number;
  audioElement: HTMLAudioElement | null;
}

interface PrewarmState {
  isTokenReady: boolean;
  isTokenFetching: boolean;
  tokenError: string | null;
  researchData: string | null;
  isResearchFetching: boolean;
  isSessionConnecting: boolean;
  isSessionConnected: boolean;
  sessionError: string | null;
}

interface PreconnectOptions {
  scenarioKey: string;
  agent: RealtimeAgent;
  audioElement?: HTMLAudioElement;
  extraContext?: Record<string, any>;
  outputGuardrails?: any[];
}

interface RealtimeSessionPrewarmContextType {
  cachedToken: CachedToken | null;
  cachedResearch: CachedResearch | null;
  prewarmState: PrewarmState;
  prewarmToken: () => Promise<string | null>;
  prewarmResearch: (topic: string, category: string) => Promise<string | null>;
  consumeToken: () => string | null;
  consumeResearch: () => string | null;
  preconnectSession: (options: PreconnectOptions) => Promise<RealtimeSession | null>;
  consumeSession: (scenarioKey: string) => RealtimeSession | null;
  getPreconnectedSession: () => PreconnectedSession | null;
  clearCache: () => void;
}

const TOKEN_VALIDITY_MS = 55 * 1000;
const RESEARCH_VALIDITY_MS = 5 * 60 * 1000;
const SESSION_VALIDITY_MS = 45 * 1000; // Pre-connected session valid for 45s

const RealtimeSessionPrewarmContext = createContext<RealtimeSessionPrewarmContextType | null>(null);

export function RealtimeSessionPrewarmProvider({ children }: { children: React.ReactNode }) {
  const [cachedToken, setCachedToken] = useState<CachedToken | null>(null);
  const [cachedResearch, setCachedResearch] = useState<CachedResearch | null>(null);
  const [preconnectedSession, setPreconnectedSession] = useState<PreconnectedSession | null>(null);
  const [prewarmState, setPrewarmState] = useState<PrewarmState>({
    isTokenReady: false,
    isTokenFetching: false,
    tokenError: null,
    researchData: null,
    isResearchFetching: false,
    isSessionConnecting: false,
    isSessionConnected: false,
    sessionError: null,
  });
  
  const tokenFetchPromiseRef = useRef<Promise<string | null> | null>(null);
  const researchFetchPromiseRef = useRef<Promise<string | null> | null>(null);
  const sessionConnectPromiseRef = useRef<{ scenarioKey: string; requestId: number; promise: Promise<RealtimeSession | null> } | null>(null);
  const sessionConnectRequestIdRef = useRef<number>(0); // Increments for each new connect attempt

  const codecParamRef = useRef<string>(
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("codec") ?? "opus"
      : "opus"
    ).toLowerCase()
  );

  const applyCodec = useCallback(
    (pc: RTCPeerConnection) => applyCodecPreferences(pc, codecParamRef.current),
    []
  );

  const isTokenValid = useCallback(() => {
    if (!cachedToken) return false;
    return Date.now() < cachedToken.expiresAt;
  }, [cachedToken]);

  const isSessionValid = useCallback(() => {
    if (!preconnectedSession) return false;
    return Date.now() < preconnectedSession.connectedAt + SESSION_VALIDITY_MS;
  }, [preconnectedSession]);

  const prewarmToken = useCallback(async (): Promise<string | null> => {
    if (isTokenValid() && cachedToken) {
      console.log("[PrewarmContext] Token already cached and valid");
      return cachedToken.value;
    }

    if (tokenFetchPromiseRef.current) {
      console.log("[PrewarmContext] Token fetch in progress, waiting...");
      return tokenFetchPromiseRef.current;
    }

    console.log("[PrewarmContext] Starting token prewarm...");
    setPrewarmState(prev => ({ ...prev, isTokenFetching: true, tokenError: null }));

    tokenFetchPromiseRef.current = (async () => {
      try {
        const startTime = performance.now();
        const response = await fetch("/api/avatar/session");
        const data = await response.json();
        const duration = performance.now() - startTime;
        
        console.log(`[PrewarmContext] Token fetched in ${duration.toFixed(0)}ms`);

        if (!data.client_secret?.value) {
          throw new Error("No ephemeral key in response");
        }

        const token = data.client_secret.value;
        const newCachedToken: CachedToken = {
          value: token,
          expiresAt: Date.now() + TOKEN_VALIDITY_MS,
        };

        setCachedToken(newCachedToken);
        setPrewarmState(prev => ({
          ...prev,
          isTokenReady: true,
          isTokenFetching: false,
        }));

        return token;
      } catch (error) {
        console.error("[PrewarmContext] Token fetch failed:", error);
        setPrewarmState(prev => ({
          ...prev,
          isTokenFetching: false,
          tokenError: error instanceof Error ? error.message : "Unknown error",
        }));
        return null;
      } finally {
        tokenFetchPromiseRef.current = null;
      }
    })();

    return tokenFetchPromiseRef.current;
  }, [isTokenValid, cachedToken]);

  const prewarmResearch = useCallback(async (topic: string, category: string): Promise<string | null> => {
    const researchKey = `${topic}:${category}`;
    
    if (cachedResearch && cachedResearch.key === researchKey) {
      if (Date.now() < cachedResearch.fetchedAt + RESEARCH_VALIDITY_MS) {
        console.log("[PrewarmContext] Research already cached for:", researchKey);
        return cachedResearch.data;
      }
    }

    if (researchFetchPromiseRef.current) {
      console.log("[PrewarmContext] Research fetch in progress, waiting...");
      return researchFetchPromiseRef.current;
    }

    console.log("[PrewarmContext] Starting research prewarm for:", researchKey);
    setPrewarmState(prev => ({ ...prev, isResearchFetching: true }));

    researchFetchPromiseRef.current = (async () => {
      try {
        const startTime = performance.now();
        const response = await fetch("/api/avatar/research-topic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, category }),
        });

        if (!response.ok) {
          throw new Error(`Research fetch failed: ${response.status}`);
        }

        const data = await response.json();
        const duration = performance.now() - startTime;
        
        console.log(`[PrewarmContext] Research fetched in ${duration.toFixed(0)}ms`);

        if (!data.success || !data.quality?.isUsable) {
          console.log("[PrewarmContext] Research quality too low, not caching");
          setPrewarmState(prev => ({ ...prev, isResearchFetching: false }));
          return null;
        }

        const researchData = data.promptAddition || "";
        setCachedResearch({
          key: researchKey,
          data: researchData,
          fetchedAt: Date.now(),
        });
        
        setPrewarmState(prev => ({
          ...prev,
          isResearchFetching: false,
          researchData: researchData,
        }));

        return researchData;
      } catch (error) {
        console.error("[PrewarmContext] Research fetch failed:", error);
        setPrewarmState(prev => ({ ...prev, isResearchFetching: false }));
        return null;
      } finally {
        researchFetchPromiseRef.current = null;
      }
    })();

    return researchFetchPromiseRef.current;
  }, [cachedResearch]);

  const preconnectSession = useCallback(async (options: PreconnectOptions): Promise<RealtimeSession | null> => {
    const { scenarioKey, agent, audioElement, extraContext, outputGuardrails } = options;

    // Check if we already have a valid pre-connected session for this scenario
    if (preconnectedSession && preconnectedSession.scenarioKey === scenarioKey && isSessionValid()) {
      console.log("[PrewarmContext] Session already pre-connected for:", scenarioKey);
      return preconnectedSession.session;
    }

    // If already connecting for the SAME scenario, wait for it
    if (sessionConnectPromiseRef.current && sessionConnectPromiseRef.current.scenarioKey === scenarioKey) {
      console.log("[PrewarmContext] Session connect in progress for same scenario, waiting...");
      return sessionConnectPromiseRef.current.promise;
    }

    // If connecting for a DIFFERENT scenario, the old request will be ignored when it completes
    // (via requestId check). We start a new connection immediately.
    if (sessionConnectPromiseRef.current && sessionConnectPromiseRef.current.scenarioKey !== scenarioKey) {
      console.log("[PrewarmContext] Scenario changed, old request will be ignored:", sessionConnectPromiseRef.current.scenarioKey);
      // Also invalidate any cached session for the old scenario
      if (preconnectedSession && preconnectedSession.scenarioKey !== scenarioKey) {
        setPreconnectedSession(null);
      }
    }

    // Generate a unique requestId for this connect attempt
    sessionConnectRequestIdRef.current += 1;
    const thisRequestId = sessionConnectRequestIdRef.current;

    console.log("[PrewarmContext] Starting session pre-connect for:", scenarioKey, "requestId:", thisRequestId);
    setPrewarmState(prev => ({ 
      ...prev, 
      isSessionConnecting: true, 
      isSessionConnected: false,
      sessionError: null 
    }));

    const connectPromise = (async () => {
      try {
        const startTime = performance.now();

        // First, ensure we have a token
        let token: string | undefined = cachedToken?.value;
        if (!isTokenValid() || !token) {
          console.log("[PrewarmContext] No valid token, fetching new one for pre-connect...");
          const fetchedToken = await prewarmToken();
          if (!fetchedToken) {
            throw new Error("Failed to get token for pre-connect");
          }
          token = fetchedToken;
        } else {
          // Consume the cached token since we're using it
          setCachedToken(null);
          setPrewarmState(prev => ({ ...prev, isTokenReady: false }));
        }

        const codecParam = codecParamRef.current;
        const audioFormat = audioFormatForCodec(codecParam);

        // Create audio element if not provided
        const sessionAudioElement = audioElement || (typeof document !== 'undefined' ? document.createElement('audio') : null);
        if (sessionAudioElement && !audioElement) {
          sessionAudioElement.autoplay = true;
        }

        const session = new RealtimeSession(agent, {
          transport: new OpenAIRealtimeWebRTC({
            audioElement: sessionAudioElement || undefined,
            changePeerConnection: async (pc: RTCPeerConnection) => {
              applyCodec(pc);
              return pc;
            },
          }),
          model: "gpt-4o-realtime-preview-2025-06-03",
          config: {
            inputAudioFormat: audioFormat,
            outputAudioFormat: audioFormat,
            inputAudioTranscription: {
              model: "gpt-4o-mini-transcribe",
              language: 'en'
            },
          },
          outputGuardrails: outputGuardrails ?? [],
          context: extraContext ?? {},
        });

        // Connect the session
        await session.connect({ apiKey: token });

        const duration = performance.now() - startTime;
        console.log(`[PrewarmContext] Session pre-connected in ${duration.toFixed(0)}ms, requestId: ${thisRequestId}`);

        // Check if this request is still the current one (user hasn't switched scenarios)
        if (sessionConnectRequestIdRef.current !== thisRequestId) {
          console.log(`[PrewarmContext] Stale session detected (requestId ${thisRequestId} != current ${sessionConnectRequestIdRef.current}), closing...`);
          session.close();
          return null;
        }

        // Store the pre-connected session
        setPreconnectedSession({
          session,
          scenarioKey,
          connectedAt: Date.now(),
          audioElement: sessionAudioElement,
        });

        setPrewarmState(prev => ({
          ...prev,
          isSessionConnecting: false,
          isSessionConnected: true,
        }));

        return session;
      } catch (error) {
        // Only update state if this is still the current request
        if (sessionConnectRequestIdRef.current === thisRequestId) {
          console.error("[PrewarmContext] Session pre-connect failed:", error);
          setPrewarmState(prev => ({
            ...prev,
            isSessionConnecting: false,
            isSessionConnected: false,
            sessionError: error instanceof Error ? error.message : "Unknown error",
          }));
        } else {
          console.log(`[PrewarmContext] Ignoring error from stale request ${thisRequestId}`);
        }
        return null;
      } finally {
        // Only clear the ref if this request is still the current one
        if (sessionConnectPromiseRef.current?.requestId === thisRequestId) {
          sessionConnectPromiseRef.current = null;
        }
      }
    })();

    // Store the promise with its scenarioKey and requestId
    sessionConnectPromiseRef.current = { scenarioKey, requestId: thisRequestId, promise: connectPromise };
    return connectPromise;
  }, [preconnectedSession, isSessionValid, cachedToken, isTokenValid, prewarmToken, applyCodec]);

  const consumeToken = useCallback((): string | null => {
    if (!isTokenValid() || !cachedToken) {
      console.log("[PrewarmContext] No valid token to consume");
      return null;
    }
    
    console.log("[PrewarmContext] Consuming cached token");
    const token = cachedToken.value;
    setCachedToken(null);
    setPrewarmState(prev => ({ ...prev, isTokenReady: false }));
    return token;
  }, [isTokenValid, cachedToken]);

  const consumeResearch = useCallback((): string | null => {
    if (!cachedResearch) {
      return null;
    }
    
    console.log("[PrewarmContext] Consuming cached research");
    const data = cachedResearch.data;
    setCachedResearch(null);
    setPrewarmState(prev => ({ ...prev, researchData: null }));
    return data;
  }, [cachedResearch]);

  const consumeSession = useCallback((scenarioKey: string): RealtimeSession | null => {
    if (!preconnectedSession) {
      console.log("[PrewarmContext] No pre-connected session available");
      return null;
    }

    if (preconnectedSession.scenarioKey !== scenarioKey) {
      console.log("[PrewarmContext] Pre-connected session is for different scenario:", preconnectedSession.scenarioKey, "vs", scenarioKey);
      // Close the old session
      preconnectedSession.session.close();
      setPreconnectedSession(null);
      setPrewarmState(prev => ({ ...prev, isSessionConnected: false }));
      return null;
    }

    if (!isSessionValid()) {
      console.log("[PrewarmContext] Pre-connected session expired");
      preconnectedSession.session.close();
      setPreconnectedSession(null);
      setPrewarmState(prev => ({ ...prev, isSessionConnected: false }));
      return null;
    }

    console.log("[PrewarmContext] Consuming pre-connected session");
    const session = preconnectedSession.session;
    setPreconnectedSession(null);
    setPrewarmState(prev => ({ ...prev, isSessionConnected: false }));
    return session;
  }, [preconnectedSession, isSessionValid]);

  const getPreconnectedSession = useCallback((): PreconnectedSession | null => {
    return preconnectedSession;
  }, [preconnectedSession]);

  const clearCache = useCallback(() => {
    // Close any pre-connected session
    if (preconnectedSession) {
      try {
        preconnectedSession.session.close();
      } catch (e) {
        console.warn("[PrewarmContext] Error closing pre-connected session:", e);
      }
    }

    setCachedToken(null);
    setCachedResearch(null);
    setPreconnectedSession(null);
    setPrewarmState({
      isTokenReady: false,
      isTokenFetching: false,
      tokenError: null,
      researchData: null,
      isResearchFetching: false,
      isSessionConnecting: false,
      isSessionConnected: false,
      sessionError: null,
    });
    console.log("[PrewarmContext] Cache cleared");
  }, [preconnectedSession]);

  // Clean up expired session on unmount or when session expires
  useEffect(() => {
    if (preconnectedSession && !isSessionValid()) {
      console.log("[PrewarmContext] Cleaning up expired pre-connected session");
      try {
        preconnectedSession.session.close();
      } catch (e) {
        console.warn("[PrewarmContext] Error closing expired session:", e);
      }
      setPreconnectedSession(null);
      setPrewarmState(prev => ({ ...prev, isSessionConnected: false }));
    }
  }, [preconnectedSession, isSessionValid]);

  return (
    <RealtimeSessionPrewarmContext.Provider
      value={{
        cachedToken,
        cachedResearch,
        prewarmState,
        prewarmToken,
        prewarmResearch,
        consumeToken,
        consumeResearch,
        preconnectSession,
        consumeSession,
        getPreconnectedSession,
        clearCache,
      }}
    >
      {children}
    </RealtimeSessionPrewarmContext.Provider>
  );
}

export function useRealtimePrewarm() {
  const context = useContext(RealtimeSessionPrewarmContext);
  if (!context) {
    throw new Error("useRealtimePrewarm must be used within a RealtimeSessionPrewarmProvider");
  }
  return context;
}
