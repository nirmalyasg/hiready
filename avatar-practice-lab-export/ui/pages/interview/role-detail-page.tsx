import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, Play, FileText, Code, Phone, User, Briefcase, 
  MessageCircle, Heart, TrendingUp, Clock, Target, LineChart, 
  Users, CheckCircle2, Award, Zap, BookOpen, Building2,
  ChevronDown, ChevronUp, Sparkles, Info, RotateCcw, BarChart3, Loader2,
  Upload, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SidebarLayout from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAccessGate } from "@/components/monetization/access-gate";
import { UpgradeModal } from "@/components/monetization/upgrade-modal";

interface RoleKit {
  id: number;
  name: string;
  level: "entry" | "mid" | "senior";
  domain: string;
  description: string | null;
  skillsFocus: string[] | null;
  estimatedDuration: number | null;
  coreCompetencies: string[] | null;
  defaultInterviewTypes: string[] | null;
  typicalResponsibilities: string[] | null;
  interviewTopics: { category: string; topics: string[] }[] | null;
  evaluationFocus: { dimension: string; lookFor: string[]; redFlags: string[] }[] | null;
  dayInLifeContext: string | null;
  expectedExperience: { mustHave: string[]; niceToHave: string[] } | null;
  salaryRange: { min: number; max: number; currency: string } | null;
}

