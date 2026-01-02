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
      <div className="max-w-5xl mx-auto space-y-6 pb-20 sm:pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Dashboard</h1>
            <p className="text-sm sm:text-base text-brand-muted mt-1">
              {practicedSkills.length > 0 
                ? `${stats.totalSessions} sessions across ${practicedSkills.length} skills`
                : 'Start practicing to track your progress'}
            </p>
          </div>
          <Link to="/avatar/start" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto" data-testid="button-start-voice-practice">
              Start Practice
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="p-5">
            <p className="text-xs text-brand-muted font-medium uppercase tracking-wider">Practice Time</p>
            <p className="text-2xl sm:text-3xl font-bold text-brand-dark mt-2">{stats.totalTime}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs text-brand-muted font-medium uppercase tracking-wider">Scenarios</p>
            <p className="text-2xl sm:text-3xl font-bold text-brand-dark mt-2">{stats.completedScenarios}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs text-brand-muted font-medium uppercase tracking-wider">Skills</p>
            <p className="text-2xl sm:text-3xl font-bold text-brand-dark mt-2">{stats.uniqueSkillsPracticed}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs text-brand-muted font-medium uppercase tracking-wider">Avg Score</p>
            <p className="text-2xl sm:text-3xl font-bold text-brand-dark mt-2">{avgOverallScore > 0 ? `${avgOverallScore.toFixed(1)}/5` : '-'}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-brand-dark mb-4">What to Practice Next</h2>
              
              {lowestSkill && lowestSkill.avgScore !== null ? (
                <div className="space-y-5">
                  <div className="p-5 rounded-xl bg-brand-accent/10 border border-brand-accent/20">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-brand-accent font-semibold">Recommended Focus</p>
                        <h3 className="text-xl font-bold text-brand-dark mt-1">{lowestSkill.skillName}</h3>
                        <p className="text-sm text-brand-muted mt-2">
                          Current score: {lowestSkill.avgScore.toFixed(1)}/5
                        </p>
                      </div>
                      <Link to="/avatar/start">
                        <Button size="sm" variant="destructive">
                          Practice
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {getRecommendedSkills().length > 0 && (
                    <div>
                      <p className="text-sm text-brand-muted mb-3">Other skills to try:</p>
                      <div className="flex flex-wrap gap-2">
                        {getRecommendedSkills().slice(0, 4).map((sp) => (
                          <Link key={sp.skillId} to="/avatar/start" className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-sm font-medium text-brand-dark transition-colors duration-200">
                            {sp.skillName}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-brand-muted" />
                  </div>
                  <p className="text-brand-muted mb-4">
                    Start practicing to get personalized recommendations
                  </p>
                  <Link to="/avatar/start">
                    <Button>
                      Start Your First Session
                    </Button>
                  </Link>
                </div>
              )}
            </Card>

            {practicedSkills.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-brand-dark">Skills at a Glance</h2>
                  <Link to="/avatar/results" className="text-sm text-brand-accent font-medium hover:underline">
                    View all
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {practicedSkills.slice(0, 5).map((sp) => {
                    const scoreColor = sp.avgScore !== null 
                      ? sp.avgScore >= 4 ? 'text-green-600' 
                      : sp.avgScore >= 2.5 ? 'text-amber-600' 
                      : 'text-brand-accent'
                      : 'text-brand-muted';
                    
                    return (
                      <div key={sp.skillId} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <span className="text-sm font-medium text-brand-dark">{sp.skillName}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-brand-muted">{sp.sessionCount} sessions</span>
                          <span className={`text-sm font-bold ${scoreColor}`}>
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
              <Card className="p-5 border-green-200 bg-green-50/50">
                <p className="text-xs text-green-700 font-semibold uppercase tracking-wider">Your Strongest</p>
                <p className="text-xl font-bold text-brand-dark mt-2">{topSkill.skillName}</p>
                <p className="text-sm text-green-700 font-medium mt-1">{topSkill.avgScore.toFixed(1)}/5</p>
              </Card>
            )}

            <Card className="p-5">
              <h3 className="font-semibold text-brand-dark mb-4">Activity</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-brand-muted">Last session</span>
                  <span className="font-medium text-brand-dark">{stats.lastSessionDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-muted">Avg duration</span>
                  <span className="font-medium text-brand-dark">{stats.averageSessionDuration}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-muted">Skills explored</span>
                  <span className="font-medium text-brand-dark">{stats.skillProgress}%</span>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-brand-dark mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link to="/avatar/start" className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-brand-dark group">
                  <span>Think something through</span>
                  <ChevronRight className="w-4 h-4 text-brand-muted group-hover:text-brand-dark transition-colors" />
                </Link>
                <Link to="/avatar/practice" className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-brand-dark group">
                  <span>Practice a scenario</span>
                  <ChevronRight className="w-4 h-4 text-brand-muted group-hover:text-brand-dark transition-colors" />
                </Link>
                <Link to="/avatar/practice/custom-scenario" className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-brand-dark group">
                  <span>Create custom situation</span>
                  <ChevronRight className="w-4 h-4 text-brand-muted group-hover:text-brand-dark transition-colors" />
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
