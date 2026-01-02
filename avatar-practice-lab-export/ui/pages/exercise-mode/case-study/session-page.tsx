import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Briefcase, Clock, Mic, MicOff, Users, PhoneOff, BarChart3, Volume2, User, Brain, Target, ChevronDown, ChevronUp } from "lucide-react";
import MeetingLobby from '@/components/MeetingLobby';
import { TranscriptProvider, useTranscript } from '@/contexts/TranscriptContext';
import { EventProvider } from '@/contexts/EventContext';
import { useRealtimeSession } from '@/hooks/useRealtimeSession';
import { useHandleSessionHistory } from '@/hooks/useHandleSessionHistory';
import { RealtimeAgent } from '@openai/agents/realtime';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CaseTemplate {
  id: number;
  name: string;
  caseType: string;
  difficulty: string;
  promptStatement: string;
  context: string | null;
  evaluationFocus: string[] | null;
  expectedDurationMinutes: number | null;
  probingMap: Record<string, any> | null;
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

const defaultAvatars: SelectedAvatar[] = [
  { 
    id: "Wayne_20240711", 
    name: "Wayne", 
    gender: "male",
    imageUrl: "https://files.heygen.ai/avatar/v3/Wayne_20240711/full_body.webp",
    personality: "analytical and detail-oriented case interviewer who probes for structured thinking",
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
        personality: a.personality || 'professional case interviewer',
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

function CaseStudySessionContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("templateId");
  const avatarsParam = searchParams.get("avatars");

  const [template, setTemplate] = useState<CaseTemplate | null>(null);
  const [session, setSession] = useState<ExerciseSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLobby, setShowLobby] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  
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
    const fetchTemplate = async () => {
      if (!templateId) {
        setError("No case selected");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/exercise-mode/case-templates/${templateId}`);
        const data = await response.json();
        
        if (data.success) {
          setTemplate(data.template);
        } else {
          setError("Failed to load case");
        }
      } catch (err) {
        console.error("Error fetching template:", err);
        setError("Failed to load case");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplate();
  }, [templateId]);

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
    
    const currentAvatar = selectedAvatars[0];
    
    const probingContext = template.probingMap 
      ? `\nPROBING STRATEGIES:
- If candidate is vague: ${template.probingMap.ifVague || 'Ask for specifics and structure'}
- If candidate makes errors: ${template.probingMap.ifWrong || 'Gently redirect with questions'}
- If candidate is strong: ${template.probingMap.ifStrong || 'Push for deeper insights'}`
      : '';
    
    return `
CASE INTERVIEW SESSION - AI CASE INTERVIEWER

You are ${currentAvatar?.name || 'the interviewer'}, a senior case interviewer evaluating a candidate's problem-solving abilities. Your role is to present the case, ask probing questions, and assess their structured thinking.

YOUR ROLE: Senior Case Interviewer
YOUR PERSONALITY: ${currentAvatar?.personality || 'analytical and thorough, focused on structured problem-solving'}

CASE DETAILS:
- Name: ${template.name}
- Type: ${template.caseType.replace('_', ' ')}
- Difficulty: ${template.difficulty}
${template.context ? `- Business Context: ${template.context}` : ''}

THE CASE PROMPT:
"${template.promptStatement}"

${template.evaluationFocus ? `EVALUATION FOCUS:
${template.evaluationFocus.map(f => `- ${f}`).join('\n')}` : ''}

${probingContext}

=== CRITICAL BEHAVIOR RULES ===

1. OPENING:
   - Start by introducing yourself briefly
   - Present the case prompt clearly
   - Ask the candidate to walk you through their approach
   - Give them a moment to think before pressing for answers

2. INTERVIEWER BEHAVIOR:
   - Listen carefully to their structure and logic
   - Ask ONE probing question at a time
   - Challenge assumptions with follow-up questions
   - If they go off-track, redirect with guiding questions
   - Acknowledge good points briefly before moving forward
   - Push for specifics when answers are too vague

3. PROBING TECHNIQUES:
   - "Why did you choose that approach?"
   - "What assumptions are you making?"
   - "How would you size that market?"
   - "What are the risks of that recommendation?"
   - "What data would you need to validate that?"
   - "Can you walk me through the math?"

4. RESPONSE STYLE:
   - Keep responses concise (2-3 sentences typically)
   - Be professional but conversational
   - Show genuine interest in their thinking process
   - Don't give away answers - let them work through it

5. INFORMATION ACCURACY:
   - ONLY use information from the case prompt above
   - If the candidate asks for data you don't have, say "Let's assume..." or ask them to estimate
   - NEVER invent specific company names, numbers, or facts not in the prompt

6. SESSION WRAP-UP:
   - When they've covered key points, ask for their final recommendation
   - Thank them for their analysis when they're done
`.trim();
  }, [template, selectedAvatars]);

  const connectToRealtime = async () => {
    if (sessionStatus !== 'disconnected') return;
    
    setSessionStatus('connecting');
    console.log('[CaseStudySession] Starting connection...');
    
    try {
      const EPHEMERAL_KEY = await fetchEphemeralKey();
      if (!EPHEMERAL_KEY) {
        console.error('[CaseStudySession] No ephemeral key received');
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
      
      console.log('[CaseStudySession] System prompt built, length:', systemPrompt.length);
      
      const agent = new RealtimeAgent({
        name: `case_interviewer_${currentAvatar?.name || 'interviewer'}`,
        voice: voice,
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
      
      if (!hasGreeted) {
        setTimeout(() => {
          sendUserText(`Greet the candidate and introduce the case. Say: "Hello! I'm ${currentAvatar?.name || 'your interviewer'} and I'll be conducting your case interview today. Let me share the case with you: ${template?.promptStatement || 'the scenario'}. Take a moment to gather your thoughts, and when you're ready, walk me through your approach." Keep it professional and under 60 words.`);
          setHasGreeted(true);
        }, 2000);
      }

    } catch (err) {
      console.error('[CaseStudySession] Error connecting:', err);
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
    
    if (!template) return;
    
    try {
      const response = await fetch("/api/exercise-mode/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          exerciseType: "case_study",
          caseTemplateId: template.id,
          roleKitId: null
        })
      });
      
      const data = await response.json();
      console.log('[CaseStudySession] Session created:', data);
      if (data.success) {
        setSession(data.session);
      }
    } catch (err) {
      console.error("[CaseStudySession] Error creating session:", err);
    }
    
    setTimeout(() => {
      connectToRealtime();
    }, 500);
  }, [template]);

  const handleEndCall = async () => {
    if (isSaving) return;
    
    const confirmEnd = window.confirm('End this case interview session?');
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
          description: "Generating feedback based on your case interview",
        });

        await fetch(`/api/exercise-mode/sessions/${session.id}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, sessionDuration })
        });
      }

      navigate(`/exercise-mode/case-study/results?sessionId=${session?.id}`);
    } catch (err) {
      console.error("[CaseStudySession] Error saving session:", err);
      navigate(`/exercise-mode/case-study/results?sessionId=${session?.id}`);
    }
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
            Our AI is evaluating your structured thinking, problem-solving approach, and communication...
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span>Generating personalized feedback</span>
          </div>
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
          <p className="text-slate-400 mb-6">{error || 'Unable to load case'}</p>
          <Link to="/exercise-mode/case-study">
            <Button variant="outline" className="text-white border-white hover:bg-white/10">
              Back to Case Study
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentAvatar = selectedAvatars[0];

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden relative">
      <MeetingLobby
        participants={lobbyParticipants}
        presentationTopic={template.name}
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
          <Briefcase className="w-4 h-4 text-emerald-400" />
          <span className="text-white text-sm font-medium truncate max-w-sm">{template.name}</span>
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
          <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-slate-800 to-slate-900">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-600 uppercase tracking-wide">
                  {template.caseType.replace('_', ' ')}
                </span>
                <span className={cn(
                  "ml-2 px-2 py-0.5 rounded text-xs font-medium capitalize",
                  template.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                  template.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                )}>
                  {template.difficulty}
                </span>
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-4">{template.name}</h2>
              
              <div className="bg-slate-50 rounded-xl p-5 mb-4">
                <p className={cn(
                  "text-slate-700 leading-relaxed",
                  !showFullPrompt && template.promptStatement.length > 300 && "line-clamp-4"
                )}>
                  {template.promptStatement}
                </p>
                {template.promptStatement.length > 300 && (
                  <button 
                    onClick={() => setShowFullPrompt(!showFullPrompt)}
                    className="text-emerald-600 text-sm mt-2 flex items-center gap-1 hover:underline"
                  >
                    {showFullPrompt ? (
                      <>Show Less <ChevronUp className="w-4 h-4" /></>
                    ) : (
                      <>Read More <ChevronDown className="w-4 h-4" /></>
                    )}
                  </button>
                )}
              </div>

              {template.evaluationFocus && template.evaluationFocus.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {template.evaluationFocus.map((focus, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm">
                      <Target className="w-3 h-3" />
                      {focus}
                    </span>
                  ))}
                </div>
              )}
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
              <Users className="w-4 h-4 text-emerald-400" />
              Participants
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">You</span>
                    <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-medium">
                      CANDIDATE
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">Case Interview</p>
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
                    <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-medium">
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
                    item.role === 'user' ? 'text-emerald-300' : 'text-slate-300'
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

export default function CaseStudySessionPage() {
  return (
    <TranscriptProvider>
      <EventProvider>
        <CaseStudySessionContent />
      </EventProvider>
    </TranscriptProvider>
  );
}
