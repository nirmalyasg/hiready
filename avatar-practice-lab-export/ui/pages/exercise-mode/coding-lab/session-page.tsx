import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Code, Clock, Mic, MicOff, Play, Volume2, BarChart3, Eye, Bug, Wrench, Copy, Check, AlertCircle, Target } from "lucide-react";
import { TranscriptProvider, useTranscript } from '@/contexts/TranscriptContext';
import { EventProvider } from '@/contexts/EventContext';
import { useRealtimeSession } from '@/hooks/useRealtimeSession';
import { useHandleSessionHistory } from '@/hooks/useHandleSessionHistory';
import { RealtimeAgent } from '@openai/agents/realtime';
import { cn } from '@/lib/utils';

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
  failureModes: string[] | null;
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
    instruction: "Walk through this code and explain how it works, including design decisions and trade-offs."
  },
  debug: { 
    label: "Debug Code", 
    icon: Bug, 
    color: "text-red-400",
    bgColor: "bg-red-900/30",
    borderColor: "border-red-800",
    instruction: "Find the bug(s) in this code and explain how you would fix them."
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

function CodingLabSessionContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const exerciseId = searchParams.get("exerciseId");

  const [exercise, setExercise] = useState<CodingExercise | null>(null);
  const [session, setSession] = useState<ExerciseSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionPhase, setSessionPhase] = useState<"prep" | "active" | "complete">("prep");
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [interviewerMessage, setInterviewerMessage] = useState<string>("Take a look at this code and walk me through what it does. Start wherever you'd like.");

  const { transcriptItems } = useTranscript();

  const sdkAudioElement = useMemo(() => {
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
    const lastAssistantMessage = transcriptItems.filter(item => item.role === 'assistant').pop();
    if (lastAssistantMessage?.title) {
      setInterviewerMessage(lastAssistantMessage.title);
    }
  }, [transcriptItems]);

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
    
    if (sessionPhase === "active" && sessionStartTime) {
      interval = setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [sessionPhase, sessionStartTime]);

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

You are a senior technical interviewer conducting a ${config.label.toLowerCase()} exercise. Your role is to evaluate the candidate's code comprehension, debugging skills, and technical communication.

YOUR ROLE: Senior Technical Interviewer  
YOUR PERSONALITY: Thorough, encouraging, focused on understanding thought process and technical depth. Professional but conversational.

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
   - Start by asking them to take a look at the code and walk you through their analysis
   - Be friendly but professional

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

5. END OF SESSION:
   - When they've covered the main points, wrap up naturally
   - Thank them for their analysis
