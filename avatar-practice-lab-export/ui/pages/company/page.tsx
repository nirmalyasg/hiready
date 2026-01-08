import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Building2, 
  Briefcase, 
  Users, 
  Plus,
  ExternalLink,
  Download,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Star,
  MoreVertical,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Search,
  TrendingUp
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LogOut } from "lucide-react";

interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  domain: string | null;
  plan: string;
  userRole: string;
}

interface InterviewPhase {
  name: string;
  category: string;
  mins: number;
  practiceMode?: string;
  description: string;
  focusAreas?: string[];
}

interface SkillTag {
  skill: string;
  category: string;
  weight: number;
  source: string;
}

interface GeneratedInterviewPlan {
  phases: InterviewPhase[];
  totalMinutes?: number;
  totalMins?: number;
  roleArchetype?: {
    id: string | null;
    name: string | null;
    family: string | null;
    confidence?: string;
  };
  companyArchetype?: {
    name?: string;
    type?: string | null;
    archetype?: string | null;
    confidence: string;
  };
  extractedSkills?: SkillTag[];
  skillSummary?: {
    primarySkills: string[];
    secondarySkills: string[];
    domains: string[];
  };
  focusAreas?: string[];
  interviewStyle?: string;
  generatedAt?: string;
}

interface Job {
  id: string;
  title: string;
  status: string;
  applyLinkSlug: string;
  candidateCount: number;
  jdText?: string;
  assessmentConfig: {
    interviewTypes: string[];
    totalDuration?: number;
  };
  generatedInterviewPlan?: GeneratedInterviewPlan;
  createdAt: string;
}

interface Candidate {
  id: string;
  userId: string;
  hireadyIndexScore: number | null;
  status: string;
  completedInterviewTypes: string[];
  submittedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

const getStatusConfig = (status: string) => {
  const configs: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    pending: { label: "Pending", color: "text-gray-600", bgColor: "bg-gray-100", icon: Clock },
    in_progress: { label: "In Progress", color: "text-blue-600", bgColor: "bg-blue-100", icon: Clock },
    completed: { label: "Completed", color: "text-green-600", bgColor: "bg-green-100", icon: CheckCircle },
    reviewed: { label: "Reviewed", color: "text-purple-600", bgColor: "bg-purple-100", icon: Eye },
    shortlisted: { label: "Shortlisted", color: "text-emerald-600", bgColor: "bg-emerald-100", icon: Star },
    rejected: { label: "Rejected", color: "text-red-600", bgColor: "bg-red-100", icon: AlertCircle },
  };
  return configs[status] || configs.pending;
};

const getScoreColor = (score: number | null) => {
  if (!score) return "text-gray-400";
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
};

