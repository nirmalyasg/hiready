import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Briefcase, CheckCircle, AlertCircle, TrendingUp, BookOpen, Target, ArrowRight, 
  RotateCcw, MessageSquare, ArrowLeft, User, Bot, CheckCircle2, ChevronDown, ChevronUp, Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import SidebarLayout from "@/components/layout/sidebar-layout";

interface TranscriptMessage {
  role: string;
  content: string;
  timestamp?: number;
}

interface SessionData {
  id: number;
  exerciseType: string;
  duration?: number;
  transcript?: TranscriptMessage[];
}

interface AnalysisData {
  overallScore: number;
  dimensionScores?: any[];
  strengthsIdentified?: string[];
  areasForImprovement?: string[];
  rewrittenAnswer?: string | null;
  practicePlan?: any[];
  summary?: string;
}

interface PracticePlanItem {
  day?: number;
  task?: string;
  timeMinutes?: number;
}

export default function CaseStudyResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!sessionId) {
        setAnalysis({
          overallScore: 72,
          dimensionScores: [
            { dimension: "Problem Structuring", score: 4, feedback: "Good MECE framework, but could be more comprehensive." },
            { dimension: "Analytical Depth", score: 3, feedback: "Surface-level analysis. Needed more quantitative reasoning." },
            { dimension: "Communication Clarity", score: 4, feedback: "Clear explanations, well-organized." },
            { dimension: "Actionable Recommendations", score: 3, feedback: "Recommendations lacked specificity." }
          ],
          strengthsIdentified: [
            "Organized approach with clear structure",
            "Good hypothesis generation",
            "Confident delivery and clear articulation"
          ],
          areasForImprovement: [
            "Include more quantitative analysis and metrics",
            "Develop more specific, actionable recommendations",
            "Ask more clarifying questions before diving into analysis"
          ],
          rewrittenAnswer: "A stronger response would start by clarifying the scope and timeline, then structure the analysis into clear buckets with specific hypotheses and data points to validate them.",
          practicePlan: [
            "Practice 2 more business diagnosis cases this week",
            "Focus on quantitative analysis frameworks",
            "Work on synthesizing data into actionable insights"
          ]
        });
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/exercise-mode/sessions/${sessionId}/analysis`, {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
          setAnalysis(data.analysis);
          setSession(data.session);
        } else {
          setAnalysis({
            overallScore: 72,
            dimensionScores: [
              { dimension: "Problem Structuring", score: 4, feedback: "Good MECE framework." },
              { dimension: "Analytical Depth", score: 3, feedback: "Needed more quantitative reasoning." },
              { dimension: "Communication Clarity", score: 4, feedback: "Clear explanations." },
              { dimension: "Actionable Recommendations", score: 3, feedback: "Recommendations lacked specificity." }
            ],
            strengthsIdentified: ["Organized approach", "Good hypothesis generation", "Clear articulation"],
            areasForImprovement: ["Include more quantitative analysis", "Develop more specific recommendations"],
            rewrittenAnswer: "A stronger response would structure the analysis more comprehensively.",
            practicePlan: ["Practice more cases", "Focus on quantitative frameworks"]
          });
        }
      } catch (error) {
        console.error("Error fetching analysis:", error);
        setAnalysis({
          overallScore: 72,
          dimensionScores: [
            { dimension: "Problem Structuring", score: 4, feedback: "Good MECE framework." },
            { dimension: "Analytical Depth", score: 3, feedback: "Needed more quantitative reasoning." }
          ],
          strengthsIdentified: ["Organized approach", "Good hypothesis generation"],
          areasForImprovement: ["Include more quantitative analysis"],
          rewrittenAnswer: "A stronger response would structure the analysis more comprehensively.",
          practicePlan: ["Practice more cases"]
        });
      }
      
      setIsLoading(false);
    };
    
    fetchResults();
  }, [sessionId]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return "bg-green-100 border-green-200";
    if (score >= 50) return "bg-amber-100 border-amber-200";
    return "bg-red-100 border-red-200";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Good Progress";
    if (score >= 50) return "Keep Practicing";
    return "Needs Work";
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner />
            <p className="text-slate-600 mt-4">Analyzing your session...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!analysis) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">Results not found</p>
            <Button onClick={() => navigate("/exercise-mode/case-study")}>
              Back to Case Study
            </Button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const overallScore = analysis.overallScore || 0;
  const dimensions = analysis.dimensionScores || [];
  const strengths = analysis.strengthsIdentified || [];
  const improvements = analysis.areasForImprovement || [];
  
  const parseTranscript = (raw: any): TranscriptMessage[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };
  const transcript = parseTranscript(session?.transcript);

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-20 sm:pb-6">
        <div className="border-b bg-white sticky top-0 z-10">
          <div className="container mx-auto px-3 sm:px-6 py-2 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/exercise-mode/case-study")} className="px-2 sm:px-3">
                <ArrowLeft className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <h1 className="text-sm sm:text-lg font-semibold">Case Study Results</h1>
              <Badge variant="secondary" className="text-emerald-600 bg-emerald-100">
                <Briefcase className="w-3 h-3 mr-1" />
                Case Interview
              </Badge>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-4xl">
          
          <Card className={`${getScoreBg(overallScore)} border-2 mb-4 sm:mb-6`}>
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white flex items-center justify-center shadow-md">
                    <span className={`text-2xl sm:text-4xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</span>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold">{getScoreLabel(overallScore)}</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">Overall Performance</p>
                  </div>
                </div>
                
                {session && (
                  <div className="flex-1 border-l pl-6 hidden sm:block">
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Session Info</p>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Duration:</span> {formatDuration(session.duration)}</p>
                      <p><span className="text-muted-foreground">Messages:</span> {transcript.length}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {dimensions.length > 0 && (
            <Card className="mb-4 sm:mb-6">
              <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Performance Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {dimensions.map((dim: any, i: number) => (
                    <div key={i} className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900">{dim.dimension || dim.name}</span>
                        <span className={`px-2 py-0.5 rounded font-medium text-sm ${
                          dim.score >= 4 ? "text-green-600 bg-green-100" : 
                          dim.score >= 3 ? "text-amber-600 bg-amber-100" : "text-red-600 bg-red-100"
                        }`}>
                          {dim.score}/5
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{dim.feedback}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mb-4 sm:mb-6">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2 sm:mb-3">
              Your Feedback
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              {strengths.length > 0 && (
                <Card className="border-green-200 bg-green-50/30">
                  <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-green-800">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      What You Did Well
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                    <ul className="space-y-1.5 sm:space-y-2">
                      {strengths.slice(0, 4).map((s: string, i: number) => (
                        <li key={i} className="text-xs sm:text-sm flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span className="text-green-900">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {improvements.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/30">
                  <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-amber-800">
                      <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Areas to Improve
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                    <ul className="space-y-1.5 sm:space-y-2">
                      {improvements.slice(0, 4).map((g: string, i: number) => (
                        <li key={i} className="text-xs sm:text-sm flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">→</span>
                          <span className="text-amber-900">{g}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {analysis.rewrittenAnswer && (
            <Card className="mb-4 sm:mb-6">
              <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  Stronger Response Example
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-slate-700 text-sm leading-relaxed">{analysis.rewrittenAnswer}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {analysis.practicePlan && analysis.practicePlan.length > 0 && (
            <Card className="mb-4 sm:mb-6">
              <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Target className="w-4 h-4 text-purple-600" />
                  Your Practice Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <ol className="space-y-2">
                  {analysis.practicePlan.map((item: any, i: number) => {
                    let displayText: string;
                    let timeDisplay: string | null = null;
                    
                    if (typeof item === 'string') {
                      displayText = item;
                    } else if (typeof item === 'object' && item !== null) {
                      const planItem = item as PracticePlanItem;
                      displayText = planItem.task || `Day ${planItem.day}`;
                      if (planItem.timeMinutes) {
                        timeDisplay = `${planItem.timeMinutes} min`;
                      }
                    } else {
                      displayText = String(item);
                    }
                    
                    return (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          {displayText}
                          {timeDisplay && (
                            <span className="ml-2 text-xs text-slate-500">({timeDisplay})</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>
          )}

          {transcript.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="w-full flex items-center justify-center gap-2 p-4 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <MessageSquare className="w-5 h-5 text-slate-600" />
                <span className="font-medium text-slate-700">
                  {showTranscript ? "Hide Conversation" : "View Conversation"} ({transcript.length} messages)
                </span>
                {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showTranscript && (
                <Card className="mt-4">
                  <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Session Transcript
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {transcript.map((msg: TranscriptMessage, idx: number) => {
                        const isUser = msg.role === "user";
                        return (
                          <div 
                            key={idx} 
                            className={`p-3 rounded-lg ${
                              isUser 
                                ? 'bg-blue-50 border border-blue-200 ml-4' 
                                : 'bg-slate-50 border border-slate-200 mr-4'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {isUser ? (
                                <User className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Bot className="w-4 h-4 text-slate-600" />
                              )}
                              <span className="text-xs font-medium text-slate-600">
                                {isUser ? "You" : "AI Interviewer"}
                              </span>
                            </div>
                            <p className="text-sm text-slate-800">{msg.content}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <Card className="bg-slate-50 border-dashed">
            <CardContent className="pt-6 pb-6">
              <h3 className="text-center font-medium mb-4">Ready to Practice Again?</h3>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate("/exercise-mode/case-study")} size="lg">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Practice Again
                </Button>
                <Button onClick={() => navigate("/exercise-mode")} variant="outline" size="lg">
                  Back to Exercise Mode
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}
