import { useState, useEffect, useRef } from "react";
import { ChevronRight, Settings, Loader2, Briefcase, Play, Building2, Target, Info, Clock, MessageSquare, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { PurchaseModal } from "@/components/purchase-modal";

interface RoleKit {
  id: number;
  name: string;
  level: string;
  domain: string;
  description: string | null;
  skillsFocus: string[] | null;
  defaultInterviewTypes: string[] | null;
}

interface PracticeContext {
  roundCategory: string;
  taxonomy: {
    label: string;
    description: string;
    typicalDuration: string;
  };
  companyContext: {
    jobTargetId: string;
    companyName: string | null;
    roleTitle: string | null;
    archetype: string | null;
    hasBlueprint: boolean;
    blueprintNotes: string | null;
  };
  promptHints: {
    avatarPersona: string;
    evaluationFocus: string[];
    sampleQuestions: string[];
    companySpecificGuidance: string | null;
  };
}

interface InterviewPlan {
  phases: {
    name: string;
    duration: number;
    objectives: string[];
    questionPatterns: string[];
  }[];
  focusAreas: string[];
}

interface InterviewConfig {
  id: number;
  interviewType: string;
  interviewMode?: string;
  roleArchetypeId?: string;
  style: string;
  seniority: string;
}

interface ModeSetupData {
  interviewMode: string;
  taxonomy: {
    label: string;
    description: string;
    typicalDuration: string;
    includes?: string[];
  };
  roleArchetypeId: string;
  roleArchetypeName?: string;
  primarySkillDimensions?: string[];
  seniority: string;
  configId: number;
  exerciseCount?: number;
  includePuzzles?: boolean;
  companyName?: string;
}

const modeLabels: Record<string, string> = {
  coding_technical: "Coding & Technical",
  case_problem_solving: "Case & Problem Solving",
  behavioral: "Behavioral and Leadership",
  hiring_manager: "HR Interview",
};

export default function InterviewConfigPage() {
  const [searchParams] = useSearchParams();
  const roleKitId = searchParams.get("roleKitId");
  const jobTargetId = searchParams.get("jobTargetId");
  const roundCategory = searchParams.get("roundCategory");
  const typicalDurationParam = searchParams.get("typicalDuration");
  const configIdParam = searchParams.get("configId");
  const interviewModeParam = searchParams.get("interviewMode");
  const employerJobId = searchParams.get("employerJobId");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [roleKit, setRoleKit] = useState<RoleKit | null>(null);
  const [practiceContext, setPracticeContext] = useState<PracticeContext | null>(null);
  const [modeSetupData, setModeSetupData] = useState<ModeSetupData | null>(null);
  const [plan, setPlan] = useState<InterviewPlan | null>(null);
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [planId, setPlanId] = useState<number | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [interviewType, setInterviewType] = useState<string>("behavioral");
  const [style, setStyle] = useState<string>("neutral");
  const [language, setLanguage] = useState<string>("english");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const hasInitialized = useRef(false);

  const languages = [
    { value: "english", label: "English" },
    { value: "hindi", label: "Hindi" },
    { value: "hinglish", label: "Hinglish" },
    { value: "spanish", label: "Spanish" },
    { value: "french", label: "French" },
    { value: "german", label: "German" },
    { value: "mandarin", label: "Mandarin" },
    { value: "japanese", label: "Japanese" },
  ];

  const isJobTargetMode = !!jobTargetId && !!roundCategory;
  const isSkillOnlyMode = !roleKitId && !jobTargetId && !!roundCategory && !configIdParam;
  const isInterviewModeType = !!configIdParam && !!interviewModeParam;

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    const fetchDataAndGeneratePlan = async () => {
      if (isInterviewModeType && configIdParam) {
        try {
          const storedSetup = sessionStorage.getItem("interviewModeSetup");
          if (storedSetup) {
            const setupData = JSON.parse(storedSetup) as ModeSetupData;
            setModeSetupData(setupData);
          }
          
          setIsLoading(false);
          setIsGeneratingPlan(true);
          
          const planResponse = await fetch(`/api/interview/config/${configIdParam}/plan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          const planData = await planResponse.json();
          if (planData.success) {
            setPlan(planData.plan.planJson);
            setPlanId(planData.plan.id);
            setConfig({ 
              id: parseInt(configIdParam), 
              interviewType: planData.plan.planJson?.interviewType || interviewModeParam || "behavioral",
              interviewMode: interviewModeParam || undefined,
              style: "neutral", 
              seniority: "mid" 
            });
          }
          setIsGeneratingPlan(false);
        } catch (error) {
          console.error("Error in interview mode setup:", error);
          setError("Failed to generate plan");
          setIsGeneratingPlan(false);
          setIsLoading(false);
        }
        return;
      }
      
      if (isSkillOnlyMode) {
        try {
          const storedContext = sessionStorage.getItem("rolePracticeContext");
          if (!storedContext) {
            navigate("/interview");
            return;
          }
          
          const skillContext = JSON.parse(storedContext);
          sessionStorage.removeItem("rolePracticeContext");
          
          setPracticeContext({
            roundCategory: skillContext.roundCategory,
            taxonomy: skillContext.taxonomy,
            companyContext: {
              jobTargetId: "",
              companyName: null,
              roleTitle: "Skill Practice",
              archetype: null,
              hasBlueprint: false,
              blueprintNotes: null,
            },
            promptHints: skillContext.promptHints || {
              avatarPersona: "Interviewer",
              evaluationFocus: skillContext.taxonomy?.label ? [skillContext.taxonomy.label] : [],
              sampleQuestions: [],
              companySpecificGuidance: null,
            },
          });
          
          setInterviewType(skillContext.roundCategory || "behavioral");
          setIsLoading(false);
          
          setIsGeneratingPlan(true);
          const configResponse = await fetch("/api/interview/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roleKitId: null,
              resumeDocId: null,
              jdDocId: null,
              interviewType: skillContext.roundCategory,
              style: "neutral",
              seniority: "mid",
              mode: "skill_only",
              roundCategory: skillContext.roundCategory,
            }),
          });
          const configData = await configResponse.json();
          
          if (configResponse.status === 403 && configData.requiresPayment) {
            setIsGeneratingPlan(false);
            setShowPurchaseModal(true);
            return;
          }
          
          if (configData.success) {
            setConfig(configData.config);
            
            const planResponse = await fetch(`/api/interview/config/${configData.config.id}/plan`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                roundCategory: skillContext.roundCategory,
                typicalDuration: skillContext.taxonomy?.typicalDuration || "15 min",
              }),
            });
            const planData = await planResponse.json();
            if (planData.success) {
              setPlan(planData.plan.planJson);
              setPlanId(planData.plan.id);
            }
          }
          setIsGeneratingPlan(false);
        } catch (error) {
          console.error("Error in skill-only mode:", error);
          navigate("/interview");
        }
      } else if (isJobTargetMode) {
        try {
          const response = await fetch(`/api/jobs/job-targets/${jobTargetId}/practice-context/${roundCategory}`);
          const data = await response.json();
          if (data.success) {
            setPracticeContext(data);
            const roundCat = data.roundCategory;
            let detectedType = "hiring_manager";
            if (roundCat === "behavioral" || roundCat === "culture_values" || roundCat === "bar_raiser") {
              detectedType = "behavioral";
            } else if (roundCat === "technical_interview" || roundCat === "coding_assessment" || roundCat === "coding") {
              detectedType = "technical";
            } else if (roundCat === "case_study" || roundCat === "business_case") {
              detectedType = "case_study";
            } else if (roundCat === "hr_screening" || roundCat === "phone_screen") {
              detectedType = "hr";
            } else if (roundCat === "hiring_manager") {
              detectedType = "hiring_manager";
            }
            setInterviewType(detectedType);
            setIsLoading(false);
            
            setIsGeneratingPlan(true);
            const configResponse = await fetch("/api/interview/config", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jobTargetId: data.companyContext.jobTargetId,
                interviewType: detectedType,
                style: "neutral",
                language: "english",
                mode: "job_target",
                roundCategory: data.roundCategory,
                companyContext: data.companyContext,
                promptHints: data.promptHints,
              }),
            });
            const configData = await configResponse.json();
            
            if (configResponse.status === 403 && configData.requiresPayment) {
              setIsGeneratingPlan(false);
              setShowPurchaseModal(true);
              return;
            }
            
            if (configData.success) {
              setConfig(configData.config);
              
              const planResponse = await fetch(`/api/interview/config/${configData.config.id}/plan`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  roundCategory: data.roundCategory,
                  typicalDuration: data.taxonomy?.typicalDuration,
                }),
              });
              const planData = await planResponse.json();
              if (planData.success) {
                setPlan(planData.plan.planJson);
                setPlanId(planData.plan.id);
              }
            }
            setIsGeneratingPlan(false);
          } else {
            navigate(`/jobs/${jobTargetId}`);
          }
        } catch (error) {
          console.error("Error:", error);
          navigate(`/jobs/${jobTargetId}`);
        }
      } else if (roleKitId) {
        try {
          const storedContext = sessionStorage.getItem("rolePracticeContext");
          let rolePracticeContext: any = null;
          if (storedContext) {
            try {
              rolePracticeContext = JSON.parse(storedContext);
              sessionStorage.removeItem("rolePracticeContext");
            } catch (e) {
              console.error("Error parsing role practice context:", e);
            }
          }
          
          if (rolePracticeContext && rolePracticeContext.roleContext?.roleKitId === parseInt(roleKitId)) {
            setPracticeContext({
              roundCategory: rolePracticeContext.roundCategory,
              taxonomy: rolePracticeContext.taxonomy,
              companyContext: {
                jobTargetId: "",
                companyName: null,
                roleTitle: rolePracticeContext.roleContext?.roleName || null,
                archetype: null,
                hasBlueprint: false,
                blueprintNotes: null,
              },
              promptHints: rolePracticeContext.promptHints,
            });
            
            setRoleKit({
              id: parseInt(roleKitId),
              name: rolePracticeContext.roleContext?.roleName || "",
              level: rolePracticeContext.roleContext?.level || "entry",
              domain: rolePracticeContext.roleContext?.domain || "",
              description: null,
              skillsFocus: rolePracticeContext.roleContext?.skillsFocus || null,
              defaultInterviewTypes: null,
            });
            
            const selectedType = rolePracticeContext.roundCategory || "behavioral";
            setInterviewType(selectedType);
            setIsLoading(false);
            
            setIsGeneratingPlan(true);
            const configResponse = await fetch("/api/interview/config", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                roleKitId: parseInt(roleKitId),
                resumeDocId: null,
                jdDocId: null,
                interviewType: selectedType,
                style: "neutral",
                seniority: rolePracticeContext.roleContext?.level || "entry",
                mode: "role_based",
                roundCategory: rolePracticeContext.roundCategory,
                employerJobId: employerJobId || undefined,
              }),
            });
            const configData = await configResponse.json();
            
            if (configResponse.status === 403 && configData.requiresPayment) {
              setIsGeneratingPlan(false);
              setShowPurchaseModal(true);
              return;
            }
            
            if (configData.success) {
              setConfig(configData.config);
              
              const planResponse = await fetch(`/api/interview/config/${configData.config.id}/plan`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  roundCategory: rolePracticeContext.roundCategory,
                  typicalDuration: rolePracticeContext.taxonomy?.typicalDuration || "10-15 min",
                }),
              });
              const planData = await planResponse.json();
              if (planData.success) {
                setPlan(planData.plan.planJson);
                setPlanId(planData.plan.id);
              }
            }
            setIsGeneratingPlan(false);
          } else {
            const response = await fetch(`/api/interview/role-kits/${roleKitId}`);
            const data = await response.json();
            if (data.success) {
              setRoleKit(data.roleKit);
              const selectedType = roundCategory || data.roleKit.defaultInterviewTypes?.[0] || "behavioral";
              setInterviewType(selectedType);
              setIsLoading(false);
              
              setIsGeneratingPlan(true);
              const configResponse = await fetch("/api/interview/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  roleKitId: data.roleKit.id,
                  resumeDocId: null,
                  jdDocId: null,
                  interviewType: selectedType,
                  style: "neutral",
                  seniority: data.roleKit.level,
                  mode: "role_based",
                  roundCategory: roundCategory || null,
                  employerJobId: employerJobId || undefined,
                }),
              });
              const configData = await configResponse.json();
              
              if (configResponse.status === 403 && configData.requiresPayment) {
                setIsGeneratingPlan(false);
                setShowPurchaseModal(true);
                return;
              }
              
              if (configData.success) {
                setConfig(configData.config);
                
                const planResponse = await fetch(`/api/interview/config/${configData.config.id}/plan`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    roundCategory: roundCategory || selectedType,
                    typicalDuration: "10-15 min",
                  }),
                });
                const planData = await planResponse.json();
                if (planData.success) {
                  setPlan(planData.plan.planJson);
                  setPlanId(planData.plan.id);
                }
              }
              setIsGeneratingPlan(false);
            } else {
              navigate("/interview");
            }
          }
        } catch (error) {
          console.error("Error:", error);
          navigate("/interview");
        }
      } else {
        navigate("/interview");
      }
    };
    fetchDataAndGeneratePlan();
  }, [roleKitId, jobTargetId, roundCategory, typicalDurationParam, navigate, isJobTargetMode]);

  const getTotalDuration = () => {
    if (!plan?.phases) return 0;
    return plan.phases.reduce((sum, phase) => sum + (phase.duration || 0), 0);
  };

  const formatDuration = (mins: number) => {
    if (mins < 1) return "< 1 min";
    return `${mins} min`;
  };

  const handleStartInterview = async () => {
    if (!config?.id || !planId) {
      toast({
        title: "Not ready",
        description: "Please wait for the interview plan to generate.",
        variant: "destructive",
      });
      return;
    }

    setStarting(true);
    setError(null);

    try {
      const response = await fetch("/api/interview/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewConfigId: config.id,
          interviewPlanId: planId,
          employerJobId: employerJobId || undefined,
        }),
      });

      if (response.status === 401) {
        toast({
          title: "Please sign in",
          description: "You need to be signed in to start an interview session.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const data = await response.json();
      
      if (response.status === 403 && data.requiresPayment) {
        setShowPurchaseModal(true);
        return;
      }
      
      if (data.success) {
        sessionStorage.removeItem("interviewModeSetup");
        sessionStorage.removeItem("interviewModeContext");
        navigate(`/interview/session?interviewSessionId=${data.session.id}&configId=${config.id}`);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      setError(error.message || "Failed to start interview");
    } finally {
      setStarting(false);
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

  if (!roleKit && !practiceContext && !isSkillOnlyMode && !isInterviewModeType) {
    return null;
  }

  const handleBack = () => {
    if (isJobTargetMode) {
      navigate(`/jobs/${jobTargetId}`);
      return;
    }
    if (isInterviewModeType && interviewModeParam && modeSetupData) {
      sessionStorage.setItem("interviewModeContext", JSON.stringify({
        interviewMode: modeSetupData.interviewMode,
        taxonomy: modeSetupData.taxonomy,
        roleCategories: ["all"],
      }));
      navigate(`/interview/mode-setup?mode=${interviewModeParam}`);
      return;
    }
    navigate("/interview");
  };
  
  const getTitle = () => {
    if (isInterviewModeType && modeSetupData) {
      return modeSetupData.taxonomy.label;
    }
    if (isInterviewModeType && interviewModeParam) {
      return modeLabels[interviewModeParam] || "Interview Practice";
    }
    if (isJobTargetMode) {
      return practiceContext?.taxonomy?.label || "Interview Practice";
    }
    if (isSkillOnlyMode) {
      if (practiceContext?.taxonomy?.label) {
        return practiceContext.taxonomy.label;
      }
      const categoryLabels: Record<string, string> = {
        coding: "Coding Interview",
        sql: "SQL Assessment",
        behavioral: "Behavioral Interview",
        case: "Case Study",
        technical: "Technical Deep Dive",
        analytics: "Analytics Round",
        ml: "ML/AI Interview",
        hiring_manager: "Hiring Manager Round",
      };
      return categoryLabels[roundCategory || ""] || "Skill Practice";
    }
    return roleKit?.name || "Interview Practice";
  };
  
  const title = getTitle();
  const companyName = practiceContext?.companyContext.companyName;
  const roleTitle = practiceContext?.companyContext.roleTitle;
  const modeDescription = modeSetupData?.taxonomy?.description;

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#f8f9fb]">
        <div className="bg-[#042c4c] text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-3xl">
            <button
              onClick={handleBack}
              className="inline-flex items-center text-white/70 hover:text-white mb-4 text-sm transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
              Back
            </button>
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                {isJobTargetMode ? <Building2 className="w-5 h-5 text-[#ee7e65]" /> : <Briefcase className="w-5 h-5 text-[#ee7e65]" />}
              </div>
              <div>
                <h1 className="text-xl font-bold">{title}</h1>
                {isJobTargetMode && (companyName || roleTitle) && (
                  <p className="text-white/70 text-sm mt-0.5">
                    {companyName}{companyName && roleTitle && " • "}{roleTitle}
                  </p>
                )}
                {isInterviewModeType && modeDescription && (
                  <p className="text-white/70 text-sm mt-0.5">
                    {modeDescription}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-3xl">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {isGeneratingPlan ? (
              <Card className="border-slate-200 rounded-xl">
                <CardContent className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#ee7e65] mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">Generating your interview plan...</p>
                  <p className="text-sm text-slate-400 mt-1">This takes a few seconds</p>
                </CardContent>
              </Card>
            ) : plan ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-[#042c4c] text-white px-3 py-1">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    ~{getTotalDuration()} min
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 capitalize">
                    {isInterviewModeType && interviewModeParam 
                      ? modeLabels[interviewModeParam] || interviewModeParam.replace(/_/g, " ")
                      : interviewType.replace(/_/g, " ")
                    }
                  </Badge>
                  {modeSetupData?.seniority && (
                    <Badge variant="outline" className="px-3 py-1 capitalize">
                      {modeSetupData.seniority} Level
                    </Badge>
                  )}
                  {modeSetupData?.exerciseCount && modeSetupData.exerciseCount > 1 && (
                    <Badge variant="outline" className="px-3 py-1">
                      {modeSetupData.exerciseCount} Exercises
                    </Badge>
                  )}
                  {modeSetupData?.includePuzzles && (
                    <Badge variant="outline" className="px-3 py-1 bg-purple-50 border-purple-200 text-purple-700">
                      Includes Puzzles
                    </Badge>
                  )}
                </div>

                {isInterviewModeType && modeSetupData && (
                  <Card className="border-slate-200 rounded-xl bg-gradient-to-r from-[#042c4c]/5 to-transparent">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Role</p>
                          <p className="text-sm font-medium text-[#042c4c]">
                            {modeSetupData.roleArchetypeName || "General Practice"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Difficulty</p>
                          <p className="text-sm font-medium text-[#042c4c] capitalize">
                            {modeSetupData.seniority || "Mid"} Level
                          </p>
                        </div>
                        {modeSetupData.companyName && (
                          <div className="col-span-2">
                            <p className="text-xs text-slate-500 mb-1">Company Context</p>
                            <p className="text-sm font-medium text-[#042c4c]">
                              {modeSetupData.companyName}
                            </p>
                          </div>
                        )}
                        {modeSetupData.primarySkillDimensions && modeSetupData.primarySkillDimensions.length > 0 && (
                          <div className="col-span-2">
                            <p className="text-xs text-slate-500 mb-2">Skills Being Tested</p>
                            <div className="flex flex-wrap gap-1.5">
                              {modeSetupData.primarySkillDimensions.map((skill, idx) => (
                                <span key={idx} className="text-xs px-2 py-1 bg-[#ee7e65]/10 text-[#ee7e65] rounded-full font-medium">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {plan.focusAreas && plan.focusAreas.length > 0 && (
                  <Card className="border-slate-200 rounded-xl">
                    <CardHeader className="py-3 px-4 border-b border-slate-100">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Target className="w-4 h-4 text-[#ee7e65]" />
                        Focus Areas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {plan.focusAreas.map((area, idx) => (
                          <span key={idx} className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                            {area}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {plan.phases && plan.phases.length > 0 && (
                  <Card className="border-slate-200 rounded-xl">
                    <CardHeader className="py-3 px-4 border-b border-slate-100">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[#ee7e65]" />
                        Interview Phases
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-100">
                        {plan.phases.map((phase, idx) => (
                          <div key={idx} className="p-4 flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#ee7e65]/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-[#ee7e65]">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm text-[#042c4c]">{phase.name}</p>
                                <span className="text-xs text-slate-400">{formatDuration(phase.duration)}</span>
                              </div>
                              {phase.objectives && phase.objectives.length > 0 && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                  {phase.objectives[0]}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : null}

            {isJobTargetMode && practiceContext?.promptHints.companySpecificGuidance && (
              <Card className="border-amber-200 bg-amber-50/50 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-amber-800 mb-1">Company Insight</p>
                      <p className="text-xs text-amber-700">{practiceContext.promptHints.companySpecificGuidance}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-slate-200 rounded-xl">
              <CardHeader className="py-3 px-4 border-b border-slate-100">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#ee7e65]" />
                  Session Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="text-xs font-medium text-slate-600 mb-2 block">Language</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {languages.map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => setLanguage(lang.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          language === lang.value
                            ? "bg-[#ee7e65] text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-slate-600 mb-2 block">Interviewer Style</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "friendly", label: "Supportive", emoji: "😊" },
                      { value: "neutral", label: "Professional", emoji: "👔" },
                      { value: "challenging", label: "Rigorous", emoji: "🎯" },
                    ].map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setStyle(s.value)}
                        className={`p-2.5 rounded-lg border-2 text-center transition-all ${
                          style === s.value
                            ? "border-[#042c4c] bg-[#042c4c]/5"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <span className="text-lg">{s.emoji}</span>
                        <p className={`text-xs font-medium mt-1 ${style === s.value ? "text-[#042c4c]" : "text-slate-600"}`}>
                          {s.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              size="lg"
              onClick={handleStartInterview}
              disabled={starting || isGeneratingPlan || !config || !planId}
              className="w-full rounded-xl bg-[#ee7e65] hover:bg-[#e06a50] h-12 text-base"
            >
              {starting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Starting Interview...
                </>
              ) : isGeneratingPlan ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Preparing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Interview
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        roleKitId={roleKitId ? parseInt(roleKitId) : undefined}
        roleName={roleKit?.name}
        jobTargetId={jobTargetId || undefined}
      />
    </SidebarLayout>
  );
}
