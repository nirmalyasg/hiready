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

interface InterviewSessionData {
  id: number;
  sessionUid: string;
  status: string;
  duration: number | null;
  createdAt: string;
  config?: {
    interviewType: string;
  };
  roleKit?: {
    name: string;
    domain: string;
  };
  analysis?: {
    id: number;
    overallRecommendation: string | null;
    summary: string | null;
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-brand-dark mb-3">No Practice Sessions Yet</h2>
            <p className="text-brand-dark/60 mb-6 max-w-md mx-auto">
              Start practicing to see your results and track progress over time.
            </p>
            <Link to="/avatar/start">
              <Button className="bg-brand-primary hover:bg-brand-dark text-white px-6">
                Start Your First Session
              </Button>
            </Link>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-brand-dark">Performance Review</h1>
            <p className="text-sm sm:text-base text-brand-dark/60 mt-1">
              {totalSessions} sessions, {Math.round(totalDuration / 60)} minutes practiced
              {activeJobs.length > 0 && ` across ${activeJobs.length} job target${activeJobs.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Link to="/interview/custom" className="flex-1 sm:flex-none">
              <Button className="gap-2 w-full">
                <Play className="w-4 h-4" />
                Practice Interview
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <Card className="p-3 sm:p-4 border border-brand-light/30 bg-white">
            <p className="text-[10px] sm:text-xs text-brand-dark/60 font-medium uppercase tracking-wide">Total Sessions</p>
            <p className="text-xl sm:text-2xl font-bold text-brand-dark mt-1">{totalSessions}</p>
          </Card>
          <Card className="p-3 sm:p-4 border border-purple-100 bg-purple-50">
            <p className="text-[10px] sm:text-xs text-purple-600 font-medium uppercase tracking-wide">Interviews</p>
            <p className="text-xl sm:text-2xl font-bold text-purple-700 mt-1">{totalInterviewSessions}</p>
          </Card>
          <Card className="p-3 sm:p-4 border border-brand-light/30 bg-white">
            <p className="text-[10px] sm:text-xs text-brand-dark/60 font-medium uppercase tracking-wide">Exercises</p>
            <p className="text-xl sm:text-2xl font-bold text-brand-dark mt-1">{totalExerciseSessions}</p>
          </Card>
          <Card className="p-3 sm:p-4 border border-brand-light/30 bg-white">
            <p className="text-[10px] sm:text-xs text-brand-dark/60 font-medium uppercase tracking-wide">Practice</p>
            <p className="text-xl sm:text-2xl font-bold text-brand-dark mt-1">{totalConversationSessions}</p>
          </Card>
          <Card className="p-3 sm:p-4 border border-brand-light/30 bg-white">
            <p className="text-[10px] sm:text-xs text-brand-dark/60 font-medium uppercase tracking-wide">Total Time</p>
            <p className="text-xl sm:text-2xl font-bold text-brand-dark mt-1">{Math.round(totalDuration / 60)}m</p>
          </Card>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex bg-brand-light/10 rounded-lg p-1 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setViewMode("sessions")}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                viewMode === "sessions" 
                  ? "bg-white text-brand-dark shadow-sm" 
                  : "text-brand-dark/60 hover:text-brand-dark"
              }`}
            >
              All Sessions
            </button>
            <button
              onClick={() => setViewMode("skills")}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                viewMode === "skills" 
                  ? "bg-white text-brand-dark shadow-sm" 
                  : "text-brand-dark/60 hover:text-brand-dark"
              }`}
            >
              Skills Overview
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 border border-brand-light/30 rounded-lg text-sm bg-white text-brand-dark w-full sm:w-auto"
            >
              <option value="all">All Types</option>
              <option value="conversations">Conversations</option>
              {presentations.length > 0 && (
                <option value="presentations">Presentations</option>
              )}
              {interviews.length > 0 && (
                <option value="interviews">Interviews</option>
              )}
              {exercises.some(e => e.exerciseType === "coding_lab") && (
                <option value="coding">Coding Lab</option>
              )}
              {exercises.some(e => e.exerciseType === "case_study") && (
                <option value="case_study">Case Study</option>
              )}
            </select>
          </div>
        </div>

        {viewMode === "skills" && (
          <div className="space-y-4">
            {practicedSkills.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {practicedSkills.map((skill) => {
                  const skillSessions = sessions.filter(s => s.skill_name === skill.skillName);
                  const scoreColor = skill.avgScore !== null 
                    ? skill.avgScore >= 4 ? 'text-green-600' 
                    : skill.avgScore >= 2.5 ? 'text-amber-600' 
                    : 'text-red-600'
                    : 'text-slate-400';
                  
                  return (
                    <Card key={skill.skillId} className="p-5 border border-slate-200 hover:border-slate-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{skill.skillName}</h3>
                          {skill.frameworkUsed && (
                            <p className="text-sm text-slate-500 mt-0.5">{skill.frameworkUsed}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`text-xl font-bold ${scoreColor}`}>
                            {skill.avgScore?.toFixed(1) || '-'}
                          </span>
                          <span className="text-slate-400 text-sm">/5</span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-500 mb-3">
                        {skill.sessionCount} session{skill.sessionCount !== 1 ? 's' : ''}
                      </p>

                      {skill.dimensions.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {skill.dimensions.slice(0, 3).map((dim) => (
                            <div key={dim.dimension} className="flex items-center justify-between text-sm">
                              <span className="text-slate-600 truncate mr-2">{dim.dimension}</span>
                              <span className={`font-medium ${
                                dim.avgScore >= 4 ? 'text-green-600' : 
                                dim.avgScore >= 2.5 ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                {dim.avgScore.toFixed(1)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {skillSessions.length > 0 && (
                        <button 
                          onClick={() => { setSelectedCategory("conversations"); setViewMode("sessions"); }}
                          className="text-sm text-brand-primary hover:underline"
                        >
                          View sessions
                        </button>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 text-center border border-slate-200">
                <Brain className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                <h3 className="text-lg font-semibold mb-2">No Skill Assessments Yet</h3>
                <p className="text-gray-500 mb-4">Complete practice sessions to see your skill progression</p>
                <Link to="/avatar/start">
                  <Button>Start Practicing</Button>
                </Link>
              </Card>
            )}
          </div>
        )}

