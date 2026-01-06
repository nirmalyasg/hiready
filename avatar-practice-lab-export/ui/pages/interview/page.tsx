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
type PracticeTab = "roles" | "skills";
type SelectedPath = "job" | "quick" | null;

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
  software: "bg-blue-500",
  data: "bg-purple-500",
  product: "bg-emerald-500",
  design: "bg-pink-500",
  sales: "bg-amber-500",
  marketing: "bg-rose-500",
  customer_success: "bg-teal-500",
  operations: "bg-slate-500",
  consulting: "bg-indigo-500",
  finance: "bg-green-500",
  hr: "bg-orange-500",
  recruiting: "bg-cyan-500",
  engineering_management: "bg-violet-500",
};

const skillPracticeOptions = [
  { 
    id: "coding", 
    label: "Coding Interview", 
    description: "DSA, algorithms, and problem-solving practice",
    icon: Code,
    color: "bg-indigo-500",
    roundCategory: "coding",
    duration: "15 min"
  },
  { 
    id: "sql", 
    label: "SQL Assessment", 
    description: "Database queries, joins, and optimization",
    icon: Database,
    color: "bg-cyan-500",
    roundCategory: "sql",
    duration: "15 min"
  },
  { 
    id: "behavioral", 
    label: "Behavioral Interview", 
    description: "STAR method, leadership, and situational questions",
    icon: MessageSquare,
    color: "bg-amber-500",
    roundCategory: "behavioral",
    duration: "15 min"
  },
  { 
    id: "case", 
    label: "Case Study", 
    description: "Business cases, product sense, and strategy",
    icon: Briefcase,
    color: "bg-orange-500",
    roundCategory: "case",
    duration: "15 min"
  },
  { 
    id: "technical", 
    label: "Technical Deep Dive", 
    description: "System design, architecture, and technical concepts",
    icon: Brain,
    color: "bg-violet-500",
    roundCategory: "technical",
    duration: "15 min"
  },
  { 
    id: "analytics", 
    label: "Analytics Round", 
    description: "Metrics, data analysis, and insight storytelling",
    icon: BarChart3,
    color: "bg-teal-500",
    roundCategory: "analytics",
    duration: "15 min"
  },
  { 
    id: "ml", 
    label: "ML/AI Interview", 
    description: "Machine learning concepts and model evaluation",
    icon: TrendingUp,
    color: "bg-fuchsia-500",
    roundCategory: "ml",
    duration: "15 min"
  },
  { 
    id: "hiring_manager", 
    label: "Hiring Manager", 
    description: "Role fit, team dynamics, and career goals",
    icon: Users,
    color: "bg-blue-500",
    roundCategory: "hiring_manager",
    duration: "15 min"
  },
];

