import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Clock, ExternalLink, Sparkles, Play, FileText, Code, CheckCircle2, AlertCircle, MoreVertical, Trash2, ChevronDown, ChevronUp, Phone, User, Briefcase, MessageCircle, Heart, TrendingUp } from "lucide-react";
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
  companyArchetype?: string | null;
  archetypeConfidence?: "high" | "medium" | "low" | null;
  roleArchetypeId?: string | null;
  roleFamily?: string | null;
}

const archetypeLabels: Record<string, string> = {
  it_services: "IT Services",
  big_tech: "Big Tech",
  bfsi: "BFSI",
  fmcg: "FMCG",
  manufacturing: "Manufacturing",
  consulting: "Consulting",
  bpm: "BPM",
  telecom: "Telecom",
  conglomerate: "Conglomerate",
  startup: "Startup",
  enterprise: "Enterprise",
  regulated: "Regulated",
  consumer: "Consumer Tech",
  saas: "SaaS",
  fintech: "Fintech",
  edtech: "EdTech",
  services: "Services",
  industrial: "Industrial",
};

type RoundCategory = 
  | "aptitude_assessment"
  | "hr_screening"
  | "hiring_manager" 
  | "technical_interview"
  | "coding_assessment"
  | "system_design"
  | "case_study"
  | "behavioral"
  | "culture_values"
  | "bar_raiser"
  | "group_discussion";

type PracticeMode = "live_interview" | "coding_lab" | "case_study";

interface CompanyPracticeContext {
  jobTargetId: string;
  companyName: string | null;
  companyId: string | null;
  roleTitle: string | null;
  archetype: string | null;
  tier: string | null;
  hasBlueprint: boolean;
  blueprintNotes: string | null;
  focusAreas: string[];
  leadershipPrinciples: string[] | null;
  interviewStyle: string | null;
}

interface PracticeOption {
  id: string;
  roundCategory: RoundCategory;
  label: string;
  description: string;
  practiceMode: PracticeMode;
  typicalDuration: string;
  icon: string;
  companySpecific: boolean;
  companyContext: CompanyPracticeContext;
  focusHint: string | null;
}

