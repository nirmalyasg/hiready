import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, FileText, Code, Phone, User, Briefcase, MessageCircle, Heart, TrendingUp, ChevronDown, ChevronUp, Sparkles, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import SidebarLayout from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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

const levelConfig: Record<string, { label: string; bg: string; text: string }> = {
  entry: { label: "Entry Level", bg: "bg-emerald-500/20", text: "text-emerald-200" },
  mid: { label: "Mid-Level", bg: "bg-amber-500/20", text: "text-amber-200" },
  senior: { label: "Senior", bg: "bg-rose-500/20", text: "text-rose-200" },
};

const categoryConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  hr_screening: { icon: <Phone className="w-4 h-4" />, color: "text-emerald-600", bg: "bg-emerald-50" },
  hiring_manager: { icon: <User className="w-4 h-4" />, color: "text-blue-600", bg: "bg-blue-50" },
  technical_interview: { icon: <Code className="w-4 h-4" />, color: "text-violet-600", bg: "bg-violet-50" },
  coding_assessment: { icon: <Code className="w-4 h-4" />, color: "text-violet-600", bg: "bg-violet-50" },
  system_design: { icon: <Code className="w-4 h-4" />, color: "text-violet-600", bg: "bg-violet-50" },
  case_study: { icon: <Briefcase className="w-4 h-4" />, color: "text-orange-600", bg: "bg-orange-50" },
  behavioral: { icon: <MessageCircle className="w-4 h-4" />, color: "text-amber-600", bg: "bg-amber-50" },
  culture_values: { icon: <Heart className="w-4 h-4" />, color: "text-pink-600", bg: "bg-pink-50" },
  bar_raiser: { icon: <TrendingUp className="w-4 h-4" />, color: "text-red-600", bg: "bg-red-50" },
};

export default function RoleDetailPage() {
  const { roleId } = useParams<{ roleId: string }>();
  const navigate = useNavigate();
  const [roleKit, setRoleKit] = useState<RoleKit | null>(null);
  const [practiceOptions, setPracticeOptions] = useState<PracticeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skillsExpanded, setSkillsExpanded] = useState(true);

  useEffect(() => {
    const fetchRoleData = async () => {
      if (!roleId) return;
      
      try {
        setIsLoading(true);
        setError(null);
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

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#042c4c] to-[#0a4a7a]">
          <LoadingSpinner />
        </div>
      </SidebarLayout>
    );
  }

  if (error || !roleKit) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
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

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-br from-[#042c4c] via-[#0a3d5c] to-[#042c4c] text-white">
          <div className="max-w-2xl mx-auto px-4 pt-4 pb-5">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => navigate("/interview")}
                className="p-1.5 -ml-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            
            <h1 className="text-lg sm:text-xl font-bold leading-tight">{roleKit.name}</h1>
            
            <p className="text-sm text-white/70 mt-1">{domainLabel}</p>

            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${level.bg} ${level.text}`}>
                {level.label}
              </span>
              {roleKit.estimatedDuration && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/80 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {Math.round(roleKit.estimatedDuration / 60)} min total
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          {practiceOptions.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-semibold text-[#042c4c] text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#ee7e65]" />
                  Interview Stages
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Practice each stage to prepare</p>
              </div>
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
                        <p className="font-medium text-[#042c4c] text-sm truncate">{option.label}</p>
                        <p className="text-xs text-slate-500">{option.typicalDuration}</p>
                      </div>
                      <Button
                        onClick={() => handleStartPractice(option)}
                        size="sm"
                        className="bg-[#042c4c] hover:bg-[#0a3d5c] text-white h-8 px-3 text-xs shadow-sm"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(roleKit.skillsFocus?.length || roleKit.coreCompetencies?.length || roleKit.description) && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
              <button
                onClick={() => setSkillsExpanded(!skillsExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between bg-slate-50/50 border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ee7e65]" />
                  <span className="font-semibold text-[#042c4c] text-sm">Role Details</span>
                </div>
                {skillsExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              
              {skillsExpanded && (
                <div className="p-4 space-y-4">
                  {roleKit.description && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">About</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{roleKit.description}</p>
                    </div>
                  )}

                  {roleKit.skillsFocus && roleKit.skillsFocus.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Skills Focus</p>
                      <div className="flex flex-wrap gap-1.5">
                        {roleKit.skillsFocus.slice(0, 8).map((skill, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-[#ee7e65]/10 text-[#ee7e65] rounded-full text-xs font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {roleKit.coreCompetencies && roleKit.coreCompetencies.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Core Competencies</p>
                      <div className="flex flex-wrap gap-1.5">
                        {roleKit.coreCompetencies.slice(0, 6).map((comp, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
