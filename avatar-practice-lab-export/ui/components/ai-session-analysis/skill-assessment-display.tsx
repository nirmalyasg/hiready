import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { 
  Target,
  TrendingUp,
  TrendingDown,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  User,
  Shield,
  Lightbulb,
  XCircle,
  Award,
  BarChart3,
} from "lucide-react";

interface DimensionAssessment {
  dimension_name: string;
  score: number;
  max_score: number;
  evidence: string;
  framework_reference: string;
  skill_name?: string;
  skill_id?: number;
}

interface SkillSummary {
  skill_id: number;
  skill_name: string;
  overall_skill_score: number;
  framework_used: string;
  framework_mapping?: string;
  assessment_notes: string;
  strength_dimensions: string[];
  improvement_dimensions: string[];
}

interface SkillAssessmentDisplayProps {
  summary: SkillSummary[];
  dimensions: DimensionAssessment[];
}

export function SkillAssessmentDisplay({ summary, dimensions }: SkillAssessmentDisplayProps) {
  if (!summary || summary.length === 0) {
    return null;
  }

  const getScoreColor = (score: number, maxScore: number = 5) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number, maxScore: number = 5) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "bg-green-100 border-green-200";
    if (percentage >= 60) return "bg-amber-100 border-amber-200";
    return "bg-red-100 border-red-200";
  };

  const getProgressColor = (score: number, maxScore: number = 5) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const getScoreLabel = (score: number, maxScore: number = 5) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "Excellent";
    if (percentage >= 60) return "Good";
    if (percentage >= 40) return "Developing";
    return "Needs Work";
  };

  const getDimensionsForSkill = (skillId: number) => {
    return dimensions.filter((d: any) => d.skill_id === skillId);
  };

  return (
    <div className="space-y-4">
      {summary.map((skill: SkillSummary) => {
        const skillDimensions = getDimensionsForSkill(skill.skill_id);
        const strengthDims = Array.isArray(skill.strength_dimensions) 
          ? skill.strength_dimensions 
          : JSON.parse(skill.strength_dimensions as any || "[]");
        const improvementDims = Array.isArray(skill.improvement_dimensions)
          ? skill.improvement_dimensions
          : JSON.parse(skill.improvement_dimensions as any || "[]");

        return (
          <Card key={skill.skill_id} className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background overflow-hidden">
            <CardHeader className="pb-3 bg-primary/5 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-14 h-14 rounded-xl border-2 ${getScoreBg(skill.overall_skill_score)}`}>
                    <span className={`text-xl font-bold ${getScoreColor(skill.overall_skill_score)}`}>
                      {skill.overall_skill_score.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" />
                      {skill.skill_name}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <BookOpen className="w-3 h-3" />
                      {skill.framework_used || skill.framework_mapping}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${getScoreBg(skill.overall_skill_score)} ${getScoreColor(skill.overall_skill_score)} border font-medium`}>
                    {getScoreLabel(skill.overall_skill_score)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-4 space-y-5">
              {skill.assessment_notes && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-blue-800 mb-1">Assessment Summary</p>
                      <p className="text-sm text-blue-700">{skill.assessment_notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {skillDimensions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2 text-gray-700">
                    <BarChart3 className="w-4 h-4" />
                    Skill Dimensions Breakdown
                  </h4>
                  <div className="grid gap-3">
                    {skillDimensions.map((dim: DimensionAssessment, idx: number) => (
                      <div key={idx} className="p-3 bg-white rounded-lg border space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2 font-medium text-sm">
                            {dim.score >= 4 ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : dim.score <= 2 ? (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-amber-400" />
                            )}
                            {dim.dimension_name}
                          </span>
                          <span className={`font-bold ${getScoreColor(dim.score, dim.max_score)}`}>
                            {dim.score.toFixed(1)} / {dim.max_score}
                          </span>
                        </div>
                        <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${getProgressColor(dim.score, dim.max_score)}`}
                            style={{ width: `${(dim.score / dim.max_score) * 100}%` }}
                          />
                        </div>
                        {dim.evidence && (
                          <p className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded">
                            "{dim.evidence}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {strengthDims.length > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <h4 className="font-semibold text-sm flex items-center gap-2 text-green-700 mb-3">
                      <TrendingUp className="w-4 h-4" />
                      Your Strengths
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {strengthDims.map((dim: string, idx: number) => (
                        <Badge key={idx} className="bg-green-100 text-green-700 border border-green-200 hover:bg-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {dim}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {improvementDims.length > 0 && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                    <h4 className="font-semibold text-sm flex items-center gap-2 text-amber-700 mb-3">
                      <TrendingDown className="w-4 h-4" />
                      Areas to Develop
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {improvementDims.map((dim: string, idx: number) => (
                        <Badge key={idx} className="bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200">
                          <Target className="w-3 h-3 mr-1" />
                          {dim}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export interface PersonaFitResult {
  persona: string;
  mistakesObserved: string[];
  authorityUsage: string;
  tailoredAdvice: string;
  successCriteriaMet: string[];
  overallPersonaFit: number;
}

interface PersonaFitDisplayProps {
  personaFit: PersonaFitResult;
}

export function PersonaFitDisplay({ personaFit }: PersonaFitDisplayProps) {
  if (!personaFit) return null;

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600";
    if (score >= 3) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 4) return "bg-green-100 border-green-200";
    if (score >= 3) return "bg-amber-100 border-amber-200";
    return "bg-red-100 border-red-200";
  };

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-background">
      <CardHeader className="pb-3 bg-indigo-50/50 border-b border-indigo-100">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-14 h-14 rounded-xl border-2 ${getScoreBg(personaFit.overallPersonaFit)}`}>
            <span className={`text-xl font-bold ${getScoreColor(personaFit.overallPersonaFit)}`}>
              {personaFit.overallPersonaFit.toFixed(1)}
            </span>
          </div>
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Role Performance: {personaFit.persona}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {personaFit.overallPersonaFit >= 4 
                ? "Excellent alignment with role expectations"
                : personaFit.overallPersonaFit >= 3
                ? "Good performance with some areas to refine"
                : "Opportunities to better align with role level"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <h4 className="font-semibold text-sm flex items-center gap-2 text-green-700 mb-3">
              <CheckCircle2 className="w-4 h-4" />
              Success Criteria Met
            </h4>
            {personaFit.successCriteriaMet.length > 0 ? (
              <ul className="space-y-2">
                {personaFit.successCriteriaMet.map((criteria, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                    <span className="text-green-800">{criteria}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No success criteria fully achieved yet</p>
            )}
          </div>

          <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
            <h4 className="font-semibold text-sm flex items-center gap-2 text-amber-700 mb-3">
              <AlertCircle className="w-4 h-4" />
              Mistakes to Avoid
            </h4>
            {personaFit.mistakesObserved.length > 0 ? (
              <ul className="space-y-2">
                {personaFit.mistakesObserved.map((mistake, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <XCircle className="w-3 h-3 text-amber-500 mt-1 shrink-0" />
                    <span className="text-amber-800">{mistake}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-green-600">Great job - no common role mistakes observed!</p>
            )}
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h4 className="font-semibold text-sm flex items-center gap-2 text-blue-700 mb-2">
            <Shield className="w-4 h-4" />
            Authority Usage
          </h4>
          <p className="text-sm text-blue-800">{personaFit.authorityUsage}</p>
        </div>

        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <h4 className="font-semibold text-sm flex items-center gap-2 text-primary mb-2">
            <Lightbulb className="w-4 h-4" />
            Personalized Coaching Tip
          </h4>
          <p className="text-sm">{personaFit.tailoredAdvice}</p>
        </div>
      </CardContent>
    </Card>
  );
}
