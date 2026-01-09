import { useState, useEffect } from "react";
import { Search, Plus, Briefcase, Building2, MapPin, Clock, ChevronRight, Target, ClipboardPaste, Link2, Play, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface JobTarget {
  id: string;
  userId: string;
  source: string | null;
  jobUrl: string | null;
  companyName: string | null;
  roleTitle: string;
  location: string | null;
  jdText: string | null;
  jdParsed: {
    requiredSkills?: string[];
    preferredSkills?: string[];
    experienceLevel?: string;
    responsibilities?: string[];
    focusAreas?: string[];
  } | null;
  status: "saved" | "applied" | "interview" | "offer" | "rejected" | "archived";
  readinessScore: number | null;
  lastPracticedAt: string | null;
  createdAt: string;
  updatedAt: string;
  companyArchetype?: string | null;
  archetypeConfidence?: "high" | "medium" | "low" | null;
  roleArchetypeId?: string | null;
  roleFamily?: string | null;
  practiceStats?: {
    totalSessions: number;
    interviewSessions: number;
    exerciseSessions: number;
    avgScore: number | null;
  };
}

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  saved: { label: "Saved", bg: "bg-[#042c4c]", text: "text-white", border: "border-[#042c4c]" },
  applied: { label: "Applied", bg: "bg-[#768c9c]", text: "text-white", border: "border-[#768c9c]" },
  interview: { label: "Interviewing", bg: "bg-[#ee7e65]", text: "text-white", border: "border-[#ee7e65]" },
  offer: { label: "Offer", bg: "bg-emerald-500", text: "text-white", border: "border-emerald-500" },
  rejected: { label: "Rejected", bg: "bg-red-500", text: "text-white", border: "border-red-500" },
  archived: { label: "Archived", bg: "bg-slate-400", text: "text-white", border: "border-slate-400" },
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobTarget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addMode, setAddMode] = useState<"url" | "manual" | null>(null);
  const [pastedJD, setPastedJD] = useState("");
  const [pastedUrl, setPastedUrl] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [newJob, setNewJob] = useState({ roleTitle: "", companyName: "", location: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/jobs/job-targets");
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.roleTitle.toLowerCase().includes(query) ||
      job.companyName?.toLowerCase().includes(query) ||
      job.location?.toLowerCase().includes(query)
    );
  });

  const activeJobs = jobs.filter(j => !['archived', 'rejected'].includes(j.status));
  const interviewingJobs = jobs.filter(j => j.status === 'interview');
  const avgReadiness = activeJobs.length > 0 
    ? Math.round(activeJobs.reduce((sum, j) => sum + (j.readinessScore || 0), 0) / activeJobs.length)
    : 0;

  const handleAddJob = async () => {
    if (!newJob.roleTitle.trim()) return;
    
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/jobs/job-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...newJob, 
          jdText: pastedJD.trim() || null 
        }),
      });
      const data = await response.json();
      if (data.success) {
        setJobs([data.job, ...jobs]);
        setNewJob({ roleTitle: "", companyName: "", location: "" });
        setPastedJD("");
        setAddDialogOpen(false);
        setAddMode(null);
      }
    } catch (error) {
      console.error("Error adding job:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleParseUrl = async () => {
    if (!pastedUrl.trim()) return;
    
    try {
      setIsParsingUrl(true);
      setUrlError("");
      
      const response = await fetch("/api/jobs/parse-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: pastedUrl }),
      });
      
      const data = await response.json();
      
      if (data.success && data.job) {
        setJobs([data.job, ...jobs]);
        setAddDialogOpen(false);
        setAddMode(null);
        setPastedUrl("");
      } else {
        setUrlError(data.error || "Could not parse this URL. Try pasting the job description manually.");
      }
    } catch (error) {
      console.error("Error parsing URL:", error);
      setUrlError("Failed to parse URL. Please try again.");
    } finally {
      setIsParsingUrl(false);
    }
  };

  const resetDialog = () => {
    setAddMode(null);
    setUrlError("");
    setPastedUrl("");
    setPastedJD("");
    setNewJob({ roleTitle: "", companyName: "", location: "" });
  };

  const getReadinessColor = (score: number | null) => {
    if (score === null || score === 0) return "bg-slate-200";
    if (score >= 70) return "bg-emerald-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-red-400";
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#fbfbfc]">
        <div className="bg-gradient-to-br from-[#042c4c] via-[#0a3d66] to-[#042c4c] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-[#ee7e65] rounded-lg flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[#ee7e65] text-sm font-semibold uppercase tracking-wide">Job Tracker</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold">Your Job Targets</h1>
                <p className="text-white/70 mt-2 text-sm sm:text-base">
                  Track applications and build interview readiness
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{activeJobs.length}</p>
                  <p className="text-white/60 text-xs">Active</p>
                </div>
                <div className="text-center border-x border-white/20 px-4">
                  <p className="text-2xl font-bold text-[#ee7e65]">{interviewingJobs.length}</p>
                  <p className="text-white/60 text-xs">Interviewing</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{avgReadiness}%</p>
                  <p className="text-white/60 text-xs">Readiness</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-4 sm:p-6 border border-slate-100">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#768c9c]" />
                <Input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-[#fbfbfc] rounded-xl border-slate-200 focus:border-[#ee7e65] focus:ring-[#ee7e65]/20 text-[#042c4c]"
                />
              </div>
              <Dialog open={addDialogOpen} onOpenChange={(open) => { 
                setAddDialogOpen(open); 
                if (!open) resetDialog();
              }}>
                <DialogTrigger asChild>
                  <Button className="h-12 px-6 gap-2 bg-[#ee7e65] hover:bg-[#e06a50] text-white font-semibold rounded-xl shadow-lg shadow-[#ee7e65]/25">
                    <Plus className="w-5 h-5" />
                    Add Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-[#042c4c]">
                      {addMode === "url" ? "Import from URL" :
                       addMode === "manual" ? "Enter Job Details" :
                       "Add Job Target"}
                    </DialogTitle>
                  </DialogHeader>
                  {renderDialogContent()}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {isLoading && jobs.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-[#768c9c]" />
              </div>
              <h3 className="text-xl font-bold text-[#042c4c] mb-2">
                {searchQuery ? "No matching jobs" : "No jobs yet"}
              </h3>
              <p className="text-[#6c8194] mb-6">
                {searchQuery 
                  ? "Try a different search" 
                  : "Add your target jobs to start preparing"}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => setAddDialogOpen(true)}
                  className="bg-[#ee7e65] hover:bg-[#e06a50] text-white rounded-xl px-6"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Job
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => {
                const status = statusConfig[job.status] || statusConfig.saved;
                const readiness = job.readinessScore || 0;
                
                return (
                  <div
                    key={job.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 hover:border-[#ee7e65]/40 hover:shadow-lg hover:shadow-[#ee7e65]/5 transition-all duration-200 cursor-pointer group"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#042c4c] to-[#0a3d66] rounded-xl flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-[#042c4c] truncate group-hover:text-[#ee7e65] transition-colors">
                            {job.roleTitle}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.bg} ${status.text}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-[#6c8194]">
                          {job.companyName && (
                            <span className="truncate font-medium">{job.companyName}</span>
                          )}
                          {job.location && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3" />
                                {job.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="hidden sm:flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#042c4c]">{readiness}%</p>
                          <p className="text-xs text-[#6c8194]">ready</p>
                        </div>
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${getReadinessColor(readiness)}`}
                            style={{ width: `${readiness}%` }}
                          />
                        </div>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-[#768c9c] flex-shrink-0 group-hover:text-[#ee7e65] group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );

  function renderDialogContent() {
    if (!addMode) {
      return (
        <div className="space-y-3 pt-2">
          <button
            onClick={() => setAddMode("url")}
            className="w-full p-4 border border-slate-200 rounded-xl text-left hover:bg-slate-50 hover:border-[#ee7e65]/30 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#042c4c] to-[#0a3d66] rounded-lg flex items-center justify-center">
                <Link2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#042c4c] group-hover:text-[#ee7e65] transition-colors">Import from URL</p>
                <p className="text-sm text-[#6c8194]">LinkedIn, Indeed, Glassdoor...</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#768c9c]" />
            </div>
          </button>
          <button
            onClick={() => setAddMode("manual")}
            className="w-full p-4 border border-slate-200 rounded-xl text-left hover:bg-slate-50 hover:border-[#ee7e65]/30 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ee7e65] to-[#e06a50] rounded-lg flex items-center justify-center">
                <ClipboardPaste className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#042c4c] group-hover:text-[#ee7e65] transition-colors">Enter manually</p>
                <p className="text-sm text-[#6c8194]">Type or paste job details</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#768c9c]" />
            </div>
          </button>
        </div>
      );
    }
    
    if (addMode === "url") {
      return (
        <div className="space-y-4 pt-2">
          <Input
            value={pastedUrl}
            onChange={(e) => { setPastedUrl(e.target.value); setUrlError(""); }}
            placeholder="Paste job URL..."
            className={`h-12 rounded-xl text-[#042c4c] ${urlError ? "border-red-500" : ""}`}
          />
          {urlError && <p className="text-sm text-red-500">{urlError}</p>}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setAddMode(null)} className="flex-1 h-11 rounded-xl border-slate-200">
              Back
            </Button>
            <Button 
              onClick={handleParseUrl}
              disabled={isParsingUrl || !pastedUrl.trim()}
              className="flex-1 h-11 rounded-xl bg-[#ee7e65] hover:bg-[#e06a50] shadow-lg shadow-[#ee7e65]/25"
            >
              {isParsingUrl ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-4 pt-2">
        <Input
          value={newJob.roleTitle}
          onChange={(e) => setNewJob({ ...newJob, roleTitle: e.target.value })}
          placeholder="Role title *"
          className="h-12 rounded-xl text-[#042c4c]"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            value={newJob.companyName}
            onChange={(e) => setNewJob({ ...newJob, companyName: e.target.value })}
            placeholder="Company"
            className="h-12 rounded-xl text-[#042c4c]"
          />
          <Input
            value={newJob.location}
            onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
            placeholder="Location"
            className="h-12 rounded-xl text-[#042c4c]"
          />
        </div>
        <textarea
          value={pastedJD}
          onChange={(e) => setPastedJD(e.target.value)}
          placeholder="Paste job description (optional)"
          className="w-full h-24 p-4 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-[#ee7e65]/20 focus:border-[#ee7e65] text-[#042c4c] placeholder:text-[#768c9c]"
        />
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setAddMode(null)} className="flex-1 h-11 rounded-xl border-slate-200">
            Back
          </Button>
          <Button 
            onClick={handleAddJob}
            disabled={isSubmitting || !newJob.roleTitle.trim()}
            className="flex-1 h-11 rounded-xl bg-[#ee7e65] hover:bg-[#e06a50] shadow-lg shadow-[#ee7e65]/25"
          >
            {isSubmitting ? "Adding..." : "Add Job"}
          </Button>
        </div>
      </div>
    );
  }
}
