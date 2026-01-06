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
  ArrowRight,
  X
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
}

type AddMode = "url" | "paste" | "manual" | null;

export default function InterviewCustomPage() {
  const navigate = useNavigate();
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#042c4c] mb-2">Interview Practice</h1>
            <p className="text-slate-500">Add a job or select one to start practicing</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {loadingJobs ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-[#ee7e65]" />
            </div>
          ) : (
            <div className="space-y-4">
              {!addMode ? (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-medium text-slate-700 mb-3">Add a new job</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setAddMode("url")}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#042c4c] text-white rounded-lg hover:bg-[#0a3d66] transition-colors text-sm font-medium"
                    >
                      <Link2 className="w-4 h-4" />
                      Import from URL
                    </button>
                    <button
                      onClick={() => setAddMode("paste")}
                      className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                    >
                      <FileText className="w-4 h-4" />
                      Paste JD
                    </button>
                    <button
                      onClick={() => setAddMode("manual")}
                      className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                    >
                      <Plus className="w-4 h-4" />
                      Enter Manually
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
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
                    </button>
                  </div>

                  {addMode === "url" && (
                    <div className="space-y-3">
                      <Input
                        placeholder="Paste job URL (LinkedIn, Indeed, Naukri...)"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="rounded-lg text-sm"
                      />
                      <Button
                        onClick={handleAddViaUrl}
                        disabled={adding}
                        size="sm"
                        className="bg-[#ee7e65] hover:bg-[#e06a50] rounded-lg"
                      >
                        {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Import
                      </Button>
                    </div>
                  )}

                  {addMode === "paste" && (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Paste the complete job description here..."
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        className="rounded-lg text-sm min-h-[120px]"
                      />
                      <Button
                        onClick={handleAddViaPaste}
                        disabled={adding || !pasteText.trim()}
                        size="sm"
                        className="bg-[#ee7e65] hover:bg-[#e06a50] rounded-lg"
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
                        className="rounded-lg text-sm"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Company (optional)"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          className="rounded-lg text-sm"
                        />
                        <Input
                          placeholder="Location (optional)"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="rounded-lg text-sm"
                        />
                      </div>
                      <Button
                        onClick={handleAddManual}
                        disabled={adding || !title.trim()}
                        size="sm"
                        className="bg-[#ee7e65] hover:bg-[#e06a50] rounded-lg"
                      >
                        {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Create Job
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {savedJobs.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3 px-1">
                    Your Jobs ({savedJobs.length})
                  </p>
                  <div className="space-y-2">
                    {savedJobs.map((job) => (
                      <button
                        key={job.id}
                        onClick={() => handleSelectJob(job)}
                        className="w-full bg-white rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-[#ee7e65] hover:shadow-sm transition-all group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-[#ee7e65]/10 transition-colors">
                            <Briefcase className="w-4 h-4 text-slate-500 group-hover:text-[#ee7e65]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-[#042c4c] truncate text-sm">{job.roleTitle}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              {job.companyName && (
                                <span className="flex items-center gap-1 truncate">
                                  <Building2 className="w-3 h-3 flex-shrink-0" />
                                  {job.companyName}
                                </span>
                              )}
                              {job.location && (
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />
                                  {job.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#ee7e65] flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {savedJobs.length === 0 && !addMode && (
                <div className="text-center py-12 text-slate-400">
                  <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No jobs added yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
