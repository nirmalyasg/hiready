import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  Target, 
  TrendingUp, 
  Award, 
  CheckCircle, 
  AlertTriangle, 
  ChevronRight,
  Share2,
  Copy,
  Check,
  Briefcase,
  Code,
  Users,
  Zap,
  Play,
  ArrowUp,
  ArrowDown,
  Clock,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";

interface DimensionScore {
  dimension: string;
  avgScore: number;
  count: number;
}

interface InterviewTypeBreakdown {
  interviewType: string;
  weight: number;
  weightedScore: number;
  attemptCount: number;
  bestScore: number | null;
  latestScore: number | null;
  latestSessionId: number | null;
  dimensions: DimensionScore[];
}

interface HireadyIndexData {
  overallScore: number;
  readinessLevel: string;
  totalSessions: number;
  lastUpdated: string;
  breakdown: InterviewTypeBreakdown[];
  strengths: string[];
  improvements: string[];
  trend: "improving" | "stable" | "declining";
  previousScore: number | null;
}

const INTERVIEW_TYPE_WEIGHTS: Record<string, number> = {
  technical: 3.0,
  coding: 2.5,
  system_design: 2.5,
  case_study: 2.0,
  product_sense: 2.0,
  behavioral: 1.5,
  hr: 1.5,
  hiring_manager: 1.5,
  general: 1.0,
  panel: 1.5,
  skill_practice: 1.0,
};

