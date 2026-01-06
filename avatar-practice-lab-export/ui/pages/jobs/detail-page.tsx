import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Clock, ExternalLink, Target, Sparkles, Play, FileText, Code, BookOpen, CheckCircle2, AlertCircle, MoreVertical, Trash2, X, Lightbulb, Phone, User, Terminal, Boxes, Briefcase, MessageCircle, Heart, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import SidebarLayout from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface RoleArchetype {
  id: string;
  name: string;
  roleFamily: string;
}

const confidenceBadgeColors: Record<string, { bg: string; text: string; border: string }> = {
  high: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  low: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
};

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

const companyArchetypeOptions = [
  { value: "it_services", label: "IT Services" },
  { value: "big_tech", label: "Big Tech" },
  { value: "bfsi", label: "BFSI" },
  { value: "fmcg", label: "FMCG" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "consulting", label: "Consulting" },
  { value: "bpm", label: "BPM" },
  { value: "telecom", label: "Telecom" },
  { value: "conglomerate", label: "Conglomerate" },
  { value: "startup", label: "Startup" },
  { value: "enterprise", label: "Enterprise" },
  { value: "saas", label: "SaaS" },
  { value: "fintech", label: "Fintech" },
  { value: "edtech", label: "EdTech" },
  { value: "consumer", label: "Consumer Tech" },
  { value: "regulated", label: "Regulated" },
  { value: "services", label: "Services" },
  { value: "industrial", label: "Industrial" },
];

type RoundCategory = 
  | "hr_screening"
  | "hiring_manager" 
  | "technical_interview"
  | "coding_assessment"
  | "system_design"
  | "case_study"
  | "behavioral"
  | "culture_values"
  | "bar_raiser"
  | "panel_interview";

