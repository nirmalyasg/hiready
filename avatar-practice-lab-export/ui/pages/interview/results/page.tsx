import { useState, useEffect } from "react";
import { ChevronRight, TrendingUp, Target, CheckCircle, AlertTriangle, Calendar, ArrowRight, Award, MessageSquare, Lightbulb, Star, BarChart3, Briefcase, Play, ArrowUp, Building2, Code, Users, Zap, BookOpen, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useSearchParams } from "react-router-dom";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface DimensionScore {
  dimension: string;
  score: number;
  evidence: string[];
  rationale: string;
  improvement: string;
}

interface BetterAnswer {
  question: string;
  betterAnswer: string;
}

interface PracticePlanDay {
  day: number;
  task: string;
  timeMinutes: number;
}

interface InterviewAnalysis {
  id: number;
  overallRecommendation: string | null;
  confidenceLevel: string | null;
  summary: string | null;
  dimensionScores: DimensionScore[] | null;
  strengths: string[] | null;
  risks: string[] | null;
  roleFitNotes: string[] | null;
  betterAnswers: BetterAnswer[] | null;
  practicePlan: PracticePlanDay[] | null;
  wins: string[] | null;
  improvements: string[] | null;
}

interface JobContext {
  id: string;
  roleTitle: string;
  companyName: string | null;
  readinessScore: number | null;
}

interface RoleKitInfo {
  id: number;
  name: string;
  domain: string;
}

interface ReadinessData {
  readinessScore: number;
  previousScore: number;
  readinessDelta: number;
  overallTrend: "improving" | "stable" | "declining";
  strongestDimensions: { dimension: string; avgScore: number; trend: string }[];
  weakestDimensions: { dimension: string; avgScore: number; trend: string }[];
}

