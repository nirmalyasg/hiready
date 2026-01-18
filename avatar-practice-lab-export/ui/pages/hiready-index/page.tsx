import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Award, 
  CheckCircle, 
  AlertTriangle, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
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
  Minus,
  Clock,
  BarChart3,
  BarChart2,
  Activity,
  Trophy,
  Calendar,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';

interface RoleOption {
  id: number | string;
  name: string;
  type: "role_kit" | "job_target";
  archetypeId: string | null;
}

interface DimensionResult {
  key: string;
  label: string;
  score: number;
  weight: number;
  weightedScore: number;
}

interface InterviewBreakdown {
  interviewType: string;
  weight: number;
  attemptCount: number;
  latestScore: number | null;
  bestScore: number | null;
  latestSessionId: number | null;
  bestSessionId?: number | null;
}

interface ReadinessBand {
  band: string;
  label: string;
  description: string;
}

interface CapabilityMilestones {
  practiceVolume: number;
  bestAttempt: {
    score: number;
    sessionId: number | null;
    interviewType: string | null;
  };
  consistencyScore: number | null;
  coveragePercentage: number;
}

interface SessionScore {
  sessionId: number;
  date: string;
  score: number;
  interviewType: string;
}

interface HireadyIndexData {
  overallScore: number;
  readinessBand: ReadinessBand;
  role: {
    name: string;
    companyContext: string | null;
    archetypeId: string | null;
  };
  dimensions: DimensionResult[];
  dimensionWeights: Record<string, number>;
  interviewBreakdown: InterviewBreakdown[];
  totalSessions: number;
  strengths: string[];
  growthAreas: string[];
  trend: "improving" | "stable" | "declining";
  momentum?: "accelerating" | "steady" | "slowing" | null;
  previousScore: number | null;
  capabilityMilestones: CapabilityMilestones;
  progressTimeline: SessionScore[];
  lastUpdated: string;
}

interface InterviewTypeAnalysis {
  interviewType: string;
  sessions: Array<{
    sessionId: number;
    createdAt: string;
    recommendation: string | null;
    summary: string | null;
    dimensionScores: Array<{ dimension: string; score: number; evidence: string[]; rationale: string; improvement: string }>;
    strengths: string[];
    improvements: string[];
    risks: string[];
    betterAnswers: Array<{ question: string; betterAnswer: string }>;
  }>;
  relevantSkills: string[];
  aggregatedScore: number | null;
  overallRecommendation: string | null;
  topStrengths: string[];
  topImprovements: string[];
}

