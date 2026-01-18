import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Award,
  AlertCircle,
  CheckCircle2,
  XCircle,
  BarChart3,
  LineChart,
  BookOpen,
  Sparkles,
  Clock,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SkillSummary {
  skill: string;
  latestScore: number | null;
  avgScore: number | null;
  trend: "improving" | "declining" | "stable" | "insufficient_data";
  attemptCount: number;
  bestScore: number | null;
  evidenceSnippets: string[];
}

interface Attempt {
  sessionId: number;
  attemptNumber: number;
  createdAt: string;
  status: string;
  recommendation: string | null;
  summary: string | null;
  overallScore: number | null;
  dimensionScores: Array<{
    dimension: string;
    score: number;
    evidence: string[];
    rationale: string;
    improvement: string;
  }>;
  strengths: string[];
  improvements: string[];
  risks: string[];
  betterAnswers: Array<{ question: string; betterAnswer: string }>;
  resultsUrl: string;
}

interface InterviewTypeReport {
  role: {
    name: string;
    companyContext: string | null;
    archetypeId: string | null;
  };
  interviewType: string;
  interviewTypeLabel: string;
  relevantSkills: string[];
  overallMetrics: {
    overallScore: number | null;
    readinessBand: { band: string; label: string; description: string } | null;
    totalAttempts: number;
    analyzedAttempts: number;
    latestAttemptDate: string | null;
  };
  skillSummaries: SkillSummary[];
  skillCoverage: {
    covered: number;
    total: number;
    percentage: number;
    uncoveredSkills: string[];
  };
  dimensionAverages: Array<{ dimension: string; avgScore: number; percentile: number }>;
  typeSpecificMetrics: {
    focusAreas: string[];
    keyDimensions: Array<{ dimension: string; avgScore: number; percentile: number }>;
  };
  attempts: Attempt[];
  progressionData: Array<{ attemptNumber: number; date: string; score: number | null }>;
  topStrengths: Array<{ text: string; frequency: number }>;
  topImprovements: Array<{ text: string; frequency: number }>;
  commonRisks: string[];
  lastUpdated: string;
}

