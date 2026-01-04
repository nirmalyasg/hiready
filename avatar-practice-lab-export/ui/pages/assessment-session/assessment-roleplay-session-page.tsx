import React, { useEffect, useRef, useState } from "react";
import {
  useSearchParams,
  useLocation,
  useNavigate,
  Link,
} from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
// UI components
import BottomToolbar from "@/components/avatar-roleplay/BottomToolbar";

// Types
import { SessionStatus } from "@/types/avatar-roleplay-types";
import type { RealtimeAgent } from "@openai/agents/realtime";
import { useReactMediaRecorder } from "react-media-recorder";

// Context providers & hooks
import { useTranscript, TranscriptProvider } from "@/contexts/TranscriptContext";
import { useEvent, EventProvider } from "@/contexts/EventContext";
import { useRealtimeSession } from "@/hooks/useRealtimeSession";
import { useAvatarById } from "@/hooks/use-avatars";
import { createModerationGuardrail } from "@/lib/guardrails";
// Agent configs
import {
  chatRoleplayScenario,
  createRealtimeAgent,
  createRealtimeAgentFromBlueprint,
  chatPlatformName,
} from "@/lib/roleplay";
import type { ConversationBlueprint, ScenarioCounterPersona, PersonaOverlay } from "@/lib/conversation-framework";

interface ScenarioData {
  id?: number;
  name?: string;
  description?: string;
  context?: string;
  instructions?: string;
  openingScene?: string;
  avatarName?: string;
  avatarRole?: string;
  difficulty?: string;
  tags?: string[];
  counterPersona?: ScenarioCounterPersona;
  personaOverlays?: {
    ic?: PersonaOverlay;
    manager?: PersonaOverlay;
    senior?: PersonaOverlay;
    exec?: PersonaOverlay;
  };
}
// import { getNextResponseFromSupervisor } from "./supervisorAgent";
// import { avatarData } from "../practice/avatar-select/page";
import { useHandleSessionHistory } from "@/hooks/useHandleSessionHistory";
import { SCENARIOS } from "./roleplay-scenarios-page";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import ReactMarkdown from "react-markdown";
import { Clipboard, Download, Phone, PhoneOff, Mic, MicOff, ChevronUp, ChevronDown, MessageSquare, User, Volume2, VolumeX, Plus } from "lucide-react";
import { TranscriptItem } from "@/types/avatar-roleplay-types";
import { cn } from "@/lib/utils";

import useAudioDownload from "@/hooks/useAudioDownload";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { generateUniqueId } from "@/components/InteractiveAvatar";
import { useToast } from "@/hooks/use-toast";
import { useRealtimePrewarm } from "@/contexts/RealtimeSessionPrewarmContext";
import {
  buildFullInterviewPrompt,
  buildRoleBasedInterviewPrompt,
  getInterviewerPersona,
  INTERVIEWER_CORE_SYSTEM,
  type RoleKit,
  type InterviewConfig,
  type InterviewPlan,
  type InterviewMode,
} from "@/lib/interview-prompts";
import { InterviewSessionLayout } from "@/components/interview/interview-session-layout";
import type { SupportedLanguage, CodingProblem } from "@/components/interview/coding-panel";

function AssessmentRoleplaySessionPage() {
  return (
    <TranscriptProvider>
      <EventProvider>
        <AvatarRoleplayPractice />
      </EventProvider>
    </TranscriptProvider>
  );
}

export default AssessmentRoleplaySessionPage;
interface InterviewSessionData {
  id: number;
  interviewConfigId: number;
  interviewPlanId?: number;
  status: string;
  roleKit?: {
    id: number;
    name: string;
    level: string;
    domain: string;
    description?: string;
    roleContext?: string;
    coreCompetencies?: string[];
    typicalQuestions?: string[];
    skillsFocus?: string[];
    defaultInterviewTypes?: string[];
    estimatedDuration?: number;
  };
  config?: {
    id?: number;
    interviewType: string;
    style: string;
    seniority: string;
  };
  plan?: {
    phases?: { name: string; duration: number; objectives?: string[]; questionPatterns?: string[] }[];
    focusAreas?: string[];
    codingProblem?: CodingProblem;
  };
}

interface CodingExerciseFromDB {
  id: number;
  name: string;
  activityType: "explain" | "debug" | "modify";
  language: string;
  difficulty: "easy" | "medium" | "hard";
  codeSnippet: string;
  bugDescription: string | null;
  modificationRequirement: string | null;
  expectedBehavior: string | null;
  expectedSignals: { signal: string; importance: string }[] | null;
}

