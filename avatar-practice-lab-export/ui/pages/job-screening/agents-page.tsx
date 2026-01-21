import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Bot,
  MapPin,
  Briefcase,
  Clock,
  Play,
  Settings,
  Trash2,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Filter,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface JobScreeningAgent {
  id: string;
  name: string;
  description: string | null;
  searchKeywords: string[] | null;
  locations: string[] | null;
  experienceMin: number;
  experienceMax: number;
  companySizes: string[] | null;
  industries: string[] | null;
  jobTypes: string[] | null;
  excludedCompanies: string[] | null;
  isActive: boolean;
  runFrequency: string;
  lastRunAt: string | null;
  totalJobsFound: number;
  jobsFoundLastRun: number;
  createdAt: string;
}

interface Stats {
  agentCount: number;
  totalCatalogJobs: number;
  savedJobs: number;
  jobsFromAgents: number;
}

const frequencyOptions = [
  { value: "manual", label: "Manual only" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

const jobTypeOptions = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "remote", label: "Remote" },
];

const companySizeOptions = [
  { value: "startup", label: "Startup (1-50)" },
  { value: "small", label: "Small (51-200)" },
  { value: "medium", label: "Medium (201-1000)" },
  { value: "large", label: "Large (1000+)" },
  { value: "enterprise", label: "Enterprise (10000+)" },
];

