import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate, Link } from "react-router-dom";
import SidebarLayout from "@/components/layout/sidebar-layout";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  Calendar,
  Clock,
  MessageCircle,
  TrendingUp,
  Search,
  ChevronRight,
  BarChart3,
  User,
  Target,
  Award,
  Brain,
  Zap,
  Eye,
  Trophy,
  ArrowUpRight,
  Layers,
  Code,
  Briefcase,
  UserCheck,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Play
} from "lucide-react";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";

interface TranscriptData {
  id: string;
  skill_name: string;
  skill_id: number;
  scenario_id: number;
  scenario_name: string;
  context: string;
  instructions: string;
  scenario_context: string;
  scenario_instructions: string;
  duration: number;
  message_count: number;
  created_at: string;
  session_id: string;
  avatar_id: string;
}

interface SkillProgressData {
  skillId: number;
  skillName: string;
  avgScore: number | null;
  sessionCount: number;
  frameworkUsed: string | null;
  frameworkMapping: string | null;
  dimensions: {
    dimension: string;
    avgScore: number;
    count: number;
  }[];
}

interface PresentationSessionData {
  id: number;
  sessionUid: string;
  duration: number;
  slidesCovered: number;
  totalSlides: number;
  createdAt: string;
  presentation: {
    id: number;
    topic: string;
    fileName: string;
  };
  feedback: {
    overallScore: number;
    communicationScore: number;
    deliveryScore: number;
    subjectMatterScore: number;
    summary: string;
  } | null;
}

interface DimensionScore {
  dimension: string;
  score: number;
  evidence: string[];
  rationale: string;
  improvement: string;
}

interface InterviewSessionData {
  id: number;
  sessionUid: string;
  status: string;
  duration: number | null;
  createdAt: string;
  config?: {
    id: number;
    interviewType: string;
    interviewMode: string;
    roleKitId: number | null;
    jobTargetId: string | null;
  };
  roleKit?: {
    name: string;
    domain: string;
  };
  jobTarget?: {
    id: string;
    companyName: string | null;
    roleTitle: string;
  } | null;
  analysis?: {
    id: number;
    overallRecommendation: string | null;
    summary: string | null;
    dimensionScores: DimensionScore[] | null;
  } | null;
}

interface ExerciseSessionData {
  id: number;
  sessionUid: string;
  exerciseType: string;
  exerciseName: string;
  exerciseData: {
    name: string;
    activityType?: string;
    caseType?: string;
    language?: string;
    difficulty?: string;
  } | null;
  status: string;
  duration: number | null;
  createdAt: string;
  analysis: {
    id: number;
    overallScore: number;
    summary: string | null;
  } | null;
}

const getTimeGroup = (dateString: string) => {
  const date = new Date(dateString);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisWeek(date)) return "This Week";
  if (isThisMonth(date)) return "This Month";
  return "Older";
};

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "0m 0s";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

const getSkillGradient = (index: number) => {
  const gradients = [
    "from-brand-primary to-brand-light",
    "from-brand-accent to-brand-accent-light",
    "from-brand-dark to-brand-primary",
    "from-brand-light to-brand-primary",
    "from-brand-accent-light to-brand-accent",
    "from-brand-primary to-brand-dark",
  ];
  return gradients[index % gradients.length];
};

const getScoreColor = (score: number | null) => {
  if (score === null) return "text-gray-400";
  if (score >= 4) return "text-green-600";
  if (score >= 2.5) return "text-amber-600";
  return "text-red-600";
};

const getScoreBg = (score: number | null) => {
  if (score === null) return "bg-gray-100";
  if (score >= 4) return "bg-green-50";
  if (score >= 2.5) return "bg-amber-50";
  return "bg-red-50";
};

const getRecommendationColor = (rec: string | null | undefined) => {
  if (!rec) return "text-gray-400";
  const lower = rec.toLowerCase();
  if (lower.includes("strong") || lower.includes("hire")) return "text-green-600";
  if (lower.includes("consider") || lower.includes("maybe")) return "text-amber-600";
  return "text-red-600";
};