const AvatarRoleplayPractice = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [interviewSession, setInterviewSession] = useState<InterviewSessionData | null>(null);
  const [codingExercise, setCodingExercise] = useState<CodingProblem | null>(null);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [workspaceLanguage, setWorkspaceLanguage] = useState<SupportedLanguage>("javascript");
  const [workspaceNotes, setWorkspaceNotes] = useState("");
  const [workspaceCalculation, setWorkspaceCalculation] = useState("");
  
  const handleCodeChange = (code: string, language: SupportedLanguage) => {
    setWorkspaceCode(code);
    setWorkspaceLanguage(language);
  };
  
  const handleNotesChange = (notes: string) => {
    setWorkspaceNotes(notes);
  };
  
  const handleCalculationChange = (calculation: string) => {
    setWorkspaceCalculation(calculation);
  };
  
  const [error, setError] = useState("");
  const [researchData, setResearchData] = useState<string>("");
  const avatarId = searchParams.get("avatarId");
  const interviewSessionId = searchParams.get("interviewSessionId");
  const isInterviewMode = !!interviewSessionId;
  const { data: avatarData, isLoading } = useAvatarById(avatarId);
  const realtimePrewarm = useRealtimePrewarm();
  // const { status, startRecording, stopRecording, mediaBlobUrl:audioUrl } =useReactMediaRecorder({ audio: true });
  // const downloadRecording = async () => {
  //   if (!mediaBlobUrl) return;

  //   const response = await fetch(mediaBlobUrl);
  //   const blob = await response.blob();

  //   // Create a temporary link
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement("a");
  //   a.style.display = "none";
  //   a.href = url;
  //   a.download = "recording.mp3"; // change extension to .wav if needed
  //   document.body.appendChild(a);
  //   a.click();

  //   // Cleanup
  //   URL.revokeObjectURL(url);
  //   document.body.removeChild(a);
  // };
  // ---------------------------------------------------------------------
  // Codec selector – lets you toggle between wide-band Opus (48 kHz)
  // and narrow-band PCMU/PCMA (8 kHz) to hear what the agent sounds like on
  // a traditional phone line and to validate ASR / VAD behaviour under that
  // constraint.
  //
  // We read the `?codec=` query-param and rely on the `changePeerConnection`
  // hook (configured in `useRealtimeSession`) to set the preferred codec
  // before the offer/answer negotiation.
  // ---------------------------------------------------------------------
  const urlCodec = searchParams.get("codec") || "opus";
  // Agents SDK doesn't currently support codec selection so it is now forced
  // via global codecPatch at module load

  const { transcriptItems, addTranscriptMessage, addTranscriptBreadcrumb } =
    useTranscript();
  const { logClientEvent, logServerEvent } = useEvent();
  const [isInitializing, setIsInitializing] = useState(true);

  const [selectedAgentName, setSelectedAgentName] =
    useState<string>("chatRoleplay");
  // const [selectedAgentConfigSet, setSelectedAgentConfigSet] = useState<
  //   RealtimeAgent[] | null
  // >(sdkScenarioMap.chatSupervisor);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  // Ref to identify whether the latest agent switch came from an automatic handoff
  // const handoffTriggeredRef = useRef(false);

  const sdkAudioElement = React.useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const el = document.createElement("audio");
    el.autoplay = true;
    el.style.display = "none";
    document.body.appendChild(el);
    return el;
  }, []);
  const scenarioId = searchParams.get("scenarioId");

  useEffect(() => {
    if (scenario) return;
    
    const fetchScenario = async () => {
      try {
        setIsInitializing(true);
        const response = await fetch(
          `/api/avatar/get-scenarios?scenarioId=${scenarioId}`,
        );
        const data = await response.json();
        if (data.scenarios && data.scenarios.length > 0) {
          setScenario(data.scenarios[0]);
          console.log("scenario", data.scenarios[0]);
        } else {
          setError(
            "Scenario not found. Please return to practice and try again.",
          );
        }
      } catch (error) {
        console.error("Error fetching scenario:", error);
        setError(
          "Unable to load the practice scenario. Please check your connection and try again.",
        );
      } finally {
        setIsInitializing(false);
      }
    };

    if (scenarioId) {
      fetchScenario();
    } else if (!isInterviewMode) {
      setIsInitializing(false);
    }
  }, [scenarioId, isInterviewMode]);
  
  useEffect(() => {
    if (!isInterviewMode || interviewSession) return;
    
    const fetchInterviewSession = async () => {
      try {
        setIsInitializing(true);
        const response = await fetch(`/api/interview/session/${interviewSessionId}`);
        const data = await response.json();
        if (data.success && data.session) {
          setInterviewSession(data.session);
          console.log("[Interview] Loaded session:", data.session);
          
          const interviewScenario: ScenarioData = {
            name: data.session.roleKit?.name || "Interview Practice",
            description: `${data.session.config?.interviewType || "interview"} interview for ${data.session.roleKit?.name || "role"}`,
            context: buildInterviewContext(data.session),
            instructions: buildInterviewInstructions(data.session),
            avatarRole: getInterviewerRole(data.session.config?.interviewType),
            difficulty: data.session.config?.style || "neutral",
          };
          setScenario(interviewScenario);
        } else {
          setError("Interview session not found. Please return and try again.");
        }
      } catch (err) {
        console.error("Error fetching interview session:", err);
        setError("Unable to load interview session. Please check your connection.");
      } finally {
        setIsInitializing(false);
      }
    };
    
    fetchInterviewSession();
  }, [isInterviewMode, interviewSessionId, interviewSession]);
  
  useEffect(() => {
    if (!interviewSession) return;
    if (interviewSession.config?.interviewType !== "technical") return;
    if (codingExercise) return;
    
    const fetchCodingExercise = async () => {
      try {
        const roleKitId = interviewSession.roleKit?.id;
        const configId = interviewSession.config?.id;
        const interviewType = interviewSession.config?.interviewType;
        
        const response = await fetch("/api/interview/match-exercise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            configId,
            roleKitId,
            interviewType,
          }),
        });
        
        const data = await response.json();
        
        if (data.success && data.exercise) {
          const matchedExercise = data.exercise as CodingExerciseFromDB;
          console.log(`[Interview] Exercise matched via ${data.source}:`, {
            name: matchedExercise.name,
            matchedSkills: data.matchedSkills,
            profile: data.profile,
          });
          
          const activityDescriptions = {
            explain: "Walk through this code and explain what it does, line by line.",
            debug: matchedExercise.bugDescription || "There's a bug in this code. Find and fix it.",
            modify: matchedExercise.modificationRequirement || "Modify this code to add the requested feature.",
          };
          
          const skillsNote = data.matchedSkills?.length > 0 
            ? `\n\n**Skills tested:** ${data.matchedSkills.join(", ")}`
            : "";
          
          const problem: CodingProblem = {
            id: matchedExercise.id ? `exercise-${matchedExercise.id}` : "generated",
            title: matchedExercise.name,
            difficulty: matchedExercise.difficulty === "easy" ? "Easy" : 
                       matchedExercise.difficulty === "medium" ? "Medium" : "Hard",
            description: `${activityDescriptions[matchedExercise.activityType as keyof typeof activityDescriptions] || matchedExercise.expectedBehavior}\n\n${matchedExercise.expectedBehavior || ""}${skillsNote}`,
            examples: [],
            constraints: [],
            starterCode: {
              [matchedExercise.language]: matchedExercise.codeSnippet,
              javascript: matchedExercise.language === "javascript" ? matchedExercise.codeSnippet : undefined,
              python: matchedExercise.language === "python" ? matchedExercise.codeSnippet : undefined,
            } as Record<string, string>,
          };
          
          setCodingExercise(problem);
          console.log("[Interview] Loaded coding exercise:", problem.title);
        }
      } catch (err) {
        console.error("Error fetching coding exercise:", err);
      }
    };
    
    fetchCodingExercise();
  }, [interviewSession, codingExercise]);
  
  const getInterviewerRole = (type?: string): string => {
    const persona = getInterviewerPersona(type as InterviewConfig["interviewType"]);
    return persona.title;
  };
  
  const buildInterviewContext = (session: InterviewSessionData): string => {
    const roleKit = session.roleKit;
    const config = session.config;
    const plan = session.plan;
    
    if (!roleKit || !config) {
      return `You are conducting a job interview. Be professional and thorough.`;
    }
    
    const mappedRoleKit: RoleKit = {
      id: roleKit.id || 0,
      name: roleKit.name || "Position",
      level: (roleKit.level as "entry" | "mid" | "senior") || "entry",
      domain: roleKit.domain || "general",
      roleContext: roleKit.roleContext || roleKit.description || "",
      skillsFocus: roleKit.skillsFocus || [],
      coreCompetencies: roleKit.coreCompetencies || [],
      typicalQuestions: roleKit.typicalQuestions || [],
      defaultInterviewTypes: roleKit.defaultInterviewTypes || ["hr"],
      estimatedDuration: roleKit.estimatedDuration || 360,
    };
    
    const mappedConfig: InterviewConfig = {
      id: config.id || 0,
      interviewType: (config.interviewType as "hr" | "hiring_manager" | "technical" | "panel") || "hr",
      style: (config.style as "friendly" | "neutral" | "stress") || "neutral",
      seniority: (config.seniority as "entry" | "mid" | "senior") || "entry",
    };
    
    const mappedPlan: InterviewPlan = {
      phases: plan?.phases?.map(p => ({
        name: p.name,
        duration: p.duration,
        objectives: p.objectives || [],
        questionPatterns: p.questionPatterns || [],
      })) || [],
      focusAreas: plan?.focusAreas || [],
    };
    
    try {
      return buildRoleBasedInterviewPrompt({
        roleKit: mappedRoleKit,
        config: mappedConfig,
        plan: mappedPlan,
      });
    } catch (err) {
      console.error("[Interview] Error building prompt:", err);
      return `You are conducting a ${config.interviewType || "job"} interview for a ${roleKit.name || "position"} role. Be professional and thorough.`;
    }
  };
  
  const buildInterviewInstructions = (session: InterviewSessionData): string => {
    const config = session.config;
    const roleKit = session.roleKit;
    const plan = session.plan;
    
    const persona = getInterviewerPersona((config?.interviewType as InterviewConfig["interviewType"]) || "hr");
    
    let instructions = `You are playing: ${persona.title}\n`;
    instructions += `Opening Style: ${persona.openingStyle}\n`;
    instructions += `Focus Areas: ${persona.focus}\n\n`;
    
    if (roleKit?.typicalQuestions?.length) {
      instructions += `SAMPLE QUESTIONS TO DRAW FROM:\n`;
      roleKit.typicalQuestions.slice(0, 7).forEach((q, i) => {
        instructions += `${i + 1}. ${q}\n`;
      });
      instructions += "\n";
    }
    
    if (plan?.phases?.length) {
      instructions += `INTERVIEW STRUCTURE:\n`;
      plan.phases.forEach((phase, i) => {
        const objectives = phase.objectives?.join("; ") || "General assessment";
        instructions += `${i + 1}. ${phase.name} (${phase.duration} min): ${objectives}\n`;
      });
      instructions += "\n";
    }
    
    instructions += `PROBE AREAS:\n`;
    persona.probeAreas.forEach(area => {
      instructions += `- ${area}\n`;
    });
    
    instructions += `\nCRITICAL RULES:\n`;
    instructions += `- Ask only ONE question at a time\n`;
    instructions += `- Probe for specifics when answers are vague (numbers, decisions, personal contribution)\n`;
    instructions += `- Do NOT provide hints, coaching, or feedback during the interview\n`;
    instructions += `- Stay in character as ${persona.title} throughout\n`;
    instructions += `- Start with a warm greeting appropriate to ${persona.openingStyle} style\n`;
    
    return instructions;
  };

  // Attach SDK audio element once it exists (after first render in browser)
  useEffect(() => {
    if (sdkAudioElement && !audioElementRef.current) {
      audioElementRef.current = sdkAudioElement;
    }
  }, [sdkAudioElement]);

  const { connect, disconnect, sendUserText, sendEvent, interrupt, mute } =
    useRealtimeSession({
      onConnectionChange: (s) => setSessionStatus(s as SessionStatus),
      // onAgentHandoff: (agentName: string) => {
      //   handoffTriggeredRef.current = true;
      //   setSelectedAgentName(agentName);
      // },
    });

  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>("DISCONNECTED");

  const [isEventsPaneExpanded, setIsEventsPaneExpanded] =
    useState<boolean>(false);
  const [userText, setUserText] = useState<string>("");
  const [isPTTActive, setIsPTTActive] = useState<boolean>(false);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState<boolean>(false);
  const [isAudioPlaybackEnabled, setIsAudioPlaybackEnabled] = useState<boolean>(true);
  
  // Track if user manually disconnected - prevents auto-reconnect
  const userManuallyDisconnectedRef = useRef<boolean>(false);

  // Initialize the recording hook.
  const {
    startRecording,
    stopRecording,
    downloadRecording,
    generatePlaybackUrl,
    audioUrl,
    generateBlob,
  } = useAudioDownload();

  const sendClientEvent = (eventObj: any, eventNameSuffix = "") => {
    try {
      sendEvent(eventObj);
      logClientEvent(eventObj, eventNameSuffix);
    } catch (err) {
      console.error("Failed to send via SDK", err);
    }
  };

  useHandleSessionHistory();

  const autostart = searchParams.get("autostart") === "true";

  useEffect(() => {
    if (isInitializing) return;
    // Don't auto-reconnect if user manually disconnected
    if (userManuallyDisconnectedRef.current) return;
    // Wait for avatar data to load to ensure correct voice gender
    if (avatarId && isLoading) {
      console.log("[Autostart] Waiting for avatar data to load...");
      return;
    }
    if (autostart && selectedAgentName && sessionStatus === "DISCONNECTED") {
      console.log("[Autostart] Avatar data ready, gender:", avatarData?.gender, "- starting connection");
      connectToRealtime();
    }
  }, [selectedAgentName, isInitializing, autostart, avatarData, isLoading, avatarId]);
  // useEffect(() => {
  //   if (!transcriptItems?.length) return;

  //   // Listen to transcript items; whenever a new agent message is DONE
  //   const lastAgentMessage = transcriptItems
  //     .filter((i) => i.status === "DONE" && i.role !== "user")
  //     .slice(-1)[0];

  //   if (!lastAgentMessage) return;

  //   // Generate playback URL for user to listen
  //   generatePlaybackUrl();
  // }, [transcriptItems]);

  // useEffect(() => {
  //   if (
  //     sessionStatus === "CONNECTED" &&
  //     selectedAgentConfigSet &&
  //     selectedAgentName
  //   ) {
  //     // const currentAgent = selectedAgentConfigSet.find(
  //     //   (a) => a.name === selectedAgentName
  //     // );
  //     // addTranscriptBreadcrumb(`Agent: ${selectedAgentName}`, currentAgent);
  //     // updateSession(!handoffTriggeredRef.current);
  //     // Reset flag after handling so subsequent effects behave normally
  //     handoffTriggeredRef.current = false;
  //   }
  // }, [selectedAgentConfigSet, selectedAgentName, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "CONNECTED") {
      updateSession(!!!transcriptItems?.length);
    }
  }, [isPTTActive, isInitializing, sessionStatus]);

  const fetchEphemeralKey = async (): Promise<string | null> => {
    const cachedToken = realtimePrewarm.consumeToken();
    if (cachedToken) {
      console.log("[Session] Using pre-warmed OpenAI Realtime token");
      logClientEvent({ source: "cache" }, "fetch_session_token_cached");
      return cachedToken;
    }
    
    console.log("[Session] No cached token, fetching fresh...");
    logClientEvent({ url: "/session" }, "fetch_session_token_request");
    const tokenResponse = await fetch("/api/avatar/session");
    const data = await tokenResponse.json();
    logServerEvent(data, "fetch_session_token_response");

    if (!data.client_secret?.value) {
      logClientEvent(data, "error.no_ephemeral_key");
      console.error("No ephemeral key provided by the server");
      setSessionStatus("DISCONNECTED");
      return null;
    }

    return data.client_secret.value;
  };
  const voiceMap: Record<string, string> = {
    male: "ballad",
    female: "sage",
  };

  function getApiVoice(gender: string) {
    if (!gender) return "sage";
    return voiceMap[gender.toLowerCase()] || "sage";
  }
  const toneFromParams = searchParams.get("tone") || "";
  const languageFromParams = searchParams.get("language") || "en";
  const culturalPresetFromParams = searchParams.get("culturalPreset") || null;
  const accentFromParams = searchParams.get("accent") || null;
  const blueprintParam = searchParams.get("blueprint");
  
  const parsedBlueprint: ConversationBlueprint | null = React.useMemo(() => {
    if (!blueprintParam) return null;
    try {
      return JSON.parse(decodeURIComponent(blueprintParam));
    } catch (e) {
      console.error("Failed to parse blueprint:", e);
      return null;
    }
  }, [blueprintParam]);
  function formExtraContext(
    learnerName: string,
    scenario: {
      name?: string;
      instructions?: string;
      context?: string;
      description?: string;
      avatarRole?: string;
      avatarName?: string;
    },
  ) {
    return `
## IMPORTANT: Role Assignment
- YOU are playing: ${scenario?.avatarName || "the stakeholder"} (${scenario?.avatarRole || "stakeholder"})
- The USER is playing: ${learnerName || "the manager/professional"} who is practicing their skills
- Stay in character as ${scenario?.avatarName || "the stakeholder"} throughout the conversation
- The user is the one practicing - they should lead and you should respond as ${scenario?.avatarName || "your character"}

${scenario?.name ? `## Scenario: ${scenario.name}` : ""}
${scenario?.description ? `## Situation Overview\n${scenario.description}` : ""}
${scenario?.context ? `## Your Character's Mindset & Behavior\n${scenario.context}` : ""}
${scenario?.instructions ? `## How to Play Your Character\n${scenario.instructions}` : ""}
    `.trim();
  }
  const waitUntilReady = async (delay = 1000) => {
    console.log(`Waiting for ${delay}ms...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  };
  const buildHistoryContext = () => {
    const filteredItems = transcriptItems?.filter(
      (item) => item.status === "DONE" && !item.isHidden,
    );

    if (!filteredItems || filteredItems.length === 0) return ""; // no history

    const recentItems =
      filteredItems.length > 6 ? filteredItems.slice(-6) : filteredItems;

    return recentItems
      .map(
        (item) =>
          `${item.role === "user" ? "Learner" : "Coach"}: ${item.title}`,
      )
      .join("\n");
  };

  const fetchTopicResearch = async (topic: string, category?: string, conversationMode?: string, userObjective?: string): Promise<string> => {
    try {
      const response = await fetch("/api/avatar/research-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, category, conversationMode, userObjective }),
      });
      const data = await response.json();
      if (data.success && data.promptAddition) {
        // Honor quality gate - only use research if quality score indicates usability
        const qualityScore = data.quality?.score || 0;
        const isUsable = data.quality?.isUsable !== false; // Default to true if not specified
        console.log("Research fetched:", {
          hasReliableInfo: data.hasReliableInfo,
          qualityScore,
          isUsable,
          reason: data.quality?.reason
        });
        
        if (!isUsable) {
          console.log("Research quality too low, skipping injection");
          return "";
        }
        return data.promptAddition;
      }
      return "";
    } catch (error) {
      console.error("Error fetching research:", error);
      return "";
    }
  };

  console.log("avatar Data", avatarData);
  const connectToRealtime = async () => {
    if (sessionStatus !== "DISCONNECTED") return;
    setSessionStatus("CONNECTING");
    console.log("isInitializing in connect", isInitializing);
    
    const connectStartTime = performance.now();
    const timings: Record<string, number> = {};
    
    try {
      if (isInitializing) {
        return;
      }

      const tokenStartTime = performance.now();
      const EPHEMERAL_KEY = await fetchEphemeralKey();
      timings.tokenFetch = performance.now() - tokenStartTime;
      if (!EPHEMERAL_KEY) return;
      // const scenarioKey = searchParams.get("scenario") || "";
      // const scenario = SCENARIOS.find((s) => s.key === scenarioKey);
      // console.log("scenario", scenario, "scenarioKey", scenarioKey);
      // const selectedAvatar = avatarData?.find((a) => a?.id === avatarId);
      const selectedAvatar = avatarData;
      const title = scenario?.name || "";
      const notes = formExtraContext(user?.displayName || "", scenario || {});

      const historyContext = buildHistoryContext();

      console.log({ isInitializing }, "notes scenario", notes);
      console.log("selectedAvatar", selectedAvatar);

      const voice = getApiVoice(selectedAvatar?.gender || "");
      console.log("voice", voice);
      
      // ============================================================
      // DEBUG: Voice Session Configuration
      // ============================================================
      console.log("=".repeat(60));
      console.log("[Voice Session] CONFIGURATION DEBUG");
      console.log("=".repeat(60));
      console.log("[Voice Session] Service: OpenAI Realtime API");
      console.log("[Voice Session] Avatar ID:", avatarId);
      console.log("[Voice Session] Avatar Data:", JSON.stringify(selectedAvatar, null, 2));
      console.log("[Voice Session] Avatar Gender:", selectedAvatar?.gender);
      console.log("[Voice Session] Voice Selected:", voice, "(male=ballad, female=sage)");
      console.log("[Voice Session] Language:", languageFromParams);
      console.log("[Voice Session] Accent:", accentFromParams || "default");
      console.log("[Voice Session] Cultural Preset:", culturalPresetFromParams || "none");
      console.log("[Voice Session] Tone:", toneFromParams || "realistic");
      console.log("[Voice Session] Scenario ID:", scenarioId);
      console.log("[Voice Session] Scenario Name:", scenario?.name);
      console.log("[Voice Session] Has Blueprint:", !!parsedBlueprint);
      console.log("=".repeat(60));
      
      // Fetch research ONLY for impromptu speaking sessions
      // Impromptu sessions are identified by having a 'topic' or 'category' URL param
      // Pre-built scenarios should NOT trigger Tavily research
      const topicParam = searchParams.get("topic");
      const categoryParam = searchParams.get("category");
      let fetchedResearch = researchData;
      
      // IMPORTANT: Only fetch research if this is an impromptu/discussion session
      // indicated by having a topic or category URL parameter
      const isImpromptuSession = !!(topicParam || categoryParam);
      const topicToResearch = topicParam || parsedBlueprint?.scenarioSummary?.title;
      
      // ============================================================
      // DEBUG: IMPROMPTU SESSION DETECTION
      // ============================================================
      console.log("=".repeat(60));
      console.log("[IMPROMPTU] SESSION DETECTION");
      console.log("=".repeat(60));
      console.log("[IMPROMPTU] Is Impromptu Session:", isImpromptuSession);
      console.log("[IMPROMPTU] Topic Param:", topicParam || "NOT SET");
      console.log("[IMPROMPTU] Category Param:", categoryParam || "NOT SET");
      console.log("[IMPROMPTU] Topic to Research:", topicToResearch || "NONE");
      console.log("[IMPROMPTU] Blueprint Title:", parsedBlueprint?.scenarioSummary?.title || "NONE");
      console.log("=".repeat(60));
      
      if (isImpromptuSession && !fetchedResearch && topicToResearch) {
        const researchStartTime = performance.now();
        const cachedResearch = realtimePrewarm.consumeResearch();
        if (cachedResearch) {
          console.log("[TAVILY] Using pre-warmed research from cache");
          fetchedResearch = cachedResearch;
          setResearchData(fetchedResearch);
          timings.researchFetch = performance.now() - researchStartTime;
          console.log("[TAVILY] Research Length:", fetchedResearch.length, "chars");
          console.log("[TIMING] Research from cache:", timings.researchFetch.toFixed(0), "ms");
        } else {
          console.log("=".repeat(60));
          console.log("[TAVILY] FETCHING RESEARCH (not cached)");
          console.log("=".repeat(60));
          console.log("[TAVILY] Topic:", topicToResearch);
          console.log("[TAVILY] Category:", categoryParam || "general");
          const conversationMode = parsedBlueprint?.conversationMode;
          const userObjective = parsedBlueprint?.userObjective;
          console.log("[TAVILY] Conversation Mode:", conversationMode);
          console.log("[TAVILY] User Objective:", userObjective);
          fetchedResearch = await fetchTopicResearch(topicToResearch, categoryParam || undefined, conversationMode, userObjective);
          timings.researchFetch = performance.now() - researchStartTime;
          if (fetchedResearch) {
            setResearchData(fetchedResearch);
            console.log("[TAVILY] SUCCESS - Research fetched");
            console.log("[TAVILY] Research Length:", fetchedResearch.length, "chars");
            console.log("[TAVILY] Research Preview:", fetchedResearch.substring(0, 500));
            console.log("[TIMING] Research fetch (not cached):", timings.researchFetch.toFixed(0), "ms");
            console.log("=".repeat(60));
          } else {
            console.log("[TAVILY] No reliable sources found, proceeding without research");
            console.log("=".repeat(60));
          }
        }
      } else if (!isImpromptuSession) {
        console.log("[IMPROMPTU] SKIPPED - This is a pre-built scenario, not impromptu speaking");
      } else {
        console.log("[IMPROMPTU] SKIPPED - Already have research or no topic");
      }
      
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
      
      const counterPersonaFromScenario = scenario?.counterPersona || null;
      
      const userName = user?.displayName || user?.username || "the professional";
      const avatarDisplayName = selectedAvatar?.name || scenario?.avatarName || "the stakeholder";
      
      // ============================================================
      // DEBUG: Persona & Counter-Persona Configuration
      // ============================================================
      console.log("=".repeat(60));
      console.log("[Voice Session] PERSONA DEBUG");
      console.log("=".repeat(60));
      console.log("[Persona] User Name:", userName);
      console.log("[Persona] Avatar Display Name:", avatarDisplayName);
      console.log("[Persona] Overlay Level:", personaOverlayLevel || "none");
      console.log("[Persona] Overlay Data:", personaOverlayData ? JSON.stringify(personaOverlayData, null, 2) : "none");
      console.log("[Counter-Persona] From Scenario:", counterPersonaFromScenario ? JSON.stringify(counterPersonaFromScenario, null, 2) : "none");
      if (counterPersonaFromScenario) {
        console.log("[Counter-Persona] Role:", counterPersonaFromScenario.role);
        console.log("[Counter-Persona] Cares About:", counterPersonaFromScenario.caresAbout);
        console.log("[Counter-Persona] Pressure Response:", counterPersonaFromScenario.pressureResponse);
        console.log("[Counter-Persona] Triggers:", counterPersonaFromScenario.triggers?.join(", ") || "none");
      }
      console.log("=".repeat(60));
      
      let agent;
      if (parsedBlueprint) {
        console.log("=".repeat(60));
        console.log("[Voice Session] AGENT CREATION - BLUEPRINT PATH");
        console.log("=".repeat(60));
        console.log("[Agent] Blueprint:", JSON.stringify(parsedBlueprint, null, 2));
        console.log("[Agent] Voice:", voice);
        console.log("[Agent] Language:", languageFromParams);
        console.log("[Agent] Cultural Preset:", culturalPresetFromParams || "none");
        console.log("[Agent] Accent:", accentFromParams || "default");
        console.log("[Agent] Has Research:", !!fetchedResearch);
        console.log("[Agent] Persona Overlay:", personaOverlayData?.userRoleTitle || personaOverlayLevel || "none");
        console.log("[Agent] Avatar Name:", avatarDisplayName);
        console.log("[Agent] User Name:", userName);
        console.log("[Agent] Opening Scene:", scenario?.openingScene ? "yes" : "no");
        console.log("[Agent] Scenario Counter-Persona:", counterPersonaFromScenario ? "yes" : "no");
        console.log("=".repeat(60));
        agent = createRealtimeAgentFromBlueprint(
          parsedBlueprint,
          voice,
          languageFromParams,
          culturalPresetFromParams,
          accentFromParams,
          fetchedResearch,
          personaOverlayData,
          avatarDisplayName,
          counterPersonaFromScenario,
          userName,
          scenario?.openingScene,
        );
      } else {
        const agentInstructions = historyContext
          ? `${notes}\n\n# Previous Conversation\n${historyContext}`
          : notes;
        const role = scenario?.avatarRole || "stakeholder";
        const avatarPersona = avatarDisplayName;
        const scenarioTone = toneFromParams || "realistic";
        
        const openingDirectiveInput = {
          scenarioName: scenario?.name || title,
          avatarRole: role,
          avatarName: avatarPersona,
          userName: userName,
          openingScene: scenario?.openingScene,
          instructions: scenario?.instructions,
          tags: scenario?.tags,
          scenarioDescription: scenario?.description,
          scenarioContext: scenario?.context,
        };
        
        console.log("=".repeat(60));
        console.log("[Voice Session] AGENT CREATION - SCENARIO PATH (Non-Blueprint)");
        console.log("=".repeat(60));
        console.log("[Agent] Title:", title);
        console.log("[Agent] Role:", role);
        console.log("[Agent] Avatar Persona:", avatarPersona);
        console.log("[Agent] Tone:", scenarioTone);
        console.log("[Agent] Voice:", voice);
        console.log("[Agent] Language:", languageFromParams);
        console.log("[Agent] Cultural Preset:", culturalPresetFromParams || "none");
        console.log("[Agent] Accent:", accentFromParams || "default");
        console.log("[Agent] Has Research:", !!fetchedResearch);
        console.log("[Agent] Counter-Persona:", counterPersonaFromScenario ? "yes" : "no");
        console.log("[Agent] Persona Overlay:", personaOverlayData?.userRoleTitle || personaOverlayLevel || "none");
        console.log("[Agent] Opening Directive Input:", JSON.stringify(openingDirectiveInput, null, 2));
        console.log("[Agent] Instructions Length:", agentInstructions.length, "chars");
        console.log("[Agent] Instructions Preview:", agentInstructions.substring(0, 500));
        console.log("=".repeat(60));
        
        agent = createRealtimeAgent(
          title,
          agentInstructions,
          voice,
          role,
          avatarPersona,
          scenarioTone,
          languageFromParams,
          culturalPresetFromParams,
          accentFromParams,
          fetchedResearch,
          counterPersonaFromScenario,
          openingDirectiveInput,
          personaOverlayData,
        );
      }
      // Ensure the selectedAgentName is first so that it becomes the root
      const reorderedAgents = [agent];

      const companyName = chatPlatformName;
      
      const agentPrepTime = performance.now() - connectStartTime - (timings.tokenFetch || 0) - (timings.researchFetch || 0);
      timings.agentPrep = agentPrepTime;

      const webrtcStartTime = performance.now();
      await connect({
        getEphemeralKey: async () => EPHEMERAL_KEY,
        initialAgents: reorderedAgents,
        audioElement: sdkAudioElement,
      });
      timings.webrtcConnect = performance.now() - webrtcStartTime;
      
      const totalTime = performance.now() - connectStartTime;
      console.log("=".repeat(60));
      console.log("[TIMING] CONNECTION PERFORMANCE SUMMARY");
      console.log("=".repeat(60));
      console.log("[TIMING] Token fetch:", (timings.tokenFetch || 0).toFixed(0), "ms", timings.tokenFetch && timings.tokenFetch < 50 ? "(CACHED)" : "");
      console.log("[TIMING] Research fetch:", (timings.researchFetch || 0).toFixed(0), "ms");
      console.log("[TIMING] Agent preparation:", (timings.agentPrep || 0).toFixed(0), "ms");
      console.log("[TIMING] WebRTC connect:", (timings.webrtcConnect || 0).toFixed(0), "ms");
      console.log("[TIMING] TOTAL:", totalTime.toFixed(0), "ms");
      console.log("=".repeat(60));
      
    } catch (err) {
      console.error("Error connecting via SDK:", err);
      setSessionStatus("DISCONNECTED");
    }
    return;
  };

  const disconnectFromRealtime = () => {
    // Mark as manually disconnected to prevent auto-reconnect
    userManuallyDisconnectedRef.current = true;
    disconnect();
    setSessionStatus("DISCONNECTED");
    setIsPTTUserSpeaking(false);
  };

  const sendSimulatedUserMessage = (text: string) => {
    const id = uuidv4().slice(0, 32);
    addTranscriptMessage(id, "user", text, true);

    sendClientEvent({
      type: "conversation.item.create",
      item: {
        id,
        type: "message",
        role: "user",
        content: [{ type: "input_text", text }],
      },
    });
    sendClientEvent(
      { type: "response.create" },
      "(simulated user text message)",
    );
  };

  const updateSession = (shouldTriggerResponse: boolean = false) => {
    // Reflect Push-to-Talk UI state by (de)activating server VAD on the
    // backend. The Realtime SDK supports live session updates via the
    // `session.update` event.
    const turnDetection = isPTTActive
      ? null
      : {
          type: "server_vad",
          threshold: 0.9,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
          create_response: true,
        };

    sendEvent({
      type: "session.update",
      session: {
        turn_detection: turnDetection,
      },
    });

    // Send an initial 'hi' message to trigger the agent to greet the user
    if (shouldTriggerResponse) {
      sendSimulatedUserMessage("hi");
    }
    return;
  };

  const handleSendTextMessage = () => {
    if (!userText.trim()) return;
    interrupt();

    try {
      sendUserText(userText.trim());
    } catch (err) {
      console.error("Failed to send via SDK", err);
    }

    setUserText("");
  };

  const handleTalkButtonDown = () => {
    if (sessionStatus !== "CONNECTED") return;
    interrupt();

    setIsPTTUserSpeaking(true);
    sendClientEvent({ type: "input_audio_buffer.clear" }, "clear PTT buffer");

    // No placeholder; we'll rely on server transcript once ready.
  };

  const handleTalkButtonUp = () => {
    if (sessionStatus !== "CONNECTED" || !isPTTUserSpeaking) return;

    setIsPTTUserSpeaking(false);
    sendClientEvent({ type: "input_audio_buffer.commit" }, "commit PTT");
    sendClientEvent({ type: "response.create" }, "trigger response PTT");
  };

  const onToggleConnection = () => {
    if (sessionStatus === "CONNECTED" || sessionStatus === "CONNECTING") {
      disconnectFromRealtime(); // This already sets status to DISCONNECTED
    } else {
      // Reset manual disconnect flag when user explicitly starts a new connection
      userManuallyDisconnectedRef.current = false;
      connectToRealtime();
    }
  };

  // Because we need a new connection, refresh the page when codec changes
  const handleCodecChange = (newCodec: string) => {
    const url = new URL(window.location.toString());
    url.searchParams.set("codec", newCodec);
    window.location.replace(url.toString());
  };

  useEffect(() => {
    const storedPushToTalkUI = localStorage.getItem("pushToTalkUI");
    if (storedPushToTalkUI) {
      setIsPTTActive(storedPushToTalkUI === "true");
    }
    const storedLogsExpanded = localStorage.getItem("logsExpanded");
    if (storedLogsExpanded) {
      setIsEventsPaneExpanded(storedLogsExpanded === "true");
    }
    // Audio playback is always enabled for roleplay sessions
  }, []);

  useEffect(() => {
    localStorage.setItem("pushToTalkUI", isPTTActive.toString());
  }, [isPTTActive]);

  useEffect(() => {
    localStorage.setItem("logsExpanded", isEventsPaneExpanded.toString());
  }, [isEventsPaneExpanded]);

  useEffect(() => {
    localStorage.setItem(
      "audioPlaybackEnabled",
      isAudioPlaybackEnabled.toString(),
    );
  }, [isAudioPlaybackEnabled]);

  useEffect(() => {
    if (audioElementRef.current) {
      if (isAudioPlaybackEnabled) {
        audioElementRef.current.muted = false;
        audioElementRef.current.play().catch((err) => {
          console.warn("Autoplay may be blocked by browser:", err);
        });
      } else {
        // Mute and pause to avoid brief audio blips before pause takes effect.
        audioElementRef.current.muted = true;
        audioElementRef.current.pause();
      }
    }

    // Toggle server-side audio stream mute so bandwidth is saved when the
    // user disables playback.
    try {
      mute(!isAudioPlaybackEnabled);
    } catch (err) {
      console.warn("Failed to toggle SDK mute", err);
    }
  }, [isAudioPlaybackEnabled]);

  // Ensure mute state is propagated to transport right after we connect or
  // whenever the SDK client reference becomes available.
  useEffect(() => {
    if (sessionStatus === "CONNECTED") {
      try {
        mute(!isAudioPlaybackEnabled);
      } catch (err) {
        console.warn("mute sync after connect failed", err);
      }
    }
  }, [sessionStatus, isAudioPlaybackEnabled]);

  useEffect(() => {
    if (sessionStatus === "CONNECTED" && audioElementRef.current?.srcObject) {
      // The remote audio stream from the audio element.
      const remoteStream = audioElementRef.current.srcObject as MediaStream;
      startRecording(remoteStream);
    }

    // Clean up on unmount or when sessionStatus is updated.
    return () => {
      stopRecording();
    };
  }, [sessionStatus]);

  // Cleanup effect - only disconnect on actual unmount, not on re-renders
  const isMountedRef = useRef(true);
  const currentPathRef = useRef(location.pathname);
  
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Only cleanup if the path actually changed (navigation away)
    if (currentPathRef.current !== location.pathname) {
      console.log("Path changed from", currentPathRef.current, "to", location.pathname);
      currentPathRef.current = location.pathname;
      
      // Clean up previous session when navigating away
      try {
        disconnect();
        stopRecording();
        setSessionStatus("DISCONNECTED");
        setIsPTTUserSpeaking(false);
      } catch (error) {
        console.error("Error during navigation cleanup:", error);
      }
    }
  }, [location.pathname]);
  if (isInitializing || isLoading) {
    return (
      <SidebarLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-brand-dark mb-2">
              Preparing Your Session...
            </h3>
          </div>
        </div>
      </SidebarLayout>
    );
  }
  console.log(scenario);
  return (
    <SidebarLayout>
      <div className="h-[calc(100vh-100px)] flex flex-col bg-gradient-to-b from-brand-dark via-[#0a3a5c] to-brand-dark rounded-2xl overflow-hidden">
        <Transcript
          avatar={avatarData}
          sessionStatus={sessionStatus}
          onToggleConnection={onToggleConnection}
          scenario={scenario}
          downloadRecording={downloadRecording}
          generateBlob={generateBlob}
          isAudioMuted={!isAudioPlaybackEnabled}
          onToggleAudioMute={() => setIsAudioPlaybackEnabled(prev => !prev)}
          interviewSession={interviewSession}
          currentPhaseIndex={currentPhaseIndex}
          onPhaseChange={setCurrentPhaseIndex}
          codingExercise={codingExercise}
          onCodeChange={handleCodeChange}
          onNotesChange={handleNotesChange}
          onCalculationChange={handleCalculationChange}
        />
      </div>
    </SidebarLayout>
  );
};

