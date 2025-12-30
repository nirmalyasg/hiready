import { useState, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Users, Presentation, Filter, X, Globe, Briefcase, Languages } from "lucide-react";

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "zh", name: "Mandarin", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
];
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ModernDashboardLayout from "@/components/layout/modern-dashboard-layout";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import { useAvatars, type Avatar } from "@/hooks/use-avatars";
import { useQuery } from "@tanstack/react-query";

const AUDIENCE_ROLES = [
  { id: "customer", label: "Customer", description: "Focuses on value and practical benefits" },
  { id: "manager", label: "Manager", description: "Interested in outcomes and resource implications" },
  { id: "team_member", label: "Team Member", description: "Collaborative, asks implementation questions" },
  { id: "stakeholder", label: "Stakeholder", description: "Strategic view, cares about ROI and alignment" },
  { id: "executive", label: "Executive", description: "Big picture focus, time-conscious" },
  { id: "technical_expert", label: "Technical Expert", description: "Deep dives into methodology and details" },
  { id: "skeptic", label: "Skeptic", description: "Challenges assumptions, needs convincing" },
];

interface AvatarWithConfig extends Omit<Avatar, 'role'> {
  role?: string;
}

export default function PresentationAvatarSelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presentationId = searchParams.get("presentationId");
  
  const [selectedAvatars, setSelectedAvatars] = useState<AvatarWithConfig[]>([]);
  const [selectedCulturalPreset, setSelectedCulturalPreset] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const maxAvatars = 4;
  const minAvatars = 1;

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

  interface CulturalPreset {
    id: string;
    name: string;
    description: string;
  }

  const { data: culturalPresets = [] } = useQuery({
    queryKey: ["culturalPresets"],
    queryFn: async (): Promise<CulturalPreset[]> => {
      const res = await fetch("/api/avatar/cultural-presets");
      const result = await res.json();
      if (!res.ok) throw new Error(result?.error || "Failed to fetch cultural presets");
      return result.presets || [];
    },
  });

  const shuffledAvatars = useMemo(() => {
    if (!avatars || avatars.length === 0) return [];
    
    const groupedByName: Record<string, typeof avatars> = {};
    avatars.forEach((avatar) => {
      const baseName = avatar.name?.split(' ')[0] || avatar.name || 'Unknown';
      if (!groupedByName[baseName]) {
        groupedByName[baseName] = [];
      }
      groupedByName[baseName].push(avatar);
    });
    
    Object.values(groupedByName).forEach((group) => {
      for (let i = group.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [group[i], group[j]] = [group[j], group[i]];
      }
    });
    
    const names = Object.keys(groupedByName);
    for (let i = names.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [names[i], names[j]] = [names[j], names[i]];
    }
    
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

  const isSelected = (avatarId: string) => 
    selectedAvatars.some(a => a.id === avatarId);

  const toggleAvatar = (avatar: Avatar) => {
    if (isSelected(avatar.id)) {
      setSelectedAvatars(prev => prev.filter(a => a.id !== avatar.id));
    } else if (selectedAvatars.length < maxAvatars) {
      const defaultRoles = ["customer", "manager", "team_member", "stakeholder", "executive", "technical_expert", "skeptic"];
      setSelectedAvatars(prev => [...prev, { 
        ...avatar, 
        role: defaultRoles[prev.length % defaultRoles.length] 
      }]);
    }
  };

  const allAvatarsHaveRoles = selectedAvatars.every(a => a.role && a.role.length > 0);

  const removeAvatar = (avatarId: string) => {
    setSelectedAvatars(prev => prev.filter(a => a.id !== avatarId));
  };

  const updateAvatarRole = (avatarId: string, role: string) => {
    setSelectedAvatars(prev => prev.map(a => 
      a.id === avatarId ? { ...a, role } : a
    ));
  };

  const getPersonalityForRole = (role: string): string => {
    const personalities: Record<string, string> = {
      customer: "a customer focused on value, ROI, and practical benefits. You ask questions about how this will help you and what problems it solves",
      manager: "a manager interested in outcomes, timelines, and resource implications. You care about feasibility and team impact",
      team_member: "a collaborative team member who asks implementation questions and wants to understand how things work together",
      stakeholder: "a stakeholder with a strategic view, caring about alignment with business goals and long-term implications",
      executive: "an executive with a big picture focus. You're time-conscious and care about strategic value and competitive advantage",
      technical_expert: "a technical expert who deep dives into methodology, architecture, and implementation details",
      skeptic: "a skeptic who challenges assumptions and needs convincing with evidence and clear reasoning",
    };
    return personalities[role] || "a professional audience member who listens attentively and asks relevant questions";
  };

  const handleStartSession = () => {
    if (selectedAvatars.length >= minAvatars && presentationId) {
      const avatarsData = selectedAvatars.map((a) => ({
        id: a.id,
        name: a.name,
        gender: a.gender,
        imageUrl: a.imageUrl,
        role: a.role || "team_member",
        personality: getPersonalityForRole(a.role || "team_member")
      }));
      const encodedAvatars = encodeURIComponent(JSON.stringify(avatarsData));
      let url = `/avatar/practice/presentation/session?presentationId=${presentationId}&avatars=${encodedAvatars}`;
      if (selectedCulturalPreset) {
        url += `&culturalPreset=${selectedCulturalPreset}`;
      }
      if (selectedLanguage) {
        url += `&language=${selectedLanguage}`;
      }
      navigate(url);
    }
  };

  if (!presentationId) {
    return (
      <ModernDashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Presentation className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No Presentation Found</h2>
            <p className="text-slate-500 mb-4">Please upload a presentation first.</p>
            <Link to="/avatar/practice/presentation">
              <Button>Go to Upload</Button>
            </Link>
          </div>
        </div>
      </ModernDashboardLayout>
    );
  }

  return (
    <ModernDashboardLayout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <div className="mb-6">
            <Link
              to="/avatar/practice/presentation"
              className="inline-flex items-center text-gray-500 hover:text-primary mb-4 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Upload
            </Link>
            
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm font-medium mb-2">
                  <Users className="w-4 h-4" />
                  Build Your Audience
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Choose Your Meeting Participants
                </h1>
                <p className="text-gray-500 mt-1">
                  Select {minAvatars}-{maxAvatars} AI avatars and assign their roles
                </p>
              </div>
            </div>
          </div>

          {selectedAvatars.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-orange-500" />
                  Your Meeting Audience
                </h3>
                <span className="text-sm text-gray-500">{selectedAvatars.length} of {maxAvatars} selected</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {selectedAvatars.map((avatar) => (
                  <div
                    key={avatar.id}
                    className="flex flex-col bg-gray-50 border border-gray-200 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={avatar.imageUrl}
                        alt={avatar.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${avatar.name}&background=4a5568&color=fff`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{avatar.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{avatar.gender}</p>
                      </div>
                      <button
                        onClick={() => removeAvatar(avatar.id)}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <Select
                      value={avatar.role || "team_member"}
                      onValueChange={(val) => updateAvatarRole(avatar.id, val)}
                    >
                      <SelectTrigger className="w-full bg-white text-sm">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {AUDIENCE_ROLES.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <span>{role.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-2">
                      {AUDIENCE_ROLES.find(r => r.id === avatar.role)?.description || ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Languages className="w-5 h-5 text-brand-primary" />
              <h3 className="text-base font-semibold text-gray-900">Session Language</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Choose the language for this practice session. The audience will communicate in this language and politely ask you to use it if you switch.
            </p>
            <div className="grid gap-2 grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 mb-6">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    selectedLanguage === lang.code 
                      ? "border-brand-primary bg-brand-light/10 ring-1 ring-brand-primary" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl block mb-1">{lang.flag}</span>
                  <p className="text-xs font-medium text-gray-900 truncate">{lang.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-brand-primary" />
              <h3 className="text-base font-semibold text-gray-900">Communication Style</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Choose how your audience communicates (optional)
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <button
                onClick={() => setSelectedCulturalPreset("")}
                className={`p-3 rounded-lg border text-left transition-all ${
                  !selectedCulturalPreset 
                    ? "border-brand-primary bg-brand-light/10 ring-1 ring-brand-primary" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="font-medium text-gray-900 text-sm">Default</p>
                <p className="text-xs text-gray-500 mt-0.5">Balanced communication style</p>
              </button>
              {culturalPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedCulturalPreset(preset.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedCulturalPreset === preset.id 
                      ? "border-brand-primary bg-brand-light/10 ring-1 ring-brand-primary" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium text-gray-900 text-sm">{preset.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500 font-medium">Filter Avatars:</span>
              </div>

              <Select
                value={filters.gender || "all"}
                onValueChange={(val) =>
                  setFilters({
                    ...filters,
                    gender: val === "all" ? undefined : val,
                  })
                }
              >
                <SelectTrigger className="w-36 bg-white">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>

              {filters.gender && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({})}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-red-500">Failed to load avatars. Please try again.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6">
                {shuffledAvatars.map((avatar) => (
                  <Card
                    key={avatar.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      isSelected(avatar.id)
                        ? "ring-2 ring-orange-500 shadow-md"
                        : selectedAvatars.length >= maxAvatars
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:ring-2 hover:ring-orange-200"
                    }`}
                    onClick={() => toggleAvatar(avatar)}
                  >
                    <CardContent className="p-0">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
                        <img
                          src={avatar.imageUrl}
                          alt={avatar.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${avatar.name}&background=4a5568&color=fff&size=200`;
                          }}
                        />
                        {isSelected(avatar.id) && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-gray-900 text-sm truncate">
                          {avatar.name}
                        </h3>
                        <p className="text-xs text-gray-500 capitalize">
                          {avatar.gender}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
            <div className="container mx-auto max-w-7xl flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedAvatars.length === 0 ? (
                  <span>Select at least {minAvatars} avatar to continue</span>
                ) : selectedAvatars.length < maxAvatars ? (
                  <span>
                    {selectedAvatars.length} of {maxAvatars} avatars selected
                    <span className="text-gray-400 ml-2">
                      (can select {maxAvatars - selectedAvatars.length} more)
                    </span>
                  </span>
                ) : (
                  <span className="text-orange-600 font-medium">
                    Maximum {maxAvatars} avatars selected
                  </span>
                )}
              </div>
              <Button
                onClick={handleStartSession}
                disabled={selectedAvatars.length < minAvatars || !allAvatarsHaveRoles}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Start Practice Session
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          <div className="h-20"></div>
        </div>
      </div>
      <MobileBottomNav />
    </ModernDashboardLayout>
  );
}
