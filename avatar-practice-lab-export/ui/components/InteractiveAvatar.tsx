import React from "react";
import type { StartAvatarResponse } from "@heygen/streaming-avatar";
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskMode,
  TaskType,
  VoiceEmotion,
  VoiceChatTransport,
} from "@heygen/streaming-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAvatarById } from "@/hooks/use-avatars";
import { Separator } from "@/components/ui/separator";
import { Loader2, Globe } from "lucide-react";

const languageNames: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  zh: "Mandarin",
  ja: "Japanese",
  ko: "Korean",
  hi: "Hindi",
  ar: "Arabic",
  ru: "Russian",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
};
import { Label } from "@/components/ui/label";
import { useEffect, useRef, useState } from "react";
import { useMemoizedFn } from "ahooks";
import InteractiveAvatarTextInput from "./InteractiveAvatarTextInput";
import { useRouter } from "wouter";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { useAvatarSession } from "@/contexts/AvatarSessionContext";
import AvatarLoadingOverlay from "./AvatarLoadingOverlay";
import SessionTimer from "./SessionTimer";
import { generateAvatarPromptFromBlueprint, buildOpeningDirective, buildFullScenarioPrompt, type ConversationBlueprint, type ScenarioCounterPersona, type PersonaOverlay, type CulturalGreetingStyle } from "@/lib/conversation-framework";

// import {avatarData} from "../../pages/avatar-simulator/practice/avatar-select/page"
// Enhanced function to generate a unique ID based on timestamp and random characters
export function generateUniqueId(prefix = "tr") {
  const timestamp = Date.now().toString(36); // Convert timestamp to base36
  const randomStr = Math.random().toString(36).substring(2, 8); // 6 random chars
  return `${prefix}_${timestamp}_${randomStr}`;
}

// Map short language codes to full BCP 47 locale codes for speech recognition
function getLanguageCode(shortCode: string): string {
  const languageMap: Record<string, string> = {
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    it: "it-IT",
    pt: "pt-PT",
    zh: "zh-CN",
    ja: "ja-JP",
    ko: "ko-KR",
    hi: "hi-IN",
    ar: "ar-SA",
    ru: "ru-RU",
    nl: "nl-NL",
    pl: "pl-PL",
    tr: "tr-TR",
  };
  return languageMap[shortCode] || "en-US";
}

interface InteractiveAvatarProps {
  initialAvatarId: string;
  initialKnowledgeId: string;
  
  scenario?: {
    context?: string;
    instructions?: string;
    description?: string;
    avatarRole?: string;
    avatarName?: string;
    name?: string;
    openingScene?: string;
    tags?: string[];
    counterPersona?: ScenarioCounterPersona;
    personaOverlays?: Record<string, PersonaOverlay>;
  };
  
  personaOverlay?: PersonaOverlay;
}

