import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Code, Clock, Mic, MicOff, Users, PhoneOff, BarChart3, Volume2, User, Eye, Bug, Wrench, Copy, Check, AlertCircle, ChevronDown, ChevronUp, Play, ArrowLeft } from "lucide-react";
import MeetingLobby from '@/components/MeetingLobby';
import { TranscriptProvider, useTranscript } from '@/contexts/TranscriptContext';
import { EventProvider } from '@/contexts/EventContext';
import { useRealtimeSession } from '@/hooks/useRealtimeSession';
import { useHandleSessionHistory } from '@/hooks/useHandleSessionHistory';
import { RealtimeAgent } from '@openai/agents/realtime';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CodingExercise {
  id: number;
  name: string;
  activityType: "explain" | "debug" | "modify";
  language: string;
  difficulty: string;
  codeSnippet: string;
  expectedBehavior: string | null;
  bugDescription: string | null;
  modificationRequirement: string | null;
  probingQuestions: string[] | null;
  expectedSignals: string[] | null;
}

interface SelectedAvatar {
  id: string;
  name: string;
  gender: string;
  imageUrl: string;
  personality: string;
  role?: string;
}

interface ExerciseSession {
  id: number;
  sessionUid: string;
  status: string;
}

const activityConfig = {
  explain: { 
    label: "Explain Code", 
    icon: Eye, 
    color: "text-blue-400",
    bgColor: "bg-blue-900/30",
    borderColor: "border-blue-800",
    instruction: "Walk through this code and explain how it works."
  },
  debug: { 
    label: "Debug Code", 
    icon: Bug, 
    color: "text-red-400",
    bgColor: "bg-red-900/30",
    borderColor: "border-red-800",
    instruction: "Find the bug(s) in this code and explain how to fix them."
  },
  modify: { 
    label: "Modify Code", 
    icon: Wrench, 
    color: "text-emerald-400",
    bgColor: "bg-emerald-900/30",
    borderColor: "border-emerald-800",
    instruction: "Add the requested feature or modification to this code."
  }
};

const defaultAvatars: SelectedAvatar[] = [
  { 
    id: "Wayne_20240711", 
    name: "Wayne", 
    gender: "male",
    imageUrl: "https://files.heygen.ai/avatar/v3/Wayne_20240711/full_body.webp",
    personality: "thorough technical interviewer who probes for deep code understanding",
    role: "interviewer"
  },
];

function parseAvatarsFromUrl(avatarsParam: string | null): SelectedAvatar[] {
  if (!avatarsParam) return defaultAvatars;
  
  try {
    const parsed = JSON.parse(decodeURIComponent(avatarsParam));
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((a: any) => ({
        id: a.id || 'Wayne_20240711',
        name: a.name || 'Interviewer',
        gender: a.gender || 'male',
        imageUrl: a.imageUrl || `https://files.heygen.ai/avatar/v3/${a.id}/full_body.webp`,
        personality: a.personality || 'professional technical interviewer',
        role: a.role || 'interviewer'
      }));
    }
  } catch (e) {
    console.error('Failed to parse avatars:', e);
  }
  return defaultAvatars;
}

const voiceMap: Record<string, string> = {
  male: 'ash',
  female: 'sage',
};

function CodingLabSessionContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const exerciseId = searchParams.get("exerciseId");
  const avatarsParam = searchParams.get("avatars");

  const [exercise, setExercise] = useState<CodingExercise | null>(null);
  const [session, setSession] = useState<ExerciseSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreSession, setShowPreSession] = useState(true);
  const [showLobby, setShowLobby] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFullCode, setShowFullCode] = useState(true);

  const { toast } = useToast();
  const { transcriptItems } = useTranscript();

  const [selectedAvatars] = useState<SelectedAvatar[]>(() => parseAvatarsFromUrl(avatarsParam));

  const sdkAudioElement = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const el = document.createElement('audio');
    el.autoplay = true;
    el.style.display = 'none';
    document.body.appendChild(el);
    return el;
  }, []);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (sdkAudioElement && !audioElementRef.current) {
      audioElementRef.current = sdkAudioElement;
      sdkAudioElement.onplay = () => setIsSpeaking(true);
      sdkAudioElement.onpause = () => setIsSpeaking(false);
      sdkAudioElement.onended = () => setIsSpeaking(false);
    }
    return () => {
      if (sdkAudioElement) {
        sdkAudioElement.onplay = null;
        sdkAudioElement.onpause = null;
        sdkAudioElement.onended = null;
      }
    };
  }, [sdkAudioElement]);

  useHandleSessionHistory();

  const { connect, disconnect, sendUserText, mute, status } = useRealtimeSession({
    onConnectionChange: (s) => {
      console.log('[CodingLabSession] Connection status:', s);
      if (s === 'CONNECTED') {
        setSessionStatus('connected');
      } else if (s === 'CONNECTING') {
        setSessionStatus('connecting');
      } else {
        setSessionStatus('disconnected');
      }
    },
  });

  useEffect(() => {
    const fetchExercise = async () => {
      if (!exerciseId) {
        setError("No exercise selected");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/exercise-mode/coding-exercises/${exerciseId}`);
        const data = await response.json();
        
        if (data.success) {
          setExercise(data.exercise);
        } else {
          setError("Failed to load exercise");
        }
      } catch (err) {
        console.error("Error fetching exercise:", err);
        setError("Failed to load exercise");
      } finally {
        setIsLoading(false);
      }
    };
    fetchExercise();
  }, [exerciseId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (sessionStatus === 'connected' && sessionStartTime) {
      interval = setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [sessionStatus, sessionStartTime]);

  const fetchEphemeralKey = async () => {
    try {
      const response = await fetch('/api/realtime/token', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      console.log('[CodingLabSession] Token response:', data);
      if (data.success && data.token) {
        return data.token;
      }
    } catch (err) {
      console.error('[CodingLabSession] Error fetching ephemeral key:', err);
    }
    return null;
  };

  const copyCode = async () => {
    if (exercise?.codeSnippet) {
      await navigator.clipboard.writeText(exercise.codeSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const buildInterviewerContext = useCallback(() => {
    if (!exercise) return '';

    const config = activityConfig[exercise.activityType];
    const currentAvatar = selectedAvatars[0];
    
    const activitySpecificContext = exercise.activityType === 'debug' && exercise.bugDescription
      ? `\nBUG CONTEXT: The candidate has been told there's a bug. The bug is: ${exercise.bugDescription}\nDo NOT reveal the bug - let them find it.`
      : exercise.activityType === 'modify' && exercise.modificationRequirement
      ? `\nMODIFICATION REQUIREMENT: ${exercise.modificationRequirement}`
      : '';

    const expectedSignalsContext = exercise.expectedSignals
      ? `\nEXPECTED SIGNALS (what a strong candidate should mention):\n${exercise.expectedSignals.map(s => `- ${s}`).join('\n')}`
      : '';

    const probingQuestionsContext = exercise.probingQuestions
      ? `\nPROBING QUESTIONS TO ASK:\n${exercise.probingQuestions.map(q => `- "${q}"`).join('\n')}`
      : '';

    return `
CODING INTERVIEW SESSION - AI TECHNICAL INTERVIEWER

You are ${currentAvatar?.name || 'the interviewer'}, a senior technical interviewer evaluating a candidate's code comprehension, debugging skills, and technical communication.

YOUR ROLE: Senior Technical Interviewer
YOUR PERSONALITY: ${currentAvatar?.personality || 'thorough and systematic, focused on understanding code and technical reasoning'}

EXERCISE DETAILS:
- Type: ${config.label}
- Language: ${exercise.language}
- Difficulty: ${exercise.difficulty}
- Exercise: ${exercise.name}

TASK INSTRUCTION: ${config.instruction}

THE CODE:
\`\`\`${exercise.language}
${exercise.codeSnippet}
\`\`\`

${exercise.expectedBehavior ? `EXPECTED BEHAVIOR: ${exercise.expectedBehavior}` : ''}
${activitySpecificContext}
${expectedSignalsContext}

=== CRITICAL BEHAVIOR RULES ===

1. OPENING:
   - Introduce yourself briefly
   - Present the exercise: "I'm going to show you some ${exercise.language} code. ${config.instruction}"
   - Ask them to walk you through their analysis

2. INTERVIEWER BEHAVIOR:
   - Listen to their explanation carefully
   - Ask follow-up questions to probe deeper understanding
   - If they miss important points, guide them with questions (don't tell them the answer)
   - Acknowledge correct observations briefly before moving on
   - Keep the conversation technical but conversational

${probingQuestionsContext}

3. PROBING TECHNIQUES:
   - "What would happen if...?"
   - "Can you explain why you chose that approach?"
   - "What's the time/space complexity of this?"
   - "Are there any edge cases you're concerned about?"
   - "How would you test this?"

4. RESPONSE STYLE:
   - Keep responses concise (2-3 sentences typically)
   - Ask ONE question at a time
   - Be encouraging but don't give away answers
   - Push for specificity when answers are vague

5. INFORMATION ACCURACY:
   - ONLY reference the code shown above
   - Don't invent additional requirements or context
   - If they ask about something not specified, ask them to make reasonable assumptions

6. SESSION WRAP-UP:
   - When they've covered the main points, summarize their approach
   - Thank them for their analysis
`.trim();
  }, [exercise, selectedAvatars]);

  const connectToRealtime = async () => {
    if (sessionStatus !== 'disconnected') return;
    
    setSessionStatus('connecting');
    console.log('[CodingLabSession] Starting connection...');
    
    try {
      const EPHEMERAL_KEY = await fetchEphemeralKey();
      if (!EPHEMERAL_KEY) {
        console.error('[CodingLabSession] No ephemeral key received');
        setSessionStatus('disconnected');
        toast({
          title: "Connection Failed",
          description: "Could not connect to the AI interviewer. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const currentAvatar = selectedAvatars[0];
      const voice = voiceMap[currentAvatar?.gender?.toLowerCase() || 'male'] || 'ash';
      const systemPrompt = buildInterviewerContext();
      
      console.log('[CodingLabSession] System prompt built, length:', systemPrompt.length);
      
      const agent = new RealtimeAgent({
        name: `coding_interviewer_${currentAvatar?.name || 'interviewer'}`,
        voice: voice,
        instructions: systemPrompt,
        tools: [],
      });

      console.log('[CodingLabSession] Agent created, connecting...');

      await connect({
        getEphemeralKey: async () => EPHEMERAL_KEY,
        initialAgents: [agent],
        audioElement: sdkAudioElement,
      });

      console.log('[CodingLabSession] Connected successfully');
      setSessionStartTime(Date.now());
      
      const config = activityConfig[exercise?.activityType || 'explain'];
      
      if (!hasGreeted) {
        setTimeout(() => {
          sendUserText(`Greet the candidate and introduce the exercise. Say: "Hi! I'm ${currentAvatar?.name || 'your interviewer'} and I'll be conducting your technical interview today. I've got a ${exercise?.language || 'code'} ${config.label.toLowerCase()} exercise for you. Take a look at the code on your screen, and when you're ready, walk me through it." Keep it under 50 words.`);
          setHasGreeted(true);
        }, 2000);
      }

    } catch (err) {
      console.error('[CodingLabSession] Error connecting:', err);
      setSessionStatus('disconnected');
      toast({
        title: "Connection Error",
        description: "Failed to connect. Please try again.",
        variant: "destructive",
      });
    }
  };

  const disconnectFromRealtime = () => {
    disconnect();
    setSessionStatus('disconnected');
    setIsSpeaking(false);
  };

  const handleLobbyComplete = useCallback(async () => {
    setShowLobby(false);
    
    if (!exercise) return;
    
    try {
      const response = await fetch("/api/exercise-mode/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          exerciseType: "coding_lab",
          codingExerciseId: exercise.id,
          roleKitId: null
        })
      });
      
      const data = await response.json();
      console.log('[CodingLabSession] Session created:', data);
      if (data.success) {
        setSession(data.session);
      }
    } catch (err) {
      console.error("[CodingLabSession] Error creating session:", err);
    }
    
    setTimeout(() => {
      connectToRealtime();
    }, 500);
  }, [exercise]);

  const handleEndCall = async () => {
    if (isSaving) return;
    
    const confirmEnd = window.confirm('End this coding interview session?');
    if (!confirmEnd) return;
    
    setIsSaving(true);
    disconnectFromRealtime();

    try {
      if (session?.id) {
        await fetch(`/api/exercise-mode/sessions/${session.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" })
        });

        const transcript = transcriptItems.map(item => ({
          role: item.role,
          content: item.title || '',
          timestamp: Date.now()
        }));

        toast({
          title: "Analyzing your performance...",
          description: "Generating feedback based on your coding interview",
        });

        await fetch(`/api/exercise-mode/sessions/${session.id}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, sessionDuration })
        });
      }

      navigate(`/exercise-mode/coding-lab/results?sessionId=${session?.id}`);
    } catch (err) {
      console.error("[CodingLabSession] Error saving session:", err);
      navigate(`/exercise-mode/coding-lab/results?sessionId=${session?.id}`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartSession = () => {
    setShowPreSession(false);
    setShowLobby(true);
  };

  useEffect(() => {
    return () => {
      disconnectFromRealtime();
      if (sdkAudioElement && sdkAudioElement.parentNode) {
        sdkAudioElement.parentNode.removeChild(sdkAudioElement);
      }
    };
  }, []);

  const lobbyParticipants = selectedAvatars.map(a => ({
    id: a.id,
    name: a.name,
    imageUrl: a.imageUrl,
    status: 'connecting' as const
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Loading Exercise</h3>
          <p className="text-slate-400">Preparing your interview...</p>
        </div>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
            <BarChart3 className="absolute inset-0 m-auto w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Analyzing Your Performance</h3>
          <p className="text-slate-400 mb-4">
            Our AI is evaluating your code analysis, technical communication, and problem-solving approach...
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Generating personalized feedback</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
            <Code className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Session Error</h1>
          <p className="text-slate-400 mb-6">{error || 'Unable to load exercise'}</p>
          <Link to="/exercise-mode/coding-lab">
            <Button variant="outline" className="text-white border-white hover:bg-white/10">
              Back to Coding Lab
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const config = activityConfig[exercise.activityType];
  const ActivityIcon = config.icon;
  const currentAvatar = selectedAvatars[0];

  if (showPreSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        <div className="p-4 border-b border-slate-700/50">
          <button
            onClick={() => navigate('/exercise-mode/coding-lab')}
            className="text-slate-400 hover:text-white text-sm flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Coding Lab
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="w-full max-w-3xl">
            <div className="text-center mb-8">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${config.bgColor} flex items-center justify-center`}>
                <ActivityIcon className={`w-8 h-8 ${config.color}`} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">{exercise.name}</h1>
              <div className="flex items-center justify-center gap-3">
                <span className="text-xs px-3 py-1 rounded-full bg-slate-700 text-slate-300">{exercise.language}</span>
                <span className={`text-xs px-3 py-1 rounded-full ${config.bgColor} ${config.color}`}>{config.label}</span>
                <span className="text-xs px-3 py-1 rounded-full bg-slate-700 text-slate-300 capitalize">{exercise.difficulty}</span>
              </div>
            </div>

            <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden mb-6">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">Code to review</span>
                </div>
                <button
                  onClick={copyCode}
                  className="text-slate-400 hover:text-white flex items-center gap-1.5 text-sm transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="p-4 overflow-auto max-h-64 text-sm font-mono">
                <code className="text-slate-300 whitespace-pre">{exercise.codeSnippet}</code>
              </pre>
            </div>

            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5 mb-8">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400" />
                How it works:
              </h3>
              <ol className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span>Review the code carefully before starting</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span>Speak your analysis out loud as you would in an interview</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <span>The AI interviewer will ask follow-up questions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-xs flex-shrink-0">4</span>
                  <span>End the session when done to receive your feedback</span>
                </li>
              </ol>
            </div>

            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-3 mr-4">
                <img
                  src={currentAvatar.imageUrl}
                  alt={currentAvatar.name}
                  className="w-10 h-10 rounded-full border-2 border-slate-600 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${currentAvatar.name}&background=4a5568&color=fff`;
                  }}
                />
                <div className="text-sm">
                  <p className="text-white font-medium">{currentAvatar.name}</p>
                  <p className="text-slate-400 text-xs">Your interviewer</p>
                </div>
              </div>
              <Button
                onClick={handleStartSession}
                size="lg"
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-6 text-lg rounded-xl"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Session
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden relative">
      <MeetingLobby
        participants={lobbyParticipants}
        presentationTopic={exercise.name}
        onAllReady={handleLobbyComplete}
        isVisible={showLobby}
      />

      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full",
            sessionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
            sessionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
          )} />
          <span className={cn(
            "text-xs font-medium",
            sessionStatus === 'connected' ? 'text-green-400' : 
            sessionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'
          )}>
            {sessionStatus === 'connected' ? 'LIVE' : sessionStatus === 'connecting' ? 'CONNECTING...' : 'DISCONNECTED'}
          </span>
          <span className="text-slate-600">|</span>
          <ActivityIcon className={`w-4 h-4 ${config.color}`} />
          <span className="text-white text-sm font-medium truncate max-w-sm">{exercise.name}</span>
          <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">{exercise.language}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(sessionDuration)}
          </span>
          <span className="text-slate-400 text-xs flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            2 in meeting
          </span>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex flex-col p-4 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
            <div className="bg-slate-950 rounded-xl border border-slate-700 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400">{exercise.language}</span>
                  <span className={`text-xs ${config.color}`}>({config.label})</span>
                </div>
                <button 
                  onClick={copyCode}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-sm"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              
              <pre className="flex-1 p-4 overflow-auto text-sm font-mono">
                <code className="text-slate-300 whitespace-pre">{exercise.codeSnippet}</code>
              </pre>

              {(exercise.activityType === "debug" && exercise.bugDescription) || 
               (exercise.activityType === "modify" && exercise.modificationRequirement) ? (
                <div className={`${config.bgColor} border-t ${config.borderColor} p-3 flex-shrink-0`}>
                  <div className="flex items-center gap-2 mb-1">
                    {exercise.activityType === "debug" ? (
                      <>
                        <Bug className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-medium text-red-400">Bug Report</span>
                      </>
                    ) : (
                      <>
                        <Wrench className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-400">Requirement</span>
                      </>
                    )}
                  </div>
                  <p className={`text-sm ${exercise.activityType === "debug" ? "text-red-300" : "text-emerald-300"}`}>
                    {exercise.activityType === "debug" ? exercise.bugDescription : exercise.modificationRequirement}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-slate-850 border-t border-slate-700 flex-shrink-0 px-4 py-3" style={{ backgroundColor: '#1a2332' }}>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  mute(!isMuted);
                }}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                  isMuted 
                    ? 'bg-red-500 hover:bg-red-600 ring-2 ring-red-400/50' 
                    : 'bg-slate-600 hover:bg-slate-500'
                )}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
              </button>
              
              <button
                onClick={handleEndCall}
                className="h-12 px-6 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2 transition-colors"
                title="End interview"
              >
                <PhoneOff className="w-5 h-5 text-white" />
                <span className="text-white font-medium">End Interview</span>
              </button>
            </div>
          </div>
        </div>

        <div className="w-80 bg-slate-800/95 border-l border-slate-700 flex flex-col min-h-0">
          <div className="p-3 border-b border-slate-700 flex-shrink-0">
            <h3 className="text-white text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Participants
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">You</span>
                    <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-medium">
                      CANDIDATE
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">Technical Interview</p>
                </div>
              </div>
            </div>

            <div className={cn(
              "rounded-xl p-3 transition-all",
              isSpeaking 
                ? 'bg-slate-700/80 ring-2 ring-green-400 shadow-lg shadow-green-500/20' 
                : 'bg-slate-700/40'
            )}>
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <div className={cn(
                    "w-14 h-14 rounded-xl overflow-hidden",
                    isSpeaking && "ring-2 ring-green-500"
                  )}>
                    <img
                      src={currentAvatar.imageUrl}
                      alt={currentAvatar.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${currentAvatar.name}&background=4a5568&color=fff`;
                      }}
                    />
                  </div>
                  
                  {isSpeaking && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                      <Volume2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{currentAvatar.name}</span>
                    <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded font-medium">
                      INTERVIEWER
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">
                    {currentAvatar.personality}
                  </p>
                  {isSpeaking && (
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-1 h-2 bg-green-400 rounded-full animate-pulse" />
                      <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse delay-75" />
                      <div className="w-1 h-2 bg-green-400 rounded-full animate-pulse delay-150" />
                      <span className="text-green-400 text-xs ml-1">Speaking</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-slate-700">
            <div className="bg-slate-900/50 rounded-lg p-3">
              <h4 className="text-slate-400 text-xs font-medium mb-2 flex items-center gap-1">
                <Volume2 className="w-3 h-3" />
                Recent
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {transcriptItems.slice(-3).map((item, i) => (
                  <p key={i} className={cn(
                    "text-xs leading-relaxed",
                    item.role === 'user' ? 'text-blue-300' : 'text-slate-300'
                  )}>
                    <span className="font-medium">{item.role === 'user' ? 'You: ' : `${currentAvatar.name}: `}</span>
                    {(item.title || '').slice(0, 80)}{(item.title || '').length > 80 ? '...' : ''}
                  </p>
                ))}
                {transcriptItems.length === 0 && (
                  <p className="text-slate-500 text-xs italic">Waiting for conversation to start...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CodingLabSessionPage() {
  return (
    <TranscriptProvider>
      <EventProvider>
        <CodingLabSessionContent />
      </EventProvider>
    </TranscriptProvider>
  );
}
