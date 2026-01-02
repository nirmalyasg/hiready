import { useState, useEffect } from "react";
import { Search, Plus, Briefcase, Building2, MapPin, Clock, ChevronRight, MoreVertical, Target, CheckCircle2, XCircle, Archive, Filter, ClipboardPaste, Sparkles, Link2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
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
  practiceStats?: {
    totalSessions: number;
    interviewSessions: number;
    exerciseSessions: number;
    avgScore: number | null;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: any; bgColor: string }> = {
  saved: { label: "Saved", color: "text-gray-600", icon: Target, bgColor: "bg-gray-100" },
  applied: { label: "Applied", color: "text-blue-600", icon: Clock, bgColor: "bg-blue-100" },
  interview: { label: "Interviewing", color: "text-purple-600", icon: Briefcase, bgColor: "bg-purple-100" },
  offer: { label: "Offer", color: "text-green-600", icon: CheckCircle2, bgColor: "bg-green-100" },
  rejected: { label: "Rejected", color: "text-red-600", icon: XCircle, bgColor: "bg-red-100" },
  archived: { label: "Archived", color: "text-gray-400", icon: Archive, bgColor: "bg-gray-50" },
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobTarget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      
      const response = await fetch(`/api/jobs/job-targets?${params}`);
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
  }, [statusFilter]);

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

  const handlePasteJD = async () => {
    if (!pastedJD.trim() || pastedJD.length < 50) return;
    
    try {
      setIsParsing(true);
      const response = await fetch("/api/jobs/job-targets/parse-paste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pastedText: pastedJD }),
      });
      const data = await response.json();
      if (data.success) {
        setJobs([data.job, ...jobs]);
        setPastedJD("");
        setAddDialogOpen(false);
        navigate(`/jobs/${data.job.id}`);
      }
    } catch (error) {
      console.error("Error parsing JD:", error);
    } finally {
      setIsParsing(false);
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
      if (data.success) {
        setJobs([data.job, ...jobs]);
        setPastedUrl("");
        setAddDialogOpen(false);
        navigate(`/jobs/${data.job.id}`);
      } else {
        setUrlError(data.error || "Failed to parse the job URL");
      }
    } catch (error) {
      console.error("Error parsing URL:", error);
      setUrlError("Failed to connect. Please try again.");
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
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <SidebarLayout>
      {isLoading && jobs.length === 0 ? (
        <div className="flex justify-center items-center h-[60vh]">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-accent/10 rounded-full text-brand-accent text-sm font-medium mb-3">
                <Target className="w-4 h-4" />
                Career Goals
              </div>
              <h1 className="text-3xl font-bold text-brand-dark">
                Your Job Targets
              </h1>
              <p className="text-brand-muted mt-2 max-w-xl">
                Save jobs you're preparing for and track your interview readiness.
              </p>
            </div>

            <Dialog open={addDialogOpen} onOpenChange={(open) => { 
              setAddDialogOpen(open); 
              if (!open) { 
                setAddMode(null); 
                setUrlError(""); 
                setPastedUrl(""); 
                setPastedJD("");
                setNewJob({ roleTitle: "", companyName: "", location: "" });
              } 
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-brand-dark hover:bg-brand-dark/90">
                  <Plus className="w-4 h-4" />
                  Add Job
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {addMode === "url" ? "Import from URL" :
                     addMode === "manual" ? "Enter Job Details" :
                     "Add New Job"}
                  </DialogTitle>
                </DialogHeader>
                
                {!addMode ? (
                  <div className="space-y-3 pt-4">
                    <p className="text-sm text-brand-muted mb-4">
                      Choose how you'd like to add a job:
                    </p>
                    <button
                      onClick={() => setAddMode("url")}
                      className="w-full p-4 border rounded-xl text-left hover:border-brand-accent hover:bg-brand-accent/5 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Link2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-brand-dark group-hover:text-brand-accent">
                            Import from URL
                          </div>
                          <div className="text-sm text-brand-muted">
                            Paste any job link (LinkedIn, Indeed, Glassdoor, Naukri, etc.)
                          </div>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => setAddMode("manual")}
                      className="w-full p-4 border rounded-xl text-left hover:border-brand-accent hover:bg-brand-accent/5 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Plus className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-brand-dark group-hover:text-brand-accent">
                            Enter Manually
                          </div>
                          <div className="text-sm text-brand-muted">
                            Type job title, company, location, and description
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                ) : addMode === "url" ? (
                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-brand-muted">
                      Paste a job URL and we'll extract all the details automatically.
                    </p>
                    <Input
                      value={pastedUrl}
                      onChange={(e) => { setPastedUrl(e.target.value); setUrlError(""); }}
                      placeholder="https://linkedin.com/jobs/... or https://indeed.com/..."
                      className={urlError ? "border-red-500" : ""}
                    />
                    {urlError && (
                      <p className="text-sm text-red-500">{urlError}</p>
                    )}
                    <div className="text-xs text-brand-muted bg-gray-50 p-3 rounded-lg">
                      <strong>Supported:</strong> LinkedIn, Indeed, Glassdoor, Naukri, Monster, and more
                    </div>
                    <div className="flex justify-between gap-3">
                      <Button variant="ghost" onClick={() => setAddMode(null)}>
                        Back
                      </Button>
                      <Button 
                        onClick={handleParseUrl}
                        disabled={isParsingUrl || !pastedUrl.trim()}
                        className="gap-2 bg-brand-accent hover:bg-brand-accent/90"
                      >
                        {isParsingUrl ? (
                          <>
                            <LoadingSpinner className="w-4 h-4" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Import Job
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-brand-dark mb-1.5 block">
                          Role Title *
                        </label>
                        <Input
                          value={newJob.roleTitle}
                          onChange={(e) => setNewJob({ ...newJob, roleTitle: e.target.value })}
                          placeholder="e.g. Senior Product Manager"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-brand-dark mb-1.5 block">
                          Company
                        </label>
                        <Input
                          value={newJob.companyName}
                          onChange={(e) => setNewJob({ ...newJob, companyName: e.target.value })}
                          placeholder="e.g. Google"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-brand-dark mb-1.5 block">
                          Location
                        </label>
                        <Input
                          value={newJob.location}
                          onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                          placeholder="e.g. Remote, NYC"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-brand-dark mb-1.5 block">
                        Job Description
                      </label>
                      <textarea
                        value={pastedJD}
                        onChange={(e) => setPastedJD(e.target.value)}
                        placeholder="Paste the full job description here (optional, helps with practice focus)..."
                        className="w-full h-32 p-3 border rounded-xl resize-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-sm"
                      />
                    </div>
                    <div className="flex justify-between gap-3 pt-2">
                      <Button variant="ghost" onClick={() => setAddMode(null)}>
                        Back
                      </Button>
                      <Button 
                        onClick={handleAddJob}
                        disabled={isSubmitting || !newJob.roleTitle.trim()}
                        className="bg-brand-dark hover:bg-brand-dark/90"
                      >
                        {isSubmitting ? "Adding..." : "Add Job"}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
              <Input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 bg-white"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {["all", "saved", "applied", "interview", "offer"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    statusFilter === status
                      ? "bg-brand-dark text-white"
                      : "bg-white border border-gray-200 text-brand-dark hover:border-gray-300"
                  }`}
                >
                  {status === "all" ? "All" : statusConfig[status]?.label}
                </button>
              ))}
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-brand-dark mb-2">
                {searchQuery || statusFilter !== "all" ? "No matching jobs" : "No jobs saved yet"}
              </h3>
              <p className="text-brand-muted mb-6 max-w-sm mx-auto">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Add jobs you're preparing for to track your progress and get personalized practice recommendations."}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button 
                  onClick={() => setAddDialogOpen(true)}
                  className="gap-2 bg-brand-dark hover:bg-brand-dark/90"
                >
                  <Plus className="w-4 h-4" />
                  Add Job
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => {
                const status = statusConfig[job.status];
                const StatusIcon = status.icon;
                
                return (
                  <div
                    key={job.id}
                    className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all group cursor-pointer"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${status.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <StatusIcon className={`w-6 h-6 ${status.color}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-brand-dark text-lg group-hover:text-brand-accent transition-colors">
                              {job.roleTitle}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-brand-muted">
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
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDate(job.createdAt)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {job.readinessScore !== null && job.readinessScore > 0 && (
                              <div className="hidden sm:flex items-center gap-3">
                                <div className="w-24">
                                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all ${
                                        job.readinessScore >= 70 ? 'bg-green-500' :
                                        job.readinessScore >= 40 ? 'bg-amber-500' : 'bg-brand-accent'
                                      }`}
                                      style={{ width: `${job.readinessScore}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-brand-dark">
                                    {job.readinessScore}%
                                  </div>
                                  <div className="text-xs text-brand-muted">Ready</div>
                                </div>
                              </div>
                            )}
                            
                            <Button
                              size="sm"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                navigate(`/interview/custom?jobTargetId=${job.id}`);
                              }}
                              className="gap-1.5 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-lg hidden sm:flex"
                            >
                              <Play className="w-3.5 h-3.5" />
                              Practice
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                <DropdownMenuItem 
                                  onClick={() => navigate(`/interview/custom?jobTargetId=${job.id}`)}
                                  className="sm:hidden"
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Practice Interview
                                </DropdownMenuItem>
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
                            
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand-accent transition-colors" />
                          </div>
                        </div>
                        
                        {job.practiceStats && job.practiceStats.totalSessions > 0 && (
                          <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
                            <span className="text-sm text-brand-muted">
                              <span className="font-medium text-brand-dark">{job.practiceStats.totalSessions}</span> practice sessions
                            </span>
                            {job.lastPracticedAt && (
                              <span className="text-sm text-brand-muted">
                                Last practiced {formatDate(job.lastPracticedAt)}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {job.jdParsed?.focusAreas && job.jdParsed.focusAreas.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {job.jdParsed.focusAreas.slice(0, 3).map((area, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium"
                              >
                                {area}
                              </span>
                            ))}
                            {job.jdParsed.focusAreas.length > 3 && (
                              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                +{job.jdParsed.focusAreas.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </SidebarLayout>
  );
}
