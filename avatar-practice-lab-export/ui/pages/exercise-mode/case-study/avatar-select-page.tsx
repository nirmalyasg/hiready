import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SidebarLayout from "@/components/layout/sidebar-layout";
import { ChevronRight, Check, ArrowLeft, Briefcase, Users, Sparkles, Building2, X } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useRealtimePrewarm } from "@/contexts/RealtimeSessionPrewarmContext";
import { JobTargetSelector } from "@/components/job-target-selector";

interface AutoLinkSuggestion {
  jobTargetId: string;
  jobTarget: {
    id: string;
    roleTitle: string;
    companyName: string | null;
    status: string;
  };
  confidence: "high" | "medium" | "low";
  score: number;
  rationale: string;
  matchSignals: {
    skillOverlap: number;
    roleTypeMatch: boolean;
    recentActivity: boolean;
    domainMatch: boolean;
  };
}

interface CaseTemplate {
  id: number;
  name: string;
  caseType: string;
  difficulty: string;
  promptStatement: string;
}

const interviewerAvatars = [
  {
    id: "Dexter_Lawyer_Sitting_public",
    name: "Dexter",
    role: "Senior Consultant",
    personality: "analytical and rigorous, asks probing questions about your framework and data",
    image: "https://files2.heygen.ai/avatar/v3/e20ac0c902184ff793e75ae4e139b7dc_45600/preview_target.webp",
    gender: "male",
  },
  {
    id: "Elenora_IT_Sitting_public",
    name: "Elenora",
    role: "Partner",
    personality: "strategic and executive-minded, focuses on business impact and recommendations",
    image: "https://files2.heygen.ai/avatar/v3/cbd4a69890a040e6a0d54088e606a559_45610/preview_talk_3.webp",
    gender: "female",
  },
  {
    id: "June_HR_public",
    name: "June",
    role: "Case Coach",
    personality: "supportive but challenging, helps you structure your thinking",
    image: "https://files2.heygen.ai/avatar/v3/74447a27859a456c955e01f21ef18216_45620/preview_talk_1.webp",
    gender: "female",
  },
  {
    id: "Wayne_20240711",
    name: "Wayne",
    role: "Manager",
    personality: "detail-oriented and methodical, tests your quantitative reasoning",
    image: "https://files.heygen.ai/avatar/v3/Wayne_20240711/full_body.webp",
    gender: "male",
  },
  {
    id: "Anna_public_3_20240108",
    name: "Anna",
    role: "Associate",
    personality: "practical and grounded, asks clarifying questions about implementation",
    image: "https://files.heygen.ai/avatar/v3/Anna_public_3_20240108/full_body.webp",
    gender: "female",
  },
];