const getRecommendationConfig = (rec: string) => {
  const configs: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: any }> = {
    strong_yes: { label: "Strong Yes", color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", icon: Award },
    yes: { label: "Yes", color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-200", icon: CheckCircle },
    lean_yes: { label: "Lean Yes", color: "text-lime-700", bgColor: "bg-lime-50", borderColor: "border-lime-200", icon: TrendingUp },
    lean_no: { label: "Lean No", color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200", icon: AlertTriangle },
    no: { label: "No", color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200", icon: AlertTriangle },
  };
  return configs[rec] || configs.lean_yes;
};

const getScoreColor = (score: number) => {
  if (score >= 4) return "text-emerald-600";
  if (score >= 3) return "text-amber-600";
  return "text-red-500";
};

const getScoreBg = (score: number) => {
  if (score >= 4) return "bg-emerald-50 border-emerald-200";
  if (score >= 3) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
};

const getScoreLabel = (score: number) => {
  if (score >= 4.5) return "Excellent";
  if (score >= 4) return "Strong";
  if (score >= 3) return "Satisfactory";
  if (score >= 2) return "Needs Work";
  return "Weak";
};

const getInterviewTypeIcon = (type: string | null) => {
  if (!type) return Briefcase;
  const t = type.toLowerCase();
  if (t.includes('coding') || t.includes('technical')) return Code;
  if (t.includes('behavioral') || t.includes('leadership')) return Users;
  if (t.includes('case') || t.includes('problem')) return Zap;
  return Briefcase;
};

const getInterviewTypeLabel = (type: string | null, mode: string | null) => {
  const value = type || mode || 'general';
  return value.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export default function InterviewResultsPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);
  const [jobContext, setJobContext] = useState<JobContext | null>(null);
  const [roleKitInfo, setRoleKitInfo] = useState<RoleKitInfo | null>(null);
  const [interviewType, setInterviewType] = useState<string | null>(null);
  const [interviewMode, setInterviewMode] = useState<string | null>(null);
  const [jdSkills, setJdSkills] = useState<string[]>([]);
  const [readinessData, setReadinessData] = useState<ReadinessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!sessionId) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/interview/analysis/${sessionId}`);
        const data = await response.json();
        if (data.success) {
          setAnalysis(data.analysis);
          setInterviewType(data.interviewType);
          setInterviewMode(data.interviewMode);
          setRoleKitInfo(data.roleKitInfo);
          setJdSkills(data.jdSkills || []);
          
          if (data.jobContext) {
            setJobContext(data.jobContext);
            try {
              const readinessRes = await fetch(`/api/jobs/job-targets/${data.jobContext.id}/readiness`, {
                credentials: 'include'
              });
              const readinessJson = await readinessRes.json();
              if (readinessJson.success) {
                setReadinessData({
                  readinessScore: readinessJson.readinessScore,
                  previousScore: readinessJson.previousScore,
                  readinessDelta: readinessJson.readinessDelta,
                  overallTrend: readinessJson.overallTrend,
                  strongestDimensions: readinessJson.strongestDimensions,
                  weakestDimensions: readinessJson.weakestDimensions,
                });
              }
            } catch (e) {
              console.error("Error fetching readiness:", e);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching analysis:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalysis();
  }, [sessionId]);

  const averageScore = analysis?.dimensionScores
    ? analysis.dimensionScores.reduce((sum, d) => sum + d.score, 0) / analysis.dimensionScores.length
    : 0;

  const practiceTitle = jobContext?.roleTitle || roleKitInfo?.name || "Interview Practice";
  const practiceSubtitle = jobContext?.companyName || (roleKitInfo?.domain ? roleKitInfo.domain.replace(/_/g, ' ') : null);
  const InterviewIcon = getInterviewTypeIcon(interviewType || interviewMode);

  // Identify skill gaps - dimensions with score < 3.5
  const skillGaps = analysis?.dimensionScores?.filter(d => d.score < 3.5) || [];
  const strongSkills = analysis?.dimensionScores?.filter(d => d.score >= 4) || [];

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner />
        </div>
      </SidebarLayout>
    );
  }

  if (!analysis) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
          <Card className="max-w-md mx-4 border-slate-200">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-[#042c4c] mb-2">Analysis Not Found</h2>
              <p className="text-slate-600 mb-6">We couldn't find the interview analysis. It may still be processing.</p>
              <Link to="/interview">
                <Button className="bg-[#ee7e65] hover:bg-[#d96a52]">Back to Interview Practice</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </SidebarLayout>
    );
  }

  const recConfig = analysis.overallRecommendation ? getRecommendationConfig(analysis.overallRecommendation) : null;
  const RecIcon = recConfig?.icon || CheckCircle;

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#f8f9fb] pb-24 sm:pb-8">
        {/* Header with Practice Context */}
        <div className="bg-gradient-to-br from-[#042c4c] via-[#0a3d66] to-[#042c4c] text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
            <Link
              to="/avatar/results"
              className="inline-flex items-center text-white/70 hover:text-white mb-4 text-sm font-medium transition-colors group"
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1 group-hover:-translate-x-0.5 transition-transform" />
              Back to Results
            </Link>
            
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <InterviewIcon className="w-5 h-5 text-[#ee7e65]" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold">{practiceTitle}</h1>
                    {practiceSubtitle && (
                      <p className="text-white/70 text-sm flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span className="capitalize">{practiceSubtitle}</span>
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Badge className="bg-white/10 text-white border-white/20 gap-1">
                    <InterviewIcon className="w-3 h-3" />
                    {getInterviewTypeLabel(interviewType, interviewMode)}
                  </Badge>
                  {(readinessData?.readinessScore ?? jobContext?.readinessScore) !== null && (
                    <Badge className="bg-[#ee7e65]/20 text-[#ee7e65] border-[#ee7e65]/30 gap-1">
                      {readinessData?.readinessScore ?? jobContext?.readinessScore}% Ready
                      {readinessData?.readinessDelta !== undefined && readinessData.readinessDelta > 0 && (
                        <ArrowUp className="w-3 h-3" />
                      )}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Quick Score Summary */}
              <div className="flex items-center gap-4 bg-white/10 rounded-xl p-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${averageScore >= 3 ? 'text-emerald-400' : 'text-[#ee7e65]'}`}>
                    {averageScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-white/60">out of 5</div>
                </div>
                {recConfig && (
                  <div className={`px-3 py-1.5 rounded-lg ${recConfig.bgColor} ${recConfig.borderColor} border`}>
                    <div className={`text-sm font-semibold ${recConfig.color}`}>{recConfig.label}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-5xl">
          {/* Role Fit Assessment */}
          {(skillGaps.length > 0 || strongSkills.length > 0 || jdSkills.length > 0) && (
            <Card className="border-[#042c4c]/10 rounded-2xl mb-6 overflow-hidden">
              <div className="bg-gradient-to-r from-[#042c4c] to-[#0a3d66] p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#ee7e65]" />
                  Role Fit Assessment
                  {jobContext && <span className="text-white/60 font-normal text-sm ml-2">for {jobContext.roleTitle}</span>}
                </h3>
              </div>
              <CardContent className="p-4 sm:p-6 space-y-6">
                {/* JD Skills Match */}
                {jdSkills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-[#042c4c] mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#768c9c]" />
                      Skills from Job Description
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {jdSkills.slice(0, 10).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="bg-[#042c4c]/5 border-[#042c4c]/20 text-[#042c4c]">
                          {skill}
                        </Badge>
                      ))}
                      {jdSkills.length > 10 && (
                        <Badge variant="outline" className="bg-slate-100 text-slate-600">
                          +{jdSkills.length - 10} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <h4 className="text-sm font-medium text-emerald-800 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Strong Areas ({strongSkills.length})
                    </h4>
                    {strongSkills.length > 0 ? (
                      <ul className="space-y-2">
                        {strongSkills.slice(0, 3).map((skill, idx) => (
                          <li key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-emerald-900">{skill.dimension}</span>
                            <span className="font-semibold text-emerald-700">{skill.score}/5</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-emerald-700/70">Keep practicing to build your strengths</p>
                    )}
                  </div>
                  
                  {/* Gaps */}
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <h4 className="text-sm font-medium text-amber-800 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Areas to Improve ({skillGaps.length})
                    </h4>
                    {skillGaps.length > 0 ? (
                      <ul className="space-y-2">
                        {skillGaps.slice(0, 3).map((skill, idx) => (
                          <li key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-amber-900">{skill.dimension}</span>
                            <span className="font-semibold text-amber-700">{skill.score}/5</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-amber-700/70">Great job! No major gaps identified</p>
                    )}
                  </div>
                </div>
                
                {/* Recommendations */}
                {skillGaps.length > 0 && (
                  <div className="bg-[#ee7e65]/5 rounded-xl p-4 border border-[#ee7e65]/20">
                    <h4 className="text-sm font-medium text-[#042c4c] mb-2 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#ee7e65]" />
                      Priority Focus
                    </h4>
                    <p className="text-sm text-slate-700">
                      Based on your results, focus on <span className="font-medium text-[#ee7e65]">{skillGaps[0]?.dimension}</span>
                      {skillGaps[1] && <> and <span className="font-medium text-[#ee7e65]">{skillGaps[1]?.dimension}</span></>} 
                      {' '}to improve your interview performance for this role.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Key Wins */}
          {analysis.wins && analysis.wins.length > 0 && (
            <Card className="border-slate-200 rounded-2xl mb-6">
              <CardContent className="p-4 sm:p-6">
                <h4 className="font-semibold text-[#042c4c] mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  Key Wins
                </h4>
                <ul className="space-y-3">
                  {analysis.wins.slice(0, 4).map((win, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-3 bg-slate-50 p-3 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{win}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {analysis.summary && (
            <Card className="border-slate-200 rounded-2xl mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-[#042c4c]">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed">{analysis.summary}</p>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="scores" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex bg-white border border-slate-200">
              <TabsTrigger value="scores" className="data-[state=active]:bg-[#042c4c] data-[state=active]:text-white">Skills</TabsTrigger>
              <TabsTrigger value="feedback" className="data-[state=active]:bg-[#042c4c] data-[state=active]:text-white">Feedback</TabsTrigger>
              <TabsTrigger value="answers" className="data-[state=active]:bg-[#042c4c] data-[state=active]:text-white">Better Answers</TabsTrigger>
              <TabsTrigger value="plan" className="data-[state=active]:bg-[#042c4c] data-[state=active]:text-white">7-Day Plan</TabsTrigger>
            </TabsList>

            <TabsContent value="scores">
              <Card className="border-slate-200 rounded-2xl">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="flex items-center gap-2 text-[#042c4c]">
                    <BarChart3 className="w-5 h-5 text-[#ee7e65]" />
                    {jobContext || roleKitInfo ? (
                      <span>Skills Assessed for {practiceTitle}</span>
                    ) : (
                      <span>Interview Skills Assessment</span>
                    )}
                  </CardTitle>
                  {(interviewType || interviewMode) && (
                    <p className="text-sm text-slate-500 mt-1">
                      {getInterviewTypeLabel(interviewType, interviewMode)} focus areas
                    </p>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  {analysis.dimensionScores?.map((dim, idx) => (
                    <div key={idx} className={`p-4 sm:p-5 ${idx !== (analysis.dimensionScores?.length || 0) - 1 ? "border-b border-slate-100" : ""}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-[#042c4c]">{dim.dimension}</h4>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getScoreBg(dim.score)} ${getScoreColor(dim.score)} border`}>
                            {getScoreLabel(dim.score)}
                          </Badge>
                          <span className={`text-lg font-bold ${getScoreColor(dim.score)}`}>{dim.score}</span>
                          <span className="text-slate-400">/5</span>
                        </div>
                      </div>
                      <Progress value={dim.score * 20} className="h-2 mb-4" />
                      <p className="text-sm text-slate-600 mb-3">{dim.rationale}</p>
                      {dim.improvement && (
                        <div className="flex items-start gap-3 p-3 bg-[#ee7e65]/5 rounded-xl border border-[#ee7e65]/20">
                          <Lightbulb className="w-4 h-4 text-[#ee7e65] flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-[#042c4c]">{dim.improvement}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feedback">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-emerald-200 bg-emerald-50/30 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle className="w-5 h-5" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {analysis.strengths?.map((s, idx) => (
                        <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50/30 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="w-5 h-5" />
                      Areas to Improve
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {analysis.improvements?.map((i, idx) => (
                        <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                          {i}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {analysis.risks && analysis.risks.length > 0 && (
                  <Card className="border-red-200 bg-red-50/30 rounded-2xl md:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-800">
                        <AlertTriangle className="w-5 h-5" />
                        Risk Flags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.risks.map((r, idx) => (
                          <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="answers">
              <Card className="border-slate-200 rounded-2xl">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2 text-[#042c4c]">
                    <MessageSquare className="w-5 h-5 text-[#ee7e65]" />
                    Improved Answer Examples
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {analysis.betterAnswers?.map((ba, idx) => (
                    <div key={idx} className={`p-5 ${idx !== (analysis.betterAnswers?.length || 0) - 1 ? "border-b border-slate-100" : ""}`}>
                      <div className="mb-3">
                        <Badge variant="outline" className="mb-2 text-[#042c4c]">Question</Badge>
                        <p className="text-slate-900 font-medium">{ba.question}</p>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                        <Badge className="bg-emerald-600 mb-2">Better Answer</Badge>
                        <p className="text-slate-700 whitespace-pre-wrap">{ba.betterAnswer}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plan">
              <Card className="border-slate-200 rounded-2xl">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2 text-[#042c4c]">
                    <Calendar className="w-5 h-5 text-[#ee7e65]" />
                    7-Day Practice Plan
                    {(jobContext || roleKitInfo) && (
                      <span className="text-sm font-normal text-slate-500 ml-2">
                        Tailored for {practiceTitle}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {analysis.practicePlan?.map((day, idx) => (
                    <div key={idx} className={`p-4 flex items-start gap-4 ${idx !== (analysis.practicePlan?.length || 0) - 1 ? "border-b border-slate-100" : ""}`}>
                      <div className="w-12 h-12 rounded-xl bg-[#042c4c] flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs text-white/60">Day</span>
                        <span className="text-lg font-bold text-white">{day.day}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-900 font-medium mb-1">{day.task}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Target className="w-3 h-3" />
                          {day.timeMinutes} minutes
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Next Steps CTA */}
          <div className="mt-8 bg-gradient-to-r from-[#042c4c] to-[#0a3d66] rounded-2xl p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Ready to Improve?</h3>
                <p className="text-white/70 text-sm">
                  {skillGaps.length > 0 
                    ? `Focus on ${skillGaps[0]?.dimension} in your next session`
                    : 'Keep practicing to maintain your skills'}
                </p>
              </div>
              <Link to="/interview">
                <Button className="bg-[#ee7e65] hover:bg-[#d96a52] text-white gap-2">
                  <Play className="w-4 h-4" />
                  Practice Again
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
