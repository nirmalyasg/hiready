import { useState, useEffect, useRef } from "react";
import { Search, ChevronRight, Sparkles, Target, Zap, MessageSquare, Users, Briefcase, Filter, Clock, Play, Flame, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useSearchParams } from "react-router-dom";
import SidebarLayout from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const scenarioIcons = [
  { icon: MessageSquare, color: "text-blue-600", bg: "bg-gradient-to-br from-blue-500 to-blue-600", glow: "shadow-blue-500/30" },
  { icon: Target, color: "text-purple-600", bg: "bg-gradient-to-br from-purple-500 to-purple-600", glow: "shadow-purple-500/30" },
  { icon: Zap, color: "text-amber-600", bg: "bg-gradient-to-br from-amber-500 to-amber-600", glow: "shadow-amber-500/30" },
  { icon: Users, color: "text-emerald-600", bg: "bg-gradient-to-br from-emerald-500 to-emerald-600", glow: "shadow-emerald-500/30" },
  { icon: Briefcase, color: "text-rose-600", bg: "bg-gradient-to-br from-rose-500 to-rose-600", glow: "shadow-rose-500/30" },
  { icon: Sparkles, color: "text-indigo-600", bg: "bg-gradient-to-br from-indigo-500 to-indigo-600", glow: "shadow-indigo-500/30" },
];

const getDifficultyConfig = (difficulty: string) => {
  switch (difficulty?.toUpperCase()) {
    case "BEGINNER":
      return { label: "Beginner", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    case "INTERMEDIATE":
      return { label: "Intermediate", color: "bg-amber-100 text-amber-700 border-amber-200" };
    case "ADVANCED":
      return { label: "Advanced", color: "bg-red-100 text-red-700 border-red-200" };
    default:
      return { label: "Standard", color: "bg-slate-100 text-slate-600 border-slate-200" };
  }
};

export default function PracticePage() {
  const [skills, setSkills] = useState<Record<string, any>[]>([]);
  const [scenarios, setScenarios] = useState<Record<string, any>[]>([]);
  const [filteredScenarios, setFilteredScenarios] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
          fetch(`/api/avatar/get-scenarios?${params.toString() || ""}`, { signal: controller.signal }),
          fetch("/api/avatar/get-skills", { signal: controller.signal }),
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
    return () => { mounted = false; };
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
    <SidebarLayout>
      {isLoading ? (
        <div className="flex justify-center items-center h-[60vh]">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="min-h-screen bg-[#fbfbfc]">
          <div className="bg-gradient-to-br from-[#000000] via-[#000000] to-[#000000] text-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-[#24c4b8] rounded-lg flex items-center justify-center">
                      <Flame className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[#24c4b8] text-sm font-semibold uppercase tracking-wide">Practice Lab</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-page-title">
                    {selectedSkill && currentSkill ? currentSkill.name : "Practice Scenarios"}
                  </h1>
                  <p className="text-white/70 mt-2 text-sm sm:text-base" data-testid="text-page-subtitle">
                    Build confidence through AI-powered conversation practice
                  </p>
                </div>
                <div className="flex items-center gap-6 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{scenarios.length}</p>
                    <p className="text-white/60 text-xs">Scenarios</p>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#24c4b8]">{skills.length}</p>
                    <p className="text-white/60 text-xs">Skills</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-4 sm:p-6 border border-slate-100">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#cb6ce6]" />
                  <Input
                    type="text"
                    placeholder="Search scenarios..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-[#fbfbfc] rounded-xl border-slate-200 focus:border-[#24c4b8] focus:ring-[#24c4b8]/20 text-[#000000]"
                    data-testid="input-search-scenarios"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide" ref={filterRef}>
                <button
                  onClick={() => handleSkillFilter(null)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    !selectedSkill 
                      ? "bg-[#000000] text-white shadow-lg shadow-[#000000]/25" 
                      : "bg-slate-100 text-gray-500 hover:bg-slate-200"
                  }`}
                >
                  All Scenarios
                </button>
                {skills.map((skill) => (
                  <button
                    key={skill.id}
                    onClick={() => handleSkillFilter(skill.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                      selectedSkill === skill.id 
                        ? "bg-[#24c4b8] text-white shadow-lg shadow-[#24c4b8]/25" 
                        : "bg-slate-100 text-gray-500 hover:bg-slate-200"
                    }`}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-500 font-medium">
                {filteredScenarios.length} scenario{filteredScenarios.length !== 1 ? 's' : ''} available
              </p>
            </div>

            {filteredScenarios.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-[#cb6ce6]" />
                </div>
                <h3 className="text-xl font-bold text-[#000000] mb-2">No scenarios found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your search or filters.</p>
                <Button 
                  onClick={() => { handleSkillFilter(null); setSearchQuery(""); }}
                  className="bg-[#24c4b8] hover:bg-[#1db0a5] text-white rounded-xl px-6"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
                      <div className="h-full bg-white rounded-2xl border border-slate-200 p-5 hover:border-[#24c4b8]/40 hover:shadow-xl hover:shadow-[#24c4b8]/10 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-transparent rounded-bl-full opacity-50" />
                        
                        <div className="relative">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 ${iconData.bg} rounded-xl flex items-center justify-center shadow-lg ${iconData.glow}`}>
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${difficultyConfig.color}`}>
                              {difficultyConfig.label}
                            </span>
                          </div>

                          <h3 className="font-bold text-[#000000] text-base mb-2 line-clamp-2 group-hover:text-[#24c4b8] transition-colors">
                            {scenario.name}
                          </h3>

                          <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                            {scenario.description || "Practice this scenario with an AI avatar."}
                          </p>

                          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 text-[#cb6ce6]">
                              <Clock className="w-4 h-4" />
                              <span className="text-xs font-medium">5-10 min</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[#24c4b8] font-semibold text-sm group-hover:gap-2.5 transition-all">
                              <Play className="w-4 h-4" />
                              <span>Start</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
