import { useState, useEffect } from "react";
import { 
  Search, ChevronRight, Briefcase, GraduationCap, Code, LineChart, Users, Megaphone, 
  Clock, ArrowRight, Building2, Check, ChevronDown, X, Plus, Link2, FileText,
  Loader2, MapPin, Target, Sparkles, ExternalLink
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
  software: "bg-[#000000]",
  data: "bg-[#cb6ce6]",
  product: "bg-[#24c4b8]",
  design: "bg-gray-500",
  sales: "bg-[#24c4b8]",
  marketing: "bg-[#000000]",
  customer_success: "bg-[#cb6ce6]",
  operations: "bg-gray-500",
  consulting: "bg-[#000000]",
  finance: "bg-[#cb6ce6]",
  hr: "bg-[#24c4b8]",
  recruiting: "bg-gray-500",
  engineering_management: "bg-[#000000]",
};

const getLevelConfig = (level: string) => {
  switch (level) {
    case "entry":
      return { label: "Entry", color: "bg-emerald-100 text-emerald-700" };
    case "mid":
      return { label: "Mid-Level", color: "bg-[#24c4b8]/10 text-[#24c4b8]" };
    case "senior":
      return { label: "Senior", color: "bg-[#000000]/10 text-[#000000]" };
    default:
      return { label: level, color: "bg-[#cb6ce6]/10 text-gray-500" };
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
  
  const [savedJobs, setSavedJobs] = useState<JobTarget[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [addMode, setAddMode] = useState<AddMode>("url");
  const [url, setUrl] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showAddJob, setShowAddJob] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);
        const [rolesRes, jobsRes] = await Promise.all([
          fetch("/api/interview/role-kits"),
          fetch("/api/jobs")
        ]);
        
        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          if (rolesData.success) {
            setRoleKits(rolesData.roleKits);
            setFilteredKits(rolesData.roleKits);
          }
        }
        
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          if (jobsData.success) {
            setSavedJobs(jobsData.jobs.filter((j: JobTarget) => j.status !== "archived"));
          }
        }
        
        if (!rolesRes.ok && !jobsRes.ok) {
          setFetchError("Unable to load practice options. Please refresh the page.");
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
    setShowAddJob(false);
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
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <LoadingSpinner />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#fbfbfc]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-20 sm:pb-12">
          
          {/* Hero Header */}
          <div className="bg-gradient-to-br from-[#000000] to-[#1a0a2e] rounded-2xl p-6 sm:p-8 text-white shadow-xl">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Interview Practice</h1>
            <p className="text-white/70 text-sm sm:text-base max-w-xl mb-4">
              Practice for your target jobs or use role templates. AI-powered sessions with detailed feedback.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#24c4b8] flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-white/80">{savedJobs.length} Target Jobs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-white/80">{roleKits.length}+ Role Templates</span>
              </div>
            </div>
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

          {/* Section 1: Your Target Jobs - Primary */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#24c4b8] flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Your Target Jobs</h2>
                  <p className="text-xs text-slate-500">Practice for specific positions you're applying to</p>
                </div>
              </div>
              {savedJobs.length > 0 && (
                <button 
                  onClick={() => navigate("/jobs")}
                  className="text-sm text-[#24c4b8] font-medium hover:underline hidden sm:block"
                >
                  Manage all →
                </button>
              )}
            </div>

            {savedJobs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {savedJobs.slice(0, 6).map((job) => (
                  <button
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className="group text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-[#24c4b8] hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#24c4b8]/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-[#24c4b8]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate group-hover:text-[#24c4b8] transition-colors">
                          {job.roleTitle}
                        </h3>
                        {job.companyName && (
                          <p className="text-sm text-slate-500 truncate">{job.companyName}</p>
                        )}
                        {job.location && (
                          <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {job.location}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#24c4b8] flex-shrink-0 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {/* Add New Job Card */}
            {!showAddJob ? (
              <button
                onClick={() => setShowAddJob(true)}
                className="w-full group text-left bg-white border-2 border-dashed border-slate-300 rounded-xl p-5 hover:border-[#24c4b8] hover:bg-[#24c4b8]/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#24c4b8]/10 flex items-center justify-center group-hover:bg-[#24c4b8]/20 transition-colors">
                    <Plus className="w-6 h-6 text-[#24c4b8]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-[#24c4b8] transition-colors">
                      Add a Target Job
                    </h3>
                    <p className="text-sm text-slate-500">
                      Import from URL, paste job description, or enter manually
                    </p>
                  </div>
                </div>
              </button>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900">Add a Target Job</h3>
                  <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tab buttons */}
                <div className="flex gap-2 border-b border-slate-200 pb-3">
                  <button
                    onClick={() => setAddMode("url")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      addMode === "url" ? "bg-[#24c4b8] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Link2 className="w-4 h-4 inline mr-1.5" />
                    Import URL
                  </button>
                  <button
                    onClick={() => setAddMode("paste")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      addMode === "paste" ? "bg-[#24c4b8] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <FileText className="w-4 h-4 inline mr-1.5" />
                    Paste JD
                  </button>
                  <button
                    onClick={() => setAddMode("manual")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      addMode === "manual" ? "bg-[#24c4b8] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 inline mr-1.5" />
                    Manual
                  </button>
                </div>

                {addMode === "url" && (
                  <div className="space-y-3">
                    <Input
                      placeholder="https://linkedin.com/jobs/... or https://indeed.com/..."
                      value={url}
                      onChange={(e) => { setUrl(e.target.value); setError(null); }}
                      className="rounded-xl"
                    />
                    <Button
                      onClick={handleAddViaUrl}
                      disabled={adding || !url.trim()}
                      className="w-full bg-[#24c4b8] hover:bg-[#1db0a5] rounded-xl"
                    >
                      {adding ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Import Job
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {addMode === "paste" && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Paste the full job description here..."
                      value={pasteText}
                      onChange={(e) => { setPasteText(e.target.value); setError(null); }}
                      className="rounded-xl min-h-[120px]"
                    />
                    <Button
                      onClick={handleAddViaPaste}
                      disabled={adding || !pasteText.trim()}
                      className="w-full bg-[#24c4b8] hover:bg-[#1db0a5] rounded-xl"
                    >
                      {adding ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Create Job"
                      )}
                    </Button>
                  </div>
                )}

                {addMode === "manual" && (
                  <div className="space-y-3">
                    <Input
                      placeholder="Job Title *"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="rounded-xl"
                    />
                    <Input
                      placeholder="Company Name (optional)"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="rounded-xl"
                    />
                    <Textarea
                      placeholder="Job Description (optional - helps generate better questions)"
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      className="rounded-xl min-h-[80px]"
                    />
                    <Button
                      onClick={handleAddManual}
                      disabled={adding || !title.trim()}
                      className="w-full bg-[#24c4b8] hover:bg-[#1db0a5] rounded-xl"
                    >
                      {adding ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Job"
                      )}
                    </Button>
                  </div>
                )}

              </div>
            )}
          </section>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-medium text-slate-400 uppercase">or practice with templates</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Section 2: Role Templates - Secondary */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Role Templates</h2>
                  <p className="text-xs text-slate-500">General practice for common roles</p>
                </div>
              </div>
              <span className="text-xs text-slate-400">{filteredKits.length} templates</span>
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
              
              {/* Horizontal scroll filter chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                <button
                  onClick={() => setSelectedDomain(null)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    !selectedDomain
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
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
                        ? "bg-slate-700 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
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
                              selectedDomain === domain ? "bg-slate-700/10 text-slate-700 font-medium" : "text-slate-700"
                            }`}
                          >
                            <span>{formatDomain(domain)}</span>
                            {selectedDomain === domain && <Check className="w-4 h-4 text-slate-700" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {filteredKits.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredKits.map((kit) => {
                  const IconComponent = domainIcons[kit.domain] || Briefcase;
                  const bgColor = domainColors[kit.domain] || "bg-slate-500";
                  const levelConfig = getLevelConfig(kit.level);

                  return (
                    <button
                      key={kit.id}
                      onClick={() => handleSelectRole(kit)}
                      className="group text-left bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg hover:border-slate-400 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-slate-900 truncate group-hover:text-slate-700">
                              {kit.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${levelConfig.color}`}>
                              {levelConfig.label}
                            </span>
                            <span className="text-xs text-slate-400">{formatDomain(kit.domain)}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 flex-shrink-0 mt-1" />
                      </div>
                      
                      {kit.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-2 ml-[52px]">
                          {kit.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {kit.estimatedDuration || 30} min
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </SidebarLayout>
  );
}
