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
  Lock,
  Flame,
  Calendar,
  Award,
  BarChart3
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
    if (score === null) return "bg-slate-200";
    if (score >= 70) return "bg-emerald-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-red-400";
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'applied': return { label: 'Applied', bg: 'bg-[#ee7e65]', text: 'text-white' };
      case 'interview': return { label: 'Interviewing', bg: 'bg-[#ee7e65]', text: 'text-white' };
      case 'offer': return { label: 'Offer', bg: 'bg-emerald-500', text: 'text-white' };
      case 'rejected': return { label: 'Rejected', bg: 'bg-red-500', text: 'text-white' };
      case 'saved': return { label: 'Saved', bg: 'bg-[#000000]', text: 'text-white' };
      default: return { label: 'Active', bg: 'bg-slate-500', text: 'text-white' };
    }
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
  const readinessPercent = avgOverallScore > 0 ? Math.round(avgOverallScore * 20) : 0;

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#fbfbfc]">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold text-[#000000]">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Here's your interview readiness at a glance</p>
          </div>

          {/* Stats Hero Bar */}
          <div className="bg-[#000000] rounded-2xl p-6 shadow-xl">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-4xl font-bold text-[#ee7e65]">{readinessPercent}%</p>
                <p className="text-white/70 text-sm mt-1">Readiness</p>
              </div>
              <div className="border-x border-white/20">
                <p className="text-4xl font-bold text-white">{stats.totalTime}</p>
                <p className="text-white/70 text-sm mt-1">Practice Time</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-white">{activeJobs.length}</p>
                <p className="text-white/70 text-sm mt-1">Active Jobs</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Link to="/interview" className="block">
              <Button className="w-full h-12 bg-[#ee7e65] hover:bg-[#e06d54] text-white font-semibold rounded-xl shadow-lg shadow-[#ee7e65]/25 gap-2">
                <Play className="w-5 h-5" />
                Practice Interview
              </Button>
            </Link>
            <Link to="/jobs" className="block">
              <Button variant="outline" className="w-full h-12 border-2 border-[#000000] text-[#000000] font-semibold rounded-xl hover:bg-[#000000]/5 gap-2">
                <Plus className="w-5 h-5" />
                Add Job Target
              </Button>
            </Link>
          </div>

          {/* Recommended Practice Section */}
          {activeJobs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#ee7e65]" />
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Recommended Practice</h2>
              </div>
              <div className="space-y-3">
                {activeJobs.slice(0, 3).map((job) => {
                  const readiness = job.readinessScore || 0;
                  const statusBadge = getStatusBadge(job.status);
                  
                  return (
                    <Link key={job.id} to={`/jobs/${job.id}`}>
                      <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg hover:border-[#ee7e65]/30 transition-all duration-200 group">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.text} mb-2`}>
                              {statusBadge.label}
                            </span>
                            <h3 className="font-semibold text-[#000000] group-hover:text-[#ee7e65] transition-colors">{job.roleTitle}</h3>
                            <p className="text-sm text-gray-500">{job.companyName || 'Company'}</p>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <p className="text-lg font-bold text-[#000000]">{readiness}%</p>
                              <p className="text-xs text-gray-500">ready</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-[#ee7e65] group-hover:text-[#ee7e65] group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${getReadinessColor(readiness)}`}
                              style={{ width: `${readiness}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Your Skills Section */}
          {(topSkill || lowestSkill) && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#000000]">Your Skills</h2>
                <Link to="/avatar/results" className="text-sm text-[#ee7e65] hover:text-[#e06d54] font-medium flex items-center gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {topSkill && topSkill.avgScore !== null && (
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Trophy className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Strongest</span>
                    </div>
                    <h3 className="font-semibold text-[#000000] mb-1">{topSkill.skillName}</h3>
                    <p className="text-2xl font-bold text-emerald-600">{topSkill.avgScore.toFixed(1)}/5</p>
                  </div>
                )}
                {lowestSkill && lowestSkill.avgScore !== null && (
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-[#ee7e65] flex items-center justify-center">
                        <Target className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-[#ee7e65] uppercase tracking-wide">Focus Area</span>
                    </div>
                    <h3 className="font-semibold text-[#000000] mb-1">{lowestSkill.skillName}</h3>
                    <p className="text-2xl font-bold text-[#ee7e65]">{lowestSkill.avgScore.toFixed(1)}/5</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Coaching Insights */}
          {aiInsights?.hasData && aiInsights.insights?.length > 0 && (
            <div className="bg-gradient-to-r from-[#000000] to-[#042c4c] rounded-xl p-5 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-[#ee7e65]" />
                <h3 className="font-semibold">AI Coaching Insights</h3>
              </div>
              <div className="space-y-3">
                {aiInsights.insights.slice(0, 2).map((insight: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 bg-white/10 rounded-lg p-3">
                    {insight.type === "strength" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    ) : insight.type === "weakness" ? (
                      <Target className="w-5 h-5 text-[#ee7e65] flex-shrink-0" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-white">{insight.title}</p>
                      <p className="text-sm text-white/70">{insight.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Job Targets */}
          {activeJobs.length > 3 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#000000]">Other Job Targets</h2>
                <Link to="/jobs" className="text-sm text-[#ee7e65] hover:text-[#e06d54] font-medium flex items-center gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {activeJobs.slice(3, 7).map((job) => (
                  <Link key={job.id} to={`/jobs/${job.id}`}>
                    <div className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md hover:border-[#ee7e65]/30 transition-all">
                      <p className="font-medium text-[#000000] text-sm truncate">{job.roleTitle}</p>
                      <p className="text-xs text-gray-500 truncate">{job.companyName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!hasActivity && (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#ee7e65] to-[#e06d54] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#ee7e65]/30">
                <Play className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#000000] mb-3">Start Your Journey</h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Complete your first interview practice to see your progress and get personalized recommendations.
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/interview">
                  <Button className="bg-[#ee7e65] hover:bg-[#e06d54] text-white font-semibold px-8 h-12 rounded-xl shadow-lg shadow-[#ee7e65]/25 gap-2">
                    <Play className="w-5 h-5" />
                    Start Practice
                  </Button>
                </Link>
                <Link to="/jobs">
                  <Button variant="outline" className="border-2 border-[#000000] text-[#000000] font-semibold px-8 h-12 rounded-xl hover:bg-[#000000]/5 gap-2">
                    <Plus className="w-5 h-5" />
                    Add Job
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Activity Summary Footer */}
          {hasActivity && (
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500 pt-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Last session: {stats.lastSessionDate}</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" />
                <span>{stats.totalSessions} total sessions</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </SidebarLayout>
  );
}