export interface TranscriptProps {
  avatar?: {
    id: string;
    name: string;
    imageUrl: string;
  };
  sessionStatus: SessionStatus;
  onToggleConnection: () => void;
  scenario: Record<string, any> | null;
  downloadRecording: () => void;
  generateBlob: () => Promise<Blob | null>;
  isAudioMuted: boolean;
  onToggleAudioMute: () => void;
  interviewSession?: InterviewSessionData | null;
  currentPhaseIndex: number;
  onPhaseChange: (index: number) => void;
  codingExercise?: CodingProblem | null;
  onCodeChange?: (code: string, language: SupportedLanguage) => void;
  onNotesChange?: (notes: string) => void;
  onCalculationChange?: (calculation: string) => void;
}

function Transcript({
  avatar,
  sessionStatus,
  onToggleConnection,
  scenario,
  downloadRecording,
  generateBlob,
  isAudioMuted,
  onToggleAudioMute,
  interviewSession,
  currentPhaseIndex,
  onPhaseChange,
  codingExercise,
  onCodeChange,
  onNotesChange,
  onCalculationChange,
}: TranscriptProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { transcriptItems } = useTranscript();
  const [searchParams] = useSearchParams();
  const avatarIdParam = searchParams.get("avatarId");
  const assignmentId = searchParams.get("assignmentId");
  const interviewSessionId = searchParams.get("interviewSessionId");
  const isInterviewMode = !!interviewSessionId;
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [prevLogs, setPrevLogs] = useState<TranscriptItem[]>([]);
  const [justCopied, setJustCopied] = useState(false);
  const [hasConnectedOnce, setHasConnectedOnce] = useState(false);

  // Timer state
  const parsedDuration = scenario?.duration ? parseInt(String(scenario.duration), 10) : 5;
  const [sessionDuration, setSessionDuration] = useState(isNaN(parsedDuration) ? 5 : parsedDuration);
  const [timeRemaining, setTimeRemaining] = useState(sessionDuration * 60); // in seconds
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isConnected = sessionStatus === "CONNECTED";
  const isConnecting = sessionStatus === "CONNECTING";

  const navigate = useNavigate();

  // Timer effect
  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && timerActive) {
      // Timer finished - auto save and disconnect
      setTimerActive(false);
      toast({
        title: "Session Ended",
        description: "Your 5-minute session has completed automatically.",
      });
      onSave();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timerActive, timeRemaining]);

  // Start timer when connected
  useEffect(() => {
    if (isConnected && !timerActive) {
      setTimerActive(true);
      setTimeRemaining(sessionDuration * 60);
    } else if (!isConnected) {
      setTimerActive(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }
  }, [isConnected, sessionDuration]);

  useEffect(() => {
    if (isConnected) {
      setHasConnectedOnce(true);
    }
  }, [isConnected]);

  // Sync duration when scenario loads asynchronously
  useEffect(() => {
    if (scenario?.duration) {
      const newDuration = parseInt(String(scenario.duration), 10);
      if (!isNaN(newDuration) && newDuration > 0) {
        setSessionDuration(newDuration);
        if (!timerActive) {
          setTimeRemaining(newDuration * 60);
        }
      }
    }
  }, [scenario?.duration]);

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Scroll to bottom on new message
  const scrollToBottom = () => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  };

  const uploadRecording = async (recordingBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("file", recordingBlob, `ai_roleplay_${Date.now()}.wav`);
      formData.append("type", "audio");
      formData.append("avatarId", avatar?.id);
      const response = await fetch("/api/avatar/upload-recording", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Upload response:", data);
      if (data.success) {
        console.log("Recording uploaded to:", data.fileUrl);
        return data.fileUrl;
      } else {
        console.error("Upload error:", data.error);
        return null;
      }
    } catch (error) {
      console.error("Error uploading recording:", error);
      return null;
    }
  };

  const uploadAudio = async () => {
    const blob = await generateBlob();
    console.log({ blob });
    if (!blob) return;

    return await uploadRecording(blob);
  };

  const onSave = async () => {
    try {
      setSaving(true);
      setTimerActive(false); // Stop timer when saving

      if (isConnected) {
        onToggleConnection();
      }
      const audioUrl = await uploadAudio();
      console.log({ audioUrl });

      const items = transcriptItems || [];
      const startTime = items[0]?.createdAtMs || 0;
      const endTime = items[items.length - 1]?.createdAtMs || 0;
      const duration = endTime && startTime ? Math.ceil((endTime - startTime) / 1000) : 0;
      const transcriptId = generateUniqueId("tr");

      const res = await fetch("/api/avatar/save-roleplay-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          transcriptId,
          avatarId: avatar?.id,
          duration,
          startTime,
          endTime,
          audioUrl,
        }),
      });

      const sessionData = await res.json();
      console.log("📝 Session saved successfully:", sessionData);
      const sessionId = sessionData?.session?.id;
      if (!sessionId) {
        console.log("📝 Session save failed:", sessionData);
        toast({
          title: "Failed to save session",
          description: "Please try again later.",
        });
        return;
      }
      const transcript = items.slice(1).map((t) => ({
        speaker: t?.role || 'unknown',
        timestamp: (t?.timestamp || '').substring(0, 8),
        createdAt: t?.createdAtMs || 0,
        text: t?.title || '',
      }));
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
      const sessionConfig = {
        personaLevel: personaOverlayLevel || null,
        personaOverlay: personaOverlayData || null,
      };

      const response = await fetch("/api/avatar/save-transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          sessionId,
          transcriptId,
          scenarioId: scenario?.id,
          avatarId: avatar?.id,
          duration,
          context: scenario?.context,
          instructions: scenario?.instructions,
          messages: transcript,
          sessionType: "audio_roleplay",
          sessionConfig,
        }),
      });

      if (response.ok) {
        console.log("Transcript saved successfully");
        
        // Handle Interview Custom sessions differently
        if (isInterviewMode && interviewSessionId) {
          try {
            console.log("[Interview] Calling interview analyze endpoint...");
            const analyzeResponse = await fetch(`/api/interview/session/${interviewSessionId}/analyze`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                transcript,
                transcriptId 
              }),
            });
            
            if (analyzeResponse.ok) {
              console.log("[Interview] Analysis created successfully");
              navigate(`/interview/results?sessionId=${interviewSessionId}`);
            } else {
              console.error("[Interview] Failed to create analysis");
              toast({
                title: "Analysis failed",
                description: "Could not analyze the interview. Please try again.",
              });
              // Still navigate to results page - it will show the error state
              navigate(`/interview/results?sessionId=${interviewSessionId}`);
            }
          } catch (error) {
            console.error("[Interview] Error calling analyze:", error);
            navigate(`/interview/results?sessionId=${interviewSessionId}`);
          }
          return;
        }
        
        try {
          // /recommended-scenario
          fetch("/api/avatar/recommended-scenario", {
            method: "PATCH",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              scenarioId: scenario?.id,
              userId: user?.id,
              assignmentId,
              isScenarioCompleted: true,
              transcriptId,
              sessionId,
            }),
          });
        } catch (error) {
          console.log("Failed to update recommended scenario", error);
        }
        // navigate(`/micro-assessment-assignments/${assignmentId}?show=report`)
        navigate(
          `/micro-assessment-session-analysis?sid=${sessionId}&tid=${transcriptId}&assignmentId=${assignmentId}&type=audio_roleplay`,
        );
        // navigate(
        //   `/avatar/session-analysis?sid=${sessionId}&tid=${transcriptId}&type=audio_roleplay`,
        // );
      } else {
        toast({
          title: "Failed to save session",
          description: "Please try again later.",
        });
        console.log("Failed to save transcript");
      }
    } catch (error) {
      console.log("error saving", error);
      toast({
        title: "Failed to save session",
        description: "Please try again later.",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const hasNewMessage = transcriptItems.length > prevLogs.length;
    const hasUpdatedMessage = transcriptItems.some((newItem, index) => {
      const oldItem = prevLogs[index];
      return (
        oldItem &&
        (newItem.title !== oldItem.title || newItem.data !== oldItem.data)
      );
    });

    if (hasNewMessage || hasUpdatedMessage) scrollToBottom();
    setPrevLogs(transcriptItems);
  }, [transcriptItems]);

  const handleCopyTranscript = async () => {
    if (!transcriptRef.current) return;
    try {
      await navigator.clipboard.writeText(transcriptRef.current.innerText);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy transcript:", error);
    }
  };

  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);
  
  const normalizePhase = (phase: any) => {
    const nameLower = phase.name?.toLowerCase() || "";
    const idLower = phase.id?.toLowerCase() || "";
    
    let inferredType = "general";
    if (idLower === "intro" || nameLower.includes("introduction") || nameLower.includes("rapport")) {
      inferredType = "warmup";
    } else if (idLower === "close" || nameLower.includes("closing") || nameLower.includes("wrap")) {
      inferredType = "wrap_up";
    } else if (nameLower.includes("coding") || nameLower.includes("problem solving")) {
      inferredType = "coding";
    } else if (nameLower.includes("case study") || nameLower.includes("case-study")) {
      inferredType = "case_study";
    } else if (nameLower.includes("behavioral") || nameLower.includes("cultural") || nameLower.includes("motivation")) {
      inferredType = "behavioral";
    } else if (nameLower.includes("technical") || nameLower.includes("skill") || nameLower.includes("domain")) {
      inferredType = "technical";
    }
    
    return {
      name: phase.name,
      duration: phase.durationMins || phase.duration || 5,
      objectives: phase.objective || phase.objectives || [],
      questionPatterns: phase.patternTypes || phase.questionPatterns || [],
      phaseType: phase.phaseType || inferredType,
    };
  };
  
  const interviewPlanForLayout = interviewSession?.plan ? {
    phases: (interviewSession.plan.phases || []).map(normalizePhase),
    focusAreas: interviewSession.plan.focusAreas || [],
    codingProblem: interviewSession.plan.codingProblem,
  } : null;

  const getTimerColor = () => {
    if (timeRemaining <= 60) return "text-red-400";
    if (timeRemaining <= 180) return "text-brand-accent";
    return "text-white/80";
  };

  const lastAgentMessage = (transcriptItems || [])
    .filter((item) => item.type === "MESSAGE" && item.role !== "user")
    .slice(-1)[0];

  const avatarContent = (
    <div className="flex-1 flex flex-col items-center justify-center relative bg-gradient-to-b from-brand-dark via-[#0a3a5c] to-brand-dark">
      {/* Scenario Info - Top */}
      <div className="absolute top-4 left-4 right-4 text-center">
        <p className="text-white/60 text-sm">
          {scenario?.name || "Practice Session"}
        </p>
        {scenario?.avatarRole && (
          <p className="text-white/40 text-xs mt-1">
            Speaking with: {scenario.avatarRole}
          </p>
        )}
      </div>
  
      {/* Avatar with Pulse Animation */}
      <div className="relative mb-6">
        {isConnected && (
          <>
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute -inset-4 rounded-full bg-emerald-500/10 animate-pulse" style={{ animationDuration: '1.5s' }} />
          </>
        )}
        {isConnecting && (
          <div className="absolute -inset-4 rounded-full bg-brand-accent/20 animate-pulse" />
        )}
        
        <div className={cn(
          "relative w-32 h-32 rounded-full overflow-hidden ring-4 transition-all duration-300",
          isConnected ? "ring-emerald-500 shadow-lg shadow-emerald-500/30" :
          isConnecting ? "ring-brand-accent shadow-lg shadow-brand-accent/30" :
          "ring-white/20"
        )}>
          {avatar?.imageUrl ? (
            <img
              src={avatar.imageUrl}
              alt={avatar.name || "Avatar"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-700 flex items-center justify-center">
              <User className="w-16 h-16 text-white/40" />
            </div>
          )}
        </div>
      </div>

      <h2 className="text-white text-2xl font-semibold mb-2">
        {avatar?.name || "AI Assistant"}
      </h2>

      <div className="flex items-center gap-2 mb-4">
        {isConnecting && (
          <>
            <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" />
            <span className="text-brand-accent text-sm">Connecting...</span>
          </>
        )}
        {isConnected && (
          <>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-sm">Connected</span>
          </>
        )}
        {!isConnected && !isConnecting && !hasConnectedOnce && (
          <span className="text-white/50 text-sm">Ready to connect</span>
        )}
        {!isConnected && !isConnecting && hasConnectedOnce && (
          <span className="text-white/50 text-sm">Call ended</span>
        )}
      </div>

      {timerActive && (
        <div className="flex items-center gap-3 mb-4">
          <div className={cn("text-3xl font-mono", getTimerColor())}>
            {formatTime(timeRemaining)}
          </div>
          {isConnected && timeRemaining > 0 && (
            <button
              onClick={() => setTimeRemaining(prev => prev + 60)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium transition-all",
                timeRemaining <= 60
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              )}
              title="Add 1 minute"
            >
              <Plus className="w-4 h-4" />
              <span>1 min</span>
            </button>
          )}
        </div>
      )}

      {isConnected && lastAgentMessage?.title && (
        <div className="max-w-md mx-auto px-6 py-3 bg-black/30 rounded-xl backdrop-blur-sm">
          <p className="text-white/80 text-center text-sm leading-relaxed">
            "{lastAgentMessage.title.length > 150 
              ? lastAgentMessage.title.slice(-150) + "..." 
              : lastAgentMessage.title}"
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Main Call Area - wrapped with InterviewSessionLayout for coding/case modes */}
      {isInterviewMode && interviewPlanForLayout ? (
        <InterviewSessionLayout
          plan={interviewPlanForLayout}
          currentPhaseIndex={currentPhaseIndex}
          className="flex-1"
          codingProblem={codingExercise || interviewSession?.plan?.codingProblem}
          onCodeChange={onCodeChange}
          onNotesChange={onNotesChange}
          onCalculationChange={onCalculationChange}
          onPhaseChange={onPhaseChange}
        >
          {avatarContent}
        </InterviewSessionLayout>
      ) : (
        avatarContent
      )}

      {/* Collapsible Transcript Panel */}
      <div className={cn(
        "bg-brand-dark/90 backdrop-blur-sm rounded-t-2xl transition-all duration-300 ease-in-out",
        isTranscriptExpanded ? "h-[40vh]" : "h-16"
      )}>
        {/* Transcript Header - Always Visible */}
        <button
          onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-white/80 hover:bg-slate-700/50 rounded-t-2xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Transcript</span>
            <span className="text-white/40 text-sm">
              ({transcriptItems.filter(i => i.type === "MESSAGE").length} messages)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasConnectedOnce && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handleCopyTranscript(); }}
                  className="p-2 hover:bg-slate-600/50 rounded-lg transition-colors"
                  title="Copy transcript"
                >
                  <Clipboard className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); downloadRecording(); }}
                  className="p-2 hover:bg-slate-600/50 rounded-lg transition-colors"
                  title="Download audio"
                >
                  <Download className="w-4 h-4" />
                </button>
              </>
            )}
            {isTranscriptExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
          </div>
        </button>

        {/* Transcript Content */}
        {isTranscriptExpanded && (
          <div
            ref={transcriptRef}
            className="overflow-auto px-4 pb-4 h-[calc(40vh-4rem)]"
          >
            {transcriptItems.length === 0 ? (
              <p className="text-white/40 text-center py-8 text-sm">
                Conversation will appear here...
              </p>
            ) : (
              <div className="space-y-3">
                {(transcriptItems || [])
                  .slice()
                  .sort((a, b) => (a?.createdAtMs || 0) - (b?.createdAtMs || 0))
                  .map((item) => {
                    if (!item || item.isHidden || item.type !== "MESSAGE") return null;
                    const isUser = item.role === "user";
                    const isBracketedMessage = item.title?.startsWith("[") && item.title?.endsWith("]");
                    const displayTitle = isBracketedMessage
                      ? (item.title || '').slice(1, -1)
                      : (item.title || '');

                    return (
                      <div
                        key={item.itemId}
                        className={cn(
                          "flex gap-2",
                          isUser ? "justify-end" : "justify-start"
                        )}
                      >
                        {!isUser && avatar?.imageUrl && (
                          <img
                            src={avatar.imageUrl}
                            alt={avatar.name || "avatar"}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        <div
                          className={cn(
                            "max-w-[70%] px-3 py-2 rounded-2xl text-sm",
                            isUser
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-slate-700 text-white/90 rounded-bl-sm",
                            isBracketedMessage && "italic text-white/60"
                          )}
                        >
                          <ReactMarkdown>{displayTitle}</ReactMarkdown>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Call Controls */}
      <div className="bg-slate-900/80 backdrop-blur-sm px-3 sm:px-6 py-3 sm:py-4 pb-safe">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          {/* Main Call Controls Row */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
            {/* Start Call - Before first connection */}
            {!isConnected && !isConnecting && !hasConnectedOnce && (
              <button
                onClick={onToggleConnection}
                disabled={saving}
                className="flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-medium bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/30 transition-all text-sm sm:text-base"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                Start Call
              </button>
            )}

            {/* Connecting State */}
            {isConnecting && (
              <button
                disabled
                className="flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-medium bg-blue-600 text-white cursor-not-allowed text-sm sm:text-base"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                Connecting...
              </button>
            )}

            {/* Audio Mute Toggle - While connected */}
            {isConnected && (
              <button
                onClick={onToggleAudioMute}
                className={cn(
                  "flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all flex-shrink-0",
                  isAudioMuted 
                    ? "bg-yellow-600 hover:bg-yellow-500 text-white" 
                    : "bg-slate-700 hover:bg-slate-600 text-white"
                )}
                title={isAudioMuted ? "Unmute speaker" : "Mute speaker"}
              >
                {isAudioMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            )}

            {/* End Call - While connected */}
            {isConnected && (
              <button
                onClick={onToggleConnection}
                disabled={saving}
                className="flex items-center gap-1.5 sm:gap-2 px-5 sm:px-8 py-2.5 sm:py-3 rounded-full font-medium bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all text-sm sm:text-base"
              >
                <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">End Call</span>
                <span className="sm:hidden">End</span>
              </button>
            )}

            {/* Reconnect - After disconnection */}
            {!isConnected && !isConnecting && hasConnectedOnce && (
              <button
                onClick={onToggleConnection}
                disabled={saving}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-medium bg-slate-700 hover:bg-slate-600 text-white transition-all text-sm sm:text-base"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                Reconnect
              </button>
            )}

            {/* Save and Exit - Available after first connection */}
            {hasConnectedOnce && !saving && (
              <Button
                onClick={onSave}
                disabled={saving}
                className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-8 py-2.5 sm:py-3 rounded-full font-medium bg-blue-600 hover:bg-blue-500 text-white text-sm sm:text-base h-auto"
              >
                <span className="hidden sm:inline">Save & View Analysis</span>
                <span className="sm:hidden">Save & View</span>
              </Button>
            )}

            {saving && (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <LoadingSpinner size="sm" />
                <span className="hidden sm:inline">Saving your session...</span>
                <span className="sm:hidden">Saving...</span>
              </div>
            )}
          </div>

          {/* Quick Actions Row - Always visible after first connection */}
          {hasConnectedOnce && (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleCopyTranscript}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-white/80 text-xs sm:text-sm transition-colors"
              >
                <Clipboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {justCopied ? "Copied!" : <><span className="hidden sm:inline">Copy Transcript</span><span className="sm:hidden">Copy</span></>}
              </button>
              <button
                onClick={downloadRecording}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-white/80 text-xs sm:text-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Download Audio</span>
                <span className="sm:hidden">Audio</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
