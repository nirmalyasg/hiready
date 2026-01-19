import { useState, useEffect } from "react";
import { ChevronRight, TrendingUp, Target, CheckCircle, AlertTriangle, ArrowRight, Award, MessageSquare, Lightbulb, Star, BarChart3, Briefcase, Play, ArrowUp, ArrowDown, Minus, Building2, Code, Users, Zap, BookOpen, GraduationCap, Share2, Copy, Check, RotateCcw, Clock, ChevronDown, ChevronUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

interface PlanData {
  objective?: string;
  skillsToAssess?: string[];
  roundCategory?: string;
  focusAreas?: string[];
  companyContext?: { companyName?: string; roleTitle?: string; archetype?: string };
}

interface ReadinessBand {
  band: string;
  label: string;
  description: string;
}

interface ReadinessData {
  readinessScore: number;
  previousScore: number;
  readinessDelta: number;
  overallTrend: "improving" | "stable" | "declining";
  strongestDimensions: { dimension: string; avgScore: number; trend: string }[];
  weakestDimensions: { dimension: string; avgScore: number; trend: string }[];
}

interface AttemptData {
  attemptNumber: number;
  sessionId: number;
  status: string;
  score: number | null;
  recommendation: string | null;
  createdAt: string;
  isBest: boolean;
  isLatest: boolean;
}

interface AssignmentWithAttempts {
  assignmentId: number;
  interviewType: string;
  roleKitId: number | null;
  jobTargetId: string | null;
  attemptCount: number;
  bestScore: number | null;
  latestScore: number | null;
  attempts: AttemptData[];
}

const getBandConfig = (band: string) => {
  const configs: Record<string, { color: string; bgColor: string; borderColor: string; ringColor: string; hexColor: string }> = {
    interview_ready: { color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-300", ringColor: "stroke-emerald-500", hexColor: "#059669" },
    strong_foundation: { color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-300", ringColor: "stroke-blue-500", hexColor: "#3B82F6" },
    developing: { color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-300", ringColor: "stroke-amber-500", hexColor: "#D97706" },
    early_stage: { color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-300", ringColor: "stroke-red-500", hexColor: "#DC2626" },
  };
  return configs[band] || configs.developing;
};

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

const getProgressColor = (score: number) => {
  if (score >= 4) return "bg-emerald-500";
  if (score >= 3) return "bg-blue-500";
  if (score >= 2) return "bg-amber-500";
  return "bg-red-500";
};

const getInterviewTypeIcon = (type: string | null) => {
  if (!type) return Briefcase;
  const t = type.toLowerCase();
  if (t.includes('coding') || t.includes('technical') || t.includes('sql') || t.includes('system')) return Code;
  if (t.includes('behavioral') || t.includes('hr') || t.includes('leadership') || t.includes('culture')) return Users;
  if (t.includes('case') || t.includes('problem') || t.includes('product')) return Zap;
  return Briefcase;
};

const getInterviewTypeLabel = (type: string | null, mode: string | null) => {
  const value = type || mode || 'general';
  return value.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const getTrendIcon = (scores: number[]) => {
  if (scores.length < 2) return <Minus className="w-4 h-4 text-gray-400" />;
  const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
  const secondHalf = scores.slice(Math.ceil(scores.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const diff = secondAvg - firstAvg;
  if (diff > 0.3) return <ArrowUp className="w-4 h-4 text-emerald-500" />;
  if (diff < -0.3) return <ArrowDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
};

export default function InterviewResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("sessionId");

  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);
  const [jobContext, setJobContext] = useState<JobContext | null>(null);
  const [roleKitInfo, setRoleKitInfo] = useState<RoleKitInfo | null>(null);
  const [interviewType, setInterviewType] = useState<string | null>(null);
  const [interviewMode, setInterviewMode] = useState<string | null>(null);
  const [jdSkills, setJdSkills] = useState<string[]>([]);
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [readinessBand, setReadinessBand] = useState<ReadinessBand | null>(null);
  const [readinessData, setReadinessData] = useState<ReadinessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [attemptHistory, setAttemptHistory] = useState<AssignmentWithAttempts | null>(null);
  const [isRetaking, setIsRetaking] = useState(false);
  const [showAttemptHistory, setShowAttemptHistory] = useState(false);
  const [configId, setConfigId] = useState<number | null>(null);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState<number | null>(null);

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
          setPlanData(data.planData || null);
          setReadinessBand(data.readinessBand || null);
          setConfigId(data.configId || null);
          setSessionDurationMinutes(data.sessionDurationMinutes || null);
          
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

          const attemptParams = new URLSearchParams();
          if (data.roleKitInfo?.id) attemptParams.set('roleKitId', data.roleKitInfo.id);
          if (data.jobContext?.id) attemptParams.set('jobTargetId', data.jobContext.id);
          if (data.interviewType) attemptParams.set('interviewType', data.interviewType);
          
          try {
            const attemptsRes = await fetch(`/api/interview-progress/attempts?${attemptParams.toString()}`, {
              credentials: 'include'
            });
            const attemptsData = await attemptsRes.json();
            if (attemptsData.success && attemptsData.assignments?.length > 0) {
              setAttemptHistory(attemptsData.assignments[0]);
            }
          } catch (e) {
            console.error("Error fetching attempt history:", e);
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
  const percentScore = (averageScore / 5) * 100;

  const handleShare = async () => {
    if (!sessionId) return;
    
    setIsSharing(true);
    try {
      const response = await fetch(`/api/interview/session/${sessionId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        const fullUrl = `${window.location.origin}/results/${data.shareToken}`;
        setShareUrl(fullUrl);
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRetake = async () => {
    if (!configId) return;
    
    setIsRetaking(true);
    try {
      const response = await fetch('/api/interview-progress/retake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ configId }),
      });
      const data = await response.json();
      if (data.success && data.configId) {
        navigate(`/interview/pre-session?configId=${data.configId}`);
      }
    } catch (error) {
      console.error('Error creating retake:', error);
    } finally {
      setIsRetaking(false);
    }
  };

  const currentAttempt = attemptHistory?.attempts?.find(a => a.sessionId === Number(sessionId));
  const attemptNumber = currentAttempt?.attemptNumber || 1;
  const totalAttempts = attemptHistory?.attemptCount || 1;

  const practiceTitle = jobContext?.roleTitle || roleKitInfo?.name || planData?.companyContext?.roleTitle || "Interview Practice";
  const practiceSubtitle = jobContext?.companyName || planData?.companyContext?.companyName || (roleKitInfo?.domain ? roleKitInfo.domain.replace(/_/g, ' ') : null);
  const InterviewIcon = getInterviewTypeIcon(interviewType || interviewMode);
  const skillsBeingAssessed = planData?.skillsToAssess?.length ? planData.skillsToAssess : jdSkills;

  const skillGaps = analysis?.dimensionScores?.filter(d => d.score < 3.5) || [];
  const strongSkills = analysis?.dimensionScores?.filter(d => d.score >= 4) || [];

  const bandConfig = readinessBand ? getBandConfig(readinessBand.band) : null;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentScore / 100) * circumference;

  const progressData = attemptHistory?.attempts
    ?.filter(a => a.score !== null)
    .map(a => ({
      attemptNumber: a.attemptNumber,
      date: format(new Date(a.createdAt), 'MMM d'),
      score: a.score,
    }))
    .reverse() || [];

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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Card className="max-w-md mx-4 border-slate-200">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Analysis Not Found</h2>
              <p className="text-slate-600 mb-6">We couldn't find the interview analysis. It may still be processing.</p>
              <Link to="/interview">
                <Button className="bg-slate-600 hover:bg-slate-700">Back to Interview Practice</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </SidebarLayout>
    );
  }

  const recConfig = analysis.overallRecommendation ? getRecommendationConfig(analysis.overallRecommendation) : null;

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#f8f9fb] pb-24 sm:pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-5xl space-y-6">
          
          <Link
            to={jobContext?.id ? `/jobs/${jobContext.id}` : "/avatar/results"}
            className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors group"
          >
            <ChevronRight className="w-4 h-4 rotate-180 mr-1 group-hover:-translate-x-0.5 transition-transform" />
            {jobContext?.id ? `Back to ${practiceTitle}` : 'Back to Results'}
          </Link>

          <Card className={`border-2 ${bandConfig?.borderColor || 'border-gray-200'} shadow-lg overflow-hidden`}>
            <div className={`${bandConfig?.bgColor || 'bg-gray-50'} p-6 sm:p-8`}>
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <svg className="w-28 h-28 sm:w-32 sm:h-32 transform -rotate-90">
                      <circle cx="50%" cy="50%" r="45" strokeWidth="8" fill="none" className="stroke-white/50" />
                      <circle
                        cx="50%" cy="50%" r="45" strokeWidth="8" fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ stroke: bandConfig?.hexColor || '#9CA3AF' }}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {averageScore.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500">out of 5</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    {readinessBand && (
                      <Badge className={`${bandConfig?.bgColor} ${bandConfig?.color} border ${bandConfig?.borderColor} text-sm px-2.5 py-0.5 mb-2`}>
                        <Award className="w-3.5 h-3.5 mr-1.5" />
                        {readinessBand.label}
                      </Badge>
                    )}
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-0.5 flex items-center gap-2">
                      <InterviewIcon className="w-5 h-5 text-[#24c4b8]" />
                      {getInterviewTypeLabel(interviewType, interviewMode)}
                    </h2>
                    <p className="text-gray-600 text-sm">{practiceTitle}</p>
                    {practiceSubtitle && (
                      <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        <span className="capitalize">{practiceSubtitle}</span>
                      </p>
                    )}
                    {readinessBand && (
                      <p className="text-xs text-gray-600 mt-2">{readinessBand.description}</p>
                    )}
                    {sessionDurationMinutes !== null && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Session duration: {sessionDurationMinutes} min</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:ml-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {recConfig && (
                    <div className={`px-3 py-1.5 rounded-lg ${recConfig.bgColor} ${recConfig.borderColor} border`}>
                      <div className={`text-sm font-semibold ${recConfig.color} flex items-center gap-1.5`}>
                        <recConfig.icon className="w-4 h-4" />
                        {recConfig.label}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {shareUrl ? (
                      <Button
                        onClick={handleCopyLink}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy Link'}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleShare}
                        disabled={isSharing}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        {isSharing ? 'Sharing...' : 'Share'}
                      </Button>
                    )}
                    
                    <Button
                      onClick={handleRetake}
                      disabled={isRetaking || !configId}
                      size="sm"
                      className="bg-[#cb6ce6] hover:bg-[#cb6ce6]/90 text-white gap-2"
                    >
                      <RotateCcw className={`w-4 h-4 ${isRetaking ? 'animate-spin' : ''}`} />
                      {isRetaking ? 'Starting...' : 'Retake'}
                    </Button>
                  </div>
                </div>
              </div>

              {attemptHistory && totalAttempts > 1 && (
                <div className="mt-4 pt-4 border-t border-white/30">
                  <button
                    onClick={() => setShowAttemptHistory(!showAttemptHistory)}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                  >
                    <Clock className="w-4 h-4" />
                    Attempt {attemptNumber} of {totalAttempts}
                    {currentAttempt?.isBest && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs py-0">Best</Badge>
                    )}
                    {showAttemptHistory ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                  </button>
                </div>
              )}
            </div>

            {showAttemptHistory && attemptHistory?.attempts && attemptHistory.attempts.length > 1 && (
              <div className="p-4 bg-white border-t space-y-3">
                <div className="flex flex-wrap gap-2">
                  {attemptHistory.attempts.map((attempt) => (
                    <Link
                      key={attempt.sessionId}
                      to={`/interview/results?sessionId=${attempt.sessionId}`}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        attempt.sessionId === Number(sessionId)
                          ? 'bg-[#24c4b8]/10 border border-[#24c4b8]/30'
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                      }`}
                    >
                      <span className="text-sm font-medium">#{attempt.attemptNumber}</span>
                      {attempt.score !== null ? (
                        <span className={`text-sm font-bold ${attempt.score >= 3 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {attempt.score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">--</span>
                      )}
                      {attempt.isBest && <Star className="w-3 h-3 text-amber-500" />}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {skillsBeingAssessed.length > 0 && (
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#24c4b8]" />
                  Skills Assessed in This Interview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {skillsBeingAssessed.slice(0, 12).map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="bg-[#24c4b8]/5 border-[#24c4b8]/20 text-gray-700">
                      {skill}
                    </Badge>
                  ))}
                  {skillsBeingAssessed.length > 12 && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-500">
                      +{skillsBeingAssessed.length - 12} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#24c4b8]/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#24c4b8]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{totalAttempts}</div>
                  <div className="text-xs text-gray-500">Total Attempts</div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{strongSkills.length}</div>
                  <div className="text-xs text-gray-500">Strong Areas</div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{skillGaps.length}</div>
                  <div className="text-xs text-gray-500">Needs Improvement</div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  {getTrendIcon(progressData.map(p => p.score || 0))}
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {attemptHistory?.bestScore?.toFixed(1) || averageScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">Best Score</div>
                </div>
              </div>
            </Card>
          </div>

          {progressData.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#24c4b8]" />
                  Progress Over Attempts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  {/* @ts-expect-error recharts type compatibility */}
                  <ResponsiveContainer width="100%" height="100%">
                    {/* @ts-expect-error recharts type compatibility */}
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      {/* @ts-expect-error recharts type compatibility */}
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      {/* @ts-expect-error recharts type compatibility */}
                      <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                      {/* @ts-expect-error recharts type compatibility */}
                      <Tooltip 
                        formatter={(value: number) => [`${value.toFixed(1)}/5`, 'Score']}
                        labelFormatter={(label: string) => `Attempt: ${label}`}
                      />
                      {/* @ts-expect-error recharts type compatibility */}
                      <Line type="monotone" dataKey="score" stroke="#24c4b8" strokeWidth={2} dot={{ fill: '#24c4b8', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#24c4b8]" />
                Dimension Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {analysis.dimensionScores?.map((dim, idx) => (
                <div key={idx} className={`p-4 sm:p-5 ${idx !== (analysis.dimensionScores?.length || 0) - 1 ? "border-b border-gray-100" : ""}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{dim.dimension}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${getScoreColor(dim.score)}`}>{dim.score.toFixed(1)}</span>
                      <span className="text-gray-400 text-sm">/5</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(dim.score)}`}
                      style={{ width: `${(dim.score / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{dim.rationale}</p>
                  {dim.improvement && (
                    <div className="flex items-start gap-2 p-2.5 bg-[#24c4b8]/5 rounded-lg border border-[#24c4b8]/10">
                      <Lightbulb className="w-4 h-4 text-[#24c4b8] flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">{dim.improvement}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-emerald-200 bg-emerald-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-emerald-800">
                  <CheckCircle className="w-5 h-5" />
                  What You Did Well
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {(analysis.strengths || analysis.wins)?.slice(0, 5).map((s, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="w-5 h-5" />
                  Focus Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {(analysis.improvements || analysis.risks)?.slice(0, 5).map((i, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                      {i}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {analysis.summary && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
              </CardContent>
            </Card>
          )}

          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#042c4c] to-[#0a3d68] text-white pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <MessageSquare className="w-5 h-5" />
                    Improved Answer Examples
                  </CardTitle>
                  <p className="text-white/70 text-sm mt-1">
                    Based on your profile and the {roleKitInfo?.name || planData?.companyContext?.roleTitle || 'target role'}
                  </p>
                </div>
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  {analysis.betterAnswers?.length || 0} questions
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {analysis.betterAnswers?.length ? (
                <div className="divide-y divide-gray-100">
                  {analysis.betterAnswers.map((ba, idx) => (
                    <div key={idx} className="p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#042c4c] text-white flex items-center justify-center text-sm font-semibold">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Interviewer Question</span>
                            </div>
                            <p className="text-gray-900 font-medium text-base leading-relaxed">{ba.question}</p>
                          </div>
                          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200/60">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                <Lightbulb className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-sm font-semibold text-emerald-700">Stronger Answer</span>
                              <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Personalized</span>
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{ba.betterAnswer}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-2">No specific answer improvements available</p>
                  <p className="text-gray-400 text-sm">Complete an interview session to see personalized feedback</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="bg-[#042c4c] rounded-2xl p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Ready to Improve?</h3>
                <p className="text-white/70 text-sm">
                  {skillGaps.length > 0 
                    ? `Focus on ${skillGaps[0]?.dimension} in your next session`
                    : 'Keep practicing to maintain your skills'}
                </p>
              </div>
              <Link to={jobContext?.id ? `/jobs/${jobContext.id}` : "/interview"}>
                <Button className="bg-[#24c4b8] hover:bg-[#1db0a5] text-white gap-2">
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