export default function InterviewTypeReportPage() {
  const { interviewType } = useParams<{ interviewType: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const roleKitId = searchParams.get("roleKitId");
  const jobTargetId = searchParams.get("jobTargetId");
  
  const [report, setReport] = useState<InterviewTypeReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAttempt, setExpandedAttempt] = useState<number | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        params.set("interviewType", interviewType || "");
        if (roleKitId) params.set("roleKitId", roleKitId);
        if (jobTargetId) params.set("jobTargetId", jobTargetId);
        
        const response = await fetch(`/api/interview-progress/interview-type-report?${params}`, {
          credentials: "include",
        });
        const data = await response.json();
        
        if (data.success && data.report) {
          setReport(data.report);
        } else {
          setError(data.message || "No data available for this interview type");
        }
      } catch (err) {
        console.error("Error fetching report:", err);
        setError("Failed to load interview type report");
      } finally {
        setIsLoading(false);
      }
    };

    if (interviewType) {
      fetchReport();
    }
  }, [interviewType, roleKitId, jobTargetId]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "declining":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case "stable":
        return <Minus className="w-4 h-4 text-gray-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRecommendationColor = (rec: string | null) => {
    switch (rec) {
      case "strong_yes":
        return "bg-green-100 text-green-800";
      case "yes":
        return "bg-green-50 text-green-700";
      case "lean_yes":
        return "bg-yellow-50 text-yellow-700";
      case "lean_no":
        return "bg-orange-50 text-orange-700";
      case "no":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatRecommendation = (rec: string | null) => {
    if (!rec) return "Pending";
    return rec.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-gray-400";
    if (score >= 75) return "text-green-600";
    if (score >= 55) return "text-yellow-600";
    if (score >= 35) return "text-orange-600";
    return "text-red-600";
  };

  const backUrl = `/hiready-index?${roleKitId ? `roleKitId=${roleKitId}` : `jobTargetId=${jobTargetId}`}`;

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-[#f8f9fb] p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#042c4c] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading detailed report...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error || !report) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-[#f8f9fb] p-6">
          <div className="max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => navigate(backUrl)} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to HiReady Index
            </Button>
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">No Data Available</h2>
                <p className="text-gray-500">{error || "Complete some interviews to see your detailed analysis."}</p>
                <Button onClick={() => navigate("/interview")} className="mt-4 bg-[#ee7e65] hover:bg-[#e06d54]">
                  Start Practicing
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#f8f9fb] p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => navigate(backUrl)} className="mb-2 -ml-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to HiReady Index
              </Button>
              <h1 className="text-2xl font-bold text-[#042c4c]">{report.interviewTypeLabel} Analysis</h1>
              <p className="text-gray-600">
                {report.role.name}
                {report.role.companyContext && ` at ${report.role.companyContext}`}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${getScoreColor(report.overallMetrics.overallScore)}`}>
                {report.overallMetrics.overallScore !== null ? `${report.overallMetrics.overallScore}%` : "--"}
              </div>
              {report.overallMetrics.readinessBand && (
                <Badge className="mt-1 bg-[#042c4c]">{report.overallMetrics.readinessBand.label}</Badge>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Attempts</p>
                    <p className="text-xl font-bold text-[#042c4c]">{report.overallMetrics.totalAttempts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Analyzed</p>
                    <p className="text-xl font-bold text-[#042c4c]">{report.overallMetrics.analyzedAttempts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Skill Coverage</p>
                    <p className="text-xl font-bold text-[#042c4c]">{report.skillCoverage.percentage}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Practice</p>
                    <p className="text-sm font-medium text-[#042c4c]">
                      {report.overallMetrics.latestAttemptDate
                        ? new Date(report.overallMetrics.latestAttemptDate).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progression Chart */}
          {report.progressionData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Performance Progression
                </CardTitle>
                <CardDescription>Your score trend across attempts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {/* @ts-expect-error - Recharts types incompatible with React 19 */}
                  <ResponsiveContainer width="100%" height="100%">
                    {/* @ts-expect-error - Recharts types incompatible with React 19 */}
                    <RechartsLineChart data={report.progressionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      {/* @ts-expect-error - Recharts types incompatible with React 19 */}
                      <XAxis 
                        dataKey="attemptNumber" 
                        label={{ value: "Attempt", position: "insideBottom", offset: -5 }}
                      />
                      {/* @ts-expect-error - Recharts types incompatible with React 19 */}
                      <YAxis domain={[0, 100]} label={{ value: "Score %", angle: -90, position: "insideLeft" }} />
                      <Tooltip 
                        formatter={(value: number) => [`${value}%`, "Score"]}
                        labelFormatter={(label) => `Attempt ${label}`}
                      />
                      {/* @ts-expect-error - Recharts types incompatible with React 19 */}
                      <Legend />
                      {/* @ts-expect-error - Recharts types incompatible with React 19 */}
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#ee7e65" 
                        strokeWidth={2}
                        dot={{ fill: "#ee7e65", strokeWidth: 2 }}
                        name="Performance Score"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Skills Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  JD Skills Assessment
                </CardTitle>
                <CardDescription>
                  Skills from job description mapped to this interview type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.skillSummaries.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No skills mapped to this interview type</p>
                ) : (
                  report.skillSummaries.map((skill, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-[#042c4c]">{skill.skill}</span>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(skill.trend)}
                          {skill.latestScore !== null ? (
                            <span className={`font-semibold ${getScoreColor(Math.round((skill.latestScore / 5) * 100))}`}>
                              {skill.latestScore.toFixed(1)}/5
                            </span>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </div>
                      </div>
                      {skill.attemptCount > 0 && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>Avg: {skill.avgScore?.toFixed(1)}/5</span>
                          <span>|</span>
                          <span>Best: {skill.bestScore?.toFixed(1)}/5</span>
                          <span>|</span>
                          <span>{skill.attemptCount} attempts</span>
                        </div>
                      )}
                      {skill.attemptCount === 0 && (
                        <p className="text-xs text-orange-600">Not yet assessed in this interview type</p>
                      )}
                    </div>
                  ))
                )}
                
                {/* Uncovered Skills */}
                {report.skillCoverage.uncoveredSkills.length > 0 && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm font-medium text-orange-700 mb-2">Skills Not Yet Practiced:</p>
                    <div className="flex flex-wrap gap-1">
                      {report.skillCoverage.uncoveredSkills.map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-orange-600 border-orange-300">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dimension Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Dimension Averages
                </CardTitle>
                <CardDescription>Average scores across all attempts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.dimensionAverages.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No dimension data available yet</p>
                ) : (
                  report.dimensionAverages.map((dim, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[#042c4c]">{dim.dimension}</span>
                        <span className={`text-sm font-semibold ${getScoreColor(dim.percentile)}`}>
                          {dim.avgScore.toFixed(1)}/5 ({dim.percentile}%)
                        </span>
                      </div>
                      <Progress value={dim.percentile} className="h-2" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Strengths and Improvements */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Award className="w-5 h-5" />
                  Top Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.topStrengths.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Complete more interviews to see patterns</p>
                ) : (
                  <ul className="space-y-2">
                    {report.topStrengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{strength.text}</span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          x{strength.frequency}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertCircle className="w-5 h-5" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.topImprovements.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Complete more interviews to see patterns</p>
                ) : (
                  <ul className="space-y-2">
                    {report.topImprovements.map((improvement, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{improvement.text}</span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          x{improvement.frequency}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Focus Areas for This Interview Type */}
          {report.typeSpecificMetrics.focusAreas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Focus Areas for {report.interviewTypeLabel}
                </CardTitle>
                <CardDescription>Key competencies evaluated in this interview type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {report.typeSpecificMetrics.focusAreas.map((area, idx) => (
                    <Badge key={idx} className="bg-[#042c4c]">
                      {area}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attempt History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Attempt History
              </CardTitle>
              <CardDescription>Detailed breakdown of each interview attempt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.attempts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No attempts recorded yet</p>
              ) : (
                report.attempts.map((attempt) => (
                  <div key={attempt.sessionId} className="border rounded-lg overflow-hidden">
                    <div
                      className="p-4 bg-gray-50 cursor-pointer flex items-center justify-between"
                      onClick={() => setExpandedAttempt(expandedAttempt === attempt.sessionId ? null : attempt.sessionId)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Attempt</div>
                          <div className="text-lg font-bold text-[#042c4c]">#{attempt.attemptNumber}</div>
                        </div>
                        <div>
                          <div className="font-medium text-[#042c4c]">
                            {new Date(attempt.createdAt).toLocaleDateString()}
                          </div>
                          <Badge className={getRecommendationColor(attempt.recommendation)}>
                            {formatRecommendation(attempt.recommendation)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Score</div>
                          <div className={`text-xl font-bold ${getScoreColor(attempt.overallScore)}`}>
                            {attempt.overallScore !== null ? `${attempt.overallScore}%` : "--"}
                          </div>
                        </div>
                        {expandedAttempt === attempt.sessionId ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {expandedAttempt === attempt.sessionId && (
                      <div className="p-4 border-t space-y-4">
                        {attempt.summary && (
                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">Summary</h4>
                            <p className="text-sm text-gray-600">{attempt.summary}</p>
                          </div>
                        )}

                        {attempt.dimensionScores.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">Dimension Scores</h4>
                            <div className="grid md:grid-cols-2 gap-2">
                              {attempt.dimensionScores.map((dim, idx) => (
                                <div key={idx} className="p-2 bg-gray-50 rounded">
                                  <div className="flex justify-between">
                                    <span className="text-sm">{dim.dimension}</span>
                                    <span className="text-sm font-medium">{dim.score}/5</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {attempt.strengths.length > 0 && (
                          <div>
                            <h4 className="font-medium text-green-700 mb-1">Strengths</h4>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {attempt.strengths.map((s, idx) => (
                                <li key={idx}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {attempt.improvements.length > 0 && (
                          <div>
                            <h4 className="font-medium text-orange-700 mb-1">Improvements</h4>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {attempt.improvements.map((i, idx) => (
                                <li key={idx}>{i}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="pt-2">
                          <Link to={attempt.resultsUrl}>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Full Results
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}
