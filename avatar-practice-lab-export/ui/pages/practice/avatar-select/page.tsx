import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAvatars } from "@/hooks/use-avatars";
import ModernDashboardLayout from "@/components/layout/modern-dashboard-layout";
import { ChevronRight, ChevronLeft, Check, Filter, User } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAvatarSession } from "@/contexts/AvatarSessionContext";
import { useRealtimePrewarm } from "@/contexts/RealtimeSessionPrewarmContext";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";

export const avatarData = [
  {
    id: "Dexter_Lawyer_Sitting_public",
    name: "Dexter",
    ethnicity: "American",
    gender: "Male",
    role: "Manager",
    image: "https://files2.heygen.ai/avatar/v3/e20ac0c902184ff793e75ae4e139b7dc_45600/preview_target.webp",
  },
  {
    id: "Elenora_IT_Sitting_public",
    name: "Elenora",
    ethnicity: "German",
    gender: "Female",
    role: "Manager",
    image: "https://files2.heygen.ai/avatar/v3/cbd4a69890a040e6a0d54088e606a559_45610/preview_talk_3.webp",
  },
  {
    id: "June_HR_public",
    name: "June",
    ethnicity: "Asian",
    gender: "Female",
    role: "Manager",
    image: "https://files2.heygen.ai/avatar/v3/74447a27859a456c955e01f21ef18216_45620/preview_talk_1.webp",
  },
];