const getLevelConfig = (level: string) => {
  switch (level) {
    case "entry":
      return { label: "Entry", color: "bg-green-100 text-green-700" };
    case "mid":
      return { label: "Mid-Level", color: "bg-amber-100 text-amber-700" };
    case "senior":
      return { label: "Senior", color: "bg-red-100 text-red-700" };
    default:
      return { label: level, color: "bg-gray-100 text-gray-600" };
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
  const [practiceTab, setPracticeTab] = useState<PracticeTab>("roles");
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

  const handleSkillPractice = (skill: typeof skillPracticeOptions[0]) => {
    sessionStorage.setItem("rolePracticeContext", JSON.stringify({
      roundCategory: skill.roundCategory,
      taxonomy: {
        label: skill.label,
        description: skill.description,
        typicalDuration: skill.duration,
      },
      roleContext: {
        roleKitId: 0,
        roleName: "General Practice",
        level: "mid",
        domain: "general",
        skillsFocus: [],
        roleArchetypeId: null,
      },
      promptHints: {
        focusAreas: [skill.label],
        companySpecificGuidance: null,
      },
    }));
    navigate(`/interview/config?roundCategory=${skill.roundCategory}`);
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
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-2xl font-bold text-[#042c4c] mb-1">Interview Practice</h1>
          <p className="text-slate-500">Prepare for interviews with AI-powered practice sessions</p>
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

        {/* Two-card choice when no path is selected */}
        {!selectedPath && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Job-based practice card */}
            <button
              onClick={() => setSelectedPath("job")}
              className="group text-left bg-white border-2 border-slate-200 rounded-2xl p-6 hover:border-[#ee7e65] hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ee7e65] to-[#e06a50] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-[#042c4c] mb-2 group-hover:text-[#ee7e65] transition-colors">
                Practice for a Specific Job
              </h2>
              <p className="text-slate-500 text-sm mb-4">
                Add a job description to get tailored interview questions that match the role and company.
              </p>
              <div className="flex items-center gap-2 text-[#ee7e65] font-medium text-sm">
                <span>Get started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              {savedJobs.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-2">{savedJobs.length} saved job{savedJobs.length !== 1 ? 's' : ''}</p>
                </div>
              )}
            </button>

            {/* Quick practice card */}
            <button
              onClick={() => setSelectedPath("quick")}
              className="group text-left bg-white border-2 border-slate-200 rounded-2xl p-6 hover:border-purple-400 hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-[#042c4c] mb-2 group-hover:text-purple-600 transition-colors">
                Quick Practice
              </h2>
              <p className="text-slate-500 text-sm mb-4">
                Jump into practice sessions by role or skill type without needing a specific job description.
              </p>
              <div className="flex items-center gap-2 text-purple-600 font-medium text-sm">
                <span>Browse options</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400">{roleKits.length} roles • {skillPracticeOptions.length} skill types</p>
              </div>
            </button>
          </div>
        )}

        {/* Job-based practice details */}
        {selectedPath === "job" && (
          <section>
            <button
              onClick={() => { setSelectedPath(null); resetForm(); }}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#042c4c] mb-4 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to options
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ee7e65] to-[#e06a50] flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#042c4c]">Practice for a Specific Job</h2>
                <p className="text-sm text-slate-500">Add a job to get tailored interview questions</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
            {!addMode ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex flex-wrap gap-2 flex-1">
                  <button
                    onClick={() => setAddMode("url")}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#042c4c] text-white rounded-xl hover:bg-[#0a3d66] transition-colors text-sm font-medium"
                  >
                    <Link2 className="w-4 h-4" />
                    Import from URL
                  </button>
                  <button
                    onClick={() => setAddMode("paste")}
                    className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                  >
                    <FileText className="w-4 h-4" />
                    Paste JD
                  </button>
                  <button
                    onClick={() => setAddMode("manual")}
                    className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                    Enter Manually
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-slate-700">
                    {addMode === "url" && "Import from URL"}
                    {addMode === "paste" && "Paste Job Description"}
                    {addMode === "manual" && "Enter Job Details"}
                  </p>
                  <button
                    onClick={resetForm}
                    className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>

                {addMode === "url" && (
                  <div className="space-y-3">
                    <Input
                      placeholder="Paste job URL (LinkedIn, Indeed, Naukri...)"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="rounded-xl text-sm"
                    />
                    <Button
                      onClick={handleAddViaUrl}
                      disabled={adding}
                      size="sm"
                      className="bg-[#ee7e65] hover:bg-[#e06a50] rounded-xl"
                    >
                      {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Import Job
                    </Button>
                  </div>
                )}

                {addMode === "paste" && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Paste the complete job description here..."
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      className="rounded-xl text-sm min-h-[100px]"
                    />
                    <Button
                      onClick={handleAddViaPaste}
                      disabled={adding || !pasteText.trim()}
                      size="sm"
                      className="bg-[#ee7e65] hover:bg-[#e06a50] rounded-xl"
                    >
                      {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Create Job
                    </Button>
                  </div>
                )}

                {addMode === "manual" && (
                  <div className="space-y-3">
                    <Input
                      placeholder="Job title (e.g., Product Manager)"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="rounded-xl text-sm"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Company (optional)"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="rounded-xl text-sm"
                      />
                      <Input
                        placeholder="Location (optional)"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="rounded-xl text-sm"
                      />
                    </div>
                    <Button
                      onClick={handleAddManual}
                      disabled={adding || !title.trim()}
                      size="sm"
                      className="bg-[#ee7e65] hover:bg-[#e06a50] rounded-xl"
                    >
                      {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Create Job
                    </Button>
                  </div>
                )}
              </div>
            )}

            {!addMode && (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Your Saved Jobs {savedJobs.length > 0 && `(${savedJobs.length})`}
                  </p>
                  <button
                    onClick={() => navigate("/jobs")}
                    className="text-xs text-[#ee7e65] hover:underline font-medium"
                  >
                    Manage all jobs →
                  </button>
                </div>
                {savedJobs.length > 0 ? (
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
                ) : (
                  <p className="text-sm text-slate-400 py-2">No jobs saved yet. Add one above to start practicing.</p>
                )}
              </div>
            )}
          </div>
          </section>
        )}

        {/* Quick practice details */}
        {selectedPath === "quick" && (
          <section>
            <button
              onClick={() => setSelectedPath(null)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#042c4c] mb-4 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to options
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#042c4c]">Quick Practice Library</h2>
                <p className="text-sm text-slate-500">Jump into practice without a specific job</p>
              </div>
            </div>

          <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setPracticeTab("roles")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                practiceTab === "roles"
                  ? "bg-white text-[#042c4c] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              By Role
            </button>
            <button
              onClick={() => setPracticeTab("skills")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                practiceTab === "skills"
                  ? "bg-white text-[#042c4c] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              By Skill
            </button>
          </div>

          {practiceTab === "skills" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {skillPracticeOptions.map((skill) => {
                const IconComponent = skill.icon;
                return (
                  <button
                    key={skill.id}
                    onClick={() => handleSkillPractice(skill)}
                    className="group text-left bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-lg hover:border-purple-200 transition-all"
                  >
                    <div className={`w-10 h-10 ${skill.color} rounded-xl flex items-center justify-center mb-3`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-[#042c4c] text-sm mb-1 group-hover:text-purple-700 transition-colors">
                      {skill.label}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                      {skill.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {skill.duration}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {practiceTab === "roles" && (
            <>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search roles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 bg-white rounded-xl text-sm"
                  />
                </div>

                <div className="relative">
                  <button
                    onClick={() => setFilterOpen(!filterOpen)}
                    className={`inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-xl text-sm font-medium transition-all ${
                      selectedDomain 
                        ? "border-purple-400 text-purple-700" 
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    <span className="max-w-[120px] truncate">
                      {selectedDomain ? formatDomain(selectedDomain) : "All Domains"}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
                  </button>

                  {filterOpen && (
                    <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
                      <button
                        onClick={() => { setSelectedDomain(null); setFilterOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-slate-50 ${
                          !selectedDomain ? "bg-purple-50 text-purple-700 font-medium" : "text-slate-700"
                        }`}
                      >
                        All Domains
                        {!selectedDomain && <Check className="w-4 h-4 text-purple-600" />}
                      </button>
                      {domains.map((domain) => (
                        <button
                          key={domain}
                          onClick={() => { setSelectedDomain(domain); setFilterOpen(false); }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-slate-50 border-t border-slate-100 ${
                            selectedDomain === domain ? "bg-purple-50 text-purple-700 font-medium" : "text-slate-700"
                          }`}
                        >
                          <span className="truncate pr-2">{formatDomain(domain)}</span>
                          {selectedDomain === domain && <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedDomain && (
                  <button
                    onClick={() => setSelectedDomain(null)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full hover:bg-purple-200 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                )}

                <span className="text-xs text-slate-400 ml-auto">
                  <span className="font-medium text-slate-600">{filteredKits.length}</span> roles
                </span>
              </div>

              {filteredKits.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredKits.map((kit) => {
                    const IconComponent = domainIcons[kit.domain] || Briefcase;
                    const bgColor = domainColors[kit.domain] || "bg-slate-500";
                    const levelConfig = getLevelConfig(kit.level);

                    return (
                      <button
                        key={kit.id}
                        onClick={() => handleSelectRole(kit)}
                        className="group text-left bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-purple-200 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelConfig.color}`}>
                            {levelConfig.label}
                          </span>
                        </div>

                        <h3 className="font-semibold text-[#042c4c] mb-0.5 group-hover:text-purple-700 transition-colors">
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
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 group-hover:gap-2 transition-all">
                            Start
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
          </section>
        )}
      </div>
    </SidebarLayout>
  );
}
