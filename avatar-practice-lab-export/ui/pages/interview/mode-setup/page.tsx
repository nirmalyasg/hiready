import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight, Code, Briefcase, MessageSquare, Users, Clock, ArrowRight, Loader2, Check, Building2, Plus, FileText, ChevronDown, Search, Target, Lightbulb, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAccessGate } from "@/components/monetization/access-gate";
import { UpgradeModal } from "@/components/monetization/upgrade-modal";

interface RoleArchetype {
  id: string;
  name: string;
  description: string;
  roleCategory: string;
  primarySkillDimensions: string[];
  commonInterviewTypes: string[];
}

interface ModeContext {
  interviewMode: string;
  taxonomy: {
    label: string;
    description: string;
    typicalDuration: string;
    includes: string[];
  };
  roleCategories: string[];
}

const modeConfig: Record<string, { icon: any; color: string; gradient: string; bgLight: string }> = {
  coding_technical: { icon: Code, color: "text-indigo-600", gradient: "from-indigo-500 to-indigo-600", bgLight: "bg-indigo-50" },
  case_problem_solving: { icon: Briefcase, color: "text-orange-600", gradient: "from-orange-500 to-orange-600", bgLight: "bg-orange-50" },
  behavioral: { icon: MessageSquare, color: "text-amber-600", gradient: "from-amber-500 to-amber-600", bgLight: "bg-amber-50" },
  hiring_manager: { icon: Users, color: "text-blue-600", gradient: "from-blue-500 to-blue-600", bgLight: "bg-blue-50" },
};

const seniorityOptions = [
  { value: "entry", label: "Entry", description: "0-2 yrs" },
  { value: "mid", label: "Mid", description: "2-5 yrs" },
  { value: "senior", label: "Senior", description: "5+ yrs" },
];

