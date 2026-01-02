import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Code, Clock, Mic, MicOff, Eye, Bug, Wrench, Play, Volume2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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
}

const activityConfig = {
  explain: { 
    label: "Explain Code", 
    icon: Eye, 
    color: "text-blue-400",
    instruction: "Walk through this code and explain how it works, including design decisions and trade-offs."
  },
  debug: { 
    label: "Debug Code", 
    icon: Bug, 
    color: "text-red-400",
    instruction: "Find the bug(s) in this code and explain how you would fix them."
  },
  modify: { 
    label: "Modify Code", 
    icon: Wrench, 
    color: "text-emerald-400",
    instruction: "Add the requested feature or modification to this code."
  }
};

export default function CodingLabSessionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const exerciseId = searchParams.get("exerciseId");

  const [exercise, setExercise] = useState<CodingExercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionPhase, setSessionPhase] = useState<"prep" | "active" | "complete">("prep");
  const [isRecording, setIsRecording] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    
    if (sessionPhase === "active") {
      interval = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [sessionPhase]);

  const startSession = () => {
    setSessionPhase("active");
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const copyCode = async () => {
    if (exercise?.codeSnippet) {
      await navigator.clipboard.writeText(exercise.codeSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const endSession = () => {
    setSessionPhase("complete");
    navigate(`/exercise-mode/coding-lab/results?exerciseId=${exercise?.id}`);
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

  if (error || !exercise) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Exercise not found"}</p>
          <Button onClick={() => navigate("/exercise-mode/coding-lab")}>
            Back to Coding Lab
          </Button>
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
            </div>
            <h2 className="text-xl font-semibold mb-2">{exercise.name}</h2>
            <p className="text-slate-300 mb-4">{config.instruction}</p>
            
            {exercise.activityType === "debug" && exercise.bugDescription && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 mb-4">
                <p className="text-red-300 text-sm">{exercise.bugDescription}</p>
              </div>
            )}
            
            {exercise.activityType === "modify" && exercise.modificationRequirement && (
              <div className="bg-emerald-900/20 border border-emerald-800 rounded-lg p-3 mb-4">
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
            <pre className="p-4 overflow-x-auto text-sm">
              <code className="text-slate-300">{exercise.codeSnippet}</code>
            </pre>
          </div>

          <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4 mb-8">
            <h3 className="font-medium text-blue-400 mb-2">How it works:</h3>
            <ol className="text-sm text-blue-200 space-y-2">
              <li>1. Review the code carefully</li>
              <li>2. Speak your analysis out loud as you would in an interview</li>
              <li>3. The AI interviewer will ask follow-up questions based on your response</li>
              <li>4. Think out loud about edge cases, complexity, and improvements</li>
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="h-screen flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <ActivityIcon className={`w-5 h-5 ${config.color}`} />
            <span className="font-medium">{exercise.name}</span>
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

        <div className="flex-1 flex">
          <div className="flex-1 border-r border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-slate-700">
              <span className="text-sm text-slate-400">{exercise.language}</span>
              <button 
                onClick={copyCode}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="p-4 overflow-auto h-full text-sm">
              <code className="text-slate-300">{exercise.codeSnippet}</code>
            </pre>
          </div>

          <div className="w-96 flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  AI Interviewer
                </h3>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-slate-300 text-sm italic">
                    "Take a look at this code and walk me through what it does. Start wherever you'd like."
                  </p>
                </div>
              </div>

              {exercise.activityType === "debug" && exercise.bugDescription && (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 mb-4">
                  <h4 className="text-sm font-medium text-red-400 mb-1">Bug Report</h4>
                  <p className="text-red-300 text-xs">{exercise.bugDescription}</p>
                </div>
              )}

              {exercise.activityType === "modify" && exercise.modificationRequirement && (
                <div className="bg-emerald-900/20 border border-emerald-800 rounded-lg p-3 mb-4">
                  <h4 className="text-sm font-medium text-emerald-400 mb-1">Requirement</h4>
                  <p className="text-emerald-300 text-xs">{exercise.modificationRequirement}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-700">
              <div className="flex flex-col items-center">
                <button
                  onClick={toggleRecording}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all mb-3 ${
                    isRecording 
                      ? "bg-red-600 hover:bg-red-700 animate-pulse" 
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </button>
                <p className="text-slate-400 text-sm text-center">
                  {isRecording ? "Recording... Click to pause" : "Click to speak"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
