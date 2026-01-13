import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, CheckCircle, TrendingUp, Award, ArrowRight, Briefcase, BarChart3, Code, Users, Zap } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface DimensionScore {
  key: string;
  label: string;
  score: number;
}

interface ReadinessBand {
  band: string;
  label: string;
  description: string;
}

interface InterviewScore {
  interviewType: string;
  weight: number;
  latestScore: number | null;
  attemptCount: number;
}

interface PublicHireadyData {
  candidateName: string;
  role: string;
  companyContext: string | null;
  overallScore: number;
  readinessBand: ReadinessBand;
  dimensions: DimensionScore[];
  strengths: string[];
  interviewScores: InterviewScore[];
  totalSessions: number;
  lastUpdated: string;
}

const getBandConfig = (band: string) => {
  const configs: Record<string, { label: string; color: string; bgColor: string; borderColor: string; ringColor: string }> = {
    interview_ready: { label: "Interview-Ready", color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-300", ringColor: "#059669" },
    strong_foundation: { label: "Strong Foundation", color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-300", ringColor: "#3B82F6" },
    developing: { label: "Developing", color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-300", ringColor: "#D97706" },
    early_stage: { label: "Early Stage", color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-300", ringColor: "#DC2626" },
  };
  return configs[band] || configs.developing;
};

const getProgressColor = (score: number) => {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 55) return "bg-blue-500";
  if (score >= 35) return "bg-amber-500";
  return "bg-red-500";
};

const getInterviewTypeIcon = (type: string) => {
  if (type.includes('coding') || type.includes('technical') || type.includes('system') || type.includes('sql')) return Code;
  if (type.includes('behavioral') || type.includes('hr') || type.includes('hiring')) return Users;
  if (type.includes('case') || type.includes('product')) return Zap;
  return Briefcase;
};

const formatInterviewType = (type: string) => {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export default function PublicSharePage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [data, setData] = useState<PublicHireadyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicIndex = async () => {
      if (!shareToken) {
        setError("Invalid share link");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/interview-progress/share/${shareToken}`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || "Scorecard not found");
        }
      } catch (err) {
        setError("Failed to load scorecard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicIndex();
  }, [shareToken]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Scorecard Not Found</h2>
            <p className="text-gray-600 mb-6">{error || "This scorecard may have been removed or expired."}</p>
            <Link to="/">
              <Button className="bg-[#24c4b8] hover:bg-[#1db0a5] text-white">
                Create Your Own
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bandConfig = getBandConfig(data.readinessBand.band);
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (data.overallScore / 100) * circumference;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
            <Target className="w-5 h-5 text-[#24c4b8]" />
            <span className="text-white font-semibold">Hiready Index™</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{data.role}</h1>
          {data.companyContext && (
            <p className="text-white/70 mb-2">at {data.companyContext}</p>
          )}
          <p className="text-white/50 text-sm">
            Generated via AI interview simulation
          </p>
        </div>

        <Card className={`border-2 ${bandConfig.borderColor} shadow-2xl mb-6`}>
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4">
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{ stroke: bandConfig.ringColor }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-gray-900">{data.overallScore}</span>
                  <span className="text-sm text-gray-500">/ 100</span>
                </div>
              </div>
              
              <Badge className={`${bandConfig.bgColor} ${bandConfig.color} border ${bandConfig.borderColor} text-lg px-4 py-1`}>
                <Award className="w-4 h-4 mr-2" />
                {data.readinessBand.label}
              </Badge>
              
              <p className="text-gray-600 text-sm mt-2 text-center max-w-xs">
                {data.readinessBand.description}
              </p>
              
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{data.totalSessions} practice sessions</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#24c4b8]" />
                Core Dimensions
              </h3>
              <div className="space-y-3">
                {data.dimensions.map((dim) => (
                  <div key={dim.key} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-700">{dim.label}</span>
                      <span className={`font-semibold ${dim.score >= 75 ? 'text-emerald-600' : dim.score >= 55 ? 'text-blue-600' : dim.score >= 35 ? 'text-amber-600' : 'text-red-500'}`}>
                        {dim.score}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getProgressColor(dim.score)} transition-all duration-500`}
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {data.strengths.length > 0 && (
              <div className="border-t pt-6 mt-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  Top Strengths
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.strengths.map((strength, i) => (
                    <Badge key={i} variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {data.interviewScores.length > 0 && (
              <div className="border-t pt-6 mt-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#24c4b8]" />
                  Interview Types Completed
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {data.interviewScores.map((score) => {
                    const Icon = getInterviewTypeIcon(score.interviewType);
                    return (
                      <div
                        key={score.interviewType}
                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                      >
                        <Icon className="w-4 h-4 text-[#24c4b8]" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-700">
                            {formatInterviewType(score.interviewType)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {score.latestScore !== null ? `${score.latestScore}%` : '-'} • {score.attemptCount} attempts
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-white/50 text-sm mb-4">
            Want to build your own interview readiness score?
          </p>
          <Link to="/">
            <Button className="bg-[#24c4b8] hover:bg-[#1db0a5] text-white">
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="text-center mt-8 text-white/30 text-xs">
          Powered by hiready.app
        </div>
      </div>
    </div>
  );
}
