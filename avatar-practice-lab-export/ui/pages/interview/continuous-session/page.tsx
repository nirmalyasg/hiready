import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Clock, Mic, MicOff, PhoneOff, Volume2, AlertCircle, Code, Briefcase, PanelRightOpen } from "lucide-react";
import { TranscriptProvider, useTranscript } from '@/contexts/TranscriptContext';
import { EventProvider } from '@/contexts/EventContext';
import { InterviewEventBusProvider, useInterviewEventBus, CodingChallenge, CaseStudyChallenge } from '@/contexts/InterviewEventBusContext';
import { useRealtimeSession } from '@/hooks/useRealtimeSession';
import { useHandleSessionHistory } from '@/hooks/useHandleSessionHistory';
import { InlineCodingPanel } from '@/components/interview/InlineCodingPanel';
import { InlineCaseStudyPanel } from '@/components/interview/InlineCaseStudyPanel';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { RealtimeAgent } from '@openai/agents/realtime';

interface InterviewSession {
  id: number;
  status: string;
  plan?: {
    phases?: any[];
    focusAreas?: string[];
    codingProblem?: any;
    caseStudy?: any;
    interviewerTone?: string;
    keyQuestions?: string[];
  };
}

interface InterviewConfig {
  id: number;
  interviewType: string;
  style: string;
  seniority: string;
}

interface SelectedAvatar {
  id: string;
  name: string;
  gender: string;
  imageUrl: string;
  personality?: string;
}

const defaultAvatar: SelectedAvatar = {
  id: "Wayne_20240711",
  name: "Wayne",
  gender: "male",
  imageUrl: "https://files2.heygen.ai/avatar/v3/a3fdb0c652024f79984aaec11ebf2694_34350/preview_target.webp",
  personality: "professional technical interviewer"
};

const voiceMap: Record<string, string> = {
  male: 'ash',
  female: 'sage',
};

function ContinuousSessionContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const interviewSessionId = searchParams.get("interviewSessionId");
  const configId = searchParams.get("configId");
  const avatarsParam = searchParams.get("avatars");

  const [interviewSession, setInterviewSession] = useState<InterviewSession | null>(null);
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreSession, setShowPreSession] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const { toast } = useToast();
  const { transcriptItems } = useTranscript();
  const { 
    activeChallenge, 
    startCodingChallenge, 
    startCaseStudyChallenge, 
    endChallenge,
    isPanelExpanded,
    setPanelExpanded,
    userCode,
    userNotes
  } = useInterviewEventBus();

  const [selectedAvatar] = useState<SelectedAvatar>(() => {
    if (avatarsParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(avatarsParam));
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0];
        }
      } catch (e) {
        console.error('Failed to parse avatars:', e);
      }
    }
    return defaultAvatar;
  });

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

  const { connect, disconnect, sendUserText, sendEvent, mute, status } = useRealtimeSession({
    onConnectionChange: (s) => {
      console.log('[ContinuousSession] Connection status:', s);
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
    const fetchData = async () => {
      try {
        if (interviewSessionId) {
          const response = await fetch(`/api/interview/session/${interviewSessionId}`);
          const data = await response.json();
          if (data.success) {
            setInterviewSession(data.session);
          } else {
            setError("Failed to load interview session");
          }
        }
        
        if (configId) {
          const configResponse = await fetch(`/api/interview/config/${configId}`);
          const configData = await configResponse.json();
          if (configData.success) {
            setConfig(configData.config);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load interview data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [interviewSessionId, configId]);

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
      const response = await fetch("/api/realtime/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success && data.token) {
        return data.token;
      }
    } catch (err) {
      console.error('[ContinuousSession] Error fetching ephemeral key:', err);
    }
    return null;
  };

  const buildInterviewPrompt = useCallback(() => {
    if (!interviewSession?.plan) return '';
    
    const plan = interviewSession.plan;
    const interviewType = config?.interviewType || 'general';
    const style = config?.style || 'neutral';
    
    let prompt = `You are ${selectedAvatar.name}, a professional interviewer conducting a ${interviewType} interview.

INTERVIEW CONTEXT:
- Interview Type: ${interviewType}
- Style: ${style}
- Tone: ${plan.interviewerTone || 'Professional and conversational'}

FOCUS AREAS:
${plan.focusAreas?.map(area => `- ${area}`).join('\n') || '- General assessment'}

KEY QUESTIONS TO COVER:
${plan.keyQuestions?.map((q, i) => `${i + 1}. ${q}`).join('\n') || '- Assess candidate background and experience'}

CONVERSATION FLOW:
1. Start with a warm greeting and brief introduction
2. Transition naturally through topics based on candidate responses
3. Probe deeper when interesting points arise
4. Keep the conversation flowing naturally without announcing phases

`;

    if (interviewType === 'technical' && plan.codingProblem) {
      const problem = plan.codingProblem;
      let starterCode = '';
      if (typeof problem.starterCode === 'string') {
        starterCode = problem.starterCode;
      } else if (problem.starterCode && typeof problem.starterCode === 'object') {
        starterCode = problem.starterCode[problem.language] || problem.starterCode.javascript || Object.values(problem.starterCode)[0] || '';
      }
      
      prompt += `
CODING CHALLENGE (introduce when appropriate during technical discussion):
When you're ready to present the coding challenge, say something natural like "Let me give you a coding problem to work through..." and then explain the problem verbally.

Problem Details:
- Title: ${problem.title || 'Coding Problem'}
- Description: ${problem.description || ''}
- Language: ${problem.language || 'javascript'}
- Difficulty: ${problem.difficulty || 'Medium'}
${starterCode ? `- Starter Code:\n\`\`\`\n${starterCode}\n\`\`\`` : ''}

Introduce the challenge naturally in conversation.
After they work on it, discuss their approach and solution.
`;
    }

    if ((interviewType === 'hiring_manager' || interviewType === 'panel') && plan.caseStudy) {
      const caseStudy = plan.caseStudy;
      prompt += `
CASE STUDY (introduce when appropriate):
When you want to present the case study, say something natural like "I'd like to walk through a scenario with you..."

Case Details:
- Title: ${caseStudy.title || 'Case Study'}
- Prompt: ${caseStudy.prompt || caseStudy.description || ''}
- Type: ${caseStudy.caseType || 'strategy'}
- Difficulty: ${caseStudy.difficulty || 'Medium'}

Guide them through the analysis and probe their thinking.
`;
    }

    prompt += `
IMPORTANT BEHAVIOR:
- Keep the interview flowing naturally without abrupt transitions
- Respond to what the candidate says, don't just run through questions mechanically
- When introducing challenges, do so conversationally
- Be encouraging but also probe for depth
- Keep responses concise (2-3 sentences typically)
- Ask ONE question at a time
`;

    return prompt;
  }, [interviewSession, config, selectedAvatar]);

  const handleStart = useCallback(async () => {
    setShowPreSession(false);
    setSessionStartTime(Date.now());
    
    const prompt = buildInterviewPrompt();
    
    try {
      const EPHEMERAL_KEY = await fetchEphemeralKey();
      if (!EPHEMERAL_KEY) {
        toast({
          title: "Connection Error",
          description: "Could not connect to the AI interviewer. Please try again.",
          variant: "destructive"
        });
        setShowPreSession(true);
        return;
      }

      const voice = voiceMap[selectedAvatar.gender?.toLowerCase() || 'male'] || 'ash';
      
      const agent = new RealtimeAgent({
        name: `interview_${selectedAvatar.name || 'interviewer'}`,
        voice: voice,
        instructions: prompt,
        tools: [],
      });

      await connect({
        getEphemeralKey: async () => EPHEMERAL_KEY,
        initialAgents: [agent],
        audioElement: sdkAudioElement,
      });

      if (!hasGreeted) {
        setTimeout(() => {
          sendUserText(`Greet the candidate warmly and introduce yourself. Keep it brief and natural.`);
          setHasGreeted(true);
        }, 2000);
      }

      if (interviewSession?.plan?.codingProblem && config?.interviewType === 'technical') {
        const problem = interviewSession.plan.codingProblem;
        let starterCode = '';
        if (typeof problem.starterCode === 'string') {
          starterCode = problem.starterCode;
        } else if (problem.starterCode && typeof problem.starterCode === 'object') {
          starterCode = problem.starterCode[problem.language] || problem.starterCode.javascript || Object.values(problem.starterCode)[0] || '';
        }
        
        startCodingChallenge({
          id: problem.id || 'interview-problem',
          title: problem.title || 'Coding Problem',
          description: problem.description || '',
          difficulty: problem.difficulty || 'Medium',
          language: problem.language || 'javascript',
          starterCode: starterCode,
          examples: problem.examples || [],
          constraints: problem.constraints || [],
          hints: problem.hints || [],
        });
      }

      if (interviewSession?.plan?.caseStudy && (config?.interviewType === 'hiring_manager' || config?.interviewType === 'panel')) {
        const caseStudy = interviewSession.plan.caseStudy;
        startCaseStudyChallenge({
          id: caseStudy.id || 'interview-case',
          title: caseStudy.title || 'Case Study',
          prompt: caseStudy.prompt || caseStudy.description || '',
          context: caseStudy.context || '',
          caseType: caseStudy.caseType || 'strategy',
          difficulty: caseStudy.difficulty || 'Medium',
          evaluationFocus: caseStudy.evaluationFocus || [],
          expectedDurationMinutes: caseStudy.expectedDurationMinutes || 15,
        });
      }

    } catch (err) {
      console.error('Failed to connect:', err);
      toast({
        title: "Connection Error",
        description: "Failed to start the interview session. Please try again.",
        variant: "destructive"
      });
      setShowPreSession(true);
    }
  }, [connect, buildInterviewPrompt, selectedAvatar, sdkAudioElement, toast, hasGreeted, sendUserText, interviewSession, config, startCodingChallenge, startCaseStudyChallenge]);

  const handleEnd = useCallback(async () => {
    setIsSaving(true);
    try {
      disconnect();
      endChallenge();
      
      if (interviewSessionId) {
        await fetch(`/api/interview/session/${interviewSessionId}/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            duration: sessionDuration,
            userCode,
            userNotes,
          })
        });
      }
      
      navigate(`/interview/results?sessionId=${interviewSessionId}`);
    } catch (err) {
      console.error('Error ending session:', err);
    } finally {
      setIsSaving(false);
    }
  }, [disconnect, endChallenge, interviewSessionId, sessionDuration, userCode, userNotes, navigate]);

  const toggleMute = useCallback(() => {
    mute(!isMuted);
    setIsMuted(!isMuted);
  }, [mute, isMuted]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl text-white font-semibold mb-2">Session Error</h2>
          <p className="text-slate-400">{error}</p>
          <Button onClick={() => navigate('/interview')} className="mt-4">
            Back to Interviews
          </Button>
        </div>
      </div>
    );
  }

  if (showPreSession) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="max-w-lg mx-auto text-center p-8">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-600 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative">
            <img 
              src={selectedAvatar.imageUrl} 
              alt={selectedAvatar.name}
              className="w-full h-full object-cover absolute inset-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="text-3xl font-bold text-white">
              {selectedAvatar.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Ready to Start Your Interview
          </h1>
          <p className="text-slate-400 mb-6">
            {selectedAvatar.name} will be your interviewer today. Make sure your microphone is ready.
          </p>
          
          {interviewSession?.plan?.focusAreas && interviewSession.plan.focusAreas.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-slate-500 mb-2">Focus Areas:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {interviewSession.plan.focusAreas.slice(0, 4).map((area, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/interview')}>
              Cancel
            </Button>
            <Button 
              onClick={handleStart}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Start Interview
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-3 h-3 rounded-full",
              sessionStatus === 'connected' ? "bg-emerald-500 animate-pulse" : "bg-slate-500"
            )} />
            <span className="text-white font-medium">
              {config?.interviewType ? config.interviewType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Interview'} Session
            </span>
            {activeChallenge !== 'none' && (
              <span className={cn(
                "px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1",
                activeChallenge === 'coding' ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
              )}>
                {activeChallenge === 'coding' ? <Code className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                {activeChallenge === 'coding' ? 'Coding Challenge' : 'Case Study'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Clock className="w-4 h-4" />
              {formatDuration(sessionDuration)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className={cn(
          "flex flex-col transition-all duration-300",
          activeChallenge !== 'none' && isPanelExpanded ? "w-1/2" : "w-full"
        )}>
          <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900 p-8 relative">
            <div className="relative">
              <div className={cn(
                "w-48 h-48 rounded-full overflow-hidden border-4 transition-all duration-300 bg-slate-700 flex items-center justify-center",
                isSpeaking ? "border-emerald-500 shadow-lg shadow-emerald-500/30" : "border-slate-600"
              )}>
                {selectedAvatar.imageUrl ? (
                  <img 
                    src={selectedAvatar.imageUrl} 
                    alt={selectedAvatar.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : null}
                <span className="text-5xl font-bold text-slate-400 absolute">
                  {selectedAvatar.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-center mt-3">
                <span className="text-white font-medium">{selectedAvatar.name}</span>
              </div>
              {isSpeaking && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  Speaking...
                </div>
              )}
            </div>

            {activeChallenge !== 'none' && !isPanelExpanded && (
              <Button
                onClick={() => setPanelExpanded(true)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <PanelRightOpen className="w-4 h-4 mr-2" />
                Open {activeChallenge === 'coding' ? 'Code Editor' : 'Case Study'}
              </Button>
            )}
          </div>

          <div className="flex-shrink-0 bg-slate-800 border-t border-slate-700 p-4">
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={toggleMute}
                className={cn(
                  "rounded-full h-14 px-6 flex items-center gap-2",
                  isMuted 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-slate-700 hover:bg-slate-600 text-white"
                )}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                <span>{isMuted ? 'Unmute' : 'Mute'}</span>
              </Button>
              
              <Button
                onClick={handleEnd}
                disabled={isSaving}
                className="rounded-full h-14 px-6 bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
              >
                <PhoneOff className="w-5 h-5" />
                <span>End Interview</span>
              </Button>
            </div>
            
            {transcriptItems.length > 0 && (
              <div className="mt-4 max-h-32 overflow-y-auto">
                <div className="space-y-2 text-sm">
                  {transcriptItems.slice(-3).map((item, i) => (
                    <div key={i} className={cn(
                      "px-3 py-2 rounded-lg",
                      item.role === 'assistant' ? "bg-slate-700 text-slate-200" : "bg-blue-900/30 text-blue-200"
                    )}>
                      <span className="text-xs text-slate-400 mr-2">
                        {item.role === 'assistant' ? selectedAvatar.name : 'You'}:
                      </span>
                      {item.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {activeChallenge !== 'none' && isPanelExpanded && (
          <div className="w-1/2 border-l border-slate-700">
            {activeChallenge === 'coding' && (
              <InlineCodingPanel 
                sessionId={interviewSessionId ? parseInt(interviewSessionId) : undefined}
                sendEvent={sendEvent}
              />
            )}
            {activeChallenge === 'case_study' && <InlineCaseStudyPanel />}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InterviewContinuousSessionPage() {
  return (
    <EventProvider>
      <TranscriptProvider>
        <InterviewEventBusProvider>
          <ContinuousSessionContent />
        </InterviewEventBusProvider>
      </TranscriptProvider>
    </EventProvider>
  );
}
