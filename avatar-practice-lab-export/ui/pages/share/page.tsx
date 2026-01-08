import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, CheckCircle, TrendingUp, Award, ArrowRight, Briefcase } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface DimensionScore {
  dimension: string;
  score: number;
  maxScore: number;
}

interface PublicHireadyIndex {
  overallScore: number;
  dimensionScores: DimensionScore[];
  completedInterviewTypes: string[];
  totalSessions: number;
  readinessLevel: string;
  strengths: string[];
  improvements: string[];
  createdAt: string;
}

const getReadinessConfig = (level: string) => {
  const configs: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
    exceptional: { label: "Exceptional", color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-300" },
    strong: { label: "Strong", color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-300" },
    ready: { label: "Ready", color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-300" },
    developing: { label: "Developing", color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-300" },
    not_ready: { label: "Needs Work", color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-300" },
  };
  return configs[level] || configs.developing;
};

const getScoreColor = (score: number, maxScore: number = 5) => {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return "bg-emerald-500";
  if (percentage >= 60) return "bg-blue-500";
  if (percentage >= 40) return "bg-amber-500";
  return "bg-red-500";
};

const formatInterviewType = (type: string) => {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export default function PublicSharePage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [indexData, setIndexData] = useState<PublicHireadyIndex | null>(null);
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
        const response = await fetch(`/api/interview/hiready-index/public/${shareToken}`);
        const data = await response.json();
        
        if (data.success) {
          setIndexData(data.hireadyIndex);
        } else {
          setError(data.error || "Scorecard not found");
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
      <div className="min-h-screen bg-gradient-to-br from-[#042c4c] to-[#0a3d66] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !indexData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#042c4c] to-[#0a3d66] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Scorecard Not Found</h2>
            <p className="text-gray-600 mb-6">{error || "This scorecard may have been removed or made private."}</p>
            <Link to="/">
              <Button className="bg-[#ee7e65] hover:bg-[#d96a52]">
                Create Your Own
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const readinessConfig = getReadinessConfig(indexData.readinessLevel);
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (indexData.overallScore / 100) * circumference;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#042c4c] via-[#0a3d66] to-[#042c4c]">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
            <Target className="w-5 h-5 text-[#ee7e65]" />
            <span className="text-white font-semibold">Hiready Index™</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Interview Readiness Scorecard</h1>
          <p className="text-white/70">Generated on {new Date(indexData.createdAt).toLocaleDateString()}</p>
        </div>

        <Card className={`border-2 ${readinessConfig.borderColor} shadow-2xl`}>
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
                    style={{ 
                      stroke: indexData.overallScore >= 80 ? '#059669' : 
                              indexData.overallScore >= 60 ? '#ee7e65' : 
                              indexData.overallScore >= 40 ? '#d97706' : '#dc2626'
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-gray-900">{indexData.overallScore}</span>
                  <span className="text-sm text-gray-500">/ 100</span>
                </div>
              </div>
              
              <Badge className={`${readinessConfig.bgColor} ${readinessConfig.color} border ${readinessConfig.borderColor} text-lg px-4 py-1`}>
                {readinessConfig.label}
              </Badge>
              
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{indexData.totalSessions} interviews</span>
                </div>
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4 text-blue-500" />
                  <span>{indexData.completedInterviewTypes.length} types</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Skill Dimensions
              </h3>
              {indexData.dimensionScores.map((dim) => (
                <div key={dim.dimension} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{dim.dimension}</span>
                    <span className="font-medium text-gray-900">
                      {dim.score.toFixed(1)}/{dim.maxScore}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${getScoreColor(dim.score, dim.maxScore)}`}
                      style={{ width: `${(dim.score / dim.maxScore) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {indexData.completedInterviewTypes.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Interview Types Completed</h3>
                <div className="flex flex-wrap gap-2">
                  {indexData.completedInterviewTypes.map((type) => (
                    <Badge key={type} variant="outline" className="bg-gray-50">
                      {formatInterviewType(type)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-8">
              {indexData.strengths.length > 0 && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <h4 className="text-sm font-medium text-emerald-800 mb-2 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Strengths
                  </h4>
                  <ul className="space-y-1">
                    {indexData.strengths.slice(0, 3).map((s, i) => (
                      <li key={i} className="text-xs text-emerald-700">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {indexData.improvements.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Focus Areas
                  </h4>
                  <ul className="space-y-1">
                    {indexData.improvements.slice(0, 3).map((s, i) => (
                      <li key={i} className="text-xs text-amber-700">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-4">
                Generated via <span className="font-semibold text-[#042c4c]">Hiready</span>
              </p>
              <Link to="/register">
                <Button className="bg-[#ee7e65] hover:bg-[#d96a52]">
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
