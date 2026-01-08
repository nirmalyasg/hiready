import { useState, useEffect } from "react";
import {
  Clock,
  Trophy,
  Briefcase,
  Target,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Play,
  ArrowUpRight,
  Building2,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Plus,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Link } from "react-router-dom";
import SidebarLayout from "@/components/layout/sidebar-layout";
import { useQuery } from "@tanstack/react-query";

interface Skill {
  id: string;
  name: string;
  description: string;
  scenario_count: number;
}

interface DashboardStats {
  totalTime: string;
  completedScenarios: number;
  skillProgress: number;
  averageSessionDuration: string;
  uniqueSkillsPracticed: number;
  totalSessions: number;
  lastSessionDate: string;
  skillBreakdown: Record<string, number>;
}

interface SkillProgressData {
  skillId: number;
  skillName: string;
  sessionCount: number;
  avgScore: number | null;
  bestScore: number | null;
  frameworkUsed: string | null;
  frameworkMapping: string | null;
  lastPracticed: string | null;
  dimensions: Array<{ dimension: string; avgScore: number; count: number }>;
}

interface JobTarget {
  id: string;
  companyName: string | null;
  roleTitle: string;
  location: string | null;
  status: string;
  readinessScore: number | null;
  lastPracticedAt: string | null;
  jdParsed: {
    focusAreas?: string[];
  } | null;
}