`.trim();
  }, [exercise]);

  const connectToRealtime = async () => {
    if (sessionStatus !== 'disconnected') return;
    
    setSessionStatus('connecting');
    console.log('[CodingLabSession] Starting connection...');
    
    try {
      const EPHEMERAL_KEY = await fetchEphemeralKey();
      if (!EPHEMERAL_KEY) {
        console.error('[CodingLabSession] No ephemeral key received');
        setSessionStatus('disconnected');
        return;
      }

      const systemPrompt = buildInterviewerContext();
      console.log('[CodingLabSession] System prompt built, length:', systemPrompt.length);
      
      const agent = new RealtimeAgent({
        name: 'coding_interviewer',
        voice: 'sage',
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
      setSessionPhase("active");
      
      const config = activityConfig[exercise?.activityType || 'explain'];
      
      if (!hasGreeted) {
        setTimeout(() => {
          sendUserText(`Greet the candidate and introduce the exercise. Say something like: "Hi! Thanks for joining. Today we're doing a ${config.label.toLowerCase()} exercise in ${exercise?.language || 'code'}. Take a look at the code on screen, and when you're ready, walk me through what you see." Keep it professional and under 40 words.`);
          setHasGreeted(true);
        }, 2000);
      }

    } catch (err) {
      console.error('[CodingLabSession] Error connecting:', err);
      setSessionStatus('disconnected');
    }
  };

  const disconnectFromRealtime = () => {
    disconnect();
    setSessionStatus('disconnected');
    setIsSpeaking(false);
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    mute(newMutedState);
  };

  const startSession = async () => {
    if (!exercise) return;
    
    try {
      const response = await fetch("/api/exercise-mode/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "coding",
          codingExerciseId: exercise.id,
          roleKitId: null
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSession(data.session);
        connectToRealtime();
      }
    } catch (err) {
      console.error("Error creating session:", err);
    }
  };

  const endSession = async () => {
    disconnectFromRealtime();
    setIsSaving(true);

    if (session?.id) {
      try {
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

        await fetch(`/api/exercise-mode/sessions/${session.id}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, sessionDuration })
        });
      } catch (err) {
        console.error("Error saving session:", err);
      }
    }

    setSessionPhase("complete");
    navigate(`/exercise-mode/coding-lab/results?exerciseId=${exercise?.id}&sessionId=${session?.id}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    return () => {
      disconnectFromRealtime();
      if (sdkAudioElement && sdkAudioElement.parentNode) {
        sdkAudioElement.parentNode.removeChild(sdkAudioElement);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Loading Exercise</h3>
          <p className="text-slate-400">Preparing your coding challenge...</p>
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

  if (sessionPhase === "prep") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-8">
            <Code className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold">Coding Lab Session</h1>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ActivityIcon className={`w-5 h-5 ${config.color}`} />
              <span className={`font-medium ${config.color}`}>{config.label}</span>
              <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300 ml-2">
                {exercise.language}
              </span>
              <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300 capitalize">
                {exercise.difficulty}
              </span>
            </div>
            <h2 className="text-xl font-semibold mb-2">{exercise.name}</h2>
            <p className="text-slate-300 mb-4">{config.instruction}</p>
            
            {exercise.activityType === "debug" && exercise.bugDescription && (
              <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-3 mb-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">Bug Report</span>
                </div>
                <p className="text-red-300 text-sm">{exercise.bugDescription}</p>
              </div>
            )}
            
            {exercise.activityType === "modify" && exercise.modificationRequirement && (
              <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-3 mb-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <Wrench className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Modification Requirement</span>
                </div>
                <p className="text-emerald-300 text-sm">{exercise.modificationRequirement}</p>
              </div>
            )}
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden mb-8">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-slate-700">
              <span className="text-sm text-slate-400">Code to review</span>
              <button 
                onClick={copyCode}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm max-h-80">
              <code className="text-slate-300">{exercise.codeSnippet}</code>
            </pre>
          </div>

          <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4 mb-8">
            <h3 className="font-medium text-blue-400 mb-2">How it works:</h3>
            <ol className="text-sm text-blue-200 space-y-2">
              <li>1. Review the code carefully before starting</li>
              <li>2. Speak your analysis out loud as you would in an interview</li>
              <li>3. The AI interviewer will ask follow-up questions</li>
              <li>4. End the session when done to receive your feedback</li>
            </ol>
          </div>

          <Button 
            onClick={startSession}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Session
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700 bg-slate-800/80">
        <div className="flex items-center gap-3">
          <ActivityIcon className={`w-5 h-5 ${config.color}`} />
          <span className="font-medium">{exercise.name}</span>
          <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">{exercise.language}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(sessionDuration)}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={endSession}
            className="border-red-600 text-red-400 hover:bg-red-900/30"
          >
            End Session
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-57px)]">
        <div className="flex-1 flex flex-col border-r border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">{exercise.language}</span>
              <span className={`text-xs ${config.color}`}>({config.label})</span>
            </div>
            <button 
              onClick={copyCode}
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-sm"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <pre className="flex-1 p-4 overflow-auto text-sm">
            <code className="text-slate-300">{exercise.codeSnippet}</code>
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
              <p className={`text-xs ${exercise.activityType === "debug" ? "text-red-300" : "text-emerald-300"}`}>
                {exercise.activityType === "debug" ? exercise.bugDescription : exercise.modificationRequirement}
              </p>
            </div>
          ) : null}
        </div>

        <div className="w-80 lg:w-96 flex flex-col bg-slate-800/30">
          <div className="p-4 border-b border-slate-700">
            <h3 className="font-medium text-slate-300 flex items-center gap-2 mb-3">
              <Volume2 className="w-4 h-4 text-blue-400" />
              AI Interviewer
              {isSpeaking && (
                <span className="ml-auto flex items-center gap-1">
                  <div className="w-1 h-2 bg-blue-400 rounded-full animate-pulse" />
                  <div className="w-1 h-3 bg-blue-400 rounded-full animate-pulse delay-75" />
                  <div className="w-1 h-2 bg-blue-400 rounded-full animate-pulse delay-150" />
                </span>
              )}
            </h3>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-slate-300 text-sm italic">"{interviewerMessage}"</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center p-6">
            <div className="text-center">
              <div className="mb-4">
                {sessionStatus === 'connected' && !isMuted && (
                  <span className="flex items-center justify-center gap-1 text-blue-400 text-sm mb-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    Listening...
                  </span>
                )}
              </div>
              
              <button
                onClick={toggleMute}
                disabled={sessionStatus !== 'connected'}
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center transition-all mx-auto",
                  sessionStatus !== 'connected' 
                    ? "bg-slate-700 cursor-not-allowed"
                    : isMuted 
                      ? "bg-red-600 hover:bg-red-700" 
                      : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {isMuted ? (
                  <MicOff className="w-10 h-10" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </button>
              
              <p className="text-slate-400 text-sm mt-4">
                {sessionStatus === 'connecting' 
                  ? "Connecting to interviewer..." 
                  : sessionStatus === 'connected'
                    ? (isMuted ? "Click to unmute" : "Click to start speaking")
                    : "Waiting for connection..."
                }
              </p>
            </div>
          </div>

          {exercise.expectedSignals && (
            <div className="p-4 border-t border-slate-700">
              <h3 className="font-medium text-slate-400 mb-2 text-sm flex items-center gap-2">
                <Target className="w-4 h-4" />
                Key Points
              </h3>
              <div className="flex flex-wrap gap-1">
                {exercise.expectedSignals.slice(0, 4).map((signal, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs">
                    {signal.length > 30 ? signal.substring(0, 30) + '...' : signal}
                  </span>
                ))}
              </div>
            </div>
          )}
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
