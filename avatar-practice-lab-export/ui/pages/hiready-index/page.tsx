import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  BarChart3,
  ChevronDown
} from "lucide-react";
import { format } from "date-fns";

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
}

interface ReadinessBand {
  band: string;
  label: string;
  description: string;
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
  previousScore: number | null;
  lastUpdated: string;
}

const getBandConfig = (band: string) => {
  const configs: Record<string, { color: string; bgColor: string; borderColor: string; ringColor: string }> = {
    interview_ready: { color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-300", ringColor: "stroke-emerald-500" },
    strong_foundation: { color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-300", ringColor: "stroke-blue-500" },
    developing: { color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-300", ringColor: "stroke-amber-500" },
    early_stage: { color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-300", ringColor: "stroke-red-500" },
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

export default function HireadyIndexPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [indexData, setIndexData] = useState<HireadyIndexData | null>(null);
  const [roles, setRoles] = useState<{ roleKits: RoleOption[]; jobTargets: RoleOption[] }>({ roleKits: [], jobTargets: [] });
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingIndex, setIsLoadingIndex] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  // Fetch available roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch("/api/interview-progress/hiready-roles", {
          credentials: "include",
        });
        const data = await response.json();
        if (data.success) {
          setRoles(data.roles);
          
          // Auto-select role from URL params or first available
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

  // Fetch Hiready Index when role is selected
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

        const response = await fetch(`/api/interview-progress/hiready-index?${params.toString()}`, {
          credentials: "include",
        });
        const data = await response.json();
        if (data.success) {
          setIndexData(data.hireadyIndex);
        }
      } catch (error) {
        console.error("Error fetching Hiready index:", error);
      } finally {
        setIsLoadingIndex(false);
      }
    };

    fetchHireadyIndex();
  }, [selectedRole]);

  const handleRoleSelect = (role: RoleOption) => {
    setSelectedRole(role);
    setShowRoleSelector(false);
    
    // Update URL params
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
        body.roleKitId = selectedRole.id;
      } else {
        body.jobTargetId = selectedRole.id;
      }

      const response = await fetch('/api/interview-progress/share-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
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

  const allRoles = [...roles.roleKits, ...roles.jobTargets];

  // No roles available - show empty state
  if (allRoles.length === 0) {
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
                Complete interview practice sessions for a specific role to build your personalized readiness score.
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

  const bandConfig = indexData ? getBandConfig(indexData.readinessBand.band) : null;
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = indexData ? circumference - (indexData.overallScore / 100) * circumference : circumference;
  const scoreDelta = indexData?.previousScore ? indexData.overallScore - indexData.previousScore : 0;

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#fbfbfc] pb-24 sm:pb-8">
        {/* Header with Role Selector */}
        <div className="bg-[#000000] text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
            <Link
              to="/avatar/results"
              className="inline-flex items-center text-white/70 hover:text-white mb-4 text-sm font-medium transition-colors group"
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1 group-hover:-translate-x-0.5 transition-transform" />
              Back to Results
            </Link>

            {/* Role Selector */}
            <div className="mb-6">
              <div className="relative inline-block">
                <button
                  onClick={() => setShowRoleSelector(!showRoleSelector)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
                >
                  <Briefcase className="w-4 h-4 text-[#24c4b8]" />
                  <span className="font-medium">{selectedRole?.name || "Select Role"}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showRoleSelector ? 'rotate-180' : ''}`} />
                </button>
                
                {showRoleSelector && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border z-50 py-2 max-h-64 overflow-y-auto">
                    {roles.roleKits.length > 0 && (
                      <>
                        <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase">Role Kits</div>
                        {roles.roleKits.map((role) => (
                          <button
                            key={`rk-${role.id}`}
                            onClick={() => handleRoleSelect(role)}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 ${
                              selectedRole?.id === role.id && selectedRole?.type === role.type
                                ? 'bg-[#24c4b8]/10 text-[#24c4b8]'
                                : 'text-gray-700'
                            }`}
                          >
                            <Briefcase className="w-4 h-4" />
                            {role.name}
                          </button>
                        ))}
                      </>
                    )}
                    {roles.jobTargets.length > 0 && (
                      <>
                        <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase mt-2">Job Targets</div>
                        {roles.jobTargets.map((role) => (
                          <button
                            key={`jt-${role.id}`}
                            onClick={() => handleRoleSelect(role)}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 ${
                              selectedRole?.id === role.id && selectedRole?.type === role.type
                                ? 'bg-[#24c4b8]/10 text-[#24c4b8]'
                                : 'text-gray-700'
                            }`}
                          >
                            <Target className="w-4 h-4" />
                            {role.name}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isLoadingIndex ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : indexData ? (
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                {/* Score Circle */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <div className="relative">
                    <svg className="w-40 h-40 transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        className={bandConfig?.ringColor || "stroke-emerald-500"}
                        strokeWidth="12"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: "stroke-dashoffset 1s ease-out" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold">{indexData.overallScore}</span>
                      <span className="text-sm text-white/60">/ 100</span>
                    </div>
                  </div>

                  <div className="text-center sm:text-left">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-3 ${bandConfig?.bgColor} ${bandConfig?.color}`}>
                      <Award className="w-4 h-4" />
                      {indexData.readinessBand.label}
                    </div>
                    <h1 className="text-2xl font-bold mb-1">{indexData.role.name}</h1>
                    {indexData.role.companyContext && (
                      <p className="text-white/60 text-sm mb-2">at {indexData.role.companyContext}</p>
                    )}
                    <p className="text-white/70 text-sm max-w-xs">
                      {indexData.readinessBand.description}
                    </p>
                    
                    {scoreDelta !== 0 && (
                      <div className={`flex items-center gap-1 mt-3 text-sm ${scoreDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {scoreDelta > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                        <span>{Math.abs(scoreDelta)} points from last session</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Share Button */}
                <div className="flex flex-col items-center sm:items-end gap-2">
                  <Button
                    onClick={handleShare}
                    disabled={isSharing}
                    className="bg-white/10 hover:bg-white/20 text-white border-0"
                  >
                    {isSharing ? (
                      <LoadingSpinner />
                    ) : copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Link Copied!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Profile
                      </>
                    )}
                  </Button>
                  <span className="text-xs text-white/50">{indexData.totalSessions} practice sessions</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/70">No interview data for this role yet.</p>
                <Link to="/interview">
                  <Button className="mt-4 bg-[#24c4b8] hover:bg-[#1db0a5] text-white">
                    Start Practicing
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {indexData && (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
            {/* Core Dimensions */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="w-5 h-5 text-[#24c4b8]" />
                  Core Dimensions
                </CardTitle>
                <p className="text-sm text-gray-500">Weighted for {indexData.role.name} role requirements</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {indexData.dimensions.map((dim) => (
                    <div key={dim.key} className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">{dim.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{dim.weight}% weight</span>
                          <span className={`font-semibold ${getScoreColor(dim.score)}`}>{dim.score}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getProgressColor(dim.score)} transition-all duration-500`}
                          style={{ width: `${dim.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Strengths & Growth Areas */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-emerald-700">
                    <CheckCircle className="w-5 h-5" />
                    Top Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {indexData.strengths.length > 0 ? (
                    <ul className="space-y-2">
                      {indexData.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">Complete more sessions to identify strengths</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-amber-700">
                    <AlertTriangle className="w-5 h-5" />
                    Growth Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {indexData.growthAreas.length > 0 ? (
                    <ul className="space-y-2">
                      {indexData.growthAreas.map((g, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">Complete more sessions to identify growth areas</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Interview Type Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="w-5 h-5 text-[#24c4b8]" />
                  Interview Types Practiced
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {indexData.interviewBreakdown.map((ib) => {
                    const Icon = getInterviewTypeIcon(ib.interviewType);
                    return (
                      <div
                        key={ib.interviewType}
                        className="p-4 bg-gray-50 rounded-xl border hover:border-[#24c4b8]/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <Icon className="w-5 h-5 text-[#24c4b8]" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{formatInterviewType(ib.interviewType)}</div>
                            <div className="text-xs text-gray-500">{ib.attemptCount} attempt{ib.attemptCount !== 1 ? 's' : ''}</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Latest</span>
                          <span className={`font-semibold ${ib.latestScore ? getScoreColor(ib.latestScore) : 'text-gray-400'}`}>
                            {ib.latestScore !== null ? `${ib.latestScore}%` : '-'}
                          </span>
                        </div>
                        {ib.bestScore && ib.bestScore !== ib.latestScore && (
                          <div className="flex justify-between items-center text-sm mt-1">
                            <span className="text-gray-500">Best</span>
                            <span className="font-semibold text-emerald-600">{ib.bestScore}%</span>
                          </div>
                        )}
                        {ib.latestSessionId && (
                          <Link
                            to={`/interview/results?sessionId=${ib.latestSessionId}`}
                            className="mt-3 flex items-center justify-center gap-1 text-xs text-[#24c4b8] hover:underline"
                          >
                            View Details <ChevronRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
