import { useState, useEffect } from "react";
import {
  Clock,
  Trophy,
  Briefcase,
  Users,
  MessageSquare,
  UserPlus,
  Video,
  BarChart3,
  Target,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Play,
  Zap,
  ArrowUpRight,
  MapPin,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Calendar
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

      const hours = Math.floor(totalDuration / 3600);
      const minutes = Math.floor((totalDuration % 3600) / 60);
      const avgDurationSeconds = transcripts.length
        ? Math.round(totalDuration / transcripts.length)
        : 0;
      const avgDurationMinutes = Math.round(avgDurationSeconds / 60);
      const lastSession = transcripts[0]?.created_at
        ? new Date(transcripts[0].created_at).toLocaleDateString()
        : "-";

      setStats({
        totalTime: `${hours}h ${minutes}m`,
        completedScenarios: uniqueScenarios.size,
        skillProgress:
          skillsQuery.data.length > 0
            ? Math.min(Math.round((skillMap.size / skillsQuery.data.length) * 100), 100)
            : 0,
        averageSessionDuration: `${avgDurationMinutes}m`,
        uniqueSkillsPracticed: skillMap.size,
        totalSessions: completedSessionsCount,
        lastSessionDate: lastSession,
        skillBreakdown: skillOccurrences,
      });

      setIsLoading(false);
    }
  }, [skillsQuery.data, transcriptsQuery.data, skillProgressQuery.data]);

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <Spinner size="lg" />
        </div>
      </SidebarLayout>
    );
  }

  const practicedSkills = skillProgress.filter(sp => sp.sessionCount > 0);
  const avgOverallScore = practicedSkills.length > 0
    ? practicedSkills.reduce((sum, sp) => sum + (sp.avgScore || 0), 0) / practicedSkills.length
    : 0;
  const topSkill = practicedSkills.length > 0
    ? practicedSkills.reduce((best, sp) => (sp.avgScore || 0) > (best.avgScore || 0) ? sp : best)
    : null;
  const lowestSkill = practicedSkills.length > 1
    ? practicedSkills.reduce((worst, sp) => (sp.avgScore || 5) < (worst.avgScore || 5) ? sp : worst)
    : null;

  const getRecommendedSkills = () => {
    const unpracticed = skillProgress.filter(sp => sp.sessionCount === 0);
    if (lowestSkill && lowestSkill.frameworkMapping) {
      const relatedSkills = unpracticed.filter(sp =>
        sp.frameworkMapping === lowestSkill.frameworkMapping
      ).slice(0, 3);
      if (relatedSkills.length > 0) return relatedSkills;
    }
    return unpracticed.slice(0, 3);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'interview':
        return { label: 'Interview Scheduled', color: 'bg-purple-100 text-purple-700' };
      case 'applied':
        return { label: 'Applied', color: 'bg-blue-100 text-blue-700' };
      case 'offer':
        return { label: 'Offer Received', color: 'bg-green-100 text-green-700' };
      default:
        return { label: 'Saved', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const getReadinessColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-brand-dark">Interview Readiness</h1>
            <p className="text-brand-muted mt-1">
              {activeJobs.length > 0
                ? `Tracking ${activeJobs.length} job target${activeJobs.length !== 1 ? 's' : ''}`
                : 'Add your target jobs to start preparing'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/jobs">
              <Button variant="outline" className="gap-2">
                <Briefcase className="w-4 h-4" />
                Manage Jobs
              </Button>
            </Link>
            <Link to="/interview/custom">
              <Button className="gap-2" data-testid="button-start-voice-practice">
                <Play className="w-4 h-4" />
                Practice Interview
              </Button>
            </Link>
          </div>
        </div>

        {/* Active Job Targets Section */}
        {activeJobs.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                <Target className="w-5 h-5 text-brand-accent" />
                Your Job Targets
              </h2>
              <Link to="/jobs" className="text-sm text-brand-accent font-medium hover:underline flex items-center gap-1">
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeJobs.slice(0, 3).map((job) => {
                const statusBadge = getStatusBadge(job.status);
                const weakestArea = job.jdParsed?.focusAreas?.[0] || null;
                return (
                  <div key={job.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-brand-accent/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-brand-dark truncate">{job.roleTitle}</h3>
                        {job.companyName && (
                          <p className="text-sm text-brand-muted flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3.5 h-3.5" />
                            {job.companyName}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-brand-muted uppercase tracking-wide">Readiness</p>
                        <p className={`text-2xl font-bold ${getReadinessColor(job.readinessScore)}`}>
                          {job.readinessScore !== null ? `${job.readinessScore}%` : '—'}
                        </p>
                      </div>
                      {weakestArea && (
                        <div className="text-right">
                          <p className="text-xs text-brand-muted uppercase tracking-wide">Focus Area</p>
                          <p className="text-sm font-medium text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {weakestArea}
                          </p>
                        </div>
                      )}
                    </div>

                    <Link to={`/interview/custom?jobId=${job.id}`}>
                      <Button size="sm" className="w-full gap-2">
                        <Play className="w-3.5 h-3.5" />
                        Practice Now
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state for no jobs */}
        {activeJobs.length === 0 && (
          <div className="bg-gradient-to-br from-brand-dark to-brand-dark/90 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-accent/20 rounded-full text-brand-accent text-sm font-medium mb-4">
                <Briefcase className="w-3.5 h-3.5" />
                Get Started
              </div>
              <h2 className="text-2xl font-bold mb-2">Add Your First Job Target</h2>
              <p className="text-white/60 mb-6 max-w-md">
                Import a job from LinkedIn, Indeed, or any job board. We'll help you prepare with personalized practice.
              </p>
              <Link to="/jobs">
                <Button className="bg-white text-brand-dark hover:bg-white/90">
                  Add Job Target
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-brand-dark/10 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-brand-dark" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-brand-dark">{stats.totalTime}</p>
            <p className="text-sm text-brand-muted">Total practice</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-brand-accent/10 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-brand-accent" />
              </div>
            </div>
            <p className="text-2xl font-bold text-brand-dark">{stats.completedScenarios}</p>
            <p className="text-sm text-brand-muted">Scenarios done</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-brand-dark">{stats.uniqueSkillsPracticed}</p>
            <p className="text-sm text-brand-muted">Skills practiced</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-brand-dark">{avgOverallScore > 0 ? avgOverallScore.toFixed(1) : '-'}</p>
            <p className="text-sm text-brand-muted">Avg score</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Readiness Snapshot */}
            {practicedSkills.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-brand-accent" />
                    Your Readiness Snapshot
                  </h3>
                  <Link to="/avatar/results" className="text-sm text-brand-accent font-medium hover:underline flex items-center gap-1">
                    View details
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Strongest Areas */}
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Strongest Areas
                    </p>
                    <div className="space-y-2">
                      {practicedSkills
                        .filter(sp => sp.avgScore !== null)
                        .sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0))
                        .slice(0, 3)
                        .map((sp) => (
                          <div key={sp.skillId} className="flex items-center justify-between p-2 rounded-lg bg-green-50">
                            <span className="text-sm text-brand-dark">{sp.skillName}</span>
                            <span className="text-sm font-bold text-green-600">{sp.avgScore?.toFixed(1)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  {/* Needs Work */}
                  <div>
                    <p className="text-sm font-medium text-amber-700 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Needs Work
                    </p>
                    <div className="space-y-2">
                      {practicedSkills
                        .filter(sp => sp.avgScore !== null)
                        .sort((a, b) => (a.avgScore || 5) - (b.avgScore || 5))
                        .slice(0, 3)
                        .map((sp) => (
                          <div key={sp.skillId} className="flex items-center justify-between p-2 rounded-lg bg-amber-50">
                            <span className="text-sm text-brand-dark">{sp.skillName}</span>
                            <span className="text-sm font-bold text-amber-600">{sp.avgScore?.toFixed(1)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recommended Next Actions */}
            {(lowestSkill || activeJobs.length > 0) && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-brand-dark mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-accent" />
                  Recommended Next Actions
                </h3>
                <div className="space-y-3">
                  {activeJobs.length > 0 && activeJobs[0] && (
                    <Link 
                      to={`/interview/custom?jobId=${activeJobs[0].id}`}
                      className="flex items-center gap-4 p-4 rounded-xl bg-brand-dark/5 hover:bg-brand-dark/10 transition-colors"
                    >
                      <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-brand-dark">Practice for {activeJobs[0].roleTitle}</p>
                        <p className="text-sm text-brand-muted">
                          {activeJobs[0].companyName ? `at ${activeJobs[0].companyName}` : 'Interview simulation'}
                        </p>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-brand-accent" />
                    </Link>
                  )}
                  {lowestSkill && lowestSkill.avgScore !== null && (
                    <Link 
                      to="/avatar/start"
                      className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors"
                    >
                      <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-brand-dark">Improve {lowestSkill.skillName}</p>
                        <p className="text-sm text-brand-muted">
                          Current score: {lowestSkill.avgScore.toFixed(1)}/5
                        </p>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-amber-600" />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Empty state for new users */}
            {practicedSkills.length === 0 && activeJobs.length === 0 && (
              <div className="bg-gradient-to-br from-brand-dark to-brand-dark/90 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-white/80 text-sm font-medium mb-4">
                    <Play className="w-3.5 h-3.5" />
                    Get started
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Begin Your Interview Journey</h2>
                  <p className="text-white/60 mb-6">
                    Start by adding a job target or complete your first practice session.
                  </p>
                  <div className="flex gap-3">
                    <Link to="/jobs">
                      <Button className="bg-white text-brand-dark hover:bg-white/90">
                        Add Job Target
                      </Button>
                    </Link>
                    <Link to="/interview/custom">
                      <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                        Quick Practice
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Overall Score */}
            {avgOverallScore > 0 && (
              <div className="bg-gradient-to-br from-brand-dark to-brand-dark/90 rounded-2xl p-6 text-white">
                <p className="text-sm text-white/60 mb-1">Overall Readiness</p>
                <p className="text-4xl font-bold">{Math.round(avgOverallScore * 20)}%</p>
                <p className="text-sm text-white/60 mt-2">Based on {practicedSkills.length} skill areas</p>
              </div>
            )}

            {/* Top Skill */}
            {topSkill && topSkill.avgScore !== null && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mb-4">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm text-green-700 font-medium mb-1">Your strongest skill</p>
                <p className="text-xl font-bold text-brand-dark">{topSkill.skillName}</p>
                <p className="text-sm text-green-600 font-medium mt-1">{topSkill.avgScore.toFixed(1)}/5</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-brand-dark mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link to="/interview/custom" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-brand-dark">Interview practice</p>
                    <p className="text-xs text-brand-muted">Simulate real interviews</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-brand-muted" />
                </Link>

                <Link to="/jobs" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="w-10 h-10 bg-brand-accent/10 rounded-xl flex items-center justify-center group-hover:bg-brand-accent/20 transition-colors">
                    <Target className="w-5 h-5 text-brand-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-brand-dark">Add job target</p>
                    <p className="text-xs text-brand-muted">Import from any job board</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-brand-muted" />
                </Link>

                <Link to="/avatar/results" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="w-10 h-10 bg-brand-dark/5 rounded-xl flex items-center justify-center group-hover:bg-brand-dark/10 transition-colors">
                    <BarChart3 className="w-5 h-5 text-brand-dark" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-brand-dark">View results</p>
                    <p className="text-xs text-brand-muted">Track your progress</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-brand-muted" />
                </Link>
              </div>
            </div>

            {/* Activity */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-brand-dark mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-muted">Last session</span>
                  <span className="text-sm font-medium text-brand-dark">{stats.lastSessionDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-muted">Avg duration</span>
                  <span className="text-sm font-medium text-brand-dark">{stats.averageSessionDuration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-muted">Skills explored</span>
                  <span className="text-sm font-medium text-brand-dark">{stats.skillProgress}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
