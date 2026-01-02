import { useState, useEffect } from "react";
import { ChevronDown, Briefcase, Building2, MapPin, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobTarget {
  id: string;
  roleTitle: string;
  companyName: string | null;
  location: string | null;
  status: string;
}

interface JobTargetSelectorProps {
  value: string | null;
  onChange: (jobTargetId: string | null, jobTarget: JobTarget | null) => void;
  className?: string;
}

export function JobTargetSelector({ value, onChange, className = "" }: JobTargetSelectorProps) {
  const [jobs, setJobs] = useState<JobTarget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobTarget | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch("/api/jobs/job-targets?status=all&limit=50");
        const data = await response.json();
        if (data.success) {
          const activeJobs = data.jobs.filter((j: JobTarget) => 
            j.status !== "archived" && j.status !== "rejected"
          );
          setJobs(activeJobs);
          
          if (value) {
            const job = activeJobs.find((j: JobTarget) => j.id === value);
            if (job) setSelectedJob(job);
          }
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, [value]);

  const handleSelect = (job: JobTarget | null) => {
    setSelectedJob(job);
    onChange(job?.id || null, job);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-slate-100 rounded-xl h-14 ${className}`} />
    );
  }

  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
          selectedJob 
            ? "bg-[#ee7e65]/5 border-[#ee7e65]/30 hover:border-[#ee7e65]/50" 
            : "bg-white border-slate-200 hover:border-slate-300"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            selectedJob ? "bg-[#ee7e65]/10" : "bg-slate-100"
          }`}>
            <Briefcase className={`w-5 h-5 ${selectedJob ? "text-[#ee7e65]" : "text-slate-400"}`} />
          </div>
          <div className="text-left">
            {selectedJob ? (
              <>
                <p className="font-medium text-slate-900">{selectedJob.roleTitle}</p>
                <p className="text-xs text-slate-500">
                  {selectedJob.companyName || "Company not specified"}
                  {selectedJob.location && ` · ${selectedJob.location}`}
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-slate-600">Link to a saved job (optional)</p>
                <p className="text-xs text-slate-400">Practice will count toward job readiness</p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedJob && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(null);
              }}
              className="p-1 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-lg max-h-64 overflow-y-auto">
            <div className="p-2">
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  !selectedJob ? "bg-slate-100" : "hover:bg-slate-50"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </div>
                <span className="text-sm text-slate-600">No job selected (general practice)</span>
                {!selectedJob && <Check className="w-4 h-4 text-[#ee7e65] ml-auto" />}
              </button>
              
              {jobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => handleSelect(job)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    selectedJob?.id === job.id ? "bg-[#ee7e65]/5" : "hover:bg-slate-50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedJob?.id === job.id ? "bg-[#ee7e65]/10" : "bg-slate-100"
                  }`}>
                    <Briefcase className={`w-4 h-4 ${
                      selectedJob?.id === job.id ? "text-[#ee7e65]" : "text-slate-400"
                    }`} />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{job.roleTitle}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {job.companyName || "Company not specified"}
                    </p>
                  </div>
                  {selectedJob?.id === job.id && (
                    <Check className="w-4 h-4 text-[#ee7e65] flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
