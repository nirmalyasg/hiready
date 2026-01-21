import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  CheckCircle, 
  TrendingUp, 
  Award, 
  ArrowRight, 
  Briefcase, 
  BarChart3, 
  Code, 
  Users, 
  Zap,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Activity,
  Trophy
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ReadinessBand {
  band: string;
  label: string;
  description: string;
}

interface InterviewTypeReport {
  interviewType: string;
  interviewTypeLabel: string;
  relevantSkills: string[];
  overallMetrics: {
    overallScore: number | null;
    readinessBand: ReadinessBand | null;
    totalAttempts: number;
    analyzedAttempts: number;
  };
  attempts: Array<{
    sessionId: number;
    attemptNumber: number;
    createdAt: string;
    overallScore: number | null;
    dimensionScores: Array<{ dimension: string; score: number }>;
    strengths: string[];
    improvements: string[];
  }>;
  progressionData: Array<{ attemptNumber: number; date: string; score: number | null }>;
  dimensionAverages: Array<{ dimension: string; avgScore: number; percentile: number }>;
}

interface FullReportData {
  user: { displayName: string };
  role: {
    name: string;
    companyContext: string | null;
    archetypeId: string | null;
  };
  overallScore: number | null;
  readinessBand: ReadinessBand | null;
  totalSessions: number;
  totalInterviewTypes: number;
  allSkills: string[];
  skillsByInterviewType: Record<string, string[]>;
  interviewTypeReports: InterviewTypeReport[];
  lastUpdated: string;
}

