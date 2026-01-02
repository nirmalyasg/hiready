import { useState, useEffect } from "react";
import { ChevronRight, Settings, Loader2, Briefcase, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface RoleKit {
  id: number;
  name: string;
  level: string;
  domain: string;
  description: string | null;
  skillsFocus: string[] | null;
  defaultInterviewTypes: string[] | null;
}

export default function InterviewConfigPage() {
  const [searchParams] = useSearchParams();
  const roleKitId = searchParams.get("roleKitId");
  const navigate = useNavigate();

  const [roleKit, setRoleKit] = useState<RoleKit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [interviewType, setInterviewType] = useState<string>("behavioral");
  const [style, setStyle] = useState<string>("neutral");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoleKit = async () => {
      if (!roleKitId) {
        navigate("/interview");
        return;
      }
      try {
        const response = await fetch(`/api/interview/role-kits/${roleKitId}`);
        const data = await response.json();
        if (data.success) {
          setRoleKit(data.roleKit);
          if (data.roleKit.defaultInterviewTypes?.[0]) {
            setInterviewType(data.roleKit.defaultInterviewTypes[0]);
          }
        } else {
          navigate("/interview");
        }
      } catch (error) {
        console.error("Error fetching role kit:", error);
        navigate("/interview");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoleKit();
  }, [roleKitId, navigate]);

  const handleStartPractice = async () => {
    if (!roleKit) return;

    setCreating(true);
    setError(null);

    try {
      const configResponse = await fetch("/api/interview/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleKitId: roleKit.id,
          resumeDocId: null,
          jdDocId: null,
          interviewType,
          style,
          seniority: roleKit.level,
          mode: "role_based",
        }),
      });

      const configData = await configResponse.json();
      if (!configData.success) throw new Error(configData.error);

      const planResponse = await fetch(`/api/interview/config/${configData.config.id}/plan`, {
        method: "POST",
      });

      const planData = await planResponse.json();
      if (!planData.success) throw new Error(planData.error);

      navigate(`/interview/pre-session?configId=${configData.config.id}&planId=${planData.plan.id}`);
    } catch (error: any) {
      setError(error.message || "Failed to create interview plan");
    } finally {
      setCreating(false);
    }
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

  if (!roleKit) {
    return null;
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white pb-24 sm:pb-8">
        <div className="bg-gradient-to-br from-indigo-500/5 via-white to-purple-50/30 border-b border-slate-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-3xl">
            <Link
              to="/interview"
              className="inline-flex items-center text-slate-500 hover:text-indigo-600 mb-4 text-sm font-medium transition-colors group"
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1 group-hover:-translate-x-0.5 transition-transform" />
              Back to Role Selection
            </Link>
            
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Settings className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Configure Interview</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              {roleKit.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              {roleKit.description || "Configure your interview settings and start practicing."}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-3xl">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <div className="grid gap-6">
            <Card className="border-slate-200 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  Role Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wide">Domain</Label>
                    <p className="font-medium text-slate-900 capitalize">{roleKit.domain.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wide">Level</Label>
                    <p className="font-medium text-slate-900 capitalize">{roleKit.level}</p>
                  </div>
                </div>
                {roleKit.skillsFocus && roleKit.skillsFocus.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-xs text-slate-500 uppercase tracking-wide mb-2 block">Focus Areas</Label>
                    <div className="flex flex-wrap gap-2">
                      {roleKit.skillsFocus.map((skill, idx) => (
                        <span key={idx} className="text-sm px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="w-5 h-5 text-purple-600" />
                  Interview Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-3 block">Interview Type</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { value: "behavioral", label: "Behavioral", desc: "Tell me about a time..." },
                      { value: "technical", label: "Technical", desc: "Role-specific skills" },
                      { value: "situational", label: "Situational", desc: "What would you do if..." },
                      { value: "mixed", label: "Mixed", desc: "All question types" },
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setInterviewType(type.value)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          interviewType === type.value
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <p className={`font-medium text-sm ${interviewType === type.value ? "text-indigo-700" : "text-slate-900"}`}>
                          {type.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{type.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-3 block">Interviewer Style</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "friendly", label: "Friendly", desc: "Warm & supportive" },
                      { value: "neutral", label: "Neutral", desc: "Professional" },
                      { value: "challenging", label: "Challenging", desc: "Tough questions" },
                    ].map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setStyle(s.value)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          style === s.value
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <p className={`font-medium text-sm ${style === s.value ? "text-indigo-700" : "text-slate-900"}`}>
                          {s.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              size="lg"
              onClick={handleStartPractice}
              disabled={creating}
              className="rounded-xl px-8 bg-indigo-600 hover:bg-indigo-700"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Preparing Interview...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Interview Practice
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
