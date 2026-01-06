import { useState, useEffect } from "react";
import { 
  Plus, 
  Briefcase, 
  Building2, 
  MapPin, 
  Loader2, 
  Link2, 
  FileText, 
  ChevronRight,
  Sparkles,
  Target,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { SidebarLayout } from "@/components/layout/sidebar-layout";

interface JobTarget {
  id: string;
  roleTitle: string;
  companyName: string | null;
  location: string | null;
  status: string;
  jdText: string | null;
}

type AddMode = "url" | "paste" | "manual" | null;

export default function InterviewCustomPage() {
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState<JobTarget[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>(null);
  
  const [url, setUrl] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      const data = await response.json();
      if (data.success) {
        setSavedJobs(data.jobs.filter((j: JobTarget) => j.status !== "archived"));
      }
    } catch (e) {
      console.error("Failed to fetch jobs:", e);
    } finally {
      setLoadingJobs(false);
    }
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
    setShowAddForm(false);
    setAddMode(null);
    setUrl("");
    setPasteText("");
    setTitle("");
    setCompany("");
    setLocation("");
    setError(null);
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#f8f9fb]">
        <div className="bg-[#042c4c] text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-[#ee7e65]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Interview Practice</h1>
                <p className="text-white/70 text-sm">Select a job to start practicing</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {loadingJobs ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#ee7e65]" />
            </div>
          ) : (
            <div className="space-y-6">
              {savedJobs.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-[#042c4c] mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#ee7e65]" />
                    Your Jobs
                  </h2>
                  <div className="grid gap-3">
                    {savedJobs.map((job) => (
                      <button
                        key={job.id}
                        onClick={() => handleSelectJob(job)}
                        className="w-full bg-white rounded-xl border border-slate-200 p-4 text-left hover:border-[#ee7e65] hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#042c4c] truncate">{job.roleTitle}</p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                              {job.companyName && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3.5 h-3.5" />
                                  {job.companyName}
                                </span>
                              )}
                              {job.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {job.location}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[#ee7e65] opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-sm font-medium">Practice</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full bg-white rounded-xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-[#ee7e65] hover:bg-[#ee7e65]/5 transition-all group"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-[#ee7e65]/10 flex items-center justify-center group-hover:bg-[#ee7e65]/20 transition-colors">
                      <Plus className="w-6 h-6 text-[#ee7e65]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#042c4c]">Add New Job</p>
                      <p className="text-sm text-slate-500">Import from URL, paste JD, or enter manually</p>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-[#042c4c] to-[#0a3d66] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <Sparkles className="w-5 h-5 text-[#ee7e65]" />
                      <span className="font-semibold">Add New Job</span>
                    </div>
                    <button
                      onClick={resetForm}
                      className="text-white/70 hover:text-white text-sm"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="p-5">
                    {!addMode ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          onClick={() => setAddMode("url")}
                          className="p-4 rounded-xl border-2 border-slate-200 hover:border-[#ee7e65] hover:bg-[#ee7e65]/5 transition-all text-left"
                        >
                          <Link2 className="w-6 h-6 text-[#ee7e65] mb-2" />
                          <p className="font-semibold text-[#042c4c]">Import from URL</p>
                          <p className="text-xs text-slate-500 mt-1">LinkedIn, Indeed, Naukri...</p>
                        </button>
                        <button
                          onClick={() => setAddMode("paste")}
                          className="p-4 rounded-xl border-2 border-slate-200 hover:border-[#ee7e65] hover:bg-[#ee7e65]/5 transition-all text-left"
                        >
                          <FileText className="w-6 h-6 text-[#ee7e65] mb-2" />
                          <p className="font-semibold text-[#042c4c]">Paste Job Description</p>
                          <p className="text-xs text-slate-500 mt-1">Copy & paste the full JD</p>
                        </button>
                        <button
                          onClick={() => setAddMode("manual")}
                          className="p-4 rounded-xl border-2 border-slate-200 hover:border-[#ee7e65] hover:bg-[#ee7e65]/5 transition-all text-left"
                        >
                          <Briefcase className="w-6 h-6 text-[#ee7e65] mb-2" />
                          <p className="font-semibold text-[#042c4c]">Enter Manually</p>
                          <p className="text-xs text-slate-500 mt-1">Type job details yourself</p>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <button
                          onClick={() => setAddMode(null)}
                          className="text-sm text-slate-500 hover:text-[#ee7e65] flex items-center gap-1"
                        >
                          <ChevronRight className="w-4 h-4 rotate-180" />
                          Back to options
                        </button>

                        {addMode === "url" && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Job URL</label>
                              <Input
                                placeholder="https://linkedin.com/jobs/... or https://indeed.com/..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="rounded-lg"
                              />
                              <p className="text-xs text-slate-500 mt-1">We'll extract job details automatically</p>
                            </div>
                            <Button
                              onClick={handleAddViaUrl}
                              disabled={adding}
                              className="bg-[#ee7e65] hover:bg-[#e06a50] rounded-lg"
                            >
                              {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
                              Import Job
                            </Button>
                          </div>
                        )}

                        {addMode === "paste" && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Job Description</label>
                              <Textarea
                                placeholder="Paste the complete job description here..."
                                value={pasteText}
                                onChange={(e) => setPasteText(e.target.value)}
                                className="rounded-lg min-h-[160px]"
                              />
                              <p className="text-xs text-slate-500 mt-1">Tip: Copy all text from the job posting page</p>
                            </div>
                            <Button
                              onClick={handleAddViaPaste}
                              disabled={adding || !pasteText.trim()}
                              className="bg-[#ee7e65] hover:bg-[#e06a50] rounded-lg"
                            >
                              {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                              Create Job
                            </Button>
                          </div>
                        )}

                        {addMode === "manual" && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Job Title *</label>
                                <Input
                                  placeholder="e.g., Senior Product Manager"
                                  value={title}
                                  onChange={(e) => setTitle(e.target.value)}
                                  className="rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                                <Input
                                  placeholder="e.g., Google"
                                  value={company}
                                  onChange={(e) => setCompany(e.target.value)}
                                  className="rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                                <Input
                                  placeholder="e.g., Bangalore, India"
                                  value={location}
                                  onChange={(e) => setLocation(e.target.value)}
                                  className="rounded-lg"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Job Description (optional)</label>
                              <Textarea
                                placeholder="Paste additional job details here..."
                                value={pasteText}
                                onChange={(e) => setPasteText(e.target.value)}
                                className="rounded-lg min-h-[100px]"
                              />
                            </div>
                            <Button
                              onClick={handleAddManual}
                              disabled={adding || !title.trim()}
                              className="bg-[#ee7e65] hover:bg-[#e06a50] rounded-lg"
                            >
                              {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                              Create Job
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {savedJobs.length === 0 && !showAddForm && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#042c4c] mb-2">No jobs yet</h3>
                  <p className="text-slate-500 mb-4">Add your first job target to start practicing interviews</p>
                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="bg-[#ee7e65] hover:bg-[#e06a50] rounded-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Job
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
