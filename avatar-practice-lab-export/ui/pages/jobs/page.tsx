import { useState, useEffect } from "react";
import { Search, Plus, Briefcase, Building2, MapPin, Clock, ChevronRight, MoreVertical, Target, CheckCircle2, XCircle, Archive, ClipboardPaste, Sparkles, Link2, Play, TrendingUp } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const statusConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  saved: { label: "Saved", color: "text-slate-600", bgColor: "bg-slate-50", borderColor: "border-slate-200" },
  applied: { label: "Applied", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  interview: { label: "Interviewing", color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
  offer: { label: "Offer", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" },
  rejected: { label: "Rejected", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" },
  archived: { label: "Archived", color: "text-gray-400", bgColor: "bg-gray-50", borderColor: "border-gray-200" },
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
      }
    } catch (error) {
      console.error("Error adding job:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleParseUrl = async () => {
    if (!pastedUrl.trim()) return;
    
    setUrlError("");
    
    try {
      new URL(pastedUrl);
    } catch {
      setUrlError("Please enter a valid URL starting with http:// or https://");
      return;
    }
    
    try {
      setIsParsingUrl(true);
      const response = await fetch("/api/jobs/job-targets/parse-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: pastedUrl }),
      });
      const data = await response.json();
      if (data.success && data.duplicate && data.existingJobId) {
        setPastedUrl("");
        setAddDialogOpen(false);
        navigate(`/jobs/${data.existingJobId}`);
      } else if (data.success && data.job) {
        setJobs([data.job, ...jobs]);
        setPastedUrl("");
        setAddDialogOpen(false);
        navigate(`/jobs/${data.job.id}`);
      } else if (data.error === "IMPORT_BLOCKED") {
        setUrlError(data.message || "This site requires login. Copy the job description and paste it in the 'Paste JD' tab instead.");
      } else {
        setUrlError(data.error || data.message || "Failed to parse the job URL");
      }
    } catch (error) {
      console.error("Error parsing URL:", error);
      setUrlError("Failed to connect. Please try again or paste the job description instead.");
    } finally {
      setIsParsingUrl(false);
    }
  };

  const handleUpdateStatus = async (jobId: string, status: string) => {
    try {
      const response = await fetch(`/api/jobs/job-targets/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        setJobs(jobs.map(j => j.id === jobId ? data.job : j));
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const resetDialog = () => {
    setAddMode(null);
    setUrlError("");
    setPastedUrl("");
    setPastedJD("");
    setNewJob({ roleTitle: "", companyName: "", location: "" });
  };

  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Jobs</h1>
            <p className="text-slate-500 text-sm mt-0.5">Track your target roles</p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={(open) => { 
            setAddDialogOpen(open); 
            if (!open) resetDialog();
          }}>
            <DialogTrigger asChild>
              <Button className="h-9 px-4 gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg">
                <Plus className="w-4 h-4" />
                Add Job
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-slate-900">
                  {addMode === "url" ? "Import from URL" :
                   addMode === "manual" ? "Enter Job Details" :
                   "Add Job Target"}
                </DialogTitle>
              </DialogHeader>
              {renderDialogContent()}
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        {jobs.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-white border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && jobs.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : filteredJobs.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-base font-medium text-slate-900 mb-1">
              {searchQuery ? "No matching jobs" : "No jobs yet"}
            </h3>
            <p className="text-slate-500 text-sm mb-5">
              {searchQuery 
                ? "Try a different search" 
                : "Add a job to start preparing"}
            </p>
          </div>
        ) : (
          /* Job Cards */
          <div className="space-y-2">
            {filteredJobs.map((job) => {
              return (
                <div
                  key={job.id}
                  className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors cursor-pointer"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 text-[15px] truncate">
                        {job.roleTitle}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                        {job.companyName && (
                          <span className="truncate">{job.companyName}</span>
                        )}
                        {job.companyName && job.location && (
                          <span className="text-slate-300">·</span>
                        )}
                        {job.location && (
                          <span className="truncate">{job.location}</span>
                        )}
                      </div>
                    </div>
                    
                    {job.readinessScore !== null && job.readinessScore > 0 && (
                      <div className="hidden sm:flex items-center gap-2 text-sm">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              job.readinessScore >= 70 ? 'bg-emerald-500' :
                              job.readinessScore >= 40 ? 'bg-amber-500' : 'bg-slate-400'
                            }`}
                            style={{ width: `${job.readinessScore}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 w-8">{job.readinessScore}%</span>
                      </div>
                    )}
                    
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SidebarLayout>
  );

  function renderDialogContent() {
    if (!addMode) {
      return (
        <div className="space-y-2 pt-2">
          <button
            onClick={() => setAddMode("url")}
            className="w-full p-3 border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Link2 className="w-4 h-4 text-slate-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Import from URL</p>
                <p className="text-xs text-slate-500">LinkedIn, Indeed, Glassdoor...</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => setAddMode("manual")}
            className="w-full p-3 border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ClipboardPaste className="w-4 h-4 text-slate-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Enter manually</p>
                <p className="text-xs text-slate-500">Type or paste job details</p>
              </div>
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
            className={`h-10 rounded-lg text-sm ${urlError ? "border-red-500" : ""}`}
          />
          {urlError && <p className="text-sm text-red-500">{urlError}</p>}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setAddMode(null)} className="flex-1 h-9 text-sm">
              Back
            </Button>
            <Button 
              onClick={handleParseUrl}
              disabled={isParsingUrl || !pastedUrl.trim()}
              className="flex-1 h-9 text-sm bg-slate-900 hover:bg-slate-800"
            >
              {isParsingUrl ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-3 pt-2">
        <Input
          value={newJob.roleTitle}
          onChange={(e) => setNewJob({ ...newJob, roleTitle: e.target.value })}
          placeholder="Role title *"
          className="h-10 rounded-lg text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={newJob.companyName}
            onChange={(e) => setNewJob({ ...newJob, companyName: e.target.value })}
            placeholder="Company"
            className="h-10 rounded-lg text-sm"
          />
          <Input
            value={newJob.location}
            onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
            placeholder="Location"
            className="h-10 rounded-lg text-sm"
          />
        </div>
        <textarea
          value={pastedJD}
          onChange={(e) => setPastedJD(e.target.value)}
          placeholder="Paste job description (optional)"
          className="w-full h-20 p-3 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-sm"
        />
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setAddMode(null)} className="flex-1 h-9 text-sm">
            Back
          </Button>
          <Button 
            onClick={handleAddJob}
            disabled={isSubmitting || !newJob.roleTitle.trim()}
            className="flex-1 h-9 text-sm bg-slate-900 hover:bg-slate-800"
          >
            {isSubmitting ? "Adding..." : "Add Job"}
          </Button>
        </div>
      </div>
    );
  }
}