        {viewMode === "sessions" && (
          <div className="space-y-6">
            {timeGroupOrder.map((timeGroup) => {
              const groupSessions = groupedSessions[timeGroup];
              if (!groupSessions?.length) return null;

              return (
                <div key={timeGroup}>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">{timeGroup}</h2>
                    <span className="text-xs text-slate-400">
                      ({groupSessions.length})
                    </span>
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
                            <Card className="p-4 border border-slate-200 hover:border-slate-300 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-slate-900 truncate">
                                    {pSession.presentation.topic || pSession.presentation.fileName}
                                  </h3>
                                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                    <span className="text-orange-600 flex items-center gap-1">
                                      <Eye className="w-3 h-3" />
                                      Presentation
                                    </span>
                                    <span>{formatDuration(pSession.duration || 0)}</span>
                                    <span>{pSession.slidesCovered || 0}/{pSession.totalSlides || 0} slides</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 ml-4">
                                  {pSession.feedback && (
                                    <span className={`font-semibold ${getScoreColor(pSession.feedback.overallScore)}`}>
                                      {pSession.feedback.overallScore.toFixed(1)}/5
                                    </span>
                                  )}
                                  <span className="text-sm text-slate-400">
                                    {format(new Date(pSession.createdAt), 'h:mm a')}
                                  </span>
                                </div>
                              </div>
                            </Card>
                          </Link>
                        );
                      } else if (session.type === 'interview') {
                        const iSession = session.data;
                        return (
                          <Link
                            key={`interview-${iSession.id}`}
                            to={`/interview/results?sessionId=${iSession.id}`}
                            className="block"
                          >
                            <Card className="p-4 border border-slate-200 hover:border-slate-300 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-slate-900 truncate">
                                    {iSession.roleKit?.name || "Interview Practice"}
                                  </h3>
                                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                    <span className="text-purple-600 flex items-center gap-1">
                                      <UserCheck className="w-3 h-3" />
                                      Interview
                                    </span>
                                    {iSession.roleKit?.domain && (
                                      <span>{iSession.roleKit.domain}</span>
                                    )}
                                    {iSession.duration && (
                                      <span>{formatDuration(iSession.duration)}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 ml-4">
                                  {iSession.analysis?.overallRecommendation && (
                                    <Badge variant="outline" className={`${getRecommendationColor(iSession.analysis.overallRecommendation)}`}>
                                      {iSession.analysis.overallRecommendation.replace(/_/g, ' ')}
                                    </Badge>
                                  )}
                                  <span className="text-sm text-slate-400">
                                    {format(new Date(iSession.createdAt), 'h:mm a')}
                                  </span>
                                </div>
                              </div>
                            </Card>
                          </Link>
                        );
                      } else if (session.type === 'exercise') {
                        const eSession = session.data;
                        const resultPath = eSession.exerciseType === 'coding_lab' 
                          ? `/exercise-mode/coding-lab/results?sessionId=${eSession.id}`
                          : `/exercise-mode/case-study/results?sessionId=${eSession.id}`;
                        const typeLabel = eSession.exerciseType === 'coding_lab' ? 'Coding Lab' : 'Case Study';
                        const TypeIcon = eSession.exerciseType === 'coding_lab' ? Code : Briefcase;
                        const typeColor = eSession.exerciseType === 'coding_lab' ? 'text-blue-600' : 'text-emerald-600';
                        
                        return (
                          <Link
                            key={`exercise-${eSession.id}`}
                            to={resultPath}
                            className="block"
                          >
                            <Card className="p-4 border border-slate-200 hover:border-slate-300 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-slate-900 truncate">
                                    {eSession.exerciseName || eSession.exerciseData?.name || typeLabel}
                                  </h3>
                                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                    <span className={`${typeColor} flex items-center gap-1`}>
                                      <TypeIcon className="w-3 h-3" />
                                      {typeLabel}
                                    </span>
                                    {eSession.exerciseData?.difficulty && (
                                      <span className="capitalize">{eSession.exerciseData.difficulty}</span>
                                    )}
                                    {eSession.duration && (
                                      <span>{formatDuration(eSession.duration)}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 ml-4">
                                  {eSession.analysis && (
                                    <span className={`font-semibold ${
                                      eSession.analysis.overallScore >= 70 ? 'text-green-600' :
                                      eSession.analysis.overallScore >= 50 ? 'text-amber-600' : 'text-red-600'
                                    }`}>
                                      {eSession.analysis.overallScore}%
                                    </span>
                                  )}
                                  <span className="text-sm text-slate-400">
                                    {format(new Date(eSession.createdAt), 'h:mm a')}
                                  </span>
                                </div>
                              </div>
                            </Card>
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
                            <Card className="p-4 border border-slate-200 hover:border-slate-300 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-slate-900 truncate">
                                    {cSession.scenario_name || "Practice Session"}
                                  </h3>
                                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                    {cSession.skill_name && (
                                      <span className="text-brand-primary flex items-center gap-1">
                                        <MessageCircle className="w-3 h-3" />
                                        {cSession.skill_name}
                                      </span>
                                    )}
                                    <span>{formatDuration(cSession.duration || 0)}</span>
                                    <span>{cSession.message_count || 0} messages</span>
                                  </div>
                                </div>
                                <span className="text-sm text-slate-400 ml-4">
                                  {format(new Date(cSession.created_at), 'h:mm a')}
                                </span>
                              </div>
                            </Card>
                          </Link>
                        );
                      }
                    })}
                  </div>
                </div>
              );
            })}

            {allSessions.length === 0 && (
              <Card className="p-8 text-center">
                <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Sessions Found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
              </Card>
            )}
          </div>
        )}

        {/* Next Recommended Exercise CTA */}
        {activeJobs.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-brand-dark to-brand-dark/90 rounded-2xl p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold mb-1">Ready to continue practicing?</h3>
                <p className="text-white/70 text-sm">
                  Keep preparing for {(activeJobs[0] as { roleTitle: string }).roleTitle}
                  {(activeJobs[0] as { companyName: string | null }).companyName && ` at ${(activeJobs[0] as { companyName: string | null }).companyName}`}
                </p>
              </div>
              <Link to={`/interview/custom?jobId=${(activeJobs[0] as { id: string }).id}`}>
                <Button className="bg-white text-brand-dark hover:bg-white/90 gap-2 w-full sm:w-auto">
                  <Play className="w-4 h-4" />
                  Practice Now
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
