import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Play, FileText, Code, Phone, User, Briefcase, 
  MessageCircle, Heart, TrendingUp, Clock, Target, LineChart, 
  Users, CheckCircle2, Award, Zap, BookOpen, Building2,
  ChevronDown, ChevronUp, Sparkles, Info, RotateCcw, BarChart3
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
  hr_screening: { icon: <Phone className="w-3.5 h-3.5" />, color: "text-emerald-600", bg: "bg-emerald-100" },
  hr: { icon: <Phone className="w-3.5 h-3.5" />, color: "text-emerald-600", bg: "bg-emerald-100" },
  hiring_manager: { icon: <User className="w-3.5 h-3.5" />, color: "text-blue-600", bg: "bg-blue-100" },
  technical_interview: { icon: <Code className="w-3.5 h-3.5" />, color: "text-violet-600", bg: "bg-violet-100" },
  technical: { icon: <Code className="w-3.5 h-3.5" />, color: "text-violet-600", bg: "bg-violet-100" },
  coding: { icon: <Code className="w-3.5 h-3.5" />, color: "text-indigo-600", bg: "bg-indigo-100" },
  coding_assessment: { icon: <Code className="w-3.5 h-3.5" />, color: "text-indigo-600", bg: "bg-indigo-100" },
  system_design: { icon: <Code className="w-3.5 h-3.5" />, color: "text-purple-600", bg: "bg-purple-100" },
  sql: { icon: <LineChart className="w-3.5 h-3.5" />, color: "text-cyan-600", bg: "bg-cyan-100" },
  analytics: { icon: <LineChart className="w-3.5 h-3.5" />, color: "text-teal-600", bg: "bg-teal-100" },
  ml: { icon: <Briefcase className="w-3.5 h-3.5" />, color: "text-fuchsia-600", bg: "bg-fuchsia-100" },
  case_study: { icon: <Briefcase className="w-3.5 h-3.5" />, color: "text-orange-600", bg: "bg-orange-100" },
  case: { icon: <Briefcase className="w-3.5 h-3.5" />, color: "text-orange-600", bg: "bg-orange-100" },
  product: { icon: <Briefcase className="w-3.5 h-3.5" />, color: "text-emerald-600", bg: "bg-emerald-100" },
  portfolio: { icon: <Briefcase className="w-3.5 h-3.5" />, color: "text-pink-600", bg: "bg-pink-100" },
  sales_roleplay: { icon: <User className="w-3.5 h-3.5" />, color: "text-amber-600", bg: "bg-amber-100" },
  behavioral: { icon: <MessageCircle className="w-3.5 h-3.5" />, color: "text-amber-600", bg: "bg-amber-100" },
  culture_values: { icon: <Heart className="w-3.5 h-3.5" />, color: "text-pink-600", bg: "bg-pink-100" },
  bar_raiser: { icon: <TrendingUp className="w-3.5 h-3.5" />, color: "text-red-600", bg: "bg-red-100" },
  aptitude: { icon: <TrendingUp className="w-3.5 h-3.5" />, color: "text-slate-600", bg: "bg-slate-100" },
  group: { icon: <Users className="w-3.5 h-3.5" />, color: "text-sky-600", bg: "bg-sky-100" },
};

export default function RoleDetailPage() {
  const { roleId } = useParams<{ roleId: string }>();
  const navigate = useNavigate();
  const [roleKit, setRoleKit] = useState<RoleKit | null>(null);
  const [practiceOptions, setPracticeOptions] = useState<PracticeOption[]>([]);
  const [practiceHistory, setPracticeHistory] = useState<PracticeHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
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

  const handleStartPractice = (option: PracticeOption) => {
    if (!checkAccess()) {
      return;
    }
    
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
      promptHints: {
        avatarPersona: `${roleKit?.level} ${roleKit?.name} Interviewer`,
        evaluationFocus: roleKit?.skillsFocus || [],
        sampleQuestions: [],
        companySpecificGuidance: `Focus on ${option.label} for ${roleKit?.name} role at ${roleKit?.level} level`,
      },
    };
    sessionStorage.setItem("rolePracticeContext", JSON.stringify(practiceContext));
    
    const params = new URLSearchParams({
      roleKitId: String(roleKit?.id),
      roundCategory: option.roundCategory,
    });
    navigate(`/interview/config?${params.toString()}`);
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
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="max-w-5xl mx-auto px-4 py-4">
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
                <h1 className="text-lg font-bold truncate">{roleKit.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${level.bg} ${level.text}`}>
                    {level.label}
                  </span>
                  <span className="text-xs text-slate-400">{domainLabel}</span>
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
        <div className="max-w-5xl mx-auto px-4 py-4">
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
                        className={`h-7 px-2.5 text-xs font-medium ${
                          hasAttempted 
                            ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                            : 'bg-[#ee7e65] hover:bg-[#e06a50] text-white'
                        }`}
                      >
                        {hasAttempted ? (
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

          {/* Mobile View Index Button */}
          {hasPracticeHistory && (
            <div className="sm:hidden mb-4">
              <Button
                onClick={() => navigate(`/hiready-index?roleKitId=${roleKit.id}`)}
                className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View HiReady Index
              </Button>
            </div>
          )}

          {/* Collapsible Role Details */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Role Details & Evaluation Criteria</span>
              </div>
              {showDetails ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>
            
            {showDetails && (
              <div className="px-4 pb-4 border-t border-slate-100">
                {/* Description */}
                {roleKit.description && (
                  <div className="pt-4">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">About this role</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{roleKit.description}</p>
                  </div>
                )}
                
                {/* Skills */}
                {roleKit.skillsFocus && roleKit.skillsFocus.length > 0 && (
                  <div className="pt-4">
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
                
                {/* Evaluation Criteria */}
                <div className="pt-4">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Award className="w-3 h-3" />
                    Evaluation Criteria
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(roleKit.skillsFocus || ['Communication', 'Problem Solving', 'Technical Depth']).slice(0, 6).map((skill, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        <span className="truncate">{typeof skill === 'string' ? skill : skill}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Core Competencies */}
                {roleKit.coreCompetencies && roleKit.coreCompetencies.length > 0 && (
                  <div className="pt-4">
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
    </SidebarLayout>
  );
}
