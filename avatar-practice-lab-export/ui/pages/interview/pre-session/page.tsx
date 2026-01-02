import { useState, useEffect } from "react";
import { ChevronRight, Play, Clock, Target, Users, MessageSquare, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface InterviewPlan {
  phases: {
    name: string;
    duration: number;
    objectives: string[];
    questionPatterns: string[];
  }[];
  triggers: {
    type: string;
    source: string;
    probeRules: string[];
  }[];
  focusAreas: string[];
}

interface InterviewConfig {
  id: number;
  interviewType: string;
  style: string;
  seniority: string;
}

interface RoleKit {
  id: number;
  name: string;
  level: string;
  domain: string;
}

export default function InterviewPreSessionPage() {
  const [searchParams] = useSearchParams();
  const configId = searchParams.get("configId");
  const planId = searchParams.get("planId");
  const navigate = useNavigate();

  const [plan, setPlan] = useState<InterviewPlan | null>(null);
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [roleKit, setRoleKit] = useState<RoleKit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (configId) {
          const configResponse = await fetch(`/api/interview/config/${configId}`);
          const configData = await configResponse.json();
          if (configData.success) {
            setConfig(configData.config);
            if (configData.roleKit) setRoleKit(configData.roleKit);
          }
        }
        if (planId) {
          const planResponse = await fetch(`/api/interview/plan/${planId}`);
          const planData = await planResponse.json();
          if (planData.success) {
            setPlan(planData.plan.planJson);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [configId, planId]);

  const handleStartInterview = async () => {
    setStarting(true);
    try {
      const response = await fetch("/api/interview/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewConfigId: configId ? parseInt(configId) : null,
          interviewPlanId: planId ? parseInt(planId) : null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        navigate(`/avatar/practice/avatar-select?interviewSessionId=${data.session.id}&configId=${configId}`);
      }
    } catch (error) {
      console.error("Error starting session:", error);
    } finally {
      setStarting(false);
    }
  };

  const getTotalDuration = () => {
    if (!plan) return 0;
    return plan.phases.reduce((sum, phase) => sum + phase.duration, 0);
  };

  const getInterviewTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hr: "HR / Recruiter Screen",
      hiring_manager: "Hiring Manager Interview",
      technical: "Technical Interview",
      panel: "Panel Interview",
    };
    return labels[type] || type;
  };

  const getStyleLabel = (style: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      friendly: { label: "Friendly", color: "bg-emerald-100 text-emerald-700" },
      neutral: { label: "Neutral", color: "bg-slate-100 text-slate-700" },
      stress: { label: "Challenging", color: "bg-rose-100 text-rose-700" },
    };
    return labels[style] || { label: style, color: "bg-slate-100 text-slate-700" };
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white pb-24 sm:pb-8">
        <div className="bg-gradient-to-br from-indigo-500/5 via-white to-purple-50/30 border-b border-slate-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
            <Link
              to={`/interview/context?roleKitId=${roleKit?.id || ""}`}
              className="inline-flex items-center text-slate-500 hover:text-indigo-600 mb-4 text-sm font-medium transition-colors group"
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1 group-hover:-translate-x-0.5 transition-transform" />
              Back to Context
            </Link>
            
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Step 3 of 4</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Interview Plan Ready
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              {roleKit ? (
                <>Your personalized <span className="font-medium text-indigo-600">{roleKit.name}</span> interview is ready. Review the plan below.</>
              ) : (
                <>Your interview plan is ready. Review what to expect before starting.</>
              )}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-4xl">
          <div className="grid gap-6">
            <div className="flex flex-wrap gap-3">
              {config && (
                <>
                  <Badge variant="outline" className="px-3 py-1.5 text-sm">
                    <Users className="w-4 h-4 mr-1.5" />
                    {getInterviewTypeLabel(config.interviewType)}
                  </Badge>
                  <Badge className={`${getStyleLabel(config.style).color} px-3 py-1.5 text-sm border-0`}>
                    {getStyleLabel(config.style).label} Style
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1.5 text-sm">
                    <Clock className="w-4 h-4 mr-1.5" />
                    ~{Math.round(getTotalDuration() / 60)} minutes
                  </Badge>
                </>
              )}
            </div>

            {plan?.focusAreas && plan.focusAreas.length > 0 && (
              <Card className="border-slate-200 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-slate-100 py-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="w-5 h-5 text-amber-600" />
                    Focus Areas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {plan.focusAreas.map((area, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-full text-sm font-medium">
                        {area}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-slate-200 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-100 py-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  Interview Phases
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {plan?.phases.map((phase, idx) => (
                  <div key={idx} className={`p-4 ${idx !== plan.phases.length - 1 ? "border-b border-slate-100" : ""}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </div>
                        <h4 className="font-semibold text-slate-900">{phase.name}</h4>
                      </div>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        ~{Math.round(phase.duration / 60)} min
                      </span>
                    </div>
                    {phase.objectives && phase.objectives.length > 0 && (
                      <div className="ml-8 space-y-1">
                        {phase.objectives.map((obj, objIdx) => (
                          <div key={objIdx} className="flex items-start gap-2 text-sm text-slate-600">
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>{obj}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl overflow-hidden">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <Play className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Practice?</h3>
                <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
                  You'll select an AI interviewer avatar next. The interview will follow the plan above, adapting to your responses.
                </p>
                <Button
                  size="lg"
                  onClick={handleStartInterview}
                  disabled={starting}
                  className="rounded-xl px-8 bg-indigo-600 hover:bg-indigo-700"
                >
                  {starting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      Select Your Interviewer
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
