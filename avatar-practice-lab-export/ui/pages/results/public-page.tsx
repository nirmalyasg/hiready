import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  CheckCircle, 
  TrendingUp, 
  Award, 
  ArrowRight, 
  Briefcase,
  Lightbulb,
  Calendar,
  Code,
  Users,
  Zap,
  Star
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface DimensionScore {
  dimension: string;
  score: number;
  evidence: string[];
  rationale: string;
  improvement: string;
}

interface BetterAnswer {
  question: string;
  betterAnswer: string;
}

interface PracticePlanDay {
  day: number;
  task: string;
  timeMinutes: number;
}

interface PublicAnalysis {
  overallRecommendation: string | null;
  confidenceLevel: string | null;
  summary: string | null;
  dimensionScores: DimensionScore[] | null;
  strengths: string[] | null;
  risks: string[] | null;
  roleFitNotes: string[] | null;
  betterAnswers: BetterAnswer[] | null;
  practicePlan: PracticePlanDay[] | null;
  wins: string[] | null;
  improvements: string[] | null;
  createdAt: string;
}

interface AnalysisContext {
  interviewType: string | null;
  style: string | null;
  seniority: string | null;
  roleKitName: string | null;
  jobContext: {
    roleTitle: string;
  } | null;
}

const getRecommendationConfig = (rec: string) => {
  const configs: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
    strong_yes: { label: "Strong Yes", color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-300" },
    yes: { label: "Yes", color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-300" },
    lean_yes: { label: "Lean Yes", color: "text-lime-700", bgColor: "bg-lime-50", borderColor: "border-lime-300" },
    lean_no: { label: "Lean No", color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-300" },
    no: { label: "No", color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-300" },
  };
  return configs[rec] || configs.lean_yes;
};

const getScoreColor = (score: number) => {
  if (score >= 4) return "text-emerald-600";
  if (score >= 3) return "text-amber-600";
  return "text-red-500";
};

const getScoreBg = (score: number) => {
  if (score >= 4) return "bg-emerald-500";
  if (score >= 3) return "bg-amber-500";
  return "bg-red-500";
};

const getInterviewTypeIcon = (type: string | null | undefined) => {
  if (!type) return Briefcase;
  const t = type.toLowerCase();
  if (t.includes('coding') || t.includes('technical')) return Code;
  if (t.includes('behavioral') || t.includes('leadership')) return Users;
  if (t.includes('case') || t.includes('problem')) return Zap;
  return Briefcase;
};

const formatInterviewType = (type: string | null | undefined) => {
  if (!type) return 'Interview';
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export default function PublicResultsPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [analysis, setAnalysis] = useState<PublicAnalysis | null>(null);
  const [context, setContext] = useState<AnalysisContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicResults = async () => {
      if (!shareToken) {
        setError("Invalid share link");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/interview/results/public/${shareToken}`);
        const data = await response.json();
        
        if (data.success) {
          setAnalysis(data.analysis);
          setContext(data.context);
        } else {
          setError(data.error || "Results not found");
        }
      } catch (err) {
        setError("Failed to load results");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicResults();
  }, [shareToken]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e40af] to-[#1e3a5f] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e40af] to-[#1e3a5f] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Results Not Found</h2>
            <p className="text-gray-600 mb-6">{error || "These results may have been removed or made private."}</p>
            <Link to="/">
              <Button className="bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af]">
                Practice Your Own Interview
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const averageScore = analysis.dimensionScores
    ? analysis.dimensionScores.reduce((sum, d) => sum + d.score, 0) / analysis.dimensionScores.length
    : 0;

  const recConfig = analysis.overallRecommendation ? getRecommendationConfig(analysis.overallRecommendation) : null;
  const InterviewIcon = getInterviewTypeIcon(context?.interviewType);
  const practiceTitle = context?.jobContext?.roleTitle || context?.roleKitName || "Interview Practice";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#1e40af]">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
            <Target className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">Hiready</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Interview Results</h1>
          <p className="text-white/70">Shared on {new Date(analysis.createdAt).toLocaleDateString()}</p>
        </div>

        <Card className="shadow-2xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-[#042c4c] to-[#0a3d66] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <InterviewIcon className="w-6 h-6 text-[#60a5fa]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{practiceTitle}</h2>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-white/10 text-white border-white/20">
                {formatInterviewType(context?.interviewType)}
              </Badge>
              {context?.seniority && (
                <Badge className="bg-white/10 text-white border-white/20 capitalize">
                  {context.seniority}
                </Badge>
              )}
            </div>
          </div>

          <CardContent className="p-6 space-y-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl">
                <div className={`text-5xl font-bold ${averageScore >= 3 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {averageScore.toFixed(1)}
                </div>
                <div className="text-sm text-slate-500 mt-1">out of 5</div>
              </div>
              
              {recConfig && (
                <div className={`px-4 py-3 rounded-xl ${recConfig.bgColor} ${recConfig.borderColor} border-2`}>
                  <div className={`text-lg font-bold ${recConfig.color}`}>{recConfig.label}</div>
                  <div className="text-sm text-slate-600">Recommendation</div>
                </div>
              )}
            </div>

            {analysis.summary && (
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <h3 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#2563eb]" />
                  Summary
                </h3>
                <p className="text-slate-700">{analysis.summary}</p>
              </div>
            )}

            {analysis.dimensionScores && analysis.dimensionScores.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#2563eb]" />
                  Skill Dimensions
                </h3>
                <div className="space-y-3">
                  {analysis.dimensionScores.map((dim) => (
                    <div key={dim.dimension} className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-700 font-medium">{dim.dimension}</span>
                        <span className={`font-bold ${getScoreColor(dim.score)}`}>
                          {dim.score}/5
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${getScoreBg(dim.score)}`}
                          style={{ width: `${(dim.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {analysis.wins && analysis.wins.length > 0 && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <h4 className="text-sm font-medium text-emerald-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    What Went Well
                  </h4>
                  <ul className="space-y-2">
                    {analysis.wins.slice(0, 4).map((win, i) => (
                      <li key={i} className="text-sm text-emerald-700">{win}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {analysis.improvements && analysis.improvements.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <h4 className="text-sm font-medium text-amber-800 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Areas to Improve
                  </h4>
                  <ul className="space-y-2">
                    {analysis.improvements.slice(0, 4).map((imp, i) => (
                      <li key={i} className="text-sm text-amber-700">{imp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {analysis.betterAnswers && analysis.betterAnswers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-[#2563eb]" />
                  Sample Improved Answers
                </h3>
                <div className="space-y-4">
                  {analysis.betterAnswers.slice(0, 2).map((ba, i) => (
                    <div key={i} className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-sm font-medium text-blue-900 mb-2">Q: {ba.question}</p>
                      <p className="text-sm text-blue-700">{ba.betterAnswer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.practicePlan && analysis.practicePlan.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#2563eb]" />
                  7-Day Practice Plan
                </h3>
                <div className="grid gap-2">
                  {analysis.practicePlan.map((day) => (
                    <div key={day.day} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-[#2563eb]/10 flex items-center justify-center text-[#2563eb] font-bold text-sm">
                        {day.day}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{day.task}</p>
                      </div>
                      <div className="text-xs text-slate-500">{day.timeMinutes} min</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center pt-6 border-t border-slate-100">
              <p className="text-sm text-slate-500 mb-4">
                Results generated via <span className="font-semibold text-[#042c4c]">Hiready</span>
              </p>
              <Link to="/readycheck">
                <Button className="bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af]">
                  Practice Your Own Interview
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
