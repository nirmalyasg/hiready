import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Play, FileText, Code, Phone, User, Briefcase, 
  MessageCircle, Heart, TrendingUp, Clock, Target, LineChart, 
  Users, CheckCircle2, Award, Zap, BookOpen, Building2, GraduationCap,
  ChevronRight, Sparkles
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
  software: <Code className="w-5 h-5" />,
  data: <LineChart className="w-5 h-5" />,
  product: <Briefcase className="w-5 h-5" />,
  design: <Sparkles className="w-5 h-5" />,
  sales: <TrendingUp className="w-5 h-5" />,
  marketing: <Heart className="w-5 h-5" />,
  customer_success: <Users className="w-5 h-5" />,
  operations: <Building2 className="w-5 h-5" />,
  consulting: <BookOpen className="w-5 h-5" />,
  finance: <LineChart className="w-5 h-5" />,
  hr: <Users className="w-5 h-5" />,
  recruiting: <User className="w-5 h-5" />,
  engineering_management: <Users className="w-5 h-5" />,
};

const levelConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  entry: { label: "Entry Level", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  mid: { label: "Mid-Level", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  senior: { label: "Senior", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
};

const categoryConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  hr_screening: { icon: <Phone className="w-4 h-4" />, color: "text-emerald-600", bg: "bg-emerald-50", label: "HR Screening" },
  hr: { icon: <Phone className="w-4 h-4" />, color: "text-emerald-600", bg: "bg-emerald-50", label: "HR Round" },
  hiring_manager: { icon: <User className="w-4 h-4" />, color: "text-blue-600", bg: "bg-blue-50", label: "Hiring Manager" },
  technical_interview: { icon: <Code className="w-4 h-4" />, color: "text-violet-600", bg: "bg-violet-50", label: "Technical" },
  technical: { icon: <Code className="w-4 h-4" />, color: "text-violet-600", bg: "bg-violet-50", label: "Technical" },
  coding: { icon: <Code className="w-4 h-4" />, color: "text-indigo-600", bg: "bg-indigo-50", label: "Coding" },
  coding_assessment: { icon: <Code className="w-4 h-4" />, color: "text-indigo-600", bg: "bg-indigo-50", label: "Coding Assessment" },
  system_design: { icon: <Code className="w-4 h-4" />, color: "text-purple-600", bg: "bg-purple-50", label: "System Design" },
  sql: { icon: <LineChart className="w-4 h-4" />, color: "text-cyan-600", bg: "bg-cyan-50", label: "SQL" },
  analytics: { icon: <LineChart className="w-4 h-4" />, color: "text-teal-600", bg: "bg-teal-50", label: "Analytics" },
  ml: { icon: <Briefcase className="w-4 h-4" />, color: "text-fuchsia-600", bg: "bg-fuchsia-50", label: "Machine Learning" },
  case_study: { icon: <Briefcase className="w-4 h-4" />, color: "text-orange-600", bg: "bg-orange-50", label: "Case Study" },
  case: { icon: <Briefcase className="w-4 h-4" />, color: "text-orange-600", bg: "bg-orange-50", label: "Case Study" },
  product: { icon: <Briefcase className="w-4 h-4" />, color: "text-emerald-600", bg: "bg-emerald-50", label: "Product Sense" },
  portfolio: { icon: <Briefcase className="w-4 h-4" />, color: "text-pink-600", bg: "bg-pink-50", label: "Portfolio Review" },
  sales_roleplay: { icon: <User className="w-4 h-4" />, color: "text-amber-600", bg: "bg-amber-50", label: "Sales Roleplay" },
  behavioral: { icon: <MessageCircle className="w-4 h-4" />, color: "text-amber-600", bg: "bg-amber-50", label: "Behavioral" },
  culture_values: { icon: <Heart className="w-4 h-4" />, color: "text-pink-600", bg: "bg-pink-50", label: "Culture Fit" },
  bar_raiser: { icon: <TrendingUp className="w-4 h-4" />, color: "text-red-600", bg: "bg-red-50", label: "Bar Raiser" },
  aptitude: { icon: <TrendingUp className="w-4 h-4" />, color: "text-slate-600", bg: "bg-slate-50", label: "Aptitude" },
  group: { icon: <Users className="w-4 h-4" />, color: "text-sky-600", bg: "bg-sky-50", label: "Group Discussion" },
};

const getEvaluationCriteria = (skillsFocus: string[] | null, coreCompetencies: string[] | null) => {
  const criteria: { name: string; description: string }[] = [];
  
  if (skillsFocus && skillsFocus.length > 0) {
    skillsFocus.slice(0, 4).forEach(skill => {
      criteria.push({
        name: skill.charAt(0).toUpperCase() + skill.slice(1).replace(/_/g, ' '),
        description: `Demonstrates strong ${skill.replace(/_/g, ' ')} abilities`
      });
    });
  }
  
  if (coreCompetencies && coreCompetencies.length > 0) {
    coreCompetencies.slice(0, 2).forEach(comp => {
      if (!criteria.find(c => c.name.toLowerCase() === comp.toLowerCase())) {
        criteria.push({
          name: comp,
          description: `Shows proficiency in ${comp.toLowerCase()}`
        });
      }
    });
  }
  
  if (criteria.length === 0) {
    criteria.push(
      { name: "Communication", description: "Clear and effective communication" },
      { name: "Problem Solving", description: "Analytical thinking and solutions" },
      { name: "Technical Depth", description: "Domain knowledge and expertise" }
    );
  }
  
  return criteria.slice(0, 6);
};

export default function RoleDetailPage() {
  const { roleId } = useParams<{ roleId: string }>();
  const navigate = useNavigate();
  const [roleKit, setRoleKit] = useState<RoleKit | null>(null);
  const [practiceOptions, setPracticeOptions] = useState<PracticeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
  const domainIcon = domainIcons[roleKit.domain] || <Briefcase className="w-5 h-5" />;
  const evaluationCriteria = getEvaluationCriteria(roleKit.skillsFocus, roleKit.coreCompetencies);
  const totalDuration = roleKit.estimatedDuration ? Math.round(roleKit.estimatedDuration / 60) : practiceOptions.length * 30;

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <button
                onClick={() => navigate("/interview")}
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to roles
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Left Column - Job Details (3/5) */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Job Header Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white flex-shrink-0">
                      {domainIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{roleKit.name}</h1>
                      <p className="text-slate-600 mt-1">{domainLabel}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${level.bg} ${level.text} ${level.border}`}>
                          {level.label}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {totalDuration} min total
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                          <Target className="w-3 h-3" />
                          {practiceOptions.length} rounds
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    Role Overview
                  </h2>
                </div>
                <div className="p-6">
                  <p className="text-slate-600 leading-relaxed">
                    {roleKit.description || 
                      `Practice interviews for ${roleKit.name} positions. This comprehensive interview preparation covers all major rounds typically encountered in ${domainLabel} hiring processes at ${level.label.toLowerCase()} positions.`
                    }
                  </p>
                  
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Experience</p>
                        <p className="text-sm font-medium text-slate-900 mt-0.5">
                          {roleKit.level === 'entry' ? '0-2 years' : roleKit.level === 'mid' ? '3-5 years' : '6+ years'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Domain</p>
                        <p className="text-sm font-medium text-slate-900 mt-0.5">{domainLabel}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Required Skills */}
              {roleKit.skillsFocus && roleKit.skillsFocus.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-slate-500" />
                      Required Skills
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2">
                      {roleKit.skillsFocus.map((skill, idx) => (
                        <span 
                          key={idx} 
                          className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Evaluation Criteria */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-slate-500" />
                    Evaluation Criteria
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">What you'll be assessed on</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {evaluationCriteria.map((criterion, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{criterion.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{criterion.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Interview Rounds (2/5) */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Sticky Header for Interview Rounds */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Interview Rounds
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">Practice each round to prepare</p>
                </div>
                
                <div className="p-4 space-y-3">
                  {practiceOptions.map((option, idx) => {
                    const config = categoryConfig[option.roundCategory] || { 
                      icon: <FileText className="w-4 h-4" />, 
                      color: "text-slate-600", 
                      bg: "bg-slate-50",
                      label: option.label 
                    };
                    const focusAreas = option.focusAreas || [];
                    const expectedSignals = option.roleBlueprint?.expectedSignals || [];
                    
                    return (
                      <div
                        key={option.id}
                        className="group bg-white border border-slate-200 rounded-xl overflow-hidden transition-all hover:border-slate-300 hover:shadow-md"
                      >
                        {/* Round Header */}
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <div className={`w-9 h-9 rounded-lg ${config.bg} ${config.color} flex items-center justify-center`}>
                                {config.icon}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-semibold text-slate-900 text-sm">{option.label}</p>
                                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{option.description}</p>
                                </div>
                              </div>
                              
                              {/* Duration Badge */}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {option.typicalDuration}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Focus Areas */}
                          {focusAreas.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">Focus Areas</p>
                              <div className="flex flex-wrap gap-1">
                                {focusAreas.slice(0, 4).map((area: string, areaIdx: number) => (
                                  <span key={areaIdx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">
                                    {area}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Expected Signals (Objectives) */}
                          {expectedSignals.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">Objectives</p>
                              <ul className="space-y-1">
                                {expectedSignals.slice(0, 3).map((signal: string, sigIdx: number) => (
                                  <li key={sigIdx} className="flex items-start gap-1.5 text-xs text-slate-600">
                                    <ChevronRight className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                                    <span className="line-clamp-1">{signal}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        {/* Start Button */}
                        <div className="px-4 pb-4">
                          <Button
                            onClick={() => handleStartPractice(option)}
                            className="w-full bg-[#ee7e65] hover:bg-[#e06a50] text-white h-9 text-sm font-medium shadow-sm"
                          >
                            <Play className="w-3.5 h-3.5 mr-2" />
                            Start Practice
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Tips Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
                <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Preparation Tips
                </h3>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                    Practice each round in sequence for best results
                  </li>
                  <li className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                    Review feedback after each session
                  </li>
                  <li className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                    Focus on areas marked for improvement
                  </li>
                </ul>
              </div>
            </div>
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
