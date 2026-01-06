import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight, Code, Briefcase, MessageSquare, Users, Clock, ArrowRight, Loader2, Check, Building2, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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

const modeConfig: Record<string, { icon: any; color: string; gradient: string }> = {
  coding_technical: { icon: Code, color: "text-indigo-600", gradient: "from-indigo-500 to-indigo-600" },
  case_problem_solving: { icon: Briefcase, color: "text-orange-600", gradient: "from-orange-500 to-orange-600" },
  behavioral: { icon: MessageSquare, color: "text-amber-600", gradient: "from-amber-500 to-amber-600" },
  hiring_manager: { icon: Users, color: "text-blue-600", gradient: "from-blue-500 to-blue-600" },
};

const seniorityOptions = [
  { value: "entry", label: "Entry Level", description: "0-2 years experience" },
  { value: "mid", label: "Mid Level", description: "2-5 years experience" },
  { value: "senior", label: "Senior Level", description: "5+ years experience" },
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
  const [showAddJD, setShowAddJD] = useState(false);

  useEffect(() => {
    const storedContext = sessionStorage.getItem("interviewModeContext");
    if (!storedContext || !mode) {
      navigate("/interview");
      return;
    }

    const context = JSON.parse(storedContext) as ModeContext;
    setModeContext(context);

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
          
          if (filtered.length > 0) {
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
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create session");
      }

      sessionStorage.setItem("interviewModeSetup", JSON.stringify({
        interviewMode: modeContext.interviewMode,
        taxonomy: modeContext.taxonomy,
        roleArchetypeId: selectedArchetype,
        seniority: selectedSeniority,
        companyName: companyName || null,
        configId: data.config.id,
      }));

      navigate(`/interview/config?configId=${data.config.id}&interviewMode=${modeContext.interviewMode}`);
    } catch (err: any) {
      console.error("Error starting practice:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setIsStarting(false);
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

  if (!modeContext || !mode) {
    return null;
  }

  const config = modeConfig[mode] || modeConfig.behavioral;
  const IconComponent = config.icon;
  const selectedArchetypeData = roleArchetypes.find(a => a.id === selectedArchetype);

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#f8f9fb]">
        <div className={`bg-gradient-to-br ${config.gradient} text-white`}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-2xl">
            <button
              onClick={() => navigate("/interview")}
              className="inline-flex items-center text-white/70 hover:text-white mb-4 text-sm transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
              Back
            </button>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <IconComponent className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{modeContext.taxonomy.label}</h1>
                <p className="text-white/80 mt-1">{modeContext.taxonomy.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {modeContext.taxonomy.includes.map((item, idx) => (
                    <span key={idx} className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <Label className="text-base font-semibold text-[#042c4c] mb-4 block">
                What role are you practicing for?
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredArchetypes.map((archetype) => (
                  <button
                    key={archetype.id}
                    onClick={() => { setSelectedArchetype(archetype.id); setShowAddJD(false); }}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      selectedArchetype === archetype.id && !showAddJD
                        ? `border-current ${config.color} bg-slate-50`
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selectedArchetype === archetype.id && !showAddJD
                          ? `border-current ${config.color} bg-current`
                          : "border-slate-300"
                      }`}>
                        {selectedArchetype === archetype.id && !showAddJD && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[#042c4c] text-sm">{archetype.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{archetype.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => { setShowAddJD(true); setSelectedArchetype(null); }}
                  className={`text-left p-4 rounded-xl border-2 border-dashed transition-all ${
                    showAddJD
                      ? `border-current ${config.color} bg-slate-50`
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      showAddJD
                        ? `border-current ${config.color} bg-current`
                        : "border-slate-300"
                    }`}>
                      {showAddJD ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <Plus className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[#042c4c] text-sm">Add Job Description</p>
                      <p className="text-xs text-slate-500 mt-0.5">Upload or paste your target job</p>
                    </div>
                  </div>
                </button>
              </div>
              {showAddJD && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">
                    To use a specific job description, go to Custom Interview from the main page.
                  </p>
                  <button
                    onClick={() => navigate("/interview")}
                    className={`text-sm font-medium ${config.color} hover:underline`}
                  >
                    Go to Custom Interview →
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <Label className="text-base font-semibold text-[#042c4c] mb-2 block">
                Target Company (Optional)
              </Label>
              <p className="text-sm text-slate-500 mb-4">
                Questions will be tailored to this company's interview style
              </p>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="e.g., Google, Amazon, Microsoft..."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <Label className="text-base font-semibold text-[#042c4c] mb-4 block">
                What's your experience level?
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {seniorityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedSeniority(option.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      selectedSeniority === option.value
                        ? `border-current ${config.color} bg-slate-50`
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedSeniority === option.value
                          ? `border-current ${config.color} bg-current`
                          : "border-slate-300"
                      }`}>
                        {selectedSeniority === option.value && (
                          <Check className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                      <span className="font-medium text-[#042c4c] text-sm">{option.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 ml-6">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {selectedArchetypeData && (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-[#042c4c] mb-3">Session Preview</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Role</span>
                    <span className="font-medium text-[#042c4c]">{selectedArchetypeData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Level</span>
                    <span className="font-medium text-[#042c4c] capitalize">{selectedSeniority}</span>
                  </div>
                  {companyName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Company</span>
                      <span className="font-medium text-[#042c4c]">{companyName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration</span>
                    <span className="font-medium text-[#042c4c]">{modeContext.taxonomy.typicalDuration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Focus Areas</span>
                    <span className="font-medium text-[#042c4c]">{modeContext.taxonomy.includes.length} skills</span>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleStartPractice}
              disabled={!selectedArchetype || isStarting}
              className={`w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r ${config.gradient} hover:opacity-90 transition-opacity`}
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
    </SidebarLayout>
  );
}