const getReadinessConfig = (level: string) => {
  const configs: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
    exceptional: { label: "Exceptional", color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-300" },
    strong: { label: "Strong", color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-300" },
    ready: { label: "Ready", color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-300" },
    developing: { label: "Developing", color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-300" },
    not_ready: { label: "Needs Work", color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-300" },
  };
  return configs[level] || configs.developing;
};

const getInterviewTypeIcon = (type: string) => {
  if (type.includes('coding') || type.includes('technical') || type.includes('system')) return Code;
  if (type.includes('behavioral') || type.includes('hr') || type.includes('hiring')) return Users;
  if (type.includes('case') || type.includes('product')) return Zap;
  return Briefcase;
};

const formatInterviewType = (type: string) => {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-500";
};

const getProgressColor = (score: number) => {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
};

export default function HireadyIndexPage() {
  const navigate = useNavigate();
  const [indexData, setIndexData] = useState<HireadyIndexData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchHireadyIndex = async () => {
      try {
        const response = await fetch("/api/interview-progress/hiready-index", {
          credentials: "include",
        });
        const data = await response.json();
        if (data.success) {
          setIndexData(data.hireadyIndex);
        }
      } catch (error) {
        console.error("Error fetching Hiready index:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHireadyIndex();
  }, []);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const response = await fetch('/api/interview-progress/share-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ expiresInDays: 30 }),
      });
      const data = await response.json();
      if (data.success) {
        const fullUrl = `${window.location.origin}/share/${data.token}`;
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

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner />
        </div>
      </SidebarLayout>
    );
  }

  if (!indexData || indexData.totalSessions === 0) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-[#fbfbfc]">
          <div className="bg-gradient-to-br from-[#000000] via-[#000000] to-[#000000] text-white py-16">
            <div className="max-w-4xl mx-auto px-4 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-[#24c4b8]" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Build Your Hiready Index</h2>
              <p className="text-white/70 mb-8 max-w-md mx-auto">
                Complete interview practice sessions to build your personalized readiness score.
              </p>
              <Link to="/interview">
                <Button className="bg-[#24c4b8] hover:bg-[#1db0a5] text-white px-8 py-3 rounded-xl shadow-lg shadow-[#24c4b8]/25">
                  Start Your First Interview
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const readinessConfig = getReadinessConfig(indexData.readinessLevel);
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (indexData.overallScore / 100) * circumference;
  const scoreDelta = indexData.previousScore ? indexData.overallScore - indexData.previousScore : 0;

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#fbfbfc] pb-24 sm:pb-8">
        <div className="bg-[#000000] text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
            <Link
              to="/avatar/results"
              className="inline-flex items-center text-white/70 hover:text-white mb-4 text-sm font-medium transition-colors group"
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1 group-hover:-translate-x-0.5 transition-transform" />
              Back to Results
            </Link>

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-white/10"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="text-[#24c4b8] transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold text-white">{indexData.overallScore}</span>
                    <span className="text-sm text-white/60">/ 100</span>
                  </div>
                </div>

                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-[#24c4b8]" />
                    <span className="text-[#24c4b8] text-sm font-semibold uppercase tracking-wide">Hiready Index™</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">Your Interview Readiness</h1>
                  
                  <div className="flex items-center gap-3 mt-3">
                    <Badge className={`${readinessConfig.bgColor} ${readinessConfig.color} border ${readinessConfig.borderColor} text-sm px-3 py-1`}>
                      {readinessConfig.label}
                    </Badge>
                    {scoreDelta !== 0 && (
                      <span className={`text-sm flex items-center gap-1 ${scoreDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {scoreDelta > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                        {Math.abs(scoreDelta)} pts
                      </span>
                    )}
                  </div>

                  <p className="text-white/60 text-sm mt-3">
                    Based on {indexData.totalSessions} interview{indexData.totalSessions !== 1 ? 's' : ''} • 
                    Updated {format(new Date(indexData.lastUpdated), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Link to="/interview">
                  <Button className="bg-[#24c4b8] hover:bg-[#1db0a5] text-white gap-2">
                    <Play className="w-4 h-4" />
                    Practice More
                  </Button>
                </Link>
                {shareUrl ? (
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleShare}
                    disabled={isSharing}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    {isSharing ? 'Sharing...' : 'Share Score'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-5xl space-y-6">
          <Card className="border-slate-200 rounded-2xl">
            <CardHeader className="border-b border-slate-100 bg-[#fbfbfc]">
              <CardTitle className="flex items-center gap-2 text-[#000000]">
                <BarChart3 className="w-5 h-5 text-[#24c4b8]" />
                Interview Type Breakdown
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Weighted scores based on interview type importance
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {indexData.breakdown.length > 0 ? (
                indexData.breakdown.map((item, idx) => {
                  const TypeIcon = getInterviewTypeIcon(item.interviewType);
                  const scorePercent = (item.weightedScore / 100) * (item.weight / 3);
                  
                  return (
                    <div 
                      key={item.interviewType} 
                      className={`p-4 sm:p-5 ${idx !== indexData.breakdown.length - 1 ? "border-b border-slate-100" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                            <TypeIcon className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{formatInterviewType(item.interviewType)}</h4>
                            <p className="text-xs text-slate-500">
                              {item.attemptCount} attempt{item.attemptCount !== 1 ? 's' : ''} • 
                              Weight: {item.weight.toFixed(1)}x
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-2xl font-bold ${getScoreColor(item.weightedScore)}`}>
                            {item.weightedScore}
                          </span>
                          <span className="text-slate-400 text-sm">/100</span>
                          {item.latestSessionId && (
                            <Link
                              to={`/interview/results?sessionId=${item.latestSessionId}`}
                              className="block text-xs text-[#24c4b8] hover:underline mt-1"
                            >
                              View latest →
                            </Link>
                          )}
                        </div>
                      </div>
                      
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${getProgressColor(item.weightedScore)}`}
                          style={{ width: `${item.weightedScore}%` }}
                        />
                      </div>

                      {item.bestScore !== item.latestScore && item.bestScore !== null && (
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          Best: {item.bestScore}/100 • Latest: {item.latestScore}/100
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <Target className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                  <p className="text-slate-500">Complete interviews to see your breakdown</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-emerald-200 bg-emerald-50/30 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle className="w-5 h-5" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {indexData.strengths.length > 0 ? (
                  <ul className="space-y-3">
                    {indexData.strengths.map((s, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-emerald-700/70">Complete more interviews to identify your strengths</p>
                )}
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
                {indexData.improvements.length > 0 ? (
                  <ul className="space-y-3">
                    {indexData.improvements.map((i, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                        {i}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-amber-700/70">Complete more interviews to identify improvement areas</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="bg-[#000000] rounded-2xl p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Improve Your Score</h3>
                <p className="text-white/70 text-sm">
                  {indexData.improvements.length > 0 
                    ? `Focus on ${indexData.improvements[0]} to boost your Hiready Index`
                    : 'Keep practicing to maintain and improve your score'}
                </p>
              </div>
              <Link to="/interview">
                <Button className="bg-[#24c4b8] hover:bg-[#1db0a5] text-white gap-2">
                  <Play className="w-4 h-4" />
                  Practice Interview
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
