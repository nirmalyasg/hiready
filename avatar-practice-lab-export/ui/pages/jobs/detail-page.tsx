import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Sparkles, Play, FileText, Code, CheckCircle2, AlertCircle, MoreVertical, Trash2, ChevronDown, ChevronUp, Phone, User, Briefcase, MessageCircle, Heart, TrendingUp, ExternalLink, Lock, Crown } from "lucide-react";
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
  
  const matchedRoleKit = roleKits.find(r => r.id === job?.roleKitId);
  const interviewSetId = job?.roleKitId ?? undefined;
  const interviewSetName = matchedRoleKit?.name ? `${matchedRoleKit.name} Interview Set` : job?.roleTitle ? `${job.roleTitle} Interview Set` : undefined;
  
  const { checkAccess, showUpgradeModal, setShowUpgradeModal, accessCheck } = useAccessGate({
    interviewSetId,
    interviewSetName,
    context: 'job'
  });

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

  const handleStartPracticeOption = (option: PracticeOption) => {
    if (!checkAccess()) {
      return;
    }
    navigate(`/interview/config?jobTargetId=${job?.id}&roundCategory=${option.roundCategory}`);
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

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#fbfbfc]">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          
          {/* Hero Header */}
          <div className="bg-gradient-to-br from-[#000000] to-[#1a0a2e] rounded-2xl p-6 shadow-xl text-white">
            <div className="flex items-start justify-between mb-4">
              <button
                onClick={() => navigate("/jobs")}
                className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white/80" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-white/60" />
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
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold truncate">{job.roleTitle}</h1>
                <div className="flex items-center gap-2 text-sm text-white/70 mt-1">
                  {job.companyName && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{job.companyName}</span>}
                  {job.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>}
                </div>
              </div>
            </div>
            
            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/10">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#24c4b8]">{readiness}%</p>
                <p className="text-xs text-white/60">Readiness</p>
              </div>
              <div className="text-center border-x border-white/10">
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                  {status.label}
                </div>
                <p className="text-xs text-white/60 mt-1">Status</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{practiceOptions.length}</p>
                <p className="text-xs text-white/60">Rounds</p>
              </div>
            </div>
          </div>

          {/* Quick Practice CTA */}
          {practiceOptions.length > 0 && entitlements?.canStartSession && (
            <Button
              onClick={() => handleStartPracticeOption(practiceOptions[0])}
              className="w-full h-14 bg-[#24c4b8] hover:bg-[#1db0a5] text-white font-semibold rounded-xl shadow-lg shadow-[#24c4b8]/25 text-base gap-2"
            >
              <Play className="w-5 h-5" />
              Start Practice Session
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
                  {!job?.roleKitId && (
                    <Button
                      onClick={() => setShowRoleSelector(true)}
                      size="sm"
                      className="bg-[#24c4b8] hover:bg-[#1db0a5] text-white text-xs"
                    >
                      Select Role
                    </Button>
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

          {practiceOptions.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="font-medium text-slate-900 text-sm">Interview Stages</h2>
              </div>
              {companyData?.blueprintNotes && (
                <div className="mx-3 mt-3 p-2.5 bg-amber-50 border border-amber-200/60 rounded-lg">
                  <p className="text-xs text-amber-800 leading-relaxed">{companyData.blueprintNotes}</p>
                </div>
              )}
              <div className="p-2">
                {practiceOptions.map((option, idx) => {
                  const config = categoryConfig[option.roundCategory] || { icon: <FileText className="w-4 h-4" />, color: "text-slate-600", bg: "bg-slate-50" };
                  return (
                    <div
                      key={option.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${idx !== practiceOptions.length - 1 ? "mb-1" : ""} hover:bg-slate-50 active:bg-slate-100`}
                    >
                      <div className={`w-9 h-9 rounded-lg ${config.bg} ${config.color} flex items-center justify-center flex-shrink-0`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{option.label}</p>
                        <p className="text-xs text-slate-500">{option.typicalDuration}</p>
                      </div>
                      <Button
                        onClick={() => handleStartPracticeOption(option)}
                        size="sm"
                        className={`h-8 px-3 text-xs ${
                          accessCheck?.hasAccess
                            ? "bg-[#24c4b8] hover:bg-[#1db0a5] text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        {accessCheck?.hasAccess ? "Start" : "Unlock"}
                      </Button>
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