export default function AvatarSelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scenarioId = searchParams.get("scenarioId");
  const urlGender = searchParams.get("gender");
  const urlEthnicity = searchParams.get("ethnicity");
  const urlLanguage = searchParams.get("language") || "en";
  const urlMode = searchParams.get("mode") || "voice";
  const blueprintParam = searchParams.get("blueprint");
  const customScenarioId = searchParams.get("customScenarioId");
  const topicParam = searchParams.get("topic");
  const categoryParam = searchParams.get("category");
  const culturalPreset = searchParams.get("culturalPreset");
  const accent = searchParams.get("accent");
  const personaOverlay = searchParams.get("personaOverlay");
  const personaOverlayData = searchParams.get("personaOverlayData");
  const interviewSessionId = searchParams.get("interviewSessionId");
  const configId = searchParams.get("configId");
  
  const isInterviewMode = !!interviewSessionId;
  
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const avatarSession = useAvatarSession();
  const realtimePrewarm = useRealtimePrewarm();
  
  const handleImageError = (avatarId: string) => {
    setFailedImages(prev => ({ ...prev, [avatarId]: true }));
  };
  
  const getFallbackUrl = (name: string) => {
    const encodedName = encodeURIComponent(name || 'Avatar');
    return `https://ui-avatars.com/api/?name=${encodedName}&background=6366f1&color=fff&size=200&bold=true`;
  };
  
  const {
    avatarData: avatars,
    isLoading,
    isError,
    page,
    totalPages,
    setPage,
    filters,
    setFilters,
  } = useAvatars();

  const activeFilterCount = (filters.gender ? 1 : 0) + (filters.ethnicity ? 1 : 0);

  const shuffledAvatars = useMemo(() => {
    if (!avatars || avatars.length === 0) return [];
    
    // Group avatars by their base name (first name)
    const groupedByName: Record<string, typeof avatars> = {};
    avatars.forEach((avatar) => {
      const baseName = avatar.name?.split(' ')[0] || avatar.name || 'Unknown';
      if (!groupedByName[baseName]) {
        groupedByName[baseName] = [];
      }
      groupedByName[baseName].push(avatar);
    });
    
    // Shuffle each group internally
    Object.values(groupedByName).forEach((group) => {
      for (let i = group.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [group[i], group[j]] = [group[j], group[i]];
      }
    });
    
    // Get all unique names and shuffle them
    const names = Object.keys(groupedByName);
    for (let i = names.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [names[i], names[j]] = [names[j], names[i]];
    }
    
    // Interleave avatars from different groups to maximize diversity
    const result: typeof avatars = [];
    let maxLength = Math.max(...Object.values(groupedByName).map(g => g.length));
    
    for (let i = 0; i < maxLength; i++) {
      for (const name of names) {
        if (groupedByName[name][i]) {
          result.push(groupedByName[name][i]);
        }
      }
    }
    
    return result;
  }, [avatars]);

  useEffect(() => {
    const isVoiceMode = urlMode === "voice";
    const isImpromptu = !!(topicParam && categoryParam);
    
    if (avatarSession?.preWarmToken && !isVoiceMode) {
      console.log("[AvatarSelect] Pre-warming HeyGen token...");
      avatarSession.preWarmToken();
    }
    
    if (isVoiceMode && realtimePrewarm) {
      console.log("[AvatarSelect] Pre-warming OpenAI Realtime token...");
      realtimePrewarm.prewarmToken();
      
      if (isImpromptu && topicParam && categoryParam) {
        console.log("[AvatarSelect] Pre-warming Tavily research for impromptu...");
        realtimePrewarm.prewarmResearch(topicParam, categoryParam);
      }
    }
  }, [avatarSession, realtimePrewarm, urlMode, topicParam, categoryParam]);

  // Apply URL filters as initial values
  useEffect(() => {
    if (urlGender || urlEthnicity) {
      setFilters({
        gender: urlGender || undefined,
        ethnicity: urlEthnicity || undefined,
      });
    }
  }, [urlGender, urlEthnicity, setFilters]);

  const selectAvatar = (avatarId: string) => {
    setSelectedAvatar(avatarId);
  };

  const startSession = () => {
    if (selectedAvatar) {
      const presentationId = searchParams.get("presentationId");
      const isVoiceMode = urlMode === "voice";
      
      const params = new URLSearchParams();
      params.set("avatarId", selectedAvatar);
      params.set("language", urlLanguage);
      params.set("autostart", "true");
      
      if (scenarioId) {
        params.set("scenarioId", scenarioId);
      }
      if (blueprintParam) {
        params.set("blueprint", blueprintParam);
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
      if (culturalPreset) {
        params.set("culturalPreset", culturalPreset);
      }
      if (accent) {
        params.set("accent", accent);
      }
      if (personaOverlay) {
        params.set("personaOverlay", personaOverlay);
      }
      if (personaOverlayData) {
        params.set("personaOverlayData", personaOverlayData);
      }
      if (presentationId) {
        params.set("presentationId", presentationId);
      }
      if (interviewSessionId) {
        params.set("interviewSessionId", interviewSessionId);
      }
      if (configId) {
        params.set("configId", configId);
      }
      
      if (isInterviewMode) {
        navigate(`/avatar/assessment-session/roleplay?${params.toString()}`);
      } else if (presentationId) {
        navigate(`/avatar/practice/presentation/session?${params.toString()}`);
      } else if (isVoiceMode) {
        navigate(`/avatar/assessment-session/roleplay?${params.toString()}`);
      } else {
        navigate(`/avatar/practice/session?${params.toString()}`);
      }
    }
  };

  // Build URL to go back to pre-session with all params
  const getBackToPreSessionUrl = () => {
    if (isInterviewMode) {
      const params = new URLSearchParams();
      if (configId) params.set("configId", configId);
      return `/interview/pre-session?${params.toString()}`;
    }
    
    const params = new URLSearchParams();
    if (scenarioId) params.set("scenarioId", scenarioId);
    if (blueprintParam) params.set("blueprint", blueprintParam);
    if (customScenarioId) params.set("customScenarioId", customScenarioId);
    if (topicParam) params.set("topic", topicParam);
    if (categoryParam) params.set("category", categoryParam);
    return `/avatar/practice/pre-session?${params.toString()}`;
  };

  return (
    <ModernDashboardLayout>
      <div className="min-h-screen bg-gray-50/50 pb-32 sm:pb-8">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <Link
              to={getBackToPreSessionUrl()}
              className="inline-flex items-center text-gray-500 hover:text-primary mb-3 sm:mb-4 text-sm font-medium transition-colors"
              data-testid="link-back-presession"
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
              <span className="hidden sm:inline">Back to Settings</span>
              <span className="sm:hidden">Back</span>
            </Link>
            
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900" data-testid="text-page-title">
                  Choose Your Avatar
                </h1>
                <p className="text-xs sm:text-base text-gray-500 mt-0.5 sm:mt-1 hidden sm:block" data-testid="text-page-subtitle">
                  Select an AI avatar to practice with
                </p>
              </div>

              {/* Selected Avatar Indicator */}
              {selectedAvatar && (
                <div className="flex items-center gap-1.5 sm:gap-2 bg-primary/10 text-primary px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg">
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm font-medium">Selected</span>
                </div>
              )}
            </div>
          </div>

          {/* Applied Filters Banner */}
          {activeFilterCount > 0 && (
            <div className="mb-4 p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="w-4 h-4 text-brand-primary" />
                  <span className="text-sm text-gray-600">Showing avatars matching:</span>
                  {filters.gender && (
                    <Badge variant="secondary" className="bg-brand-primary/10 text-brand-primary border-0">
                      {filters.gender}
                    </Badge>
                  )}
                  {filters.ethnicity && (
                    <Badge variant="secondary" className="bg-brand-primary/10 text-brand-primary border-0">
                      {filters.ethnicity}
                    </Badge>
                  )}
                </div>
                <Link 
                  to={getBackToPreSessionUrl()}
                  className="text-xs text-brand-primary hover:underline"
                >
                  Change preferences
                </Link>
              </div>
            </div>
          )}

          {/* Two-column layout for desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN - Avatar Grid */}
            <div className="lg:col-span-9 order-2 lg:order-1">
              {/* Avatar Grid */}
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="text-center">
                    <LoadingSpinner />
                    <p className="text-gray-500 mt-4">Loading avatars...</p>
                  </div>
                </div>
              ) : isError ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                  <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-2xl flex items-center justify-center">
                    <User className="w-10 h-10 text-red-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Failed to load avatars
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Please try refreshing the page or check back later.
                  </p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 mb-6">
                    {shuffledAvatars?.map((avatar) => {
                      const isSelected = selectedAvatar === avatar.id;
                      const firstName = avatar?.name?.split(' ').length > 1 
                        ? avatar?.name?.split(' ')[0] 
                        : avatar?.name;

                      return (
                        <Card
                          key={avatar.id}
                          className={`group cursor-pointer transition-all duration-200 overflow-hidden ${
                            isSelected
                              ? "ring-2 ring-brand-primary border-brand-primary shadow-md"
                              : "border-gray-200 hover:border-brand-primary/30 hover:shadow-sm"
                          }`}
                          onClick={() => selectAvatar(avatar.id)}
                          role="button"
                          tabIndex={0}
                          data-testid={`card-avatar-${avatar.id}`}
                        >
                          <CardContent className="p-0">
                            {/* Avatar Image */}
                            <div className="aspect-square relative bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                              <img
                                src={failedImages[avatar.id] ? getFallbackUrl(avatar.name) : avatar.imageUrl}
                                alt={avatar.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={() => handleImageError(avatar.id)}
                                loading="lazy"
                              />
                              
                              {/* Selection Indicator */}
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center shadow-md">
                                  <Check className="w-3.5 h-3.5 text-white" />
                                </div>
                              )}

                              {/* Availability Badge */}
                              <div className="absolute top-2 left-2">
                                <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1.5 py-0.5 font-medium">
                                  Available
                                </Badge>
                              </div>
                            </div>

                            {/* Avatar Info */}
                            <div className="p-2 bg-white">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-900 truncate">
                                  {firstName}
                                </h3>
                                {isSelected && (
                                  <Check className="w-3 h-3 text-brand-primary flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="w-9 h-9 p-0"
                        data-testid="button-prev-page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="w-9 h-9 p-0"
                            data-testid={`button-page-${pageNum}`}
                          >
                            {pageNum}
                          </Button>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        className="w-9 h-9 p-0"
                        data-testid="button-next-page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* RIGHT SIDEBAR - Sticky selection panel (Desktop only) */}
            <div className="hidden lg:block lg:col-span-3 order-1 lg:order-2">
              <div className="lg:sticky lg:top-4 space-y-4">
                <Card className="border-2 border-brand-primary/20 shadow-lg bg-gradient-to-br from-white to-brand-primary/5">
                  <CardContent className="p-5">
                    {/* Avatar Preview Section */}
                    {selectedAvatar ? (
                      (() => {
                        const selected = shuffledAvatars?.find(a => a.id === selectedAvatar);
                        const firstName = selected?.name?.split(' ')[0] || selected?.name;
                        return selected ? (
                          <div className="text-center mb-4">
                            <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden ring-4 ring-brand-primary/20 shadow-lg">
                              <img 
                                src={failedImages[selected.id] ? getFallbackUrl(selected.name) : selected.imageUrl}
                                alt={selected.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h3 className="font-bold text-lg text-gray-900">{firstName}</h3>
                            <div className="flex items-center justify-center gap-2 mt-1">
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-600 font-medium">Selected</span>
                            </div>
                          </div>
                        ) : null;
                      })()
                    ) : (
                      <div className="text-center mb-4">
                        <div className="w-20 h-20 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="font-semibold text-gray-700 mb-1">No Avatar Selected</h3>
                        <p className="text-sm text-gray-500">Click on an avatar to select them</p>
                      </div>
                    )}

                    {/* Start Practice Button - Always visible */}
                    <Button
                      size="lg"
                      onClick={startSession}
                      disabled={!selectedAvatar}
                      className={`w-full py-5 text-base font-semibold transition-all ${
                        selectedAvatar
                          ? "bg-gradient-to-r from-brand-primary to-brand-light hover:from-brand-dark hover:to-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/30 hover:-translate-y-0.5"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                      data-testid="button-start-practice"
                    >
                      Start Practice
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick tips card */}
                <Card className="border border-gray-200 bg-white/80">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-gray-800 text-sm mb-2">Quick Tips</h4>
                    <ul className="text-xs text-gray-500 space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="text-brand-primary mt-0.5">•</span>
                        <span>Choose an avatar that matches your practice scenario</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-primary mt-0.5">•</span>
                        <span>Use filters to find specific characteristics</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-primary mt-0.5">•</span>
                        <span>All avatars are AI-powered and respond naturally</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Mobile: Fixed bottom CTA bar */}
          <div className="lg:hidden fixed bottom-14 left-0 right-0 p-3 bg-white border-t border-gray-200 z-50 shadow-lg">
            <div className="flex items-center gap-3">
              {selectedAvatar && (() => {
                const selected = shuffledAvatars?.find(a => a.id === selectedAvatar);
                return selected ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-brand-primary/20 flex-shrink-0">
                    <img 
                      src={failedImages[selected.id] ? getFallbackUrl(selected.name) : selected.imageUrl}
                      alt={selected.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null;
              })()}
              <Button
                size="lg"
                onClick={startSession}
                disabled={!selectedAvatar}
                className={`flex-1 py-3 text-sm font-semibold transition-all ${
                  selectedAvatar
                    ? "bg-gradient-to-r from-brand-primary to-brand-light text-white shadow-md"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                data-testid="button-start-practice-mobile"
              >
                {selectedAvatar ? "Start Practice" : "Select an Avatar"}
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>

        <MobileBottomNav />
      </div>
    </ModernDashboardLayout>
  );
}