export default function InterviewModeSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");

  const [modeContext, setModeContext] = useState<ModeContext | null>(null);
  const [roleArchetypes, setRoleArchetypes] = useState<RoleArchetype[]>([]);
  const [filteredArchetypes, setFilteredArchetypes] = useState<RoleArchetype[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);
  const [selectedSeniority, setSelectedSeniority] = useState<string>("mid");
  const [companyName, setCompanyName] = useState<string>("");
  const [roleSearchQuery, setRoleSearchQuery] = useState<string>("");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [exerciseCount, setExerciseCount] = useState<number>(1);
  const [includePuzzles, setIncludePuzzles] = useState<boolean>(false);
  
  const { checkAccess, showUpgradeModal, setShowUpgradeModal } = useAccessGate();

  const isProblemSolvingMode = mode === "coding_technical" || mode === "case_problem_solving";

  useEffect(() => {
    const storedContext = sessionStorage.getItem("interviewModeContext");
    if (!storedContext || !mode) {
      navigate("/interview");
      return;
    }

    const context = JSON.parse(storedContext) as ModeContext;
    setModeContext(context);

    const storedSetup = sessionStorage.getItem("interviewModeSetup");
    if (storedSetup) {
      try {
        const setup = JSON.parse(storedSetup);
        if (setup.exerciseCount) setExerciseCount(setup.exerciseCount);
        if (setup.includePuzzles !== undefined) setIncludePuzzles(setup.includePuzzles);
        if (setup.roleArchetypeId) setSelectedArchetype(setup.roleArchetypeId);
        if (setup.seniority) setSelectedSeniority(setup.seniority);
        if (setup.companyName) setCompanyName(setup.companyName);
      } catch (e) {
        console.error("Error parsing stored setup:", e);
      }
    }

    const fetchArchetypes = async () => {
      try {
        const response = await fetch("/api/interview/role-archetypes");
        const data = await response.json();
        if (data.success) {
          setRoleArchetypes(data.archetypes);
          
          const filtered = data.archetypes.filter((a: RoleArchetype) => {
            if (context.roleCategories.includes("all")) return true;
            return context.roleCategories.includes(a.roleCategory);
          });
          setFilteredArchetypes(filtered);
          
          const storedSetup = sessionStorage.getItem("interviewModeSetup");
          const hasStoredArchetype = storedSetup && JSON.parse(storedSetup).roleArchetypeId;
          
          if (!hasStoredArchetype && filtered.length > 0) {
            setSelectedArchetype(filtered[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching role archetypes:", err);
        setError("Failed to load role options");
      } finally {
        setIsLoading(false);
      }
    };

    fetchArchetypes();
  }, [mode, navigate]);

  const handleStartPractice = async () => {
    if (!selectedArchetype || !modeContext) return;
    
    if (!checkAccess()) {
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      const response = await fetch("/api/interview/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewMode: modeContext.interviewMode,
          roleArchetypeId: selectedArchetype,
          seniority: selectedSeniority,
          style: "neutral",
          mode: "interview_mode",
          exerciseCount: isProblemSolvingMode ? exerciseCount : 1,
          includePuzzles: isProblemSolvingMode ? includePuzzles : false,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create session");
      }

      const selectedArchetypeData = filteredArchetypes.find(a => a.id === selectedArchetype);
      
      sessionStorage.setItem("interviewModeSetup", JSON.stringify({
        interviewMode: modeContext.interviewMode,
        taxonomy: modeContext.taxonomy,
        roleArchetypeId: selectedArchetype,
        roleArchetypeName: selectedArchetypeData?.name || null,
        primarySkillDimensions: selectedArchetypeData?.primarySkillDimensions || [],
        seniority: selectedSeniority,
        companyName: companyName || null,
        configId: data.config.id,
        exerciseCount: isProblemSolvingMode ? exerciseCount : 1,
        includePuzzles: isProblemSolvingMode ? includePuzzles : false,
      }));

      navigate(`/interview/config?configId=${data.config.id}&interviewMode=${modeContext.interviewMode}`);
    } catch (err: any) {
      console.error("Error starting practice:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setIsStarting(false);
    }
  };

  const handleGoToCustom = () => {
    sessionStorage.setItem("customInterviewMode", mode || "");
    navigate("/interview");
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

  if (!modeContext || !mode) {
    return null;
  }

  const config = modeConfig[mode] || modeConfig.behavioral;
  const IconComponent = config.icon;
  const selectedArchetypeData = roleArchetypes.find(a => a.id === selectedArchetype);

  const searchFilteredArchetypes = filteredArchetypes.filter(a =>
    a.name.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
    a.description.toLowerCase().includes(roleSearchQuery.toLowerCase())
  );

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-slate-50">
        <div className={`bg-gradient-to-br ${config.gradient} text-white`}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 max-w-xl">
            <button
              onClick={() => navigate("/interview")}
              className="inline-flex items-center text-white/70 hover:text-white mb-3 text-sm transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
              Back
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{modeContext.taxonomy.label}</h1>
                <p className="text-white/80 text-sm">{modeContext.taxonomy.typicalDuration}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-xl">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <Label className="text-sm font-semibold text-slate-900 mb-3 block">
                Select your target role
              </Label>
              
              <div className="relative">
                <button
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    isRoleDropdownOpen 
                      ? `border-current ${config.color}` 
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Briefcase className={`w-4 h-4 ${selectedArchetypeData ? config.color : "text-slate-400"}`} />
                    <span className={`font-medium ${selectedArchetypeData ? "text-slate-900" : "text-slate-400"}`}>
                      {selectedArchetypeData?.name || "Choose a role..."}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isRoleDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isRoleDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-72 overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Search roles..."
                          value={roleSearchQuery}
                          onChange={(e) => setRoleSearchQuery(e.target.value)}
                          className="pl-8 h-9 text-sm rounded-lg"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto p-1">
                      {searchFilteredArchetypes.map((archetype) => (
                        <button
                          key={archetype.id}
                          onClick={() => {
                            setSelectedArchetype(archetype.id);
                            setIsRoleDropdownOpen(false);
                            setRoleSearchQuery("");
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                            selectedArchetype === archetype.id
                              ? `${config.bgLight} ${config.color}`
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div>
                            <p className={`font-medium text-sm ${selectedArchetype === archetype.id ? config.color : "text-slate-900"}`}>
                              {archetype.name}
                            </p>
                            <p className="text-xs text-slate-500 line-clamp-1">{archetype.description}</p>
                          </div>
                          {selectedArchetype === archetype.id && (
                            <Check className={`w-4 h-4 ${config.color} flex-shrink-0`} />
                          )}
                        </button>
                      ))}
                      <button
                        onClick={handleGoToCustom}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-slate-50 border-t border-slate-100 mt-1"
                      >
                        <Plus className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-medium text-sm text-slate-900">Add Job Description</p>
                          <p className="text-xs text-slate-500">Use a specific job posting</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedArchetypeData && (
              <div className={`rounded-xl border-2 ${config.color} border-current/20 p-4 ${config.bgLight}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Target className={`w-4 h-4 ${config.color}`} />
                  <span className={`text-sm font-semibold ${config.color}`}>Skills Being Tested</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedArchetypeData.primarySkillDimensions?.slice(0, 6).map((skill, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary"
                      className="bg-white/80 text-slate-700 text-xs font-medium"
                    >
                      {skill}
                    </Badge>
                  ))}
                  {(selectedArchetypeData.primarySkillDimensions?.length || 0) > 6 && (
                    <Badge variant="secondary" className="bg-white/50 text-slate-500 text-xs">
                      +{(selectedArchetypeData.primarySkillDimensions?.length || 0) - 6} more
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-3">
                  {selectedArchetypeData.description}
                </p>
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <Label className="text-sm font-semibold text-slate-900 mb-3 block">
                Experience Level
              </Label>
              <div className="flex gap-2">
                {seniorityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedSeniority(option.value)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all text-center ${
                      selectedSeniority === option.value
                        ? `border-current ${config.color} ${config.bgLight}`
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className={`font-semibold text-sm ${selectedSeniority === option.value ? config.color : "text-slate-900"}`}>
                      {option.label}
                    </p>
                    <p className="text-xs text-slate-500">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {isProblemSolvingMode && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-slate-900 mb-3 block">
                    Number of Exercises
                  </Label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((count) => (
                      <button
                        key={count}
                        onClick={() => setExerciseCount(count)}
                        className={`flex-1 p-3 rounded-lg border-2 transition-all text-center ${
                          exerciseCount === count
                            ? `border-current ${config.color} ${config.bgLight}`
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <Hash className={`w-4 h-4 ${exerciseCount === count ? config.color : "text-slate-400"}`} />
                          <span className={`font-semibold text-sm ${exerciseCount === count ? config.color : "text-slate-900"}`}>
                            {count}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {count === 1 ? "Quick" : count === 2 ? "Standard" : "Deep dive"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <button
                    onClick={() => setIncludePuzzles(!includePuzzles)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      includePuzzles
                        ? `border-current ${config.color} ${config.bgLight}`
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${includePuzzles ? config.bgLight : "bg-slate-100"}`}>
                        <Lightbulb className={`w-4 h-4 ${includePuzzles ? config.color : "text-slate-400"}`} />
                      </div>
                      <div className="text-left">
                        <p className={`font-semibold text-sm ${includePuzzles ? config.color : "text-slate-900"}`}>
                          Include Brain Teasers / Puzzles
                        </p>
                        <p className="text-xs text-slate-500">
                          Logical puzzles & estimation questions
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      includePuzzles
                        ? `border-current ${config.color} bg-current`
                        : "border-slate-300"
                    }`}>
                      {includePuzzles && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <Label className="text-sm font-semibold text-slate-900 mb-1 block">
                Target Company <span className="font-normal text-slate-400">(Optional)</span>
              </Label>
              <p className="text-xs text-slate-500 mb-3">
                Questions tailored to this company's style
              </p>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="e.g., Google, Amazon..."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="pl-10 rounded-lg h-10"
                />
              </div>
            </div>

            <Button
              onClick={handleStartPractice}
              disabled={!selectedArchetype || isStarting}
              className={`w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r ${config.gradient} hover:opacity-90 transition-opacity`}
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  Start Practice
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        title="Unlock Interview Access"
        description="You've used your free interview. Upgrade to continue practicing."
      />
    </SidebarLayout>
  );
}
