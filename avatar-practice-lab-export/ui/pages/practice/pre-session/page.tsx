import { useEffect, useState, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useAvatarSession } from "@/contexts/AvatarSessionContext";
import { useAvatarById, useAvatars, type Avatar } from "@/hooks/use-avatars";
import { 
  Loader2, 
  CheckCircle2, 
  Sparkles, 
  ChevronLeft, 
  Target, 
  User, 
  MessageSquare, 
  Lightbulb,
  Play,
  Settings2,
  AlertCircle,
  Mic,
  Video,
  Zap,
  Clock,
  Globe,
  AlertTriangle,
  Compass,
  Shield,
  Brain,
  BookOpen,
  RefreshCw
} from "lucide-react";
import {
  COUNTER_PERSONA_ARCHETYPES,
  USER_OBJECTIVES,
  CONVERSATION_MODES,
  getTensionById,
  getCounterPersonaById,
  getObjectiveById,
  getModeById,
  generateAvatarPromptFromBlueprint,
  createBlueprintFromScenario,
  DEFAULT_PERSONA_OVERLAYS,
  type ConversationBlueprint,
  type CounterPersonaArchetype,
  type UserObjective,
  type ConversationMode,
  type PersonaOverlay,
  type PersonaOverlayLevel,
} from "@/lib/conversation-framework";
import { PersonaOverlayCompact } from "@/components/PersonaOverlaySelector";
import { ENGLISH_ACCENTS, getAccentFromEthnicity, getAccentById, type AccentPreset } from "../../../../shared/accent-presets";

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", flag: "🇮🇳" },
  { code: "te", name: "Telugu", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", flag: "🇮🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
];
import { cn, anonymizeScenarioText } from "@/lib/utils";

interface Scenario {
  id: string;
  name: string;
  description: string;
  context: string;
  difficulty: string;
  avatarRole?: string;
  instructions?: string;
}

interface SkillMapping {
  skillId: number;
  skillName: string;
  confidenceScore: number;
  rationale: string;
  isConfirmed: boolean;
  frameworkMapping?: string | null;
}

