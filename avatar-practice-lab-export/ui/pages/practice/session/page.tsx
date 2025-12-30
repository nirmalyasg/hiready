
import { useEffect, useState, useMemo } from 'react';
import { Button } from "@/components/ui/button"; 
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import InteractiveAvatar from '@/components/InteractiveAvatar';
import ModernDashboardLayout from '@/components/layout/modern-dashboard-layout';
import { useAuth } from "@/hooks/use-auth";
import { Globe } from "lucide-react";
import type { PersonaOverlay } from "@/lib/conversation-framework";

const languageNames: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  zh: "Mandarin",
  ja: "Japanese",
  ko: "Korean",
  hi: "Hindi",
  bn: "Bengali",
  te: "Telugu",
  ta: "Tamil",
  mr: "Marathi",
  gu: "Gujarati",
  kn: "Kannada",
  ml: "Malayalam",
  ar: "Arabic",
  ru: "Russian",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
};

interface ScenarioData {
  id?: string;
  name?: string;
  context?: string;
  instructions?: string;
  description?: string;
  avatarRole?: string;
  avatarName?: string;
  skillId?: string;
  openingScene?: string;
  tags?: string[];
  counterPersona?: {
    role: string;
    caresAbout: string;
    pressureResponse: "pushes_back" | "withdraws" | "escalates" | "complies" | "challenges_logic";
    triggers: string[];
  };
  personaOverlays?: Record<string, any>;
}

