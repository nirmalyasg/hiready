import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, MessageSquare, Users, Target, Zap, Check, Sparkles, Edit3, Save, Loader2, Wand2, User, Bot, Mic } from "lucide-react";
import { VoiceInputField } from "@/components/ui/voice-input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { useAuth } from "@/hooks/useAuth";
import {
  USER_OBJECTIVES,
  CONVERSATION_MODES,
  COUNTER_PERSONA_ARCHETYPES,
  type UserObjective,
  type ConversationMode,
  type CounterPersonaArchetype,
  type ConversationBlueprint,
} from "@/lib/conversation-framework";

type Step = "describe" | "clarify" | "preview";

interface DynamicChallenge {
  id: string;
  label: string;
  description: string;
}

interface DynamicRelationship {
  id: string;
  label: string;
  description: string;
}

interface DynamicObjective {
  id: string;
  label: string;
  description: string;
}

interface ClarificationAnswers {
  relationshipType: DynamicRelationship | null;
  challenges: DynamicChallenge[];
  objective: DynamicObjective | null;
}

export default function CustomScenarioPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<Step>("describe");
  const [userDescription, setUserDescription] = useState("");
  const [answers, setAnswers] = useState<ClarificationAnswers>({
    relationshipType: null,
    challenges: [],
    objective: null,
  });
  const [selectedMode, setSelectedMode] = useState<ConversationMode>("resolve");
  const [generatedBlueprint, setGeneratedBlueprint] = useState<ConversationBlueprint | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedScenarioId, setSavedScenarioId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState(false);
  
  const [userRole, setUserRole] = useState("");
  const [avatarRole, setAvatarRole] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [roleRationale, setRoleRationale] = useState("");
  
  const [availableChallenges, setAvailableChallenges] = useState<DynamicChallenge[]>([]);
  const [generatedTitle, setGeneratedTitle] = useState("");

  const handleDescriptionSubmit = () => {
    if (userDescription.trim().length > 10) {
      setStep("clarify");
      analyzeScenario(userDescription);
    }
  };

  const analyzeScenario = async (description: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/avatar/custom-scenarios/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioDescription: description }),
      });
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.userRole || "");
        setAvatarRole(data.avatarRole || "");
        setRoleRationale(data.rationale || "");
        setGeneratedTitle(data.title || "");
        
        if (data.relationshipType) {
          setAnswers(prev => ({ ...prev, relationshipType: data.relationshipType }));
        }
        if (data.challenges && data.challenges.length > 0) {
          setAvailableChallenges(data.challenges);
          setAnswers(prev => ({ ...prev, challenges: data.challenges.slice(0, 2) }));
        }
        if (data.suggestedObjective) {
          setAnswers(prev => ({ ...prev, objective: data.suggestedObjective }));
        }
      }
    } catch (error) {
      console.error("Failed to analyze scenario:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleChallenge = (challenge: DynamicChallenge) => {
    setAnswers(prev => {
      const isSelected = prev.challenges.some(c => c.id === challenge.id);
      if (isSelected) {
        return { ...prev, challenges: prev.challenges.filter(c => c.id !== challenge.id) };
      } else if (prev.challenges.length < 2) {
        return { ...prev, challenges: [...prev.challenges, challenge] };
      } else {
        return { ...prev, challenges: [prev.challenges[1], challenge] };
      }
    });
  };

  const handleClarificationComplete = () => {
    const counterPersona = COUNTER_PERSONA_ARCHETYPES.find(p => p.id === "skeptical_peer");
    const relationship = answers.relationshipType;
    const objective = answers.objective;
    const challengeDescriptions = answers.challenges.map(c => c.label).join(" and ");

    const blueprint: ConversationBlueprint = {
      context: "workplace_semiformal",
      counterPersona: {
        archetype: "skeptical_peer" as CounterPersonaArchetype,
        caresAbout: counterPersona?.caresAbout || "results",
        pressureResponse: counterPersona?.pressureResponse || "pushes_back",
        trigger: counterPersona?.trigger || "uncertainty",
      },
      tension: {
        primary: (answers.challenges[0]?.id || "misaligned_expectations") as any,
        secondary: answers.challenges[1]?.id as any,
      },
      userObjective: (objective?.id || "resolve") as UserObjective,
      conversationMode: selectedMode,
      skillLens: {
        primary: "assertiveness",
        secondary: "clarity_of_thought",
      },
      scenarioSummary: {
        title: generatedTitle || "Practice Scenario",
        context: userDescription,
        counterPersonaDescription: avatarRole 
          ? `${avatarRole}${relationship ? ` - ${relationship.description}` : ""}`
          : relationship?.description || "The other party in this conversation",
        whatMakesItTricky: answers.challenges.length > 0 
          ? answers.challenges.map(c => `${c.label}: ${c.description}`).join(". ") 
          : "This conversation requires careful navigation",
        objectiveStatement: objective 
          ? `${objective.label}: ${objective.description}` 
          : "Navigate this conversation effectively",
        userRole: userRole || undefined,
        avatarRole: avatarRole || undefined,
      },
    };

    setGeneratedBlueprint(blueprint);
    setStep("preview");
    
    if (isAuthenticated) {
      saveScenarioToDatabase(blueprint, userRole, avatarRole);
    }
  };

  const saveScenarioToDatabase = async (blueprint: ConversationBlueprint, finalUserRole: string, finalAvatarRole: string) => {
    if (!isAuthenticated) return;
    
    setIsSaving(true);
    setSavedScenarioId(null);
    setSaveError(false);
    
    try {
      const response = await fetch("/api/avatar/custom-scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: blueprint.scenarioSummary.title,
          userDescription,
          blueprint,
          userRole: finalUserRole || null,
          avatarRole: finalAvatarRole || null,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSavedScenarioId(data.scenario?.id || null);
      } else {
        setSaveError(true);
      }
    } catch (error) {
      console.error("Failed to save scenario:", error);
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartPractice = () => {
    if (generatedBlueprint) {
      const blueprintParam = encodeURIComponent(JSON.stringify(generatedBlueprint));
      const customScenarioParam = savedScenarioId ? `&customScenarioId=${savedScenarioId}` : '';
      navigate(`/avatar/practice/avatar-select?blueprint=${blueprintParam}&mode=custom${customScenarioParam}`);
    }
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-32 sm:pb-8">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-3xl">
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <button
              onClick={() => step === "describe" ? navigate("/avatar/start") : setStep(step === "preview" ? "clarify" : "describe")}
              className="flex items-center gap-1.5 sm:gap-2 text-slate-600 hover:text-slate-900 text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {["describe", "clarify", "preview"].map((s, i) => (
                <div key={s} className="flex items-center gap-1.5 sm:gap-2">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                    step === s ? "bg-brand-primary text-white" :
                    ["describe", "clarify", "preview"].indexOf(step) > i ? "bg-green-500 text-white" :
                    "bg-slate-200 text-slate-600"
                  }`}>
                    {["describe", "clarify", "preview"].indexOf(step) > i ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : i + 1}
                  </div>
                  {i < 2 && <div className="w-4 sm:w-12 h-0.5 bg-slate-200" />}
                </div>
              ))}
            </div>
          </div>

          {step === "describe" && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">
                  Describe your situation
                </h1>
                <p className="text-sm sm:text-base text-slate-600">
                  Tell us about the conversation you're preparing for.
                </p>
              </div>

              <Card className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-purple-50 rounded-lg sm:rounded-xl hidden sm:block">
                    <Edit3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <VoiceInputField
                      value={userDescription}
                      onChange={setUserDescription}
                      placeholder="Example: My stakeholder wants a delivery in two weeks. I know it's not realistic... (or tap the mic to speak)"
                      multiline
                      rows={6}
                      className="h-32 sm:h-40 text-sm sm:text-base"
                    />
                    <p className="text-xs sm:text-sm text-slate-500 mt-1.5 sm:mt-2">
                      {userDescription.length < 10 ? "Type or speak... be specific about what makes this challenging." : ""}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="fixed bottom-14 left-0 right-0 p-4 bg-white border-t border-slate-200 z-50 sm:bottom-0 sm:relative sm:p-0 sm:bg-transparent sm:border-0 sm:flex sm:justify-end">
                <Button
                  onClick={handleDescriptionSubmit}
                  disabled={userDescription.trim().length < 10}
                  className="w-full sm:w-auto bg-brand-primary hover:bg-brand-dark"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === "clarify" && (
            <div className="space-y-4 sm:space-y-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">
                  {isAnalyzing ? "Analyzing..." : "Here's what I understood"}
                </h1>
                <p className="text-sm sm:text-base text-slate-600">
                  {isAnalyzing ? "Understanding your scenario..." : "Review and adjust as needed."}
                </p>
              </div>

              {isAnalyzing ? (
                <Card className="p-6 sm:p-8 flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-brand-primary" />
                  <p className="text-sm sm:text-base text-slate-600">Analyzing roles and challenges...</p>
                </Card>
              ) : (
                <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="border-b border-slate-100 pb-4 sm:pb-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                        <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Roles</h3>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => analyzeScenario(userDescription)}
                        disabled={isAnalyzing}
                        className="text-xs h-7 sm:h-8"
                      >
                        <Wand2 className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Re-analyze</span>
                        <span className="sm:hidden">Redo</span>
                      </Button>
                    </div>
                    
                    {roleRationale && (
                      <p className="text-xs text-slate-500 mb-2 sm:mb-3 italic bg-slate-50 p-2 rounded hidden sm:block">
                        {roleRationale}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-600 mb-1.5 sm:mb-2">
                          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Your role
                        </label>
                        <input
                          type="text"
                          value={userRole}
                          onChange={(e) => setUserRole(e.target.value)}
                          placeholder="e.g., Product Manager"
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-600 mb-1.5 sm:mb-2">
                          <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Avatar's role
                        </label>
                        <input
                          type="text"
                          value={avatarRole}
                          onChange={(e) => setAvatarRole(e.target.value)}
                          placeholder="e.g., Engineering Lead"
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {answers.relationshipType && (
                    <div className="border-b border-slate-100 pb-4 sm:pb-6">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                        <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Relationship</h3>
                      </div>
                      <div className="bg-brand-light/10 border border-brand-light/30 rounded-lg p-3 sm:p-4">
                        <p className="font-medium text-brand-dark text-sm sm:text-base">{answers.relationshipType.label}</p>
                        <p className="text-xs sm:text-sm text-brand-primary mt-0.5 sm:mt-1">{answers.relationshipType.description}</p>
                      </div>
                    </div>
                  )}

                  {availableChallenges.length > 0 && (
                    <div className="border-b border-slate-100 pb-4 sm:pb-6">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                        <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Challenges</h3>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        {availableChallenges.map((challenge) => (
                          <button
                            key={challenge.id}
                            onClick={() => toggleChallenge(challenge)}
                            className={`w-full p-3 sm:p-4 text-left rounded-lg border-2 transition-all ${
                              answers.challenges.some(c => c.id === challenge.id)
                                ? "border-amber-500 bg-amber-50"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <span className="text-xs sm:text-sm font-medium text-slate-900">{challenge.label}</span>
                            <p className="text-xs text-slate-600 mt-0.5 sm:mt-1 hidden sm:block">{challenge.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {answers.objective && (
                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Your objective</h3>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                        <p className="font-medium text-green-900 text-sm sm:text-base">{answers.objective.label}</p>
                        <p className="text-xs sm:text-sm text-green-700 mt-0.5 sm:mt-1">{answers.objective.description}</p>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              <div className="fixed bottom-14 left-0 right-0 p-4 bg-white border-t border-slate-200 flex gap-3 z-50 sm:bottom-0 sm:relative sm:p-0 sm:bg-transparent sm:border-0 sm:justify-between">
                <Button variant="outline" onClick={() => setStep("describe")} className="flex-1 sm:flex-none">
                  <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleClarificationComplete}
                  disabled={isAnalyzing || (!userRole && !avatarRole)}
                  className="flex-1 sm:flex-none bg-brand-primary hover:bg-brand-dark"
                >
                  <span className="hidden sm:inline">Generate Scenario</span>
                  <span className="sm:hidden">Generate</span>
                  <Sparkles className="w-4 h-4 ml-1 sm:ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === "preview" && generatedBlueprint && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">
                  Your practice scenario
                </h1>
                <p className="text-sm sm:text-base text-slate-600">
                  Ready to start practicing.
                </p>
              </div>

              <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6 border-2 border-brand-light/30">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    {generatedBlueprint.scenarioSummary.title}
                  </h2>
                </div>

                {(generatedBlueprint.scenarioSummary.userRole || generatedBlueprint.scenarioSummary.avatarRole) && (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-brand-light/10 rounded-lg border border-purple-100">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase">You</span>
                      </div>
                      <p className="font-semibold text-purple-900 text-xs sm:text-base">{generatedBlueprint.scenarioSummary.userRole || "Yourself"}</p>
                    </div>
                    <div className="text-center border-l border-purple-200">
                      <div className="flex items-center justify-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                        <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-primary" />
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase">Avatar</span>
                      </div>
                      <p className="font-semibold text-brand-dark text-xs sm:text-base">{generatedBlueprint.scenarioSummary.avatarRole || "The other person"}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1 sm:mb-2">Situation</h4>
                    <p className="text-xs sm:text-base text-slate-700 line-clamp-3 sm:line-clamp-none">{generatedBlueprint.scenarioSummary.context}</p>
                  </div>

                  <div className="hidden sm:block">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">The dynamic</h4>
                    <p className="text-slate-700">{generatedBlueprint.scenarioSummary.counterPersonaDescription}</p>
                  </div>

                  <div className="hidden sm:block">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Key challenges</h4>
                    <p className="text-slate-700">{generatedBlueprint.scenarioSummary.whatMakesItTricky}</p>
                  </div>

                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1 sm:mb-2">Your goal</h4>
                    <p className="text-xs sm:text-base text-slate-700">{generatedBlueprint.scenarioSummary.objectiveStatement}</p>
                  </div>

                  <div className="pt-3 sm:pt-4 border-t border-slate-100 hidden sm:block">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Conversation Style</h4>
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-brand-light/20 text-brand-primary rounded-full text-sm font-medium">
                          {CONVERSATION_MODES.find(m => m.id === generatedBlueprint.conversationMode)?.label}
                        </div>
                      </div>
                      {isAuthenticated && (
                        <div className="flex items-center gap-2 text-sm">
                          {isSaving ? (
                            <span className="flex items-center gap-1 text-slate-500">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </span>
                          ) : savedScenarioId ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <Check className="w-4 h-4" />
                              Saved
                            </span>
                          ) : saveError ? (
                            <span className="flex items-center gap-1 text-red-600">
                              Could not save
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {!isAuthenticated && (
                <div className="hidden sm:flex bg-amber-50 border border-amber-200 rounded-lg p-4 items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Save className="w-5 h-5 text-amber-600" />
                    <span className="text-amber-800 text-sm">
                      Sign in to save this scenario
                    </span>
                  </div>
                  <a
                    href="/login"
                    className="text-sm font-medium text-amber-700 hover:text-amber-900 underline"
                  >
                    Sign in
                  </a>
                </div>
              )}

              <div className="hidden sm:block">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Conversation Mode</h3>
                <div className="flex flex-wrap gap-2">
                  {CONVERSATION_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setSelectedMode(mode.id);
                        if (generatedBlueprint) {
                          setGeneratedBlueprint({
                            ...generatedBlueprint,
                            conversationMode: mode.id,
                          });
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        generatedBlueprint.conversationMode === mode.id
                          ? "bg-brand-primary text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  {CONVERSATION_MODES.find(m => m.id === generatedBlueprint.conversationMode)?.description}
                </p>
              </div>

              <div className="fixed bottom-14 left-0 right-0 p-4 bg-white border-t border-slate-200 flex gap-3 z-50 sm:bottom-0 sm:relative sm:p-0 sm:pt-4 sm:bg-transparent sm:border-0 sm:justify-between">
                <Button variant="outline" onClick={() => setStep("clarify")} className="flex-1 sm:flex-none">
                  <Edit3 className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Edit scenario</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
                <Button
                  onClick={handleStartPractice}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none bg-brand-primary hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Start practice</span>
                      <span className="sm:hidden">Start</span>
                      <ArrowRight className="w-4 h-4 ml-1 sm:ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
    </SidebarLayout>
  );
}
