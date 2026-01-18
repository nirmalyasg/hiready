import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  Target, 
  TrendingUp, 
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
  Activity,
  Trophy,
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

interface ReadinessBand {
  band: string;
  label: string;
  description: string;
}

interface DimensionResult {
  key: string;
  label: string;
  score: number;
  weight: number;
  weightedScore: number;
}

interface Attempt {
  sessionId: number;
  attemptNumber: number;
  createdAt: string;
  status: string;
  recommendation: string | null;
  summary: string | null;
  overallScore: number | null;
  dimensionScores: Array<{ dimension: string; score: number; evidence?: string[]; rationale?: string; improvement?: string }>;
  strengths: string[];
  improvements: string[];
  risks: string[];
  resultsUrl: string;
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
    latestAttemptDate: string | null;
  };
  attempts: Attempt[];
  progressionData: Array<{ attemptNumber: number; date: string; score: number | null }>;
  dimensionAverages: Array<{ dimension: string; avgScore: number; percentile: number }>;
  topStrengths: Array<{ text: string; frequency: number }>;
  topImprovements: Array<{ text: string; frequency: number }>;
  typeSpecificMetrics: Record<string, any>;
}

interface FullReportData {
  user: { id?: number; displayName: string };
  role: {
    name: string;
    companyContext: string | null;
    archetypeId: string | null;
    roleKitId: number | null;
    jobTargetId: string | null;
  };
  overallScore: number | null;
  readinessBand: ReadinessBand | null;
  dimensions: DimensionResult[];
  totalSessions: number;
  totalInterviewTypes: number;
  strongestAreas: string[];
  weakestAreas: string[];
  interviewBreakdown: Array<{
    interviewType: string;
    weight: number;
    attemptCount: number;
    latestScore: number | null;
    bestScore: number | null;
    latestSessionId: number | null;
  }>;
  sessionScoreHistory: Array<{
    sessionId: number;
    date: string;
    score: number;
    interviewType: string;
  }>;
  capabilityMilestones: {
    practiceVolume: number;
    bestAttempt: { score: number; sessionId: number | null; interviewType: string | null };
    consistencyScore: number | null;
    coveragePercentage: number;
  };
  allSkills: string[];
  skillsByInterviewType: Record<string, string[]>;
  interviewTypeReports: InterviewTypeReport[];
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

const getTrendIcon = (scores: number[]) => {
  if (scores.length < 2) return <Minus className="w-4 h-4 text-gray-400" />;
  const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
  const secondHalf = scores.slice(Math.ceil(scores.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const diff = secondAvg - firstAvg;
  if (diff > 3) return <ArrowUp className="w-4 h-4 text-emerald-500" />;
  if (diff < -3) return <ArrowDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
};

export default function HireadyIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [fullReport, setFullReport] = useState<FullReportData | null>(null);
  const [roles, setRoles] = useState<{ roleKits: RoleOption[]; jobTargets: RoleOption[] }>({ roleKits: [], jobTargets: [] });
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

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

    const fetchFullReport = async () => {
      setIsLoadingReport(true);
      try {
        const params = new URLSearchParams();
        if (selectedRole.type === "role_kit") {
          params.set("roleKitId", String(selectedRole.id));
        } else {
          params.set("jobTargetId", String(selectedRole.id));
        }

        const response = await fetch(`/api/interview-progress/full-report?${params}`, {
          credentials: "include",
        });
        const data = await response.json();
        
        if (data.success && data.fullReport) {
          setFullReport(data.fullReport);
          if (data.fullReport.interviewTypeReports?.length > 0) {
            setExpandedTypes(new Set([data.fullReport.interviewTypeReports[0].interviewType]));
          }
        } else {
          setFullReport(null);
        }
      } catch (error) {
        console.error("Error fetching full report:", error);
        setFullReport(null);
      } finally {
        setIsLoadingReport(false);
      }
    };

    fetchFullReport();
  }, [selectedRole]);