export default function SessionPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [error, setError] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [transcriptId, setTranscriptId] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const autostart = searchParams.get('autostart') === 'true';

  const scenarioId = searchParams.get('scenarioId');
  const customScenarioId = searchParams.get('customScenarioId');
  const avatarId = searchParams.get('avatarId');
  const languageParam = searchParams.get('language') || 'en';
  const blueprintParam = searchParams.get('blueprint');
  const personaOverlayLevel = searchParams.get('personaOverlay');
  const personaOverlayDataParam = searchParams.get('personaOverlayData');
  
  // Parse persona overlay data from URL params
  // If personaOverlayDataParam is provided, use it directly
  // Otherwise, if personaOverlayLevel is provided and scenario has personaOverlays, resolve from scenario
  const parsedPersonaOverlay = useMemo<PersonaOverlay | undefined>(() => {
    // First try to parse explicit overlay data from URL
    if (personaOverlayDataParam) {
      try {
        // Handle both already-decoded and encoded inputs
        const decoded = personaOverlayDataParam.includes('%') 
          ? decodeURIComponent(personaOverlayDataParam) 
          : personaOverlayDataParam;
        return JSON.parse(decoded) as PersonaOverlay;
      } catch (e) {
        console.warn('Failed to parse persona overlay data from URL:', e);
      }
    }
    
    // Fallback: if we have a level and scenario has personaOverlays, resolve from scenario
    if (personaOverlayLevel && scenario?.personaOverlays) {
      // Try case-insensitive match
      const overlays = scenario.personaOverlays;
      const level = personaOverlayLevel.toLowerCase();
      const matchedKey = Object.keys(overlays).find(
        key => key.toLowerCase() === level
      );
      if (matchedKey && overlays[matchedKey]) {
        return overlays[matchedKey] as PersonaOverlay;
      }
    }
    
    return undefined;
  }, [personaOverlayDataParam, personaOverlayLevel, scenario?.personaOverlays]);

  useEffect(() => {
    const fetchScenario = async () => {
      try {
        setIsInitializing(true);
        
        if (customScenarioId) {
          const response = await fetch(`/api/avatar/custom-scenarios/${customScenarioId}`, {
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch custom scenario');
          }
          
          const data = await response.json();
          if (data.success && data.scenario) {
            const customScenario = data.scenario;
            let blueprint = customScenario.blueprint;
            
            if (blueprintParam) {
              try {
                blueprint = JSON.parse(decodeURIComponent(blueprintParam));
              } catch (e) {
                console.warn('Failed to parse blueprint from URL, using stored blueprint');
              }
            }
            
            setScenario({
              id: `custom-${customScenario.id}`,
              name: customScenario.title,
              description: customScenario.description,
              context: blueprint?.contextBackground || customScenario.description,
              instructions: blueprint?.conversationGoal || 'Practice this conversation scenario',
              avatarRole: blueprint?.personaDetails || 'Conversation partner',
            });
          } else {
            setError('Custom scenario not found. Please return to practice and try again.');
          }
        } else if (scenarioId) {
          const response = await fetch(`/api/avatar/get-scenarios?scenarioId=${scenarioId}`);
          const data = await response.json();
          if (data.scenarios && data.scenarios.length > 0) {
            setScenario(data.scenarios[0]);
            if(data.scenarios[0].skillId){
              const newParams = new URLSearchParams(searchParams);
              newParams.set("skill", data.scenarios[0].skillId);
              setSearchParams(newParams);
            }
          } else {
            setError('Scenario not found. Please return to practice and try again.');
          }
        } else {
          setError('No scenario specified. Please return to practice and try again.');
        }
      } catch (error) {
        console.error('Error fetching scenario:', error);
        setError('Unable to load the practice scenario. Please check your connection and try again.');
      } finally {
        setIsInitializing(false);
      }
    };

    if (scenarioId || customScenarioId) {
      fetchScenario();
    } else {
      setIsInitializing(false);
    }
  }, [scenarioId, customScenarioId]);

  useEffect(() => {
    const fetchTranscriptId = async () => {
      try {
        if (!sessionStarted) {
          return;
        }

        const effectiveScenarioId = scenarioId || (customScenarioId ? `custom-${customScenarioId}` : null);
        const response = await fetch(`/api/get-transcript-id?scenarioId=${effectiveScenarioId}&avatarId=${avatarId}`);
        if (!response.ok && response.status !== 404) {
          throw new Error(`Failed to fetch transcript: ${response.status}`);
        }
        if (response.ok) {
          const data = await response.json();
          if (data.transcriptId) {
            setTranscriptId(data.transcriptId);
          }
        }
      } catch (error) {
        console.error("Error fetching transcript ID:", error);
      }
    };

    if ((scenarioId || customScenarioId) && avatarId && sessionStarted) {
      fetchTranscriptId();
    }
  }, [scenarioId, customScenarioId, avatarId, sessionStarted]);

  const initSession = async () => {
    if (!sessionStarted && !isLoadingSession) {
      try {
        setIsLoadingSession(true);
        if ((!scenarioId && !customScenarioId) || !avatarId) {
          throw new Error('Missing required parameters');
        }
        setSessionStarted(true);
      } catch (error) {
        console.error("Failed to start session:", error);
        setError("Unable to start the practice session. Please try again.");
      } finally {
        setIsLoadingSession(false);
      }
    }
  };

  useEffect(() => {
    if ((scenarioId || customScenarioId) && avatarId && autostart && scenario && !isInitializing) {
      console.log("Auto-starting session with:", { scenarioId, customScenarioId, avatarId });
      initSession();
    }
  }, [scenarioId, customScenarioId, avatarId, autostart, scenario, isInitializing]);

  // Simplified error handling
  if ((!scenarioId && !customScenarioId) || !avatarId) {
    return (
      <ModernDashboardLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Session Error</h1>
            <p className="text-gray-600 mb-6">Invalid session parameters. Please start a new practice session.</p>
            <Link to="/avatar/practice">
              <Button color="primary" size="lg">← Return to Practice</Button>
            </Link>
          </div>
        </div>
      </ModernDashboardLayout>
    );
  }

  // Loading state
  if (isInitializing) {
    return (
      <ModernDashboardLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Preparing Your Session</h3>
            <p className="text-gray-600">Setting up your practice scenario...</p>
          </div>
        </div>
      </ModernDashboardLayout>
    );
  }

  return (
    <ModernDashboardLayout>
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          {/* Simplified Header */}
          <div className="mb-6">
            <Link 
              to="/avatar/practice" 
              className="inline-flex items-center text-brand-primary hover:text-brand-dark mb-4 font-medium"
            >
              ← End Practice Session
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {scenario?.name || 'Practice Session'}
              </h1>
              {languageParam && languageParam !== "en" && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-light/10 text-brand-primary rounded-full text-sm font-medium" data-testid="language-indicator">
                  <Globe className="w-4 h-4" />
                  <span>{languageNames[languageParam] || languageParam.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                  <p className="text-sm text-red-600 mt-1">
                    <Link to="/avatar/practice" className="underline hover:text-red-500">
                      Return to practice selection
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Session Content */}
          {isLoadingSession ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-pulse mb-4">
                  <div className="w-16 h-16 mx-auto bg-brand-light/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 6.292 4 4 0 010-6.292zM15 21H3v-1a6 6 0 0112 0v1z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Starting Your Session</h3>
                <p className="text-gray-600">Please wait while we connect you with your practice partner...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white">
              <InteractiveAvatar
                initialAvatarId={avatarId}
                initialKnowledgeId={scenario?.id || scenarioId || `custom-${customScenarioId}`}
                scenario={scenario ?? undefined}
                personaOverlay={parsedPersonaOverlay}
              />
            </div>
          )}
        </div>
      </div>
    </ModernDashboardLayout>
  );
}