export default function ResultsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"skills" | "sessions">("sessions");
  const { user } = useAuth();

  const fetchTranscripts = async () => {
    const res = await fetch("/api/avatar/get-transcripts", { credentials: 'include' });
    const data = await res.json();
    if (!data.success) throw new Error("Failed to fetch transcripts");
    return data.transcripts;
  };

  const fetchSkillProgress = async () => {
    const res = await fetch("/api/avatar/skill-progress", { credentials: 'include' });
    const data = await res.json();
    if (!data.success) throw new Error("Failed to fetch skill progress");
    return data.skillProgress;
  };

  const fetchPresentationResults = async () => {
    const res = await fetch("/api/avatar/presentation-results", { credentials: 'include' });
    const data = await res.json();
    if (!data.success) throw new Error("Failed to fetch presentation results");
    return data.sessions;
  };

  const fetchInterviewSessions = async () => {
    const res = await fetch("/api/interview/sessions", { credentials: 'include' });
    const data = await res.json();
    if (!data.success) throw new Error("Failed to fetch interview sessions");
    return data.sessions;
  };

  const fetchExerciseSessions = async () => {
    const res = await fetch("/api/exercise-mode/session-history", { credentials: 'include' });
    const data = await res.json();
    if (!data.success) throw new Error("Failed to fetch exercise sessions");
    return data.sessions;
  };

  const fetchJobTargets = async () => {
    try {
      const res = await fetch("/api/jobs/job-targets", { credentials: 'include' });
      const data = await res.json();
      if (!data.success) return [];
      return data.jobs || [];
    } catch {
      return [];
    }
  };

  const { isLoading: loadingTranscripts, data: transcripts } = useQuery({
    queryKey: ["/avatar/get-transcripts"],
    queryFn: fetchTranscripts,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const { isLoading: loadingSkills, data: skillProgress } = useQuery({
    queryKey: ["/avatar/skill-progress"],
    queryFn: fetchSkillProgress,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const { isLoading: loadingPresentations, data: presentationSessions } = useQuery({
    queryKey: ["/avatar/presentation-results"],
    queryFn: fetchPresentationResults,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const { isLoading: loadingInterviews, data: interviewSessions } = useQuery({
    queryKey: ["/interview/sessions"],
    queryFn: fetchInterviewSessions,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const { isLoading: loadingExercises, data: exerciseSessions } = useQuery({
    queryKey: ["/exercise-mode/session-history"],
    queryFn: fetchExerciseSessions,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const { data: jobTargets } = useQuery({
    queryKey: ["/jobs/job-targets"],
    queryFn: fetchJobTargets,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const activeJobs = (jobTargets || []).filter((j: { status: string }) => j.status !== 'archived' && j.status !== 'rejected');

  const loading = loadingTranscripts || loadingSkills || loadingPresentations || loadingInterviews || loadingExercises;

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner className="mr-3" />
          <span className="text-gray-600">Loading your results...</span>
        </div>
      </SidebarLayout>
    );
  }

  const sessions: TranscriptData[] = transcripts || [];
  const skills: SkillProgressData[] = skillProgress || [];
  const presentations: PresentationSessionData[] = presentationSessions || [];
  const interviews: InterviewSessionData[] = interviewSessions || [];
  const exercises: ExerciseSessionData[] = exerciseSessions || [];
  const practicedSkills = skills.filter(s => s.sessionCount > 0);

  const totalConversationSessions = sessions.length;
  const totalPresentationSessions = presentations.length;
  const totalInterviewSessions = interviews.length;
  const totalExerciseSessions = exercises.length;
  const totalSessions = totalConversationSessions + totalPresentationSessions + totalInterviewSessions + totalExerciseSessions;
  
  const conversationDuration = sessions.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
  const presentationDuration = presentations.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
  const interviewDuration = interviews.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
  const exerciseDuration = exercises.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
  const totalDuration = conversationDuration + presentationDuration + interviewDuration + exerciseDuration;
  
  const totalMessages = sessions.reduce((sum, s) => sum + (Number(s.message_count) || 0), 0);
  const avgScore = practicedSkills.length > 0
    ? practicedSkills.reduce((sum, s) => sum + (s.avgScore || 0), 0) / practicedSkills.length
    : 0;

  const uniqueSkillNames = [...new Set(sessions.map(s => s.skill_name).filter(Boolean))];

  const filteredSessions = sessions.filter((s: TranscriptData) => {
    const matchesSearch = !searchTerm || 
      s.skill_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.scenario_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || selectedCategory === "conversations";
    return matchesSearch && matchesCategory;
  });

  const filteredPresentations = presentations.filter((s: PresentationSessionData) => {
    const matchesSearch = !searchTerm || 
      s.presentation?.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.presentation?.fileName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || selectedCategory === "presentations";
    return matchesSearch && matchesCategory;
  });

  const filteredInterviews = interviews.filter((s: InterviewSessionData) => {
    const matchesSearch = !searchTerm || 
      s.roleKit?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.roleKit?.domain?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || selectedCategory === "interviews";
    return matchesSearch && matchesCategory;
  });

  const filteredExercises = exercises.filter((s: ExerciseSessionData) => {
    const matchesSearch = !searchTerm || 
      s.exerciseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.exerciseData?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
      (selectedCategory === "coding" && s.exerciseType === "coding_lab") ||
      (selectedCategory === "case_study" && s.exerciseType === "case_study");
    return matchesSearch && matchesCategory;
  });

  type UnifiedSession = 
    | { type: 'conversation'; data: TranscriptData; createdAt: string }
    | { type: 'presentation'; data: PresentationSessionData; createdAt: string }
    | { type: 'interview'; data: InterviewSessionData; createdAt: string }
    | { type: 'exercise'; data: ExerciseSessionData; createdAt: string };

  const allSessions: UnifiedSession[] = [
    ...filteredSessions.map(s => ({ type: 'conversation' as const, data: s, createdAt: s.created_at })),
    ...filteredPresentations.map(s => ({ type: 'presentation' as const, data: s, createdAt: s.createdAt })),
    ...filteredInterviews.map(s => ({ type: 'interview' as const, data: s, createdAt: s.createdAt })),
    ...filteredExercises.map(s => ({ type: 'exercise' as const, data: s, createdAt: s.createdAt }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const groupedSessions = allSessions.reduce((acc: { [key: string]: UnifiedSession[] }, s) => {
    const group = getTimeGroup(s.createdAt);
    if (!acc[group]) acc[group] = [];
    acc[group].push(s);
    return acc;
  }, {});

  const timeGroupOrder = ["Today", "Yesterday", "This Week", "This Month", "Older"];

  if (sessions.length === 0 && presentations.length === 0 && interviews.length === 0 && exercises.length === 0) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-[#fbfbfc]">
          <div className="bg-gradient-to-br from-[#042c4c] via-[#0a3d66] to-[#042c4c] text-white py-16">
            <div className="max-w-4xl mx-auto px-4 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-[#ee7e65]" />
              </div>
              <h2 className="text-2xl font-bold mb-3">No Practice Sessions Yet</h2>
              <p className="text-white/70 mb-8 max-w-md mx-auto">
                Start practicing to see your results and track progress over time.
              </p>
              <Link to="/interview">
                <Button className="bg-[#ee7e65] hover:bg-[#e06a50] text-white px-8 py-3 rounded-xl shadow-lg shadow-[#ee7e65]/25">
                  Start Your First Session
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#fbfbfc]">
        <div className="bg-gradient-to-br from-[#042c4c] via-[#0a3d66] to-[#042c4c] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-[#ee7e65] rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[#ee7e65] text-sm font-semibold uppercase tracking-wide">Analytics</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold">Your Results</h1>
                <p className="text-white/70 mt-2">
                  {totalSessions} sessions, {Math.round(totalDuration / 60)} min practiced
                  {activeJobs.length > 0 && ` for ${activeJobs.length} job${activeJobs.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <Link to="/interview">
                <Button className="gap-2 bg-[#ee7e65] hover:bg-[#e06a50] text-white font-semibold rounded-xl px-6 py-3 shadow-lg shadow-[#ee7e65]/25">
                  <Play className="w-4 h-4" />
                  Practice More
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-4 gap-3 sm:gap-4 mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">{totalSessions}</p>
                <p className="text-white/60 text-xs sm:text-sm">Sessions</p>
              </div>
              <div className="text-center border-x border-white/20">
                <p className="text-2xl sm:text-3xl font-bold text-[#ee7e65]">{totalInterviewSessions}</p>
                <p className="text-white/60 text-xs sm:text-sm">Interviews</p>
              </div>
              <div className="text-center border-r border-white/20">
                <p className="text-2xl sm:text-3xl font-bold text-white">{totalExerciseSessions}</p>
                <p className="text-white/60 text-xs sm:text-sm">Exercises</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">{Math.round(totalDuration / 60)}m</p>
                <p className="text-white/60 text-xs sm:text-sm">Total Time</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-4 sm:p-6 border border-slate-100">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex bg-slate-100 rounded-xl p-1 flex-shrink-0">
                <button
                  onClick={() => setViewMode("sessions")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    viewMode === "sessions" 
                      ? "bg-[#042c4c] text-white shadow-lg" 
                      : "text-[#6c8194] hover:text-[#042c4c]"
                  }`}
                >
                  Sessions
                </button>
                <button
                  onClick={() => setViewMode("skills")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    viewMode === "skills" 
                      ? "bg-[#042c4c] text-white shadow-lg" 
                      : "text-[#6c8194] hover:text-[#042c4c]"
                  }`}
                >
                  Performance
                </button>
              </div>
              
              <div className="flex gap-3 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#768c9c]" />
                  <Input
                    placeholder="Search sessions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-11 rounded-xl bg-[#fbfbfc] border-slate-200 focus:border-[#ee7e65] focus:ring-[#ee7e65]/20"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-[#042c4c] font-medium min-w-[120px] focus:border-[#ee7e65] focus:ring-[#ee7e65]/20"
                >
                  <option value="all">All Types</option>
                  <option value="interviews">Interviews</option>
                  {exercises.some(e => e.exerciseType === "coding_lab") && (
                    <option value="coding">Coding</option>
                  )}
                  {exercises.some(e => e.exerciseType === "case_study") && (
                    <option value="case_study">Case Study</option>
                  )}
                  <option value="conversations">Conversations</option>
                  {presentations.length > 0 && (
                    <option value="presentations">Presentations</option>
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4 sm:space-y-6 pb-20 sm:pb-8">

        {viewMode === "skills" && (
          <div className="space-y-4">
            {(() => {
              const interviewsWithAnalysis = interviews.filter(i => i.analysis?.dimensionScores?.length);
              
              if (interviewsWithAnalysis.length === 0) {
                return (
                  <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                    <BarChart3 className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Interview Analysis Yet</h3>
                    <p className="text-slate-500 text-sm mb-4">Complete interview practice sessions to see your performance across dimensions</p>
                    <Link to="/interview">
                      <Button className="bg-[#ee7e65] hover:bg-[#e06a50]">Start Interview Practice</Button>
                    </Link>
                  </div>
                );
              }
              
              const dimensionAggregates: Record<string, { total: number; count: number; sessions: InterviewSessionData[] }> = {};
              const rolePerformance: Record<string, { total: number; count: number; sessions: number }> = {};
              const typePerformance: Record<string, { total: number; count: number }> = {};
              
              interviewsWithAnalysis.forEach(interview => {
                const scores = interview.analysis?.dimensionScores;
                if (!scores || scores.length === 0) return;
                
                scores.forEach(ds => {
                  if (!ds.dimension || typeof ds.score !== 'number') return;
                  if (!dimensionAggregates[ds.dimension]) {
                    dimensionAggregates[ds.dimension] = { total: 0, count: 0, sessions: [] };
                  }
                  dimensionAggregates[ds.dimension].total += ds.score;
                  dimensionAggregates[ds.dimension].count += 1;
                  dimensionAggregates[ds.dimension].sessions.push(interview);
                });
                
                const roleName = interview.jobTarget?.roleTitle || interview.roleKit?.name || 'General';
                if (!rolePerformance[roleName]) {
                  rolePerformance[roleName] = { total: 0, count: 0, sessions: 0 };
                }
                const validScores = scores.filter(ds => typeof ds.score === 'number');
                if (validScores.length > 0) {
                  const avgScore = validScores.reduce((sum, ds) => sum + ds.score, 0) / validScores.length;
                  rolePerformance[roleName].total += avgScore;
                  rolePerformance[roleName].count += 1;
                  rolePerformance[roleName].sessions += 1;
                  
                  const interviewType = interview.config ? (interview.config.interviewType || interview.config.interviewMode || 'general') : 'general';
                  if (!typePerformance[interviewType]) {
                    typePerformance[interviewType] = { total: 0, count: 0 };
                  }
                  typePerformance[interviewType].total += avgScore;
                  typePerformance[interviewType].count += 1;
                }
              });
              
              const dimensionList = Object.entries(dimensionAggregates)
                .map(([name, data]) => ({
                  name,
                  avgScore: data.total / data.count,
                  sessionCount: data.count,
                }))
                .sort((a, b) => b.avgScore - a.avgScore);
              
              const roleList = Object.entries(rolePerformance)
                .map(([name, data]) => ({
                  name,
                  avgScore: data.total / data.count,
                  sessions: data.sessions,
                }))
                .sort((a, b) => b.avgScore - a.avgScore);
              
              const strongest = dimensionList.slice(0, 3);
              const needsWork = [...dimensionList].sort((a, b) => a.avgScore - b.avgScore).slice(0, 3);
              
              return (
                <>
                  <div className="bg-slate-900 rounded-2xl p-5">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl sm:text-3xl font-bold text-white">{interviewsWithAnalysis.length}</p>
                        <p className="text-xs sm:text-sm text-white/60">Analyzed Sessions</p>
                      </div>
                      <div className="border-x border-white/10">
                        <p className="text-2xl sm:text-3xl font-bold text-white">{dimensionList.length}</p>
                        <p className="text-xs sm:text-sm text-white/60">Dimensions</p>
                      </div>
                      <div>
                        <p className="text-2xl sm:text-3xl font-bold text-white">
                          {dimensionList.length > 0 ? (dimensionList.reduce((s, d) => s + d.avgScore, 0) / dimensionList.length).toFixed(1) : '-'}
                        </p>
                        <p className="text-xs sm:text-sm text-white/60">Avg Score</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Trophy className="w-4 h-4 text-emerald-600" />
                        <h3 className="font-semibold text-slate-900">Strongest Areas</h3>
                      </div>
                      <div className="space-y-2">
                        {strongest.map((dim) => (
                          <div key={dim.name} className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                            <span className="text-sm text-slate-900 truncate">{dim.name}</span>
                            <span className="text-sm font-bold text-emerald-600">{dim.avgScore.toFixed(1)}/5</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-slate-700" />
                        <h3 className="font-semibold text-slate-900">Focus Areas</h3>
                      </div>
                      <div className="space-y-2">
                        {needsWork.map((dim) => (
                          <div key={dim.name} className="flex items-center justify-between p-2 bg-slate-900/10 rounded-lg">
                            <span className="text-sm text-slate-900 truncate">{dim.name}</span>
                            <span className="text-sm font-bold text-slate-700">{dim.avgScore.toFixed(1)}/5</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h3 className="font-semibold text-slate-900 mb-4">All Dimensions</h3>
                    <div className="space-y-3">
                      {dimensionList.map((dim) => {
                        const percentage = (dim.avgScore / 5) * 100;
                        return (
                          <div key={dim.name}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-slate-900">{dim.name}</span>
                              <span className={`text-sm font-semibold ${
                                dim.avgScore >= 4 ? 'text-emerald-600' : 
                                dim.avgScore >= 3 ? 'text-slate-900' : 'text-slate-700'
                              }`}>
                                {dim.avgScore.toFixed(1)}/5
                              </span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  dim.avgScore >= 4 ? 'bg-emerald-500' : 
                                  dim.avgScore >= 3 ? 'bg-slate-900' : 'bg-slate-900'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{dim.sessionCount} assessment{dim.sessionCount !== 1 ? 's' : ''}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {roleList.length > 1 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <h3 className="font-semibold text-slate-900 mb-3">Performance by Role</h3>
                      <div className="space-y-2">
                        {roleList.map((role) => (
                          <div key={role.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{role.name}</p>
                              <p className="text-xs text-slate-500">{role.sessions} session{role.sessions !== 1 ? 's' : ''}</p>
                            </div>
                            <span className={`text-lg font-bold ${
                              role.avgScore >= 4 ? 'text-emerald-600' : 
                              role.avgScore >= 3 ? 'text-slate-900' : 'text-slate-700'
                            }`}>
                              {role.avgScore.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {viewMode === "sessions" && (
          <div className="space-y-5">
            {timeGroupOrder.map((timeGroup) => {
              const groupSessions = groupedSessions[timeGroup];
              if (!groupSessions?.length) return null;

              return (
                <div key={timeGroup}>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wide">{timeGroup}</h2>
                    <span className="text-xs text-slate-300">({groupSessions.length})</span>
                  </div>

                  <div className="space-y-2">
                    {groupSessions.map((session, idx) => {
                      if (session.type === 'presentation') {
                        const pSession = session.data;
                        return (
                          <Link
                            key={`pres-${pSession.id}`}
                            to={`/avatar/practice/presentation/results?sessionId=${pSession.sessionUid}&presentationId=${pSession.presentation.id}`}
                            className="block"
                          >
                            <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 hover:border-slate-500/40 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Eye className="w-5 h-5 text-slate-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-slate-900 text-sm sm:text-base truncate">
                                    {pSession.presentation.topic || pSession.presentation.fileName}
                                  </h3>
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span>{formatDuration(pSession.duration || 0)}</span>
                                    <span>•</span>
                                    <span>{pSession.slidesCovered || 0}/{pSession.totalSlides || 0} slides</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                  {pSession.feedback && (
                                    <span className={`text-sm font-semibold ${getScoreColor(pSession.feedback.overallScore)}`}>
                                      {pSession.feedback.overallScore.toFixed(1)}/5
                                    </span>
                                  )}
                                  <span className="text-xs text-slate-400">
                                    {format(new Date(pSession.createdAt), 'h:mm a')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      } else if (session.type === 'interview') {
                        const iSession = session.data;
                        const displayTitle = iSession.jobTarget?.roleTitle || iSession.roleKit?.name || "Interview Practice";
                        const displaySubtitle = iSession.jobTarget?.companyName || iSession.roleKit?.domain?.replace('_', ' ') || null;
                        const interviewType = iSession.config ? (iSession.config.interviewType || iSession.config.interviewMode || null) : null;
                        
                        return (
                          <Link
                            key={`interview-${iSession.id}`}
                            to={`/interview/results?sessionId=${iSession.id}`}
                            className="block"
                          >
                            <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 hover:border-slate-300 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-900/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <UserCheck className="w-5 h-5 text-slate-700" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-slate-900 text-sm sm:text-base truncate">
                                    {displayTitle}
                                  </h3>
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    {displaySubtitle && (
                                      <span className="flex items-center gap-1">
                                        <Building2 className="w-3 h-3" />
                                        <span className="capitalize">{displaySubtitle}</span>
                                      </span>
                                    )}
                                    {interviewType && (
                                      <>
                                        {displaySubtitle && <span>•</span>}
                                        <span className="capitalize">{interviewType.replace(/_/g, ' ')}</span>
                                      </>
                                    )}
                                    {iSession.duration && (
                                      <>
                                        <span>•</span>
                                        <span>{formatDuration(iSession.duration)}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                  {iSession.analysis?.overallRecommendation && (
                                    <Badge variant="outline" className={`text-xs ${getRecommendationColor(iSession.analysis.overallRecommendation)}`}>
                                      {iSession.analysis.overallRecommendation.replace(/_/g, ' ')}
                                    </Badge>
                                  )}
                                  <span className="text-xs text-slate-400">
                                    {format(new Date(iSession.createdAt), 'h:mm a')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      } else if (session.type === 'exercise') {
                        const eSession = session.data;
                        const resultPath = eSession.exerciseType === 'coding_lab' 
                          ? `/exercise-mode/coding-lab/results?sessionId=${eSession.id}`
                          : `/exercise-mode/case-study/results?sessionId=${eSession.id}`;
                        const typeLabel = eSession.exerciseType === 'coding_lab' ? 'Coding Lab' : 'Case Study';
                        const TypeIcon = eSession.exerciseType === 'coding_lab' ? Code : Briefcase;
                        const typeBgColor = eSession.exerciseType === 'coding_lab' ? 'bg-slate-900/10' : 'bg-emerald-100';
                        const typeIconColor = eSession.exerciseType === 'coding_lab' ? 'text-slate-900' : 'text-emerald-600';
                        const typeBorderColor = eSession.exerciseType === 'coding_lab' ? 'hover:border-slate-300' : 'hover:border-emerald-200';
                        
                        return (
                          <Link
                            key={`exercise-${eSession.id}`}
                            to={resultPath}
                            className="block"
                          >
                            <div className={`bg-white rounded-xl border border-slate-200 p-3 sm:p-4 ${typeBorderColor} transition-colors`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 ${typeBgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                  <TypeIcon className={`w-5 h-5 ${typeIconColor}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-slate-900 text-sm sm:text-base truncate">
                                    {eSession.exerciseName || eSession.exerciseData?.name || typeLabel}
                                  </h3>
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span>{typeLabel}</span>
                                    {eSession.exerciseData?.difficulty && (
                                      <>
                                        <span>•</span>
                                        <span className="capitalize">{eSession.exerciseData.difficulty}</span>
                                      </>
                                    )}
                                    {eSession.duration && (
                                      <>
                                        <span>•</span>
                                        <span>{formatDuration(eSession.duration)}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                  {eSession.analysis && (
                                    <span className={`text-sm font-semibold ${
                                      eSession.analysis.overallScore >= 70 ? 'text-green-600' :
                                      eSession.analysis.overallScore >= 50 ? 'text-amber-600' : 'text-red-600'
                                    }`}>
                                      {eSession.analysis.overallScore}%
                                    </span>
                                  )}
                                  <span className="text-xs text-slate-400">
                                    {format(new Date(eSession.createdAt), 'h:mm a')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      } else {
                        const cSession = session.data;
                        return (
                          <Link
                            key={cSession.id}
                            to={
                              user?.userType === "coach"
                                ? `/coach-dashboard?tab=avatar&id=${cSession.id}`
                                : `/avatar/session-analysis/?tid=${cSession.id}${cSession.skill_id ? `&skill=${cSession.skill_id}` : ''}${cSession.scenario_id ? `&scenario=${cSession.scenario_id}` : ''}`
                            }
                            className="block"
                          >
                            <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 hover:border-slate-300 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <MessageCircle className="w-5 h-5 text-slate-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-slate-900 text-sm sm:text-base truncate">
                                    {cSession.scenario_name || "Practice Session"}
                                  </h3>
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    {cSession.skill_name && (
                                      <span>{cSession.skill_name}</span>
                                    )}
                                    <span>•</span>
                                    <span>{formatDuration(cSession.duration || 0)}</span>
                                    <span>•</span>
                                    <span>{cSession.message_count || 0} msgs</span>
                                  </div>
                                </div>
                                <span className="text-xs text-slate-400 flex-shrink-0">
                                  {format(new Date(cSession.created_at), 'h:mm a')}
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      }
                    })}
                  </div>
                </div>
              );
            })}

            {allSessions.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <Search className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Sessions Found</h3>
                <p className="text-slate-500 text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}

        {/* Next Recommended Exercise CTA */}
        {activeJobs.length > 0 && (
          <div className="bg-gradient-to-r from-[#042c4c] to-[#0a3d66] rounded-2xl p-5 sm:p-6 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold mb-1">Continue practicing?</h3>
                <p className="text-white/70 text-sm">
                  Keep preparing for {(activeJobs[0] as { roleTitle: string }).roleTitle}
                  {(activeJobs[0] as { companyName: string | null }).companyName && ` at ${(activeJobs[0] as { companyName: string | null }).companyName}`}
                </p>
              </div>
              <Link to={`/jobs/${(activeJobs[0] as { id: string }).id}`} className="sm:flex-shrink-0">
                <Button className="bg-[#ee7e65] hover:bg-[#e06a50] text-white gap-2 w-full sm:w-auto font-semibold rounded-xl shadow-lg shadow-[#ee7e65]/25">
                  <Play className="w-4 h-4" />
                  Practice Now
                </Button>
              </Link>
            </div>
          </div>
        )}
        </div>
      </div>
    </SidebarLayout>
  );
}
