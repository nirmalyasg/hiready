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
  Zap,
  Crown,
  Lock
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

  const fetchSubscriptionStatus = async () => {
    try {
      const res = await fetch("/api/payments/subscription-status", { credentials: 'include' });
      const data = await res.json();
      if (!data.success) return null;
      return data;
    } catch (error) {
      return null;
    }
  };

  const subscriptionQuery = useQuery({
    queryKey: ["/payments/subscription-status"],
    queryFn: fetchSubscriptionStatus,
    staleTime: 60000,
  });

  const subscription = subscriptionQuery.data;

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
    if (score >= 60) return "text-amber-600";
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
      <div className="max-w-3xl mx-auto space-y-6 pb-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-0.5">Your interview preparation at a glance</p>
          </div>
          <Link to="/readycheck">
            <Button className="h-9 px-4 gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg">
              <Play className="w-4 h-4" />
              Practice
            </Button>
          </Link>
        </div>

        {/* Stats Row */}
        {hasActivity && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-2xl font-semibold text-slate-900">
                {readinessPercent !== null ? `${readinessPercent}%` : '—'}
              </p>
              <p className="text-sm text-slate-500 mt-0.5">Readiness</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-2xl font-semibold text-slate-900">{stats.totalTime}</p>
              <p className="text-sm text-slate-500 mt-0.5">Practice time</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-2xl font-semibold text-slate-900">{activeJobs.length}</p>
              <p className="text-sm text-slate-500 mt-0.5">Active jobs</p>
            </div>
          </div>
        )}

        {/* Subscription Status */}
        {subscription && !subscription.hasPro && (
          <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                {subscription.hasPro ? <Crown className="w-4 h-4 text-slate-600" /> : <Lock className="w-4 h-4 text-slate-400" />}
              </div>
              <div>
                <p className="font-medium text-slate-900 text-sm">
                  {subscription.hasPro ? "Pro Member" : "Free Plan"}
                </p>
                <p className="text-xs text-slate-500">
                  {subscription.rolePacks?.length || 0} role pack(s)
                </p>
              </div>
            </div>
            <Link to="/pricing">
              <Button size="sm" className="h-8 px-3 text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white">
                Upgrade
              </Button>
            </Link>
          </div>
        )}

        {/* Active Jobs */}
        {activeJobs.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-medium text-slate-900 text-sm">Your Jobs</h2>
              <Link to="/jobs" className="text-xs text-slate-500 hover:text-slate-700">View all</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {activeJobs.slice(0, 3).map((job) => {
                const readiness = job.readinessScore || 0;
                
                return (
                  <Link key={job.id} to={`/jobs/${job.id}`} className="block px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{job.roleTitle}</p>
                        {job.companyName && (
                          <p className="text-xs text-slate-500 truncate">{job.companyName}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${getReadinessColor(job.readinessScore)}`}>
                          {job.readinessScore !== null ? `${job.readinessScore}%` : '—'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Skills Summary */}
        {practicedSkills.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-medium text-slate-900 text-sm">Skills</h2>
              <Link to="/avatar/results" className="text-xs text-slate-500 hover:text-slate-700">View all</Link>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              {topSkill && topSkill.avgScore !== null && (
                <div className="p-4">
                  <p className="text-xs text-slate-500 mb-1">Strongest</p>
                  <p className="font-medium text-slate-900 text-sm truncate">{topSkill.skillName}</p>
                  <p className="text-lg font-semibold text-emerald-600 mt-1">{topSkill.avgScore.toFixed(1)}/5</p>
                </div>
              )}
              {lowestSkill && lowestSkill.avgScore !== null && (
                <div className="p-4">
                  <p className="text-xs text-slate-500 mb-1">Focus area</p>
                  <p className="font-medium text-slate-900 text-sm truncate">{lowestSkill.skillName}</p>
                  <p className="text-lg font-semibold text-amber-600 mt-1">{lowestSkill.avgScore.toFixed(1)}/5</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Insights */}
        {aiInsights?.hasData && aiInsights.insights?.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => setShowInsights(!showInsights)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <span className="font-medium text-slate-900 text-sm">AI Insights</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showInsights ? 'rotate-180' : ''}`} />
            </button>
            {showInsights && (
              <div className="px-4 pb-4 space-y-2 border-t border-slate-100 pt-3">
                {aiInsights.insights.slice(0, 3).map((insight: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    {insight.type === "strength" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    ) : insight.type === "weakness" ? (
                      <Target className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-slate-900">{insight.title}</p>
                      <p className="text-xs text-slate-500">{insight.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!hasActivity && (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Play className="w-6 h-6 text-slate-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Start Practicing</h2>
            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
              Complete your first interview practice to see your progress and get personalized recommendations.
            </p>
            <Link to="/readycheck">
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white">
                Start Practice
              </Button>
            </Link>
          </div>
        )}

        {/* Activity Footer */}
        {hasActivity && (
          <p className="text-xs text-slate-400 text-center">
            Last session: {stats.lastSessionDate} · {stats.totalSessions} total sessions
          </p>
        )}
      </div>
    </SidebarLayout>
  );
}