const getBandConfig = (band: string) => {
  const configs: Record<string, { color: string; bgColor: string; borderColor: string; hexColor: string }> = {
    interview_ready: { color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-300", hexColor: "#059669" },
    strong_foundation: { color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-300", hexColor: "#3B82F6" },
    developing: { color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-300", hexColor: "#D97706" },
    early_stage: { color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-300", hexColor: "#DC2626" },
  };
  return configs[band] || configs.developing;
};

const getProgressColor = (score: number) => {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 55) return "bg-blue-500";
  if (score >= 35) return "bg-amber-500";
  return "bg-red-500";
};

const getScoreColor = (score: number) => {
  if (score >= 75) return "text-emerald-600";
  if (score >= 55) return "text-blue-600";
  if (score >= 35) return "text-amber-600";
  return "text-red-500";
};

const getInterviewTypeIcon = (type: string) => {
  if (type.includes('coding') || type.includes('technical') || type.includes('system') || type.includes('sql')) return Code;
  if (type.includes('behavioral') || type.includes('hr') || type.includes('hiring')) return Users;
  if (type.includes('case') || type.includes('product')) return Zap;
  return Briefcase;
};

export default function PublicSharePage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [data, setData] = useState<FullReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchFullReport = async () => {
      if (!shareToken) {
        setError("Invalid share link");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/interview-progress/share/${shareToken}/full-report`);
        const result = await response.json();
        
        if (result.success && result.fullReport) {
          setData(result.fullReport);
          if (result.fullReport.interviewTypeReports?.length > 0) {
            setExpandedTypes(new Set([result.fullReport.interviewTypeReports[0].interviewType]));
          }
        } else {
          setError(result.error || "Scorecard not found");
        }
      } catch (err) {
        setError("Failed to load scorecard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFullReport();
  }, [shareToken]);

  const toggleInterviewType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Scorecard Not Found</h2>
            <p className="text-gray-600 mb-6">{error || "This scorecard may have been removed or expired."}</p>
            <Link to="/">
              <Button className="bg-[#ee7e65] hover:bg-[#e06d54] text-white">
                Create Your Own
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bandConfig = data.readinessBand ? getBandConfig(data.readinessBand.band) : null;
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = data.overallScore 
    ? circumference - (data.overallScore / 100) * circumference 
    : circumference;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
            <Target className="w-5 h-5 text-[#ee7e65]" />
            <span className="text-white font-semibold">Hiready Index™</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{data.role.name}</h1>
          {data.role.companyContext && (
            <p className="text-white/70 mb-2">at {data.role.companyContext}</p>
          )}
          <p className="text-white/50 text-sm">
            Complete interview readiness report by {data.user.displayName}
          </p>
        </div>

        {/* Overall Score Card */}
        <Card className={`border-2 ${bandConfig?.borderColor || 'border-gray-200'} shadow-2xl mb-6`}>
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4">
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle cx="72" cy="72" r="60" strokeWidth="10" fill="none" className="stroke-gray-200" />
                  <circle
                    cx="72" cy="72" r="60" strokeWidth="10" fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{ stroke: bandConfig?.hexColor || '#9CA3AF' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-gray-900">{data.overallScore ?? '-'}</span>
                  <span className="text-sm text-gray-500">/ 100</span>
                </div>
              </div>
              
              {data.readinessBand && (
                <Badge className={`${bandConfig?.bgColor} ${bandConfig?.color} border ${bandConfig?.borderColor} text-lg px-4 py-1`}>
                  <Award className="w-4 h-4 mr-2" />
                  {data.readinessBand.label}
                </Badge>
              )}
              
              {data.readinessBand && (
                <p className="text-gray-600 text-sm mt-2 text-center max-w-xs">
                  {data.readinessBand.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Activity className="w-4 h-4 text-[#ee7e65]" />
                  <span>{data.totalSessions} sessions</span>
                </div>
                <div className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <span>{data.totalInterviewTypes} interview types</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interview Type Reports */}
        {data.interviewTypeReports.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#ee7e65]" />
                Detailed Analysis by Interview Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.interviewTypeReports.map((report) => {
                const Icon = getInterviewTypeIcon(report.interviewType);
                const isExpanded = expandedTypes.has(report.interviewType);
                const typeBandConfig = report.overallMetrics.readinessBand 
                  ? getBandConfig(report.overallMetrics.readinessBand.band)
                  : null;

                return (
                  <div key={report.interviewType} className="border rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleInterviewType(report.interviewType)}
                      className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          typeBandConfig?.bgColor || 'bg-gray-100'
                        }`}>
                          <Icon className={`w-5 h-5 ${typeBandConfig?.color || 'text-gray-500'}`} />
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900">{report.interviewTypeLabel}</h4>
                          <p className="text-sm text-gray-500">
                            {report.overallMetrics.totalAttempts} attempt{report.overallMetrics.totalAttempts !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {report.overallMetrics.overallScore !== null && (
                          <div className="text-right">
                            <span className={`text-2xl font-bold ${getScoreColor(report.overallMetrics.overallScore)}`}>
                              {report.overallMetrics.overallScore}%
                            </span>
                          </div>
                        )}
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-6 space-y-6 border-t">
                        {/* JD-Specific Skills - Show first */}
                        {report.relevantSkills && report.relevantSkills.length > 0 && (
                          <div className="p-4 bg-gradient-to-r from-[#ee7e65]/10 to-transparent rounded-lg border border-[#ee7e65]/20">
                            <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                              <Target className="w-4 h-4 text-[#ee7e65]" />
                              Skills Being Assessed
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {report.relevantSkills.map((skill, i) => (
                                <Badge key={i} className="bg-[#ee7e65]/10 text-gray-700 border-[#ee7e65]/30">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Interview Performance Rubric */}
                        {report.dimensionAverages.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Interview Performance</h5>
                            <div className="grid sm:grid-cols-2 gap-3">
                              {report.dimensionAverages.map((dim) => (
                                <div key={dim.dimension} className="flex items-center gap-3">
                                  <div className="flex-1">
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className="text-gray-600">{dim.dimension}</span>
                                      <span className={`font-medium ${getScoreColor(dim.percentile)}`}>
                                        {dim.avgScore.toFixed(1)}/5
                                      </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${getProgressColor(dim.percentile)}`}
                                        style={{ width: `${dim.percentile}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Progression Chart */}
                        {report.progressionData.length > 1 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Score Progression</h5>
                            <div className="h-40">
                              {/* @ts-expect-error recharts type compatibility */}
                              <ResponsiveContainer width="100%" height="100%">
                                {/* @ts-expect-error recharts type compatibility */}
                                <LineChart data={report.progressionData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                  {/* @ts-expect-error recharts type compatibility */}
                                  <XAxis dataKey="attemptNumber" tick={{ fontSize: 11 }} />
                                  {/* @ts-expect-error recharts type compatibility */}
                                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(val: number) => `${val}%`} />
                                  <Tooltip formatter={(value: number) => [`${value}%`, 'Score']} />
                                  {/* @ts-expect-error recharts type compatibility */}
                                  <Line type="monotone" dataKey="score" stroke="#ee7e65" strokeWidth={2} dot={{ fill: '#ee7e65' }} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}

                        {/* Attempt History */}
                        {report.attempts.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Attempt History</h5>
                            <div className="space-y-2">
                              {report.attempts.slice().reverse().slice(0, 5).map((attempt) => (
                                <div 
                                  key={attempt.sessionId}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                                      #{attempt.attemptNumber}
                                    </div>
                                    <span className="text-sm text-gray-600">
                                      {format(new Date(attempt.createdAt), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                  {attempt.overallScore !== null && (
                                    <span className={`font-bold ${getScoreColor(attempt.overallScore)}`}>
                                      {attempt.overallScore}%
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Skills Summary */}
        {data.allSkills.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Skills Practiced
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.allSkills.slice(0, 15).map((skill, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {data.allSkills.length > 15 && (
                  <Badge variant="secondary" className="text-xs">
                    +{data.allSkills.length - 15} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <div className="text-center">
          <p className="text-white/50 text-sm mb-4">
            Want to build your own interview readiness score?
          </p>
          <Link to="/">
            <Button className="bg-[#ee7e65] hover:bg-[#e06d54] text-white">
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="text-center mt-8 text-white/30 text-xs">
          Last updated: {format(new Date(data.lastUpdated), 'MMM d, yyyy')} • Powered by hiready.app
        </div>
      </div>
    </div>
  );
}
