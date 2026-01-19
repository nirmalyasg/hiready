import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Sparkles, Play, FileText, Code, CheckCircle2, AlertCircle, MoreVertical, Trash2, ChevronDown, ChevronUp, Phone, User, Briefcase, MessageCircle, Heart, TrendingUp, ExternalLink, Lock, Crown, Clock, Target, BarChart3, RotateCcw, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import SidebarLayout from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAccessGate } from "@/components/monetization/access-gate";
import { UpgradeModal } from "@/components/monetization/upgrade-modal";

interface Entitlements {
  hasAccess: boolean;
  accessType: "free_trial" | "role_pack" | "pro_subscription" | "employer_assessment" | "none";
  reason: string;
  canStartSession: boolean;
  freeTrialUsed: boolean;
  sessionsCompleted?: number;
  pricing?: any;
}

interface JobTarget {
  id: string;
  userId: string;
  source: string | null;
  jobUrl: string | null;
  companyName: string | null;
  roleTitle: string;
  location: string | null;
  jdText: string | null;
  jdParsed: {
    requiredSkills?: string[];
    preferredSkills?: string[];
    experienceLevel?: string;
    responsibilities?: string[];
    companyContext?: string;
    redFlags?: string[];
    focusAreas?: string[];
    salaryRange?: string;
    detectedRoleTitle?: string;
    analysisDimensions?: string[];
    interviewTopics?: string[];
  } | null;
  status: string;
  readinessScore: number | null;
  lastPracticedAt: string | null;
  createdAt: string;
  updatedAt: string;
  companyArchetype?: string | null;
  archetypeConfidence?: "high" | "medium" | "low" | null;
  roleArchetypeId?: string | null;
  roleFamily?: string | null;
  roleKitId?: number | null;
  roleKitMatchConfidence?: "high" | "medium" | "low" | null;
}

interface RoleKit {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  domain?: string | null;
}

interface RoleKitMatchInfo {
  roleKitId: number;
  roleKitName: string;
  confidence: "high" | "medium" | "low";
  matchType: "exact" | "keyword" | "domain" | "none";
  alternativeMatches?: { roleKitId: number; roleKitName: string; confidence: "medium" | "low" }[];
}

const archetypeLabels: Record<string, string> = {
  it_services: "IT Services",
  big_tech: "Big Tech",
  bfsi: "BFSI",
  fmcg: "FMCG",
  manufacturing: "Manufacturing",
  consulting: "Consulting",
  bpm: "BPM",
  telecom: "Telecom",
  conglomerate: "Conglomerate",
  startup: "Startup",
  enterprise: "Enterprise",
  regulated: "Regulated",
  consumer: "Consumer Tech",
  saas: "SaaS",
  fintech: "Fintech",
  edtech: "EdTech",
  services: "Services",
  industrial: "Industrial",
};

type RoundCategory = 
  | "aptitude_assessment"
  | "hr_screening"
  | "hiring_manager" 
  | "technical_interview"
  | "coding_assessment"
  | "system_design"
  | "case_study"
  | "behavioral"
  | "culture_values"
  | "bar_raiser"
  | "group_discussion";

type PracticeMode = "live_interview" | "coding_lab" | "case_study";

interface CompanyPracticeContext {
  jobTargetId: string;
  companyName: string | null;
  companyId: string | null;
  roleTitle: string | null;
  archetype: string | null;
  tier: string | null;
  hasBlueprint: boolean;
  blueprintNotes: string | null;
  focusAreas: string[];
  leadershipPrinciples: string[] | null;
  interviewStyle: string | null;
}

interface PracticeOption {
  id: string;
  roundCategory: RoundCategory;
  label: string;
  description: string;
  objective?: string;
  skillsAssessed?: string[];
  practiceMode: PracticeMode;
  typicalDuration: string;
  icon: string;
  companySpecific: boolean;
  companyContext: CompanyPracticeContext;
  focusHint: string | null;
}

interface CompanyData {
  companyName: string | null;
  archetype: string | null;
  tier: string | null;
  hasBlueprint: boolean;
  blueprintNotes: string | null;
  hasContext: boolean;
}

