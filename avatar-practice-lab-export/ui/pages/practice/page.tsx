import { useState, useEffect, useRef } from "react";
import { Search, ChevronRight, Sparkles, Target, Zap, MessageSquare, Users, Briefcase, Filter, Check, ChevronDown, Clock, ArrowRight, Play, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ModernDashboardLayout from "@/components/layout/modern-dashboard-layout";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const scenarioIcons = [
  { icon: MessageSquare, color: "text-teal-600", bg: "bg-gradient-to-br from-teal-50 to-teal-100", ring: "ring-teal-200" },
  { icon: Target, color: "text-purple-600", bg: "bg-gradient-to-br from-purple-50 to-purple-100", ring: "ring-purple-200" },
  { icon: Zap, color: "text-amber-600", bg: "bg-gradient-to-br from-amber-50 to-amber-100", ring: "ring-amber-200" },
  { icon: Users, color: "text-emerald-600", bg: "bg-gradient-to-br from-emerald-50 to-emerald-100", ring: "ring-emerald-200" },
  { icon: Briefcase, color: "text-rose-600", bg: "bg-gradient-to-br from-rose-50 to-rose-100", ring: "ring-rose-200" },
  { icon: Sparkles, color: "text-blue-600", bg: "bg-gradient-to-br from-blue-50 to-blue-100", ring: "ring-blue-200" },
];

const getDifficultyConfig = (difficulty: string) => {
  switch (difficulty?.toUpperCase()) {
    case "BEGINNER":
      return { 
        label: "Beginner", 
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500"
      };
    case "INTERMEDIATE":
      return { 
        label: "Intermediate", 
        color: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500"
      };
    case "ADVANCED":
      return { 
        label: "Advanced", 
        color: "bg-rose-50 text-rose-700 border-rose-200",
        dot: "bg-rose-500"
      };
    default:
      return { 
        label: "Standard", 
        color: "bg-slate-50 text-slate-600 border-slate-200",
        dot: "bg-slate-400"
      };
  }
};

const skillIcons: Record<string, typeof MessageSquare> = {
  "Assertive Communication": MessageSquare,
  "Boundary Negotiation": Target,
  "Conflict Resolution": Zap,
  "Difficult Conversations": Users,
  "Emotional Intelligence": Sparkles,
  "Feedback Delivery": MessageSquare,
  "Leadership Communication": Briefcase,
  "Negotiation Skills": Target,
  "Public Speaking": MessageSquare,
  "Team Collaboration": Users,
};

export default function PracticePage() {
  const [skills, setSkills] = useState<Record<string, any>[]>([]);
  const [scenarios, setScenarios] = useState<Record<string, any>[]>([]);
  const [filteredScenarios, setFilteredScenarios] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const skillFilter = searchParams.get("skill");
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    let controller = new AbortController();

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        selectedSkill && params.append("skillId", selectedSkill.toString());
        
        const [scenariosResponse, skillsResponse] = await Promise.all([
          fetch(`/api/avatar/get-scenarios?${params.toString() || ""}`, {
            signal: controller.signal,
          }),
          fetch("/api/avatar/get-skills", {
            signal: controller.signal,
          }),
        ]);

        const [scenariosData, skillsData] = await Promise.all([
          scenariosResponse.json(),
          skillsResponse.json(),
        ]);

        if (!mounted) return;

        if (scenariosData.success) {
          const normalizedScenarios = scenariosData.scenarios.map((s: any) => ({
            id: s.id,
            skillId: s.skill_id || s.skillId,
            name: s.name,
            description: s.description || "",
            context: s.context || "",
            instructions: s.instructions || "",
            difficulty: s.difficulty || "STANDARD",
            knowledgeId: s.knowledge_id || s.knowledgeId || "",
            image: s.image || "/demo.png",
          }));
          setScenarios(normalizedScenarios);
          setFilteredScenarios(normalizedScenarios);
        }

        if (skillsData.success && skillsData.skills) {
          setSkills(skillsData.skills);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [selectedSkill]);

  useEffect(() => {
    if (skillFilter && skillFilter !== selectedSkill) {
      setSelectedSkill(skillFilter);
    }
  }, [skillFilter]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = scenarios.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredScenarios(filtered);
    } else {
      setFilteredScenarios(scenarios);
    }
  }, [searchQuery, scenarios]);

  const currentSkill = skills.find((skill) => skill.id === selectedSkill);

  const handleSkillFilter = (skillId: string | null) => {
    setSelectedSkill(skillId);
    if (skillId) {
      window.history.pushState({}, "", `/avatar/practice?skill=${skillId}`);
    } else {
      window.history.pushState({}, "", `/avatar/practice`);
    }
  };

  return (
    <ModernDashboardLayout>
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white pb-24 sm:pb-8">
          {/* Hero Header */}
          <div className="bg-gradient-to-br from-brand-primary/5 via-white to-teal-50/30 border-b border-slate-100">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl">
              <Link
                to="/avatar/start"
                className="inline-flex items-center text-slate-500 hover:text-brand-primary mb-4 text-sm font-medium transition-colors group"
                data-testid="link-back-dashboard"
              >
                <ChevronRight className="w-4 h-4 rotate-180 mr-1 group-hover:-translate-x-0.5 transition-transform" />
                Back to Dashboard
              </Link>
              
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 sm:gap-6">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                      <Play className="w-4 h-4 text-brand-primary" />
                    </div>
                    <span className="text-xs font-semibold text-brand-primary uppercase tracking-wide">Practice Mode</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2" data-testid="text-page-title">
                    {selectedSkill && currentSkill
                      ? currentSkill.name
                      : "Choose Your Scenario"}
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed" data-testid="text-page-subtitle">
                    Select a real-world situation to practice. Each scenario includes an AI conversation partner who will respond naturally to help you build confidence.
                  </p>
                </div>

                {/* Search Bar */}
                <div className="w-full lg:w-80">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search scenarios..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-11 bg-white border-slate-200 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 text-sm rounded-xl"
                      data-testid="input-search-scenarios"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl">
            {/* Filter Bar - Compact dropdown for both mobile and desktop */}
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" ref={filterRef}>
              <div className="flex items-center gap-3">
                {/* Skill Filter Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 bg-white border rounded-xl text-sm font-medium shadow-sm transition-all ${
                      selectedSkill 
                        ? "border-brand-primary/50 text-brand-primary" 
                        : "border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    <span className="max-w-[200px] truncate">
                      {selectedSkill ? currentSkill?.name || "Filter" : "All Skills"}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileFilterOpen ? "rotate-180" : ""}`} />
                  </button>
                  
                  {mobileFilterOpen && (
                    <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                      <button
                        onClick={() => { handleSkillFilter(null); setMobileFilterOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left border-b border-slate-100 hover:bg-slate-50 ${
                          !selectedSkill ? "bg-brand-primary/5 text-brand-primary font-medium" : "text-slate-700"
                        }`}
                      >
                        All Skills
                        {!selectedSkill && <Check className="w-4 h-4 text-brand-primary" />}
                      </button>
                      {skills.map((skill) => (
                        <button
                          key={skill.id}
                          onClick={() => { handleSkillFilter(skill.id); setMobileFilterOpen(false); }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left border-b border-slate-100 last:border-b-0 hover:bg-slate-50 ${
                            selectedSkill === skill.id ? "bg-brand-primary/5 text-brand-primary font-medium" : "text-slate-700"
                          }`}
                        >
                          <span className="truncate pr-2">{skill.name}</span>
                          {selectedSkill === skill.id && <Check className="w-4 h-4 text-brand-primary flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active filter badge */}
                {selectedSkill && (
                  <button
                    onClick={() => handleSkillFilter(null)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary text-xs font-medium rounded-full hover:bg-brand-primary/20 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Clear filter
                  </button>
                )}
              </div>

              {/* Results count */}
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-700">{filteredScenarios.length}</span> scenario{filteredScenarios.length !== 1 ? "s" : ""} available
              </p>
            </div>

            {/* Clear search indicator (only shown when searching) */}
            {searchQuery && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm text-slate-500">
                  Searching for "<span className="font-medium text-slate-700">{searchQuery}</span>"
                </span>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-sm text-brand-primary hover:text-brand-primary/80 font-medium"
                >
                  Clear search
                </button>
              </div>
            )}

            {/* Scenarios Grid */}
            {filteredScenarios.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No scenarios found
                </h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto text-sm">
                  {searchQuery
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "Try selecting a different category or check back later for new scenarios."}
                </p>
                {(selectedSkill || searchQuery) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleSkillFilter(null);
                      setSearchQuery("");
                    }}
                    className="rounded-xl"
                    data-testid="button-clear-filters"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredScenarios.map((scenario, index) => {
                  const iconData = scenarioIcons[index % scenarioIcons.length];
                  const IconComponent = iconData.icon;
                  const difficultyConfig = getDifficultyConfig(scenario.difficulty);

                  return (
                    <Link
                      key={scenario.id}
                      to={`/avatar/practice/pre-session?scenarioId=${scenario.id}`}
                      className="block group"
                    >
                      <Card
                        className="h-full bg-white border border-slate-200 hover:border-brand-primary/40 hover:shadow-xl hover:shadow-brand-primary/5 transition-all duration-300 overflow-hidden rounded-2xl"
                        data-testid={`card-scenario-${scenario.id}`}
                      >
                        <CardContent className="p-0 h-full flex flex-col">
                          {/* Card Header with Icon */}
                          <div className={`${iconData.bg} p-4 sm:p-5 relative overflow-hidden`}>
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                            
                            <div className="relative flex items-start justify-between">
                              <div className={`w-12 h-12 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm ring-1 ${iconData.ring}`}>
                                <IconComponent className={`w-6 h-6 ${iconData.color}`} />
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`${difficultyConfig.color} border text-xs font-medium px-2.5 py-0.5`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${difficultyConfig.dot} mr-1.5`} />
                                {difficultyConfig.label}
                              </Badge>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="p-4 sm:p-5 flex-1 flex flex-col">
                            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-brand-primary transition-colors">
                              {scenario.name}
                            </h3>

                            <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                              {scenario.description || "Practice this scenario with an AI-powered avatar to improve your communication skills."}
                            </p>

                            {/* Card Footer */}
                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <Clock className="w-3.5 h-3.5" />
                                <span>5-10 min</span>
                              </div>
                              <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary group-hover:gap-2 transition-all">
                                Start Practice
                                <ArrowRight className="w-4 h-4" />
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      <MobileBottomNav />
    </ModernDashboardLayout>
  );
}