export default function AvatarSimulatorDashboard() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillProgress, setSkillProgress] = useState<SkillProgressData[]>([]);
  const [showInsights, setShowInsights] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalTime: "0h 0m",
    completedScenarios: 0,
    skillProgress: 0,
    averageSessionDuration: "0m",
    uniqueSkillsPracticed: 0,
    totalSessions: 0,
    lastSessionDate: "-",
    skillBreakdown: {},
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSkills = async () => {
    const res = await fetch("/api/avatar/get-skills");
    const data = await res.json();
    if (!data.success) throw new Error("Failed to fetch skills");
    return data.skills;
  };

  const fetchTranscripts = async () => {
    try {
      const res = await fetch("/api/avatar/get-transcripts", { credentials: 'include' });
      const data = await res.json();
      if (!data.success) return [];
      return data.transcripts || [];
    } catch (error) {
      return [];
    }
  };

  const skillsQuery = useQuery({
    queryKey: ["/avatar/get-skills"],
    queryFn: fetchSkills,
  });

  const transcriptsQuery = useQuery({
    queryKey: ["/avatar/get-transcripts"],
    queryFn: fetchTranscripts,
    enabled: !!skillsQuery.data,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const fetchSkillProgress = async () => {
    try {
      const res = await fetch("/api/avatar/skill-progress", { credentials: 'include' });
      const data = await res.json();
      if (!data.success) return [];
      return data.skillProgress || [];
    } catch (error) {
      return [];
    }
  };

  const skillProgressQuery = useQuery({
    queryKey: ["/avatar/skill-progress"],
    queryFn: fetchSkillProgress,
    enabled: !!skillsQuery.data,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const fetchJobTargets = async () => {
    try {
      const res = await fetch("/api/jobs/job-targets", { credentials: 'include' });
      const data = await res.json();
      if (!data.success) return [];
      return data.jobs || [];
    } catch (error) {
      return [];
    }
  };

  const jobTargetsQuery = useQuery({
    queryKey: ["/jobs/job-targets"],
    queryFn: fetchJobTargets,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const fetchAIInsights = async () => {
    try {
      const res = await fetch("/api/jobs/ai-insights", { credentials: 'include' });
      const data = await res.json();
      if (!data.success) return null;
      return data;
    } catch (error) {
      return null;
    }
  };

  const aiInsightsQuery = useQuery({
    queryKey: ["/jobs/ai-insights"],
    queryFn: fetchAIInsights,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const aiInsights = aiInsightsQuery.data;

  const jobTargets: JobTarget[] = jobTargetsQuery.data || [];
  const activeJobs = jobTargets.filter(j => j.status !== 'archived' && j.status !== 'rejected');

  useEffect(() => {
    if (skillsQuery.data) {
      setSkills(skillsQuery.data);
    }
  }, [skillsQuery.data]);

  useEffect(() => {
    if (skillProgressQuery.data) {
      setSkillProgress(skillProgressQuery.data);
    }
  }, [skillProgressQuery.data]);

  useEffect(() => {
    if (skillsQuery.data) {
      const transcripts = transcriptsQuery.data || [];
      const progressData = skillProgressQuery.data || [];

      const skillOccurrences: Record<string, number> = {};
      const uniqueScenarios = new Set();
      const skillMap = new Map();
      let totalDuration = 0;
      let completedSessionsCount = 0;

      transcripts.forEach((transcript: any) => {
        if (transcript.knowledge_id) {
          uniqueScenarios.add(transcript.knowledge_id);
        }
        if (transcript.custom_scenario_id) {
          uniqueScenarios.add(`custom_${transcript.custom_scenario_id}`);
        }
        if (transcript.skill_id) {
          skillMap.set(transcript.skill_id, true);
          skillOccurrences[transcript.skill_id] =
            (skillOccurrences[transcript.skill_id] || 0) + 1;
        }
        const duration = parseInt(transcript.duration);
        if (!isNaN(duration) && duration > 0) {
          totalDuration += duration;
          completedSessionsCount++;
        }
      });

      const skillsWithAssessments = progressData.filter((sp: SkillProgressData) => sp.sessionCount > 0);
      skillsWithAssessments.forEach((sp: SkillProgressData) => {
        skillMap.set(sp.skillId, true);
      });

      const totalSkills = skillsQuery.data?.length || 1;
      const uniqueSkillsCount = skillMap.size;

      const hours = Math.floor(totalDuration / 3600);
      const minutes = Math.floor((totalDuration % 3600) / 60);

      const avgDuration =
        completedSessionsCount > 0
          ? Math.round(totalDuration / completedSessionsCount / 60)
          : 0;

      let lastSession = "-";
      if (transcripts.length > 0) {
        const sorted = [...transcripts].sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const lastDate = new Date(sorted[0].created_at);
        const now = new Date();
        const diffDays = Math.floor(
          (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays === 0) lastSession = "Today";
        else if (diffDays === 1) lastSession = "Yesterday";
        else if (diffDays < 7) lastSession = `${diffDays} days ago`;
        else lastSession = lastDate.toLocaleDateString();
      }

      setStats({
        totalTime: `${hours}h ${minutes}m`,
        completedScenarios: uniqueScenarios.size,
        skillProgress: Math.round((uniqueSkillsCount / totalSkills) * 100),
        averageSessionDuration: `${avgDuration}m`,
        uniqueSkillsPracticed: uniqueSkillsCount,
        totalSessions: completedSessionsCount,
        lastSessionDate: lastSession,
        skillBreakdown: skillOccurrences,
      });

      setIsLoading(false);
    }
  }, [skillsQuery.data, transcriptsQuery.data, skillProgressQuery.data]);

  const practicedSkills = skillProgress.filter((sp) => sp.sessionCount > 0);
  const topSkill = practicedSkills.length > 0
    ? practicedSkills.reduce((best, current) =>
        (current.avgScore || 0) > (best.avgScore || 0) ? current : best
      )
    : null;
  const lowestSkill = practicedSkills.length > 0
    ? practicedSkills.reduce((worst, current) =>
        (current.avgScore || 5) < (worst.avgScore || 5) ? current : worst
      )
    : null;

  const avgOverallScore = practicedSkills.length > 0
    ? practicedSkills.reduce((sum, sp) => sum + (sp.avgScore || 0), 0) / practicedSkills.length
    : 0;

  const getReadinessColor = (score: number | null) => {
    if (score === null) return "text-slate-400";
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-[#ee7e65]";
    return "text-slate-500";
  };

  if (isLoading || skillsQuery.isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner className="w-8 h-8" />
        </div>
      </SidebarLayout>
    );
  }

  const hasActivity = practicedSkills.length > 0 || activeJobs.length > 0;
  const primaryJob = activeJobs[0];
  const readinessPercent = avgOverallScore > 0 ? Math.round(avgOverallScore * 20) : null;

  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6 pb-24 sm:pb-8">
        
        {/* Header */}
        <div className="pt-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#042c4c]">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            {hasActivity ? "Here's your interview readiness at a glance." : "Start practicing to build your readiness."}
          </p>
        </div>

        {/* Hero KPI Strip */}
        {hasActivity && (
          <div className="bg-gradient-to-r from-[#042c4c] to-[#0a3d62] rounded-2xl p-5 sm:p-6 shadow-lg shadow-[#042c4c]/20">
            <div className="grid grid-cols-3 gap-4 sm:gap-8">
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-white">
                  {readinessPercent !== null ? `${readinessPercent}%` : '—'}
                </p>
                <p className="text-xs sm:text-sm text-white/60 mt-1">Readiness</p>
              </div>
              <div className="text-center border-x border-white/20">
                <p className="text-3xl sm:text-4xl font-bold text-white">{stats.totalTime}</p>
                <p className="text-xs sm:text-sm text-white/60 mt-1">Practice Time</p>
              </div>
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-white">{activeJobs.length}</p>
                <p className="text-xs sm:text-sm text-white/60 mt-1">Active Jobs</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Bar */}
        <div className="flex gap-3">
          <Link to="/readycheck" className="flex-1">
            <Button className="w-full gap-2 h-12 bg-gradient-to-r from-[#ee7e65] to-[#e06a50] hover:from-[#e06a50] hover:to-[#d55a40] shadow-lg shadow-[#ee7e65]/20">
              <Play className="w-4 h-4" />
              Practice Interview
            </Button>
          </Link>
          <Link to="/readycheck" className="flex-1">
            <Button variant="outline" className="w-full gap-2 h-12 border-[#ee7e65]/20 text-[#ee7e65] hover:bg-[#ee7e65]/5">
              <Plus className="w-4 h-4" />
              Add Job Target
            </Button>
          </Link>
        </div>

        {/* Recommended Practice */}
        {activeJobs.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-1 text-xs font-medium text-[#ee7e65] mb-3">
              <Zap className="w-3.5 h-3.5" />
              RECOMMENDED PRACTICE
            </div>
            <div className="space-y-3">
              {activeJobs.slice(0, 3).map((job) => {
                const readiness = job.readinessScore || 0;
                const needsBehavioral = readiness < 50;
                const needsTechnical = readiness < 70;
                const practiceType = needsBehavioral ? 'Behavioral' : needsTechnical ? 'Technical' : 'Mock Interview';
                
                return (
                  <Link key={job.id} to={`/jobs/${job.id}`} className="block">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-[#ee7e65]/5 hover:border-[#ee7e65]/20 border border-transparent transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#ee7e65]/10 text-[#ee7e65] font-medium">{practiceType}</span>
                        </div>
                        <p className="font-medium text-[#042c4c] mt-1 truncate">{job.roleTitle}</p>
                        {job.companyName && (
                          <p className="text-xs text-slate-500 truncate">{job.companyName}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${getReadinessColor(job.readinessScore)}`}>
                            {job.readinessScore !== null ? `${job.readinessScore}%` : '—'}
                          </p>
                          <p className="text-xs text-slate-400">ready</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#ee7e65] flex items-center justify-center">
                          <Play className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {activeJobs.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500 mb-3">Add job targets to get personalized practice recommendations</p>
                <Link to="/readycheck">
                  <Button variant="outline" size="sm" className="gap-2 border-[#ee7e65]/20 text-[#ee7e65]">
                    <Plus className="w-4 h-4" />
                    Add Job Target
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Skills Summary - Compact */}
        {practicedSkills.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#042c4c]">Your Skills</h3>
              <Link to="/avatar/results" className="text-sm text-[#ee7e65] hover:underline flex items-center gap-1">
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Strongest */}
              {topSkill && topSkill.avgScore !== null && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">Strongest</span>
                  </div>
                  <p className="font-medium text-[#042c4c] text-sm truncate">{topSkill.skillName}</p>
                  <p className="text-lg font-bold text-emerald-600 mt-1">{topSkill.avgScore.toFixed(1)}/5</p>
                </div>
              )}
              
              {/* Needs Work */}
              {lowestSkill && lowestSkill.avgScore !== null && (
                <div className="bg-[#ee7e65]/5 rounded-xl p-4 border border-[#ee7e65]/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-[#ee7e65]" />
                    <span className="text-xs font-medium text-[#ee7e65]">Focus Area</span>
                  </div>
                  <p className="font-medium text-[#042c4c] text-sm truncate">{lowestSkill.skillName}</p>
                  <p className="text-lg font-bold text-[#ee7e65] mt-1">{lowestSkill.avgScore.toFixed(1)}/5</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* More Job Targets */}
        {activeJobs.length > 1 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#042c4c]">Other Job Targets</h3>
              <Link to="/jobs" className="text-sm text-[#ee7e65] hover:underline flex items-center gap-1">
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-2">
              {activeJobs.slice(1, 3).map((job) => (
                <Link key={job.id} to={`/jobs/${job.id}`} className="block">
                  <div className="bg-white rounded-xl p-4 border border-slate-100 hover:border-[#ee7e65]/20 hover:shadow-sm transition-all flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#042c4c] truncate">{job.roleTitle}</p>
                      {job.companyName && (
                        <p className="text-sm text-slate-500 truncate">{job.companyName}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${getReadinessColor(job.readinessScore)}`}>
                        {job.readinessScore !== null ? `${job.readinessScore}%` : '—'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* AI Insights - Collapsible */}
        {aiInsights?.hasData && aiInsights.insights?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowInsights(!showInsights)}
              className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#ee7e65] to-[#f59e8b] rounded-xl flex items-center justify-center shadow-lg shadow-[#ee7e65]/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-[#042c4c]">AI Career Insights</h3>
                  <p className="text-sm text-slate-500">{aiInsights.insights.length} personalized insights</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showInsights ? 'rotate-180' : ''}`} />
            </button>
            
            {showInsights && (
              <div className="px-5 pb-5 space-y-3">
                {aiInsights.insights.slice(0, 3).map((insight: any, idx: number) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-xl ${
                      insight.type === "strength" ? "bg-emerald-50 border border-emerald-100" :
                      insight.type === "weakness" ? "bg-[#ee7e65]/5 border border-[#ee7e65]/10" :
                      "bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        insight.type === "strength" ? "bg-emerald-500" :
                        insight.type === "weakness" ? "bg-[#ee7e65]" :
                        "bg-[#042c4c]"
                      }`}>
                        {insight.type === "strength" ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : insight.type === "weakness" ? (
                          <Target className="w-4 h-4 text-white" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${
                          insight.type === "strength" ? "text-emerald-800" :
                          insight.type === "weakness" ? "text-[#ee7e65]" :
                          "text-[#042c4c]"
                        }`}>
                          {insight.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!hasActivity && (
          <div className="bg-gradient-to-br from-[#042c4c] to-[#0a3d62] rounded-2xl p-8 text-center relative overflow-hidden shadow-xl shadow-[#042c4c]/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Start Your Interview Journey</h2>
              <p className="text-white/60 mb-6 max-w-sm mx-auto">
                Complete your first practice session to get personalized recommendations and track your progress.
              </p>
              <div className="flex justify-center gap-3">
                <Link to="/readycheck">
                  <Button className="bg-white text-[#ee7e65] hover:bg-white/90 shadow-lg">
                    Start Practice
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Activity Footer */}
        {hasActivity && (
          <div className="flex items-center justify-between text-sm text-slate-400 pt-2">
            <span>Last session: {stats.lastSessionDate}</span>
            <span>{stats.totalSessions} total sessions</span>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
