import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  TrendingUp, 
  Award, 
  CheckCircle, 
  Share2, 
  Download, 
  ChevronRight,
  Briefcase,
  Code,
  Users,
  MessageSquare,
  Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DimensionScore {
  dimension: string;
  score: number;
  maxScore: number;
  evidence?: string[];
  weight?: number;
}

interface SessionBreakdown {
  sessionId: number;
  interviewType: string;
  score: number;
  completedAt: string;
}

interface HireadyIndexData {
  overallScore: number;
  dimensionScores: DimensionScore[];
  completedInterviewTypes: string[];
  totalSessions: number;
  sessionBreakdown: SessionBreakdown[];
  strengths: string[];
  improvements: string[];
  readinessLevel: "not_ready" | "developing" | "ready" | "strong" | "exceptional";
  roleContext?: {
    roleName?: string;
    companyName?: string;
  };
}

interface HireadyIndexCardProps {
  data: HireadyIndexData;
  showSessionBreakdown?: boolean;
  showShareButton?: boolean;
  onShare?: () => void;
  onDownload?: () => void;
  compact?: boolean;
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
  if (percentage >= 80) return "text-emerald-600";
  if (percentage >= 60) return "text-blue-600";
  if (percentage >= 40) return "text-amber-600";
  return "text-red-600";
};

const getProgressColor = (score: number, maxScore: number = 5) => {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return "bg-emerald-500";
  if (percentage >= 60) return "bg-blue-500";
  if (percentage >= 40) return "bg-amber-500";
  return "bg-red-500";
};

const getInterviewTypeIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('coding') || t.includes('technical')) return Code;
  if (t.includes('behavioral') || t.includes('hr')) return Users;
  if (t.includes('case')) return Brain;
  return Briefcase;
};

const formatInterviewType = (type: string) => {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export function HireadyIndexCard({
  data,
  showSessionBreakdown = true,
  showShareButton = true,
  onShare,
  onDownload,
  compact = false,
}: HireadyIndexCardProps) {
  const readinessConfig = getReadinessConfig(data.readinessLevel);
  const circumference = 2 * Math.PI * 45;
  const scorePercentage = data.overallScore;
  const strokeDashoffset = circumference - (scorePercentage / 100) * circumference;

  return (
    <Card className={`border-2 ${readinessConfig.borderColor} ${readinessConfig.bgColor}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Target className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Hiready Index™
              </CardTitle>
              {data.roleContext?.roleName && (
                <p className="text-sm text-gray-600">
                  {data.roleContext.roleName}
                  {data.roleContext.companyName && ` at ${data.roleContext.companyName}`}
                </p>
              )}
            </div>
          </div>
          <Badge className={`${readinessConfig.bgColor} ${readinessConfig.color} border ${readinessConfig.borderColor}`}>
            {readinessConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center gap-8">
          <div className="relative">
            <svg className="w-28 h-28 transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="56"
                cy="56"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={getScoreColor(data.overallScore, 100).replace('text-', 'text-')}
                style={{ 
                  stroke: data.overallScore >= 80 ? '#059669' : 
                          data.overallScore >= 60 ? '#2563eb' : 
                          data.overallScore >= 40 ? '#d97706' : '#dc2626'
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">{data.overallScore}</span>
              <span className="text-xs text-gray-500">/ 100</span>
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>{data.totalSessions} interview{data.totalSessions !== 1 ? 's' : ''} completed</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span>{data.completedInterviewTypes.length} interview type{data.completedInterviewTypes.length !== 1 ? 's' : ''} covered</span>
            </div>
            {data.completedInterviewTypes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {data.completedInterviewTypes.map((type) => (
                  <Badge key={type} variant="outline" className="text-xs bg-white">
                    {formatInterviewType(type)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {!compact && (
          <>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Skill Dimensions
              </h4>
              <div className="space-y-2">
                {data.dimensionScores.map((dim) => (
                  <div key={dim.dimension} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{dim.dimension}</span>
                      <span className={`font-medium ${getScoreColor(dim.score, dim.maxScore)}`}>
                        {dim.score.toFixed(1)}/{dim.maxScore}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${getProgressColor(dim.score, dim.maxScore)}`}
                        style={{ width: `${(dim.score / dim.maxScore) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {showSessionBreakdown && data.sessionBreakdown.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Interview Breakdown
                </h4>
                <div className="grid gap-2">
                  {data.sessionBreakdown.map((session) => {
                    const Icon = getInterviewTypeIcon(session.interviewType);
                    return (
                      <div 
                        key={session.sessionId}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-gray-50 rounded">
                            <Icon className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {formatInterviewType(session.interviewType)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(session.completedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-semibold ${getScoreColor(session.score, 100)}`}>
                            {session.score}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(data.strengths.length > 0 || data.improvements.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {data.strengths.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-green-700">Strengths</h4>
                    <ul className="space-y-1">
                      {data.strengths.slice(0, 3).map((strength, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.improvements.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-amber-700">Areas to Improve</h4>
                    <ul className="space-y-1">
                      {data.improvements.slice(0, 3).map((improvement, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                          <TrendingUp className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {showShareButton && (
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={onShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Scorecard
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onDownload}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function HireadyIndexMini({ score, level }: { score: number; level: string }) {
  const readinessConfig = getReadinessConfig(level);
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${readinessConfig.bgColor} border ${readinessConfig.borderColor}`}>
      <Target className="w-4 h-4 text-[#ee7e65]" />
      <span className="text-sm font-semibold text-gray-900">{score}</span>
      <Badge className={`${readinessConfig.color} bg-transparent border-0 px-0 text-xs`}>
        {readinessConfig.label}
      </Badge>
    </div>
  );
}
