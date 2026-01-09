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
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#042c4c]">
            Job Targets
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            Track and prepare for your dream roles
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by role, company, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white border-slate-200 rounded-xl"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && jobs.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : filteredJobs.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-slate-100 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-[#042c4c] mb-2">
              {searchQuery ? "No matching jobs" : "No jobs saved yet"}
            </h3>
            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
              {searchQuery 
                ? "Try adjusting your search" 
                : "Add jobs you're targeting to track your preparation progress"}
            </p>
            {!searchQuery && (
              <Dialog open={addDialogOpen} onOpenChange={(open) => { 
                setAddDialogOpen(open); 
                if (!open) resetDialog();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-[#ee7e65] hover:bg-[#e06a50] text-white rounded-xl">
                    <Plus className="w-4 h-4" />
                    Add Your First Job
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
            )}
          </div>
        ) : (
          /* Job Cards */
          <div className="space-y-3">
            {filteredJobs.map((job) => {
              const status = statusConfig[job.status];
              
              return (
                <div
                  key={job.id}
                  className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  {/* Mobile Layout */}
                  <div className="sm:hidden">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#042c4c] text-base leading-tight mb-1 line-clamp-2">
                          {job.roleTitle}
                        </h3>
                        {job.companyName && (
                          <p className="text-slate-500 text-sm flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{job.companyName}</span>
                          </p>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color} border ${status.borderColor} whitespace-nowrap`}>
                        {status.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(job.createdAt)}
                      </span>
                    </div>

                    {/* Mobile Readiness + Action */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      {job.readinessScore !== null && job.readinessScore > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                job.readinessScore >= 70 ? 'bg-green-500' :
                                job.readinessScore >= 40 ? 'bg-amber-500' : 'bg-[#ee7e65]'
                              }`}
                              style={{ width: `${job.readinessScore}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-600">{job.readinessScore}% ready</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No practice yet</span>
                      )}
                      <Button
                        size="sm"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          navigate(`/jobs/${job.id}`);
                        }}
                        className="h-8 px-3 gap-1.5 bg-[#ee7e65] hover:bg-[#e06a50] text-white rounded-lg text-xs"
                      >
                        <Play className="w-3 h-3" />
                        Practice
                      </Button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-[#042c4c] text-lg group-hover:text-[#ee7e65] transition-colors truncate">
                            {job.roleTitle}
                          </h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color} border ${status.borderColor}`}>
                            {status.label}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
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
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            Added {formatDate(job.createdAt)}
                          </span>
                        </div>

                        {/* Focus areas tags */}
                        {job.jdParsed?.focusAreas && job.jdParsed.focusAreas.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {job.jdParsed.focusAreas.slice(0, 3).map((area, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md text-xs font-medium"
                              >
                                {area}
                              </span>
                            ))}
                            {job.jdParsed.focusAreas.length > 3 && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-xs">
                                +{job.jdParsed.focusAreas.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right side: Readiness + Actions */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {job.readinessScore !== null && job.readinessScore > 0 && (
                          <div className="text-center">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    job.readinessScore >= 70 ? 'bg-green-500' :
                                    job.readinessScore >= 40 ? 'bg-amber-500' : 'bg-[#ee7e65]'
                                  }`}
                                  style={{ width: `${job.readinessScore}%` }}
                                />
                              </div>
                              <span className="text-lg font-bold text-[#042c4c]">{job.readinessScore}%</span>
                            </div>
                            <p className="text-xs text-slate-400">Ready</p>
                          </div>
                        )}
                        
                        <Button
                          size="sm"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            navigate(`/jobs/${job.id}`);
                          }}
                          className="gap-1.5 bg-[#ee7e65] hover:bg-[#e06a50] text-white rounded-lg"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Practice
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(job.id, "applied")}>
                              Mark as Applied
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(job.id, "interview")}>
                              Mark as Interviewing
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(job.id, "offer")}>
                              Mark as Offer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(job.id, "rejected")}>
                              Mark as Rejected
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(job.id, "archived")}>
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#ee7e65] transition-colors" />
                      </div>
                    </div>

                    {/* Practice stats */}
                    {job.practiceStats && job.practiceStats.totalSessions > 0 && (
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span className="font-medium text-[#042c4c]">{job.practiceStats.totalSessions}</span> sessions
                        </span>
                        {job.lastPracticedAt && (
                          <span className="text-slate-400">
                            Last practiced {formatDate(job.lastPracticedAt)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Add Button */}
        <Dialog open={addDialogOpen} onOpenChange={(open) => { 
          setAddDialogOpen(open); 
          if (!open) resetDialog();
        }}>
          <DialogTrigger asChild>
            <button className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 w-14 h-14 bg-[#ee7e65] hover:bg-[#e06a50] text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40">
              <Plus className="w-6 h-6" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md mx-4 rounded-2xl">
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
    </SidebarLayout>
  );

  function renderDialogContent() {
    if (!addMode) {
      return (
        <div className="space-y-3 pt-2">
          <p className="text-sm text-slate-500">
            How would you like to add a job?
          </p>
          <button
            onClick={() => setAddMode("url")}
            className="w-full p-4 border border-slate-200 rounded-xl text-left hover:border-[#ee7e65] hover:bg-[#ee7e65]/5 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Link2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#042c4c] group-hover:text-[#ee7e65]">
                  Import from URL
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  LinkedIn, Indeed, Glassdoor, Naukri...
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#ee7e65]" />
            </div>
          </button>
          <button
            onClick={() => setAddMode("manual")}
            className="w-full p-4 border border-slate-200 rounded-xl text-left hover:border-[#ee7e65] hover:bg-[#ee7e65]/5 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <ClipboardPaste className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#042c4c] group-hover:text-[#ee7e65]">
                  Enter Manually
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Type or paste job details
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#ee7e65]" />
            </div>
          </button>
        </div>
      );
    }
    
    if (addMode === "url") {
      return (
        <div className="space-y-4 pt-2">
          <p className="text-sm text-slate-500">
            Paste a job URL and we'll extract the details
          </p>
          <Input
            value={pastedUrl}
            onChange={(e) => { setPastedUrl(e.target.value); setUrlError(""); }}
            placeholder="https://linkedin.com/jobs/..."
            className={`rounded-xl ${urlError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
          />
          {urlError && (
            <p className="text-sm text-red-500">{urlError}</p>
          )}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="ghost" 
              onClick={() => setAddMode(null)}
              className="flex-1"
            >
              Back
            </Button>
            <Button 
              onClick={handleParseUrl}
              disabled={isParsingUrl || !pastedUrl.trim()}
              className="flex-1 gap-2 bg-[#ee7e65] hover:bg-[#e06a50]"
            >
              {isParsingUrl ? (
                <>
                  <LoadingSpinner className="w-4 h-4" />
                  Importing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Import
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-4 pt-2">
        <div>
          <label className="text-sm font-medium text-[#042c4c] mb-1.5 block">
            Role Title <span className="text-red-500">*</span>
          </label>
          <Input
            value={newJob.roleTitle}
            onChange={(e) => setNewJob({ ...newJob, roleTitle: e.target.value })}
            placeholder="e.g., Senior Product Manager"
            className="rounded-xl"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-[#042c4c] mb-1.5 block">
              Company
            </label>
            <Input
              value={newJob.companyName}
              onChange={(e) => setNewJob({ ...newJob, companyName: e.target.value })}
              placeholder="e.g., Google"
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#042c4c] mb-1.5 block">
              Location
            </label>
            <Input
              value={newJob.location}
              onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
              placeholder="e.g., Remote"
              className="rounded-xl"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-[#042c4c] mb-1.5 block">
            Job Description <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={pastedJD}
            onChange={(e) => setPastedJD(e.target.value)}
            placeholder="Paste the full job description for better practice questions..."
            className="w-full h-24 p-3 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-[#ee7e65] focus:border-[#ee7e65] text-sm"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button 
            variant="ghost" 
            onClick={() => setAddMode(null)}
            className="flex-1"
          >
            Back
          </Button>
          <Button 
            onClick={handleAddJob}
            disabled={isSubmitting || !newJob.roleTitle.trim()}
            className="flex-1 bg-[#042c4c] hover:bg-[#042c4c]/90"
          >
            {isSubmitting ? "Adding..." : "Add Job"}
          </Button>
        </div>
      </div>
    );
  }
}
