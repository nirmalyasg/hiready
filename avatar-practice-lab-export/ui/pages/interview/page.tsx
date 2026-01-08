import { useState, useEffect } from "react";
import { 
  Search, ChevronRight, Briefcase, GraduationCap, Code, LineChart, Users, Megaphone, 
  Clock, ArrowRight, Building2, Filter, Check, ChevronDown, X, Plus, Link2, FileText,
  Loader2, MapPin, MessageSquare, TrendingUp, Brain, Database, BarChart3, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface RoleKit {
  id: number;
  name: string;
  level: "entry" | "mid" | "senior";
  domain: string;
  description: string | null;
  defaultInterviewTypes: string[] | null;
  skillsFocus: string[] | null;
  estimatedDuration: number | null;
  trackTags: string[] | null;
}

interface JobTarget {
  id: string;
  roleTitle: string;
  companyName: string | null;
  location: string | null;
  status: string;
}

type AddMode = "url" | "paste" | "manual" | null;
type SelectedPath = "role" | "skill" | "custom" | null;

const domainIcons: Record<string, any> = {
  software: Code,
  data: LineChart,
  product: Briefcase,
  design: GraduationCap,
  sales: Users,
  marketing: Megaphone,
  customer_success: Users,
  operations: Building2,
  consulting: Briefcase,
  finance: LineChart,
  hr: Users,
  recruiting: Users,
  engineering_management: Code,
};

const domainColors: Record<string, string> = {
  software: "bg-[#042c4c]",
  data: "bg-[#768c9c]",
  product: "bg-[#ee7e65]",
  design: "bg-[#6c8194]",
  sales: "bg-[#042c4c]",
  marketing: "bg-[#ee7e65]",
  customer_success: "bg-[#768c9c]",
  operations: "bg-slate-500",
  consulting: "bg-[#042c4c]",
  finance: "bg-[#6c8194]",
  hr: "bg-[#ee7e65]",
  recruiting: "bg-[#768c9c]",
  engineering_management: "bg-[#042c4c]",
};

const interviewModeOptions = [
  { 
    id: "coding_technical", 
    label: "Coding & Technical Tasks", 
    description: "Solve, explain, debug, or modify technical problems",
    icon: Code,
    color: "bg-[#042c4c]",
    interviewMode: "coding_technical",
    duration: "15 min",
    includes: ["Coding", "Debugging", "Code Review", "SQL", "ML Basics"],
    roleCategories: ["tech", "data"],
  },
  { 
    id: "case_problem_solving", 
    label: "Case & Problem Solving", 
    description: "Structured thinking for ambiguous problems",
    icon: Briefcase,
    color: "bg-[#ee7e65]",
    interviewMode: "case_problem_solving",
    duration: "15 min",
    includes: ["Business Cases", "Product Cases", "Analytics Cases", "Strategy"],
    roleCategories: ["product", "business", "data"],
  },
  { 
    id: "behavioral", 
    label: "Behavioral and Leadership", 
    description: "Past behavior, judgment, ownership and leadership",
    icon: MessageSquare,
    color: "bg-[#768c9c]",
    interviewMode: "behavioral",
    duration: "15 min",
    includes: ["STAR Stories", "Conflict Handling", "Leadership", "Failure Stories"],
    roleCategories: ["all"],
  },
  { 
    id: "hiring_manager", 
    label: "HR Interview", 
    description: "Role fit, motivation, culture and career alignment",
    icon: Users,
    color: "bg-[#6c8194]",
    interviewMode: "hiring_manager",
    duration: "15 min",
    includes: ["Why This Role", "Culture Fit", "Career Goals", "Role Expectations"],
    roleCategories: ["all"],
  },
];

const getLevelConfig = (level: string) => {
  switch (level) {
    case "entry":
      return { label: "Entry", color: "bg-emerald-100 text-emerald-700" };
    case "mid":
      return { label: "Mid-Level", color: "bg-[#ee7e65]/10 text-[#ee7e65]" };
    case "senior":
      return { label: "Senior", color: "bg-[#042c4c]/10 text-[#042c4c]" };
    default:
      return { label: level, color: "bg-slate-100 text-slate-600" };
  }
};

const formatDomain = (domain: string) => {
  return domain.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function InterviewPracticePage() {
  const navigate = useNavigate();
  
  const [roleKits, setRoleKits] = useState<RoleKit[]>([]);
  const [filteredKits, setFilteredKits] = useState<RoleKit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<SelectedPath>(null);
  
  const [savedJobs, setSavedJobs] = useState<JobTarget[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [url, setUrl] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [customStep, setCustomStep] = useState<"details" | "round">("details");
  const [selectedCustomRound, setSelectedCustomRound] = useState<string | null>(null);
  const [customJobDetails, setCustomJobDetails] = useState<{ title: string; company: string; jdText?: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);
        const [rolesRes, jobsRes] = await Promise.all([
          fetch("/api/interview/role-kits"),
          fetch("/api/jobs")
        ]);
        
        if (!rolesRes.ok && !jobsRes.ok) {
          setFetchError("Unable to load practice options. Please refresh the page.");
          return;
        }
        
        const rolesData = await rolesRes.json();
        const jobsData = await jobsRes.json();
        
        if (rolesData.success) {
          setRoleKits(rolesData.roleKits);
          setFilteredKits(rolesData.roleKits);
        }
        
        if (jobsData.success) {
          setSavedJobs(jobsData.jobs.filter((j: JobTarget) => j.status !== "archived"));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setFetchError("Something went wrong. Please refresh the page to try again.");
      } finally {
        setIsLoading(false);
        setLoadingJobs(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = roleKits;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (kit) =>
          kit.name.toLowerCase().includes(query) ||
          kit.description?.toLowerCase().includes(query) ||
          kit.domain.toLowerCase().includes(query)
      );
    }
    if (selectedDomain) {
      filtered = filtered.filter((kit) => kit.domain === selectedDomain);
    }
    setFilteredKits(filtered);
  }, [searchQuery, selectedDomain, roleKits]);

  const domains = [...new Set(roleKits.map((kit) => kit.domain))];

  const handleSelectRole = (kit: RoleKit) => {
    navigate(`/interview/role/${kit.id}`);
  };

  const handleSelectJob = (job: JobTarget) => {
    navigate(`/jobs/${job.id}`);
  };

  const handleInterviewMode = (mode: typeof interviewModeOptions[0]) => {
    sessionStorage.setItem("interviewModeContext", JSON.stringify({
      interviewMode: mode.interviewMode,
      taxonomy: {
        label: mode.label,
        description: mode.description,
        typicalDuration: mode.duration,
        includes: mode.includes,
      },
      roleCategories: mode.roleCategories,
    }));
    navigate(`/interview/mode-setup?mode=${mode.interviewMode}`);
  };

  const handleAddViaUrl = async () => {
    if (!url.trim()) {
      setError("Please enter a job URL");
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const response = await fetch("/api/jobs/job-targets/parse-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (data.error === "IMPORT_BLOCKED") {
        setError(data.message || "This site requires login. Please paste the job description instead.");
        setAddMode("paste");
        return;
      }
      if (data.success && data.duplicate && data.existingJobId) {
        navigate(`/jobs/${data.existingJobId}`);
        return;
      }
      if (!data.success) throw new Error(data.error || data.message);
      navigate(`/jobs/${data.job.id}`);
    } catch (e: any) {
      setError(e.message || "Failed to import. Try pasting the job description instead.");
    } finally {
      setAdding(false);
    }
  };

  const handleAddViaPaste = async () => {
    if (!pasteText.trim()) {
      setError("Please paste the job description");
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleTitle: "New Job", jdText: pasteText, source: "manual" }),
      });
      const data = await response.json();
      if (data.success && data.duplicate && data.existingJobId) {
        navigate(`/jobs/${data.existingJobId}`);
        return;
      }
      if (!data.success) throw new Error(data.error);
      navigate(`/jobs/${data.job.id}`);
    } catch (e: any) {
      setError(e.message || "Failed to create job");
    } finally {
      setAdding(false);
    }
  };

  const handleAddManual = async () => {
    if (!title.trim()) {
      setError("Please enter a job title");
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const response = await fetch("/api/jobs/job-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleTitle: title,
          companyName: company || null,
          location: location || null,
          jdText: pasteText || null,
          source: "manual",
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      navigate(`/jobs/${data.job.id}`);
    } catch (e: any) {
      setError(e.message || "Failed to create job");
    } finally {
      setAdding(false);
    }
  };

  const resetForm = () => {
    setAddMode(null);
    setUrl("");
    setPasteText("");
    setTitle("");
    setCompany("");
    setLocation("");
    setError(null);
    setCustomStep("details");
    setSelectedCustomRound(null);
    setCustomJobDetails(null);
  };

  const handleProceedToRoundSelection = () => {
    setCustomJobDetails({ title, company, jdText: pasteText || undefined });
    setCustomStep("round");
  };

  const handleStartCustomInterview = async () => {
    if (!customJobDetails || !selectedCustomRound) return;
    
    setAdding(true);
    setError(null);
    
    try {
      const response = await fetch("/api/interview/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewMode: selectedCustomRound,
          customJobTitle: customJobDetails.title,
          customCompany: customJobDetails.company,
          customJdText: customJobDetails.jdText,
          style: "neutral",
          mode: "custom",
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create session");
      }

      const selectedMode = interviewModeOptions.find(m => m.interviewMode === selectedCustomRound);
      sessionStorage.setItem("interviewModeSetup", JSON.stringify({
        interviewMode: selectedCustomRound,
        taxonomy: selectedMode ? {
          label: selectedMode.label,
          description: selectedMode.description,
          typicalDuration: selectedMode.duration,
          includes: selectedMode.includes,
        } : null,
        customJobTitle: customJobDetails.title,
        customCompany: customJobDetails.company,
        configId: data.config.id,
      }));

      navigate(`/interview/config?configId=${data.config.id}&interviewMode=${selectedCustomRound}`);
    } catch (err: any) {
      console.error("Error starting custom interview:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setAdding(false);
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <LoadingSpinner />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-0 space-y-6 sm:space-y-8 pb-20 sm:pb-12">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#042c4c] mb-1">Interview Practice</h1>
          <p className="text-sm sm:text-base text-slate-500">AI-powered practice sessions to ace your interviews</p>
        </div>

        {fetchError && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
            <p className="font-medium mb-1">Unable to load content</p>
            <p className="text-amber-700">{fetchError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 text-amber-600 hover:underline font-medium"
            >
              Refresh page
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Three-card choice when no path is selected */}
        {!selectedPath && (
          <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4">
            {/* Practice by Role */}
            <button
              onClick={() => setSelectedPath("role")}
              className="w-full group text-left bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:border-[#ee7e65] hover:shadow-lg transition-all"
            >
              <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ee7e65] to-[#e06a50] flex items-center justify-center sm:mb-4 flex-shrink-0">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-[#042c4c] mb-0.5 sm:mb-2 group-hover:text-[#ee7e65] transition-colors">
                    Practice by Role
                  </h2>
                  <p className="text-slate-500 text-sm line-clamp-2 sm:line-clamp-none sm:mb-4">
                    {roleKits.length}+ role kits: Engineer, PM, Analyst...
                  </p>
                  <div className="hidden sm:flex items-center gap-2 text-[#ee7e65] font-medium text-sm">
                    <span>Browse roles</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#ee7e65] sm:hidden" />
              </div>
            </button>

            {/* Practice by Interview Type */}
            <button
              onClick={() => setSelectedPath("skill")}
              className="w-full group text-left bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:border-purple-400 hover:shadow-lg transition-all"
            >
              <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center sm:mb-4 flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-[#042c4c] mb-0.5 sm:mb-2 group-hover:text-purple-600 transition-colors">
                    Practice by Type
                  </h2>
                  <p className="text-slate-500 text-sm line-clamp-2 sm:line-clamp-none sm:mb-4">
                    Coding, Case Study, Behavioral, HR...
                  </p>
                  <div className="hidden sm:flex items-center gap-2 text-purple-600 font-medium text-sm">
                    <span>Choose type</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-500 sm:hidden" />
              </div>
            </button>

            {/* Custom Interview */}
            <button
              onClick={() => setSelectedPath("custom")}
              className="w-full group text-left bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:border-emerald-400 hover:shadow-lg transition-all"
            >
              <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center sm:mb-4 flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-[#042c4c] mb-0.5 sm:mb-2 group-hover:text-emerald-600 transition-colors">
                    Custom Interview
                  </h2>
                  <p className="text-slate-500 text-sm line-clamp-2 sm:line-clamp-none sm:mb-4">
                    Tailored questions for your specific job
                  </p>
                  <div className="hidden sm:flex items-center gap-2 text-emerald-600 font-medium text-sm">
                    <span>Get started</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  {savedJobs.length > 0 && (
                    <div className="hidden sm:block mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-400">{savedJobs.length} saved job{savedJobs.length !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:hidden">
                  {savedJobs.length > 0 && (
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{savedJobs.length} jobs</span>
                  )}
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Custom interview details */}
        {selectedPath === "custom" && (
          <section>
            <button
              onClick={() => { 
                if (customStep === "round") {
                  setCustomStep("details");
                } else {
                  setSelectedPath(null); 
                  resetForm(); 
                }
              }}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#042c4c] mb-4 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              {customStep === "round" ? "Back to job details" : "Back to options"}
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#042c4c]">Custom Interview</h2>
                <p className="text-sm text-slate-500">
                  {customStep === "details" ? "Step 1: Enter job details" : "Step 2: Select interview round"}
                </p>
              </div>
            </div>

            {customStep === "details" && (
              <div className="space-y-4">
                {/* Import from URL option */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Link2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-[#042c4c]">Import from URL</p>
                      <p className="text-xs text-slate-500">Paste a job link from LinkedIn, Indeed, Naukri, etc.</p>
                    </div>
                  </div>
                  {addMode === "url" ? (
                    <div className="space-y-3">
                      <Input
                        placeholder="https://linkedin.com/jobs/... or https://indeed.com/..."
                        value={url}
                        onChange={(e) => { setUrl(e.target.value); setError(null); }}
                        className="rounded-xl"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => { setAddMode(null); setUrl(""); setError(null); }}
                          className="rounded-xl"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddViaUrl}
                          disabled={adding || !url.trim()}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl"
                        >
                          {adding ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Importing...
                            </>
                          ) : (
                            <>
                              <Link2 className="w-4 h-4 mr-2" />
                              Import Job
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setAddMode("url")}
                      className="w-full rounded-xl border-dashed border-2 h-11 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Paste job URL to import
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs font-medium text-slate-400 uppercase">or enter manually</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Manual entry form */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#042c4c] mb-2">Job Title *</label>
                      <Input
                        placeholder="e.g., Product Manager, Software Engineer"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#042c4c] mb-2">Company</label>
                      <Input
                        placeholder="e.g., Google, Amazon, Microsoft"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#042c4c] mb-2">Job Description (Optional)</label>
                      <Textarea
                        placeholder="Paste the job description here for more tailored questions..."
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        className="rounded-xl min-h-[80px]"
                      />
                    </div>
                    <Button
                      onClick={handleProceedToRoundSelection}
                      disabled={!title.trim()}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-base font-medium"
                    >
                      Continue to Interview Round
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                {/* Saved Jobs section */}
                {savedJobs.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-medium text-[#042c4c]">YOUR SAVED JOBS ({savedJobs.length})</p>
                      <button
                        onClick={() => navigate("/jobs")}
                        className="text-sm text-[#ee7e65] hover:underline font-medium"
                      >
                        Manage all jobs →
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {savedJobs.slice(0, 4).map((job) => (
                        <button
                          key={job.id}
                          onClick={() => handleSelectJob(job)}
                          className="text-left p-3 rounded-xl border border-slate-200 hover:border-[#ee7e65] hover:shadow-sm transition-all group flex items-center gap-3"
                        >
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-[#ee7e65]/10 transition-colors">
                            <Briefcase className="w-4 h-4 text-slate-500 group-hover:text-[#ee7e65]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-[#042c4c] truncate text-sm">{job.roleTitle}</p>
                            {job.companyName && (
                              <p className="text-xs text-slate-400 truncate">{job.companyName}</p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#ee7e65] flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {customStep === "round" && customJobDetails && (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Practicing for</p>
                  <p className="font-semibold text-[#042c4c]">{customJobDetails.title}</p>
                  {customJobDetails.company && (
                    <p className="text-sm text-slate-500">{customJobDetails.company}</p>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <label className="block text-sm font-medium text-[#042c4c] mb-4">Select Interview Round</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {interviewModeOptions.map((mode) => {
                      const IconComponent = mode.icon;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => setSelectedCustomRound(mode.interviewMode)}
                          className={`text-left p-4 rounded-xl border-2 transition-all ${
                            selectedCustomRound === mode.interviewMode
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg ${mode.color} flex items-center justify-center flex-shrink-0`}>
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#042c4c] text-sm">{mode.label}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{mode.description}</p>
                            </div>
                            {selectedCustomRound === mode.interviewMode && (
                              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  onClick={handleStartCustomInterview}
                  disabled={!selectedCustomRound || adding}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-lg font-semibold"
                >
                  {adding ? (
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
            )}
          </section>
        )}

        {/* Saved jobs section - shown separately */}
        {selectedPath === "custom" && customStep === "details" && savedJobs.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Your Saved Jobs ({savedJobs.length})
              </p>
              <button
                onClick={() => navigate("/jobs")}
                className="text-xs text-[#ee7e65] hover:underline font-medium"
              >
                Manage all jobs →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {savedJobs.slice(0, 4).map((job) => (
                <button
                  key={job.id}
                  onClick={() => handleSelectJob(job)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-[#ee7e65] hover:bg-[#ee7e65]/5 transition-all group text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-[#ee7e65]/10 transition-colors">
                    <Building2 className="w-4 h-4 text-slate-500 group-hover:text-[#ee7e65]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#042c4c] text-sm truncate">{job.roleTitle}</p>
                    {job.companyName && (
                      <p className="text-xs text-slate-400 truncate">{job.companyName}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#ee7e65] flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Practice by Role */}
        {selectedPath === "role" && (
          <section>
            <button
              onClick={() => setSelectedPath(null)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#042c4c] mb-4 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back
            </button>

            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#ee7e65] to-[#e06a50] flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#042c4c]">Practice by Role</h2>
                <p className="text-xs sm:text-sm text-slate-500">Choose a role kit for your target position</p>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-white rounded-xl"
                />
              </div>
              
              {/* Horizontal scroll filter chips on mobile */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                <button
                  onClick={() => setSelectedDomain(null)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    !selectedDomain
                      ? "bg-[#042c4c] text-white"
                      : "bg-white border border-slate-200 text-slate-600"
                  }`}
                >
                  All
                </button>
                {domains.slice(0, 6).map((domain) => (
                  <button
                    key={domain}
                    onClick={() => setSelectedDomain(selectedDomain === domain ? null : domain)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      selectedDomain === domain
                        ? "bg-[#ee7e65] text-white"
                        : "bg-white border border-slate-200 text-slate-600"
                    }`}
                  >
                    {formatDomain(domain)}
                  </button>
                ))}
                {domains.length > 6 && (
                  <div className="relative">
                    <button
                      onClick={() => setFilterOpen(!filterOpen)}
                      className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap bg-white border border-slate-200 text-slate-600"
                    >
                      More...
                    </button>
                    {filterOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
                        {domains.slice(6).map((domain) => (
                          <button
                            key={domain}
                            onClick={() => { setSelectedDomain(domain); setFilterOpen(false); }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-slate-50 ${
                              selectedDomain === domain ? "bg-[#ee7e65]/10 text-[#ee7e65] font-medium" : "text-slate-700"
                            }`}
                          >
                            <span>{formatDomain(domain)}</span>
                            {selectedDomain === domain && <Check className="w-4 h-4 text-[#ee7e65]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <span className="text-xs text-slate-400 ml-auto whitespace-nowrap pl-2">
                  {filteredKits.length} roles
                </span>
              </div>
            </div>

            {filteredKits.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl sm:rounded-2xl border border-slate-200">
                <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-700 mb-1">No roles found</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Try adjusting your search or filters.
                </p>
                <Button variant="outline" size="sm" onClick={() => { setSelectedDomain(null); setSearchQuery(""); }}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                {filteredKits.map((kit) => {
                  const IconComponent = domainIcons[kit.domain] || Briefcase;
                  const bgColor = domainColors[kit.domain] || "bg-slate-500";
                  const levelConfig = getLevelConfig(kit.level);

                  return (
                    <button
                      key={kit.id}
                      onClick={() => handleSelectRole(kit)}
                      className="w-full group text-left bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-lg hover:border-[#ee7e65] transition-all"
                    >
                      {/* Mobile: horizontal layout */}
                      <div className="flex sm:hidden items-center gap-3">
                        <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-[#042c4c] truncate group-hover:text-[#ee7e65]">
                              {kit.name}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelConfig.color} flex-shrink-0`}>
                              {levelConfig.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{formatDomain(kit.domain)}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#ee7e65] flex-shrink-0" />
                      </div>

                      {/* Desktop: vertical card layout */}
                      <div className="hidden sm:block">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelConfig.color}`}>
                            {levelConfig.label}
                          </span>
                        </div>

                        <h3 className="font-semibold text-[#042c4c] mb-0.5 group-hover:text-[#ee7e65] transition-colors">
                          {kit.name}
                        </h3>
                        <p className="text-xs text-slate-500 mb-3">
                          {formatDomain(kit.domain)}
                        </p>

                        {kit.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                            {kit.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{kit.estimatedDuration || 30} min</span>
                          </div>
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-[#ee7e65] group-hover:gap-2 transition-all">
                            Start
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Practice by Interview Type */}
        {selectedPath === "skill" && (
          <section>
            <button
              onClick={() => setSelectedPath(null)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#042c4c] mb-4 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back
            </button>

            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#042c4c]">Practice by Type</h2>
                <p className="text-xs sm:text-sm text-slate-500">Choose the interview type to focus on</p>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
              {interviewModeOptions.map((mode) => {
                const IconComponent = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => handleInterviewMode(mode)}
                    className="w-full group text-left bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-lg hover:border-purple-200 transition-all"
                  >
                    {/* Mobile: horizontal compact layout */}
                    <div className="flex sm:hidden items-center gap-3">
                      <div className={`w-10 h-10 ${mode.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#042c4c] mb-0.5 group-hover:text-purple-700">
                          {mode.label}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {mode.description}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-500 flex-shrink-0" />
                    </div>

                    {/* Desktop: full card layout */}
                    <div className="hidden sm:block">
                      <div className={`w-12 h-12 ${mode.color} rounded-xl flex items-center justify-center mb-4`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-[#042c4c] text-base mb-1 group-hover:text-purple-700 transition-colors">
                        {mode.label}
                      </h3>
                      <p className="text-sm text-slate-500 mb-3">
                        {mode.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {mode.includes.slice(0, 3).map((item, idx) => (
                          <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {item}
                          </span>
                        ))}
                        {mode.includes.length > 3 && (
                          <span className="text-xs text-slate-400">+{mode.includes.length - 3}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {mode.duration}
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 group-hover:gap-2 transition-all">
                          Start
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </SidebarLayout>
  );
}