interface PracticeHistoryItem {
  interviewType: string;
  attemptCount: number;
  latestScore: number | null;
  bestScore: number | null;
  latestSessionId: number | null;
  bestSessionId: number | null;
  lastPracticedAt: string | null;
}

interface PracticeHistoryResponse {
  success: boolean;
  roleKitId: number;
  practiceHistory: Record<string, PracticeHistoryItem>;
  summary: {
    totalAttempts: number;
    roundsPracticed: number;
    averageScore: number | null;
  };
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  saved: { label: "Saved", bg: "bg-slate-100", text: "text-slate-600" },
  applied: { label: "Applied", bg: "bg-[#cb6ce6]/20", text: "text-[#000000]" },
  interview: { label: "Interviewing", bg: "bg-[#24c4b8]/10", text: "text-[#24c4b8]" },
  offer: { label: "Offer", bg: "bg-emerald-100", text: "text-emerald-700" },
  rejected: { label: "Rejected", bg: "bg-red-100", text: "text-red-700" },
  archived: { label: "Archived", bg: "bg-gray-100", text: "text-gray-500" },
};

const categoryConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  hr_screening: { icon: <Phone className="w-4 h-4" />, color: "text-gray-500", bg: "bg-gray-500/10" },
  hr: { icon: <Phone className="w-4 h-4" />, color: "text-gray-500", bg: "bg-gray-500/10" },
  hiring_manager: { icon: <User className="w-4 h-4" />, color: "text-[#cb6ce6]", bg: "bg-[#cb6ce6]/10" },
  technical_interview: { icon: <Code className="w-4 h-4" />, color: "text-[#000000]", bg: "bg-[#000000]/10" },
  technical: { icon: <Code className="w-4 h-4" />, color: "text-[#000000]", bg: "bg-[#000000]/10" },
  coding: { icon: <Code className="w-4 h-4" />, color: "text-[#000000]", bg: "bg-[#000000]/10" },
  coding_assessment: { icon: <Code className="w-4 h-4" />, color: "text-[#000000]", bg: "bg-[#000000]/10" },
  system_design: { icon: <Code className="w-4 h-4" />, color: "text-[#cb6ce6]", bg: "bg-[#cb6ce6]/10" },
  sql: { icon: <Code className="w-4 h-4" />, color: "text-gray-500", bg: "bg-gray-500/10" },
  analytics: { icon: <Briefcase className="w-4 h-4" />, color: "text-[#cb6ce6]", bg: "bg-[#cb6ce6]/10" },
  ml: { icon: <Briefcase className="w-4 h-4" />, color: "text-[#000000]", bg: "bg-[#000000]/10" },
  case_study: { icon: <Briefcase className="w-4 h-4" />, color: "text-[#24c4b8]", bg: "bg-[#24c4b8]/10" },
  case: { icon: <Briefcase className="w-4 h-4" />, color: "text-[#24c4b8]", bg: "bg-[#24c4b8]/10" },
  product: { icon: <Briefcase className="w-4 h-4" />, color: "text-[#24c4b8]", bg: "bg-[#24c4b8]/10" },
  portfolio: { icon: <Briefcase className="w-4 h-4" />, color: "text-[#cb6ce6]", bg: "bg-[#cb6ce6]/10" },
  sales_roleplay: { icon: <User className="w-4 h-4" />, color: "text-[#24c4b8]", bg: "bg-[#24c4b8]/10" },
  behavioral: { icon: <MessageCircle className="w-4 h-4" />, color: "text-[#24c4b8]", bg: "bg-[#24c4b8]/10" },
  culture_values: { icon: <Heart className="w-4 h-4" />, color: "text-gray-500", bg: "bg-gray-500/10" },
  bar_raiser: { icon: <TrendingUp className="w-4 h-4" />, color: "text-[#000000]", bg: "bg-[#000000]/10" },
  aptitude_assessment: { icon: <TrendingUp className="w-4 h-4" />, color: "text-gray-500", bg: "bg-gray-500/10" },
  aptitude: { icon: <TrendingUp className="w-4 h-4" />, color: "text-gray-500", bg: "bg-gray-500/10" },
  group_discussion: { icon: <MessageCircle className="w-4 h-4" />, color: "text-[#cb6ce6]", bg: "bg-[#cb6ce6]/10" },
  group: { icon: <MessageCircle className="w-4 h-4" />, color: "text-[#cb6ce6]", bg: "bg-[#cb6ce6]/10" },
};

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobTarget | null>(null);
  const [practiceOptions, setPracticeOptions] = useState<PracticeOption[]>([]);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [jdExpanded, setJdExpanded] = useState(false);
  const [requirementsExpanded, setRequirementsExpanded] = useState(true);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [roleKits, setRoleKits] = useState<RoleKit[]>([]);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [isAutoMapping, setIsAutoMapping] = useState(false);
  const [practiceHistory, setPracticeHistory] = useState<PracticeHistoryResponse | null>(null);
  
  const matchedRoleKit = roleKits.find(r => r.id === job?.roleKitId);

  const getRoundHistory = (roundCategory: string): PracticeHistoryItem | null => {
    if (!practiceHistory?.practiceHistory) return null;
    return practiceHistory.practiceHistory[roundCategory] || null;
  };
  const interviewSetId = job?.roleKitId ?? undefined;
  const interviewSetName = matchedRoleKit?.name ? `${matchedRoleKit.name} Interview Set` : job?.roleTitle ? `${job.roleTitle} Interview Set` : undefined;
  
  const { checkAccess, showUpgradeModal, setShowUpgradeModal, accessCheck, hasAccess, isLoading: accessLoading } = useAccessGate({
    interviewSetId,
    interviewSetName,
    context: 'job'
  });
  
  const isFreeTierExhausted = !accessLoading && !hasAccess && accessCheck?.freeInterviewsRemaining === 0;

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      
      try {
        setIsLoading(true);
        const [jobRes, optionsRes, entitlementsRes, roleKitsRes] = await Promise.all([
          fetch(`/api/jobs/job-targets/${jobId}`),
          fetch(`/api/jobs/job-targets/${jobId}/practice-options`),
          fetch(`/api/payments/entitlements?jobTargetId=${jobId}`, { credentials: "include" }),
          fetch(`/api/interview/role-kits`),
        ]);
        
        const jobData = await jobRes.json();
        const optionsData = await optionsRes.json();
        const entitlementsData = await entitlementsRes.json();
        const roleKitsData = await roleKitsRes.json();
        
        if (jobData.success) {
          setJob(jobData.job);
        }
        
        if (optionsData.success) {
          setPracticeOptions(optionsData.options || []);
          if (optionsData.companyContext) {
            setCompanyData({
              companyName: optionsData.companyContext.companyName,
              archetype: optionsData.companyContext.archetype,
              tier: optionsData.companyContext.tier,
              hasBlueprint: optionsData.companyContext.hasBlueprint,
              blueprintNotes: optionsData.companyContext.blueprintNotes,
              hasContext: !!optionsData.companyContext.companyId,
            });
          }
        }

        if (entitlementsData.success) {
          setEntitlements(entitlementsData);
        }

        if (roleKitsData.success) {
          setRoleKits(roleKitsData.roleKits || []);
        }

        if (jobData.success && jobData.job?.roleKitId) {
          const historyRes = await fetch(`/api/interview/role-kits/${jobData.job.roleKitId}/practice-history`);
          const historyData = await historyRes.json();
          if (historyData.success) {
            setPracticeHistory(historyData);
          }
        } else if (jobData.success && jobData.job && !jobData.job.roleKitId) {
          setIsAutoMapping(true);
          try {
            const mapRes = await fetch(`/api/jobs/job-targets/${jobData.job.id}/auto-map-role-kit`, {
              method: "POST",
            });
            const mapData = await mapRes.json();
            if (mapData.success && mapData.mapped) {
              setJob(prev => prev ? { ...prev, roleKitId: mapData.roleKitMatch.roleKitId } : null);
              
              const historyRes = await fetch(`/api/interview/role-kits/${mapData.roleKitMatch.roleKitId}/practice-history`);
              const historyData = await historyRes.json();
              if (historyData.success) {
                setPracticeHistory(historyData);
              }
              
              const entRes = await fetch(`/api/payments/entitlements?roleKitId=${mapData.roleKitMatch.roleKitId}`, { credentials: "include" });
              const entData = await entRes.json();
              if (entData.success) {
                setEntitlements(entData);
              }
            }
          } catch (mapError) {
            console.error("Error auto-mapping role kit:", mapError);
          } finally {
            setIsAutoMapping(false);
          }
        }
      } catch (error) {
        console.error("Error fetching job:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJob();
  }, [jobId]);

  const handleUpdateRoleKit = async (roleKitId: number | null) => {
    if (!job) return;
    
    setIsSavingRole(true);
    try {
      const response = await fetch(`/api/jobs/job-targets/${job.id}/role-kit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleKitId }),
      });
      const data = await response.json();
      if (data.success) {
        setJob(prev => prev ? { ...prev, roleKitId } : null);
        setShowRoleSelector(false);
        
        const entitlementsRes = await fetch(`/api/payments/entitlements?roleKitId=${roleKitId}`, { credentials: "include" });
        const entitlementsData = await entitlementsRes.json();
        if (entitlementsData.success) {
          setEntitlements(entitlementsData);
        }

        if (roleKitId) {
          const historyRes = await fetch(`/api/interview/role-kits/${roleKitId}/practice-history`);
          const historyData = await historyRes.json();
          if (historyData.success) {
            setPracticeHistory(historyData);
          }
        } else {
          setPracticeHistory(null);
        }
      }
    } catch (error) {
      console.error("Error updating role kit:", error);
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleParseJD = async () => {
    if (!job || !job.jdText) return;
    
    setIsParsing(true);
    try {
      const response = await fetch(`/api/jobs/job-targets/${job.id}/parse`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setJob(prev => prev ? { ...prev, jdParsed: data.parsed } : null);
      }
    } catch (error) {
      console.error("Error parsing JD:", error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleAutoMapRoleKit = async (jobData: JobTarget) => {
    if (isAutoMapping) return;
    
    setIsAutoMapping(true);
    try {
      const response = await fetch(`/api/jobs/job-targets/${jobData.id}/auto-map-role-kit`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success && data.mapped) {
        setJob(prev => prev ? { 
          ...prev, 
          roleKitId: data.roleKitMatch.roleKitId 
        } : null);

        const historyRes = await fetch(`/api/interview/role-kits/${data.roleKitMatch.roleKitId}/practice-history`);
        const historyData = await historyRes.json();
        if (historyData.success) {
          setPracticeHistory(historyData);
        }

        const entitlementsRes = await fetch(`/api/payments/entitlements?roleKitId=${data.roleKitMatch.roleKitId}`, { credentials: "include" });
        const entitlementsData = await entitlementsRes.json();
        if (entitlementsData.success) {
          setEntitlements(entitlementsData);
        }
      }
    } catch (error) {
      console.error("Error auto-mapping role kit:", error);
    } finally {
      setIsAutoMapping(false);
    }
  };

  const handleDelete = async () => {
    if (!job || !window.confirm("Are you sure you want to delete this job?")) return;
    
    try {
      const response = await fetch(`/api/jobs/job-targets/${job.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        navigate("/jobs");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  };

  const [isStarting, setIsStarting] = useState(false);
  
  const handleStartPracticeOption = async (option: PracticeOption) => {
    if (!checkAccess()) {
      return;
    }
    
    setIsStarting(true);
    try {
      // Use quick-start endpoint to skip config page and go directly to session
      const response = await fetch("/api/interview/session/quick-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          jobTargetId: job?.id,
          roundCategory: option.roundCategory,
          objective: option.objective,
          skillsAssessed: option.skillsAssessed,
        }),
      });
      
      const data = await response.json();
      
      if (response.status === 403 && data.upgradeRequired) {
        setShowUpgradeModal(true);
        return;
      }
      
      if (data.success) {
        navigate(`/interview/session?interviewSessionId=${data.session.id}&configId=${data.configId}`);
      } else {
        console.error("Failed to start session:", data.error);
      }
    } catch (error) {
      console.error("Error starting practice:", error);
    } finally {
      setIsStarting(false);
    }
  };


  const refreshEntitlements = async () => {
    if (!jobId) return;
    try {
      const res = await fetch(`/api/payments/entitlements?jobTargetId=${jobId}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setEntitlements(data);
      }
    } catch (e) {
      console.error("Error refreshing entitlements:", e);
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </SidebarLayout>
    );
  }

  if (!job) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-slate-500">Job not found</p>
        </div>
      </SidebarLayout>
    );
  }

  const parsed = job.jdParsed;

  const readiness = job.readinessScore || 0;
  const status = statusConfig[job.status] || statusConfig.saved;
  
  // Calculate total prep time from practice options typicalDuration values
  const totalPrepTime = practiceOptions.reduce((acc, option) => {
    // Parse typicalDuration like "10-15 min" to get min and max
    const match = option.typicalDuration?.match(/(\d+)-?(\d+)?/);
    if (match) {
      const min = parseInt(match[1]) || 10;
      const max = parseInt(match[2]) || min;
      return { min: acc.min + min, max: acc.max + max };
    }
    return { min: acc.min + 10, max: acc.max + 15 }; // Default fallback
  }, { min: 0, max: 0 });

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#fbfbfc]">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          
          {/* Compact Header - Matching Role Detail Page */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl text-white">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => navigate("/jobs")}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  All jobs
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-white/60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Job
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold truncate">{job.roleTitle}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {job.companyName && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {job.companyName}
                      </span>
                    )}
                    {job.location && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.location}
                        </span>
                      </>
                    )}
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {totalPrepTime.min === totalPrepTime.max 
                        ? `${totalPrepTime.min}m` 
                        : `${totalPrepTime.min}-${totalPrepTime.max}m`}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">{practiceOptions.length} rounds</span>
                    {practiceHistory && practiceHistory.summary.totalAttempts > 0 && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {practiceHistory.summary.totalAttempts} practiced
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {practiceHistory && practiceHistory.summary.totalAttempts > 0 && (
                  <Button
                    onClick={() => navigate(`/hiready-index?jobTargetId=${job.id}`)}
                    size="sm"
                    variant="outline"
                    className="hidden sm:flex h-8 px-3 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white text-xs"
                  >
                    <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                    View Index
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Free Trial Exhausted Banner */}
          {isFreeTierExhausted && (
            <div className="bg-gradient-to-r from-[#ee7e65]/10 to-[#ee7e65]/5 border border-[#ee7e65]/30 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#ee7e65]/15 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#ee7e65]" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">Free trial completed</p>
                  <p className="text-xs text-slate-600">Upgrade to continue practicing interviews</p>
                </div>
              </div>
              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="bg-[#ee7e65] hover:bg-[#e06c52] text-white font-medium"
                size="sm"
              >
                <Zap className="w-4 h-4 mr-1.5" />
                Upgrade Now
              </Button>
            </div>
          )}
          
          {/* Quick Practice CTA */}
          {practiceOptions.length > 0 && (
            <Button
              onClick={() => handleStartPracticeOption(practiceOptions[0])}
              className={`w-full h-14 font-semibold rounded-xl shadow-lg text-base gap-2 ${
                isFreeTierExhausted
                  ? 'bg-[#ee7e65] hover:bg-[#e06c52] text-white shadow-[#ee7e65]/25'
                  : 'bg-[#24c4b8] hover:bg-[#1db0a5] text-white shadow-[#24c4b8]/25'
              }`}
            >
              {isFreeTierExhausted ? (
                <>
                  <Zap className="w-5 h-5" />
                  Upgrade to Practice
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start Practice Session
                </>
              )}
            </Button>
          )}

        {/* Content */}
        <div className="space-y-4">
          {!job.jdParsed && job.jdText && (
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm">Analyze job description</p>
                  <p className="text-xs text-slate-500">Extract skills and requirements</p>
                </div>
                <Button
                  onClick={handleParseJD}
                  size="sm"
                  className="h-8 px-3 bg-[#24c4b8] hover:bg-[#1db0a5] text-white text-sm"
                  disabled={isParsing}
                >
                  {isParsing ? "..." : "Analyze"}
                </Button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-medium text-slate-900 text-sm">Practice Role</h2>
              {job?.roleKitId && (
                <button 
                  onClick={() => setShowRoleSelector(!showRoleSelector)}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  {showRoleSelector ? "Cancel" : "Change"}
                </button>
              )}
            </div>
            <div className="p-3">
              {showRoleSelector ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 mb-2">Select the role that best matches this job for accurate practice:</p>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {roleKits.map((kit) => (
                      <button
                        key={kit.id}
                        onClick={() => handleUpdateRoleKit(kit.id)}
                        disabled={isSavingRole}
                        className={`p-2 text-left rounded-lg border text-sm transition-all ${
                          job?.roleKitId === kit.id
                            ? "border-slate-900 bg-slate-50 text-slate-900"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-900"
                        }`}
                      >
                        <span className="font-medium block truncate">{kit.name}</span>
                        {kit.category && (
                          <span className="text-xs text-slate-500 block truncate">{kit.category}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    job?.roleKitId ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  }`}>
                    {job?.roleKitId ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 text-sm truncate">
                        {job?.roleKitId 
                          ? roleKits.find(k => k.id === job.roleKitId)?.name || "Role Detected"
                          : "Role selection required"}
                      </p>
                      {job?.roleKitId && job?.roleKitMatchConfidence && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          job.roleKitMatchConfidence === "high" 
                            ? "bg-emerald-100 text-emerald-700" 
                            : job.roleKitMatchConfidence === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                        }`}>
                          {job.roleKitMatchConfidence === "high" ? "Best Match" : 
                           job.roleKitMatchConfidence === "medium" ? "Good Match" : "Suggested"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {job?.roleKitId 
                        ? "Auto-detected from your job description"
                        : "Please select a role to continue practicing"}
                    </p>
                  </div>
                  {!job?.roleKitId && isAutoMapping && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="w-4 h-4 border-2 border-[#24c4b8] border-t-transparent rounded-full animate-spin" />
                      <span>Detecting role...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {accessCheck && !accessCheck.hasAccess && (
            <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900">Unlock Practice</p>
                  <p className="text-xs text-slate-500">Upgrade to continue practicing</p>
                </div>
              </div>
              <Button
                onClick={() => setShowUpgradeModal(true)}
                size="sm"
                className="h-8 px-3 text-xs bg-[#24c4b8] hover:bg-[#1db0a5] text-white"
              >
                Upgrade
              </Button>
            </div>
          )}

          {practiceHistory && practiceHistory.summary.totalAttempts > 0 && (
            <div className="bg-gradient-to-r from-[#24c4b8]/5 to-transparent rounded-lg border border-[#24c4b8]/20 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#24c4b8]/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[#24c4b8]" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Practice Progress</p>
                    <p className="text-xs text-slate-500">
                      {practiceHistory.summary.totalAttempts} total sessions
                      {practiceHistory.summary.averageScore !== null && (
                        <> • Avg: {practiceHistory.summary.averageScore}%</>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => job?.roleKitId && navigate(`/hiready-index?roleKitId=${job.roleKitId}`)}
                  variant="outline"
                  size="sm"
                  className="text-xs border-[#24c4b8]/30 text-[#24c4b8] hover:bg-[#24c4b8]/10"
                >
                  View HiReady Index
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {practiceOptions.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-slate-500" />
                  Interview Rounds
                </h2>
                {practiceHistory && practiceHistory.summary.totalAttempts > 0 && (
                  <span className="text-xs text-slate-500">
                    {practiceHistory.summary.roundsPracticed}/{practiceOptions.length} completed
                  </span>
                )}
              </div>
              
              {companyData?.blueprintNotes && (
                <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200/60 rounded-lg">
                  <p className="text-xs text-amber-800 leading-relaxed">{companyData.blueprintNotes}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {practiceOptions.map((option, idx) => {
                  const config = categoryConfig[option.roundCategory] || { icon: <FileText className="w-3.5 h-3.5" />, color: "text-slate-600", bg: "bg-slate-100" };
                  const history = getRoundHistory(option.roundCategory);
                  const hasPracticed = history && history.attemptCount > 0;
                  const focusAreas = option.skillsAssessed || [];
                  
                  return (
                    <div
                      key={option.id}
                      className={`bg-white rounded-xl border p-3 hover:shadow-md transition-all group ${
                        hasPracticed ? 'border-emerald-200' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                            hasPracticed ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'
                          }`}>
                            {hasPracticed ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                          </span>
                          <div className={`w-7 h-7 rounded-lg ${config.bg} ${config.color} flex items-center justify-center`}>
                            {config.icon}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{option.label}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{option.description}</p>
                        </div>
                      </div>
                      
                      {hasPracticed && (
                        <div className="mt-2 flex items-center gap-3 text-[10px]">
                          <span className="text-slate-500">
                            {history.attemptCount} attempt{history.attemptCount > 1 ? 's' : ''}
                          </span>
                          {history.bestScore !== null && (
                            <span className="text-emerald-600 font-medium">
                              Best: {history.bestScore}%
                            </span>
                          )}
                          {history.latestScore !== null && history.latestScore !== history.bestScore && (
                            <span className="text-slate-500">
                              Latest: {history.latestScore}%
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {option.typicalDuration}
                          </span>
                          {focusAreas.length > 0 && !hasPracticed && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {focusAreas.slice(0, 2).map((area, areaIdx) => (
                                <span key={areaIdx} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-medium truncate max-w-[70px]">
                                  {area}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => handleStartPracticeOption(option)}
                          size="sm"
                          disabled={isStarting}
                          className={`h-7 px-2.5 text-xs font-medium ${
                            isFreeTierExhausted && !hasPracticed
                              ? 'bg-[#ee7e65] hover:bg-[#e06c52] text-white'
                              : hasPracticed 
                                ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                                : hasAccess
                                  ? 'bg-[#24c4b8] hover:bg-[#1db0a5] text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          } disabled:opacity-70`}
                        >
                          {isStarting ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Starting...
                            </>
                          ) : isFreeTierExhausted && !hasPracticed ? (
                            <>
                              <Zap className="w-3 h-3 mr-1" />
                              Upgrade
                            </>
                          ) : hasPracticed ? (
                            <>
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Retake
                            </>
                          ) : hasAccess ? (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              Start
                            </>
                          ) : (
                            "Unlock"
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {parsed && (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setRequirementsExpanded(!requirementsExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <span className="font-medium text-slate-900 text-sm">Requirements</span>
                {requirementsExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              
              {requirementsExpanded && (
                <div className="p-4 space-y-4">
                  {parsed.experienceLevel && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Experience</p>
                      <span className="inline-block px-2.5 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium capitalize">
                        {parsed.experienceLevel}
                      </span>
                    </div>
                  )}

                  {parsed.focusAreas && parsed.focusAreas.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Focus Areas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {parsed.focusAreas.slice(0, 6).map((area, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {parsed.requiredSkills && parsed.requiredSkills.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {parsed.requiredSkills.slice(0, 8).map((skill, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {parsed.responsibilities && parsed.responsibilities.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Responsibilities</p>
                      <ul className="space-y-1">
                        {parsed.responsibilities.slice(0, 4).map((resp, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="leading-relaxed">{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {parsed.redFlags && parsed.redFlags.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Watch Out</p>
                      <ul className="space-y-1">
                        {parsed.redFlags.slice(0, 3).map((flag, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-amber-700">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                            <span className="leading-relaxed">{flag}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {parsed.analysisDimensions && parsed.analysisDimensions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Assessment Dimensions</p>
                      <div className="flex flex-wrap gap-1.5">
                        {parsed.analysisDimensions.map((dim, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
                            {dim}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {parsed.interviewTopics && parsed.interviewTopics.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Interview Topics</p>
                      <ul className="space-y-1">
                        {parsed.interviewTopics.slice(0, 6).map((topic, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                            <MessageCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                            <span className="leading-relaxed">{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {job.jdText && (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setJdExpanded(!jdExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <span className="font-medium text-slate-900 text-sm">Job Description</span>
                <div className="flex items-center gap-3">
                  {job.jobUrl && (
                    <a
                      href={job.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      View original
                    </a>
                  )}
                  {jdExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>
              {jdExpanded && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-600 mt-3 leading-relaxed max-h-64 overflow-y-auto">
                    {job.jdText}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        interviewSetId={interviewSetId}
        interviewSetName={interviewSetName}
        title="Unlock Interview Access"
        description={`Unlock ${job?.roleTitle || 'this role'} interviews at ${job?.companyName || 'this company'}.`}
      />
    </SidebarLayout>
  );
}
