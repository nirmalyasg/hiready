import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Briefcase, Clock, Mic, MicOff, Brain, Play, Target, ListChecks, Volume2, BarChart3 } from "lucide-react";
import { TranscriptProvider, useTranscript } from '@/contexts/TranscriptContext';
import { EventProvider } from '@/contexts/EventContext';
import { useRealtimeSession } from '@/hooks/useRealtimeSession';
import { useHandleSessionHistory } from '@/hooks/useHandleSessionHistory';
import { RealtimeAgent } from '@openai/agents/realtime';
import { cn } from '@/lib/utils';

interface CaseTemplate {
  id: number;
  name: string;
  caseType: string;
  difficulty: string;
  promptStatement: string;
  context: string | null;
  evaluationFocus: string[] | null;
  probingMap: {
    ifVague: string[];
    ifWrong: string[];
    ifStrong: string[];
  } | null;
  expectedDurationMinutes: number | null;
}

interface ExerciseSession {
  id: number;
  sessionUid: string;
  status: string;
}

const voiceMap: Record<string, string> = {
  male: 'ash',
  female: 'sage',
};

function CaseStudySessionContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("templateId");

  const [template, setTemplate] = useState<CaseTemplate | null>(null);
  const [session, setSession] = useState<ExerciseSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionPhase, setSessionPhase] = useState<"prep" | "thinking" | "active" | "complete">("prep");
  const [thinkingTimeRemaining, setThinkingTimeRemaining] = useState(60);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [interviewerMessage, setInterviewerMessage] = useState<string>("Walk me through how you would approach this problem. What's your initial framework?");

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
      console.log('[CaseStudySession] Connection status:', s);
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
    const fetchTemplate = async () => {
      if (!templateId) {
        setError("No template selected");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/exercise-mode/case-templates/${templateId}`);
        const data = await response.json();
        
        if (data.success) {
          setTemplate(data.template);
        } else {
          setError("Failed to load template");
        }
      } catch (err) {
        console.error("Error fetching template:", err);
        setError("Failed to load template");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplate();
  }, [templateId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (sessionPhase === "thinking" && thinkingTimeRemaining > 0) {
      interval = setInterval(() => {
        setThinkingTimeRemaining(prev => {
          if (prev <= 1) {
            connectToRealtime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    if (sessionPhase === "active" && sessionStartTime) {
      interval = setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [sessionPhase, thinkingTimeRemaining, sessionStartTime]);

  const fetchEphemeralKey = async () => {
    try {
      const response = await fetch('/api/realtime/token', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      console.log('[CaseStudySession] Token response:', data);
      if (data.success && data.token) {
        return data.token;
      }
    } catch (err) {
      console.error('[CaseStudySession] Error fetching ephemeral key:', err);
    }
    return null;
  };

  const buildInterviewerContext = useCallback(() => {
    if (!template) return '';

    const probingInstructions = template.probingMap ? `
PROBING BEHAVIOR:
When candidate gives a VAGUE answer (unclear, lacks structure, too general):
${template.probingMap.ifVague.map(p => `- "${p}"`).join('\n')}

When candidate gives a WRONG or FLAWED answer (incorrect assumptions, missed key factors):
${template.probingMap.ifWrong.map(p => `- "${p}"`).join('\n')}

When candidate gives a STRONG answer (well-structured, insightful):
${template.probingMap.ifStrong.map(p => `- "${p}"`).join('\n')}
` : '';

    const evaluationContext = template.evaluationFocus 
      ? `\nEVALUATION FOCUS: ${template.evaluationFocus.join(', ')}`
      : '';

    return `
CASE INTERVIEW SESSION - AI INTERVIEWER

You are a senior case interviewer conducting a structured case interview. Your role is to evaluate the candidate's problem-solving approach, structured thinking, and business acumen.

YOUR ROLE: Senior Case Interviewer
YOUR PERSONALITY: Analytical, probing, focused on structured thinking and business acumen. Professional but conversational.

CASE DETAILS:
- Type: ${template.caseType}
- Difficulty: ${template.difficulty}
- Topic: ${template.name}

CASE PROMPT: ${template.promptStatement}

${template.context ? `CONTEXT & DATA:\n${template.context}` : ''}
${evaluationContext}

=== CRITICAL BEHAVIOR RULES ===

1. OPENING:
   - Start by briefly asking the candidate to walk you through their approach
   - Be professional but conversational

2. INTERVIEWER BEHAVIOR:
   - Listen actively to the candidate's responses
   - Ask probing follow-up questions based on their answers
   - Push back gently when reasoning is unclear or flawed
   - Acknowledge good points briefly before moving to the next question
   - Keep the conversation focused on the case

${probingInstructions}

3. PACING:
   - Don't rush the candidate, but keep the session moving
   - Allow them to think, but ask clarifying questions if they go silent too long
   - Aim for a natural conversational flow

4. RESPONSE STYLE:
   - Keep your responses concise (2-3 sentences typically)
   - Be direct but not harsh
   - Ask ONE question at a time
   - Never reveal the "correct" answer - let them discover it

5. END OF SESSION:
   - When the candidate seems to have covered the main points, wrap up naturally
   - Thank them for their analysis
`.trim();
  }, [template]);

  const connectToRealtime = async () => {
    if (sessionStatus !== 'disconnected') return;
    
    setSessionStatus('connecting');
    console.log('[CaseStudySession] Starting connection...');
    
    try {
      const EPHEMERAL_KEY = await fetchEphemeralKey();
      if (!EPHEMERAL_KEY) {
        console.error('[CaseStudySession] No ephemeral key received');
        setSessionStatus('disconnected');
        return;
      }

      const systemPrompt = buildInterviewerContext();
      console.log('[CaseStudySession] System prompt built, length:', systemPrompt.length);
      
      const agent = new RealtimeAgent({
        name: 'case_interviewer',
        voice: 'ash',
        instructions: systemPrompt,
        tools: [],
      });

      console.log('[CaseStudySession] Agent created, connecting...');

      await connect({
        getEphemeralKey: async () => EPHEMERAL_KEY,
        initialAgents: [agent],
        audioElement: sdkAudioElement,
      });

      console.log('[CaseStudySession] Connected successfully');
      setSessionStartTime(Date.now());
      setSessionPhase("active");
      
      if (!hasGreeted) {
        setTimeout(() => {
          sendUserText(`Greet the candidate and introduce the case. Say something like: "Welcome to your case interview. Today we'll be working on ${template?.name || 'this case'}. Let me share the context: ${template?.promptStatement || 'the scenario'}. Take a moment to think, then walk me through your approach." Keep it professional and under 50 words.`);
          setHasGreeted(true);
        }, 2000);
      }

    } catch (err) {
      console.error('[CaseStudySession] Error connecting:', err);
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
    if (!template) return;
    
    try {
      const response = await fetch("/api/exercise-mode/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "case_study",
          caseTemplateId: template.id,
          roleKitId: null
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSession(data.session);
        setSessionPhase("thinking");
      }
    } catch (err) {
      console.error("Error creating session:", err);
    }
  };

  const skipThinkingTime = () => {
    setThinkingTimeRemaining(0);
    connectToRealtime();
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
    navigate(`/exercise-mode/case-study/results?sessionId=${session?.id}`);
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
          <h3 className="text-lg font-semibold mb-2">Loading Case</h3>
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
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"></div>
            <BarChart3 className="absolute inset-0 m-auto w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Analyzing Your Performance</h3>
          <p className="text-slate-400 mb-4">
            Our AI is evaluating your structured thinking, business acumen, and problem-solving approach...
          </p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Session Error</h1>
          <p className="text-slate-400 mb-6">{error || 'Unable to load case template'}</p>
          <Link to="/exercise-mode/case-study">
            <Button variant="outline" className="text-white border-white hover:bg-white/10">
              Back to Case Study
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (sessionPhase === "prep") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-8">
            <Briefcase className="w-8 h-8 text-emerald-400" />
            <h1 className="text-2xl font-bold">Case Study Interview</h1>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">{template.name}</h2>
            <p className="text-slate-300 mb-6">{template.promptStatement}</p>
            
            {template.context && (
              <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Context & Data</h3>
                <p className="text-slate-300 text-sm whitespace-pre-line">{template.context}</p>
              </div>
            )}

            {template.evaluationFocus && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-400 mb-2">You'll be evaluated on:</h3>
                <div className="flex flex-wrap gap-2">
                  {template.evaluationFocus.map((focus, i) => (
                    <span key={i} className="px-3 py-1 bg-emerald-900/30 text-emerald-400 rounded-full text-sm">
                      {focus}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{template.expectedDurationMinutes || 15} minutes</span>
              </div>
              <div className="flex items-center gap-1">
                <Brain className="w-4 h-4" />
                <span>1 minute thinking time</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4 mb-8">
            <h3 className="font-medium text-blue-400 mb-2">How it works:</h3>
            <ol className="text-sm text-blue-200 space-y-2">
              <li>1. Read the case prompt carefully</li>
              <li>2. You'll have 60 seconds of thinking time to structure your approach</li>
              <li>3. Present your analysis verbally - the AI interviewer will ask follow-ups</li>
              <li>4. End the session when done to receive your feedback</li>
            </ol>
          </div>

          <Button 
            onClick={startSession}
            size="lg"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Session
          </Button>
        </div>
      </div>
    );
  }

  if (sessionPhase === "thinking") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center max-w-xl px-6">
          <Brain className="w-16 h-16 text-blue-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Thinking Time</h2>
          <p className="text-slate-300 mb-8">
            Take this time to structure your approach. The interviewer will begin when the timer ends.
          </p>
          
          <div className="text-6xl font-mono font-bold text-blue-400 mb-8">
            {formatTime(thinkingTimeRemaining)}
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 mb-8 text-left">
            <h3 className="font-medium mb-2">Prompt:</h3>
            <p className="text-slate-300 text-sm">{template.promptStatement}</p>
          </div>

          <Button 
            variant="outline" 
            onClick={skipThinkingTime}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Skip & Start Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700 bg-slate-800/80">
        <div className="flex items-center gap-3">
          <Briefcase className="w-5 h-5 text-emerald-400" />
          <span className="font-medium">{template.name}</span>
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
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 mb-6">
            <h3 className="text-emerald-400 font-medium mb-3">Case Prompt</h3>
            <p className="text-slate-200 text-lg leading-relaxed">{template.promptStatement}</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 font-medium">Your Response</h3>
              {sessionStatus === 'connected' && !isMuted && (
                <span className="flex items-center gap-1 text-emerald-400 text-sm">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Listening...
                </span>
              )}
            </div>
            
            <div className="flex justify-center py-8">
              <button
                onClick={toggleMute}
                disabled={sessionStatus !== 'connected'}
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center transition-all",
                  sessionStatus !== 'connected' 
                    ? "bg-slate-700 cursor-not-allowed"
                    : isMuted 
                      ? "bg-red-600 hover:bg-red-700" 
                      : "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                {isMuted ? (
                  <MicOff className="w-10 h-10" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </button>
            </div>
            
            <p className="text-center text-slate-400 text-sm">
              {sessionStatus === 'connecting' 
                ? "Connecting to interviewer..." 
                : sessionStatus === 'connected'
                  ? (isMuted ? "Click to unmute" : "Click to start speaking")
                  : "Waiting for connection..."
              }
            </p>
          </div>
        </div>

        <div className="w-80 lg:w-96 border-l border-slate-700 bg-slate-800/30 flex flex-col">
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

          {template.context && (
            <div className="p-4 border-b border-slate-700">
              <h3 className="font-medium text-slate-400 mb-2 text-sm flex items-center gap-2">
                <ListChecks className="w-4 h-4" />
                Context
              </h3>
              <div className="text-slate-400 text-xs space-y-1 max-h-32 overflow-y-auto">
                <p className="font-medium text-slate-300 mb-1">Key facts:</p>
                {template.context.split('\n').filter(line => line.trim()).slice(0, 6).map((line, i) => (
                  <p key={i}>- {line.trim()}</p>
                ))}
              </div>
            </div>
          )}

          {template.evaluationFocus && (
            <div className="p-4">
              <h3 className="font-medium text-slate-400 mb-2 text-sm flex items-center gap-2">
                <Target className="w-4 h-4" />
                Focus Areas
              </h3>
              <div className="flex flex-wrap gap-1">
                {template.evaluationFocus.map((focus, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs">
                    {focus}
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

export default function CaseStudySessionPage() {
  return (
    <TranscriptProvider>
      <EventProvider>
        <CaseStudySessionContent />
      </EventProvider>
    </TranscriptProvider>
  );
}