interface TranscriptLine {
  speaker: "User" | "Avatar";
  text: string;
  timestamp: string;
}
const defaultSessionId = `unknown-${crypto.randomUUID().replaceAll("-", "")}`;
export default function InteractiveAvatar({
  initialAvatarId,
  initialKnowledgeId,
  scenario,
  personaOverlay
}: InteractiveAvatarProps) {
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingRepeat, setIsLoadingRepeat] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  const [sessionStatus, setSessionStatus] = useState<
    "not_started" | "started" | "ended"
  >("not_started");
  const [isSessionEnding, setIsSessionEnding] = useState(false);
  const [debug, setDebug] = useState<string>();
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const router = useRouter();
  const [knowledgeId, setKnowledgeId] = useState<string>(initialKnowledgeId);
  const [avatarId, setAvatarId] = useState<string>(initialAvatarId);
  const [data, setData] = useState<StartAvatarResponse>();
  const [text, setText] = useState<string>("");
  const mediaStream = useRef<HTMLVideoElement>(null);
  const avatar = useRef<StreamingAvatar | null>(null);
  const [chatMode, setChatMode] = useState("voice_mode"); // Default to voice mode
  const [isUserTalking, setIsUserTalking] = useState(false);
  const [isAvatarTalking, setIsAvatarTalking] = useState(false);
  const [transcriptId, setTranscriptId] = useState<string | null>(null);
  const [trackedSessionId, setTrackedSessionId] = useState<number | null>(null);
  const [sessionExpiryWarning, setSessionExpiryWarning] = useState(false);
  const [streamConnectionError, setStreamConnectionError] = useState<string | null>(null);
  const streamTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamReadyRef = useRef<boolean>(false);

  const { user } = useAuth();
  const avatarSession = useAvatarSession();
  const [searchParams] = useSearchParams();
  // Read language from URL params, default to 'en'
  const languageParam = searchParams.get("language") || "en";
  const [language, setLanguage] = useState<string>(languageParam);
  // Transcript state
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const transcriptRef = useRef<TranscriptLine[]>([]);
  const [transcriptUrl, setTranscriptUrl] = useState<string | null>(null);

  const navigate = useNavigate();
  // Sentence collection buffers
  const [currentAvatarSentence, setCurrentAvatarSentence] =
    useState<string>("");
  const [currentUserSentence, setCurrentUserSentence] = useState<string>("");
  const saveInProgressRef = useRef(false);
  const sessionIdRef = useRef(null);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const initializationRef = useRef(false);

  // Speech recognition for voice mode
  const recognitionRef = useRef<any>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const audioAnalyzerRef = useRef<any>(null);
  const sessionStartTimeRef = useRef<number | null>(null); // Track session start time
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const { data: selectedAvatar, isLoading } = useAvatarById(initialAvatarId);

  const logDebug = (message: string) => {
    console.log(message);
    setDebug((prev) => `${message}\n${prev || ""}`);
  };

  // Keep-alive mechanism per HeyGen best practices
  // Sends heartbeat every 30 seconds to prevent session timeout
  useEffect(() => {
    const sendKeepAlive = async () => {
      const currentSessionId = sessionIdRef.current || data?.session_id;
      if (!currentSessionId || sessionStatus !== "started") {
        return;
      }

      try {
        const response = await fetch("/api/avatar/keep-alive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: currentSessionId }),
        });
        
        if (response.ok) {
          console.log("Keep-alive sent successfully");
          lastActivityRef.current = Date.now();
        } else {
          console.warn("Keep-alive failed:", await response.text());
        }
      } catch (error) {
        console.error("Keep-alive error:", error);
      }
    };

    // Start heartbeat when session is active
    if (sessionStatus === "started" && (sessionIdRef.current || data?.session_id)) {
      // Send keep-alive every 30 seconds (per HeyGen recommendations)
      keepAliveIntervalRef.current = setInterval(sendKeepAlive, 30000);
      console.log("Started keep-alive heartbeat");
    }

    return () => {
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
        console.log("Stopped keep-alive heartbeat");
      }
    };
  }, [sessionStatus, data?.session_id]);

  // Visibility change handler per HeyGen best practices
  // Track when user leaves/returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("Tab hidden - session may timeout if inactive too long");
      } else {
        console.log("Tab visible - resuming activity tracking");
        lastActivityRef.current = Date.now();
        
        // Send immediate keep-alive when returning to tab
        const currentSessionId = sessionIdRef.current || data?.session_id;
        if (currentSessionId && sessionStatus === "started") {
          fetch("/api/avatar/keep-alive", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: currentSessionId }),
          }).catch(console.error);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [sessionStatus, data?.session_id]);

  // Track session with backend for 6-minute enforcement
  const startTrackedSession = async (heygenSessionId: string) => {
    try {
      const scenarioId = searchParams.get("scenarioId");
      const response = await fetch("/api/avatar/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heygenSessionId,
          scenarioId,
          avatarId,
          mode: chatMode,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.session) {
          setTrackedSessionId(data.session.id);
          console.log(`[Session Tracking] Started tracked session ${data.session.id}, expires at ${data.session.expiresAt}`);
          return data.session;
        }
      } else {
        console.warn("Failed to start tracked session:", await response.text());
      }
    } catch (error) {
      console.error("Error starting tracked session:", error);
    }
    return null;
  };

  // End tracked session with backend
  const endTrackedSession = async (reason: string = "user_ended") => {
    if (!trackedSessionId) return;

    try {
      const heygenSessionId = sessionIdRef.current || data?.session_id;
      await fetch("/api/avatar/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: trackedSessionId,
          heygenSessionId,
          reason,
        }),
      });
      console.log(`[Session Tracking] Ended tracked session ${trackedSessionId}, reason: ${reason}`);
    } catch (error) {
      console.error("Error ending tracked session:", error);
    }
  };

  // Handle session expiry from timer
  const handleSessionExpired = async () => {
    console.log("[Session Tracking] Session time limit reached, ending session...");
    await endSession();
  };

  // Handle session warning from timer
  const handleSessionWarning = (remainingSec: number) => {
    setSessionExpiryWarning(true);
    console.log(`[Session Tracking] Session ending in ${remainingSec} seconds`);
  };

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      // Check if component is still mounted and not already initialized
      if (!isMounted || initializationRef.current || sessionInitialized) {
        return;
      }

      try {
        initializationRef.current = true;
        setSessionInitialized(true);
        await startSession();
      } catch (error) {
        console.error("Failed to auto-start session:", error);
        // Reset flags on error to allow retry
        initializationRef.current = false;
        setSessionInitialized(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initializeSession, 200);

    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);
  // Fixed cleanExistingTranscript function - returns cleaned transcript instead of just updating state
  const cleanExistingTranscript = (transcriptToClean = null) => {
    const sourceTranscript = transcriptToClean || transcriptRef.current;

    const cleanedTranscript = sourceTranscript.filter(
      (line) =>
        !line.text.includes("Interrupt task") &&
        !line.text.includes("End session & Save") &&
        !line.text.includes("View Transcript") &&
        !line.text.includes("Clear"),
    );

    // Update state if no specific transcript was passed
    if (!transcriptToClean) {
      setTranscript(cleanedTranscript);
      // Update ref immediately for consistency
      transcriptRef.current = cleanedTranscript;
    }

    // Also clean localStorage
    try {
      const savedTranscript = JSON.parse(
        localStorage.getItem("transcript") || "[]",
      );
      const cleanedSavedTranscript = savedTranscript.filter(
        (line) =>
          !line.text.includes("Interrupt task") &&
          !line.text.includes("End session & Save") &&
          !line.text.includes("View Transcript") &&
          !line.text.includes("Clear"),
      );
      localStorage.setItem(
        "transcript",
        JSON.stringify(cleanedSavedTranscript),
      );
    } catch (e) {
      console.log(`Error cleaning localStorage transcript: ${e.message}`);
    }

    return cleanedTranscript;
  };

  const endSession = async () => {
    console.log({ sessionStatus, isSessionEnding });

    // Prevent multiple concurrent ends
    if (isSessionEnding) {
      console.log("Session already ending");
      return;
    }
    try {
      setUploadStatus("Ending session and saving transcript...");
      setSessionStatus("ended");
      setIsSessionEnding(true);
      console.log("Starting endSession...");
      
      // Reset stream readiness state for future sessions
      streamReadyRef.current = false;
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
        streamTimeoutRef.current = null;
      }
      
      // End tracked session with backend
      await endTrackedSession("user_ended");

      // Clean transcript first and get the cleaned version
      const cleanedTranscript = cleanExistingTranscript();
      console.log(`Cleaned transcript length: ${cleanedTranscript.length}`);
      const sessionId = sessionIdRef.current || data?.session_id;

      // Log transcript state using the cleaned version
      console.log(`Current transcript length: ${cleanedTranscript.length}`);
      console.log(`Session ID: ${sessionId}`);
      console.log(`Avatar ID: ${avatarId}`);
      console.log(`Knowledge ID: ${knowledgeId}`);

      // Save streaming session first
      if (sessionId) {
        const sessionData = {
          sessionId: sessionId,
          avatarId: avatarId,
          knowledgeId: knowledgeId,
          startTime: sessionStartTimeRef.current
            ? new Date(sessionStartTimeRef.current).toISOString()
            : new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: sessionStartTimeRef.current
            ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
            : null,
          userId: user?.id || 1,
        };

        console.log(
          `Saving streaming session with data: ${JSON.stringify(sessionData)}`,
        );

        try {
          const sessionResponse = await fetch(
            "/api/avatar/save-streaming-session",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(sessionData),
            },
          );

          const responseText = await sessionResponse.text();
          console.log(`Raw session response: ${responseText}`);

          if (!sessionResponse.ok) {
            console.log(
              `Failed to save streaming session: ${sessionResponse.status} - ${sessionResponse.statusText}`,
            );
            console.log(`Response body: ${responseText}`);
          } else {
            try {
              const result = JSON.parse(responseText);
              console.log(
                `Successfully saved streaming session: ${JSON.stringify(result)}`,
              );
            } catch (e) {
              console.log(`Error parsing session response: ${e.message}`);
            }
          }
        } catch (sessionError) {
          console.log(
            `Error saving session: ${(sessionError as Error).message}`,
          );
          console.log(`Error stack: ${(sessionError as Error).stack}`);
        }
      }

      // Stop avatar
      if (avatar.current) {
        try {
          await avatar.current.stopAvatar();
          console.log("Avatar stopped successfully");
        } catch (error) {
          console.error("Error stopping avatar:", error);
          console.log(`Error stopping avatar: ${(error as Error).message}`);
        }
      }

      // Stop speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          console.log("Speech recognition stopped");
        } catch (error) {
          console.error("Error stopping speech recognition:", error);
          console.log(
            `Error stopping speech recognition: ${(error as Error).message}`,
          );
        }
      }

      // Stop mutation observer
      if (observerRef.current) {
        try {
          if (typeof observerRef.current.cleanup === "function") {
            observerRef.current.cleanup();
          } else if (typeof observerRef.current.disconnect === "function") {
            observerRef.current.disconnect();
          } else {
            console.log("Observer doesn't have disconnect or cleanup method");
          }
          console.log("Mutation observer stopped");
        } catch (error) {
          console.error("Error cleaning up observer:", error);
          console.log(`Error cleaning up observer: ${error.message}`);
        }
      }

      // Clean up audio analyzer
      if (audioAnalyzerRef.current) {
        try {
          audioAnalyzerRef.current.cleanup();
          console.log("Audio analyzer cleaned up");
        } catch (error) {
          console.error("Error cleaning up audio analyzer:", error);
          console.log(`Error cleaning up audio analyzer: ${error.message}`);
        }
      }

      // Add closing message if not already present (use the cleaned transcript)
      const hasEndingMessage = cleanedTranscript.some(
        (line) =>
          line.speaker === "Avatar" &&
          (line.text.includes("Thank you for your time") ||
            line.text.includes("Session ended")),
      );

      if (!hasEndingMessage && sessionStatus === "ended") {
        addToTranscript("Avatar", "Session ended. Thank you for your time.");
        console.log("Added closing message to transcript");
      }

      try {
        console.log("Starting transcript save process...");

        // Call saveTranscript once - it has its own retry logic
        const transcriptId = await saveTranscript();

        if (transcriptId) {
          console.log(`Transcript saved successfully with ID: ${transcriptId}`);
          setUploadStatus("Transcript saved successfully! Redirecting...");

          // Set transcript ID in parent component and localStorage
          setTranscriptId(transcriptId);
          localStorage.setItem("last_transcript_id", transcriptId);
          console.log(`Saved transcript ID: ${transcriptId}`);

          // // Try to get AI analysis before redirecting
          // try {
          //   setUploadStatus("Analyzing conversation...");
          //   console.log("Getting AI analysis of conversation");

          //   const analysisResponse = await fetch(
          //     "/api/avatar/analyze-transcript",
          //     {
          //       method: "POST",
          //       headers: {
          //         "Content-Type": "application/json",
          //       },
          //       body: JSON.stringify({
          //         transcript: {
          //           messages: transcriptRef.current,
          //           context: context,
          //           instructions: instructions,
          //           scenario_name: "",
          //           skill_name: "",
          //         },
          //       }),
          //     },
          //   );

          //   if (analysisResponse.ok) {
          //     const analysisResult = await analysisResponse.json();
          //     if (analysisResult.success && analysisResult.analysis) {
          //       localStorage.setItem("lastAnalysis", analysisResult.analysis);
          //       console.log("Analysis saved to localStorage");
          //     }
          //   }
          // } catch (analysisError) {
          //   console.log(
          //     `Error getting analysis, continuing: ${analysisError.message}`,
          //   );
          // }

          // Link the transcript to the session if needed
          if (sessionId && transcriptId) {
            try {
              console.log(
                `Linking transcript ${transcriptId} to session ${sessionId}`,
              );

              const sessionUpdateData = {
                sessionId: sessionId,
                avatarId: avatarId,
                knowledgeId: knowledgeId,
                transcriptId: transcriptId,
              };

              const updateResponse = await fetch(
                "/api/avatar/save-streaming-session",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(sessionUpdateData),
                },
              );

              if (updateResponse.ok) {
                console.log("Successfully linked transcript to session");
              }
            } catch (linkError) {
              console.log(
                `Error linking transcript to session: ${linkError.message}`,
              );
            }
          }

          // Handle redirect to results page with the transcript ID
          console.log(
            `Redirecting to session results with ID: ${transcriptId}`,
          );
          setUploadStatus("Redirecting to results page...");

          // Save ID to localStorage for the results page
          localStorage.setItem("last_transcript_id", transcriptId);

          // Get skill and scenario IDs for navigation back
          const skillId = searchParams.get("skill");
          const scenarioId = searchParams.get("scenarioId");
          const blueprintParam = searchParams.get("blueprint");
          
          // Build URL with all relevant params for proper back navigation
          const analysisUrl = new URL("/avatar/session-analysis", window.location.origin);
          analysisUrl.searchParams.set("sid", sessionId);
          analysisUrl.searchParams.set("tid", transcriptId);
          analysisUrl.searchParams.set("type", "streaming_avatar");
          if (skillId) analysisUrl.searchParams.set("skill", skillId);
          if (scenarioId) analysisUrl.searchParams.set("scenario", scenarioId);
          if (blueprintParam) analysisUrl.searchParams.set("blueprint", blueprintParam);
          
          navigate(analysisUrl.pathname + analysisUrl.search);
          // Clear state
          setStream(undefined);
        } else {
          throw new Error("No transcript ID returned from save function");
        }
      } catch (error) {
        console.log(`All save attempts failed: ${(error as Error).message}`);
        setUploadStatus("Transcript save failed. Session ended.");

        // Create a backup in localStorage
        try {
          localStorage.setItem(
            "finalTranscript",
            JSON.stringify(transcriptRef.current),
          );
          console.log("Created backup in localStorage");
        } catch (e) {
          console.log(
            `Error creating localStorage backup: ${(e as Error).message}`,
          );
        }
      }

      // Clear session state
      setStream(undefined);
      console.log("Session ended completely");
    } catch (error) {
      console.log(`Error in endSession: ${(error as Error).message}`);
    } finally {
      setTimeout(() => setIsSessionEnding(false), 3000);
    }
  };

  // Fixed saveTranscript function
  const saveTranscript = async () => {
    // Prevent multiple concurrent saves
    if (saveInProgressRef.current) {
      console.log("Save already in progress, skipping duplicate call");
      return null;
    }
    const sessionId =
      sessionIdRef.current || data?.session_id || defaultSessionId;

    try {
      saveInProgressRef.current = true;
      console.log("Starting transcript save process...");
      console.log(`Current session ID: ${sessionId}`);

      // Use transcriptRef.current instead of transcript state
      const currentTranscript = transcriptRef.current;
      console.log(`Current transcript length: ${currentTranscript.length}`);

      // Clean the transcript without updating state (just get cleaned version)
      const cleanedTranscript = cleanExistingTranscript(currentTranscript);

      if (cleanedTranscript.length === 0) {
        console.log("Empty transcript, nothing to save");
        return null;
      }

      // Set uploading status
      setUploadStatus("Saving transcript to database...");
      console.log("Preparing transcript data for save...");

      // Calculate session duration if available
      const sessionStartTime = sessionStartTimeRef.current;
      let duration = null;
      if (sessionStartTime) {
        duration = Math.floor((Date.now() - sessionStartTime) / 1000);
        console.log(`Session duration: ${duration} seconds`);
      }

      // Generate a unique transcript ID
      const transcriptId = generateUniqueId("tr");
      console.log(`Using transcript ID: ${transcriptId}`);
      const skillId = searchParams.get("skill");
      const scenarioId = searchParams.get("scenarioId");
      const customScenarioId = searchParams.get("customScenarioId");
      
      // Get context from scenario or blueprint (for impromptu speaking sessions)
      // Priority: scenario.context > URL topic param > URL blueprint > sessionStorage blueprint
      let contextForTranscript = scenario?.context || "";
      if (!contextForTranscript) {
        const topicParam = searchParams.get("topic");
        const blueprintParam = searchParams.get("blueprint");
        const blueprintId = searchParams.get("blueprintId");
        
        // 1. Check URL topic param first (most reliable for impromptu)
        if (topicParam) {
          try {
            contextForTranscript = decodeURIComponent(topicParam);
            console.log(`Using topic from URL for context: ${contextForTranscript}`);
          } catch (e) {
            console.error("Failed to decode topic param:", e);
          }
        }
        
        // 2. Check URL blueprint param
        if (!contextForTranscript && blueprintParam) {
          try {
            const blueprint = JSON.parse(decodeURIComponent(blueprintParam));
            contextForTranscript = blueprint?.scenarioSummary?.title || blueprint?.scenario?.name || "";
            console.log(`Using URL blueprint topic for context: ${contextForTranscript}`);
          } catch (e) {
            console.error("Failed to parse URL blueprint for context:", e);
          }
        }
        
        // 3. Check sessionStorage blueprint (for refreshes or deep links)
        if (!contextForTranscript && blueprintId) {
          try {
            const storedBlueprint = sessionStorage.getItem(`blueprint:${blueprintId}`);
            if (storedBlueprint) {
              const blueprint = JSON.parse(storedBlueprint);
              contextForTranscript = blueprint?.scenarioSummary?.title || blueprint?.scenario?.name || "";
              console.log(`Using sessionStorage blueprint topic for context: ${contextForTranscript}`);
            }
          } catch (e) {
            console.error("Failed to parse sessionStorage blueprint for context:", e);
          }
        }
        
        // 4. Log if still no context (for debugging)
        if (!contextForTranscript) {
          console.log("No context found for transcript - impromptu detection may fail");
        }
      }

      // Get persona overlay from URL params for session config
      const personaOverlayLevel = searchParams.get("personaOverlay");
      const personaOverlayDataParam = searchParams.get("personaOverlayData");
      let personaOverlayData = null;
      if (personaOverlayDataParam) {
        try {
          personaOverlayData = JSON.parse(decodeURIComponent(personaOverlayDataParam));
        } catch (e) {
          console.error("Failed to parse personaOverlayData:", e);
        }
      }

      // Build session config with persona overlay for analytics and feedback
      const sessionConfig = {
        personaLevel: personaOverlayLevel || null,
        personaOverlay: personaOverlayData || null,
      };

      // Prepare transcript data
      const transcriptData = {
        transcriptId: transcriptId,
        sessionId: sessionId,
        avatarId: avatarId,
        knowledgeId: knowledgeId,
        context: contextForTranscript,
        instructions: scenario?.instructions || "",
        description: scenario?.description || "",
        scenario: "",
        skill: "",
        messages: cleanedTranscript.map((msg) => ({
          speaker: msg.speaker,
          text: msg.text,
          timestamp: msg.timestamp,
        })),
        duration: duration,
        userId: user?.id || 1,
        skillId: skillId ? parseInt(skillId) : null,
        scenarioId: scenarioId ? parseInt(scenarioId) : null,
        customScenarioId: customScenarioId ? parseInt(customScenarioId) : null,
        sessionConfig: sessionConfig,
      };

      // Debug log the data we're about to send
      console.log(
        `Saving transcript with ${cleanedTranscript.length} messages for session: ${transcriptData.sessionId}`,
      );

      // Create local backup before attempting server save
      try {
        localStorage.setItem(
          "pendingTranscript",
          JSON.stringify(transcriptData),
        );
        console.log(
          "Created local backup of transcript before saving to server",
        );
      } catch (backupError) {
        console.log(
          `Warning: Could not create local backup: ${backupError.message}`,
        );
      }

      // Send to database via API with timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      console.log(
        `Sending transcript data: ${JSON.stringify({
          sessionId: transcriptData.sessionId,
          messageCount: transcriptData.messages.length,
          hasContext: !!transcriptData.context,
        })}`,
      );

      try {
        const response = await fetch("/api/avatar/save-transcript", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(transcriptData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log(`Save response status: ${response.status}`);
        const responseText = await response.text();
        console.log(`Raw response: ${responseText}`);

        if (!response.ok) {
          throw new Error(
            `Server responded with status: ${response.status}, message: ${responseText}`,
          );
        }

        const result = JSON.parse(responseText);
        console.log(`API response: ${JSON.stringify(result)}`);

        if (result.success) {
          console.log(
            `Transcript saved to database with ID: ${result.transcriptId}`,
          );
          setUploadStatus("Analyzing conversation...");

          // Get AI analysis of the conversation
          try {
            const analysisResponse = await fetch(
              "/api/avatar/analyze-transcript",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  transcript: {
                    messages: cleanedTranscript,
                    context: scenario?.context,
                    instructions: scenario?.instructions,
                    scenario: "",
                    skill: "",
                  },
                }),
              },
            );

            if (analysisResponse.ok) {
              const analysisResult = await analysisResponse.json();
              if (analysisResult.success && analysisResult.analysis) {
                localStorage.setItem("lastAnalysis", analysisResult.analysis);
                console.log("Analysis saved to localStorage");
              }
            }
          } catch (analysisError) {
            console.log(
              `Error getting analysis: ${(analysisError as Error).message}`,
            );
          }

          setUploadStatus("Transcript saved successfully!");
          localStorage.removeItem("pendingTranscript");

          return result.transcriptId;
        } else {
          throw new Error(result.error || "Database save failed");
        }
      } catch (firstError) {
        console.log(
          `First save attempt error: ${(firstError as Error)?.message}`,
        );

        // Make a second attempt
        const retryResponse = await fetch("/api/avatar/save-transcript", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          body: JSON.stringify(transcriptData),
          keepalive: true,
        });

        console.log(`Retry API response status: ${retryResponse.status}`);

        if (retryResponse.ok) {
          const retryResult = await retryResponse.json();
          console.log(`Retry API response: ${JSON.stringify(retryResult)}`);

          if (retryResult.success) {
            console.log(
              `Retry successful! Transcript saved with ID: ${retryResult.transcriptId}`,
            );
            setUploadStatus("Transcript saved on retry!");
            return retryResult.transcriptId;
          } else {
            throw new Error(retryResult.error || "Retry save failed");
          }
        } else {
          const errorText = await retryResponse.text();
          throw new Error(
            `Retry failed with status: ${retryResponse.status}, message: ${errorText}`,
          );
        }
      }
    } catch (error) {
      console.log(`All save attempts failed: ${(error as Error).message}`);
      setUploadStatus("Failed to save transcript to database");

      // Save to localStorage as fallback
      try {
        const finalBackup = {
          id: generateUniqueId("tr"),
          timestamp: new Date().toISOString(),
          avatarId: avatarId,
          knowledgeId: knowledgeId,
          sessionId: sessionId,
          transcript: transcriptRef.current,
        };

        localStorage.setItem("finalTranscript", JSON.stringify(finalBackup));

        const formattedContent = transcriptRef.current
          .map((line) => `[${line.timestamp}] ${line.speaker}: ${line.text}`)
          .join("\n");

        console.log("Created complete local backup with formatted content");
        console.log(
          "You can retrieve this transcript from localStorage.getItem('finalTranscript')",
        );
      } catch (fallbackError) {
        console.log(`Fallback saving also failed: ${fallbackError.message}`);
      }

      return null;
    } finally {
      // Always reset the flag when done
      saveInProgressRef.current = false;
    }
  };
  // Enhanced addToTranscript function with better duplicate detection for both user and avatar
  const addToTranscript = (speaker: "User" | "Avatar", text: string) => {
    if (!text || text.trim() === "") return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString();
    let trimmedText = text.trim();

    // Log the size of messages to track potential limits
    if (trimmedText.length > 500) {
      console.log(
        `Long message being added to transcript (${speaker}): ${trimmedText.length} characters`,
      );
    }

    // Split long messages into chunks of 200 characters
    const chunkSize = 200;
    if (trimmedText.length > chunkSize) {
      const chunks = [];
      for (let i = 0; i < trimmedText.length; i += chunkSize) {
        chunks.push(trimmedText.substring(i, i + chunkSize));
      }
      trimmedText = chunks.join("\n"); // Join with newline for readability
    }

    const newLine: TranscriptLine = {
      speaker,
      text: trimmedText,
      timestamp,
    };

    // Check if this is a duplicate or similar to recent messages
    setTranscript((prev) => {
      // More thorough duplicate check that looks at recent messages
      const recentMessages = prev.slice(-5); // Check last 5 messages to catch more duplicates

      // Check for exact duplicates (for both user and avatar)
      const exactDuplicate = recentMessages.some(
        (msg) => msg.speaker === speaker && msg.text === trimmedText,
      );

      if (exactDuplicate) {
        console.log(
          `Skipping exact duplicate message - ${speaker}: "${trimmedText}"`,
        );
        return prev; // Skip exact duplicates
      }

      // Check for similar content (for both user and avatar)
      // This handles cases where there are minor differences in the messages
      const similarMessages = recentMessages.filter(
        (msg) =>
          msg.speaker === speaker &&
          // Check if one contains the other (in either direction)
          (trimmedText.includes(msg.text) ||
            msg.text.includes(trimmedText) ||
            // Check for high similarity using character overlap
            isSimilarText(trimmedText, msg.text)),
      );

      if (similarMessages.length > 0) {
        // If we find similar messages, replace the most recent one with this new message
        const updatedMessages = [...prev];
        const lastSimilarIndex = prev.findIndex(
          (msg) =>
            msg.speaker === speaker &&
            (trimmedText.includes(msg.text) ||
              msg.text.includes(trimmedText) ||
              isSimilarText(trimmedText, msg.text)),
        );

        if (lastSimilarIndex >= 0) {
          // Only replace with the new message if it's longer (likely more complete)
          if (
            trimmedText.length >= updatedMessages[lastSimilarIndex].text.length
          ) {
            updatedMessages[lastSimilarIndex] = newLine;

            // Update localStorage
            try {
              const savedTranscript = JSON.parse(
                localStorage.getItem("transcript") || "[]",
              );
              savedTranscript[lastSimilarIndex] = newLine;
              localStorage.setItem(
                "transcript",
                JSON.stringify(savedTranscript),
              );
            } catch (e) {
              console.log(`Error updating localStorage: ${e.message}`);
            }

            console.log(
              `Updated transcript entry - ${speaker}: "${trimmedText}"`,
            );
            return updatedMessages;
          } else {
            console.log(`Keeping longer existing message - ${speaker}`);
            return prev; // Keep the longer version
          }
        }
      }

      // Additional check for partial duplicates across different speakers
      // This prevents cases where part of what the avatar says matches what the user said
      if (trimmedText.length > 20) {
        // Only for longer messages where this is more likely
        const containsPartOfOtherMessage = recentMessages.some(
          (msg) =>
            // Check if this message contains a significant part of another recent message
            (msg.text.length > 10 && trimmedText.includes(msg.text)) ||
            // Or if another message contains a significant part of this one
            (trimmedText.length > 10 && msg.text.includes(trimmedText)),
        );

        if (containsPartOfOtherMessage) {
          console.log(
            `Skipping message that contains part of another message - ${speaker}: "${trimmedText}"`,
          );
          return prev;
        }
      }

      // If we get here, this is a new message to add
      console.log(`Added to transcript - ${speaker}: "${trimmedText}"`);

      try {
        const savedTranscript = JSON.parse(
          localStorage.getItem("transcript") || "[]",
        );
        savedTranscript.push(newLine);
        localStorage.setItem("transcript", JSON.stringify(savedTranscript));
      } catch (e) {
        console.log(`Error saving to localStorage: ${e.message}`);
      }

      transcriptRef.current = [...transcriptRef.current, newLine]; // Update the ref

      return [...prev, newLine];
    });
  };

  // Helper function to determine if two texts are very similar
  const isSimilarText = (text1: string, text2: string): boolean => {
    // If one is much longer than the other, they're not similar enough
    if (
      Math.abs(text1.length - text2.length) >
      Math.min(text1.length, text2.length) * 0.3
    ) {
      return false;
    }

    // Count words that appear in both texts
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);

    // For very short texts, use a different approach
    if (words1.length <= 3 || words2.length <= 3) {
      // If one is a subset of the other, consider them similar
      return (
        text1.toLowerCase().includes(text2.toLowerCase()) ||
        text2.toLowerCase().includes(text1.toLowerCase())
      );
    }

    // Count common words
    const commonWords = words1.filter((word) => words2.includes(word));

    // Calculate similarity ratio
    const similarityRatio =
      commonWords.length / Math.max(words1.length, words2.length);

    // If more than 70% of words are the same, consider them similar
    return similarityRatio > 0.7;
  };

  // Enhanced speech recognition setup for user speech
  const setupSpeechRecognition = () => {
    if (!("webkitSpeechRecognition" in window)) {
      console.log("Speech recognition not supported");
      return;
    }

    try {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      // Set speech recognition language based on selected language
      recognition.lang = getLanguageCode(language);
      console.log(`Speech recognition language set to: ${recognition.lang}`);

      // When we get results
      recognition.onresult = (event: any) => {
        let interimText = "";
        let finalText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript + " ";
            // Add complete user speech to transcript
            if (finalText.trim()) {
              addToTranscript("User", finalText.trim());
            }
          } else {
            interimText += transcript;
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.log(`Speech recognition error: ${event.error}`);
      };

      recognition.onend = () => {
        if (stream) {
          recognition.start();
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      console.log("Speech recognition started");
    } catch (error) {
      console.log(
        `Error starting speech recognition: ${(error as Error).message}`,
      );
    }
  };

  // Advanced avatar speech capture with enhanced reliability
  const setupAvatarSpeechCapture = () => {
    try {
      // Keep track of processed elements to avoid duplicates
      const processedElements = new Set();
      const capturedPhrases = new Set();
      let lastCaptureTime = Date.now();
      let accumulatedText = "";

      // Function to process text that might be speech
      const processPotentialSpeech = (text, source) => {
        if (!text || typeof text !== "string") return;

        const cleanText = text.trim();

        // Filter out UI elements, short messages, and obvious non-content
        if (
          cleanText.length < 3 ||
          cleanText.includes("Interrupt") ||
          cleanText.includes("End session") ||
          cleanText.includes("View Transcript") ||
          cleanText.includes("{") ||
          cleanText.includes("isTrusted") ||
          cleanText.includes("function(") ||
          /^\d+$/.test(cleanText)
        ) {
          return;
        }

        // Check if we've already captured this or a similar phrase
        if (capturedPhrases.has(cleanText)) {
          return;
        }

        // If we have a very similar phrase already captured, skip it
        let isDuplicate = false;
        capturedPhrases.forEach((phrase) => {
          // If one contains the other completely, consider it a duplicate
          if (phrase.includes(cleanText) || cleanText.includes(phrase)) {
            isDuplicate = true;
          }

          // If they're very similar with only small differences
          const similarity = calculateSimilarity(phrase, cleanText);
          if (similarity > 0.8) {
            // 80% similarity threshold
            isDuplicate = true;
          }
        });

        if (isDuplicate) {
          return;
        }

        // Add to transcript if it passes all checks
        console.log(`${source} found speech: ${cleanText}`);
        addToTranscript("Avatar", cleanText);

        // Remember we captured this phrase
        capturedPhrases.add(cleanText);

        // Update last capture time
        lastCaptureTime = Date.now();
      };

      // Function to calculate text similarity (0-1 scale)
      const calculateSimilarity = (str1, str2) => {
        // Simple but effective similarity check for short phrases
        const words1 = str1.toLowerCase().split(/\s+/);
        const words2 = str2.toLowerCase().split(/\s+/);

        // Count common words
        let commonCount = 0;
        for (const word of words1) {
          if (words2.includes(word)) {
            commonCount++;
          }
        }

        // Calculate similarity ratio
        const maxWords = Math.max(words1.length, words2.length);
        return maxWords > 0 ? commonCount / maxWords : 0;
      };

      // More targeted mutation observer
      const observer = new MutationObserver((mutations) => {
        // Process each mutation to look for text changes
        mutations.forEach((mutation) => {
          // Check added nodes
          if (mutation.addedNodes && mutation.addedNodes.length) {
            mutation.addedNodes.forEach((node) => {
              // Process text nodes directly
              if (node.nodeType === Node.TEXT_NODE && node.textContent) {
                processPotentialSpeech(node.textContent, "DOM text node");
              }
              // Process element nodes with text content
              else if (node.nodeType === Node.ELEMENT_NODE) {
                // Check if this is likely a caption or speech element
                const nodeName = node.nodeName.toLowerCase();
                if (
                  nodeName === "span" ||
                  nodeName === "div" ||
                  nodeName === "p"
                ) {
                  processPotentialSpeech(node.textContent, "DOM element");
                }

                // Look for caption elements within this node
                if (node?.querySelectorAll) {
                  node
                    ?.querySelectorAll(
                      '.caption-text, .speech-bubble, [aria-label*="caption"], .captions, .subtitles, .transcript-text',
                    )
                    .forEach((element) => {
                      if (!processedElements.has(element)) {
                        processPotentialSpeech(
                          element.textContent,
                          "DOM caption element",
                        );
                        processedElements.add(element);
                      }
                    });
                }
              }
            });
          }

          // Check for text content changes in existing nodes
          if (
            mutation.type === "characterData" &&
            mutation.target.textContent
          ) {
            processPotentialSpeech(
              mutation.target.textContent,
              "DOM text change",
            );
          }

          // Check for attribute changes that might contain captions
          if (mutation.type === "attributes" && mutation.target.textContent) {
            const attr = mutation.attributeName;
            if (
              attr === "textContent" ||
              attr === "innerText" ||
              attr === "aria-label"
            ) {
              processPotentialSpeech(
                mutation.target.textContent,
                `DOM attribute ${attr}`,
              );
            }
          }
        });

        // Also do a general query for potential caption elements
        document
          .querySelectorAll(
            '.avatar-speech-bubble, .speech-bubble, .caption-text, [aria-label*="caption"], [aria-label*="speech"], video + div, .transcript-text, .captions, .subtitles, [data-type="captions"]',
          )
          .forEach((element) => {
            if (!processedElements.has(element)) {
              processPotentialSpeech(element.textContent, "DOM query");
              processedElements.add(element);
              element.setAttribute("data-processed", "true");
            }
          });

        // Check for text tracks in the video element
        const videoElement = document.getElementById("avatarVideo");
        if (
          videoElement &&
          videoElement.textTracks &&
          videoElement.textTracks.length > 0
        ) {
          for (let i = 0; i < videoElement.textTracks.length; i++) {
            const track = videoElement.textTracks[i];
            if (track.activeCues && track.activeCues.length > 0) {
              for (let j = 0; j < track.activeCues.length; j++) {
                const cue = track.activeCues[j];
                if (cue && cue.text && !processedElements.has(cue)) {
                  processPotentialSpeech(cue.text, "Video text track");
                  processedElements.add(cue);
                }
              }
            }
          }
        }
      });

      // Try to observe the video container first
      const videoContainer =
        document.getElementById("avatarVideo")?.parentElement;
      if (videoContainer) {
        observer.observe(videoContainer, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: ["textContent", "innerText", "aria-label"],
        });
        console.log(
          "Set up focused mutation observer for avatar speech on video container",
        );
      }

      // Also observe document body for broader coverage
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      console.log("Set up additional mutation observer on document body");

      // Enhanced periodic checks that also look for video overlay elements
      const periodicCaptionCheck = setInterval(() => {
        // First look for any standard caption elements
        document
          .querySelectorAll(
            '.caption-text, [aria-label*="caption"], .transcript-line, .captions-container, video + div, .subtitles, .speech-bubble, [data-type="captions"], .avatar-speech',
          )
          .forEach((element) => {
            if (!processedElements.has(element)) {
              processPotentialSpeech(element.textContent, "Periodic check");
              processedElements.add(element);
            }
          });

        // Look for elements positioned over the video (likely captions)
        const video = document.getElementById("avatarVideo");
        if (video) {
          const videoRect = video.getBoundingClientRect();
          const middleX = videoRect.left + videoRect.width / 2;
          const lowerY = videoRect.top + videoRect.height * 0.7; // Look in lower third

          // Find elements in the caption area
          document.elementsFromPoint(middleX, lowerY).forEach((element) => {
            if (
              element !== video &&
              !processedElements.has(element) &&
              element.textContent
            ) {
              processPotentialSpeech(
                element.textContent,
                "Video overlay element",
              );
              processedElements.add(element);
            }
          });
        }

        // Check for text tracks directly
        const videoElement = document.getElementById("avatarVideo");
        if (videoElement && videoElement.textTracks) {
          for (let i = 0; i < videoElement.textTracks.length; i++) {
            const track = videoElement.textTracks[i];
            // Make sure captions are showing
            if (track.mode !== "showing") {
              track.mode = "showing";
            }
          }
        }

        // If it's been a while since we captured speech but avatar is talking, try a default
        if (isAvatarTalking && Date.now() - lastCaptureTime > 5000) {
          const avatarMessages = transcript.filter(
            (entry) => entry.speaker === "Avatar",
          );
          if (avatarMessages.length === 0) {
            // No messages at all yet, provide a default
            const defaultMessage =
              "I'm here to help with this situation. How can I assist you today?";
            console.log(
              `Adding default message since no speech detected: ${defaultMessage}`,
            );
            addToTranscript("Avatar", defaultMessage);
            lastCaptureTime = Date.now();
          }
        }
      }, 500); // Check more frequently (twice per second)

      // Store both observer and interval for cleanup
      observerRef.current = {
        observer,
        periodicCheck: periodicCaptionCheck,
        cleanup: () => {
          observer.disconnect();
          clearInterval(periodicCaptionCheck);
        },
      };
    } catch (error) {
      console.log(`Error setting up avatar speech capture: ${error.message}`);
    }
  };

  // Setup for button functionality
  const setupButtonFunctionality = () => {
    try {
      // Force end session button to work by directly attaching event
      const endSessionBtns = document.querySelectorAll("button");
      endSessionBtns.forEach((btn) => {
        if (btn.textContent?.includes("End session & Save")) {
          btn.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent event bubbling
            console.log("End session button clicked manually");
            endSession();
          });
        }

        if (btn.textContent?.includes("Interrupt task")) {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            console.log("Interrupt button clicked manually");
            handleInterrupt();
          });
        }
      });

      console.log("Button functionality setup complete");
    } catch (error) {
      console.log(`Error setting up button functionality: ${error.message}`);
    }
  };

  // Audio analysis for activity detection
  const setupAudioAnalysis = () => {
    try {
      if (audioAnalyzerRef.current?.cleanup) {
        audioAnalyzerRef.current.cleanup();
        audioAnalyzerRef.current = null;
      }
      if (!mediaStream.current || !stream) {
        console.log("Media stream not available for audio analysis");
        return;
      }

      // Create AudioContext and analyzer
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();

      // Connect video audio to analyzer
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      // Configure analyzer
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Variables to track speech state
      let isSpeaking = false;
      let silenceTimer = null;

      // Function to detect speech based on audio levels
      const detectSpeech = () => {
        analyser.getByteFrequencyData(dataArray);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Threshold for speech detection
        const threshold = 30; // Adjust based on testing

        if (average > threshold) {
          // Speech detected
          if (!isSpeaking) {
            isSpeaking = true;
            console.log("Audio analysis: Speech activity detected");
          }

          // Clear silence timer if exists
          if (silenceTimer) {
            clearTimeout(silenceTimer);
            silenceTimer = null;
          }
        } else if (isSpeaking) {
          // Potential end of speech, start silence timer
          if (!silenceTimer) {
            silenceTimer = setTimeout(() => {
              // End of speech detected
              isSpeaking = false;
              console.log("Audio analysis: Speech activity ended");
              silenceTimer = null;
            }, 500); // 500ms of silence to consider speech ended
          }
        }

        // Continue analyzing
        requestAnimationFrame(detectSpeech);
      };

      // Start speech detection
      detectSpeech();
      console.log("Audio analysis for speech activity detection started");
      console.log("Audio context state", audioCtx.state);
      // Store for cleanup
      audioAnalyzerRef.current = {
        audioCtx,
        analyser,
        source,
        cleanup: () => {
          try {
            source.disconnect();
            if (audioCtx && audioCtx.state !== "closed") {
              audioCtx.close();
            }
          } catch (e) {
            console.error("Error cleaning up audio analyzer:", e);
          }
        },
      };
    } catch (error) {
      console.log(
        `Error setting up audio analysis: ${(error as Error).message}`,
      );
    }
  };

  async function fetchAccessToken() {
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

      return token.trim();
    } catch (error) {
      console.error("Error fetching access token:", error);
      setUploadStatus(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  async function startSession() {
    try {
      // Prevent multiple simultaneous calls
      if (initializationRef.current && sessionInitialized) {
        console.log("Session already initialized, skipping...");
        return;
      }
      console.log("Starting session initialization...");
      
      // Reset stream readiness ref at the start of each session
      streamReadyRef.current = false;
      
      setIsLoadingSession(true);
      setUploadStatus("Clearing any existing sessions...");

      // End any existing sessions to avoid concurrent session limit issues
      try {
        console.log("Ending any existing HeyGen sessions...");
        const endResponse = await fetch("/api/avatar/end-sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (endResponse.ok) {
          const result = await endResponse.json();
          console.log("Existing sessions ended:", result);
        } else {
          console.log("No existing sessions to end or endpoint returned error");
        }
        // Wait a brief moment for sessions to fully close
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (endError) {
        console.log("Error ending existing sessions (non-fatal):", endError);
        // Continue anyway - this is not a critical error
      }

      setUploadStatus("Initializing session...");

      // Build expected knowledgeBase first for pre-warmed session validation
      const expectedPersona = searchParams.get("persona");
      const expectedTone = searchParams.get("tone");
      let expectedKnowledgeBase = "";
      if (scenario?.context || scenario?.instructions || scenario?.description) {
        expectedKnowledgeBase = `
Context: ${scenario?.context || "Not specified"}
Description: ${scenario?.description || "Not specified"}
Instructions: ${scenario?.instructions || "Not specified"}
${scenario?.avatarRole ? `Role: ${scenario.avatarRole}` : ""}.
${expectedPersona ? `Persona: ${expectedPersona}` : "Helpful virtual assistant"}
${expectedTone ? `Tone: ${expectedTone}` : "Neutral"}

Please be conversational, helpful, and stay in character based on the provided context.
        `.trim();
      }

      // Check for pre-warmed session first (optional optimization)
      const preWarmedSession = avatarSession?.consumePreWarmedSession(expectedKnowledgeBase);
      let usingPreWarmedSession = false;
      
      // Clean up existing avatar instance before re-instantiation to prevent duplicate handlers
      if (avatar.current) {
        try {
          console.log("Cleaning up existing avatar instance before new session");
          // Stop the previous avatar session completely - this handles internal cleanup
          await avatar.current.stopAvatar();
          console.log("Previous avatar instance stopped successfully");
        } catch (e) {
          console.log("Error stopping previous avatar (may already be stopped):", e);
        }
        // Nullify the reference so a fresh instance is created
        avatar.current = null;
      }
      
      if (preWarmedSession && preWarmedSession.isReady && preWarmedSession.avatarId === avatarId) {
        console.log("Using pre-warmed session! Skipping token fetch and session creation.");
        setUploadStatus("Using pre-warmed session...");
        usingPreWarmedSession = true;
        
        // Use the pre-warmed avatar instance
        avatar.current = preWarmedSession.avatar;
        
        // Set the stream if available
        if (preWarmedSession.stream) {
          streamReadyRef.current = true;
          setStream(preWarmedSession.stream);
        }
        
        // Set session data
        if (preWarmedSession.sessionData) {
          sessionIdRef.current = preWarmedSession.sessionData.session_id;
          setData(preWarmedSession.sessionData);
          setSessionStatus("started");
          
          // Start tracked session with backend for 6-minute enforcement
          if (preWarmedSession.sessionData.session_id) {
            startTrackedSession(preWarmedSession.sessionData.session_id);
          }
        }
        
        // Add event listeners for the pre-warmed avatar
        avatar.current.on(StreamingEvents.STREAM_READY, (event) => {
          console.log("Stream is ready (pre-warmed)");
          if (streamTimeoutRef.current) {
            clearTimeout(streamTimeoutRef.current);
            streamTimeoutRef.current = null;
          }
          streamReadyRef.current = true;
          setStreamConnectionError(null);
          setStream(event.detail);
        });

        avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, (event) => {
          console.log("Stream disconnected (pre-warmed)");
          if (streamTimeoutRef.current) {
            clearTimeout(streamTimeoutRef.current);
            streamTimeoutRef.current = null;
          }
          setStreamConnectionError("Stream connection lost");
          setUploadStatus("Stream disconnected");
        });
        
        // Set stream timeout for pre-warmed session - 15 seconds
        streamTimeoutRef.current = setTimeout(() => {
          if (!streamReadyRef.current) {
            console.error("Stream timeout: Pre-warmed stream failed to connect within 15 seconds");
            setStreamConnectionError("Stream connection timed out. Please try again.");
            setUploadStatus("Stream connection failed. Click to retry.");
            setIsLoadingSession(false);
          }
        }, 15000);
        
        // Continue to set up the rest of the session (event handlers, voice chat, etc.)
        // The code below will handle this
      } else {
        // Fall back to normal session initialization
        if (preWarmedSession) {
          console.log("Pre-warmed session not usable (avatar mismatch or not ready), falling back to normal initialization");
        }

        const token = await fetchAccessToken();
        if (!token) {
          console.error("No token received from fetchAccessToken");
          setUploadStatus("Error: Failed to get access token");
          throw new Error("Failed to get access token");
        }
        console.log("Access token received successfully");

        console.log(`Starting session with token length: ${token.length}`);

        // Initialize avatar with the access token (SDK 2.0+ format)
        // Note: We DON'T use videoContainerId because the video element doesn't exist 
        // until stream is set. Instead, we manually attach the stream via srcObject 
        // in the useEffect when STREAM_READY fires.
        avatar.current = new StreamingAvatar({
          token: token,
          config: {
            enableLog: true,
          },
        });

        // Create a promise that resolves when stream is ready
        // This allows us to await the stream before starting voice chat
        let resolveStreamReady: () => void;
        let rejectStreamReady: (error: Error) => void;
        const streamReadyPromise = new Promise<void>((resolve, reject) => {
          resolveStreamReady = resolve;
          rejectStreamReady = reject;
        });

        // Add core event listeners before creating session
        // Per HeyGen SDK docs: Use avatar.mediaStream property after STREAM_READY fires
        avatar.current.on(StreamingEvents.STREAM_READY, (event) => {
          console.log("Stream is ready - STREAM_READY event received");
          console.log("STREAM_READY event:", event);
          
          // Per SDK documentation: Access stream via avatar.mediaStream property
          // This is the CORRECT method per HeyGen's official examples
          const sdkStream = (avatar.current as any)?.mediaStream;
          console.log("avatar.mediaStream exists:", !!sdkStream);
          
          let streamToUse: MediaStream | null = null;
          
          // Priority 1: SDK's mediaStream property (recommended by HeyGen docs)
          if (sdkStream && sdkStream instanceof MediaStream) {
            console.log("✅ Using avatar.mediaStream (SDK recommended approach)");
            streamToUse = sdkStream;
          }
          // Fallback: event.detail
          else if (event?.detail && event.detail instanceof MediaStream) {
            console.log("Using event.detail as fallback");
            streamToUse = event.detail;
          }
          // Fallback: event itself
          else if (event instanceof MediaStream) {
            console.log("Event itself is the MediaStream");
            streamToUse = event;
          }
          
          if (streamTimeoutRef.current) {
            clearTimeout(streamTimeoutRef.current);
            streamTimeoutRef.current = null;
          }
          
          if (streamToUse) {
            const videoTracks = streamToUse.getVideoTracks();
            const audioTracks = streamToUse.getAudioTracks();
            console.log("Stream video tracks:", videoTracks.length, videoTracks.map(t => ({ id: t.id, enabled: t.enabled, muted: t.muted })));
            console.log("Stream audio tracks:", audioTracks.length, audioTracks.map(t => ({ id: t.id, enabled: t.enabled, muted: t.muted })));
            
            streamReadyRef.current = true;
            setStreamConnectionError(null);
            setStream(streamToUse);
            resolveStreamReady();
          } else {
            console.error("STREAM_READY fired but no stream found!");
            console.log("Attempting delayed fetch of avatar.mediaStream...");
            
            // Try polling for the stream with small delay
            let pollAttempts = 0;
            const pollForStream = setInterval(() => {
              pollAttempts++;
              const delayedStream = (avatar.current as any)?.mediaStream;
              if (delayedStream && delayedStream instanceof MediaStream) {
                clearInterval(pollForStream);
                console.log(`✅ Found avatar.mediaStream after ${pollAttempts} poll attempts`);
                streamReadyRef.current = true;
                setStreamConnectionError(null);
                setStream(delayedStream);
              } else if (pollAttempts >= 20) {
                clearInterval(pollForStream);
                console.error("Failed to get stream after 20 poll attempts");
              }
            }, 500);
            
            resolveStreamReady();
          }
        });

        avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, (event) => {
          console.log("Stream disconnected");
          if (streamTimeoutRef.current) {
            clearTimeout(streamTimeoutRef.current);
            streamTimeoutRef.current = null;
          }
          setStreamConnectionError("Stream connection lost");
          setUploadStatus("Stream disconnected");
          rejectStreamReady(new Error("Stream connection lost"));
        });
        
        // Set stream timeout - 30 seconds for new session initialization
        // NOTE: We don't reject on timeout to avoid triggering error overlays
        // Instead we just log and show a user-friendly error
        streamTimeoutRef.current = setTimeout(() => {
          if (!streamReadyRef.current) {
            console.error("Stream timeout: Failed to connect within 30 seconds");
            console.log("DEBUG: Checking avatar.mediaStream:", (avatar.current as any)?.mediaStream);
            console.log("DEBUG: avatar.current exists:", !!avatar.current);
            
            // Last ditch effort - check if stream is available but event didn't fire
            const lastChanceStream = (avatar.current as any)?.mediaStream;
            if (lastChanceStream) {
              console.log("Stream found on timeout! Using it directly.");
              streamReadyRef.current = true;
              setStreamConnectionError(null);
              setStream(lastChanceStream);
              return; // Don't show error
            }
            
            setStreamConnectionError("Stream connection timed out. Please try again.");
            setUploadStatus("Stream connection failed. Click to retry.");
            setIsLoadingSession(false);
            // Resolve instead of reject to avoid uncaught error overlay
            resolveStreamReady();
          }
        }, 30000);
        
        // Store the promise for use after createStartAvatar
        (avatar.current as any)._streamReadyPromise = streamReadyPromise;
      }

      // Reset state
      setTranscript([]);
      localStorage.setItem("transcript", "[]");
      transcriptRef.current = []; // Reset the ref

      // Record session start time
      sessionStartTimeRef.current = Date.now();
      console.log(`Session started at: ${new Date().toISOString()}`);

      // Kill any previous observers
      if (observerRef.current) {
        observerRef.current.cleanup();
        observerRef.current = null;
      }

      // Clean up any previous audio analyzer
      if (audioAnalyzerRef.current) {
        audioAnalyzerRef.current.cleanup();
        audioAnalyzerRef.current = null;
      }

      // Clean existing transcript
      cleanExistingTranscript();

      // ===== Setup Event Handlers Based on HeyGen SDK Documentation =====

      // 1. Log all events to debug what's happening
      avatar.current.on("*", (event) => {
        const eventType = event.type || "unknown";
        console.log(`DEBUG RAW EVENT (${eventType}):`, event);
        console.log(`Received event: ${eventType}`);
      });

      // Helper function for extracting text from events - much more robust
      const extractTextFromEvent = (event) => {
        let text = "";

        // Direct event is a string
        if (typeof event === "string") {
          text = event;
        }
        // Event is an object
        else if (event && typeof event === "object") {
          // Check every possible location for text content
          if (typeof event.text === "string") {
            text = event.text;
          } else if (event.detail && typeof event.detail.text === "string") {
            text = event.detail.text;
          } else if (event.message) {
            text =
              typeof event.message === "string"
                ? event.message
                : JSON.stringify(event.message);
          } else if (event.data) {
            text =
              typeof event.data === "string"
                ? event.data
                : JSON.stringify(event.data);
          } else if (event.content) {
            text =
              typeof event.content === "string"
                ? event.content
                : JSON.stringify(event.content);
          } else if (event.transcript) {
            text = event.transcript;
          }
          // If we have a more complex object structure
          else if (event.detail) {
            if (typeof event.detail === "string") {
              text = event.detail;
            } else if (event.detail.message) {
              text = event.detail.message;
            } else if (event.detail.content) {
              text = event.detail.content;
            } else if (event.detail.transcript) {
              text = event.detail.transcript;
            }
          }
          // Try to extract the most likely text field from a complex object
          else {
            // Skip isTrusted events with no text content
            if (
              Object.keys(event).length === 1 &&
              event.isTrusted !== undefined
            ) {
              return "";
            }

            // Last resort: try to stringify and re-parse
            try {
              const eventStr = JSON.stringify(event);
              // Only use the stringified event if it seems to contain meaningful data
              if (
                eventStr &&
                eventStr.length > 10 &&
                eventStr !== "{}" &&
                !eventStr.includes("isTrusted")
              ) {
                try {
                  // Try to parse text field from stringified JSON
                  const parsed = JSON.parse(eventStr);
                  if (parsed.text) text = parsed.text;
                  else if (parsed.message) text = parsed.message;
                  else if (parsed.data) text = parsed.data;
                  else if (parsed.transcript) text = parsed.transcript;
                  // Don't use raw JSON if it doesn't have useful content
                  else if (!eventStr.includes("isTrusted")) text = eventStr;
                } catch (e) {
                  // If parsing fails, use the string itself if it doesn't look like a raw event object
                  if (!eventStr.includes("isTrusted")) {
                    text = eventStr;
                  }
                }
              }
            } catch (e) {
              // Stringification failed, nothing we can do
            }
          }
        }

        // Filter out UI elements and empty text
        if (
          text &&
          typeof text === "string" &&
          text.trim().length > 2 &&
          !text.includes("Interrupt task") &&
          !text.includes("End session & Save") &&
          !text.includes("View Transcript") &&
          !text.includes("isTrusted")
        ) {
          return text.trim();
        }

        return "";
      };

      // Variables to track speech state
      let lastAvatarSpeechTime = 0;
      let lastUserSpeechTime = 0;
      let pendingAvatarContent = "";
      let pendingUserContent = "";
      let isCapturingAvatarSpeech = false;
      let isCapturingUserSpeech = false;
      let avatarSpeechBuffer = [];
      let userSpeechBuffer = [];
      let avatarSpeechTimer = null;
      let userSpeechTimer = null;

      // ===== AVATAR SPEECH EVENTS =====

      // 1. Avatar Start Talking - Track when avatar begins speaking
      avatar.current.on(StreamingEvents.AVATAR_START_TALKING, (event) => {
        console.log("Avatar started talking (event triggered)");
        console.log("Avatar has started talking:", event);

        // Clear the sentence buffer to start collecting a new sentence
        setCurrentAvatarSentence("");

        setIsAvatarTalking(true);
        isCapturingAvatarSpeech = true;
        lastAvatarSpeechTime = Date.now();

        // Extract any initial text if available
        const initialText = extractTextFromEvent(event);
        if (initialText) {
          console.log(`Initial avatar speech detected: ${initialText}`);
          // Add to the sentence buffer instead of directly to transcript
          setCurrentAvatarSentence((prev) => {
            const newSentence = prev ? `${prev} ${initialText}` : initialText;
            pendingAvatarContent = newSentence;
            return newSentence;
          });
        }

        // Set a fallback timer to look for speech in DOM if events don't fire properly
        setTimeout(() => {
          if (
            isCapturingAvatarSpeech &&
            Date.now() - lastAvatarSpeechTime > 900
          ) {
            // Try to find captions or speech bubbles in the DOM
            document
              .querySelectorAll(
                '.caption-text, [aria-label*="caption"], .transcript-line, .speech-bubble, .avatar-speech, .captions, [data-type="captions"]',
              )
              .forEach((element) => {
                const text = element.textContent;
                if (
                  text &&
                  text.trim() &&
                  text.trim().length > 3 &&
                  !text.includes("Interrupt") &&
                  !text.includes("End session") &&
                  !text.includes("View Transcript")
                ) {
                  console.log(
                    `Fallback: Found caption text in DOM: ${text.trim()}`,
                  );
                  // Add to sentence buffer instead of transcript
                  setCurrentAvatarSentence((prev) => {
                    const newSentence = prev
                      ? `${prev} ${text.trim()}`
                      : text.trim();
                    pendingAvatarContent = newSentence;
                    lastAvatarSpeechTime = Date.now();
                    return newSentence;
                  });
                }
              });
          }
        }, 1000);
      });

      // 2. Avatar Stop Talking - Track when avatar stops speaking
      avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, (event) => {
        console.log("Avatar stopped talking (event triggered)");
        console.log("Avatar has stopped talking:", event);

        setIsAvatarTalking(false);
        isCapturingAvatarSpeech = false;

        // Extract any final text if available and add to current sentence
        const finalText = extractTextFromEvent(event);
        if (finalText) {
          console.log(`Final avatar speech detected: ${finalText}`);
          setCurrentAvatarSentence((prev) => {
            const newSentence = prev ? `${prev} ${finalText}` : finalText;
            pendingAvatarContent = newSentence;
            return newSentence;
          });
        }

        // Now add the complete sentence to the transcript
        if (currentAvatarSentence || pendingAvatarContent) {
          const sentenceToAdd = currentAvatarSentence || pendingAvatarContent;

          // Make sure we're not duplicating content
          const recentTranscripts = transcript.slice(-3);
          const isDuplicate = recentTranscripts.some(
            (line) => line.speaker === "Avatar" && line.text === sentenceToAdd,
          );

          if (!isDuplicate && sentenceToAdd) {
            console.log(
              `Adding complete avatar sentence to transcript: ${sentenceToAdd}`,
            );
            addToTranscript("Avatar", sentenceToAdd);

            // Clear the buffers after adding to transcript
            setCurrentAvatarSentence("");
          }
        }
      });

      // 3. Avatar Talking Message - Real-time updates while avatar speaks
      avatar.current.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (message) => {
        try {
          console.log("Avatar talking message:", message);

          // Update tracking variables
          lastAvatarSpeechTime = Date.now();
          isCapturingAvatarSpeech = true;

          // Extract message text with enhanced extraction
          const messageText = extractTextFromEvent(message);

          if (messageText) {
            console.log(`Avatar talking message: ${messageText}`);

            // Add to the sentence buffer instead of directly to transcript
            setCurrentAvatarSentence((prev) => {
              // Add a space between words for readability
              const newSentence = prev ? `${prev} ${messageText}` : messageText;
              pendingAvatarContent = newSentence;
              return newSentence;
            });
          }
        } catch (error) {
          console.log(
            `Error handling avatar talking message: ${error.message}`,
          );
        }
      });

      // 4. Avatar End Message - Final message at end of speech
      avatar.current.on(StreamingEvents.AVATAR_END_MESSAGE, (message) => {
        try {
          console.log("Avatar end message:", message);

          // Update tracking state
          isCapturingAvatarSpeech = false;

          // Extract message with enhanced extraction
          const messageText = extractTextFromEvent(message);

          if (messageText) {
            console.log(`Avatar end message: ${messageText}`);

            // Add final part to the sentence
            setCurrentAvatarSentence((prev) => {
              const newSentence = prev ? `${prev} ${messageText}` : messageText;
              return newSentence;
            });
          }

          // Now add the complete sentence to the transcript
          if (currentAvatarSentence || pendingAvatarContent) {
            const sentenceToAdd = currentAvatarSentence || pendingAvatarContent;

            // Check for duplicates
            const recentTranscripts = transcript.slice(-3);
            const isDuplicate = recentTranscripts.some(
              (line) =>
                line.speaker === "Avatar" && line.text === sentenceToAdd,
            );

            if (!isDuplicate && sentenceToAdd) {
              console.log(
                `Adding complete avatar sentence from end message: ${sentenceToAdd}`,
              );
              addToTranscript("Avatar", sentenceToAdd);

              // Clear buffers
              setCurrentAvatarSentence("");
              pendingAvatarContent = "";
            }
          }
        } catch (error) {
          console.log(`Error handling avatar end message: ${error.message}`);
        }
      });

      // ===== USER SPEECH EVENTS =====

      // 1. User Start - Track when user begins interacting
      avatar.current.on(StreamingEvents.USER_START, (event) => {
        console.log("User started talking (event triggered)");
        console.log("User has started interaction:", event);

        // Clear the sentence buffer to start collecting a new sentence
        setCurrentUserSentence("");

        setIsUserTalking(true);
        isCapturingUserSpeech = true;
        lastUserSpeechTime = Date.now();

        // Extract any initial text if available
        const initialText = extractTextFromEvent(event);
        if (initialText) {
          console.log(`Initial user speech detected: ${initialText}`);
          // Add to sentence buffer instead of transcript
          setCurrentUserSentence((prev) => {
            const newSentence = prev ? `${prev} ${initialText}` : initialText;
            pendingUserContent = newSentence;
            return newSentence;
          });
        }
      });

      // 2. User Stop - Track when user stops interacting
      avatar.current.on(StreamingEvents.USER_STOP, (event) => {
        console.log("User stopped talking (event triggered)");
        console.log("User has stopped interaction:", event);

        setIsUserTalking(false);
        isCapturingUserSpeech = false;

        // Extract any final text if available
        const finalText = extractTextFromEvent(event);
        if (finalText) {
          console.log(`Final user speech detected: ${finalText}`);
          setCurrentUserSentence((prev) => {
            const newSentence = prev ? `${prev} ${finalText}` : finalText;
            pendingUserContent = newSentence;
            return newSentence;
          });
        }

        // Now add the complete sentence to the transcript
        if (currentUserSentence || pendingUserContent) {
          const sentenceToAdd = currentUserSentence || pendingUserContent;

          // Check for duplicates
          const recentTranscripts = transcript.slice(-3);
          const isDuplicate = recentTranscripts.some(
            (line) => line.speaker === "User" && line.text === sentenceToAdd,
          );

          if (!isDuplicate && sentenceToAdd) {
            console.log(
              `Adding complete user sentence to transcript: ${sentenceToAdd}`,
            );
            addToTranscript("User", sentenceToAdd);

            // Clear buffers
            setCurrentUserSentence("");
          }
        }

        // Reset pending content
        pendingUserContent = "";
      });

      // 3. User Talking Message - Real-time updates while user speaks
      avatar.current.on(StreamingEvents.USER_TALKING_MESSAGE, (message) => {
        try {
          console.log("User talking message:", message);

          // Update tracking variables
          lastUserSpeechTime = Date.now();
          isCapturingUserSpeech = true;

          // Extract message with enhanced extraction
          const messageText = extractTextFromEvent(message);

          if (messageText) {
            console.log(`User talking message: ${messageText}`);

            // Add to sentence buffer instead of transcript
            setCurrentUserSentence((prev) => {
              // Add space between words for readability
              const newSentence = prev ? `${prev} ${messageText}` : messageText;
              pendingUserContent = newSentence;
              return newSentence;
            });
          }
        } catch (error) {
          console.log(`Error handling user talking message: ${error.message}`);
        }
      });

      // 4. User End Message - Final message at end of speech
      avatar.current.on(StreamingEvents.USER_END_MESSAGE, (message) => {
        try {
          console.log("User end message:", message);

          // Update tracking state
          isCapturingUserSpeech = false;

          // Extract message with enhanced extraction
          const messageText = extractTextFromEvent(message);

          if (messageText) {
            console.log(`User end message: ${messageText}`);

            // Add final part to sentence
            setCurrentUserSentence((prev) => {
              const newSentence = prev ? `${prev} ${messageText}` : messageText;
              return newSentence;
            });
          }

          // Now add the complete sentence to the transcript
          if (currentUserSentence || pendingUserContent) {
            const sentenceToAdd = currentUserSentence || pendingUserContent;

            // Check for duplicates
            const recentTranscripts = transcript.slice(-3);
            const isDuplicate = recentTranscripts.some(
              (line) => line.speaker === "User" && line.text === sentenceToAdd,
            );

            if (!isDuplicate && sentenceToAdd) {
              console.log(
                `Adding complete user sentence from end message: ${sentenceToAdd}`,
              );
              addToTranscript("User", sentenceToAdd);

              // Clear buffers
              setCurrentUserSentence("");
              pendingUserContent = "";
            }
          }
        } catch (error) {
          console.log(`Error handling user end message: ${error.message}`);
        }
      });

      // Handle user silence (could indicate end of speech)
      avatar.current.on(StreamingEvents.USER_SILENCE, (event) => {
        console.log("User silence detected (event triggered)");

        // If we were capturing user speech and have accumulated content, consider adding it
        if (
          isCapturingUserSpeech &&
          (currentUserSentence || pendingUserContent) &&
          Date.now() - lastUserSpeechTime > 1000
        ) {
          const sentenceToAdd = currentUserSentence || pendingUserContent;

          // Check for duplicates
          const recentTranscripts = transcript.slice(-3);
          const isDuplicate = recentTranscripts.some(
            (line) => line.speaker === "User" && line.text === sentenceToAdd,
          );

          if (!isDuplicate && sentenceToAdd) {
            console.log(
              `Adding accumulated user sentence on silence: ${sentenceToAdd}`,
            );
            addToTranscript("User", sentenceToAdd);

            // Clear buffers since we've added the content
            setCurrentUserSentence("");
            pendingUserContent = "";
          }
        }
      });

      // Stream connection events
      avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log("Stream disconnected");
        endSession();
      });

      avatar.current.on(StreamingEvents.STREAM_READY, (event) => {
        console.log("Stream is ready (duplicate handler)");
        streamReadyRef.current = true;
        setStream(event.detail);
        // Set up button functionality after stream is ready
        setTimeout(setupButtonFunctionality, 1000);
      });

      // IMPORTANT: Log the full context and instructions for debugging
      if (scenario?.context) {
        console.log(`Using context: ${scenario?.context}`);
      }
      if (scenario?.instructions) {
        console.log(`Using instructions: ${scenario?.instructions}`);
      }
      if (scenario?.description) {
        console.log(`Using description: ${scenario?.description}`);
      }

      const persona = searchParams.get("persona");
      const tone = searchParams.get("tone");
      const blueprintParam = searchParams.get("blueprint");
      
      // Construct knowledge base from blueprint or context/instructions
      let knowledgeBase = "";
      
      // Build opening directive if we have scenario data - this should be included regardless of path
      let openingDirectiveText = "";
      const userName = user?.displayName || user?.username;
      // Use the selected avatar's name (from avatar selection) rather than scenario's hardcoded avatarName
      const avatarDisplayName = selectedAvatar?.name || scenario?.avatarName;
      if (scenario?.avatarRole || scenario?.name || scenario?.openingScene) {
        openingDirectiveText = buildOpeningDirective({
          scenarioName: scenario?.name || "Practice scenario",
          avatarRole: scenario?.avatarRole || "Professional",
          avatarName: avatarDisplayName,
          userName: userName,
          counterPersona: scenario?.counterPersona,
          personaOverlay: personaOverlay,
          openingScene: scenario?.openingScene,
          instructions: scenario?.instructions,
          tags: scenario?.tags,
        });
        console.log("Built opening directive for avatar greeting:", openingDirectiveText ? "yes" : "no", "with userName:", userName, "avatarName:", avatarDisplayName);
      }
      
      // Check for blueprint first - it contains framework-based prompts
      if (blueprintParam) {
        try {
          const blueprint: ConversationBlueprint = JSON.parse(decodeURIComponent(blueprintParam));
          knowledgeBase = generateAvatarPromptFromBlueprint(blueprint);
          
          // IMPORTANT: Append opening directive to blueprint-based knowledge base
          if (openingDirectiveText) {
            knowledgeBase = `${knowledgeBase}\n\n${openingDirectiveText}`;
            console.log("Using blueprint-based knowledge base WITH opening directive for avatar behavior");
          } else {
            console.log("Using blueprint-based knowledge base for avatar behavior");
          }
        } catch (e) {
          console.error("Failed to parse blueprint:", e);
        }
      }
      
      // Fallback to legacy context/instructions if no blueprint - now using RICH prompt builder
      if (!knowledgeBase && (scenario?.context || scenario?.instructions || scenario?.description || scenario?.name)) {
        const culturalPresetParam = searchParams.get("culturalPreset");
        
        knowledgeBase = buildFullScenarioPrompt({
          scenarioName: scenario?.name || "Practice scenario",
          scenarioDescription: scenario?.description,
          scenarioContext: scenario?.context,
          scenarioInstructions: scenario?.instructions,
          avatarRole: scenario?.avatarRole || "Professional",
          avatarName: avatarDisplayName || "the professional",
          userName: userName || "the learner",
          tone: tone || "realistic",
          language: language,
          counterPersona: scenario?.counterPersona || null,
          personaOverlay: personaOverlay || null,
          openingScene: scenario?.openingScene,
          tags: scenario?.tags,
          culturalPresetName: culturalPresetParam || undefined,
        });

        console.log(
          "Using RICH knowledge base with full scenario prompt",
          `(userName: ${userName}, avatarName: ${avatarDisplayName}, hasCounterPersona: ${!!scenario?.counterPersona}, hasPersonaOverlay: ${!!personaOverlay})`
        );
      } else if (!knowledgeBase) {
        console.log("No context, description or instructions provided");
      }

      // Start avatar session with default fallbacks (skip if using pre-warmed session)
      if (!usingPreWarmedSession) {
        const defaultAvatarId = "Monica_greeting_public";

        console.log("Creating avatar session with params:", {
          quality: AvatarQuality.Low,
          avatarName: avatarId || defaultAvatarId,
          hasKnowledgeBase: !!knowledgeBase,
          language: language,
        });

        try {
          // Session timeout configuration per HeyGen best practices
          // NOTE: Using minimal config to diagnose 400 errors
          console.log("DEBUG: About to call createStartAvatar with avatarId:", avatarId || defaultAvatarId);
          
          // Build request object - only include optional params if they have valid values
          const avatarRequest: any = {
            quality: AvatarQuality.Low,
            avatarName: avatarId || defaultAvatarId,
          };
          
          // Only add knowledgeBase if it has content
          if (knowledgeBase && knowledgeBase.trim().length > 0) {
            avatarRequest.knowledgeBase = knowledgeBase;
            console.log("DEBUG: Adding knowledgeBase, length:", knowledgeBase.length);
          }
          
          // Add language if specified
          if (language) {
            avatarRequest.language = language;
          }
          
          console.log("DEBUG: Final request params:", JSON.stringify(avatarRequest, null, 2));
          
          // Create avatar session via SDK (removed duplicate server-side test)
          const res = await avatar.current.createStartAvatar(avatarRequest);

          console.log("DEBUG: createStartAvatar completed successfully!");
          console.log("createStartAvatar response:", res);
          console.log("DEBUG: Immediately checking mediaStream:", (avatar.current as any)?.mediaStream);
          
          // Check if stream is immediately available after createStartAvatar
          const immediateStream = (avatar.current as any)?.mediaStream;
          if (immediateStream) {
            console.log("DEBUG: Stream available immediately after createStartAvatar!");
            streamReadyRef.current = true;
            setStream(immediateStream);
            if (streamTimeoutRef.current) {
              clearTimeout(streamTimeoutRef.current);
              streamTimeoutRef.current = null;
            }
          }

          sessionIdRef.current = res?.session_id;
          // Log session details for debugging
          console.log("Session started with:", {
            avatarId: avatarId || defaultAvatarId,
            hasKnowledgeBase: !!knowledgeBase,
            sessionId: sessionIdRef.current,
          });
          setData(res);
          setSessionStatus("started");
          
          // Start tracked session with backend for 6-minute enforcement
          if (res?.session_id) {
            startTrackedSession(res.session_id);
          }
          
          // WORKAROUND for known HeyGen SDK issue: STREAM_READY event sometimes doesn't fire
          // https://docs.heygen.com/discuss/67a5b2fc42d00a005a75d7e4
          // Try to wait for STREAM_READY, but fall back to direct mediaStream access
          console.log("Waiting for STREAM_READY event (with fallback)...");
          
          try {
            // Race between STREAM_READY event and a fallback timeout
            await Promise.race([
              (avatar.current as any)._streamReadyPromise,
              new Promise<void>((resolve, reject) => {
                // Give STREAM_READY 5 seconds to fire, then check mediaStream directly
                setTimeout(async () => {
                  console.log("STREAM_READY timeout - checking mediaStream directly...");
                  const mediaStream = (avatar.current as any)?.mediaStream;
                  if (mediaStream) {
                    console.log("Fallback: Found mediaStream directly on SDK instance");
                    streamReadyRef.current = true;
                    setStreamConnectionError(null);
                    setStream(mediaStream);
                    if (streamTimeoutRef.current) {
                      clearTimeout(streamTimeoutRef.current);
                      streamTimeoutRef.current = null;
                    }
                    resolve();
                  } else {
                    // Wait longer and poll for mediaStream
                    let pollCount = 0;
                    const pollInterval = setInterval(() => {
                      pollCount++;
                      const stream = (avatar.current as any)?.mediaStream;
                      if (stream) {
                        clearInterval(pollInterval);
                        console.log(`Fallback: Found mediaStream after ${pollCount} polls`);
                        streamReadyRef.current = true;
                        setStreamConnectionError(null);
                        setStream(stream);
                        if (streamTimeoutRef.current) {
                          clearTimeout(streamTimeoutRef.current);
                          streamTimeoutRef.current = null;
                        }
                        resolve();
                      } else if (pollCount >= 25) { // 25 * 1000ms = 25 seconds total
                        clearInterval(pollInterval);
                        reject(new Error("Stream not available after polling"));
                      }
                    }, 1000);
                  }
                }, 5000);
              })
            ]);
          } catch (streamError: any) {
            console.error("Stream connection failed:", streamError.message);
            // Continue anyway - the 30 second timeout will handle the final error
          }
          
          console.log("Stream check complete, streamReadyRef:", streamReadyRef.current);
          
        } catch (createError: any) {
          console.error("Error in createStartAvatar:", createError);
          
          // Extract detailed error info from HeyGen SDK
          let errorMessage = createError.message || "Failed to start avatar session";
          let errorDetails = "";
          
          // Check for response body with error details
          if (createError.response) {
            try {
              const responseData = typeof createError.response === 'string' 
                ? JSON.parse(createError.response) 
                : createError.response;
              if (responseData.message) errorMessage = responseData.message;
              if (responseData.error) errorDetails = responseData.error;
            } catch (e) {
              console.log("Could not parse error response");
            }
          }
          
          // Check for responseText
          if (createError.responseText) {
            try {
              const parsed = JSON.parse(createError.responseText);
              if (parsed.message) errorMessage = parsed.message;
            } catch (e) {}
          }
          
          // Log all available error info
          console.log("createStartAvatar error details:", {
            message: errorMessage,
            details: errorDetails,
            status: createError.status,
            response: createError.response,
            responseText: createError.responseText,
            fullError: JSON.stringify(createError, Object.getOwnPropertyNames(createError)),
          });
          
          // Clear the stream timeout so it doesn't show a generic message
          if (streamTimeoutRef.current) {
            clearTimeout(streamTimeoutRef.current);
            streamTimeoutRef.current = null;
          }
          
          // Show the actual error to the user
          const displayError = errorDetails 
            ? `${errorMessage}: ${errorDetails}` 
            : errorMessage;
          setStreamConnectionError(displayError);
          setUploadStatus(`Error: ${displayError}`);
          setIsLoadingSession(false);
          
          // Don't rethrow - we've handled the error
          return;
        }
      } else {
        console.log("Skipping createStartAvatar - using pre-warmed session");
        // For pre-warmed session, wait for stream if not already ready
        if (!streamReadyRef.current) {
          console.log("Pre-warmed session: waiting for stream to be ready...");
          await new Promise<void>((resolve, reject) => {
            const checkInterval = setInterval(() => {
              if (streamReadyRef.current) {
                clearInterval(checkInterval);
                resolve();
              }
            }, 100);
            // Max wait 15 seconds for pre-warmed
            setTimeout(() => {
              clearInterval(checkInterval);
              if (!streamReadyRef.current) {
                reject(new Error("Pre-warmed stream not ready"));
              }
            }, 15000);
          });
        }
      }

      // Start speech recognition
      setupSpeechRecognition();

      // Start voice chat with explicit transport per SDK 2.0.13+
      // Only proceed if stream is ready
      if (streamReadyRef.current) {
        await avatar.current.startVoiceChat({
          useSilencePrompt: false,
          voiceChatTransport: VoiceChatTransport.WEBSOCKET,
        });
        setChatMode("voice_mode");
      } else {
        console.warn("Stream not ready, skipping voice chat initialization");
      }

      // Set up avatar speech capture from DOM as a backup method
      setupAvatarSpeechCapture();

      // Add contextual welcome message based on the scenario
      setTimeout(() => {
        if (transcript.length === 0) {
          if (scenario?.context && scenario?.context.includes("Emily")) {
            addToTranscript(
              "Avatar",
              "Hello! I understand we need to discuss Emily's behavior in meetings. I'm here to help you work through this situation.",
            );
          } else {
            addToTranscript("Avatar", "Hello! How can I help you today?");
          }
        }
      }, 1000);
    } catch (error: any) {
      console.error("Error starting avatar session:", error);
      console.log(`Error starting session: ${error.message}`);
      setUploadStatus(
        error.responseText
          ? `Error: ${JSON.parse(error.responseText).message}`
          : "Error starting session",
      );
    } finally {
      setIsLoadingSession(false);
    }
  }
  // Enhanced speak handler with fallback transcript mechanism
  async function handleSpeak() {
    if (!text) return;

    try {
      setIsLoadingRepeat(true);

      // Add user text to transcript
      addToTranscript("User", text);

      // Store what avatar will say
      const userInput = text;
      setText(""); // Clear input field

      // Track the time when we started speaking to check for event issues
      const speakStartTime = Date.now();
      let responseReceived = false;
      const sessionId = sessionIdRef.current || data?.session_id;
      // Try to get AI response for the avatar
      try {
        // First try to get an intelligent response via API
        const response = await fetch("/api/avatar/get-avatar-response", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: sessionId,
            avatarId: avatarId,
            knowledgeId: knowledgeId,
            userInput: userInput,
            context: scenario?.context || "",
            instructions: scenario?.instructions || "",
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.response) {
            // Make avatar speak the response
            await avatar.current?.speak({
              text: result.response,
              task_type: TaskType.TALK, // Use TALK mode for AI-generated responses
            });

            // Set a timer to check if we captured the response via events
            setTimeout(() => {
              if (!responseReceived) {
                // If no event was triggered after 500ms, add the response as a fallback
                const lastMessages = transcript.slice(-3);
                // Check if we've already added this message (avoid duplicates)
                const isDuplicate = lastMessages.some(
                  (msg) =>
                    msg.speaker === "Avatar" && msg.text === result.response,
                );

                if (!isDuplicate) {
                  console.log(
                    `Fallback: Adding response via timer check: ${result.response}`,
                  );
                  addToTranscript("Avatar", result.response);
                }
              }
            }, 500);

            return;
          }
        }
      } catch (e) {
        console.log(`Error getting AI response: ${e.message}`);
        // Continue to fallback
      }

      // Fallback to REPEAT mode if response API fails
      await avatar.current?.speak({
        text: userInput,
        task_type: TaskType.REPEAT, // In REPEAT mode, avatar says what we send
      });

      // Set a timer to check if we captured the response via events
      setTimeout(() => {
        const timeSinceSpeak = Date.now() - speakStartTime;
        // Only add fallback if enough time has passed and we didn't get events
        if (timeSinceSpeak > 300 && !responseReceived) {
          // Check recent messages to avoid duplicates
          const lastMessages = transcript.slice(-3);
          const isDuplicate = lastMessages.some(
            (msg) => msg.speaker === "Avatar" && msg.text === userInput,
          );

          if (!isDuplicate) {
            console.log(
              `Fallback: Adding repeat response via timer: ${userInput}`,
            );
            addToTranscript("Avatar", userInput);
          }
        }
      }, 500);
    } catch (error) {
      console.error("Error speaking:", error);
      console.log(`Error in handleSpeak: ${error.message}`);
    } finally {
      setIsLoadingRepeat(false);
    }
  }

  async function handleInterrupt() {
    if (!avatar.current) {
      console.log("Avatar API not initialized");
      return;
    }
    await avatar.current.interrupt().catch((e) => {
      console.log(e.message);
    });
  }

  const handleChangeChatMode = useMemoizedFn(async (v) => {
    if (v === chatMode) {
      return;
    }
    if (v === "text_mode") {
      avatar.current?.closeVoiceChat();
    } else {
      await avatar.current?.startVoiceChat({
        useSilencePrompt: false,
        voiceChatTransport: VoiceChatTransport.WEBSOCKET,
      });
    }
    setChatMode(v);
  });

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // endSession();
      console.log("Component unmounting - performing silent cleanup");

      // Clean up avatar without setting UI states
      if (avatar.current) {
        avatar.current.stopAvatar().catch(console.error);
      }

      // Clean up speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error("Error stopping speech recognition:", error);
        }
      }

      // Clean up observers
      if (observerRef.current?.cleanup) {
        observerRef.current.cleanup();
      }

      // Clean up audio analyzer
      if (audioAnalyzerRef.current?.cleanup) {
        audioAnalyzerRef.current.cleanup();
      }

      // Clean up stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Enhanced video stream handler with caption detection
  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.volume = 1.0;
      mediaStream.current.muted = false;

      mediaStream.current.onloadedmetadata = async () => {
        try {
          await mediaStream.current!.play();
          console.log("Video playing with full volume");

          // Start audio analysis once video is playing
          setupAudioAnalysis();

          // Setup button functionality
          setTimeout(setupButtonFunctionality, 1000);
        } catch (error) {
          console.error("Error playing video:", error);
          console.log("Error playing video: " + error.message);
        }
      };

      // Set up track event listeners
      mediaStream.current.addEventListener("addtrack", (event) => {
        if (event.track.kind === "audio") {
          console.log("Audio track added");
        }
      });
    }
  }, [mediaStream, stream]);

  // Enhanced caption tracking
  useEffect(() => {
    if (!mediaStream.current || !stream) return;

    try {
      // Make sure captions are enabled
      if (mediaStream.current.textTracks) {
        for (let i = 0; i < mediaStream.current.textTracks.length; i++) {
          const track = mediaStream.current.textTracks[i];
          track.mode = "showing";

          // Listen for cues and add them to sentence buffer instead of directly to transcript
          track.addEventListener("cuechange", () => {
            if (track.activeCues && track.activeCues.length > 0) {
              for (let j = 0; j < track.activeCues.length; j++) {
                const cue = track.activeCues[j] as any;
                if (cue && cue.text) {
                  console.log(`Caption cue: ${cue.text}`);

                  // Add to current sentence instead of directly to transcript
                  setCurrentAvatarSentence((prev) => {
                    return prev ? `${prev} ${cue.text}` : cue.text;
                  });
                }
              }
            }
          });

          console.log(
            `Track ${i} (${track.kind}/${track.label}) set to showing`,
          );
        }
      }
    } catch (error) {
      console.log(`Error setting up caption tracking: ${error.message}`);
    }
  }, [stream, mediaStream.current]);

  // Monitor sentence buffers and update transcript when appropriate
  useEffect(() => {
    // When avatar stops talking and we have content, add it to transcript
    if (
      !isAvatarTalking &&
      currentAvatarSentence &&
      currentAvatarSentence.trim().length > 0
    ) {
      // Add a small delay to allow any final words to be added to the sentence
      const timer = setTimeout(() => {
        const recentTranscripts = transcript.slice(-3);
        const isDuplicate = recentTranscripts.some(
          (line) =>
            line.speaker === "Avatar" && line.text === currentAvatarSentence,
        );

        if (!isDuplicate) {
          console.log(
            `Adding complete avatar sentence from effect: ${currentAvatarSentence}`,
          );
          addToTranscript("Avatar", currentAvatarSentence);
          setCurrentAvatarSentence("");
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isAvatarTalking, currentAvatarSentence]);

  useEffect(() => {
    // When user stops talking and we have content, add it to transcript
    if (
      !isUserTalking &&
      currentUserSentence &&
      currentUserSentence.trim().length > 0
    ) {
      // Add a small delay to allow any final words to be added to the sentence
      const timer = setTimeout(() => {
        const recentTranscripts = transcript.slice(-3);
        const isDuplicate = recentTranscripts.some(
          (line) =>
            line.speaker === "User" && line.text === currentUserSentence,
        );

        if (!isDuplicate) {
          console.log(
            `Adding complete user sentence from effect: ${currentUserSentence}`,
          );
          addToTranscript("User", currentUserSentence);
          setCurrentUserSentence("");
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isUserTalking, currentUserSentence]);

  useEffect(() => {
    // Update ref when transcript changes
    transcriptRef.current = transcript;
  }, [transcript]);
  
  // Cleanup stream timeout on unmount
  useEffect(() => {
    return () => {
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
        streamTimeoutRef.current = null;
      }
    };
  }, []);

  const isShowingLoadingOverlay = !stream && (isLoadingSession || sessionInitialized) && sessionStatus !== "ended" && !streamConnectionError;
  
  // Function to retry session initialization
  const handleRetrySession = async () => {
    setStreamConnectionError(null);
    initializationRef.current = false;
    setSessionInitialized(false);
    streamReadyRef.current = false;
    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current);
      streamTimeoutRef.current = null;
    }
    await startSession();
  };
  
  console.log("selectedAvatar", selectedAvatar);
  return (
    <div className="w-full h-screen bg-gray-50">
      <div className="flex flex-row gap-4 h-[calc(100vh-2rem)] max-w-[1800px] p-4">
        {/* Main Video Card - Left Side */}
        <div className="w-full">
          <Card className="h-full shadow-lg">
            <CardContent className="h-full flex flex-col justify-center items-center bg-white p-0 relative overflow-hidden">
              <AvatarLoadingOverlay
                isLoading={isShowingLoadingOverlay}
                avatarName={selectedAvatar?.name}
                status={uploadStatus}
                onCancel={() => {
                  window.location.href = "/avatar/practice";
                }}
              />
              {streamConnectionError && !stream && sessionStatus !== "ended" && !isSessionEnding && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                  <div className="text-center max-w-md px-6">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Connection Failed</h2>
                    <p className="text-slate-400 mb-6">{streamConnectionError}</p>
                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={handleRetrySession}
                        className="bg-[#04aac4] hover:bg-[#04aac4]/80 text-white px-6 py-2 rounded-lg"
                        data-testid="button-retry-session"
                      >
                        Try Again
                      </Button>
                      <button
                        onClick={() => window.location.href = "/avatar/practice"}
                        className="text-sm text-slate-500 hover:text-slate-300 transition-colors underline"
                        data-testid="button-return-practice"
                      >
                        Return to practice selection
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {stream ? (
                <div className="h-full w-full relative bg-white">
                  <video
                    ref={mediaStream}
                    autoPlay
                    playsInline
                    controls
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                    id="avatarVideo"
                    className="bg-white"
                    muted={false}
                    volume={1}
                  >
                    <track kind="captions" />
                  </video>
                  <div className="flex flex-col gap-2 absolute bottom-3 right-3 controls">
                    <Button
                      className="bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      variant="ghost"
                      onClick={handleInterrupt}
                      id="interruptButton"
                      disabled={uploadStatus.includes("Ending")}
                    >
                      Interrupt task
                    </Button>
                    <Button
                      className="bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      variant="ghost"
                      onClick={endSession}
                      id="endSessionButton"
                      disabled={uploadStatus.includes("Ending")}
                    >
                      End session & Save
                      {uploadStatus.includes("Ending") && (
                        <LoadingSpinner size="sm" className="ml-2" />
                      )}
                    </Button>
                    {uploadStatus && (
                      <Badge
                        className={`
                        ${
                          uploadStatus.includes("success")
                            ? "bg-green-500"
                            : uploadStatus.includes("Failed") ||
                                uploadStatus.includes("Error")
                              ? "bg-red-500"
                              : "bg-blue-500"
                        } 
                        text-white
                      `}
                      >
                        {uploadStatus}
                      </Badge>
                    )}
                    {transcriptUrl && (
                      <Button
                        href={transcriptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        variant="ghost"
                      >
                        View Transcript
                      </Button>
                    )}
                  </div>
                  {/* Session Timer and Speaking indicators - overlay on video */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {/* Session Timer with 6-minute limit */}
                    {trackedSessionId && sessionStatus === "started" && (
                      <SessionTimer
                        sessionId={trackedSessionId}
                        heygenSessionId={data?.session_id}
                        maxDurationSec={360}
                        onExpired={handleSessionExpired}
                        onWarning={handleSessionWarning}
                      />
                    )}
                    <div className="flex gap-2">
                      {isUserTalking && (
                        <Badge className="bg-blue-600">
                          <span className="animate-pulse mr-2">●</span> User
                          speaking
                        </Badge>
                      )}
                      {isAvatarTalking && (
                        <Badge className="bg-purple-600">
                          <span className="animate-pulse mr-2">●</span> Avatar
                          speaking
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Session expiry warning banner */}
                  {sessionExpiryWarning && (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse" data-testid="session-warning-banner">
                      Session ending in less than 1 minute!
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full justify-center items-center flex">
                  {/* {!isSessionEnding ? (
                    <Button
                      variant="default"
                      onClick={startSession}
                      disabled={isLoadingSession}
                    >
                      {isLoadingSession ? "Starting Session" : "Start Session"}
                      {isLoadingSession && (
                        <LoadingSpinner size="sm" className="ml-2" />
                      )}
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <p>Ending Session</p>
                      <LoadingSpinner size="sm" />
                    </div>
                  )} */}
                  {/* Only show "Ending Session" if we have an actual session that's ending */}
                  {sessionStatus === "ended" && isSessionEnding ? (
                    <div className="flex items-center justify-center gap-2">
                      <p>Ending Session</p>
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : sessionStatus === "not_started" && !sessionInitialized ? (
                    /* Manual start button - only show if auto-init hasn't started */
                    <Button
                      variant="default"
                      onClick={startSession}
                      disabled={isLoadingSession || initializationRef.current}
                    >
                      {isLoadingSession || initializationRef.current
                        ? "Starting Session"
                        : "Start Session"}
                      {(isLoadingSession || initializationRef.current) && (
                        <LoadingSpinner size="sm" className="ml-2" />
                      )}
                    </Button>
                  ) : sessionStatus === "not_started" && isLoadingSession ? (
                    /* Show loading during auto-initialization */
                    <div className="flex items-center justify-center gap-2">
                      <p>Starting Session</p>
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : (
                    /* Fallback for other states */
                    <div className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <Separator />
            {isUserTalking || isAvatarTalking ? (
              <CardFooter className="flex flex-col gap-3 relative bg-gray-800 text-white">
                <div className="w-full text-center">
                  <Button
                    className={`${isUserTalking ? "bg-blue-600" : "bg-purple-600"} text-white hover:opacity-80`}
                    variant="ghost"
                  >
                    {isUserTalking
                      ? "Listening to you..."
                      : "Avatar speaking..."}
                  </Button>
                </div>
              </CardFooter>
            ) : null}
          </Card>
        </div>

        {/* Transcript Panel - Right Side */}
        <div className="w-96">
          <Card className="h-full w-full bg-white">
            <CardContent className="p-4">
              <div className="flex justify-between mb-4 items-center">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xl text-black">
                    Live Transcript
                  </span>
                  <Badge className="bg-blue-500 text-white">
                    {transcript.length} lines
                  </Badge>
                  {language && language !== "en" && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium" data-testid="transcript-language-indicator">
                      <Globe className="w-3 h-3" />
                      <span>{languageNames[language] || language.toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </div>
              {transcript?.length ? (
                <div className="flex flex-col h-[calc(100vh-10rem)] max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="flex-1 overflow-scroll p-4 space-y-4 bg-white text-black">
                    {transcript.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.speaker === "User" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[95%] p-2 rounded-lg text-sm ${
                            message.speaker === "User"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span
                              className={`text-xs font-medium ${
                                message.speaker === "User"
                                  ? "text-blue-100"
                                  : "text-gray-600"
                              }`}
                            >
                              {message.speaker === "User" ? "You" : "Avatar"}
                            </span>
                            <span
                              className={`text-[10px] ${
                                message.speaker === "User"
                                  ? "text-blue-100"
                                  : "text-gray-500"
                              }`}
                            >
                              {message.timestamp}
                            </span>
                          </div>
                          <p className="text-sm leading-snug">{message.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
