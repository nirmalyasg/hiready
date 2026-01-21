import { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Building2,
  Clock,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  Filter,
  Bookmark,
  BookmarkCheck,
  Eye,
  EyeOff,
  ExternalLink,
  Target,
  DollarSign,
  Laptop,
  Bot,
  X,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useSearchParams } from "react-router-dom";
import SidebarLayout from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface JobCatalogEntry {
  id: string;
  source: string;
  externalId: string | null;
  sourceUrl: string | null;
  roleTitle: string;
  companyName: string | null;
  companyLogoUrl: string | null;
  companySize: string | null;
  companyIndustry: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
  isRemote: boolean;
  jobDescription: string | null;
  experienceRequired: string | null;
  experienceYearsMin: number | null;
  experienceYearsMax: number | null;
  employmentType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  requiredSkills: string[] | null;
  postedAt: string | null;
  discoveredAt: string;
  userInteraction?: {
    isSaved: boolean;
    isHidden: boolean;
    jobTargetId: string | null;
    viewedAt: string | null;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const employmentTypeOptions = [
  { value: "", label: "All Types" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
];

export default function JobCatalogPage() {
  const [jobs, setJobs] = useState<JobCatalogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobCatalogEntry | null>(null);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [locationFilter, setLocationFilter] = useState(searchParams.get("location") || "");
  const [experienceMin, setExperienceMin] = useState(searchParams.get("expMin") || "");
  const [experienceMax, setExperienceMax] = useState(searchParams.get("expMax") || "");
  const [employmentType, setEmploymentType] = useState(searchParams.get("type") || "");
  const [remoteOnly, setRemoteOnly] = useState(searchParams.get("remote") === "true");
  const [showFilters, setShowFilters] = useState(false);

  const fetchJobs = async (page = 1) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "20");

      if (searchQuery) params.append("search", searchQuery);
      if (locationFilter) params.append("location", locationFilter);
      if (experienceMin) params.append("experienceMin", experienceMin);
      if (experienceMax) params.append("experienceMax", experienceMax);
      if (employmentType) params.append("employmentType", employmentType);
      if (remoteOnly) params.append("remote", "true");

      const response = await fetch(`/api/job-screening/catalog?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setJobs(data.jobs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(1);
  }, [searchQuery, locationFilter, experienceMin, experienceMax, employmentType, remoteOnly]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(1);
  };

  const handleSaveToTargets = async (job: JobCatalogEntry) => {
    try {
      setSavingJobId(job.id);
      const response = await fetch(`/api/job-screening/catalog/${job.id}/save-to-targets`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        // Update local state
        setJobs(
          jobs.map((j) =>
            j.id === job.id
              ? {
                  ...j,
                  userInteraction: {
                    ...j.userInteraction,
                    isSaved: true,
                    jobTargetId: data.jobTarget.id,
                    viewedAt: j.userInteraction?.viewedAt || null,
                    isHidden: j.userInteraction?.isHidden || false,
                  },
                }
              : j
          )
        );

        // Update selected job if open
        if (selectedJob?.id === job.id) {
          setSelectedJob({
            ...selectedJob,
            userInteraction: {
              ...selectedJob.userInteraction,
              isSaved: true,
              jobTargetId: data.jobTarget.id,
              viewedAt: selectedJob.userInteraction?.viewedAt || null,
              isHidden: selectedJob.userInteraction?.isHidden || false,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error saving job:", error);
    } finally {
      setSavingJobId(null);
    }
  };

  const handleHideJob = async (jobId: string) => {
    try {
      await fetch(`/api/job-screening/catalog/${jobId}/hide`, { method: "POST" });
      setJobs(jobs.filter((j) => j.id !== jobId));
      if (selectedJob?.id === jobId) {
        setSelectedJob(null);
      }
    } catch (error) {
      console.error("Error hiding job:", error);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Unknown";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays < 1) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const formatSalary = (min: number | null, max: number | null, currency: string | null) => {
    if (!min && !max) return null;
    const curr = currency || "USD";
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr.includes("/") ? "USD" : curr,
      maximumFractionDigits: 0,
    });

    if (min && max) {
      return `${formatter.format(min)} - ${formatter.format(max)}`;
    }
    if (min) return `${formatter.format(min)}+`;
    if (max) return `Up to ${formatter.format(max)}`;
    return null;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setLocationFilter("");
    setExperienceMin("");
    setExperienceMax("");
    setEmploymentType("");
    setRemoteOnly(false);
  };

  const hasActiveFilters =
    searchQuery || locationFilter || experienceMin || experienceMax || employmentType || remoteOnly;

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#fbfbfc]">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#000000] via-[#1a0a2e] to-[#000000] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-[#24c4b8] rounded-lg flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[#24c4b8] text-sm font-semibold uppercase tracking-wide">
                    Discover
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold">Job Catalog</h1>
                <p className="text-white/70 mt-2 text-sm sm:text-base">
                  Browse jobs discovered by your screening agents
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{pagination.total}</p>
                  <p className="text-white/60 text-xs">Total Jobs</p>
                </div>
                <div className="text-center border-l border-white/20 pl-4">
                  <p className="text-2xl font-bold text-[#24c4b8]">{pagination.totalPages}</p>
                  <p className="text-white/60 text-xs">Pages</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-4 sm:p-6 border border-slate-100">
            <form onSubmit={handleSearch} className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search jobs by title, company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-[#fbfbfc] rounded-xl border-slate-200 focus:border-[#24c4b8] focus:ring-[#24c4b8]/20"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-12 px-4 gap-2 rounded-xl border-slate-200 ${
                    hasActiveFilters ? "border-[#cb6ce6] bg-[#cb6ce6]/5" : ""
                  }`}
                >
                  <Filter className="w-5 h-5" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1 w-2 h-2 bg-[#cb6ce6] rounded-full" />
                  )}
                </Button>
                <Button
                  onClick={() => navigate("/job-screening/agents")}
                  variant="outline"
                  className="h-12 px-4 gap-2 rounded-xl border-slate-200 hover:border-[#cb6ce6]"
                >
                  <Bot className="w-5 h-5" />
                  Agents
                </Button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Location</label>
                    <Input
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      placeholder="e.g., San Francisco"
                      className="h-10 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">
                      Job Type
                    </label>
                    <Select value={employmentType} onValueChange={setEmploymentType}>
                      <SelectTrigger className="h-10 rounded-lg">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        {employmentTypeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-slate-500 mb-1 block">
                        Min Exp
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={experienceMin}
                        onChange={(e) => setExperienceMin(e.target.value)}
                        placeholder="0"
                        className="h-10 rounded-lg text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-slate-500 mb-1 block">
                        Max Exp
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={experienceMax}
                        onChange={(e) => setExperienceMax(e.target.value)}
                        placeholder="Any"
                        className="h-10 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => setRemoteOnly(!remoteOnly)}
                      className={`flex-1 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                        remoteOnly
                          ? "bg-[#24c4b8] text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <Laptop className="w-4 h-4" />
                      Remote
                    </button>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="h-10 px-3 rounded-lg text-sm text-slate-500 hover:text-red-500 hover:bg-red-50"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Jobs List */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner />
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-[#000000] mb-2">
                {hasActiveFilters ? "No matching jobs" : "No jobs in catalog"}
              </h3>
              <p className="text-gray-500 mb-6">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "Run a screening agent to discover job openings"}
              </p>
              {!hasActiveFilters && (
                <Button
                  onClick={() => navigate("/job-screening/agents")}
                  className="bg-[#cb6ce6] hover:bg-[#b85ed4] text-white rounded-xl px-6"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Set Up Agents
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 hover:border-[#24c4b8]/40 hover:shadow-lg hover:shadow-[#24c4b8]/5 transition-all duration-200 cursor-pointer group"
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#000000] to-[#1a0a2e] rounded-xl flex items-center justify-center flex-shrink-0">
                        {job.companyLogoUrl ? (
                          <img
                            src={job.companyLogoUrl}
                            alt={job.companyName || ""}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-[#000000] truncate group-hover:text-[#24c4b8] transition-colors">
                            {job.roleTitle}
                          </h3>
                          {job.isRemote && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#24c4b8] text-white">
                              Remote
                            </span>
                          )}
                          {job.userInteraction?.isSaved && (
                            <BookmarkCheck className="w-4 h-4 text-[#cb6ce6]" />
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
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
                          {job.employmentType && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="capitalize">{job.employmentType}</span>
                            </>
                          )}
                        </div>

                        {job.requiredSkills && job.requiredSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {job.requiredSkills.slice(0, 5).map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs capitalize"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.requiredSkills.length > 5 && (
                              <span className="px-2 py-0.5 text-slate-400 text-xs">
                                +{job.requiredSkills.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="hidden sm:block text-right">
                        {job.salaryMin || job.salaryMax ? (
                          <p className="text-sm font-semibold text-[#000000]">
                            {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                          </p>
                        ) : null}
                        <p className="text-xs text-gray-400 mt-1">{formatDate(job.postedAt)}</p>
                      </div>

                      <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0 group-hover:text-[#24c4b8] group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchJobs(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="h-9 px-3 rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-500">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchJobs(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="h-9 px-3 rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Job Detail Modal */}
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedJob && (
              <>
                <DialogHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#000000] to-[#1a0a2e] rounded-xl flex items-center justify-center flex-shrink-0">
                      {selectedJob.companyLogoUrl ? (
                        <img
                          src={selectedJob.companyLogoUrl}
                          alt={selectedJob.companyName || ""}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <Building2 className="w-7 h-7 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="text-xl text-[#000000]">
                        {selectedJob.roleTitle}
                      </DialogTitle>
                      <p className="text-gray-500 mt-1">{selectedJob.companyName}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                        {selectedJob.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {selectedJob.location}
                          </span>
                        )}
                        {selectedJob.employmentType && (
                          <span className="flex items-center gap-1 capitalize">
                            <Briefcase className="w-3.5 h-3.5" />
                            {selectedJob.employmentType}
                          </span>
                        )}
                        {selectedJob.isRemote && (
                          <span className="flex items-center gap-1 text-[#24c4b8]">
                            <Laptop className="w-3.5 h-3.5" />
                            Remote
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Salary & Experience */}
                  <div className="flex flex-wrap gap-3">
                    {(selectedJob.salaryMin || selectedJob.salaryMax) && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm">
                        <DollarSign className="w-4 h-4" />
                        {formatSalary(
                          selectedJob.salaryMin,
                          selectedJob.salaryMax,
                          selectedJob.salaryCurrency
                        )}
                      </div>
                    )}
                    {selectedJob.experienceRequired && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                        <Clock className="w-4 h-4" />
                        {selectedJob.experienceRequired}
                      </div>
                    )}
                    {selectedJob.companyIndustry && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm">
                        <Building2 className="w-4 h-4" />
                        {selectedJob.companyIndustry}
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {selectedJob.requiredSkills && selectedJob.requiredSkills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Required Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.requiredSkills.map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm capitalize"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {selectedJob.jobDescription && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Job Description</h4>
                      <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {selectedJob.jobDescription}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    {!selectedJob.userInteraction?.isSaved ? (
                      <Button
                        onClick={() => handleSaveToTargets(selectedJob)}
                        disabled={savingJobId === selectedJob.id}
                        className="flex-1 h-12 rounded-xl bg-[#24c4b8] hover:bg-[#1db0a5] shadow-lg shadow-[#24c4b8]/25"
                      >
                        {savingJobId === selectedJob.id ? (
                          "Saving..."
                        ) : (
                          <>
                            <Target className="w-5 h-5 mr-2" />
                            Save to My Jobs
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => navigate(`/jobs/${selectedJob.userInteraction?.jobTargetId}`)}
                        className="flex-1 h-12 rounded-xl bg-[#cb6ce6] hover:bg-[#b85ed4] shadow-lg shadow-[#cb6ce6]/25"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Practice for This Job
                      </Button>
                    )}
                    {selectedJob.sourceUrl && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedJob.sourceUrl!, "_blank")}
                        className="h-12 px-6 rounded-xl border-slate-200"
                      >
                        <ExternalLink className="w-5 h-5 mr-2" />
                        View Original
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => handleHideJob(selectedJob.id)}
                      className="h-12 px-4 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50"
                    >
                      <EyeOff className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SidebarLayout>
  );
}
