import { useState, useEffect } from "react";
import { ChevronRight, Play, Clock, Target, Users, MessageSquare, ArrowRight, CheckCircle, Loader2, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { PurchaseModal } from "@/components/purchase-modal";

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
  jobTargetId?: string;
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
  const employerJobId = searchParams.get("employerJobId");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [plan, setPlan] = useState<InterviewPlan | null>(null);
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [roleKit, setRoleKit] = useState<RoleKit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

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
          employerJobId: employerJobId || undefined,
        }),
      });

      if (response.status === 401) {
        toast({
          title: "Please sign in",
          description: "You need to be signed in to start an interview session.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const data = await response.json();
      
      if (response.status === 403 && data.requiresPayment) {
        setShowPurchaseModal(true);
        return;
      }
      
      if (data.success) {
        navigate(`/interview/session?interviewSessionId=${data.session.id}&configId=${configId}`);
      } else {
        toast({
          title: "Failed to start interview",
          description: data.error || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        title: "Connection error",
        description: "Could not connect to the server. Please try again.",
        variant: "destructive",
      });
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
      <div className="min-h-screen bg-[#f8f9fb] pb-24 sm:pb-8">
        {/* Header */}
        <div className="bg-[#042c4c] text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-3xl">
            <button
              onClick={() => {
                if (config?.jobTargetId) {
                  navigate(`/jobs/${config.jobTargetId}`);
                } else if (roleKit?.id) {
                  navigate(`/interview/context?roleKitId=${roleKit.id}`);
                } else {
                  navigate("/interview/custom");
                }
              }}
              className="inline-flex items-center text-white/70 hover:text-white mb-3 text-sm transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
              Back
            </button>
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-[#ee7e65]" />
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  {roleKit?.name || "Interview Plan Ready"}
                </h1>
                <p className="text-white/70 text-sm mt-0.5">
                  Review the plan below, then start your practice session.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 max-w-3xl">
          <div className="space-y-4">
            {/* Quick Stats Badges */}
            <div className="flex flex-wrap gap-2">
              {config && (
                <>
                  <Badge className="bg-[#042c4c] text-white px-3 py-1">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    ~{Math.round(getTotalDuration() / 60)} min
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 capitalize">
                    {getInterviewTypeLabel(config.interviewType).replace(/\s+screen/i, '')}
                  </Badge>
                  <Badge className={`${getStyleLabel(config.style).color} px-3 py-1 border-0`}>
                    {getStyleLabel(config.style).label}
                  </Badge>
                </>
              )}
            </div>

            {/* Focus Areas */}
            {plan?.focusAreas && plan.focusAreas.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-[#ee7e65]" />
                  <h3 className="text-sm font-medium text-[#042c4c]">Focus Areas</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {plan.focusAreas.map((area, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interview Phases */}
            {plan?.phases && plan.phases.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200">
                <div className="py-3 px-4 border-b border-slate-100 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#ee7e65]" />
                  <h3 className="text-sm font-medium text-[#042c4c]">Interview Phases</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {plan.phases.map((phase, idx) => (
                    <div key={idx} className="p-4 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#ee7e65]/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-[#ee7e65]">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm text-[#042c4c]">{phase.name}</h4>
                          <span className="text-xs text-slate-400">{Math.round(phase.duration / 60)} min</span>
                        </div>
                        {phase.objectives && phase.objectives.length > 0 && (
                          <div className="mt-1.5 space-y-1">
                            {phase.objectives.map((obj, objIdx) => (
                              <div key={objIdx} className="flex items-start gap-1.5 text-xs text-slate-500">
                                <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                                <span>{obj}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Start Button */}
            <Button
              size="lg"
              onClick={handleStartInterview}
              disabled={starting}
              className="w-full rounded-xl bg-[#ee7e65] hover:bg-[#e06a50] h-12 text-base"
            >
              {starting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Preparing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Interview
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        roleKitId={roleKit?.id}
        jobTargetId={config?.jobTargetId}
        onSuccess={() => {
          setShowPurchaseModal(false);
          handleStartInterview();
        }}
      />
    </SidebarLayout>
  );
}
