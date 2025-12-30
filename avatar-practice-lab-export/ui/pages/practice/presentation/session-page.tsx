import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Mic, MicOff, Phone, Users, Presentation, MessageSquare, Maximize2, Minimize2, Volume2, User, PhoneOff, CheckCircle2, BarChart3, Globe } from "lucide-react";
import PdfSlideViewer from '@/components/PdfSlideViewer';
import MeetingLobby from '@/components/MeetingLobby';
import { TranscriptProvider, useTranscript } from '@/contexts/TranscriptContext';
import { EventProvider, useEvent } from '@/contexts/EventContext';
import { useRealtimeSession } from '@/hooks/useRealtimeSession';
import { useHandleSessionHistory } from '@/hooks/useHandleSessionHistory';
import { RealtimeAgent } from '@openai/agents/realtime';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface SlideData {
  slideNumber: number;
  title: string;
  bulletPoints: string[];
  rawText: string;
}

interface PresentationData {
  id: number;
  topic: string;
  context?: string | null;
  fileName: string;
  fileUrl?: string;
  fileType?: string;
  totalSlides: number;
  slides: SlideData[];
}

interface SelectedAvatar {
  id: string;
  name: string;
  gender: string;
  imageUrl: string;
  personality: string;
  role?: string;
}

const defaultAvatars: SelectedAvatar[] = [
  { 
    id: "Wayne_20240711", 
    name: "Wayne", 
    gender: "male",
    imageUrl: "https://files.heygen.ai/avatar/v3/Wayne_20240711/full_body.webp",
    personality: "analytical and detail-oriented, tends to ask probing questions about data and methodology"
  },
  { 
    id: "Anna_public_3_20240108", 
    name: "Anna", 
    gender: "female",
    imageUrl: "https://files.heygen.ai/avatar/v3/Anna_public_3_20240108/full_body.webp",
    personality: "supportive and encouraging, focuses on practical implications and clarity"
  },
];

function parseAvatarsFromUrl(avatarsParam: string | null): SelectedAvatar[] {
  if (!avatarsParam) return defaultAvatars;
  
  try {
    const parsed = JSON.parse(decodeURIComponent(avatarsParam));
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((a: any) => ({
        id: a.id || 'Wayne_20240711',
        name: a.name || 'Participant',
        gender: a.gender || 'male',
        imageUrl: a.imageUrl || `https://files.heygen.ai/avatar/v3/${a.id}/full_body.webp`,
        personality: a.personality || 'professional meeting participant',
        role: a.role || 'team_member'
      }));
    }
  } catch (e) {
    console.error('Failed to parse avatars:', e);
  }
  return defaultAvatars;
}

const ROLE_LABELS: Record<string, string> = {
  customer: "Customer",
  manager: "Manager",
  team_member: "Team Member",
  stakeholder: "Stakeholder",
  executive: "Executive",
  technical_expert: "Technical Expert",
  skeptic: "Skeptic",
};

const CULTURAL_STYLE_PROMPTS: Record<string, string> = {
  direct_task_focused: "Communicate directly and focus on tasks. Get straight to the point, be explicit about your questions, and prioritize efficiency over relationship-building.",
  indirect_relationship: "Communicate indirectly and focus on relationships. Be diplomatic, consider context and face-saving, and build rapport before getting to business.",
  formal_hierarchical: "Communicate formally and respect hierarchy. Use titles, show deference to seniority, and maintain professional distance.",
  informal_egalitarian: "Communicate informally and treat everyone as equals. Be casual, approachable, and minimize status distinctions.",
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  zh: "Mandarin Chinese",
  ja: "Japanese",
  ko: "Korean",
  hi: "Hindi",
  ar: "Arabic",
  ru: "Russian",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
};

const voiceMap: Record<string, string> = {
  male: 'ash',
  female: 'sage',
};

function PresentationSessionContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const handlePdfLoadSuccess = useCallback((numPages: number) => {
    console.log(`[Session] PDF loaded with ${numPages} pages`);
    setPdfPageCount(numPages);
    if (presentation && presentation.totalSlides !== numPages) {
      setPresentation(prev => prev ? { ...prev, totalSlides: numPages } : prev);
    }
  }, [presentation]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [signedFileUrl, setSignedFileUrl] = useState<string | null>(null);
  const [activeParticipant, setActiveParticipant] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showLobby, setShowLobby] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();

  const { transcriptItems } = useTranscript();
  const { logClientEvent, logServerEvent } = useEvent();

  const presentationId = searchParams.get('presentationId');
  const avatarsParam = searchParams.get('avatars');
  const culturalPresetParam = searchParams.get('culturalPreset');
  const languageParam = searchParams.get('language');
  
  const [selectedAvatars] = useState<SelectedAvatar[]>(() => parseAvatarsFromUrl(avatarsParam));
  const [culturalPreset] = useState<string | null>(culturalPresetParam);
  const [sessionLanguage] = useState<string>(languageParam || 'en');
  const sessionLanguageName = LANGUAGE_NAMES[sessionLanguage] || 'English';

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
      console.log('[PresentationSession] Connection status:', s);
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
    const fetchPresentation = async () => {
      if (!presentationId) {
        setError('No presentation specified');
        setIsLoading(false);
        return;
      }

      try {
        try {
          const reparseResponse = await fetch(`/api/avatar/presentation/${presentationId}/reparse`, {
            method: 'POST',
            credentials: 'include'
          });
          
          if (reparseResponse.ok) {
            const reparseData = await reparseResponse.json();
            if (reparseData.success && reparseData.presentation) {
              console.log(`[Session] Re-parsed presentation: ${reparseData.presentation.totalSlides} slides`);
              setPresentation(reparseData.presentation);
              setSignedFileUrl(`/api/avatar/presentation/view/${presentationId}`);
              setIsLoading(false);
              return;
            }
          }
        } catch (reparseErr) {
          console.warn('[Session] Reparse failed, falling back to cached data:', reparseErr);
        }

        const response = await fetch(`/api/avatar/presentation/${presentationId}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to load presentation');
        }
        
        const data = await response.json();
        if (data.success && data.presentation) {
          setPresentation(data.presentation);
          
          if (data.presentation.fileUrl) {
            setSignedFileUrl(`/api/avatar/presentation/view/${presentationId}`);
          }
        } else {
          throw new Error('Presentation not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load presentation');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresentation();
  }, [presentationId]);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcriptItems]);

  const fetchEphemeralKey = async (): Promise<string | null> => {
    logClientEvent({ url: "/session" }, "fetch_session_token_request");
    const tokenResponse = await fetch("/api/avatar/session", { credentials: 'include' });
    const data = await tokenResponse.json();
    logServerEvent(data, "fetch_session_token_response");

    if (!data.client_secret?.value) {
      console.error("No ephemeral key provided by the server");
      setSessionStatus('disconnected');
      return null;
    }

    return data.client_secret.value;
  };

  const buildPresentationContext = useCallback(() => {
    if (!presentation) return '';
    
    const currentAvatar = selectedAvatars[activeParticipant];
    const currentSlideData = presentation.slides.find(s => s.slideNumber === currentSlide);
    
    const allSlidesContext = presentation.slides.map(s => 
      `Slide ${s.slideNumber}: ${s.title || 'Untitled'} - ${s.rawText || s.bulletPoints?.join('. ') || 'No content'}`
    ).join('\n');
    
    const roleLabel = ROLE_LABELS[currentAvatar?.role || 'team_member'] || 'Team Member';
    const culturalStylePrompt = culturalPreset ? CULTURAL_STYLE_PROMPTS[culturalPreset] || '' : '';
    
    const situationContext = presentation.context 
      ? `\nSITUATION CONTEXT: ${presentation.context}\n(Tailor your questions and perspective to this situation)`
      : '';
    
    return `
PRESENTATION PRACTICE SESSION - VIRTUAL MEETING AUDIENCE

You are ${currentAvatar?.name || 'a meeting participant'}, a ${roleLabel}, watching a live presentation. The presenter is practicing their presentation skills.

YOUR ROLE: ${roleLabel}
YOUR PERSONALITY: ${currentAvatar?.personality || 'professional meeting participant'}
${culturalStylePrompt ? `\nCOMMUNICATION STYLE: ${culturalStylePrompt}` : ''}
${situationContext}

PRESENTATION TOPIC: ${presentation.topic}
TOTAL SLIDES: ${presentation.totalSlides}

FULL PRESENTATION CONTENT (for context when asking questions):
${allSlidesContext}

CURRENT SLIDE (${currentSlide} of ${presentation.totalSlides}):
Title: ${currentSlideData?.title || 'Untitled'}
Content: ${currentSlideData?.rawText || currentSlideData?.bulletPoints?.join('. ') || 'No content'}

=== CRITICAL BEHAVIOR RULES ===

1. WHEN TO SPEAK:
   - At the START of the session: Give a brief, friendly greeting introducing yourself as ${roleLabel} and expressing interest in their topic
   - When the presenter EXPLICITLY asks for questions (e.g., "Any questions?", "Does anyone have questions?", "What do you think?")
   - When the presenter pauses significantly and seems to be inviting feedback
   - When the presenter directly addresses you by name
   
2. WHEN TO STAY SILENT:
   - While the presenter is actively speaking or presenting content
   - During natural brief pauses within their presentation flow
   - Do NOT interrupt the presenter mid-thought
   
3. HOW TO ASK QUESTIONS:
   - Base your questions on the ACTUAL content of their presentation (use the slide content above)
   - Ask questions FROM YOUR ROLE'S PERSPECTIVE as a ${roleLabel}
   - Ask one focused question at a time, not multiple questions
   - Stay in character with your personality: ${currentAvatar?.personality || 'professional'}
   - Make questions relevant and thought-provoking to help them practice
   ${presentation.context ? `- Consider the situation context: "${presentation.context}" when forming questions` : ''}
   - Examples based on your role: "As a ${roleLabel}, I'm curious about...", "From my perspective as ${roleLabel}, how would..."

4. RESPONSE STYLE:
   - Keep responses brief (under 30 words for acknowledgments, under 50 words for questions)
   - Be natural and conversational - this is voice-based
   - Show genuine engagement with their content
   - Avoid generic praise; be specific when commenting
   ${culturalStylePrompt ? `- Follow the communication style guidance: ${culturalStylePrompt}` : ''}

IMPORTANT: You are simulating a realistic meeting audience. Real audiences listen more than they speak. Only engage when it's natural and appropriate.

5. INFORMATION ACCURACY (CRITICAL):
   - ONLY use information explicitly provided in the presentation slides and context above
   - NEVER invent, assume, or make up specific details like company names, product names, people's names, project names, dates, numbers, or statistics that were NOT in the slides
   - If you need to reference something not mentioned, use GENERIC terms like "the company", "the product", "the team", etc.
   - Base ALL your questions and comments on the ACTUAL content provided in the slides above
   - If slides don't contain enough detail, ask clarifying questions instead of assuming

6. LANGUAGE ENFORCEMENT (MANDATORY - ${sessionLanguageName}):
   - You MUST speak ONLY in ${sessionLanguageName} at all times
   - This session is specifically for ${sessionLanguageName} practice - do not switch to any other language
   - If the presenter speaks in a language other than ${sessionLanguageName}, respond politely but firmly in ${sessionLanguageName}:
     * Acknowledge you understood them
     * Kindly remind them: "I notice you switched languages. For this practice session, let's continue in ${sessionLanguageName} to help you build confidence."
     * Ask them to repeat their point in ${sessionLanguageName}
   - Never respond in the presenter's other language, even if you understand it
   - Be encouraging about their ${sessionLanguageName} practice, not critical
   - If they mix languages (code-switching), gently guide them back to ${sessionLanguageName}
   - Example responses when language switch is detected:
     * "I caught that! But remember, we're practicing in ${sessionLanguageName} today. Could you share that thought again in ${sessionLanguageName}?"
     * "Great point - let's keep our ${sessionLanguageName} practice going. How would you say that in ${sessionLanguageName}?"
`.trim();
  }, [presentation, selectedAvatars, activeParticipant, currentSlide, culturalPreset, sessionLanguageName]);

  const connectToRealtime = async () => {
    if (sessionStatus !== 'disconnected') return;
    
    setSessionStatus('connecting');
    
    try {
      const EPHEMERAL_KEY = await fetchEphemeralKey();
      if (!EPHEMERAL_KEY) return;

      const currentAvatar = selectedAvatars[activeParticipant];
      const voice = voiceMap[currentAvatar?.gender?.toLowerCase() || 'female'] || 'sage';
      
      const systemPrompt = buildPresentationContext();
      
      const agent = new RealtimeAgent({
        name: `presentation_participant_${currentAvatar?.name || 'participant'}`,
        voice: voice,
        instructions: systemPrompt,
        tools: [],
      });

      await connect({
        getEphemeralKey: async () => EPHEMERAL_KEY,
        initialAgents: [agent],
        audioElement: sdkAudioElement,
      });

      console.log('[PresentationSession] Connected successfully');
      setSessionStartTime(Date.now());
      
      if (!hasGreeted) {
        setTimeout(() => {
          const roleLabel = ROLE_LABELS[currentAvatar?.role || 'team_member'] || 'Team Member';
          sendUserText(`Greet the presenter briefly in ${sessionLanguageName}. Introduce yourself as ${currentAvatar?.name || 'a participant'}, a ${roleLabel}, and express interest in their presentation about "${presentation?.topic || 'this topic'}". Keep it under 25 words. CRITICAL: Your greeting MUST be entirely in ${sessionLanguageName} - do not use English unless ${sessionLanguageName} is English.`);
          setHasGreeted(true);
        }, 2000);
      }

    } catch (err) {
      console.error('[PresentationSession] Error connecting:', err);
      setSessionStatus('disconnected');
    }
  };

  const disconnectFromRealtime = () => {
    disconnect();
    setSessionStatus('disconnected');
  };

  const handleLobbyComplete = useCallback(() => {
    setShowLobby(false);
    setTimeout(() => {
      connectToRealtime();
    }, 500);
  }, []);

  const handlePrevSlide = useCallback(() => {
    if (currentSlide > 1) {
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  const handleNextSlide = useCallback(() => {
    if (presentation && currentSlide < presentation.totalSlides) {
      setCurrentSlide(prev => prev + 1);
    }
  }, [currentSlide, presentation]);

  const switchToParticipant = useCallback((index: number) => {
    if (index !== activeParticipant) {
      setActiveParticipant(index);
    }
  }, [activeParticipant]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        handlePrevSlide();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handleNextSlide();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevSlide, handleNextSlide, isFullscreen]);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);
  
  const handleEndCall = async () => {
    if (isSaving) return;
    
    const confirmEnd = window.confirm('End this presentation session?');
    if (!confirmEnd) return;
    
    setIsSaving(true);
    
    try {
      disconnectFromRealtime();
      
      const sessionDuration = sessionStartTime 
        ? Math.round((Date.now() - sessionStartTime) / 1000) 
        : 0;
      
      const transcript = transcriptItems.map(item => {
        const speaker = item.role === 'user' ? 'Presenter' : 'Audience';
        return `${speaker}: ${item.title || ''}`;
      }).join('\n');
      
      const sessionId = `pres_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      toast({
        title: "Analyzing your presentation...",
        description: "Generating feedback based on your practice session",
      });

      const feedbackResponse = await fetch(`/api/avatar/presentation/${presentationId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          transcript,
          sessionId,
          duration: sessionDuration,
          slidesCovered: currentSlide,
          totalSlides: presentation?.totalSlides || 0,
        }),
      });
      
      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        
        sessionStorage.setItem(`presentation_feedback_${sessionId}`, JSON.stringify({
          feedback: feedbackData.feedback,
          skillAssessment: feedbackData.skillAssessment,
          documentAnalysis: feedbackData.documentAnalysis,
          sessionId,
          presentationId,
          duration: sessionDuration,
          slidesCovered: currentSlide,
          totalSlides: presentation?.totalSlides || 0,
          presentationTopic: presentation?.topic || '',
        }));
        
        toast({
          title: "Feedback Generated!",
          description: "View your presentation analysis",
        });
        navigate(`/avatar/practice/presentation/results?sessionId=${sessionId}&presentationId=${presentationId}`);
      } else {
        const minutes = Math.floor(sessionDuration / 60);
        const seconds = sessionDuration % 60;
        const durationText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
        
        toast({
          title: "Presentation Session Complete",
          description: `Duration: ${durationText} | Slides: ${currentSlide}/${presentation?.totalSlides || 0}`,
        });
        navigate('/avatar/practice/presentation');
      }
      
    } catch (err) {
      console.error('[PresentationSession] Error ending session:', err);
      toast({
        title: "Session ended",
        description: "Returning to presentations...",
      });
      navigate('/avatar/practice/presentation');
    } finally {
      setIsSaving(false);
    }
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
          <h3 className="text-lg font-semibold mb-2">Loading Presentation</h3>
          <p className="text-slate-400">Preparing your slides...</p>
        </div>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-orange-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin"></div>
            <BarChart3 className="absolute inset-0 m-auto w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Analyzing Your Presentation</h3>
          <p className="text-slate-400 mb-4">
            Our AI is reviewing your delivery, communication style, and subject matter expertise...
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span>Generating personalized feedback</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !presentation) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
            <Presentation className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Session Error</h1>
          <p className="text-slate-400 mb-6">{error || 'Unable to load presentation'}</p>
          <Link to="/avatar/practice/presentation">
            <Button variant="outline" className="text-white border-white hover:bg-white/10">
              ← Start New Session
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentSlideData = presentation.slides.find(s => s.slideNumber === currentSlide);
  const currentAvatar = selectedAvatars[activeParticipant];

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4 relative">
          {signedFileUrl ? (
            <div className="w-full h-full max-w-6xl flex items-center justify-center">
              <PdfSlideViewer
                fileUrl={signedFileUrl}
                currentPage={currentSlide}
                onLoadSuccess={handlePdfLoadSuccess}
                className="rounded-lg shadow-2xl max-h-full"
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full p-12 text-center">
              <h2 className="text-4xl font-bold text-slate-900 mb-8">
                {currentSlideData?.title || `Slide ${currentSlide}`}
              </h2>
              {currentSlideData?.bulletPoints && currentSlideData.bulletPoints.length > 0 && (
                <ul className="space-y-4 text-left max-w-2xl mx-auto">
                  {currentSlideData.bulletPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-4 text-2xl text-slate-700">
                      <span className="w-3 h-3 bg-orange-500 rounded-full mt-3 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            <Minimize2 className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-slate-900/90 backdrop-blur px-6 py-4 flex items-center justify-center gap-6">
          <Button
            variant="ghost"
            onClick={handlePrevSlide}
            disabled={currentSlide === 1}
            className="text-white hover:bg-white/10 disabled:opacity-30 px-6 py-3 text-lg"
          >
            <ChevronLeft className="w-6 h-6 mr-2" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2 px-6">
            <span className="text-white text-xl font-medium">{currentSlide}</span>
            <span className="text-slate-400 text-xl">/</span>
            <span className="text-slate-400 text-xl">{presentation.totalSlides}</span>
          </div>
          
          <Button
            variant="ghost"
            onClick={handleNextSlide}
            disabled={currentSlide === presentation.totalSlides}
            className="text-white hover:bg-white/10 disabled:opacity-30 px-6 py-3 text-lg"
          >
            Next
            <ChevronRight className="w-6 h-6 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden relative">
      <MeetingLobby
        participants={lobbyParticipants}
        presentationTopic={presentation.topic}
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
          <Presentation className="w-4 h-4 text-orange-400" />
          <span className="text-white text-sm font-medium truncate max-w-sm">{presentation.topic}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-xs flex items-center gap-1.5 bg-slate-700/50 px-2 py-1 rounded-full">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            {sessionLanguageName}
          </span>
          <span className="text-slate-400 text-xs flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {selectedAvatars.length + 1} in meeting
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-slate-300 hover:text-white hover:bg-slate-700 h-7 px-2"
          >
            <Maximize2 className="w-3.5 h-3.5 mr-1.5" />
            <span className="text-xs">Present</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-slate-800 to-slate-900">
              <div className="relative w-full h-full max-w-5xl flex items-center justify-center">
                {signedFileUrl ? (
                  <PdfSlideViewer
                    fileUrl={signedFileUrl}
                    currentPage={currentSlide}
                    onLoadSuccess={handlePdfLoadSuccess}
                    className="rounded-xl shadow-2xl w-full h-full"
                  />
                ) : (
                  <div className="bg-white rounded-xl shadow-2xl w-full aspect-[16/9] p-8 flex flex-col justify-center">
                    <h2 className="text-3xl font-bold text-slate-900 mb-6">
                      {currentSlideData?.title || `Slide ${currentSlide}`}
                    </h2>
                    {currentSlideData?.bulletPoints && currentSlideData.bulletPoints.length > 0 && (
                      <ul className="space-y-3">
                        {currentSlideData.bulletPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-xl text-slate-700">
                            <span className="w-2 h-2 bg-orange-500 rounded-full mt-2.5 flex-shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                
                <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2.5 py-1 rounded-full text-xs font-medium">
                  {currentSlide} / {presentation.totalSlides}
                </div>
              </div>
            </div>

            <div className="bg-slate-850 border-t border-slate-700 flex-shrink-0 px-4 py-3" style={{ backgroundColor: '#1a2332' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevSlide}
                    disabled={currentSlide === 1}
                    className="text-white hover:bg-slate-700 disabled:opacity-30 h-9 px-3"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-lg">
                    <span className="text-white text-sm font-medium">{currentSlide}</span>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-400 text-sm">{presentation.totalSlides}</span>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNextSlide}
                    disabled={currentSlide === presentation.totalSlides}
                    className="text-white hover:bg-slate-700 disabled:opacity-30 h-9 px-3"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsMuted(!isMuted);
                      mute(!isMuted);
                    }}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
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
                    className="h-10 px-4 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2 transition-colors"
                    title="End presentation"
                  >
                    <PhoneOff className="w-4 h-4 text-white" />
                    <span className="text-white text-sm font-medium">End</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="w-80 bg-slate-800/95 border-l border-slate-700 flex flex-col min-h-0">
            <div className="p-3 border-b border-slate-700 flex-shrink-0">
              <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Audience
                <span className="ml-auto text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">
                  {selectedAvatars.length} members
                </span>
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">You</span>
                      <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded font-medium">
                        PRESENTER
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">Sharing presentation</p>
                  </div>
                </div>
              </div>

              {selectedAvatars.map((avatar, index) => {
                const isActive = activeParticipant === index;
                const isCurrentlySpeaking = isActive && isSpeaking;
                const roleLabel = ROLE_LABELS[avatar.role || 'team_member'] || 'Team Member';
                
                return (
                  <div
                    key={avatar.id}
                    onClick={() => switchToParticipant(index)}
                    className={cn(
                      "rounded-xl p-3 cursor-pointer transition-all",
                      isActive 
                        ? 'bg-slate-700/80 ring-2 ring-green-500/50' 
                        : 'bg-slate-700/40 hover:bg-slate-700/60',
                      isCurrentlySpeaking && 'ring-2 ring-green-400 shadow-lg shadow-green-500/20'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <div className={cn(
                          "w-14 h-14 rounded-xl overflow-hidden",
                          isActive && "ring-2 ring-green-500"
                        )}>
                          <img
                            src={avatar.imageUrl}
                            alt={avatar.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${avatar.name}&background=4a5568&color=fff`;
                            }}
                          />
                        </div>
                        
                        {isCurrentlySpeaking && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                            <Volume2 className="w-3 h-3 text-white" />
                          </div>
                        )}
                        
                        {sessionStatus === 'connected' && !isCurrentlySpeaking && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-medium text-sm">{avatar.name}</span>
                          {isActive && (
                            <span className="text-[10px] bg-green-500/80 text-white px-1.5 py-0.5 rounded font-medium">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-blue-400 text-xs mt-0.5 font-medium">{roleLabel}</p>
                        <p className="text-slate-500 text-xs mt-1 line-clamp-2">{avatar.personality}</p>
                        
                        {isCurrentlySpeaking && (
                          <div className="flex items-center gap-1 mt-2">
                            <div className="flex items-center gap-0.5">
                              <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse" />
                              <div className="w-1 h-4 bg-green-400 rounded-full animate-pulse delay-75" />
                              <div className="w-1 h-2 bg-green-400 rounded-full animate-pulse delay-150" />
                              <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse delay-200" />
                            </div>
                            <span className="text-green-400 text-xs ml-1">Speaking...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-slate-800/95 border-t border-slate-700 flex-shrink-0">
          <div className="p-3 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-white text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              Live Transcript
            </h3>
            <span className="text-xs text-slate-400">
              {transcriptItems.length} message{transcriptItems.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div 
            ref={transcriptRef} 
            className="h-32 overflow-y-auto px-3 py-2"
          >
            {transcriptItems.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                <MessageSquare className="w-5 h-5 mr-2 opacity-50" />
                <span className="text-sm">Waiting for conversation...</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {transcriptItems.map((item, idx) => {
                  const isUser = item.role === 'user';
                  const speakerName = isUser 
                    ? 'You' 
                    : (currentAvatar?.name || 'Participant');
                  
                  return (
                    <div 
                      key={item.itemId || idx} 
                      className={cn(
                        "inline-flex items-start gap-2 rounded-lg px-3 py-2 max-w-[80%]",
                        isUser 
                          ? 'bg-orange-500/20 border border-orange-500/30' 
                          : 'bg-blue-500/20 border border-blue-500/30'
                      )}
                    >
                      <span className={cn(
                        "text-xs font-semibold flex-shrink-0",
                        isUser ? 'text-orange-400' : 'text-blue-400'
                      )}>
                        {speakerName}:
                      </span>
                      <p className="text-white text-sm leading-relaxed">
                        {item.title || '...'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PresentationSessionPage() {
  return (
    <TranscriptProvider>
      <EventProvider>
        <PresentationSessionContent />
      </EventProvider>
    </TranscriptProvider>
  );
}