type PracticeMode = "live_interview" | "coding_lab" | "case_study" | "presentation";

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
  const [practiceHistory, setPracticeHistory] = useState<{ interviews: any[]; exercises: any[] }>({ interviews: [], exercises: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [jdExpanded, setJdExpanded] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [roleArchetypes, setRoleArchetypes] = useState<RoleArchetype[]>([]);
  const [isUpdatingArchetype, setIsUpdatingArchetype] = useState(false);

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
          setPracticeHistory(jobData.practiceHistory || { interviews: [], exercises: [] });
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

  useEffect(() => {
    const fetchRoleArchetypes = async () => {
      try {
        const response = await fetch("/api/jobs/archetypes/roles");
        const data = await response.json();
        if (data.success) {
          setRoleArchetypes(data.archetypes || []);
        }
      } catch (error) {
        console.error("Error fetching role archetypes:", error);
      }
    };
    fetchRoleArchetypes();
  }, []);

  const handleUpdateArchetype = async (updates: { companyArchetype?: string; roleArchetypeId?: string; roleFamily?: string }) => {
    if (!job?.id) return;
    
    try {
      setIsUpdatingArchetype(true);
      const response = await fetch(`/api/jobs/job-targets/${job.id}/archetype`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (data.success) {
        setJob(data.job);
        
        const optionsRes = await fetch(`/api/jobs/job-targets/${job.id}/practice-options`);
        const optionsData = await optionsRes.json();
        if (optionsData.success) {
          setPracticeOptions(optionsData.options || []);
          if (optionsData.companyContext) {
            setCompanyData({
              companyName: optionsData.companyContext.companyName,
              archetype: optionsData.companyContext.archetype,
              tier: optionsData.companyContext.tier,
              hasBlueprint: optionsData.companyContext.hasBlueprint,
              blueprintNotes: optionsData.companyContext.blueprintNotes,
              hasContext: optionsData.companyContext.hasContext,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error updating archetype:", error);
    } finally {
      setIsUpdatingArchetype(false);
    }
  };

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
        const optionsRes = await fetch(`/api/jobs/job-targets/${job.id}/practice-options`);
        const optionsData = await optionsRes.json();
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
      }
    } catch (error) {
      console.error("Error parsing JD:", error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleStartPracticeOption = (option: PracticeOption) => {
    const { roundCategory, practiceMode, companyContext } = option;
    const params = new URLSearchParams();
    params.set("jobTargetId", companyContext.jobTargetId);
    params.set("roundCategory", roundCategory);
    
    if (practiceMode === "live_interview") {
      navigate(`/interview/config?${params.toString()}`);
    } else if (practiceMode === "coding_lab") {
      navigate(`/exercise-mode/coding-lab?${params.toString()}`);
    } else if (practiceMode === "case_study") {
      navigate(`/exercise-mode/case-study?${params.toString()}`);
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
            {!job.jdParsed && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-brand-accent" />
                    </div>
                    <div>
                      <h4 className="font-medium text-brand-dark">Analyze Job Description</h4>
                      <p className="text-sm text-brand-muted">Parse the JD to get personalized practice recommendations</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleParseJD}
                    className="bg-brand-accent hover:bg-brand-accent/90"
                    disabled={isParsing}
                  >
                    {isParsing ? "Analyzing..." : "Analyze"}
                  </Button>
                </div>
              </div>
            )}
            
            {practiceOptions.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
                    <Target className="w-5 h-5 text-brand-accent" />
                    Interview Preparation
                  </h2>
                  <div className="flex items-center gap-2">
                    {job.roleFamily && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium capitalize">
                        {job.roleFamily}
                      </span>
                    )}
                    {job.companyArchetype && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        job.archetypeConfidence === "high" ? "bg-green-100 text-green-700" :
                        job.archetypeConfidence === "medium" ? "bg-amber-100 text-amber-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {archetypeLabels[job.companyArchetype] || job.companyArchetype}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {practiceOptions.map((option, index) => {
                    const getIcon = () => {
                      switch (option.roundCategory) {
                        case "hr_screening":
                          return <Phone className="w-5 h-5 text-green-500" />;
                        case "hiring_manager":
                          return <User className="w-5 h-5 text-blue-500" />;
                        case "technical_interview":
                          return <Code className="w-5 h-5 text-purple-500" />;
                        case "coding_assessment":
                          return <Terminal className="w-5 h-5 text-indigo-500" />;
                        case "system_design":
                          return <Boxes className="w-5 h-5 text-cyan-500" />;
                        case "case_study":
                          return <Briefcase className="w-5 h-5 text-orange-500" />;
                        case "behavioral":
                          return <MessageCircle className="w-5 h-5 text-amber-500" />;
                        case "culture_values":
                          return <Heart className="w-5 h-5 text-pink-500" />;
                        case "bar_raiser":
                          return <TrendingUp className="w-5 h-5 text-red-500" />;
                        case "panel_interview":
                          return <Users className="w-5 h-5 text-teal-500" />;
                        default:
                          return <FileText className="w-5 h-5 text-brand-accent" />;
                      }
                    };
                    
                    return (
                      <div
                        key={option.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            index === 0 ? "bg-brand-accent/10" : "bg-gray-100"
                          }`}>
                            {getIcon()}
                          </div>
                          <div>
                            <h4 className="font-medium text-brand-dark">{option.label}</h4>
                            <p className="text-sm text-brand-muted">
                              {option.typicalDuration} | {option.description.length > 70 ? option.description.substring(0, 70) + "..." : option.description}
                            </p>
                            {option.focusHint && (
                              <p className="text-xs text-brand-accent mt-0.5">{option.focusHint}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleStartPracticeOption(option)}
                          size="sm"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Practice
                        </Button>
                      </div>
                    );
                  })}
                </div>
                {companyData?.blueprintNotes && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <p className="text-xs text-amber-800 font-medium mb-1">Interview Insight</p>
                    <p className="text-sm text-amber-700">{companyData.blueprintNotes}</p>
                  </div>
                )}
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
            {(job.companyArchetype || job.roleFamily || companyArchetypeOptions.length > 0) && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-sm font-medium text-brand-muted mb-4">Interview Configuration</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-brand-muted block mb-1.5">Company Type</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={job.companyArchetype || ""}
                        onChange={(e) => handleUpdateArchetype({ companyArchetype: e.target.value })}
                        disabled={isUpdatingArchetype}
                        className="flex-1 px-3 py-2 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                      >
                        <option value="">Auto-detect</option>
                        {companyArchetypeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {job.companyArchetype && job.archetypeConfidence && (
                        <span className={`shrink-0 px-2 py-0.5 text-xs rounded-full border ${
                          confidenceBadgeColors[job.archetypeConfidence]?.bg || "bg-gray-50"
                        } ${
                          confidenceBadgeColors[job.archetypeConfidence]?.text || "text-gray-600"
                        } ${
                          confidenceBadgeColors[job.archetypeConfidence]?.border || "border-gray-200"
                        }`}>
                          {job.archetypeConfidence}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-brand-muted block mb-1.5">Role Type</label>
                    <select
                      value={job.roleArchetypeId || ""}
                      onChange={(e) => {
                        const selected = roleArchetypes.find(r => r.id === e.target.value);
                        handleUpdateArchetype({ 
                          roleArchetypeId: e.target.value,
                          roleFamily: selected?.roleFamily || undefined
                        });
                      }}
                      disabled={isUpdatingArchetype}
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                    >
                      <option value="">Auto-detect</option>
                      {roleArchetypes.map((arch) => (
                        <option key={arch.id} value={arch.id}>
                          {arch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {job.roleFamily && (
                    <div className="flex items-center gap-2 text-xs text-brand-muted">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Role Family: <span className="font-medium text-brand-dark">{job.roleFamily.charAt(0).toUpperCase() + job.roleFamily.slice(1)}</span></span>
                    </div>
                  )}
                </div>
              </div>
            )}

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
              <h3 className="text-sm font-medium text-brand-muted mb-4">Quick Start</h3>
              <div className="space-y-2">
                {practiceOptions.length > 0 ? (
                  <Button
                    onClick={() => handleStartPracticeOption(practiceOptions[0])}
                    className="w-full justify-start gap-2 bg-brand-dark hover:bg-brand-dark/90"
                  >
                    <Play className="w-4 h-4" />
                    Start First Round
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate(`/interview/config?jobTargetId=${job.id}`)}
                    className="w-full justify-start gap-2 bg-brand-dark hover:bg-brand-dark/90"
                  >
                    <FileText className="w-4 h-4" />
                    Practice Interview
                  </Button>
                )}
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

      <Dialog open={showGuideModal} onOpenChange={setShowGuideModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              {companyData?.companyName || job?.companyName || "Company"} Interview Guide
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {companyData?.blueprintNotes ? (
              <div className="p-4 bg-amber-50 rounded-xl">
                <h4 className="font-medium text-amber-900 mb-2">What to Expect</h4>
                <p className="text-sm text-amber-800">{companyData.blueprintNotes}</p>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-medium text-brand-dark mb-2">
                  {companyData?.hasContext ? "General Guidance" : "No Company-Specific Insights Available"}
                </h4>
                <p className="text-sm text-brand-muted">
                  {companyData?.hasContext 
                    ? "We have general information about this company but no specific interview insights yet. Practice with our general interview preparation to build core skills."
                    : "We don't have information about this company in our database yet. Practice with our general interview preparation to build core skills that apply to any company."
                  }
                </p>
              </div>
            )}
            {companyData?.hasContext && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-medium text-brand-dark mb-2">Company Profile</h4>
                <div className="space-y-2 text-sm">
                  {companyData?.archetype && (
                    <div className="flex justify-between">
                      <span className="text-brand-muted">Company Type</span>
                      <span className="font-medium capitalize">{companyData.archetype}</span>
                    </div>
                  )}
                  {companyData?.tier && (
                    <div className="flex justify-between">
                      <span className="text-brand-muted">Tier</span>
                      <span className="font-medium capitalize">{companyData.tier.replace("tier", "Tier ")}</span>
                    </div>
                  )}
                  {companyData?.hasBlueprint && (
                    <div className="flex justify-between">
                      <span className="text-brand-muted">Interview Blueprint</span>
                      <span className="text-green-600 font-medium">Available</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowGuideModal(false)}>
                Close
              </Button>
              <Button 
                onClick={() => {
                  setShowGuideModal(false);
                  if (practiceOptions.length > 0) {
                    handleStartPracticeOption(practiceOptions[0]);
                  }
                }}
                className="bg-brand-accent hover:bg-brand-accent/90"
              >
                Start Practice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