export default function JobScreeningAgentsPage() {
  const [agents, setAgents] = useState<JobScreeningAgent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    searchKeywords: "",
    locations: "",
    experienceMin: 0,
    experienceMax: 99,
    jobTypes: [] as string[],
    companySizes: [] as string[],
    excludedCompanies: "",
    runFrequency: "manual",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/job-screening/agents");
      const data = await response.json();
      if (data.success) {
        setAgents(data.agents);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/job-screening/stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchAgents(), fetchStats()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleCreateAgent = async () => {
    if (!formData.name.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/job-screening/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          searchKeywords: formData.searchKeywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          locations: formData.locations
            .split(",")
            .map((l) => l.trim())
            .filter(Boolean),
          experienceMin: formData.experienceMin,
          experienceMax: formData.experienceMax,
          jobTypes: formData.jobTypes,
          companySizes: formData.companySizes,
          excludedCompanies: formData.excludedCompanies
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
          runFrequency: formData.runFrequency,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAgents([data.agent, ...agents]);
        setCreateDialogOpen(false);
        resetForm();
        fetchStats();
      }
    } catch (error) {
      console.error("Error creating agent:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunAgent = async (agentId: string) => {
    try {
      setRunningAgentId(agentId);
      const response = await fetch(`/api/job-screening/agents/${agentId}/run`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        // Refresh agents and stats
        await Promise.all([fetchAgents(), fetchStats()]);

        // Show notification
        alert(`Found ${data.newJobsFound} new jobs!`);
      }
    } catch (error) {
      console.error("Error running agent:", error);
    } finally {
      setRunningAgentId(null);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;

    try {
      await fetch(`/api/job-screening/agents/${agentId}`, {
        method: "DELETE",
      });
      setAgents(agents.filter((a) => a.id !== agentId));
      fetchStats();
    } catch (error) {
      console.error("Error deleting agent:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      searchKeywords: "",
      locations: "",
      experienceMin: 0,
      experienceMax: 99,
      jobTypes: [],
      companySizes: [],
      excludedCompanies: "",
      runFrequency: "manual",
    });
  };

  const formatLastRun = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="min-h-screen bg-[#fbfbfc]">
      {/* Back Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Dashboard
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-br from-[#000000] via-[#1a0a2e] to-[#000000] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-[#cb6ce6] rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="text-[#cb6ce6] text-sm font-semibold uppercase tracking-wide">
                  Job Discovery
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">Screening Agents</h1>
              <p className="text-white/70 mt-2 text-sm sm:text-base">
                Set up agents to automatically find job openings that match your criteria
              </p>
            </div>
              {stats && (
                <div className="grid grid-cols-3 gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{stats.agentCount}</p>
                    <p className="text-white/60 text-xs">Agents</p>
                  </div>
                  <div className="text-center border-x border-white/20 px-4">
                    <p className="text-2xl font-bold text-[#cb6ce6]">{stats.jobsFromAgents}</p>
                    <p className="text-white/60 text-xs">Jobs Found</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#24c4b8]">{stats.savedJobs}</p>
                    <p className="text-white/60 text-xs">Saved</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-4 sm:p-6 border border-slate-100">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <Button
                onClick={() => navigate("/admin/job-screening/catalog")}
                variant="outline"
                className="h-12 px-6 gap-2 rounded-xl border-slate-200 hover:border-[#24c4b8]"
              >
                <Search className="w-5 h-5" />
                View Job Catalog
              </Button>

              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="h-12 px-6 gap-2 bg-[#cb6ce6] hover:bg-[#b85ed4] text-white font-semibold rounded-xl shadow-lg shadow-[#cb6ce6]/25">
                    <Plus className="w-5 h-5" />
                    Create Agent
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-[#000000]">Create Screening Agent</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Agent Name *
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Senior Frontend Jobs"
                        className="h-11 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Description
                      </label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Optional description"
                        className="h-11 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Search Keywords (comma-separated)
                      </label>
                      <Input
                        value={formData.searchKeywords}
                        onChange={(e) =>
                          setFormData({ ...formData, searchKeywords: e.target.value })
                        }
                        placeholder="e.g., Software Engineer, Frontend Developer"
                        className="h-11 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Locations (comma-separated)
                      </label>
                      <Input
                        value={formData.locations}
                        onChange={(e) => setFormData({ ...formData, locations: e.target.value })}
                        placeholder="e.g., San Francisco, Remote, New York"
                        className="h-11 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">
                          Min Experience (years)
                        </label>
                        <Input
                          type="number"
                          min={0}
                          max={50}
                          value={formData.experienceMin}
                          onChange={(e) =>
                            setFormData({ ...formData, experienceMin: parseInt(e.target.value) || 0 })
                          }
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">
                          Max Experience (years)
                        </label>
                        <Input
                          type="number"
                          min={0}
                          max={99}
                          value={formData.experienceMax}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              experienceMax: parseInt(e.target.value) || 99,
                            })
                          }
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Job Types
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {jobTypeOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              const newTypes = formData.jobTypes.includes(opt.value)
                                ? formData.jobTypes.filter((t) => t !== opt.value)
                                : [...formData.jobTypes, opt.value];
                              setFormData({ ...formData, jobTypes: newTypes });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              formData.jobTypes.includes(opt.value)
                                ? "bg-[#cb6ce6] text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Company Sizes
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {companySizeOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              const newSizes = formData.companySizes.includes(opt.value)
                                ? formData.companySizes.filter((s) => s !== opt.value)
                                : [...formData.companySizes, opt.value];
                              setFormData({ ...formData, companySizes: newSizes });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              formData.companySizes.includes(opt.value)
                                ? "bg-[#24c4b8] text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Excluded Companies (comma-separated)
                      </label>
                      <Input
                        value={formData.excludedCompanies}
                        onChange={(e) =>
                          setFormData({ ...formData, excludedCompanies: e.target.value })
                        }
                        placeholder="e.g., CompanyX, CompanyY"
                        className="h-11 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Run Frequency
                      </label>
                      <Select
                        value={formData.runFrequency}
                        onValueChange={(value) =>
                          setFormData({ ...formData, runFrequency: value })
                        }
                      >
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {frequencyOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleCreateAgent}
                      disabled={isSubmitting || !formData.name.trim()}
                      className="w-full h-12 rounded-xl bg-[#cb6ce6] hover:bg-[#b85ed4] shadow-lg shadow-[#cb6ce6]/25"
                    >
                      {isSubmitting ? "Creating..." : "Create Agent"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Agents List */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner />
            </div>
          ) : agents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-gradient-to-br from-[#cb6ce6]/20 to-[#cb6ce6]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-[#cb6ce6]" />
              </div>
              <h3 className="text-xl font-bold text-[#000000] mb-2">No Screening Agents</h3>
              <p className="text-gray-500 mb-6">
                Create your first agent to automatically discover job openings
              </p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-[#cb6ce6] hover:bg-[#b85ed4] text-white rounded-xl px-6"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Agent
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:border-[#cb6ce6]/40 hover:shadow-lg hover:shadow-[#cb6ce6]/5 transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#cb6ce6] to-[#9b4db5] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bot className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-[#000000] truncate">{agent.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            agent.isActive
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-400 text-white"
                          }`}
                        >
                          {agent.isActive ? "Active" : "Paused"}
                        </span>
                      </div>

                      {agent.description && (
                        <p className="text-sm text-gray-500 mb-2">{agent.description}</p>
                      )}

                      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                        {agent.searchKeywords && agent.searchKeywords.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Search className="w-3.5 h-3.5" />
                            {agent.searchKeywords.slice(0, 2).join(", ")}
                            {agent.searchKeywords.length > 2 && (
                              <span className="text-slate-400">
                                +{agent.searchKeywords.length - 2}
                              </span>
                            )}
                          </span>
                        )}
                        {agent.locations && agent.locations.length > 0 && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {agent.locations.slice(0, 2).join(", ")}
                            {agent.locations.length > 2 && (
                              <span className="text-slate-400">
                                +{agent.locations.length - 2}
                              </span>
                            )}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" />
                          {agent.experienceMin}-{agent.experienceMax === 99 ? "+" : agent.experienceMax} yrs
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Last run: {formatLastRun(agent.lastRunAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {agent.totalJobsFound} total jobs found
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRunAgent(agent.id)}
                        disabled={runningAgentId === agent.id}
                        className="h-9 px-3 rounded-lg border-slate-200 hover:border-[#24c4b8] hover:bg-[#24c4b8]/5"
                      >
                        {runningAgentId === agent.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        <span className="ml-1.5">Run</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAgent(agent.id)}
                        className="h-9 w-9 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