  const handleRoleSelect = (role: RoleOption) => {
    setSelectedRole(role);
    setExpandedTypes(new Set());
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

  const toggleInterviewType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
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

  const bandConfig = fullReport?.readinessBand ? getBandConfig(fullReport.readinessBand.band) : null;
  const circumference = 2 * Math.PI * 50;
  const strokeDashoffset = fullReport?.overallScore 
    ? circumference - (fullReport.overallScore / 100) * circumference 
    : circumference;

  return (
    <SidebarLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Target className="w-8 h-8 text-[#24c4b8]" />
            Hiready Index
          </h1>
          <p className="text-gray-600 mt-1">Your complete interview readiness report</p>
        </div>

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

        {isLoadingReport ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : !fullReport ? (
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
            {/* Overall Score Card */}
            <Card className={`border-2 ${bandConfig?.borderColor || 'border-gray-200'} shadow-lg overflow-hidden`}>
              <div className={`${bandConfig?.bgColor || 'bg-gray-50'} p-6 sm:p-8`}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <svg className="w-28 h-28 sm:w-36 sm:h-36 transform -rotate-90">
                        <circle cx="50%" cy="50%" r="50" strokeWidth="8" fill="none" className="stroke-white/50" />
                        <circle
                          cx="50%" cy="50%" r="50" strokeWidth="8" fill="none"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          style={{ stroke: bandConfig?.hexColor || '#9CA3AF' }}
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                          {fullReport.overallScore ?? '-'}
                        </span>
                        <span className="text-sm text-gray-500">/ 100</span>
                      </div>
                    </div>

                    <div className="flex-1">
                      {fullReport.readinessBand && (
                        <Badge className={`${bandConfig?.bgColor} ${bandConfig?.color} border ${bandConfig?.borderColor} text-base sm:text-lg px-3 py-1 mb-2`}>
                          <Award className="w-4 h-4 mr-2" />
                          {fullReport.readinessBand.label}
                        </Badge>
                      )}
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                        {fullReport.role.name}
                      </h2>
                      {fullReport.role.companyContext && (
                        <p className="text-gray-600">at {fullReport.role.companyContext}</p>
                      )}
                      {fullReport.readinessBand && (
                        <p className="text-sm text-gray-600 mt-2">{fullReport.readinessBand.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="lg:ml-auto flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      {getTrendIcon(fullReport.sessionScoreHistory.map(s => s.score))}
                      <span className="font-medium">
                        {fullReport.sessionScoreHistory.length >= 2 ? 'Based on ' : ''}
                        {fullReport.totalSessions} sessions
                      </span>
                    </div>
                    
                    <Button onClick={handleShare} disabled={isSharing} variant="outline" className="bg-white">
                      <Share2 className="w-4 h-4 mr-2" />
                      {isSharing ? "Generating..." : "Share Report"}
                    </Button>
                  </div>
                </div>

                {shareUrl && (
                  <div className="mt-4 p-3 bg-white rounded-lg flex items-center gap-2">
                    <input type="text" value={shareUrl} readOnly className="flex-1 bg-transparent text-sm text-gray-600 outline-none" />
                    <Button onClick={copyToClipboard} size="sm" variant="ghost">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#24c4b8]/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-[#24c4b8]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{fullReport.capabilityMilestones.practiceVolume}</div>
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
                    <div className="text-2xl font-bold text-gray-900">{fullReport.capabilityMilestones.bestAttempt.score}%</div>
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
                      {fullReport.capabilityMilestones.consistencyScore !== null 
                        ? `${fullReport.capabilityMilestones.consistencyScore}%` 
                        : '-'}
                    </div>
                    <div className="text-xs text-gray-500">Consistency</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{fullReport.totalInterviewTypes}</div>
                    <div className="text-xs text-gray-500">Interview Types</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Progress Over Time */}
            {fullReport.sessionScoreHistory.length > 1 && (
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
                      <AreaChart data={fullReport.sessionScoreHistory}>
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
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(val: number) => `${val}%`} />
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
                        <Area type="monotone" dataKey="score" stroke="#24c4b8" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Strengths & Growth Areas */}
            <div className="grid lg:grid-cols-2 gap-6">
              {fullReport.strongestAreas.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      Strongest Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {fullReport.strongestAreas.map((area, i) => (
                        <Badge key={i} variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          {formatInterviewType(area)}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {fullReport.weakestAreas.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Focus Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {fullReport.weakestAreas.map((area, i) => (
                        <Badge key={i} variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                          {formatInterviewType(area)}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Interview Type Reports - Accordion Style */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#24c4b8]" />
                  Detailed Analysis by Interview Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fullReport.interviewTypeReports.map((report) => {
                  const Icon = getInterviewTypeIcon(report.interviewType);
                  const isExpanded = expandedTypes.has(report.interviewType);
                  const typeBandConfig = report.overallMetrics.readinessBand 
                    ? getBandConfig(report.overallMetrics.readinessBand.band)
                    : null;

                  return (
                    <div key={report.interviewType} className="border rounded-xl overflow-hidden">
                      {/* Header - Always visible */}
                      <button
                        onClick={() => toggleInterviewType(report.interviewType)}
                        className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            typeBandConfig?.bgColor || 'bg-gray-100'
                          }`}>
                            <Icon className={`w-6 h-6 ${typeBandConfig?.color || 'text-gray-500'}`} />
                          </div>
                          <div className="text-left">
                            <h4 className="font-semibold text-gray-900">{report.interviewTypeLabel}</h4>
                            <p className="text-sm text-gray-500">
                              {report.overallMetrics.totalAttempts} attempt{report.overallMetrics.totalAttempts !== 1 ? 's' : ''}
                              {report.overallMetrics.latestAttemptDate && (
                                <> • Last: {format(new Date(report.overallMetrics.latestAttemptDate), 'MMM d')}</>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {report.overallMetrics.overallScore !== null && (
                            <div className="text-right">
                              <span className={`text-2xl font-bold ${getScoreColor(report.overallMetrics.overallScore)}`}>
                                {report.overallMetrics.overallScore}%
                              </span>
                              {report.overallMetrics.readinessBand && (
                                <p className="text-xs text-gray-500">{report.overallMetrics.readinessBand.label}</p>
                              )}
                            </div>
                          )}
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="p-6 space-y-6 border-t">
                          {/* Dimension Averages */}
                          {report.dimensionAverages.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-3">Skill Dimensions</h5>
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
                                    <XAxis dataKey="attemptNumber" tick={{ fontSize: 11 }} label={{ value: 'Attempt', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                                    {/* @ts-expect-error recharts type compatibility */}
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(val: number) => `${val}%`} />
                                    <Tooltip formatter={(value: number) => [`${value}%`, 'Score']} />
                                    {/* @ts-expect-error recharts type compatibility */}
                                    <Line type="monotone" dataKey="score" stroke="#24c4b8" strokeWidth={2} dot={{ fill: '#24c4b8' }} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}

                          {/* Strengths & Improvements */}
                          <div className="grid sm:grid-cols-2 gap-4">
                            {report.topStrengths.length > 0 && (
                              <div className="p-3 bg-emerald-50 rounded-lg">
                                <h6 className="text-sm font-medium text-emerald-700 mb-2 flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" />
                                  Top Strengths
                                </h6>
                                <ul className="space-y-1">
                                  {report.topStrengths.slice(0, 4).map((s, i) => (
                                    <li key={i} className="text-sm text-emerald-800">• {s.text}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {report.topImprovements.length > 0 && (
                              <div className="p-3 bg-amber-50 rounded-lg">
                                <h6 className="text-sm font-medium text-amber-700 mb-2 flex items-center gap-1">
                                  <AlertTriangle className="w-4 h-4" />
                                  Areas to Improve
                                </h6>
                                <ul className="space-y-1">
                                  {report.topImprovements.slice(0, 4).map((s, i) => (
                                    <li key={i} className="text-sm text-amber-800">• {s.text}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Attempt History */}
                          {report.attempts.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-3">Attempt History</h5>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {report.attempts.slice().reverse().map((attempt) => (
                                  <div 
                                    key={attempt.sessionId}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                                        #{attempt.attemptNumber}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <Clock className="w-3 h-3 text-gray-400" />
                                          <span className="text-sm text-gray-600">
                                            {format(new Date(attempt.createdAt), 'MMM d, yyyy')}
                                          </span>
                                        </div>
                                        {attempt.summary && (
                                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{attempt.summary}</p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {attempt.overallScore !== null && (
                                        <span className={`font-bold ${getScoreColor(attempt.overallScore)}`}>
                                          {attempt.overallScore}%
                                        </span>
                                      )}
                                      {attempt.recommendation && (
                                        <Badge 
                                          variant="outline"
                                          className={`text-xs ${
                                            attempt.recommendation.toLowerCase().includes('yes') 
                                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                              : 'bg-amber-50 text-amber-700 border-amber-200'
                                          }`}
                                        >
                                          {attempt.recommendation.replace(/_/g, ' ')}
                                        </Badge>
                                      )}
                                      <Link
                                        to={attempt.resultsUrl}
                                        className="text-[#24c4b8] hover:underline flex items-center gap-1 text-sm"
                                      >
                                        View <ExternalLink className="w-3 h-3" />
                                      </Link>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Relevant Skills */}
                          {report.relevantSkills.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Relevant Skills</h5>
                              <div className="flex flex-wrap gap-2">
                                {report.relevantSkills.map((skill, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
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

            {/* CTA */}
            <Card className="border-[#24c4b8]/30 bg-gradient-to-r from-[#24c4b8]/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#24c4b8]/10 flex items-center justify-center">
                    <Play className="w-6 h-6 text-[#24c4b8]" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-gray-900">
                      {fullReport.overallScore !== null && fullReport.overallScore >= 75 
                        ? "You're Interview-Ready!" 
                        : fullReport.overallScore !== null && fullReport.overallScore >= 55 
                          ? "Almost There! Keep Practicing"
                          : "Keep Practicing to Improve"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {fullReport.overallScore !== null && fullReport.overallScore >= 75 
                        ? "Consider applying to jobs or practice to maintain your edge."
                        : fullReport.weakestAreas.length > 0 
                          ? `Focus on ${formatInterviewType(fullReport.weakestAreas[0])} to improve faster.`
                          : "Regular practice helps you improve faster."}
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
