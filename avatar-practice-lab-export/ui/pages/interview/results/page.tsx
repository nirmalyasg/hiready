import { useState, useEffect } from "react";
import { ChevronRight, TrendingUp, Target, CheckCircle, AlertTriangle, Calendar, ArrowRight, Award, MessageSquare, Lightbulb, Star, BarChart3, Briefcase, Play, ArrowUp } from "lucide-react";
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

interface ReadinessData {
  readinessScore: number;
  previousScore: number;
  readinessDelta: number;
  overallTrend: "improving" | "stable" | "declining";
  strongestDimensions: { dimension: string; avgScore: number; trend: string }[];
  weakestDimensions: { dimension: string; avgScore: number; trend: string }[];
}

const getRecommendationConfig = (rec: string) => {
  const configs: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    strong_yes: { label: "Strong Yes", color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200", icon: Award },
    yes: { label: "Yes", color: "text-green-700", bgColor: "bg-green-50 border-green-200", icon: CheckCircle },
    lean_yes: { label: "Lean Yes", color: "text-lime-700", bgColor: "bg-lime-50 border-lime-200", icon: TrendingUp },
    lean_no: { label: "Lean No", color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200", icon: AlertTriangle },
    no: { label: "No", color: "text-red-700", bgColor: "bg-red-50 border-red-200", icon: AlertTriangle },
  };
  return configs[rec] || configs.lean_yes;
};

const getScoreColor = (score: number) => {
  if (score >= 4) return "text-emerald-600";
  if (score >= 3) return "text-amber-600";
  return "text-red-600";
};

const getScoreLabel = (score: number) => {
  if (score >= 4.5) return "Excellent";
  if (score >= 4) return "Strong";
  if (score >= 3) return "Satisfactory";
  if (score >= 2) return "Needs Work";
  return "Weak";
};

export default function InterviewResultsPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);
  const [jobContext, setJobContext] = useState<JobContext | null>(null);
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
          if (data.jobContext) {
            setJobContext(data.jobContext);
            // Fetch readiness data for the job
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
        <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Analysis Not Found</h2>
              <p className="text-slate-600 mb-6">We couldn't find the interview analysis. It may still be processing.</p>
              <Link to="/interview">
                <Button>Back to Interview Practice</Button>
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white pb-24 sm:pb-8">
        <div className="bg-gradient-to-br from-indigo-500/5 via-white to-purple-50/30 border-b border-slate-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
            <Link
              to="/interview"
              className="inline-flex items-center text-slate-500 hover:text-indigo-600 mb-4 text-sm font-medium transition-colors group"
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1 group-hover:-translate-x-0.5 transition-transform" />
              Back to Interview Practice
            </Link>
            
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Interview Analysis</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Your Interview Results
            </h1>
            {jobContext ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="bg-white/50 gap-1">
                  <Briefcase className="w-3 h-3" />
                  {jobContext.roleTitle}
                </Badge>
                {jobContext.companyName && (
                  <Badge variant="outline" className="bg-white/50">
                    {jobContext.companyName}
                  </Badge>
                )}
                {(readinessData?.readinessScore ?? jobContext.readinessScore) !== null && (
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 gap-1">
                    {readinessData?.readinessScore ?? jobContext.readinessScore}% Ready
                    {readinessData?.readinessDelta !== undefined && readinessData.readinessDelta > 0 && (
                      <ArrowUp className="w-3 h-3" />
                    )}
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-sm sm:text-base text-slate-600">
                Detailed feedback and actionable recommendations to help you improve.
              </p>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-5xl">
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            {recConfig && (
              <Card className={`${recConfig.bgColor} border rounded-2xl`}>
                <CardContent className="p-6 text-center">
                  <RecIcon className={`w-12 h-12 ${recConfig.color} mx-auto mb-3`} />
                  <h3 className={`text-2xl font-bold ${recConfig.color} mb-1`}>{recConfig.label}</h3>
                  <p className="text-sm text-slate-600">Overall Recommendation</p>
                  {analysis.confidenceLevel && (
                    <Badge variant="outline" className="mt-2 capitalize">
                      {analysis.confidenceLevel} Confidence
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="border-slate-200 rounded-2xl">
              <CardContent className="p-6 text-center">
                <div className={`text-4xl font-bold ${getScoreColor(averageScore)} mb-1`}>
                  {averageScore.toFixed(1)}<span className="text-xl text-slate-400">/5</span>
                </div>
                <p className="text-sm text-slate-600 mb-2">Average Score</p>
                <Progress value={averageScore * 20} className="h-2" />
                <p className="text-xs text-slate-500 mt-2">{getScoreLabel(averageScore)}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 rounded-2xl">
              <CardContent className="p-6">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  Key Wins
                </h4>
                <ul className="space-y-2">
                  {analysis.wins?.slice(0, 3).map((win, idx) => (
                    <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{win}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {analysis.summary && (
            <Card className="border-slate-200 rounded-2xl mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed">{analysis.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Readiness Impact Section */}
          {readinessData && (
            <Card className="border-purple-200 bg-purple-50/30 rounded-2xl mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-purple-700">{readinessData.readinessScore}%</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Job Readiness</h3>
                      <div className="flex items-center gap-2 text-sm">
                        {readinessData.readinessDelta !== 0 && (
                          <span className={`flex items-center gap-1 ${readinessData.readinessDelta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {readinessData.readinessDelta > 0 ? <ArrowUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                            {readinessData.readinessDelta > 0 ? '+' : ''}{readinessData.readinessDelta}% from last
                          </span>
                        )}
                        <Badge variant="outline" className={`capitalize ${
                          readinessData.overallTrend === 'improving' ? 'bg-emerald-50 text-emerald-700' :
                          readinessData.overallTrend === 'declining' ? 'bg-red-50 text-red-700' :
                          'bg-slate-50 text-slate-700'
                        }`}>
                          {readinessData.overallTrend}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {(readinessData.strongestDimensions?.length > 0 || readinessData.weakestDimensions?.length > 0) && (
                    <div className="grid grid-cols-2 gap-4 lg:gap-8">
                      <div>
                        <h4 className="text-xs uppercase text-slate-500 font-medium mb-2">Strongest Areas</h4>
                        {readinessData.strongestDimensions?.length > 0 ? (
                          <ul className="space-y-1">
                            {readinessData.strongestDimensions.slice(0, 2).map((dim, i) => (
                              <li key={i} className="text-sm text-emerald-700 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                {dim.dimension}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400">Complete more sessions</p>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs uppercase text-slate-500 font-medium mb-2">Focus Areas</h4>
                        {readinessData.weakestDimensions?.length > 0 ? (
                          <ul className="space-y-1">
                            {readinessData.weakestDimensions.slice(0, 2).map((dim, i) => (
                              <li key={i} className="text-sm text-amber-700 flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {dim.dimension}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400">Complete more sessions</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="scores" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
              <TabsTrigger value="scores">Scores</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="answers">Better Answers</TabsTrigger>
              <TabsTrigger value="plan">7-Day Plan</TabsTrigger>
            </TabsList>

            <TabsContent value="scores">
              <Card className="border-slate-200 rounded-2xl">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    Dimension Scores (8 Rubric Dimensions)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {analysis.dimensionScores?.map((dim, idx) => (
                    <div key={idx} className={`p-4 ${idx !== (analysis.dimensionScores?.length || 0) - 1 ? "border-b border-slate-100" : ""}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-slate-900">{dim.dimension}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${getScoreColor(dim.score)}`}>{dim.score}</span>
                          <span className="text-slate-400">/5</span>
                        </div>
                      </div>
                      <Progress value={dim.score * 20} className="h-2 mb-3" />
                      <p className="text-sm text-slate-600 mb-2">{dim.rationale}</p>
                      {dim.improvement && (
                        <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-lg">
                          <Lightbulb className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-indigo-800">{dim.improvement}</p>
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
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                    Improved Answer Examples
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {analysis.betterAnswers?.map((ba, idx) => (
                    <div key={idx} className={`p-5 ${idx !== (analysis.betterAnswers?.length || 0) - 1 ? "border-b border-slate-100" : ""}`}>
                      <div className="mb-3">
                        <Badge variant="outline" className="mb-2">Question</Badge>
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
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    7-Day Practice Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {analysis.practicePlan?.map((day, idx) => (
                    <div key={idx} className={`p-4 flex items-start gap-4 ${idx !== (analysis.practicePlan?.length || 0) - 1 ? "border-b border-slate-100" : ""}`}>
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs text-indigo-600 font-medium">Day</span>
                        <span className="text-lg font-bold text-indigo-700">{day.day}</span>
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
          {jobContext && (
            <div className="mt-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold mb-1">Keep Building Your Readiness</h3>
                  <p className="text-white/80 text-sm">
                    Continue practicing for {jobContext.roleTitle}
                    {jobContext.companyName && ` at ${jobContext.companyName}`}
                  </p>
                </div>
                <Link to={`/interview/custom?jobId=${jobContext.id}`}>
                  <Button className="bg-white text-purple-700 hover:bg-white/90 gap-2 w-full sm:w-auto">
                    <Play className="w-4 h-4" />
                    Practice Again
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/interview">
              <Button variant="outline" size="lg" className="rounded-xl w-full sm:w-auto">
                Practice Another Role
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" className="rounded-xl w-full sm:w-auto">
                Return to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
