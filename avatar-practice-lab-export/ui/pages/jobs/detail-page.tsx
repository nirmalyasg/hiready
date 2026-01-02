import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Clock, ExternalLink, Target, Sparkles, Play, FileText, Code, BookOpen, CheckCircle2, AlertCircle, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SidebarLayout from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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
    companyContext?: string;
    redFlags?: string[];
    focusAreas?: string[];
    salaryRange?: string;
  } | null;
  status: string;
  readinessScore: number | null;
  lastPracticedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PracticeSuggestion {
  type: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: Record<string, unknown>;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  saved: { label: "Saved", color: "bg-gray-100 text-gray-700" },
  applied: { label: "Applied", color: "bg-blue-100 text-blue-700" },
  interview: { label: "Interviewing", color: "bg-purple-100 text-purple-700" },
  offer: { label: "Offer", color: "bg-green-100 text-green-700" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700" },
  archived: { label: "Archived", color: "bg-gray-50 text-gray-400" },
};

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobTarget | null>(null);
  const [suggestions, setSuggestions] = useState<PracticeSuggestion[]>([]);
  const [practiceHistory, setPracticeHistory] = useState<{ interviews: any[]; exercises: any[] }>({ interviews: [], exercises: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [jdExpanded, setJdExpanded] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      
      try {
        setIsLoading(true);
        const [jobRes, suggestionsRes] = await Promise.all([
          fetch(`/api/jobs/job-targets/${jobId}`),
          fetch(`/api/jobs/job-targets/${jobId}/practice-suggestions`),
        ]);
        
        const jobData = await jobRes.json();
        const suggestionsData = await suggestionsRes.json();
        
        if (jobData.success) {
          setJob(jobData.job);
          setPracticeHistory(jobData.practiceHistory || { interviews: [], exercises: [] });
        }
        
        if (suggestionsData.success) {
          setSuggestions(suggestionsData.suggestions);
        }
      } catch (error) {
        console.error("Error fetching job:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJob();
  }, [jobId]);

  const handleParseJD = async () => {
    if (!job?.id) return;
    
    try {
      setIsParsing(true);
      const response = await fetch(`/api/jobs/job-targets/${job.id}/parse-jd`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setJob(data.job);
        const suggestionsRes = await fetch(`/api/jobs/job-targets/${job.id}/practice-suggestions`);
        const suggestionsData = await suggestionsRes.json();
        if (suggestionsData.success) {
          setSuggestions(suggestionsData.suggestions);
        }
      }
    } catch (error) {
      console.error("Error parsing JD:", error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDelete = async () => {
    if (!job?.id || !confirm("Are you sure you want to delete this job target?")) return;
    
    try {
      const response = await fetch(`/api/jobs/job-targets/${job.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        navigate("/jobs");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  };

  const handleStartPractice = (suggestion: PracticeSuggestion) => {
    if (suggestion.action.type === "parse_jd") {
      handleParseJD();
    } else if (suggestion.action.type === "start_interview") {
      navigate(`/interview/config?jobTargetId=${job?.id}`);
    } else if (suggestion.action.type === "start_coding") {
      navigate(`/exercise-mode/coding-lab?jobTargetId=${job?.id}`);
    } else if (suggestion.action.type === "start_case") {
      navigate(`/exercise-mode/case-study?jobTargetId=${job?.id}`);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: "numeric",
    });
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

  if (!job) {
    return (
      <SidebarLayout>
        <div className="max-w-4xl mx-auto text-center py-20">
          <h2 className="text-xl font-semibold text-brand-dark mb-2">Job not found</h2>
          <Button onClick={() => navigate("/jobs")} variant="outline">
            Back to Jobs
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  const status = statusConfig[job.status] || statusConfig.saved;
  const parsed = job.jdParsed;

  return (
    <SidebarLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/jobs")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-brand-dark">{job.roleTitle}</h1>
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
                Added {formatDate(job.createdAt)}
              </span>
            </div>
          </div>
          
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${status.color}`}>
            {status.label}
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Job
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {suggestions.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-brand-dark mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-brand-accent" />
                  Recommended Practice
                </h2>
                <div className="space-y-3">
                  {suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          suggestion.priority === "high" ? "bg-brand-accent/10" : "bg-gray-100"
                        }`}>
                          {suggestion.type === "interview_practice" && <FileText className="w-5 h-5 text-brand-accent" />}
                          {suggestion.type === "coding_practice" && <Code className="w-5 h-5 text-blue-500" />}
                          {suggestion.type === "case_study" && <BookOpen className="w-5 h-5 text-purple-500" />}
                          {suggestion.type === "parse_jd" && <Sparkles className="w-5 h-5 text-brand-accent" />}
                        </div>
                        <div>
                          <h4 className="font-medium text-brand-dark">{suggestion.title}</h4>
                          <p className="text-sm text-brand-muted">{suggestion.description}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleStartPractice(suggestion)}
                        size="sm"
                        className={suggestion.type === "parse_jd" ? "bg-brand-accent hover:bg-brand-accent/90" : ""}
                        disabled={suggestion.type === "parse_jd" && isParsing}
                      >
                        {suggestion.type === "parse_jd" ? (
                          isParsing ? "Analyzing..." : "Analyze"
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-1" />
                            Start
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {parsed && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
                <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-accent" />
                  AI-Analyzed Requirements
                </h2>
                
                {parsed.experienceLevel && (
                  <div>
                    <h4 className="text-sm font-medium text-brand-muted mb-2">Experience Level</h4>
                    <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium capitalize">
                      {parsed.experienceLevel}
                    </span>
                  </div>
                )}

                {parsed.focusAreas && parsed.focusAreas.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-brand-muted mb-2">Focus Areas for Practice</h4>
                    <div className="flex flex-wrap gap-2">
                      {parsed.focusAreas.map((area, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-brand-accent/10 text-brand-accent rounded-full text-sm font-medium">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {parsed.requiredSkills && parsed.requiredSkills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-brand-muted mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {parsed.requiredSkills.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {parsed.preferredSkills && parsed.preferredSkills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-brand-muted mb-2">Preferred Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {parsed.preferredSkills.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {parsed.responsibilities && parsed.responsibilities.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-brand-muted mb-2">Key Responsibilities</h4>
                    <ul className="space-y-2">
                      {parsed.responsibilities.map((resp, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-brand-dark">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {resp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {parsed.redFlags && parsed.redFlags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-brand-muted mb-2">Things to Watch</h4>
                    <ul className="space-y-2">
                      {parsed.redFlags.map((flag, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-amber-700">
                          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {job.jdText && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-brand-dark">Job Description</h2>
                  {job.jobUrl && (
                    <a
                      href={job.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-brand-accent hover:underline flex items-center gap-1"
                    >
                      View Original
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <div className={`prose prose-sm max-w-none text-brand-muted ${!jdExpanded ? "line-clamp-6" : ""}`}>
                  <pre className="whitespace-pre-wrap font-sans text-sm">{job.jdText}</pre>
                </div>
                {job.jdText.length > 500 && (
                  <button
                    onClick={() => setJdExpanded(!jdExpanded)}
                    className="text-sm text-brand-accent hover:underline mt-3"
                  >
                    {jdExpanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {job.readinessScore !== null && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <h3 className="text-sm font-medium text-brand-muted mb-3">Interview Readiness</h3>
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-100"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(job.readinessScore / 100) * 352} 352`}
                      className="text-brand-accent"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-3xl font-bold text-brand-dark">
                    {job.readinessScore}%
                  </span>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-sm font-medium text-brand-muted mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  onClick={() => navigate(`/interview/config?jobTargetId=${job.id}`)}
                  className="w-full justify-start gap-2 bg-brand-dark hover:bg-brand-dark/90"
                >
                  <FileText className="w-4 h-4" />
                  Practice Interview
                </Button>
                <Button
                  onClick={() => navigate(`/exercise-mode/case-study?jobTargetId=${job.id}`)}
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Case Study
                </Button>
                <Button
                  onClick={() => navigate(`/exercise-mode/coding-lab?jobTargetId=${job.id}`)}
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <Code className="w-4 h-4" />
                  Coding Lab
                </Button>
              </div>
            </div>

            {(practiceHistory.interviews.length > 0 || practiceHistory.exercises.length > 0) && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-sm font-medium text-brand-muted mb-4">Practice History</h3>
                <div className="space-y-3">
                  {practiceHistory.interviews.slice(0, 3).map((session: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-brand-dark">Interview Practice</p>
                        <p className="text-xs text-brand-muted">{formatDate(session.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                  {practiceHistory.exercises.slice(0, 3).map((session: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Code className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-brand-dark">{session.exerciseType === "coding_lab" ? "Coding Lab" : "Case Study"}</p>
                        <p className="text-xs text-brand-muted">{formatDate(session.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
