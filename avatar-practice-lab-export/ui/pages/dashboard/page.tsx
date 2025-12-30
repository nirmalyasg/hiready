import { useState, useEffect } from "react";
import {
  Clock,
  Users,
  Trophy,
  ArrowRight,
  Briefcase,
  Users2,
  MessageSquare,
  UserPlus,
  Video,
  Award,
  BarChart3,
  Target,
  Brain,
  TrendingUp,
  Zap,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import ModernDashboardLayout from "@/components/layout/modern-dashboard-layout";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import { useQuery } from "@tanstack/react-query";

interface Skill {
  id: string;
  name: string;
  description: string;
  scenario_count: number;
}

interface Transcript {
  id: string;
  skill_id: string;
  knowledge_id: string;
  streaming_sessions: any[];
  messages: any[];
  created_at: string;
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
        
        // Also count custom scenarios
        if (transcript.custom_scenario_id) {
          uniqueScenarios.add(`custom_${transcript.custom_scenario_id}`);
        }

        if (transcript.skill_id) {
          skillMap.set(transcript.skill_id, true);
          skillOccurrences[transcript.skill_id] =
            (skillOccurrences[transcript.skill_id] || 0) + 1;
        }

        // Use transcript.duration directly (in seconds)
        const duration = parseInt(transcript.duration);
        if (!isNaN(duration) && duration > 0) {
          totalDuration += duration;
          completedSessionsCount++;
        }
      });
      
      // Count skills from skill assessments (more accurate)
      const skillsWithAssessments = progressData.filter((sp: SkillProgressData) => sp.sessionCount > 0);
      skillsWithAssessments.forEach((sp: SkillProgressData) => {
        skillMap.set(sp.skillId, true);
      });

      // totalDuration is in seconds, convert properly
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
            ? Math.min(
                Math.round((skillMap.size / skillsQuery.data.length) * 100),
                100,
              )
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

  const getSkillIcon = (skillName: string) => {
    const icons: Record<string, any> = {
      "Business Communication": Briefcase,
      "Team Collaboration": Users,
      "Public Speaking": MessageSquare,
      Negotiation: Users2,
      "Conflict Resolution": UserPlus,
      "Job Interviews": Video,
    };
    return icons[skillName] || Trophy;
  };

  if (isLoading) {
    return (
      <ModernDashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <Spinner size="lg" />
        </div>
      </ModernDashboardLayout>
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

  return (
    <ModernDashboardLayout>
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 pb-16 sm:pb-0 px-3 sm:px-4 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-brand-dark">Dashboard</h1>
            <p className="text-xs sm:text-base text-brand-dark/60">
              {practicedSkills.length > 0 
                ? `${stats.totalSessions} sessions across ${practicedSkills.length} skills`
                : 'Start practicing to track your progress'}
            </p>
          </div>
          <Link to="/avatar/start" className="w-full sm:w-auto">
            <Button className="bg-brand-primary hover:bg-brand-dark text-white px-6 w-full sm:w-auto" data-testid="button-start-voice-practice">
              Start Practice
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-3 md:gap-4 md:grid-cols-4">
          <Card className="p-3 sm:p-4 border border-brand-light/30 bg-white">
            <p className="text-[10px] sm:text-xs text-brand-dark/60 font-medium uppercase tracking-wide">Practice Time</p>
            <p className="text-xl sm:text-2xl font-bold text-brand-dark mt-1">{stats.totalTime}</p>
          </Card>
          <Card className="p-3 sm:p-4 border border-brand-light/30 bg-white">
            <p className="text-[10px] sm:text-xs text-brand-dark/60 font-medium uppercase tracking-wide">Scenarios</p>
            <p className="text-xl sm:text-2xl font-bold text-brand-dark mt-1">{stats.completedScenarios}</p>
          </Card>
          <Card className="p-3 sm:p-4 border border-brand-light/30 bg-white">
            <p className="text-[10px] sm:text-xs text-brand-dark/60 font-medium uppercase tracking-wide">Skills</p>
            <p className="text-xl sm:text-2xl font-bold text-brand-dark mt-1">{stats.uniqueSkillsPracticed}</p>
          </Card>
          <Card className="p-3 sm:p-4 border border-brand-light/30 bg-white">
            <p className="text-[10px] sm:text-xs text-brand-dark/60 font-medium uppercase tracking-wide">Avg Score</p>
            <p className="text-xl sm:text-2xl font-bold text-brand-dark mt-1">{avgOverallScore > 0 ? `${avgOverallScore.toFixed(1)}/5` : '-'}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
          <div className="md:col-span-2 space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6 border border-brand-light/30 bg-white">
              <h2 className="text-base sm:text-lg font-semibold text-brand-dark mb-3 sm:mb-4">What to Practice Next</h2>
              
              {lowestSkill && lowestSkill.avgScore !== null ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-brand-accent/10 border border-brand-accent/30">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-brand-accent font-medium">Recommended Focus</p>
                        <h3 className="text-lg font-semibold text-brand-dark mt-1">{lowestSkill.skillName}</h3>
                        <p className="text-sm text-brand-dark/60 mt-1">
                          Current score: {lowestSkill.avgScore.toFixed(1)}/5
                        </p>
                      </div>
                      <Link to="/avatar/start">
                        <Button size="sm" className="bg-brand-accent hover:bg-brand-accent/90 text-white">
                          Practice
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {getRecommendedSkills().length > 0 && (
                    <div>
                      <p className="text-sm text-slate-500 mb-2">Other skills to try:</p>
                      <div className="flex flex-wrap gap-2">
                        {getRecommendedSkills().slice(0, 4).map((sp) => (
                          <Link key={sp.skillId} to="/avatar/start" className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-sm text-slate-700 transition-colors">
                            {sp.skillName}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-slate-600 mb-4">
                    Start practicing to get personalized recommendations
                  </p>
                  <Link to="/avatar/start">
                    <Button className="bg-brand-primary hover:bg-brand-dark text-white">
                      Start Your First Session
                    </Button>
                  </Link>
                </div>
              )}
            </Card>

            {practicedSkills.length > 0 && (
              <Card className="p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Skills at a Glance</h2>
                  <Link to="/avatar/results" className="text-sm text-brand-primary hover:underline">
                    View all
                  </Link>
                </div>
                
                <div className="space-y-3">
                  {practicedSkills.slice(0, 5).map((sp) => {
                    const scoreColor = sp.avgScore !== null 
                      ? sp.avgScore >= 4 ? 'text-green-600' 
                      : sp.avgScore >= 2.5 ? 'text-amber-600' 
                      : 'text-red-600'
                      : 'text-slate-400';
                    
                    return (
                      <div key={sp.skillId} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <span className="text-sm text-slate-700">{sp.skillName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">{sp.sessionCount} sessions</span>
                          <span className={`text-sm font-semibold ${scoreColor}`}>
                            {sp.avgScore?.toFixed(1) || '-'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {topSkill && topSkill.avgScore !== null && (
              <Card className="p-5 border border-green-200 bg-green-50">
                <p className="text-xs text-green-700 font-medium uppercase tracking-wide">Your Strongest</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{topSkill.skillName}</p>
                <p className="text-sm text-green-700 mt-1">{topSkill.avgScore.toFixed(1)}/5</p>
              </Card>
            )}

            <Card className="p-5 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4">Activity</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Last session</span>
                  <span className="text-slate-900">{stats.lastSessionDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Avg duration</span>
                  <span className="text-slate-900">{stats.averageSessionDuration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Skills explored</span>
                  <span className="text-slate-900">{stats.skillProgress}%</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link to="/avatar/start" className="block p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-sm text-slate-700">
                  Think something through
                </Link>
                <Link to="/avatar/practice" className="block p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-sm text-slate-700">
                  Practice a scenario
                </Link>
                <Link to="/avatar/practice/custom-scenario" className="block p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-sm text-slate-700">
                  Create custom situation
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <MobileBottomNav />
    </ModernDashboardLayout>
  );
}
