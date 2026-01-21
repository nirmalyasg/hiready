import { useState, useEffect } from "react";
import { 
  Briefcase, Building2, Target, ChevronRight, Plus, Link2, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface RoleKit {
  id: number;
  name: string;
  level: string;
  domain: string;
  description: string | null;
}

interface JobTarget {
  id: string;
  roleTitle: string;
  companyName: string | null;
  location: string | null;
  status: string;
  source?: string;
}

interface EntitledJob {
  id: number;
  name: string;
  description: string | null;
  interviewTypes: string[];
  companyName: string | null;
  claimedAt: string;
  employerJobId: number | null;
  jobTitle: string | null;
  interviewPlan: any;
  jobTargetId: string | null;
}

const domainColors: Record<string, string> = {
  software: "bg-slate-900",
  data: "bg-[#cb6ce6]",
  product: "bg-[#24c4b8]",
  design: "bg-gray-500",
  sales: "bg-[#24c4b8]",
  marketing: "bg-slate-900",
  customer_success: "bg-[#cb6ce6]",
  operations: "bg-gray-500",
  consulting: "bg-slate-900",
  finance: "bg-[#cb6ce6]",
  hr: "bg-[#24c4b8]",
  recruiting: "bg-gray-500",
  engineering_management: "bg-slate-900",
};

const formatDomain = (domain: string) => {
  return domain.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function InterviewPracticePage() {
  const navigate = useNavigate();
  const [jobInput, setJobInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [savedJobs, setSavedJobs] = useState<JobTarget[]>([]);
  const [roleKits, setRoleKits] = useState<RoleKit[]>([]);
  const [entitledJobs, setEntitledJobs] = useState<EntitledJob[]>([]);
  const [hasEntitledJobsOnly, setHasEntitledJobsOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [jobsRes, rolesRes, entitledRes] = await Promise.all([
          fetch("/api/jobs"),
          fetch("/api/interview/role-kits"),
          fetch("/api/monetization/my-job-targets")
        ]);

        let userSavedJobs: JobTarget[] = [];
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          if (jobsData.success) {
            userSavedJobs = jobsData.jobs.filter((j: JobTarget) => j.status !== "archived").slice(0, 4);
            setSavedJobs(userSavedJobs);
          }
        }

        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          if (rolesData.success) {
            setRoleKits(rolesData.roleKits.slice(0, 6));
          }
        }

        if (entitledRes.ok) {
          const entitledData = await entitledRes.json();
          if (entitledData.success && entitledData.jobTargets?.length > 0) {
            // Store entitled jobs for legacy support, but don't auto-redirect
            // since claimed jobs now appear in regular job targets with source='company'
            setEntitledJobs(entitledData.jobTargets);
            // Only show entitled-only mode if there are no saved jobs AND no company-sourced jobs
            const hasCompanyJobs = userSavedJobs.some((j: JobTarget) => j.source === 'company');
            if (userSavedJobs.length === 0 && !hasCompanyJobs) {
              setHasEntitledJobsOnly(true);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const isUrl = (text: string) => {
    const trimmed = text.trim();
    return trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.includes("linkedin.com") || trimmed.includes("indeed.com");
  };

  const handleAddJob = async () => {
    const trimmed = jobInput.trim();
    if (!trimmed) return;
    
    setIsAdding(true);
    setError(null);
    
    try {
      if (isUrl(trimmed)) {
        const response = await fetch("/api/jobs/job-targets/parse-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmed }),
        });
        const data = await response.json();
        
        if (data.error === "IMPORT_BLOCKED") {
          setError(data.message || "This site requires login. Please paste the job description instead.");
          return;
        }
        if (data.success && data.duplicate && data.existingJobId) {
          navigate(`/jobs/${data.existingJobId}`);
          return;
        }
        if (!data.success) throw new Error(data.error || data.message);
        navigate(`/jobs/${data.job.id}`);
      } else {
        const response = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleTitle: "New Job", jdText: trimmed, source: "manual" }),
        });
        const data = await response.json();
        
        if (data.success && data.duplicate && data.existingJobId) {
          navigate(`/jobs/${data.existingJobId}`);
          return;
        }
        if (!data.success) throw new Error(data.error);
        navigate(`/jobs/${data.job.id}`);
      }
    } catch (e: any) {
      setError(e.message || "Failed to add job. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSelectJob = (job: JobTarget) => {
    navigate(`/jobs/${job.id}`);
  };

  const handleSelectRole = (kit: RoleKit) => {
    navigate(`/interview/role/${kit.id}`);
  };

  const trimmedInput = jobInput.trim();
  const hasInput = trimmedInput.length > 0;

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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">

          {/* Entitled Jobs Section - Shows for users who came via invite link */}
          {entitledJobs.length > 0 && (
            <section className="mb-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  {hasEntitledJobsOnly ? "Your Assigned Jobs" : "Assigned Jobs"}
                </h2>
                <p className="text-slate-600 text-sm">
                  {hasEntitledJobsOnly
                    ? "Start practicing for your assigned interviews"
                    : "Jobs assigned to you by employers"}
                </p>
              </div>

              <div className="space-y-3">
                {entitledJobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => {
                      if (job.jobTargetId) {
                        navigate(`/jobs/${job.jobTargetId}`);
                      } else if (job.employerJobId) {
                        navigate(`/interview/pre-session?employerJobId=${job.employerJobId}`);
                      } else {
                        navigate(`/interview/role/${job.id}`);
                      }
                    }}
                    className="w-full bg-white rounded-xl border border-slate-200 p-4 text-left hover:border-[#24c4b8] hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-[#24c4b8]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-5 h-5 text-[#24c4b8]" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 text-base group-hover:text-[#24c4b8] transition-colors truncate">
                            {job.jobTitle || job.name}
                          </h3>
                          {job.companyName && (
                            <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-0.5">
                              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{job.companyName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#24c4b8] group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
          
          {/* Section 1: Add Job Input - Hidden if user only has entitled jobs */}
          {!hasEntitledJobsOnly && (
          <section>
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                Add a Job to Practice For
              </h1>
              <p className="text-slate-600 text-sm sm:text-base">
                Paste a job description or URL to get started
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
              <Textarea
                placeholder="Paste a job description or LinkedIn/Indeed URL..."
                value={jobInput}
                onChange={(e) => { setJobInput(e.target.value); setError(null); }}
                className="min-h-[100px] resize-none border-slate-200 focus:border-[#24c4b8] focus:ring-[#24c4b8]/20 text-base text-slate-700 placeholder:text-slate-400 rounded-lg"
              />
              
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}
              
              <div className="mt-4">
                <Button
                  onClick={handleAddJob}
                  disabled={!hasInput || isAdding}
                  className={`w-full h-12 rounded-xl text-base font-semibold transition-all ${
                    hasInput
                      ? "bg-[#24c4b8] hover:bg-[#1db0a5] text-white"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isUrl(trimmedInput) ? "Importing..." : "Processing..."}
                    </>
                  ) : (
                    <>
                      {isUrl(trimmedInput) ? (
                        <>
                          <Link2 className="w-4 h-4 mr-2" />
                          Import Job from URL
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Job
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </section>
          )}

          {/* Divider - Hidden if user only has entitled jobs */}
          {!hasEntitledJobsOnly && (
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          )}

          {/* Section 2: Target Jobs - Hidden if user only has entitled jobs */}
          {!hasEntitledJobsOnly && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Your Jobs</h2>
                <p className="text-sm text-slate-600">Practice for specific positions</p>
              </div>
              <button
                onClick={() => navigate("/jobs")}
                className="text-sm text-[#24c4b8] font-medium hover:underline"
              >
                View All →
              </button>
            </div>

            {savedJobs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {savedJobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className="group text-left bg-white border border-slate-200 rounded-xl p-3 hover:border-[#24c4b8] hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#24c4b8]/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-[#24c4b8]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-slate-900 truncate group-hover:text-[#24c4b8] text-sm">
                            {job.roleTitle}
                          </h3>
                          {job.source === 'company' && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 rounded">
                              Invited
                            </span>
                          )}
                        </div>
                        {job.companyName && (
                          <p className="text-xs text-slate-500 truncate">{job.companyName}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#24c4b8] flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-white rounded-xl border border-slate-200">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No target jobs yet</p>
                <p className="text-xs text-slate-400 mt-1">Add one above to start practicing</p>
              </div>
            )}
          </section>
          )}

          {/* Section 3: Role Library - Hidden if user only has entitled jobs */}
          {!hasEntitledJobsOnly && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Practice by Role</h2>
                <p className="text-sm text-slate-600">General interview templates</p>
              </div>
              <button
                onClick={() => navigate("/interview/roles")}
                className="text-sm text-slate-600 font-medium hover:underline"
              >
                View All →
              </button>
            </div>

            {roleKits.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {roleKits.map((kit) => {
                  const bgColor = domainColors[kit.domain] || "bg-slate-500";
                  return (
                    <button
                      key={kit.id}
                      onClick={() => handleSelectRole(kit)}
                      className="group text-left bg-white border border-slate-200 rounded-xl p-3 hover:border-slate-400 hover:shadow-md transition-all"
                    >
                      <div className={`w-8 h-8 ${bgColor} rounded-lg flex items-center justify-center mb-2`}>
                        <Briefcase className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-medium text-slate-900 text-sm truncate group-hover:text-slate-700">
                        {kit.name}
                      </h3>
                      <p className="text-xs text-slate-400">{formatDomain(kit.domain)}</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-xl border border-slate-200">
                <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No role templates available</p>
              </div>
            )}
          </section>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