export default function PreSessionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scenarioId = searchParams.get("scenarioId");
  const avatarId = searchParams.get("avatarId");
  const blueprintParam = searchParams.get("blueprint");
  const mode = searchParams.get("mode");
  const customScenarioId = searchParams.get("customScenarioId");
  const topicParam = searchParams.get("topic");
  const categoryParam = searchParams.get("category");
  
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<string>(
    "/avatar/practice/session?mode=voice",
  );
  
  // Avatar selection state - can come from URL or be selected on this page
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(avatarId);
  const [avatarGenderFilter, setAvatarGenderFilter] = useState<string | undefined>(undefined);
  const [avatarEthnicityFilter, setAvatarEthnicityFilter] = useState<string | undefined>(undefined);

  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    searchParams.get("language") || "en",
  );
  const [selectedCulturalPreset, setSelectedCulturalPreset] = useState<string | null>(
    searchParams.get("culturalPreset") || null,
  );
  const accentFromUrl = searchParams.get("accent");
  const [selectedAccent, setSelectedAccent] = useState<string>(
    accentFromUrl || "american",
  );
  const [hasAutoSelectedAccent, setHasAutoSelectedAccent] = useState<boolean>(!!accentFromUrl);
  
  const [blueprint, setBlueprint] = useState<ConversationBlueprint | null>(null);
  const [selectedCounterPersona, setSelectedCounterPersona] = useState<CounterPersonaArchetype | null>(null);
  const [selectedObjective, setSelectedObjective] = useState<UserObjective | null>(null);
  const [selectedMode, setSelectedMode] = useState<ConversationMode | null>(null);
  
  const personaOverlayFromUrl = searchParams.get("personaOverlay") as PersonaOverlayLevel | null;
  const [selectedPersonaLevel, setSelectedPersonaLevel] = useState<PersonaOverlayLevel | null>(personaOverlayFromUrl || null);
  const [selectedPersonaOverlay, setSelectedPersonaOverlay] = useState<PersonaOverlay | null>(
    personaOverlayFromUrl && personaOverlayFromUrl !== "custom" 
      ? DEFAULT_PERSONA_OVERLAYS[personaOverlayFromUrl as Exclude<PersonaOverlayLevel, "custom">]
      : null
  );
  
  const handlePersonaSelect = (level: PersonaOverlayLevel, overlay: PersonaOverlay) => {
    setSelectedPersonaLevel(level);
    setSelectedPersonaOverlay(overlay);
  };

  const avatarSession = useAvatarSession();
  
  // Avatar data - fetch by ID if selected, otherwise use list
  const { data: avatarData, isLoading: avatarLoading } = useAvatarById(selectedAvatarId || undefined);
  
  // Avatar list for selection with filters
  const { 
    avatarData: availableAvatars, 
    isLoading: avatarsLoading,
    filters: avatarFilters,
    setFilters: setAvatarFilters 
  } = useAvatars({
    initialLimit: 12,
    initialFilters: {
      gender: avatarGenderFilter,
      ethnicity: avatarEthnicityFilter,
    }
  });
  
  // Update avatar filters when preferences change
  useEffect(() => {
    setAvatarFilters({
      gender: avatarGenderFilter,
      ethnicity: avatarEthnicityFilter,
    });
  }, [avatarGenderFilter, avatarEthnicityFilter, setAvatarFilters]);
  
  useEffect(() => {
    if (avatarData?.ethnicity && selectedLanguage === "en" && !hasAutoSelectedAccent) {
      const suggestedAccent = getAccentFromEthnicity(avatarData.ethnicity);
      setSelectedAccent(suggestedAccent);
      setHasAutoSelectedAccent(true);
    }
  }, [avatarData?.ethnicity, selectedLanguage, hasAutoSelectedAccent]);
  
  useEffect(() => {
    if (blueprintParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(blueprintParam));
        setBlueprint(decoded);
        setSelectedCounterPersona(decoded.counterPersona?.archetype || null);
        setSelectedObjective(decoded.userObjective || null);
        setSelectedMode(decoded.conversationMode || null);
      } catch (e) {
        console.error("Failed to parse blueprint:", e);
      } finally {
        setLoading(false);
      }
    }
  }, [blueprintParam]);
  
  const currentBlueprint = useMemo(() => {
    if (!blueprint) return null;
    
    const counterPersona = selectedCounterPersona 
      ? getCounterPersonaById(selectedCounterPersona) 
      : null;
    
    return {
      ...blueprint,
      counterPersona: counterPersona ? {
        archetype: selectedCounterPersona!,
        caresAbout: counterPersona.caresAbout,
        pressureResponse: counterPersona.pressureResponse,
        trigger: counterPersona.trigger,
      } : blueprint.counterPersona,
      userObjective: selectedObjective || blueprint.userObjective,
      conversationMode: selectedMode || blueprint.conversationMode,
    } as ConversationBlueprint;
  }, [blueprint, selectedCounterPersona, selectedObjective, selectedMode]);
  
  interface CulturalPreset {
    id: string;
    name: string;
    description: string;
  }

  async function fetchCulturalPresets(): Promise<CulturalPreset[]> {
    const res = await fetch("/api/avatar/cultural-presets");
    const result = await res.json();
    if (!res.ok) throw new Error(result?.error || "Failed to fetch cultural presets");
    return result.presets || [];
  }

  const { data: culturalPresets = [] } = useQuery({
    queryKey: ["culturalPresets"],
    queryFn: fetchCulturalPresets,
  });

  const [skillFetchAttempts, setSkillFetchAttempts] = useState(0);
  const [skillFetchError, setSkillFetchError] = useState<string | null>(null);
  const [shouldPollSkills, setShouldPollSkills] = useState(true);
  const currentScenarioIdRef = useRef(customScenarioId);
  const MAX_SKILL_FETCH_ATTEMPTS = 10;

  useEffect(() => {
    currentScenarioIdRef.current = customScenarioId;
    setSkillFetchAttempts(0);
    setSkillFetchError(null);
    setShouldPollSkills(!!customScenarioId);
  }, [customScenarioId]);

  const { 
    data: skillMappings = [], 
    isLoading: skillMappingsLoading,
    refetch: refetchSkillMappings,
    isRefetching: skillMappingsRefetching
  } = useQuery({
    queryKey: ["customScenarioSkills", customScenarioId],
    queryFn: async ({ queryKey }): Promise<SkillMapping[]> => {
      const scenarioIdFromQuery = queryKey[1] as string | null;
      if (!scenarioIdFromQuery) return [];
      
      const res = await fetch(`/api/avatar/custom-scenarios/${scenarioIdFromQuery}/skills`, {
        credentials: "include"
      });
      
      if (currentScenarioIdRef.current !== scenarioIdFromQuery) {
        return [];
      }
      
      if (res.status === 401) {
        setSkillFetchError("Please log in to view skill mappings");
        setShouldPollSkills(false);
        return [];
      }
      if (!res.ok) {
        setSkillFetchError("Failed to load skill mappings. Try refreshing.");
        setShouldPollSkills(false);
        return [];
      }
      
      setSkillFetchError(null);
      const data = await res.json();
      const mappings = data.skillMappings || [];
      
      if (currentScenarioIdRef.current !== scenarioIdFromQuery) {
        return mappings;
      }
      
      if (mappings.length > 0) {
        setShouldPollSkills(false);
      } else {
        setSkillFetchAttempts(prev => {
          const next = prev + 1;
          if (next >= MAX_SKILL_FETCH_ATTEMPTS) {
            setShouldPollSkills(false);
          }
          return next;
        });
      }
      
      return mappings;
    },
    enabled: !!customScenarioId,
    refetchInterval: shouldPollSkills ? 3000 : false,
  });

  const handleRefreshSkills = () => {
    setSkillFetchAttempts(0);
    setSkillFetchError(null);
    setShouldPollSkills(true);
    refetchSkillMappings();
  };

  const isSkillsStillAnalyzing = skillMappings.length === 0 && skillFetchAttempts < MAX_SKILL_FETCH_ATTEMPTS && !skillFetchError && shouldPollSkills;
  const isSkillsTimedOut = skillMappings.length === 0 && skillFetchAttempts >= MAX_SKILL_FETCH_ATTEMPTS && !skillFetchError;
  
  useEffect(() => {
    const fetchScenario = async () => {
      try {
        const response = await fetch(
          `/api/avatar/get-scenarios?scenarioId=${scenarioId}`,
        );
        const data = await response.json();
        if (data.scenarios && data.scenarios.length > 0) {
          const fetchedScenario = data.scenarios[0];
          setScenario(fetchedScenario);
          
          const inferredBlueprint = createBlueprintFromScenario({
            id: fetchedScenario.id,
            name: fetchedScenario.name,
            description: fetchedScenario.description,
            context: fetchedScenario.context,
            instructions: fetchedScenario.instructions,
            avatarRole: fetchedScenario.avatarRole || fetchedScenario.avatar_role,
            difficulty: fetchedScenario.difficulty,
          });
          setBlueprint(inferredBlueprint);
          setSelectedCounterPersona(inferredBlueprint.counterPersona.archetype);
          setSelectedObjective(inferredBlueprint.userObjective);
          setSelectedMode(inferredBlueprint.conversationMode);
        }
      } catch (error) {
        console.error("Error fetching scenario:", error);
      } finally {
        setLoading(false);
      }
    };

    if (scenarioId && !blueprintParam) {
      fetchScenario();
    } else if (!blueprintParam) {
      setLoading(false);
    }
  }, [scenarioId, blueprintParam]);

  const buildKnowledgeBase = () => {
    if (currentBlueprint) {
      return generateAvatarPromptFromBlueprint(currentBlueprint);
    }
    
    if (!scenario) return "";
    return `
Context: ${scenario?.context || "Not specified"}
Description: ${scenario?.description || "Not specified"}
Instructions: ${scenario?.instructions || "Not specified"}
${scenario?.avatarRole ? `Role: ${scenario.avatarRole}` : ""}

Please be conversational, helpful, and stay in character based on the provided context.
    `.trim();
  };

  const prevConfigRef = useRef<{ language: string }>({ language: "en" });

  useEffect(() => {
    if (
      (scenario || currentBlueprint) &&
      selectedAvatarId &&
      avatarSession &&
      selection === "/avatar/practice/session"
    ) {
      const knowledgeBase = buildKnowledgeBase();
      const configChanged = prevConfigRef.current.language !== selectedLanguage;
      
      if (configChanged && (avatarSession.preWarmedSession?.isReady || avatarSession.isWarming)) {
        console.log("Config changed, restarting warming with new language");
        prevConfigRef.current = { language: selectedLanguage };
        avatarSession.restartWarming({
          avatarId: selectedAvatarId!,
          knowledgeBase: knowledgeBase,
          language: selectedLanguage,
        });
      } else if (!avatarSession.preWarmedSession?.isReady && !avatarSession.isWarming) {
        console.log("Pre-warming avatar session for:", selectedAvatarId);
        prevConfigRef.current = { language: selectedLanguage };
        avatarSession.startWarming({
          avatarId: selectedAvatarId!,
          knowledgeBase: knowledgeBase,
          language: selectedLanguage,
        });
      }
    }
  }, [scenario, currentBlueprint, selectedAvatarId, avatarSession, selection, selectedLanguage]);

  useEffect(() => {
    return () => {
      if (avatarSession && !avatarSession.preWarmedSession?.isReady) {
        avatarSession.cancelWarming();
      }
    };
  }, []);

  const startSession = () => {
    if (!selectedAvatarId) {
      return; // Can't start without an avatar
    }
    
    const isVoiceMode = selection.includes("mode=voice");
    const params = new URLSearchParams();
    
    if (scenarioId) {
      params.set("scenarioId", scenarioId);
    }
    params.set("avatarId", selectedAvatarId);
    params.set("language", selectedLanguage);
    params.set("autostart", "true");
    
    if (currentBlueprint) {
      params.set("blueprint", encodeURIComponent(JSON.stringify(currentBlueprint)));
    }
    
    if (customScenarioId) {
      params.set("customScenarioId", customScenarioId);
    }
    
    if (topicParam) {
      params.set("topic", topicParam);
    }
    if (categoryParam) {
      params.set("category", categoryParam);
    }
    
    if (selectedCulturalPreset) {
      params.set("culturalPreset", selectedCulturalPreset);
    }
    
    if (selectedLanguage === "en" && selectedAccent) {
      params.set("accent", selectedAccent);
    }
    
    if (selectedPersonaLevel) {
      params.set("personaOverlay", selectedPersonaLevel);
    }
    if (selectedPersonaOverlay) {
      params.set("personaOverlayData", encodeURIComponent(JSON.stringify(selectedPersonaOverlay)));
    }
    
    if (isVoiceMode) {
      navigate(`/avatar/assessment-session/roleplay?${params.toString()}`);
    } else {
      navigate(`/avatar/practice/session?${params.toString()}`);
    }
  };

  const goToAvatarSelect = () => {
    const params = new URLSearchParams();
    
    if (scenarioId) {
      params.set("scenarioId", scenarioId);
    }
    params.set("language", selectedLanguage);
    params.set("mode", selection.includes("mode=voice") ? "voice" : "video");
    
    if (avatarGenderFilter) {
      params.set("gender", avatarGenderFilter);
    }
    if (avatarEthnicityFilter) {
      params.set("ethnicity", avatarEthnicityFilter);
    }
    
    if (currentBlueprint) {
      params.set("blueprint", encodeURIComponent(JSON.stringify(currentBlueprint)));
    }
    
    if (customScenarioId) {
      params.set("customScenarioId", customScenarioId);
    }
    
    if (topicParam) {
      params.set("topic", topicParam);
    }
    if (categoryParam) {
      params.set("category", categoryParam);
    }
    
    if (selectedCulturalPreset) {
      params.set("culturalPreset", selectedCulturalPreset);
    }
    
    if (selectedLanguage === "en" && selectedAccent) {
      params.set("accent", selectedAccent);
    }
    
    if (selectedPersonaLevel) {
      params.set("personaOverlay", selectedPersonaLevel);
    }
    if (selectedPersonaOverlay) {
      params.set("personaOverlayData", encodeURIComponent(JSON.stringify(selectedPersonaOverlay)));
    }
    
    navigate(`/avatar/practice/avatar-select?${params.toString()}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
      case 'easy':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'intermediate':
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'advanced':
      case 'hard':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const isCustomScenario = mode === "custom" && currentBlueprint;

  if (loading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading scenario details...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!scenario && !currentBlueprint) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Scenario Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The practice scenario you're looking for doesn't exist or may have
              been removed.
            </p>
            <Link to="/avatar/practice">
              <Button size="lg" data-testid="button-return-practice">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Return to Practice
              </Button>
            </Link>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const primaryTension = currentBlueprint?.tension?.primary 
    ? getTensionById(currentBlueprint.tension.primary) 
    : null;
  const secondaryTension = currentBlueprint?.tension?.secondary 
    ? getTensionById(currentBlueprint.tension.secondary) 
    : null;

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24 sm:pb-8">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 max-w-6xl">
          <div className="mb-4 sm:mb-8">
            <Link
              to={isCustomScenario ? "/avatar/start" : "/avatar/practice"}
              className="inline-flex items-center text-gray-500 hover:text-primary mb-2 sm:mb-4 text-sm font-medium transition-colors group"
              data-testid="link-back-avatar"
            >
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-0.5 transition-transform" />
              <span className="sm:hidden">Back</span>
              <span className="hidden sm:inline">{isCustomScenario ? "Back to Start" : "Back to Scenarios"}</span>
            </Link>
            
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-6 mb-3 sm:mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 sm:gap-4">
                <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-2.5 bg-gradient-to-br from-primary to-primary/80 rounded-lg sm:rounded-xl flex-shrink-0">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight" data-testid="text-page-title">
                      {isCustomScenario && currentBlueprint ? currentBlueprint.scenarioSummary.title : (scenario?.name || "Practice Session")}
                    </h1>
                    <p className="text-gray-500 text-xs sm:text-base hidden sm:block">
                      Customize your practice settings and begin when ready
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1 sm:mt-0">
                  {scenario?.difficulty && (
                    <Badge 
                      variant="outline" 
                      className={`${getDifficultyColor(scenario.difficulty)} px-2 sm:px-3 py-0.5 sm:py-1 text-xs`}
                      data-testid="badge-difficulty"
                    >
                      {scenario.difficulty}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0 px-2 sm:px-3 py-0.5 sm:py-1 text-xs">
                    <Mic className="w-3 h-3 mr-1" />
                    Voice
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Mobile: Fixed bottom CTA bar */}
            <div className="lg:hidden fixed bottom-14 left-0 right-0 z-50 bg-white border-t border-gray-200 p-3 shadow-lg">
              <Button
                size="lg"
                onClick={goToAvatarSelect}
                className="w-full py-3 text-sm font-semibold bg-gradient-to-r from-brand-primary to-brand-light text-white shadow-md"
                data-testid="button-choose-avatar-mobile"
              >
                <User className="w-4 h-4 mr-1.5" />
                Choose Avatar
              </Button>
            </div>

            {/* RIGHT SIDEBAR - Sticky controls panel (Desktop) */}
            <div className="lg:col-span-5 order-1 lg:order-2">
              <div className="lg:sticky lg:top-4 space-y-4">
                {/* Choose Avatar Card - Always visible */}
                <Card className="hidden lg:block border-2 border-brand-primary/20 shadow-lg bg-gradient-to-br from-white to-brand-primary/5" data-testid="card-choose-avatar">
                  <CardContent className="p-5">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 mx-auto mb-3 bg-brand-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-brand-primary" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Ready to choose your avatar?</h3>
                      <p className="text-sm text-gray-500">
                        Configure your settings, then pick an avatar for this practice
                      </p>
                    </div>

                    <Button
                      size="lg"
                      onClick={goToAvatarSelect}
                      className="w-full py-5 text-base font-semibold bg-gradient-to-r from-brand-primary to-brand-light hover:from-brand-dark hover:to-brand-primary text-white shadow-lg shadow-brand-primary/20 transition-all hover:shadow-xl hover:shadow-brand-primary/30 hover:-translate-y-0.5"
                      data-testid="button-choose-avatar"
                    >
                      <User className="w-5 h-5 mr-2" />
                      Choose Avatar
                    </Button>

                    <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                      <Sparkles className="w-4 h-4 text-brand-primary" />
                      <span className="text-gray-500 text-xs">Avatars will match your preferences</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Session Settings Card - Consolidated */}
                <Card className="border border-gray-200 shadow-sm overflow-hidden" data-testid="card-session-settings">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-gray-900 text-sm">Session Settings</h3>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    {/* Practice Mode Toggle */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Practice Mode</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setSelection("/avatar/practice/session?mode=voice")}
                          className={cn(
                            "p-2.5 rounded-lg border-2 text-center transition-all",
                            selection.includes("mode=voice")
                              ? "border-brand-primary bg-brand-primary/10"
                              : "border-gray-200 hover:border-brand-primary/50"
                          )}
                        >
                          <Mic className={cn("w-4 h-4 mx-auto mb-1", selection.includes("mode=voice") ? "text-brand-primary" : "text-gray-400")} />
                          <span className={cn("text-xs font-medium", selection.includes("mode=voice") ? "text-brand-primary" : "text-gray-600")}>Voice</span>
                        </button>
                        <button
                          onClick={() => setSelection("/avatar/practice/session")}
                          className={cn(
                            "p-2.5 rounded-lg border-2 text-center transition-all",
                            !selection.includes("mode=voice")
                              ? "border-brand-primary bg-brand-primary/10"
                              : "border-gray-200 hover:border-brand-primary/50"
                          )}
                        >
                          <Video className={cn("w-4 h-4 mx-auto mb-1", !selection.includes("mode=voice") ? "text-brand-primary" : "text-gray-400")} />
                          <span className={cn("text-xs font-medium", !selection.includes("mode=voice") ? "text-brand-primary" : "text-gray-600")}>Video</span>
                        </button>
                      </div>
                    </div>

                    {/* Language & Accent */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          <Globe className="w-3 h-3 inline mr-1" />
                          Language
                        </label>
                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                          <SelectTrigger className="w-full bg-white h-9 text-xs" data-testid="select-language">
                            <SelectValue placeholder="Language..." />
                          </SelectTrigger>
                          <SelectContent className="z-[100]">
                            {SUPPORTED_LANGUAGES.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code}>
                                <span className="flex items-center gap-1.5">
                                  <span>{lang.flag}</span>
                                  <span>{lang.name}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedLanguage === "en" && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            <Mic className="w-3 h-3 inline mr-1" />
                            Accent
                          </label>
                          <Select
                            value={selectedAccent}
                            onValueChange={(value) => {
                              setSelectedAccent(value);
                              setHasAutoSelectedAccent(true);
                            }}
                          >
                            <SelectTrigger className="w-full bg-white h-9 text-xs" data-testid="select-accent">
                              <SelectValue placeholder="Accent..." />
                            </SelectTrigger>
                            <SelectContent className="z-[100]">
                              {ENGLISH_ACCENTS.map((accent) => (
                                <SelectItem key={accent.id} value={accent.id}>
                                  {accent.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Avatar Preferences */}
                    <div className="pt-2 border-t border-gray-100">
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        <User className="w-3 h-3 inline mr-1" />
                        Avatar Preferences
                        <Badge variant="outline" className="text-[10px] ml-1.5 bg-gray-50 text-gray-500 border-gray-200 py-0">Optional</Badge>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={avatarGenderFilter || "all"}
                          onValueChange={(val) => setAvatarGenderFilter(val === "all" ? undefined : val)}
                        >
                          <SelectTrigger className="w-full bg-white h-9 text-xs" data-testid="select-avatar-gender">
                            <SelectValue placeholder="Any Gender" />
                          </SelectTrigger>
                          <SelectContent className="z-[100]">
                            <SelectItem value="all">Any Gender</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={avatarEthnicityFilter || "all"}
                          onValueChange={(val) => setAvatarEthnicityFilter(val === "all" ? undefined : val)}
                        >
                          <SelectTrigger className="w-full bg-white h-9 text-xs" data-testid="select-avatar-ethnicity">
                            <SelectValue placeholder="Any Background" />
                          </SelectTrigger>
                          <SelectContent className="z-[100]">
                            <SelectItem value="all">Any Background</SelectItem>
                            <SelectItem value="Indian">Indian</SelectItem>
                            <SelectItem value="Caucasian">Caucasian</SelectItem>
                            <SelectItem value="African-American">African-American</SelectItem>
                            <SelectItem value="East Asian">East Asian</SelectItem>
                            <SelectItem value="Middle Eastern">Middle Eastern</SelectItem>
                            <SelectItem value="Southeast Asian">Southeast Asian</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Persona Overlay */}
                    <div className="pt-2 border-t border-gray-100">
                      <PersonaOverlayCompact
                        selectedLevel={selectedPersonaLevel}
                        selectedOverlay={selectedPersonaOverlay}
                        onSelect={handlePersonaSelect}
                      />
                    </div>

                    {/* Cultural Preset (Optional) */}
                    {culturalPresets.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          <Compass className="w-3 h-3 inline mr-1" />
                          Cultural Style
                          <Badge variant="outline" className="text-[10px] ml-1.5 bg-gray-50 text-gray-500 border-gray-200 py-0">Optional</Badge>
                        </label>
                        <Select
                          value={selectedCulturalPreset || "none"}
                          onValueChange={(value) => setSelectedCulturalPreset(value === "none" ? null : value)}
                        >
                          <SelectTrigger className="w-full bg-white h-9 text-xs" data-testid="select-cultural-preset">
                            <SelectValue placeholder="Default (no overlay)" />
                          </SelectTrigger>
                          <SelectContent className="z-[100]">
                            <SelectItem value="none">Default (no overlay)</SelectItem>
                            {culturalPresets.map((preset: CulturalPreset) => (
                              <SelectItem key={preset.id} value={preset.id}>
                                {preset.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* LEFT CONTENT - Scenario details */}
            <div className="lg:col-span-7 space-y-4 order-2 lg:order-1 pb-24 lg:pb-0">
              <div className="space-y-4">
              {isCustomScenario && currentBlueprint ? (
                <>
                  <Card className="border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-4 border-b border-gray-100">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900" data-testid="text-scenario-name">
                            {currentBlueprint.scenarioSummary.title}
                          </h2>
                          <p className="text-gray-600 text-sm mt-1">Custom Scenario</p>
                        </div>
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                          <Target className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                    </div>
                    
                    <CardContent className="p-6 space-y-5">
                      <div data-testid="section-scenario">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 bg-brand-light/20 rounded-lg">
                            <MessageSquare className="w-4 h-4 text-brand-primary" />
                          </div>
                          <h3 className="font-semibold text-gray-900">Your Situation</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed pl-9">
                          {currentBlueprint.scenarioSummary.context}
                        </p>
                      </div>

                      {primaryTension && (
                        <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100" data-testid="section-tension">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-amber-100 rounded-lg">
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">What Makes This Tricky</h3>
                          </div>
                          <div className="pl-9 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                                {primaryTension.label}
                              </Badge>
                              {secondaryTension && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                                  {secondaryTension.label}
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm">
                              {currentBlueprint.scenarioSummary.whatMakesItTricky}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="bg-primary/5 rounded-xl p-4 border border-primary/10" data-testid="section-avatar-role">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 bg-primary/20 rounded-lg">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <h3 className="font-semibold text-gray-900">Your Conversation Partner</h3>
                        </div>
                        <div className="pl-9">
                          <p className="text-gray-700 leading-relaxed">
                            {currentBlueprint.scenarioSummary.counterPersonaDescription}
                          </p>
                        </div>
                      </div>

                      <div className="bg-green-50/50 rounded-xl p-4 border border-green-100" data-testid="section-objective">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 bg-green-100 rounded-lg">
                            <Target className="w-4 h-4 text-green-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900">Your Objective</h3>
                        </div>
                        <p className="text-gray-700 pl-9">
                          {currentBlueprint.scenarioSummary.objectiveStatement}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {customScenarioId && (
                    <Card className="border border-gray-200 shadow-sm overflow-hidden" data-testid="card-skills-assessment">
                      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-purple-100 rounded-lg">
                              <BookOpen className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">Skills You'll Practice</h3>
                              <p className="text-xs text-gray-500">AI-identified from your scenario</p>
                            </div>
                          </div>
                          <button
                            onClick={handleRefreshSkills}
                            disabled={skillMappingsRefetching}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Refresh skill analysis"
                          >
                            <RefreshCw className={cn("w-4 h-4", skillMappingsRefetching && "animate-spin")} />
                          </button>
                        </div>
                      </div>
                      <CardContent className="p-5">
                        {skillMappingsLoading || skillMappingsRefetching ? (
                          <div className="flex items-center gap-3 py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                            <div>
                              <p className="text-sm text-gray-600">Analyzing your scenario...</p>
                              <p className="text-xs text-gray-400">AI is matching skills from professional frameworks</p>
                            </div>
                          </div>
                        ) : skillMappings.length > 0 ? (
                          <div className="space-y-3">
                            {skillMappings.map((skill) => (
                              <div 
                                key={skill.skillId} 
                                className={cn(
                                  "p-4 rounded-xl border-2 transition-all",
                                  skill.isConfirmed 
                                    ? "border-purple-200 bg-purple-50/50" 
                                    : "border-gray-200 bg-gray-50/50"
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-gray-900">{skill.skillName}</span>
                                      {skill.isConfirmed && (
                                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                                          <CheckCircle2 className="w-3 h-3 mr-1" />
                                          Confirmed
                                        </Badge>
                                      )}
                                    </div>
                                    {skill.frameworkMapping && (
                                      <p className="text-xs text-purple-600 mb-2">
                                        Framework: {skill.frameworkMapping}
                                      </p>
                                    )}
                                    <p className="text-sm text-gray-600">{skill.rationale}</p>
                                  </div>
                                  <div className="text-right">
                                    <div className={cn(
                                      "text-lg font-bold",
                                      skill.confidenceScore >= 0.8 ? "text-green-600" :
                                      skill.confidenceScore >= 0.6 ? "text-amber-600" :
                                      "text-gray-500"
                                    )}>
                                      {Math.round(skill.confidenceScore * 100)}%
                                    </div>
                                    <div className="text-xs text-gray-400">match</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <p className="text-xs text-gray-500 pt-2">
                              After your session, you'll receive detailed feedback on each skill based on professional assessment frameworks.
                            </p>
                          </div>
                        ) : skillFetchError ? (
                          <div className="text-center py-6">
                            <div className="w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
                              <AlertCircle className="w-6 h-6 text-red-500" />
                            </div>
                            <p className="text-sm text-red-600 mb-2">{skillFetchError}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRefreshSkills}
                              className="gap-2"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Try Again
                            </Button>
                          </div>
                        ) : isSkillsTimedOut ? (
                          <div className="text-center py-6">
                            <div className="w-12 h-12 mx-auto mb-3 bg-amber-100 rounded-full flex items-center justify-center">
                              <Clock className="w-6 h-6 text-amber-500" />
                            </div>
                            <p className="text-sm text-gray-600 mb-1">Analysis is taking longer than expected</p>
                            <p className="text-xs text-gray-400 mb-3">
                              The AI is still processing your scenario. You can start practicing now or wait.
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRefreshSkills}
                              className="gap-2"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Check Again
                            </Button>
                          </div>
                        ) : isSkillsStillAnalyzing ? (
                          <div className="flex items-center gap-3 py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                            <div>
                              <p className="text-sm text-gray-600">Analyzing your scenario...</p>
                              <p className="text-xs text-gray-400">AI is matching skills from professional frameworks</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                              <Sparkles className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-600 mb-1">No skill mappings found</p>
                            <p className="text-xs text-gray-400">
                              Your scenario may require skills not yet in our catalog
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {mode !== "custom" && (
                    <Card className="border border-gray-200 shadow-sm" data-testid="card-framework-settings">
                      <div className="px-5 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <Settings2 className="w-5 h-5 text-gray-400" />
                          <h3 className="font-semibold text-gray-900">Customize Your Practice</h3>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Adjust these settings to change how the AI behaves
                        </p>
                      </div>
                      <CardContent className="p-5 space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              Counter-Persona
                            </div>
                          </label>
                          <p className="text-xs text-gray-500 mb-3">
                            How should the other person behave in this conversation?
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {COUNTER_PERSONA_ARCHETYPES.map((persona) => (
                              <button
                                key={persona.id}
                                onClick={() => setSelectedCounterPersona(persona.id as CounterPersonaArchetype)}
                                className={cn(
                                  "p-3 rounded-lg border-2 text-left transition-all",
                                  selectedCounterPersona === persona.id
                                    ? "border-primary bg-primary/5"
                                    : "border-gray-200 hover:border-primary/50"
                                )}
                              >
                                <div className="font-medium text-sm text-gray-900">{persona.label}</div>
                                <div className="text-xs text-gray-500 mt-1">{persona.description}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-gray-500" />
                              Your Objective
                            </div>
                          </label>
                          <p className="text-xs text-gray-500 mb-3">
                            What are you trying to achieve in this conversation?
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {USER_OBJECTIVES.map((objective) => (
                              <button
                                key={objective.id}
                                onClick={() => setSelectedObjective(objective.id as UserObjective)}
                                className={cn(
                                  "p-3 rounded-lg border-2 text-left transition-all",
                                  selectedObjective === objective.id
                                    ? "border-primary bg-primary/5"
                                    : "border-gray-200 hover:border-primary/50"
                                )}
                              >
                                <div className="font-medium text-sm text-gray-900">{objective.label}</div>
                                <div className="text-xs text-gray-500 mt-1">{objective.description}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center gap-2">
                              <Compass className="w-4 h-4 text-gray-500" />
                              Conversation Mode
                            </div>
                          </label>
                          <p className="text-xs text-gray-500 mb-3">
                            What's the overall feel of the conversation?
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {CONVERSATION_MODES.map((m) => (
                              <button
                                key={m.id}
                                onClick={() => setSelectedMode(m.id as ConversationMode)}
                                className={cn(
                                  "px-4 py-2 rounded-full border-2 text-sm font-medium transition-all",
                                  selectedMode === m.id
                                    ? "border-primary bg-primary text-white"
                                    : "border-gray-200 text-gray-700 hover:border-primary/50"
                                )}
                              >
                                {m.label}
                              </button>
                            ))}
                          </div>
                          {selectedMode && (
                            <p className="text-xs text-gray-500 mt-2">
                              {getModeById(selectedMode)?.description}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : scenario && (
                <Card className="border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900" data-testid="text-scenario-name">
                          {scenario.name}
                        </h2>
                        <Badge 
                          variant="outline" 
                          className={`mt-2 ${getDifficultyColor(scenario.difficulty)}`}
                          data-testid="badge-difficulty"
                        >
                          {scenario.difficulty || "Beginner"} Level
                        </Badge>
                      </div>
                      <div className="p-3 bg-white rounded-xl shadow-sm">
                        <Target className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-6 space-y-5">
                    {scenario.description && (
                      <div data-testid="section-practice">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 bg-brand-light/20 rounded-lg">
                            <Lightbulb className="w-4 h-4 text-brand-primary" />
                          </div>
                          <h3 className="font-semibold text-gray-900">What You'll Learn</h3>
                        </div>
                        <p className="text-gray-600 leading-relaxed pl-9">
                          In this practice session, you will develop skills in <span className="font-medium text-gray-800">{scenario.description.toLowerCase().replace(/\.$/, '')}</span>. You'll receive real-time feedback to help improve your approach.
                        </p>
                      </div>
                    )}

                    {scenario.context && (
                      <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100" data-testid="section-scenario">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 bg-amber-100 rounded-lg">
                            <MessageSquare className="w-4 h-4 text-amber-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900">The Situation</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed pl-9">
                          <span className="font-medium text-amber-700">Your scenario:</span> {anonymizeScenarioText(scenario.context, scenario.avatarRole || "The other person")}
                        </p>
                      </div>
                    )}

                    {scenario.avatarRole && (
                      <div className="bg-primary/5 rounded-xl p-4 border border-primary/10" data-testid="section-avatar-role">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 bg-primary/20 rounded-lg">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <h3 className="font-semibold text-gray-900">Your Conversation Partner</h3>
                        </div>
                        <div className="pl-9">
                          <p className="text-lg font-medium text-primary mb-2">
                            {scenario.avatarRole}
                          </p>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            You'll be speaking with an AI playing this role. They will respond realistically based on the scenario, giving you authentic practice for real-world situations.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="bg-green-50/50 rounded-xl p-4 border border-green-100" data-testid="section-objective">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-green-100 rounded-lg">
                          <Target className="w-4 h-4 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Your Objectives</h3>
                      </div>
                      <ul className="space-y-2 pl-9">
                        <li className="flex items-start gap-2 text-gray-700">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="leading-relaxed">Practice and develop your skills in: {scenario.description?.toLowerCase().replace(/\.$/, '') || 'this scenario'}</span>
                        </li>
                        {scenario.avatarRole && (
                          <li className="flex items-start gap-2 text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="leading-relaxed">Engage in a realistic conversation with a {scenario.avatarRole.toLowerCase()}</span>
                          </li>
                        )}
                        <li className="flex items-start gap-2 text-gray-700">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="leading-relaxed">Demonstrate effective communication and active listening</span>
                        </li>
                        <li className="flex items-start gap-2 text-gray-700">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="leading-relaxed">Receive AI-powered feedback on your performance</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