interface CompanyData {
  companyName: string | null;
  archetype: string | null;
  tier: string | null;
  hasBlueprint: boolean;
  blueprintNotes: string | null;
  hasContext: boolean;
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
  const [practiceOptions, setPracticeOptions] = useState<PracticeOption[]>([]);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [jdExpanded, setJdExpanded] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      
      try {
        setIsLoading(true);
        const [jobRes, optionsRes] = await Promise.all([
          fetch(`/api/jobs/job-targets/${jobId}`),
          fetch(`/api/jobs/job-targets/${jobId}/practice-options`),
        ]);
        
        const jobData = await jobRes.json();
        const optionsData = await optionsRes.json();
        
        if (jobData.success) {
          setJob(jobData.job);
        }
        
        if (optionsData.success) {
          setPracticeOptions(optionsData.options || []);
          if (optionsData.companyContext) {
            setCompanyData({
              companyName: optionsData.companyContext.companyName,
              archetype: optionsData.companyContext.archetype,
              tier: optionsData.companyContext.tier,
              hasBlueprint: optionsData.companyContext.hasBlueprint,
              blueprintNotes: optionsData.companyContext.blueprintNotes,
              hasContext: !!optionsData.companyContext.companyId,
            });
          }
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
    if (!job || !job.jdText) return;
    
    setIsParsing(true);
    try {
      const response = await fetch(`/api/jobs/job-targets/${job.id}/parse`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setJob(prev => prev ? { ...prev, jdParsed: data.parsed } : null);
      }
    } catch (error) {
      console.error("Error parsing JD:", error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDelete = async () => {
    if (!job || !window.confirm("Are you sure you want to delete this job?")) return;
    
    try {
      const response = await fetch(`/api/jobs/job-targets/${job.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        navigate("/interview/custom");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  };

  const handleStartPracticeOption = (option: PracticeOption) => {
    navigate(`/interview/config?jobTargetId=${job?.id}&roundCategory=${option.roundCategory}`);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getIcon = (category: RoundCategory) => {
    switch (category) {
      case "hr_screening":
        return <Phone className="w-4 h-4 text-green-600" />;
      case "hiring_manager":
        return <User className="w-4 h-4 text-blue-600" />;
      case "technical_interview":
      case "coding_assessment":
      case "system_design":
        return <Code className="w-4 h-4 text-purple-600" />;
      case "case_study":
        return <Briefcase className="w-4 h-4 text-orange-600" />;
      case "behavioral":
        return <MessageCircle className="w-4 h-4 text-amber-600" />;
      case "culture_values":
        return <Heart className="w-4 h-4 text-pink-600" />;
      case "bar_raiser":
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </SidebarLayout>
    );
  }

  if (!job) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-slate-500">Job not found</p>
        </div>
      </SidebarLayout>
    );
  }

  const parsed = job.jdParsed;
  const status = statusConfig[job.status] || statusConfig.saved;

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#f8f9fb]">
        <div className="bg-[#042c4c] text-white">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <div className="flex items-start gap-4">
              <button
                onClick={() => navigate("/interview/custom")}
                className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold truncate">{job.roleTitle}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-white/70">
                  {job.companyName && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      {job.companyName}
                    </span>
                  )}
                  {job.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Added {formatDate(job.createdAt)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                  {job.roleFamily && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-200 capitalize">
                      {job.roleFamily}
                    </span>
                  )}
                  {job.companyArchetype && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80">
                      {archetypeLabels[job.companyArchetype] || job.companyArchetype}
                    </span>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Job
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {!job.jdParsed && job.jdText && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#ee7e65]/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#ee7e65]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#042c4c]">Analyze Job Description</p>
                    <p className="text-sm text-slate-500">Get AI-powered insights and practice recommendations</p>
                  </div>
                </div>
                <Button
                  onClick={handleParseJD}
                  className="bg-[#ee7e65] hover:bg-[#e06a50]"
                  disabled={isParsing}
                >
                  {isParsing ? "Analyzing..." : "Analyze"}
                </Button>
              </div>
            </div>
          )}

          {parsed && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-semibold text-[#042c4c] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ee7e65]" />
                  AI-Analyzed Requirements
                </h2>
              </div>
              <div className="p-4 space-y-4">
                {parsed.experienceLevel && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Experience Level</p>
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium capitalize">
                      {parsed.experienceLevel}
                    </span>
                  </div>
                )}

                {parsed.focusAreas && parsed.focusAreas.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Focus Areas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {parsed.focusAreas.map((area, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-[#ee7e65]/10 text-[#ee7e65] rounded-full text-sm">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {parsed.requiredSkills && parsed.requiredSkills.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Required Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {parsed.requiredSkills.map((skill, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {parsed.responsibilities && parsed.responsibilities.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Key Responsibilities</p>
                    <ul className="space-y-1.5">
                      {parsed.responsibilities.slice(0, 5).map((resp, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {resp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {parsed.redFlags && parsed.redFlags.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Watch Out For</p>
                    <ul className="space-y-1.5">
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
            </div>
          )}

          {job.jdText && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setJdExpanded(!jdExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="font-semibold text-[#042c4c]">Job Description</span>
                </div>
                <div className="flex items-center gap-2">
                  {job.jobUrl && (
                    <a
                      href={job.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-[#ee7e65] hover:underline flex items-center gap-1"
                    >
                      View Original
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {jdExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>
              {jdExpanded && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-600 mt-4 leading-relaxed">
                    {job.jdText}
                  </pre>
                </div>
              )}
            </div>
          )}

          {practiceOptions.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-semibold text-[#042c4c]">Interview Stages</h2>
                <p className="text-sm text-slate-500 mt-0.5">Practice each stage to prepare for your interview</p>
              </div>
              {companyData?.blueprintNotes && (
                <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <p className="text-sm text-amber-800">{companyData.blueprintNotes}</p>
                </div>
              )}
              <div className="p-2">
                {practiceOptions.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                        {getIcon(option.roundCategory)}
                      </div>
                      <div>
                        <p className="font-medium text-[#042c4c] text-sm">{option.label}</p>
                        <p className="text-xs text-slate-500">
                          {option.typicalDuration}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleStartPracticeOption(option)}
                      size="sm"
                      className="bg-[#042c4c] hover:bg-[#042c4c]/90"
                    >
                      <Play className="w-3.5 h-3.5 mr-1.5" />
                      Practice
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
