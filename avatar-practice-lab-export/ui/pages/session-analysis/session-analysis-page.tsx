import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsDashboard } from "@/components/ai-session-analysis/analytics-dashboard";
import { SkillAssessmentDisplay } from "@/components/ai-session-analysis/skill-assessment-display";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  ArrowLeft, 
  Target, 
  Lightbulb, 
  MessageSquare, 
  RefreshCw, 
  Zap, 
  ThumbsUp, 
  ThumbsDown,
  Trophy,
  TrendingUp,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import ModernDashboardLayout from "@/components/layout/modern-dashboard-layout";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import { useState } from "react";
import {
  ConversationBlueprint,
  getObjectiveById,
  getSkillLensById,
  getCounterPersonaById,
  COUNTER_PERSONA_ARCHETYPES,
} from "@/lib/conversation-framework";

export default function SessionAnalysisPage() {
  const [searchParams] = useSearchParams();
  const sessionType = searchParams.get("type");
  const sessionId = searchParams.get("sid");
  const transcriptId = searchParams.get("tid") || null;
  const skillId = searchParams.get("skill");
  const scenarioId = searchParams.get("scenario");
  const blueprintParam = searchParams.get("blueprint");
  const navigate = useNavigate();
  
  const [objectiveAchieved, setObjectiveAchieved] = useState<boolean | null>(null);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);

  const blueprint: ConversationBlueprint | null = (() => {
    if (!blueprintParam) return null;
    try {
      return JSON.parse(decodeURIComponent(blueprintParam));
    } catch (e) {
      console.error("Failed to parse blueprint:", e);
      return null;
    }
  })();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/avatar/session-analysis", transcriptId],
    queryFn: async () => {
      const response = await fetch("/api/avatar/session-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcriptId,
          sessionId,
          sessionType,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || data?.message);
      }
      return data;
    },
    enabled: !!transcriptId,
  });

  const handleBackToScenarios = () => {
    if (skillId) {
      navigate(`/avatar/practice?skill=${skillId}`);
    } else {
      navigate("/avatar/start");
    }
  };

  const handleCreateNewSession = () => {
    if (skillId) {
      navigate(`/avatar/practice?skill=${skillId}`);
    } else {
      navigate("/avatar/start");
    }
  };

  const handleTryAgainWithTougherPersona = () => {
    if (blueprint) {
      const tougherPersonas = COUNTER_PERSONA_ARCHETYPES.filter(p => 
        p.id !== blueprint.counterPersona.archetype
      );
      const randomTougher = tougherPersonas[Math.floor(Math.random() * tougherPersonas.length)];
      
      const updatedBlueprint: ConversationBlueprint = {
        ...blueprint,
        counterPersona: {
          archetype: randomTougher.id,
          caresAbout: randomTougher.caresAbout,
          pressureResponse: randomTougher.pressureResponse,
          trigger: randomTougher.trigger,
        },
      };
      
      const encodedBlueprint = encodeURIComponent(JSON.stringify(updatedBlueprint));
      navigate(`/avatar/practice/pre-session?blueprint=${encodedBlueprint}&source=retry`);
    } else {
      navigate("/avatar/start");
    }
  };

  const handleTryAgainSameScenario = () => {
    if (blueprint) {
      const encodedBlueprint = encodeURIComponent(JSON.stringify(blueprint));
      navigate(`/avatar/practice/pre-session?blueprint=${encodedBlueprint}&source=retry`);
    } else if (scenarioId && skillId) {
      navigate(`/avatar/practice/pre-session?scenario=${scenarioId}&skill=${skillId}`);
    } else {
      navigate("/avatar/start");
    }
  };

  const extractKeyMoments = (messages: any[]) => {
    if (!messages || messages.length === 0) return [];
    
    const keyMoments: { type: string; message: any; reason: string }[] = [];
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const isUser = msg.speaker?.toLowerCase() === "user" || msg.speaker?.toLowerCase() === "you";
      const text = msg.text?.toLowerCase() || "";
      
      if (isUser) {
        if (text.includes("?") && (text.includes("what") || text.includes("how") || text.includes("why"))) {
          keyMoments.push({ type: "good_question", message: msg, reason: "Asked a probing question" });
        }
        if (text.includes("i understand") || text.includes("i hear you") || text.includes("that makes sense")) {
          keyMoments.push({ type: "acknowledgment", message: msg, reason: "Showed active listening" });
        }
        if (text.includes("i think") || text.includes("my view is") || text.includes("i believe")) {
          keyMoments.push({ type: "assertion", message: msg, reason: "Made a clear assertion" });
        }
      } else {
        if (text.includes("but") || text.includes("however") || text.includes("i disagree")) {
          keyMoments.push({ type: "pushback", message: msg, reason: "Avatar pushed back - tension point" });
        }
      }
    }
    
    return keyMoments.slice(0, 3);
  };

  const getOneThingToTry = (analysis: any, blueprint: ConversationBlueprint | null) => {
    const suggestions = [
      { condition: () => analysis?.questionsAsked < 2, text: "Ask more open-ended questions to understand the other person's perspective before presenting your view." },
      { condition: () => analysis?.interruptions > 0, text: "Practice letting the other person finish their thought completely before responding." },
      { condition: () => analysis?.fillerWords?.length > 2, text: "Pause and collect your thoughts instead of using filler words - silence is powerful." },
      { condition: () => analysis?.userTalkPercentage > 70, text: "Try to balance the conversation more - aim for 50/50 talk time to ensure you're listening." },
      { condition: () => analysis?.userTalkPercentage < 30, text: "Share more of your perspective - the other person wants to hear your thoughts too." },
      { condition: () => blueprint?.userObjective === "set_boundaries", text: "Be more direct about your limits - use 'I statements' to clearly define what you can and cannot do." },
      { condition: () => blueprint?.userObjective === "influence", text: "Lead with questions that help the other person discover the answer themselves." },
      { condition: () => true, text: "Try summarizing the other person's points before presenting your own - it builds trust and shows you've listened." },
    ];

    for (const s of suggestions) {
      if (s.condition()) return s.text;
    }
    return suggestions[suggestions.length - 1].text;
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return "bg-green-100 border-green-200";
    if (score >= 6) return "bg-amber-100 border-amber-200";
    return "bg-red-100 border-red-200";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Good Progress";
    if (score >= 4) return "Keep Practicing";
    return "Needs Work";
  };

  if (isLoading) {
    return (
      <ModernDashboardLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Analyzing your session...</p>
          </div>
        </div>
      </ModernDashboardLayout>
    );
  }

  if (error) {
    return (
      <ModernDashboardLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error loading your session analysis</p>
            <Button onClick={handleBackToScenarios}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Practice
            </Button>
          </div>
        </div>
      </ModernDashboardLayout>
    );
  }

  if (!data || !data.analysis) {
    return (
      <ModernDashboardLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
              <p className="text-muted-foreground mb-6">Start a new practice session to see your analysis.</p>
              <Button onClick={handleCreateNewSession}>
                <Plus className="w-4 h-4 mr-2" />
                Start New Session
              </Button>
            </CardContent>
          </Card>
        </div>
      </ModernDashboardLayout>
    );
  }

  const analysis = data.analysis;
  const messages = data.transcriptMessage?.messages || data.transcript?.messages || [];
  const keyMoments = extractKeyMoments(messages);
  const oneThingToTry = getOneThingToTry(analysis, blueprint);
  const skillAssessments = data.skillAssessments;
  
  const objective = blueprint?.userObjective ? getObjectiveById(blueprint.userObjective) : null;
  const skillLens = blueprint?.skillLens?.primary ? getSkillLensById(blueprint.skillLens.primary) : null;
  const counterPersona = blueprint?.counterPersona?.archetype ? getCounterPersonaById(blueprint.counterPersona.archetype) : null;

  const overallScore = analysis.overallScore || 0;
  const strengths = analysis.strengths || analysis.feedback?.strengths || [];
  const growthAreas = analysis.growthAreas || analysis.feedback?.growthAreas || [];

  return (
    <ModernDashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20 sm:pb-6">
        {/* Header */}
        <div className="border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-3 sm:px-6 py-2 sm:py-3">
            {/* Mobile: Stack vertically */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleBackToScenarios} className="px-2 sm:px-3 shrink-0">
                  <ArrowLeft className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                <h1 className="text-sm sm:text-lg font-semibold whitespace-nowrap">Session Analysis</h1>
              </div>
              {blueprint?.scenarioSummary?.title && (
                <Badge variant="secondary" className="hidden sm:inline-flex text-xs truncate max-w-[150px]">
                  {blueprint.scenarioSummary.title}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-6xl">
          
          {/* ═══════════════════════════════════════════════════════════════
              SECTION 1: SESSION SUMMARY
              Your score + who you practiced with
          ═══════════════════════════════════════════════════════════════ */}
          <Card className={`${getScoreBg(overallScore)} border-2 mb-4 sm:mb-6`}>
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                {/* Score Circle */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white flex items-center justify-center shadow-md">
                    <span className={`text-2xl sm:text-4xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</span>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold">{getScoreLabel(overallScore)}</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">Overall Performance</p>
                  </div>
                </div>
                
                {/* Session Context - Who you practiced with */}
                {(counterPersona || skillLens || objective) && (
                  <>
                    {/* Desktop: side by side */}
                    <div className="flex-1 border-l pl-6 hidden sm:block">
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Practice Session</p>
                      <div className="space-y-1">
                        {counterPersona && (
                          <p className="text-sm"><span className="text-muted-foreground">With:</span> {counterPersona.label}</p>
                        )}
                        {objective && (
                          <p className="text-sm"><span className="text-muted-foreground">Goal:</span> {objective.label}</p>
                        )}
                        {skillLens && (
                          <p className="text-sm"><span className="text-muted-foreground">Skill:</span> {skillLens.label}</p>
                        )}
                      </div>
                    </div>
                    {/* Mobile: below score */}
                    <div className="w-full border-t pt-4 mt-2 sm:hidden">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {counterPersona && (
                          <Badge variant="outline" className="text-xs">With: {counterPersona.label}</Badge>
                        )}
                        {objective && (
                          <Badge variant="outline" className="text-xs">Goal: {objective.label}</Badge>
                        )}
                        {skillLens && (
                          <Badge variant="outline" className="text-xs">Skill: {skillLens.label}</Badge>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 2: CONVERSATION SNAPSHOT  
              Quick metrics with clear labels
          ═══════════════════════════════════════════════════════════════ */}
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Conversation Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{Math.round(analysis.userTalkPercentage || 0)}%</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">Talk Time</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
                    {(analysis.userTalkPercentage || 0) > 60 ? "You led the conversation" : 
                     (analysis.userTalkPercentage || 0) < 40 ? "Good listening balance" : "Balanced discussion"}
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-purple-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">{analysis.questionsAsked || 0}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">Questions</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
                    {(analysis.questionsAsked || 0) >= 3 ? "Great curiosity shown" : 
                     (analysis.questionsAsked || 0) === 0 ? "Try asking more" : "Keep exploring"}
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-emerald-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-emerald-600">{analysis.engagementLevel || 0}/10</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">Engagement</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
                    {(analysis.engagementLevel || 0) >= 8 ? "Highly engaged" : 
                     (analysis.engagementLevel || 0) >= 6 ? "Good participation" : "Room to grow"}
                  </div>
                </div>
                <div className={`text-center p-2 sm:p-3 rounded-lg ${(analysis.interruptions || 0) > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <div className={`text-xl sm:text-2xl font-bold ${(analysis.interruptions || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {analysis.interruptions || 0}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">Interruptions</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
                    {(analysis.interruptions || 0) === 0 ? "Great patience!" : "Let them finish"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 3: RECOMMENDATIONS
              What to focus on + strengths + areas to improve
          ═══════════════════════════════════════════════════════════════ */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2 sm:mb-3">
              Your Feedback
            </h3>
            
            {/* Primary Recommendation */}
            <Card className="border-2 border-blue-200 bg-blue-50/50 mb-3 sm:mb-4">
              <CardContent className="pt-3 sm:pt-5 pb-3 sm:pb-5 px-3 sm:px-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1 text-sm sm:text-base">One Thing to Try Next Time</h4>
                    <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">{oneThingToTry}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Strengths & Growth in Grid */}
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Strengths */}
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
                      {strengths.slice(0, 3).map((s: string, i: number) => (
                        <li key={i} className="text-xs sm:text-sm flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span className="text-green-900">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Growth Areas */}
              {growthAreas.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/30">
                  <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-amber-800">
                      <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Areas to Improve
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                    <ul className="space-y-1.5 sm:space-y-2">
                      {growthAreas.slice(0, 3).map((g: string, i: number) => (
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

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 4: CONVERSATION HIGHLIGHTS
              Key moments from the conversation
          ═══════════════════════════════════════════════════════════════ */}
          {keyMoments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Key Moments from Your Conversation
              </h3>
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {keyMoments.map((moment, idx) => {
                      const isUser = moment.message.speaker?.toLowerCase() === "user" || moment.message.speaker?.toLowerCase() === "you";
                      return (
                        <div 
                          key={idx} 
                          className={`p-4 rounded-lg ${
                            isUser 
                              ? 'bg-blue-50 border border-blue-200' 
                              : 'bg-amber-50 border border-amber-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant={isUser ? "default" : "secondary"} 
                              className="text-xs"
                            >
                              {isUser ? "You" : "Avatar"}
                            </Badge>
                            <span className="text-xs font-medium text-muted-foreground">
                              {moment.reason}
                            </span>
                          </div>
                          <p className="text-sm italic">
                            "{moment.message.text}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 5: SKILL FRAMEWORK ASSESSMENT
              Detailed skill-based analysis
          ═══════════════════════════════════════════════════════════════ */}
          {skillAssessments && skillAssessments.summary && skillAssessments.summary.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="text-base sm:text-lg font-semibold">Skill Assessment Results</h3>
                <Badge variant="secondary" className="ml-2 text-xs">Detailed Analysis</Badge>
              </div>
              <SkillAssessmentDisplay 
                summary={skillAssessments.summary} 
                dimensions={skillAssessments.dimensions || []} 
              />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 6: DEEP DIVE ANALYTICS  
              Full detailed analysis (expandable)
          ═══════════════════════════════════════════════════════════════ */}
          <div className="mb-6">
            <button
              onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
              className="w-full flex items-center justify-center gap-2 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">
                {showDetailedAnalysis ? "Hide Detailed Analytics" : "View Detailed Analytics"}
              </span>
            </button>

            <div className={showDetailedAnalysis ? "mt-4" : "hidden"}>
              <AnalyticsDashboard 
                analysis={analysis}
                transcript={data.transcript}
                transcriptMessages={data.transcriptMessage}
                skillAssessments={skillAssessments}
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 7: NEXT STEPS
              Action buttons
          ═══════════════════════════════════════════════════════════════ */}
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="pt-6 pb-6">
              <h3 className="text-center font-medium mb-4">Ready to Practice Again?</h3>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handleTryAgainSameScenario} size="lg">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                {blueprint && (
                  <Button onClick={handleTryAgainWithTougherPersona} variant="outline" size="lg">
                    <Zap className="w-4 h-4 mr-2" />
                    Tougher Persona
                  </Button>
                )}
                <Button onClick={handleCreateNewSession} variant="ghost" size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  New Scenario
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Objective Check - moved to bottom as optional self-reflection */}
          {blueprint && objective && (
            <Card className="mt-6 border-primary/20 bg-primary/5">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-4">
                  <Target className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Did you achieve your objective?</h4>
                    <p className="text-sm text-muted-foreground mb-3">{objective.label}: {objective.description}</p>
                    
                    {objectiveAchieved === null ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="hover:bg-green-50 hover:border-green-500 hover:text-green-700"
                          onClick={() => setObjectiveAchieved(true)}
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          Yes, I did
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="hover:bg-amber-50 hover:border-amber-500 hover:text-amber-700"
                          onClick={() => setObjectiveAchieved(false)}
                        >
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          Not yet
                        </Button>
                      </div>
                    ) : (
                      <Badge variant={objectiveAchieved ? "default" : "secondary"}>
                        {objectiveAchieved ? "Objective achieved!" : "Keep practicing - you'll get there!"}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <MobileBottomNav />
    </ModernDashboardLayout>
  );
}