interface ComprehensiveAnalysisData {
  role: {
    name: string;
    companyContext: string | null;
    archetypeId: string | null;
  };
  allSkills: string[];
  skillsByInterviewType: Record<string, string[]>;
  interviewTypeAnalyses: InterviewTypeAnalysis[];
  consolidatedMetrics: {
    overallScore: number | null;
    readinessBand: ReadinessBand | null;
    strongestAreas: string[];
    weakestAreas: string[];
    totalInterviewTypes: number;
    totalSessions: number;
  };
  narrativeSummary: string;
  lastUpdated: string;
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

const getInterviewTypeIcon = (type: string) => {
  if (type.includes('coding') || type.includes('technical') || type.includes('system') || type.includes('sql')) return Code;
  if (type.includes('behavioral') || type.includes('hr') || type.includes('hiring')) return Users;
  if (type.includes('case') || type.includes('product')) return Zap;
  return Briefcase;
};

const formatInterviewType = (type: string) => {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const getScoreColor = (score: number) => {
  if (score >= 75) return "text-emerald-600";
  if (score >= 55) return "text-blue-600";
  if (score >= 35) return "text-amber-600";
  return "text-red-500";
};

const getProgressColor = (score: number) => {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 55) return "bg-blue-500";
  if (score >= 35) return "bg-amber-500";
  return "bg-red-500";
};

const getTrendIcon = (trend: string) => {
  if (trend === "up" || trend === "improving") return <ArrowUp className="w-4 h-4 text-emerald-500" />;
  if (trend === "down" || trend === "declining") return <ArrowDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
};

export default function HireadyIndexPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [indexData, setIndexData] = useState<HireadyIndexData | null>(null);
  const [comprehensiveData, setComprehensiveData] = useState<ComprehensiveAnalysisData | null>(null);
  const [roles, setRoles] = useState<{ roleKits: RoleOption[]; jobTargets: RoleOption[] }>({ roleKits: [], jobTargets: [] });
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingIndex, setIsLoadingIndex] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [expandedInterviewType, setExpandedInterviewType] = useState<string | null>(null);
  const [isLoadingComprehensive, setIsLoadingComprehensive] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch("/api/interview-progress/hiready-roles", {
          credentials: "include",
        });
        const data = await response.json();
        if (data.success) {
          setRoles(data.roles);
          
          const urlRoleKitId = searchParams.get('roleKitId');
          const urlJobTargetId = searchParams.get('jobTargetId');
          
          if (urlRoleKitId) {
            const role = data.roles.roleKits.find((r: RoleOption) => r.id === Number(urlRoleKitId));
            if (role) setSelectedRole(role);
          } else if (urlJobTargetId) {
            const role = data.roles.jobTargets.find((r: RoleOption) => r.id === urlJobTargetId);
            if (role) setSelectedRole(role);
          } else if (data.roles.roleKits.length > 0) {
            setSelectedRole(data.roles.roleKits[0]);
          } else if (data.roles.jobTargets.length > 0) {
            setSelectedRole(data.roles.jobTargets[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, [searchParams]);

  useEffect(() => {
    if (!selectedRole) return;

    const fetchHireadyIndex = async () => {
      setIsLoadingIndex(true);
      try {
        const params = new URLSearchParams();
        if (selectedRole.type === "role_kit") {
          params.set("roleKitId", String(selectedRole.id));
        } else {
          params.set("jobTargetId", String(selectedRole.id));
        }

        const response = await fetch(`/api/interview-progress/hiready-index?${params}`, {
          credentials: "include",
        });
        const data = await response.json();
        
        if (data.success && data.hireadyIndex) {
          setIndexData(data.hireadyIndex);
        } else {
          setIndexData(null);
        }
      } catch (error) {
        console.error("Error fetching Hiready index:", error);
        setIndexData(null);
      } finally {
        setIsLoadingIndex(false);
      }
    };

    fetchHireadyIndex();
  }, [selectedRole]);

  useEffect(() => {
    if (!selectedRole || !showDetailedAnalysis) return;

    const fetchComprehensiveAnalysis = async () => {
      setIsLoadingComprehensive(true);
      try {
        const params = new URLSearchParams();
        if (selectedRole.type === "role_kit") {
          params.set("roleKitId", String(selectedRole.id));
        } else {
          params.set("jobTargetId", String(selectedRole.id));
        }

        const response = await fetch(`/api/interview-progress/comprehensive-analysis?${params}`, {
          credentials: "include",
        });
        const data = await response.json();
        
        if (data.success && data.comprehensiveAnalysis) {
          setComprehensiveData(data.comprehensiveAnalysis);
        } else {
          setComprehensiveData(null);
        }
      } catch (error) {
        console.error("Error fetching comprehensive analysis:", error);
        setComprehensiveData(null);
      } finally {
        setIsLoadingComprehensive(false);
      }
    };

    fetchComprehensiveAnalysis();
  }, [selectedRole, showDetailedAnalysis]);

  const handleRoleSelect = (role: RoleOption) => {
    setSelectedRole(role);
    const params = new URLSearchParams();
    if (role.type === "role_kit") {
      params.set("roleKitId", String(role.id));
    } else {
      params.set("jobTargetId", String(role.id));
    }
    setSearchParams(params);
  };

  const handleShare = async () => {
    if (!selectedRole) return;
    setIsSharing(true);
    try {
      const body: any = { expiresInDays: 30 };
      if (selectedRole.type === "role_kit") {
        body.roleKitId = Number(selectedRole.id);
      } else {
        body.jobTargetId = String(selectedRole.id);
      }

      const response = await fetch("/api/interview-progress/share-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (data.success) {
        setShareUrl(data.shareUrl);
      }
    } catch (error) {
      console.error("Error generating share link:", error);
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const allRoles = [...roles.roleKits, ...roles.jobTargets];

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </SidebarLayout>
    );
  }

  if (allRoles.length === 0) {
    return (
      <SidebarLayout>
        <div className="p-6 max-w-4xl mx-auto">
          <Card className="text-center py-12">
            <CardContent>
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Practice Data Yet</h2>
              <p className="text-gray-600 mb-6">
                Complete at least one interview practice session to see your Hiready Index.
              </p>
              <Link to="/interview">
                <Button className="bg-[#24c4b8] hover:bg-[#1db0a5] text-white">
                  Start Your First Interview
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </SidebarLayout>
    );
  }

  const bandConfig = indexData ? getBandConfig(indexData.readinessBand.band) : null;
  const circumference = 2 * Math.PI * 50;
  const strokeDashoffset = indexData ? circumference - (indexData.overallScore / 100) * circumference : circumference;

  return (
    <SidebarLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Target className="w-8 h-8 text-[#24c4b8]" />
            Hiready Index
          </h1>
          <p className="text-gray-600 mt-1">Your interview readiness dashboard</p>
        </div>

        {/* Role Selector Rail */}
        {allRoles.length > 1 && (
          <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-3 min-w-max">
              {allRoles.map((role) => {
                const isSelected = selectedRole?.id === role.id && selectedRole?.type === role.type;
                return (
                  <button
                    key={`${role.type}-${role.id}`}
                    onClick={() => handleRoleSelect(role)}
                    className={`flex-shrink-0 p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-[#24c4b8] bg-[#24c4b8]/5 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-[#24c4b8]' : 'bg-gray-100'
                      }`}>
                        <Briefcase className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div className="text-left">
                        <div className={`font-semibold truncate max-w-[180px] ${
                          isSelected ? 'text-[#24c4b8]' : 'text-gray-900'
                        }`}>
                          {role.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {role.type === 'role_kit' ? 'Pre-built Role' : 'Custom Job'}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isLoadingIndex ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : !indexData ? (
          <Card className="text-center py-12">
            <CardContent>
              <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data for This Role</h3>
              <p className="text-gray-600 mb-4">You haven't practiced for this role yet.</p>
              <Link to="/interview">
                <Button className="bg-[#24c4b8] hover:bg-[#1db0a5] text-white">
                  Start Practicing
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className={`border-2 ${bandConfig?.borderColor} shadow-lg overflow-hidden`}>
              <div className={`${bandConfig?.bgColor} p-6 sm:p-8`}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <svg className="w-28 h-28 sm:w-36 sm:h-36 transform -rotate-90">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="50"
                          strokeWidth="8"
                          fill="none"
                          className="stroke-white/50"
                        />
                        <circle
                          cx="50%"
                          cy="50%"
                          r="50"
                          strokeWidth="8"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          style={{ stroke: bandConfig?.hexColor }}
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl sm:text-4xl font-bold text-gray-900">{indexData.overallScore}</span>
                        <span className="text-sm text-gray-500">/ 100</span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <Badge className={`${bandConfig?.bgColor} ${bandConfig?.color} border ${bandConfig?.borderColor} text-base sm:text-lg px-3 py-1 mb-2`}>
                        <Award className="w-4 h-4 mr-2" />
                        {indexData.readinessBand.label}
                      </Badge>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                        {indexData.role.name}
                      </h2>
                      {indexData.role.companyContext && (
                        <p className="text-gray-600">at {indexData.role.companyContext}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-2">{indexData.readinessBand.description}</p>
                    </div>
                  </div>

                  <div className="lg:ml-auto flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      {getTrendIcon(indexData.trend)}
                      <span className="font-medium capitalize">{indexData.trend}</span>
                      {indexData.previousScore !== null && (
                        <span className="text-gray-500">
                          (was {indexData.previousScore}%)
                        </span>
                      )}
                    </div>
                    
                    <Button
                      onClick={handleShare}
                      disabled={isSharing}
                      variant="outline"
                      className="bg-white"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      {isSharing ? "Generating..." : "Share"}
                    </Button>
                  </div>
                </div>

                {shareUrl && (
                  <div className="mt-4 p-3 bg-white rounded-lg flex items-center gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 bg-transparent text-sm text-gray-600 outline-none"
                    />
                    <Button onClick={copyToClipboard} size="sm" variant="ghost">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#24c4b8]/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-[#24c4b8]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{indexData.capabilityMilestones.practiceVolume}</div>
                    <div className="text-xs text-gray-500">Practice Sessions</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{indexData.capabilityMilestones.bestAttempt.score}%</div>
                    <div className="text-xs text-gray-500">Best Score</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {indexData.capabilityMilestones.consistencyScore !== null 
                        ? `${indexData.capabilityMilestones.consistencyScore}%` 
                        : '-'}
                    </div>
                    <div className="text-xs text-gray-500">Consistency</div>
                  </div>
                </div>
              </Card>

            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#24c4b8]" />
                    Core Dimensions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {indexData.dimensions.map((dim) => (
                    <div key={dim.key} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">{dim.label}</span>
                          <span className="text-xs text-gray-400">({dim.weight}%)</span>
                        </div>
                        <span className={`font-semibold ${getScoreColor(dim.score)}`}>
                          {dim.score}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getProgressColor(dim.score)} transition-all duration-500`}
                          style={{ width: `${dim.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#24c4b8]" />
                    Interview Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Coverage</span>
                      <span className="font-medium">{indexData.capabilityMilestones.coveragePercentage}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#24c4b8] transition-all duration-500"
                        style={{ width: `${indexData.capabilityMilestones.coveragePercentage}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {indexData.interviewBreakdown.map((ib) => {
                      const Icon = getInterviewTypeIcon(ib.interviewType);
                      return (
                        <div
                          key={ib.interviewType}
                          className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4 text-[#24c4b8]" />
                            <span className="text-sm font-medium text-gray-700 truncate">
                              {formatInterviewType(ib.interviewType)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">{ib.attemptCount} attempts</span>
                            {ib.latestScore !== null && (
                              <span className={getScoreColor(ib.latestScore)}>{ib.latestScore}%</span>
                            )}
                          </div>
                          {ib.latestSessionId && (
                            <Link
                              to={`/interview/results?sessionId=${ib.latestSessionId}`}
                              className="text-xs text-[#24c4b8] hover:underline flex items-center gap-1 mt-1"
                            >
                              View Details <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comprehensive Analysis Toggle */}
            <Card className="border-[#24c4b8]/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#24c4b8]" />
                    Detailed Interview Analysis
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
                    className="border-[#24c4b8] text-[#24c4b8] hover:bg-[#24c4b8]/10"
                  >
                    {showDetailedAnalysis ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-1" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-1" />
                        Show Details
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Deep dive into each interview type with skills mapping and recommendations
                </p>
              </CardHeader>

              {showDetailedAnalysis && (
                <CardContent className="space-y-6">
                  {/* Consolidated Narrative Summary */}
                  {comprehensiveData?.narrativeSummary && (
                    <div className="p-4 bg-gradient-to-r from-[#24c4b8]/10 to-blue-50/50 rounded-lg border border-[#24c4b8]/20">
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#24c4b8]" />
                        Overall Assessment
                      </h4>
                      <p className="text-gray-700">{comprehensiveData.narrativeSummary}</p>
                      
                      {comprehensiveData.consolidatedMetrics.strongestAreas.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="text-xs text-gray-500">Strongest:</span>
                          {comprehensiveData.consolidatedMetrics.strongestAreas.map((area) => (
                            <Badge key={area} className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              {formatInterviewType(area)}
                            </Badge>
                          ))}
                          {comprehensiveData.consolidatedMetrics.weakestAreas.length > 0 && (
                            <>
                              <span className="text-xs text-gray-500 ml-2">Focus on:</span>
                              {comprehensiveData.consolidatedMetrics.weakestAreas.slice(0, 1).map((area) => (
                                <Badge key={area} className="bg-amber-100 text-amber-700 border-amber-200">
                                  {formatInterviewType(area)}
                                </Badge>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* All JD Skills */}
                  {comprehensiveData?.allSkills && comprehensiveData.allSkills.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2 text-sm">Skills from Job Description</h4>
                      <div className="flex flex-wrap gap-2">
                        {comprehensiveData.allSkills.slice(0, 15).map((skill, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-gray-50">
                            {skill}
                          </Badge>
                        ))}
                        {comprehensiveData.allSkills.length > 15 && (
                          <Badge variant="outline" className="text-xs bg-gray-100">
                            +{comprehensiveData.allSkills.length - 15} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Per-Interview-Type Analysis Cards */}
                  {comprehensiveData?.interviewTypeAnalyses && comprehensiveData.interviewTypeAnalyses.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700">Analysis by Interview Type</h4>
                      {comprehensiveData.interviewTypeAnalyses.map((typeAnalysis) => {
                        const Icon = getInterviewTypeIcon(typeAnalysis.interviewType);
                        const isExpanded = expandedInterviewType === typeAnalysis.interviewType;
                        
                        return (
                          <Card 
                            key={typeAnalysis.interviewType} 
                            className={`border transition-all ${isExpanded ? 'border-[#24c4b8] shadow-md' : 'border-gray-200'}`}
                          >
                            <div 
                              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => setExpandedInterviewType(isExpanded ? null : typeAnalysis.interviewType)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    typeAnalysis.aggregatedScore !== null && typeAnalysis.aggregatedScore >= 75 
                                      ? 'bg-emerald-100' 
                                      : typeAnalysis.aggregatedScore !== null && typeAnalysis.aggregatedScore >= 55
                                        ? 'bg-blue-100'
                                        : 'bg-amber-100'
                                  }`}>
                                    <Icon className={`w-5 h-5 ${
                                      typeAnalysis.aggregatedScore !== null && typeAnalysis.aggregatedScore >= 75 
                                        ? 'text-emerald-600' 
                                        : typeAnalysis.aggregatedScore !== null && typeAnalysis.aggregatedScore >= 55
                                          ? 'text-blue-600'
                                          : 'text-amber-600'
                                    }`} />
                                  </div>
                                  <div>
                                    <h5 className="font-semibold text-gray-900">
                                      {formatInterviewType(typeAnalysis.interviewType)}
                                    </h5>
                                    <p className="text-sm text-gray-500">
                                      {typeAnalysis.sessions.length} session{typeAnalysis.sessions.length !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  {typeAnalysis.aggregatedScore !== null && (
                                    <span className={`text-xl font-bold ${getScoreColor(typeAnalysis.aggregatedScore)}`}>
                                      {typeAnalysis.aggregatedScore}%
                                    </span>
                                  )}
                                  {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>
                              </div>

                              {/* Relevant Skills for this interview type */}
                              {typeAnalysis.relevantSkills.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1">
                                  <span className="text-xs text-gray-400 mr-1">Focus skills:</span>
                                  {typeAnalysis.relevantSkills.slice(0, 5).map((skill, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs bg-[#24c4b8]/10 text-[#24c4b8] border-[#24c4b8]/20">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="px-4 pb-4 border-t border-gray-100">
                                <div className="pt-4 space-y-4">
                                  {/* Top Strengths & Improvements */}
                                  <div className="grid md:grid-cols-2 gap-4">
                                    {typeAnalysis.topStrengths.length > 0 && (
                                      <div className="p-3 bg-emerald-50 rounded-lg">
                                        <h6 className="text-sm font-medium text-emerald-700 mb-2 flex items-center gap-1">
                                          <CheckCircle className="w-4 h-4" />
                                          Strengths
                                        </h6>
                                        <ul className="space-y-1">
                                          {typeAnalysis.topStrengths.map((s, i) => (
                                            <li key={i} className="text-sm text-emerald-800">{s}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {typeAnalysis.topImprovements.length > 0 && (
                                      <div className="p-3 bg-amber-50 rounded-lg">
                                        <h6 className="text-sm font-medium text-amber-700 mb-2 flex items-center gap-1">
                                          <AlertTriangle className="w-4 h-4" />
                                          Areas to Improve
                                        </h6>
                                        <ul className="space-y-1">
                                          {typeAnalysis.topImprovements.map((s, i) => (
                                            <li key={i} className="text-sm text-amber-800">{s}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>

                                  {/* Session History */}
                                  {typeAnalysis.sessions.length > 0 && (
                                    <div>
                                      <h6 className="text-sm font-medium text-gray-700 mb-2">Session History</h6>
                                      <div className="space-y-2">
                                        {typeAnalysis.sessions.slice(0, 3).map((session, i) => (
                                          <div 
                                            key={session.sessionId}
                                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                                          >
                                            <div className="flex items-center gap-2">
                                              <Clock className="w-3 h-3 text-gray-400" />
                                              <span className="text-gray-600">
                                                {format(new Date(session.createdAt), 'MMM d, yyyy')}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              {session.recommendation && (
                                                <Badge 
                                                  variant="outline"
                                                  className={`text-xs ${
                                                    session.recommendation.includes('yes') 
                                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                                  }`}
                                                >
                                                  {session.recommendation.replace(/_/g, ' ')}
                                                </Badge>
                                              )}
                                              <Link
                                                to={`/interview/results?sessionId=${session.sessionId}`}
                                                className="text-[#24c4b8] hover:underline flex items-center gap-1"
                                              >
                                                View <ExternalLink className="w-3 h-3" />
                                              </Link>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* View Detailed Report Button */}
                                  <div className="pt-3 border-t border-gray-100">
                                    <Link
                                      to={`/hiready-index/${typeAnalysis.interviewType}?${selectedRole?.type === 'role_kit' ? `roleKitId=${selectedRole.id}` : `jobTargetId=${selectedRole?.id}`}`}
                                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#042c4c] text-white rounded-lg hover:bg-[#0a3d66] transition-colors text-sm font-medium"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <BarChart2 className="w-4 h-4" />
                                      View Detailed Report
                                      <ExternalLink className="w-3 h-3" />
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  ) : isLoadingComprehensive ? (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
                      <p>Loading detailed analysis...</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No detailed analysis data available yet. Complete more interviews to see insights.</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {indexData.progressTimeline.length > 1 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#24c4b8]" />
                    Progress Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {/* @ts-expect-error recharts type compatibility */}
                    <ResponsiveContainer width="100%" height="100%">
                      {/* @ts-expect-error recharts type compatibility */}
                      <AreaChart data={indexData.progressTimeline}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#24c4b8" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#24c4b8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        {/* @ts-expect-error recharts type compatibility */}
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date: string) => format(new Date(date), 'MMM d')}
                          tick={{ fontSize: 12 }}
                        />
                        {/* @ts-expect-error recharts type compatibility */}
                        <YAxis 
                          domain={[0, 100]} 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(val: number) => `${val}%`}
                        />
                        <Tooltip
                          labelFormatter={(date: string) => format(new Date(date), 'MMM d, yyyy')}
                          formatter={(value: number, name: string, props: any) => [
                            `${value}%`,
                            formatInterviewType(props.payload.interviewType)
                          ]}
                        />
                        <ReferenceLine y={75} stroke="#059669" strokeDasharray="3 3" label={{ value: 'Ready', position: 'right', fontSize: 10 }} />
                        <ReferenceLine y={55} stroke="#3B82F6" strokeDasharray="3 3" />
                        {/* @ts-expect-error recharts type compatibility */}
                        <Area 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#24c4b8" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorScore)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              {indexData.strengths.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      Top Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {indexData.strengths.map((strength, i) => (
                        <Badge key={i} variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {indexData.growthAreas.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Growth Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {indexData.growthAreas.map((area, i) => (
                        <Badge key={i} variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card className="border-[#24c4b8]/30 bg-gradient-to-r from-[#24c4b8]/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#24c4b8]/10 flex items-center justify-center">
                    <Play className="w-6 h-6 text-[#24c4b8]" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-gray-900">
                      {indexData.overallScore >= 75 
                        ? "You're Interview-Ready!" 
                        : indexData.overallScore >= 55 
                          ? "Almost There! One More Practice"
                          : "Keep Practicing to Improve"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {indexData.overallScore >= 75 
                        ? "Consider applying to jobs or practice to maintain your edge."
                        : indexData.overallScore >= 55 
                          ? "A few more practice sessions can push you into the ready zone."
                          : `Focus on ${indexData.growthAreas[0] || 'your weakest areas'} to improve faster.`}
                    </p>
                  </div>
                  <Link to="/interview">
                    <Button className="bg-[#24c4b8] hover:bg-[#1db0a5] text-white">
                      Continue Practicing
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </SidebarLayout>
  );
}