interface PracticeOption {
  id: string;
  phaseId: string;
  roundCategory: string;
  label: string;
  description: string;
  practiceMode: string;
  typicalDuration: string;
  icon: string;
  taxonomy: {
    label: string;
    description: string;
    typicalDuration: string;
  };
  roleContext: {
    roleKitId: number;
    roleName: string;
    level: string;
    domain: string;
    skillsFocus: string[];
    roleArchetypeId: string;
  };
  focusHint: string | null;
  focusAreas?: string[];
  roleBlueprint?: {
    taskType: string;
    expectedSignals: string[];
  } | null;
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

interface PracticeHistory {
  practiceHistory: Record<string, PracticeHistoryItem>;
  summary: {
    totalAttempts: number;
    roundsPracticed: number;
    averageScore: number | null;
  };
}

const domainLabels: Record<string, string> = {
  software: "Software Engineering",
  data: "Data & Analytics",
  product: "Product Management",
  design: "Design",
  sales: "Sales",
  marketing: "Marketing",
  customer_success: "Customer Success",
  operations: "Operations",
  consulting: "Consulting",
  finance: "Finance",
  hr: "Human Resources",
  recruiting: "Recruiting",
  engineering_management: "Engineering Management",
};

const domainIcons: Record<string, React.ReactNode> = {
  software: <Code className="w-4 h-4" />,
  data: <LineChart className="w-4 h-4" />,
  product: <Briefcase className="w-4 h-4" />,
  design: <Sparkles className="w-4 h-4" />,
  sales: <TrendingUp className="w-4 h-4" />,
  marketing: <Heart className="w-4 h-4" />,
  customer_success: <Users className="w-4 h-4" />,
  operations: <Building2 className="w-4 h-4" />,
  consulting: <BookOpen className="w-4 h-4" />,
  finance: <LineChart className="w-4 h-4" />,
  hr: <Users className="w-4 h-4" />,
  recruiting: <User className="w-4 h-4" />,
  engineering_management: <Users className="w-4 h-4" />,
};

const levelConfig: Record<string, { label: string; bg: string; text: string }> = {
  entry: { label: "Entry", bg: "bg-emerald-500", text: "text-white" },
  mid: { label: "Mid", bg: "bg-amber-500", text: "text-white" },
  senior: { label: "Senior", bg: "bg-violet-500", text: "text-white" },
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
  aptitude: { icon: <TrendingUp className="w-4 h-4" />, color: "text-gray-500", bg: "bg-gray-500/10" },
  aptitude_assessment: { icon: <TrendingUp className="w-4 h-4" />, color: "text-gray-500", bg: "bg-gray-500/10" },
  group: { icon: <MessageCircle className="w-4 h-4" />, color: "text-[#cb6ce6]", bg: "bg-[#cb6ce6]/10" },
  group_discussion: { icon: <MessageCircle className="w-4 h-4" />, color: "text-[#cb6ce6]", bg: "bg-[#cb6ce6]/10" },
};

export default function RoleDetailPage() {
  const { roleId } = useParams<{ roleId: string }>();
  const navigate = useNavigate();
  const [roleKit, setRoleKit] = useState<RoleKit | null>(null);
  const [practiceOptions, setPracticeOptions] = useState<PracticeOption[]>([]);
  const [practiceHistory, setPracticeHistory] = useState<PracticeHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(true);
  const [startingRoundId, setStartingRoundId] = useState<string | null>(null);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [pendingOption, setPendingOption] = useState<PracticeOption | null>(null);
  
  // Check if user has uploaded a resume
  const { data: documentsData, isError: resumeCheckError } = useQuery({
    queryKey: ['/api/interview/documents', 'resume'],
    queryFn: async () => {
      const res = await fetch('/api/interview/documents?docType=resume', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json();
    },
    retry: 1,
  });
  
  // If fetch fails, assume user has resume (don't show friction modal on errors)
  const hasResume = resumeCheckError || (documentsData?.documents?.length > 0);
  
  const accessGateOptions = {
    interviewSetId: roleKit?.id,
    interviewSetName: roleKit?.name ? `${roleKit.name} Interview Set` : undefined,
    context: 'role' as const
  };
  const { checkAccess, showUpgradeModal, setShowUpgradeModal } = useAccessGate(accessGateOptions);

  useEffect(() => {
    const fetchRoleData = async () => {
      if (!roleId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch role kit and practice options
        const response = await fetch(`/api/interview/role-kits/${roleId}/practice-options`);
        const data = await response.json();
        
        if (!response.ok) {
          setError(data.error || "Failed to load role data");
          return;
        }
        
        if (data.success) {
          setRoleKit(data.roleKit);
          setPracticeOptions(data.options || []);
        } else {
          setError(data.error || "Failed to load role data");
          return;
        }
        
        // Fetch practice history (authenticated endpoint)
        try {
          const historyResponse = await fetch(`/api/interview/role-kits/${roleId}/practice-history`);
          if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            if (historyData.success) {
              setPracticeHistory(historyData);
            }
          }
        } catch {
          // Practice history is optional, don't fail the whole page
          console.log("Could not fetch practice history");
        }
      } catch (err) {
        console.error("Error fetching role data:", err);
        setError("Unable to connect. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRoleData();
  }, [roleId]);

  const handleStartPractice = async (option: PracticeOption, bypassProfileCheck = false) => {
    if (!checkAccess()) {
      return;
    }
    
    // Check if user has resume - if not, show prompt (unless bypassed)
    if (!hasResume && !bypassProfileCheck) {
      setPendingOption(option);
      setShowProfilePrompt(true);
      return;
    }
    
    setStartingRoundId(option.id);
    setError(null);
    
    try {
      const practiceContext = {
        roundCategory: option.roundCategory,
        taxonomy: option.taxonomy || {
          label: option.label,
          description: option.description,
          typicalDuration: option.typicalDuration,
        },
        roleContext: {
          roleKitId: roleKit?.id,
          roleName: roleKit?.name,
          level: roleKit?.level,
          domain: roleKit?.domain,
          skillsFocus: roleKit?.skillsFocus || [],
        },
        focusAreas: option.focusAreas || [],
      };
      
      // Call quick-start API to create session directly
      const response = await fetch("/api/interview/session/quick-start-rolekit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          roleKitId: roleKit?.id,
          roundCategory: option.roundCategory,
          focusAreas: option.focusAreas || [],
          practiceContext,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.code === "NO_ACCESS" || data.code === "FREE_LIMIT_REACHED") {
          setShowUpgradeModal(true);
          return;
        }
        throw new Error(data.error || "Failed to start practice session");
      }
      
      if (data.success && data.session?.id) {
        // Navigate directly to session page
        navigate(`/interview/session?interviewSessionId=${data.session.id}&configId=${data.configId}`);
      } else {
        throw new Error(data.error || "Failed to create session");
      }
    } catch (err: any) {
      console.error("Error starting practice:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setStartingRoundId(null);
    }
  };

  const getRoundHistory = (roundCategory: string): PracticeHistoryItem | null => {
    if (!practiceHistory?.practiceHistory) return null;
    return practiceHistory.practiceHistory[roundCategory] || null;
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <LoadingSpinner />
        </div>
      </SidebarLayout>
    );
  }

  if (error || !roleKit) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
          <p className="text-slate-500">{error || "Role not found"}</p>
          <Button onClick={() => navigate("/interview")} variant="outline">
            Back to Roles
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  const level = levelConfig[roleKit.level] || levelConfig.entry;
  const domainLabel = domainLabels[roleKit.domain] || roleKit.domain;
  const domainIcon = domainIcons[roleKit.domain] || <Briefcase className="w-4 h-4" />;
  const totalDuration = roleKit.estimatedDuration ? Math.round(roleKit.estimatedDuration / 60) : practiceOptions.length * 30;
  const hasPracticeHistory = practiceHistory && practiceHistory.summary.totalAttempts > 0;

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-slate-50">
        {/* Compact Header - matches job detail page */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <button
              onClick={() => navigate("/interview")}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All roles
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                {domainIcon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-lg font-bold truncate">{roleKit.name}</h1>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${level.bg} ${level.text}`}>
                    {level.label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {domainLabel}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {totalDuration}m
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-400">{practiceOptions.length} rounds</span>
                  {hasPracticeHistory && (
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
              {hasPracticeHistory && (
                <Button
                  onClick={() => navigate(`/hiready-index?roleKitId=${roleKit.id}`)}
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

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
          {/* Quick Practice CTA - matches job detail page */}
          {practiceOptions.length > 0 && (
            <Button
              onClick={() => handleStartPractice(practiceOptions[0])}
              disabled={startingRoundId === practiceOptions[0]?.id}
              className="w-full h-14 bg-[#24c4b8] hover:bg-[#1db0a5] text-white font-semibold rounded-xl shadow-lg shadow-[#24c4b8]/25 text-base gap-2"
            >
              {startingRoundId === practiceOptions[0]?.id ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start Practice Session
                </>
              )}
            </Button>
          )}

          {/* Practice Progress - matches job detail page */}
          {hasPracticeHistory && (
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
                  onClick={() => navigate(`/hiready-index?roleKitId=${roleKit.id}`)}
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs border-[#24c4b8]/30 text-[#24c4b8] hover:bg-[#24c4b8]/10"
                >
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                  View Progress
                </Button>
              </div>
            </div>
          )}

          {/* Interview Rounds Grid - Primary Focus */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-500" />
                Interview Rounds
              </h2>
              {hasPracticeHistory && (
                <span className="text-xs text-slate-500">
                  {practiceHistory.summary.roundsPracticed}/{practiceOptions.length} completed
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {practiceOptions.map((option, idx) => {
                const config = categoryConfig[option.roundCategory] || { 
                  icon: <FileText className="w-3.5 h-3.5" />, 
                  color: "text-slate-600", 
                  bg: "bg-slate-100"
                };
                const focusAreas = option.focusAreas || [];
                const history = getRoundHistory(option.roundCategory);
                const hasAttempted = history && history.attemptCount > 0;
                
                return (
                  <div
                    key={option.id}
                    className={`bg-white rounded-xl border p-3 hover:shadow-md transition-all group ${
                      hasAttempted ? 'border-emerald-200' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                          hasAttempted ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'
                        }`}>
                          {hasAttempted ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
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
                    
                    {/* Practice Stats (if attempted) */}
                    {hasAttempted && (
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
                        {focusAreas.length > 0 && !hasAttempted && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {focusAreas.slice(0, 3).map((area, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-medium truncate max-w-[70px]">
                                {area}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => handleStartPractice(option)}
                        size="sm"
                        disabled={startingRoundId === option.id}
                        className={`h-7 px-2.5 text-xs font-medium ${
                          hasAttempted 
                            ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                            : 'bg-[#24c4b8] hover:bg-[#1db0a5] text-white'
                        } disabled:opacity-70`}
                      >
                        {startingRoundId === option.id ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Starting...
                          </>
                        ) : hasAttempted ? (
                          <>
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Retake
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 mr-1" />
                            Start
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Collapsible Role Details */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Role Details & Interview Guide</span>
              </div>
              {showDetails ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>
            
            {showDetails && (
              <div className="px-4 pb-4 border-t border-slate-100 space-y-5">
                {/* Description */}
                {roleKit.description && (
                  <div className="pt-4">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">About this role</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{roleKit.description}</p>
                  </div>
                )}
                
                {/* Day in the Life */}
                {roleKit.dayInLifeContext && (
                  <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-lg border border-slate-200/50">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Day in the Life
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">{roleKit.dayInLifeContext}</p>
                  </div>
                )}

                {/* Typical Responsibilities */}
                {roleKit.typicalResponsibilities && roleKit.typicalResponsibilities.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Target className="w-3 h-3" />
                      Typical Responsibilities
                    </p>
                    <ul className="space-y-1.5">
                      {roleKit.typicalResponsibilities.map((resp, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
                          {resp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Skills & Competencies Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Required Skills */}
                  {roleKit.skillsFocus && roleKit.skillsFocus.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Zap className="w-3 h-3" />
                        Required Skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {roleKit.skillsFocus.map((skill, idx) => (
                          <span 
                            key={idx} 
                            className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Core Competencies */}
                  {roleKit.coreCompetencies && roleKit.coreCompetencies.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Core Competencies</p>
                      <div className="flex flex-wrap gap-1.5">
                        {roleKit.coreCompetencies.map((comp, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Expected Experience */}
                {roleKit.expectedExperience && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {roleKit.expectedExperience.mustHave && roleKit.expectedExperience.mustHave.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Must Have
                        </p>
                        <ul className="space-y-1">
                          {roleKit.expectedExperience.mustHave.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {roleKit.expectedExperience.niceToHave && roleKit.expectedExperience.niceToHave.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          Nice to Have
                        </p>
                        <ul className="space-y-1">
                          {roleKit.expectedExperience.niceToHave.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                              <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Interview Topics */}
                {roleKit.interviewTopics && roleKit.interviewTopics.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3" />
                      Common Interview Topics
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {roleKit.interviewTopics.map((topicGroup, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-xs font-semibold text-slate-700 mb-1.5">{topicGroup.category}</p>
                          <div className="flex flex-wrap gap-1">
                            {topicGroup.topics.slice(0, 4).map((topic, tIdx) => (
                              <span key={tIdx} className="px-1.5 py-0.5 bg-white text-slate-600 rounded text-[10px] border border-slate-200">
                                {topic}
                              </span>
                            ))}
                            {topicGroup.topics.length > 4 && (
                              <span className="px-1.5 py-0.5 text-slate-400 text-[10px]">
                                +{topicGroup.topics.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Evaluation Focus */}
                {roleKit.evaluationFocus && roleKit.evaluationFocus.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Award className="w-3 h-3" />
                      What Interviewers Look For
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {roleKit.evaluationFocus.map((evalItem, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200">
                          <p className="text-xs font-semibold text-slate-800 mb-2">{evalItem.dimension}</p>
                          <div className="space-y-2">
                            <div>
                              <p className="text-[10px] text-emerald-600 font-medium mb-1">Look for:</p>
                              <div className="flex flex-wrap gap-1">
                                {evalItem.lookFor.slice(0, 3).map((item, lIdx) => (
                                  <span key={lIdx} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px]">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] text-red-500 font-medium mb-1">Red flags:</p>
                              <div className="flex flex-wrap gap-1">
                                {evalItem.redFlags.slice(0, 2).map((item, rIdx) => (
                                  <span key={rIdx} className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-[10px]">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Salary Range */}
                {roleKit.salaryRange && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Typical salary range: </span>
                      <span className="font-semibold text-slate-700">
                        ${(roleKit.salaryRange.min / 1000).toFixed(0)}k - ${(roleKit.salaryRange.max / 1000).toFixed(0)}k {roleKit.salaryRange.currency}
                      </span>
                    </div>
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
        interviewSetId={roleKit?.id}
        interviewSetName={roleKit?.name ? `${roleKit.name} Interview Set` : undefined}
        title="Unlock Interview Access"
        description={`Unlock ${roleKit?.name || 'this role'} interviews to continue practicing.`}
      />
      
      {/* Profile Prompt Modal */}
      {showProfilePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-amber-600" />
                </div>
                <button
                  onClick={() => {
                    setShowProfilePrompt(false);
                    setPendingOption(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Get Personalized Feedback
              </h3>
              <p className="text-slate-600 text-sm mb-6">
                Upload your resume to receive AI-powered feedback tailored to your experience. 
                We'll reference your actual projects, roles, and achievements to suggest stronger answers.
              </p>
              
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-800 mb-1">With your resume:</p>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>• "Better Answers" use your real experience</li>
                      <li>• Feedback references your actual projects</li>
                      <li>• Suggestions align with your career level</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => {
                    setShowProfilePrompt(false);
                    setPendingOption(null);
                    navigate("/profile");
                  }}
                  className="w-full bg-gradient-to-r from-[#042c4c] to-[#0a3d68] text-white hover:from-[#0a3d68] hover:to-[#042c4c]"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Resume
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowProfilePrompt(false);
                    if (pendingOption) {
                      handleStartPractice(pendingOption, true);
                      setPendingOption(null);
                    }
                  }}
                  className="w-full text-slate-500 hover:text-slate-700"
                >
                  Continue without resume
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