interface EmployerUser {
  id: string;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  companyId: string | null;
  role: string | null;
  company: {
    id: string;
    name: string;
    domain: string | null;
    logoUrl: string | null;
  } | null;
}

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const [employerUser, setEmployerUser] = useState<EmployerUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobJd, setNewJobJd] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    checkEmployerAuth();
  }, []);

  useEffect(() => {
    if (authChecked && employerUser) {
      if (employerUser.company) {
        const company: Company = {
          id: employerUser.company.id,
          name: employerUser.company.name,
          logoUrl: employerUser.company.logoUrl,
          domain: employerUser.company.domain,
          plan: "free",
          userRole: employerUser.role || "admin",
        };
        setCompanies([company]);
        setSelectedCompany(company);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [authChecked, employerUser]);

  const checkEmployerAuth = async () => {
    try {
      const response = await fetch("/api/employer-auth/session", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setEmployerUser(data.user);
        } else {
          navigate("/company/login");
        }
      } else {
        navigate("/company/login");
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      navigate("/company/login");
    } finally {
      setAuthChecked(true);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/employer-auth/logout", { method: "POST", credentials: "include" });
      localStorage.removeItem("employerUser");
      navigate("/company/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  useEffect(() => {
    if (selectedCompany) {
      fetchJobs();
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (selectedJob) {
      fetchCandidates(selectedJob.id);
    }
  }, [selectedJob]);

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/employer/companies", { credentials: "include" });
      const data = await response.json();
      if (data.success) {
        setCompanies(data.companies);
        if (data.companies.length > 0) {
          setSelectedCompany(data.companies[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch(`/api/employer/jobs`, { credentials: "include" });
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs || []);
        if (data.jobs && data.jobs.length > 0) {
          setSelectedJob(data.jobs[0]);
        } else {
          setSelectedJob(null);
          setCandidates([]);
        }
      } else {
        console.error("Failed to fetch jobs:", data.error);
        setJobs([]);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setJobs([]);
    }
  };

  const fetchCandidates = async (jobId: string) => {
    try {
      const response = await fetch(`/api/employer/jobs/${jobId}/candidates`, { credentials: "include" });
      const data = await response.json();
      if (data.success) {
        setCandidates(data.candidates);
      }
    } catch (err) {
      console.error("Error fetching candidates:", err);
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;
    setIsCreatingCompany(true);
    try {
      const response = await fetch("/api/employer/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newCompanyName }),
      });
      const data = await response.json();
      if (data.success) {
        setCompanies([...companies, { ...data.company, userRole: "owner" }]);
        setSelectedCompany({ ...data.company, userRole: "owner" });
        setNewCompanyName("");
      }
    } catch (err) {
      console.error("Error creating company:", err);
    } finally {
      setIsCreatingCompany(false);
    }
  };

  const handleCreateJob = async () => {
    if (!newJobTitle.trim() || !selectedCompany) return;
    setIsCreatingJob(true);
    try {
      const response = await fetch(`/api/employer/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          title: newJobTitle,
          jdText: newJobJd || null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        const newJob = {
          ...data.job,
          generatedInterviewPlan: data.job.generatedInterviewPlan,
          candidateCount: 0,
        };
        setJobs([newJob, ...jobs]);
        setSelectedJob(newJob);
        setNewJobTitle("");
        setNewJobJd("");
        setIsJobDialogOpen(false);
        const phaseCount = data.job.generatedInterviewPlan?.phases?.length || 0;
        setSuccessMessage(`Job created with ${phaseCount} interview phases!`);
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error("Error creating job:", err);
    } finally {
      setIsCreatingJob(false);
    }
  };

  const handleUpdateCandidateStatus = async (candidateId: string, status: string) => {
    try {
      const response = await fetch(`/api/employer/candidates/${candidateId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        setCandidates(candidates.map(c => 
          c.id === candidateId ? { ...c, status } : c
        ));
      }
    } catch (err) {
      console.error("Error updating candidate status:", err);
    }
  };

  const handleExportCandidates = async () => {
    if (!selectedJob) return;
    window.open(`/api/employer/jobs/${selectedJob.id}/candidates/export`, "_blank");
  };

  const filteredCandidates = candidates.filter(c => 
    !candidateSearch || 
    c.user.name?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
    c.user.email.toLowerCase().includes(candidateSearch.toLowerCase())
  );

  const getApplyUrl = (slug: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/apply/${slug}`;
  };

  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f9fb]">
        <header className="bg-[#042c4c] text-white py-4">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#ee7e65] rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-semibold text-lg">Hiready</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/10">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="text-center p-8">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Create Your Company</h2>
            <p className="text-gray-600 mb-6">Set up your employer account to start creating assessment links for candidates.</p>
            
            <div className="max-w-sm mx-auto space-y-4">
              <Input
                placeholder="Company name"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
              />
              <Button 
                onClick={handleCreateCompany}
                disabled={!newCompanyName.trim() || isCreatingCompany}
                className="w-full bg-[#ee7e65] hover:bg-[#d96a52]"
              >
                {isCreatingCompany ? <LoadingSpinner className="w-4 h-4" /> : "Create Company"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}
      <div className="bg-gradient-to-r from-[#042c4c] to-[#0a3d66] text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{selectedCompany?.name}</h1>
                <p className="text-white/70 text-sm">Employer Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Plus className="w-4 h-4 mr-2" />
                    New Job
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Job</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                      <Input
                        placeholder="e.g., Senior Software Engineer"
                        value={newJobTitle}
                        onChange={(e) => setNewJobTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Description (optional)</label>
                      <textarea
                        placeholder="Paste the job description to auto-generate interview plan..."
                        value={newJobJd}
                        onChange={(e) => setNewJobJd(e.target.value)}
                        className="w-full h-32 p-3 border rounded-lg text-sm resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        The system will analyze the JD to create a tailored interview assessment plan.
                      </p>
                    </div>
                    <Button 
                      onClick={handleCreateJob}
                      disabled={!newJobTitle.trim() || isCreatingJob}
                      className="w-full bg-[#ee7e65] hover:bg-[#d96a52]"
                    >
                      {isCreatingJob ? (
                        <span className="flex items-center gap-2">
                          <LoadingSpinner className="w-4 h-4" />
                          Analyzing & Creating...
                        </span>
                      ) : "Create Job"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/10">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">Jobs</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {jobs.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No jobs yet. Create your first job!
                    </div>
                  ) : (
                    <div className="divide-y">
                      {jobs.map((job) => (
                        <button
                          key={job.id}
                          onClick={() => setSelectedJob(job)}
                          className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                            selectedJob?.id === job.id ? "bg-[#ee7e65]/5 border-l-2 border-[#ee7e65]" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900 text-sm">{job.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {job.candidateCount} candidates
                                </Badge>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              {selectedJob ? (
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">{selectedJob.title}</h2>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span>{candidates.length} candidates</span>
                            <span>{selectedJob.assessmentConfig?.interviewTypes?.length || 0} interview rounds</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(getApplyUrl(selectedJob.applyLinkSlug))}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Copy Link
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleExportCandidates}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {selectedJob.generatedInterviewPlan?.phases && selectedJob.generatedInterviewPlan.phases.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3 border-b">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">Interview Assessment Plan</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                              {selectedJob.generatedInterviewPlan.interviewStyle || "Auto-generated from job description"}
                              {selectedJob.generatedInterviewPlan.roleArchetype?.name && (
                                <span className="ml-2">
                                  • Role: <span className="font-medium text-[#042c4c]">{selectedJob.generatedInterviewPlan.roleArchetype.name}</span>
                                </span>
                              )}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            {selectedJob.generatedInterviewPlan.totalMins || 
                              selectedJob.generatedInterviewPlan.totalMinutes || 
                              selectedJob.generatedInterviewPlan.phases.reduce((acc, p) => acc + p.mins, 0)} mins total
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        {selectedJob.generatedInterviewPlan.skillSummary?.primarySkills && selectedJob.generatedInterviewPlan.skillSummary.primarySkills.length > 0 && (
                          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                            <h4 className="text-sm font-medium text-blue-900 mb-2">Skills Extracted from JD</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedJob.generatedInterviewPlan.skillSummary.primarySkills.map((skill, index) => (
                                <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {selectedJob.generatedInterviewPlan.skillSummary.secondarySkills?.slice(0, 3).map((skill, index) => (
                                <Badge key={`secondary-${index}`} variant="outline" className="text-blue-600 border-blue-200 text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                            {selectedJob.generatedInterviewPlan.focusAreas && selectedJob.generatedInterviewPlan.focusAreas.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-blue-100">
                                <span className="text-xs text-blue-700 font-medium">Focus Areas: </span>
                                <span className="text-xs text-blue-600">{selectedJob.generatedInterviewPlan.focusAreas.join(", ")}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                          {selectedJob.generatedInterviewPlan.phases.map((phase, index) => (
                            <div 
                              key={index}
                              className="p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 text-sm">{phase.name}</h4>
                                  <p className="text-xs text-gray-500 mt-1">{phase.description}</p>
                                  {phase.focusAreas && phase.focusAreas.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {phase.focusAreas.slice(0, 2).map((area, i) => (
                                        <span key={i} className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                                          {area}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                                  {phase.mins} min
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader className="pb-3 border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Candidates</CardTitle>
                        <div className="relative w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Search candidates..."
                            value={candidateSearch}
                            onChange={(e) => setCandidateSearch(e.target.value)}
                            className="pl-9 h-9"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {filteredCandidates.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No candidates yet</p>
                          <p className="text-sm mt-1">Share the assessment link to start receiving applications</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {filteredCandidates.map((candidate) => {
                            const statusConfig = getStatusConfig(candidate.status);
                            const StatusIcon = statusConfig.icon;
                            return (
                              <div key={candidate.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#042c4c]/10 flex items-center justify-center">
                                      <span className="text-sm font-medium text-[#042c4c]">
                                        {(candidate.user.name || candidate.user.email)[0].toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-gray-900">
                                        {candidate.user.name || "Unnamed"}
                                      </h4>
                                      <p className="text-sm text-gray-500">{candidate.user.email}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                    <div className="text-center">
                                      <div className={`text-2xl font-bold ${getScoreColor(candidate.hireadyIndexScore)}`}>
                                        {candidate.hireadyIndexScore ?? "—"}
                                      </div>
                                      <div className="text-xs text-gray-500">Score</div>
                                    </div>
                                    
                                    <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                                      <StatusIcon className="w-3 h-3 mr-1" />
                                      {statusConfig.label}
                                    </Badge>
                                    
                                    {candidate.status === "completed" && (
                                      <div className="flex items-center gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                          onClick={() => handleUpdateCandidateStatus(candidate.id, "shortlisted")}
                                        >
                                          <ThumbsUp className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => handleUpdateCandidateStatus(candidate.id, "rejected")}
                                        >
                                          <ThumbsDown className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 mb-1">Select a Job</h3>
                  <p className="text-sm text-gray-500">Choose a job from the sidebar to view candidates</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
