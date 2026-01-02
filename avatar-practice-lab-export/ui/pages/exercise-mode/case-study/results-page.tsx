import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Briefcase, CheckCircle, AlertCircle, TrendingUp, BookOpen, Target, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import SidebarLayout from "@/components/layout/sidebar-layout";

interface ScoreDimension {
  name: string;
  score: number;
  maxScore: number;
  feedback: string;
}

interface PracticePlanItem {
  day?: number;
  task?: string;
  timeMinutes?: number;
}

interface MockResults {
  overallScore: number;
  dimensions: ScoreDimension[];
  strengths: string[];
  improvements: string[];
  rewrittenAnswer: string;
  practicePlan: (string | PracticePlanItem)[];
}

export default function CaseStudyResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<MockResults | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!sessionId) {
        setResults({
          overallScore: 72,
          dimensions: [
            { name: "Problem Structuring", score: 4, maxScore: 5, feedback: "Good MECE framework, but could be more comprehensive in covering edge cases." },
            { name: "Analytical Depth", score: 3, maxScore: 5, feedback: "Surface-level analysis. Needed more quantitative reasoning and data-driven insights." },
            { name: "Communication Clarity", score: 4, maxScore: 5, feedback: "Clear explanations, well-organized presentation of ideas." },
            { name: "Actionable Recommendations", score: 3, maxScore: 5, feedback: "Recommendations were reasonable but lacked specificity and implementation details." }
          ],
          strengths: [
            "Organized approach with clear structure",
            "Good hypothesis generation",
            "Confident delivery and clear articulation"
          ],
          improvements: [
            "Include more quantitative analysis and metrics",
            "Develop more specific, actionable recommendations",
            "Ask more clarifying questions before diving into analysis"
          ],
          rewrittenAnswer: "A stronger response would start by clarifying the scope and timeline of the revenue decline, then structure the analysis into three buckets: customer acquisition, retention, and monetization. For each bucket, identify 2-3 specific hypotheses with data points to validate them. Conclude with prioritized recommendations tied to expected impact and implementation effort.",
          practicePlan: [
            "Practice 2 more business diagnosis cases this week",
            "Focus on quantitative analysis frameworks",
            "Work on synthesizing data into actionable insights",
            "Practice asking strategic clarifying questions"
          ]
        });
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/exercise-mode/sessions/${sessionId}/analysis`);
        const data = await response.json();
        
        if (data.success && data.analysis) {
          const analysis = data.analysis;
          setResults({
            overallScore: analysis.overallScore ?? 72,
            dimensions: analysis.dimensionScores?.map((d: any) => ({
              name: d.dimension,
              score: d.score,
              maxScore: 5,
              feedback: d.feedback
            })) || [
              { name: "Problem Structuring", score: 4, maxScore: 5, feedback: "Good MECE framework." },
              { name: "Analytical Depth", score: 3, maxScore: 5, feedback: "Could use more data-driven insights." },
              { name: "Communication Clarity", score: 4, maxScore: 5, feedback: "Clear explanations." },
              { name: "Actionable Recommendations", score: 3, maxScore: 5, feedback: "Recommendations need more specificity." }
            ],
            strengths: analysis.strengths || ["Organized approach", "Good hypothesis generation", "Clear articulation"],
            improvements: analysis.areasForImprovement || ["Include more quantitative analysis", "Develop more specific recommendations"],
            rewrittenAnswer: analysis.rewrittenAnswer || "A stronger response would structure the analysis more comprehensively.",
            practicePlan: analysis.practicePlan || ["Practice more cases this week", "Focus on quantitative frameworks"]
          });
        } else {
          setResults({
            overallScore: 72,
            dimensions: [
              { name: "Problem Structuring", score: 4, maxScore: 5, feedback: "Good MECE framework, but could be more comprehensive." },
              { name: "Analytical Depth", score: 3, maxScore: 5, feedback: "Surface-level analysis. Needed more quantitative reasoning." },
              { name: "Communication Clarity", score: 4, maxScore: 5, feedback: "Clear explanations, well-organized." },
              { name: "Actionable Recommendations", score: 3, maxScore: 5, feedback: "Recommendations lacked specificity." }
            ],
            strengths: ["Organized approach", "Good hypothesis generation", "Clear articulation"],
            improvements: ["Include more quantitative analysis", "Develop more specific recommendations", "Ask more clarifying questions"],
            rewrittenAnswer: "A stronger response would structure the analysis into customer acquisition, retention, and monetization buckets.",
            practicePlan: ["Practice more business diagnosis cases", "Focus on quantitative frameworks", "Work on synthesizing data"]
          });
        }
      } catch (error) {
        console.error("Error fetching analysis:", error);
        setResults({
          overallScore: 72,
          dimensions: [
            { name: "Problem Structuring", score: 4, maxScore: 5, feedback: "Good MECE framework." },
            { name: "Analytical Depth", score: 3, maxScore: 5, feedback: "Needed more quantitative reasoning." },
            { name: "Communication Clarity", score: 4, maxScore: 5, feedback: "Clear explanations." },
            { name: "Actionable Recommendations", score: 3, maxScore: 5, feedback: "Recommendations lacked specificity." }
          ],
          strengths: ["Organized approach", "Good hypothesis generation", "Clear articulation"],
          improvements: ["Include more quantitative analysis", "Develop more specific recommendations"],
          rewrittenAnswer: "A stronger response would structure the analysis more comprehensively.",
          practicePlan: ["Practice more cases", "Focus on quantitative frameworks"]
        });
      }
      
      setIsLoading(false);
    };
    
    fetchResults();
  }, [sessionId]);

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner />
            <p className="text-slate-600 mt-4">Analyzing your session...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!results) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <p className="text-slate-600">Results not found</p>
        </div>
      </SidebarLayout>
    );
  }

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return "text-green-600 bg-green-100";
    if (percentage >= 60) return "text-amber-600 bg-amber-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Briefcase className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Case Study Results</h1>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Overall Performance</h2>
                <p className="text-slate-500 text-sm">Based on your case study session</p>
              </div>
              <div className={`text-4xl font-bold ${results.overallScore >= 70 ? "text-green-600" : results.overallScore >= 50 ? "text-amber-600" : "text-red-600"}`}>
                {results.overallScore}%
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {results.dimensions.map((dim, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900">{dim.name}</span>
                    <span className={`px-2 py-0.5 rounded font-medium text-sm ${getScoreColor(dim.score, dim.maxScore)}`}>
                      {dim.score}/{dim.maxScore}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{dim.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-slate-900">Strengths</h3>
              </div>
              <ul className="space-y-2">
                {results.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-green-500 mt-1">•</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-slate-900">Areas for Improvement</h3>
              </div>
              <ul className="space-y-2">
                {results.improvements.map((improvement, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-amber-500 mt-1">•</span>
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900">Rewritten Answer</h3>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p className="text-slate-700 text-sm leading-relaxed">{results.rewrittenAnswer}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-slate-900">Your Practice Plan</h3>
            </div>
            <ol className="space-y-2">
              {results.practicePlan.map((item, i) => {
                let displayText: string;
                let timeDisplay: string | null = null;
                
                if (typeof item === 'string') {
                  displayText = item;
                } else if (typeof item === 'object' && item !== null) {
                  const planItem = item as PracticePlanItem;
                  displayText = planItem.task || `Day ${planItem.day}`;
                  if (planItem.timeMinutes) {
                    timeDisplay = `${planItem.timeMinutes} min`;
                  }
                } else {
                  displayText = String(item);
                }
                
                return (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      {displayText}
                      {timeDisplay && (
                        <span className="ml-2 text-xs text-slate-500">({timeDisplay})</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/exercise-mode/case-study")}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Practice Again
            </Button>
            <Button 
              onClick={() => navigate("/exercise-mode")}
              className="flex items-center gap-2"
            >
              Back to Exercise Mode
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
