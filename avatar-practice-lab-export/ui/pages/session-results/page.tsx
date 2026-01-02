import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnalyticsDashboard } from "@/components/ai-session-analysis/analytics-dashboard";
import { ArrowLeft, Plus, BarChart3 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SidebarLayout } from "@/components/layout/sidebar-layout";

export default function SessionResultsPage() {
  const [analysis, setAnalysis] = useState<any>(null);
  const [transcript, setTranscript] = useState<any>(null);
  const [transcriptMessages, setTranscriptMessages] = useState<any>(null);
  const [skillAssessments, setSkillAssessments] = useState<any>(null);
  const [topicInsights, setTopicInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    async function fetchData() {
      try {
        const urlTranscriptId = searchParams?.get("id");
        const storedTranscriptId = localStorage.getItem("last_transcript_id");
        const transcriptId = urlTranscriptId || storedTranscriptId;

        if (!transcriptId) {
          setError("No transcript ID provided");
          setIsLoading(false);
          return;
        }

        if (!urlTranscriptId && storedTranscriptId) {
          navigate(`/avatar/session-results?id=${storedTranscriptId}`, { replace: true });
        }

        setIsLoading(true);

        const response = await fetch("/api/avatar/session-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcriptId }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || data.error || "Failed to load analysis");
        }

        setAnalysis(data.analysis);
        setTranscript(data.transcript);
        setTranscriptMessages(data.transcriptMessage);
        setSkillAssessments(data.skillAssessments);
        setError(null);
        
        // Fetch topic insights if this is an impromptu speaking session (has context but no scenario)
        const transcriptData = data.transcript;
        if (transcriptData?.context && !transcriptData?.scenarioId && !transcriptData?.scenario_id) {
          // This appears to be an impromptu session - fetch topic insights in the background
          fetch("/api/avatar/topic-insights", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic: transcriptData.context }),
          })
            .then(res => res.json())
            .then(insightsData => {
              if (insightsData.success && insightsData.insights) {
                setTopicInsights(insightsData.insights);
              }
            })
            .catch(err => console.error("Error fetching topic insights:", err));
        }
      } catch (err: any) {
        console.error("Error fetching analysis:", err);
        setError(err.message || "Failed to load session analysis");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [searchParams, navigate]);

  const handleCreateNewSession = () => {
    navigate("/avatar/practice");
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Loading your session analysis...
            </p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!analysis) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
              <p className="text-muted-foreground mb-6">
                Start a new practice session to see your analysis.
              </p>
              <Button onClick={handleCreateNewSession}>
                <Plus className="w-4 h-4 mr-2" />
                Start New Session
              </Button>
            </CardContent>
          </Card>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-xl font-semibold">Session Results</h1>
              </div>
              <Button
                onClick={handleCreateNewSession}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Session</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-6">
          <AnalyticsDashboard 
            analysis={analysis}
            transcript={transcript}
            transcriptMessages={transcriptMessages}
            skillAssessments={skillAssessments}
            topicInsights={topicInsights}
          />
        </div>
      </div>
    </SidebarLayout>
  );
}