export default function CaseStudyAvatarSelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("templateId");
  const preSelectedJobId = searchParams.get("jobTargetId");
  
  const [template, setTemplate] = useState<CaseTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [selectedJobTargetId, setSelectedJobTargetId] = useState<string | null>(preSelectedJobId);
  const [autoLinkSuggestion, setAutoLinkSuggestion] = useState<AutoLinkSuggestion | null>(null);
  const [isAutoLinked, setIsAutoLinked] = useState(false);
  const [showManualSelector, setShowManualSelector] = useState(!!preSelectedJobId);
  
  const realtimePrewarm = useRealtimePrewarm();

  useEffect(() => {
    if (realtimePrewarm) {
      console.log("[CaseStudyAvatarSelect] Pre-warming OpenAI Realtime token...");
      realtimePrewarm.prewarmToken();
    }
  }, [realtimePrewarm]);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/exercise-mode/case-templates/${templateId}`);
        const data = await response.json();
        if (data.success) {
          setTemplate(data.template);
        }
      } catch (error) {
        console.error("Error fetching template:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplate();
  }, [templateId]);

  useEffect(() => {
    const fetchAutoLinkSuggestion = async () => {
      if (!templateId || preSelectedJobId) return;
      
      try {
        const response = await fetch("/api/exercise-mode/auto-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exerciseType: "case_study",
            templateId: parseInt(templateId),
          }),
        });
        const data = await response.json();
        if (data.success && data.hasSuggestion) {
          setAutoLinkSuggestion(data.suggestion);
          if (data.suggestion.confidence !== "low") {
            setSelectedJobTargetId(data.suggestion.jobTargetId);
            setIsAutoLinked(true);
          }
        }
      } catch (error) {
        console.error("Error fetching auto-link suggestion:", error);
      }
    };
    fetchAutoLinkSuggestion();
  }, [templateId, preSelectedJobId]);

  const handleImageError = (avatarId: string) => {
    setFailedImages(prev => ({ ...prev, [avatarId]: true }));
  };

  const getFallbackUrl = (name: string) => {
    const encodedName = encodeURIComponent(name || 'Avatar');
    return `https://ui-avatars.com/api/?name=${encodedName}&background=6366f1&color=fff&size=200&bold=true`;
  };

  const startSession = () => {
    if (!selectedAvatar || !templateId) return;
    
    const avatar = interviewerAvatars.find(a => a.id === selectedAvatar);
    if (!avatar) return;
    
    const avatarParam = encodeURIComponent(JSON.stringify([{
      id: avatar.id,
      name: avatar.name,
      gender: avatar.gender,
      imageUrl: avatar.image,
      role: "interviewer",
      personality: avatar.personality,
    }]));
    
    let url = `/exercise-mode/case-study/session?templateId=${templateId}&avatars=${avatarParam}`;
    if (selectedJobTargetId) {
      url += `&jobTargetId=${selectedJobTargetId}`;
    }
    if (isAutoLinked && autoLinkSuggestion) {
      url += `&autoLinked=true&autoLinkConfidence=${autoLinkSuggestion.confidence}`;
      url += `&autoLinkSignals=${encodeURIComponent(JSON.stringify(autoLinkSuggestion.matchSignals))}`;
    }
    navigate(url);
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <button 
            onClick={() => navigate("/exercise-mode/case-study")}
            className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Case Selection
          </button>

          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Briefcase className="w-6 h-6 text-emerald-600" />
              <h1 className="text-xl font-bold text-slate-900">Select Your Interviewer</h1>
            </div>
            
            {template && (
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-500 mb-1">Selected Case</p>
                <p className="font-medium text-slate-900">{template.name}</p>
                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{template.promptStatement}</p>
              </div>
            )}
            
            <p className="text-slate-600 text-sm">
              Choose an AI interviewer who will guide your case practice session. They'll ask probing questions, 
              challenge your thinking, and provide real-time feedback.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {interviewerAvatars.map((avatar) => {
              const isSelected = selectedAvatar === avatar.id;
              const imageFailed = failedImages[avatar.id];
              
              return (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected 
                      ? "border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100" 
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
                      <img
                        src={imageFailed ? getFallbackUrl(avatar.name) : avatar.image}
                        alt={avatar.name}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(avatar.id)}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900">{avatar.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {avatar.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {avatar.personality}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Smart Match or Manual Job Selection */}
          <div className="mb-8">
            {autoLinkSuggestion && isAutoLinked && !showManualSelector ? (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-amber-800">Smart Match</span>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            autoLinkSuggestion.confidence === "high" 
                              ? "bg-emerald-100 text-emerald-700" 
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {autoLinkSuggestion.confidence === "high" ? "Strong Match" : "Suggested"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <span className="font-semibold text-slate-900">
                          {autoLinkSuggestion.jobTarget.roleTitle}
                        </span>
                        {autoLinkSuggestion.jobTarget.companyName && (
                          <span className="text-slate-600">
                            at {autoLinkSuggestion.jobTarget.companyName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {autoLinkSuggestion.rationale}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowManualSelector(true);
                      setIsAutoLinked(false);
                    }}
                    className="text-sm text-amber-700 hover:text-amber-800 underline flex items-center gap-1"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {autoLinkSuggestion && !preSelectedJobId && (
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => {
                        setSelectedJobTargetId(autoLinkSuggestion.jobTargetId);
                        setIsAutoLinked(true);
                        setShowManualSelector(false);
                      }}
                      className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Use smart match: {autoLinkSuggestion.jobTarget.roleTitle}
                      {autoLinkSuggestion.jobTarget.companyName && ` at ${autoLinkSuggestion.jobTarget.companyName}`}
                    </button>
                  </div>
                )}
                <JobTargetSelector
                  value={selectedJobTargetId}
                  onChange={(id) => {
                    setSelectedJobTargetId(id);
                    setIsAutoLinked(false);
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => navigate("/exercise-mode/case-study")}
            >
              Cancel
            </Button>
            
            <Button
              onClick={startSession}
              disabled={!selectedAvatar}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Users className="w-4 h-4 mr-2" />
              Start Interview
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
