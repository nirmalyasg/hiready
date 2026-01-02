import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnalyticsDashboard } from "@/components/ai-session-analysis/analytics-dashboard";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SidebarLayout } from "@/components/layout/sidebar-layout";

export default function MicroAssessmentSessionAnalysisPage() {
  const [searchParams] = useSearchParams();
  const sessionType = searchParams.get("type");
  const sessionId = searchParams.get("sid");
  const transcriptId = searchParams.get("tid") || null;
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/avatar/session-analysis", transcriptId],
    queryFn: async () => {
      const response = await fetch("/api/avatar/session-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcriptId,
          sessionId,
          sessionType,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || data?.message);
      }
      return data;
    },
    enabled: !!transcriptId,
  });

  const handleBackNavigation = () => {
    const assignmentId = searchParams.get("assignmentId");
    const skillId = searchParams.get("skill");
    
    if (assignmentId) {
      navigate(`/micro-assessment-assignment/${assignmentId}?show=report`);
      return;
    }
    // Navigate to scenarios page with skill context if available
    if (skillId) {
      navigate(`/avatar/practice?skill=${skillId}`);
    } else {
      navigate("/avatar/practice");
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your session analysis...</p>
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
            <p className="text-red-500 mb-4">Error loading your session analysis</p>
            <Button onClick={handleBackNavigation}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!data || !data.analysis) {
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
                Complete an assessment session to see your analysis.
              </p>
              <Button onClick={handleBackNavigation}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
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
          <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-4">
                <Button variant="ghost" size="sm" onClick={handleBackNavigation} className="px-2 sm:px-3 shrink-0">
                  <ArrowLeft className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                <h1 className="text-base sm:text-xl font-semibold">Session Analysis</h1>
              </div>
              {searchParams.get("assignmentId") && (
                <Button onClick={handleBackNavigation} size="sm" className="w-full sm:w-auto text-sm">
                  <span className="sm:hidden">Assessment</span>
                  <span className="hidden sm:inline">Back to Assessment Details</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-20 sm:pb-6">
          <AnalyticsDashboard 
            analysis={data.analysis}
            transcript={data.transcript}
            transcriptMessages={data.transcriptMessage}
            skillAssessments={data.skillAssessments}
          />
        </div>
      </div>
    </SidebarLayout>
  );
}
