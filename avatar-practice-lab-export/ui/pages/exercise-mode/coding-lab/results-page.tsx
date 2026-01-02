import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Code, CheckCircle, AlertCircle, TrendingUp, Lightbulb, Target, ArrowRight, RotateCcw, Eye, Bug, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import SidebarLayout from "@/components/layout/sidebar-layout";

interface ScoreDimension {
  name: string;
  score: number;
  maxScore: number;
  feedback: string;
}

interface MockResults {
  overallScore: number;
  activityType: "explain" | "debug" | "modify";
  dimensions: ScoreDimension[];
  signalsHit: string[];
  signalsMissed: string[];
  suggestedFix: string | null;
  practicePlan: string[];
}

const activityConfig = {
  explain: { label: "Explain Code", icon: Eye, color: "text-blue-600" },
  debug: { label: "Debug Code", icon: Bug, color: "text-red-600" },
  modify: { label: "Modify Code", icon: Wrench, color: "text-emerald-600" }
};

export default function CodingLabResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const exerciseId = searchParams.get("exerciseId");

  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<MockResults | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      const sessionId = searchParams.get("sessionId");
      
      if (sessionId) {
        try {
          const response = await fetch(`/api/exercise-mode/sessions/${sessionId}/analysis`, {
              credentials: 'include'
            });
          const data = await response.json();
          
          if (data.success && data.analysis) {
            const analysis = data.analysis;
            setResults({
              overallScore: analysis.overallScore ?? 78,
              activityType: analysis.activityType || "explain",
              dimensions: analysis.dimensionScores?.map((d: any) => ({
                name: d.dimension,
                score: d.score,
                maxScore: 5,
                feedback: d.feedback
              })) || [
                { name: "Code Understanding", score: 4, maxScore: 5, feedback: "Good understanding of core logic." },
                { name: "Problem Solving", score: 4, maxScore: 5, feedback: "Strong systematic approach." },
                { name: "Technical Communication", score: 3, maxScore: 5, feedback: "Explanations could be more concise." }
              ],
              signalsHit: analysis.signalsHit || ["Correctly explained the algorithm", "Identified key design decisions"],
              signalsMissed: analysis.signalsMissed || ["Could have discussed alternatives", "Missed some edge cases"],
              suggestedFix: analysis.suggestedFix || null,
              practicePlan: analysis.practicePlan || ["Practice more exercises", "Focus on edge cases"]
            });
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error fetching analysis:", error);
        }
      }
      
      setResults({
        overallScore: 78,
        activityType: "explain",
        dimensions: [
          { name: "Code Understanding", score: 4, maxScore: 5, feedback: "Good understanding of core logic, but missed some thread safety implications." },
          { name: "Problem Solving", score: 4, maxScore: 5, feedback: "Strong systematic approach to analyzing the code structure." },
          { name: "Technical Communication", score: 3, maxScore: 5, feedback: "Explanations were clear but could be more concise. Some jargon without context." }
        ],
        signalsHit: [
          "Correctly explained the sliding window algorithm",
          "Identified the purpose of the Lock for thread safety",
          "Discussed memory growth implications",
          "Mentioned time complexity analysis"
        ],
        signalsMissed: [
          "Did not discuss alternatives like token bucket algorithm",
          "Missed edge case with clock skew in distributed systems",
          "Could have suggested using sorted containers for O(log n) operations"
        ],
        suggestedFix: `For distributed rate limiting, consider using Redis with atomic operations:

class DistributedRateLimiter:
    def __init__(self, redis_client, max_requests, window_seconds):
        self.redis = redis_client
        self.max_requests = max_requests
        self.window_seconds = window_seconds
    
    def is_allowed(self, client_id: str) -> bool:
        key = f"ratelimit:{client_id}"
        current = self.redis.incr(key)
        if current == 1:
            self.redis.expire(key, self.window_seconds)
        return current <= self.max_requests`,
        practicePlan: [
          "Practice 2 more 'Explain Code' exercises focused on concurrency",
          "Study alternative rate limiting algorithms (token bucket, leaky bucket)",
          "Work on explaining technical concepts more concisely",
          "Review distributed systems patterns for common interview questions"
        ]
      });
      
      setIsLoading(false);
    };
    
    fetchResults();
  }, [exerciseId, searchParams]);

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

  const config = activityConfig[results.activityType];
  const ActivityIcon = config.icon;

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
            <Code className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Coding Lab Results</h1>
            <span className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${config.color} bg-opacity-10`}>
              <ActivityIcon className="w-4 h-4" />
              {config.label}
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Overall Performance</h2>
                <p className="text-slate-500 text-sm">Based on your coding lab session</p>
              </div>
              <div className={`text-4xl font-bold ${results.overallScore >= 70 ? "text-green-600" : results.overallScore >= 50 ? "text-amber-600" : "text-red-600"}`}>
                {results.overallScore}%
              </div>
            </div>

            <div className="space-y-4">
              {results.dimensions.map((dim, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900">{dim.name}</span>
                    <span className={`px-2 py-0.5 rounded font-medium text-sm ${getScoreColor(dim.score, dim.maxScore)}`}>
                      {dim.score}/{dim.maxScore}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full ${dim.score / dim.maxScore >= 0.8 ? "bg-green-500" : dim.score / dim.maxScore >= 0.6 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${(dim.score / dim.maxScore) * 100}%` }}
                    />
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
                <h3 className="font-semibold text-slate-900">Signals Hit</h3>
              </div>
              <ul className="space-y-2">
                {results.signalsHit.map((signal, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-green-500 mt-1">✓</span>
                    {signal}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-slate-900">Signals Missed</h3>
              </div>
              <ul className="space-y-2">
                {results.signalsMissed.map((signal, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-amber-500 mt-1">○</span>
                    {signal}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {results.suggestedFix && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Suggested Improvement</h3>
              </div>
              <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-slate-300">
                  <code>{results.suggestedFix}</code>
                </pre>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-slate-900">Your Practice Plan</h3>
            </div>
            <ol className="space-y-2">
              {results.practicePlan.map((item, i) => {
                const text = typeof item === 'string' 
                  ? item 
                  : (item as any).task || JSON.stringify(item);
                return (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {i + 1}
                    </span>
                    {text}
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/exercise-mode/coding-lab")}
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
