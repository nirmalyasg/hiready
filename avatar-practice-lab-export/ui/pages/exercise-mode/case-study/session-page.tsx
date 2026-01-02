import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Briefcase, Clock, Mic, MicOff, Brain, ChevronRight, Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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

export default function CaseStudySessionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("templateId");

  const [template, setTemplate] = useState<CaseTemplate | null>(null);
  const [session, setSession] = useState<ExerciseSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionPhase, setSessionPhase] = useState<"prep" | "thinking" | "active" | "complete">("prep");
  const [thinkingTimeRemaining, setThinkingTimeRemaining] = useState(60);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

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
            setSessionPhase("active");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    if (sessionPhase === "active") {
      interval = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [sessionPhase, thinkingTimeRemaining]);

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
    setSessionPhase("active");
    setThinkingTimeRemaining(0);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const endSession = () => {
    setSessionPhase("complete");
    navigate(`/exercise-mode/case-study/results?sessionId=${session?.id}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Template not found"}</p>
          <Button onClick={() => navigate("/exercise-mode/case-study")}>
            Back to Case Study
          </Button>
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
            <h1 className="text-2xl font-bold">Case Study Session</h1>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">{template.name}</h2>
            <p className="text-slate-300 mb-6">{template.promptStatement}</p>
            
            {template.context && (
              <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Context</h3>
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
              <li>3. Present your analysis and recommendations verbally</li>
              <li>4. The AI interviewer will probe your responses with follow-up questions</li>
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-emerald-400" />
            <span className="font-medium">{template.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400">
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

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 mb-6">
              <h3 className="font-medium text-slate-400 mb-3">Case Prompt</h3>
              <p className="text-slate-200">{template.promptStatement}</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-slate-400">Your Response</h3>
                <div className="flex items-center gap-2">
                  {isRecording && (
                    <span className="flex items-center gap-1 text-red-400 text-sm">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      Recording
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={toggleRecording}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                    isRecording 
                      ? "bg-red-600 hover:bg-red-700 animate-pulse" 
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-10 h-10" />
                  ) : (
                    <Mic className="w-10 h-10" />
                  )}
                </button>
              </div>
              
              <p className="text-center text-slate-400 text-sm mt-4">
                {isRecording ? "Click to pause" : "Click to start speaking"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
              <h3 className="font-medium text-slate-400 mb-3 flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                AI Interviewer
              </h3>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-slate-300 text-sm italic">
                  "Walk me through how you would approach this problem. What's your initial framework?"
                </p>
              </div>
            </div>

            {template.context && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                <h3 className="font-medium text-slate-400 mb-2 text-sm">Context</h3>
                <p className="text-slate-400 text-xs whitespace-pre-line">{template.context}</p>
              </div>
            )}

            {template.evaluationFocus && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                <h3 className="font-medium text-slate-400 mb-2 text-sm">Focus Areas</h3>
                <div className="flex flex-wrap gap-1">
                  {template.evaluationFocus.map((focus, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">
                      {focus}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
