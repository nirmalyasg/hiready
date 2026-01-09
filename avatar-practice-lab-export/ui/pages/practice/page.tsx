import { useState, useEffect, useRef } from "react";
import { Search, ChevronRight, Sparkles, Target, Zap, MessageSquare, Users, Briefcase, Filter, Check, ChevronDown, Clock, ArrowRight, Play, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import SidebarLayout from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const scenarioIcons = [
  { icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-500" },
  { icon: Target, color: "text-purple-600", bg: "bg-purple-500" },
  { icon: Zap, color: "text-amber-600", bg: "bg-amber-500" },
  { icon: Users, color: "text-emerald-600", bg: "bg-emerald-500" },
  { icon: Briefcase, color: "text-rose-600", bg: "bg-rose-500" },
  { icon: Sparkles, color: "text-indigo-600", bg: "bg-indigo-500" },
];

const getDifficultyConfig = (difficulty: string) => {
  switch (difficulty?.toUpperCase()) {
    case "BEGINNER":
      return { label: "Beginner", color: "bg-green-100 text-green-700" };
    case "INTERMEDIATE":
      return { label: "Intermediate", color: "bg-amber-100 text-amber-700" };
    case "ADVANCED":
      return { label: "Advanced", color: "bg-red-100 text-red-700" };
    default:
      return { label: "Standard", color: "bg-gray-100 text-gray-600" };
  }
};

export default function PracticePage() {
  const [skills, setSkills] = useState<Record<string, any>[]>([]);
  const [scenarios, setScenarios] = useState<Record<string, any>[]>([]);
  const [filteredScenarios, setFilteredScenarios] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
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
    setFilterOpen(false);
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Header - Compact on Mobile */}
          <div className="space-y-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900" data-testid="text-page-title">
                {selectedSkill && currentSkill ? currentSkill.name : "Practice Scenarios"}
              </h1>
              <p className="text-slate-500 text-sm mt-1 hidden sm:block" data-testid="text-page-subtitle">
                Select a scenario to practice with an AI conversation partner.
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-white rounded-xl"
                data-testid="input-search-scenarios"
              />
            </div>
          </div>

          {/* Filter Chips - Horizontal Scroll on Mobile */}
          <div className="-mx-4 sm:mx-0">
            <div className="flex items-center gap-2 px-4 sm:px-0 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide" ref={filterRef}>
              <button
                onClick={() => handleSkillFilter(null)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !selectedSkill 
                    ? "bg-slate-900 text-white" 
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                All
              </button>
              {skills.map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => handleSkillFilter(skill.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedSkill === skill.id 
                      ? "bg-slate-900 text-white" 
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {skill.name}
                </button>
              ))}
              <span className="flex-shrink-0 text-xs text-slate-400 pl-2">
                {filteredScenarios.length} scenarios
              </span>
            </div>
          </div>

          {/* Scenarios Grid */}
          {filteredScenarios.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No scenarios found</h3>
              <p className="text-slate-500 text-sm mb-4">Try adjusting your search or filters.</p>
              <Button variant="outline" size="sm" onClick={() => { handleSkillFilter(null); setSearchQuery(""); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
              {filteredScenarios.map((scenario, index) => {
                const iconData = scenarioIcons[index % scenarioIcons.length];
                const IconComponent = iconData.icon;
                const difficultyConfig = getDifficultyConfig(scenario.difficulty);

                return (
                  <Link
                    key={scenario.id}
                    to={`/avatar/practice/pre-session?scenarioId=${scenario.id}`}
                    className="block"
                  >
                    {/* Mobile: Horizontal Card */}
                    <div className="sm:hidden bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3 hover:border-slate-300 transition-colors">
                      <div className={`w-10 h-10 ${iconData.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 text-sm truncate">
                          {scenario.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{difficultyConfig.label}</span>
                          <span>•</span>
                          <span>5-10 min</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </div>

                    {/* Desktop: Vertical Card */}
                    <div className="hidden sm:block h-full bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-md transition-all group">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 ${iconData.bg} rounded-lg flex items-center justify-center`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyConfig.color}`}>
                          {difficultyConfig.label}
                        </span>
                      </div>

                      <h3 className="font-semibold text-slate-900 text-sm mb-1.5 line-clamp-2 group-hover:text-slate-700 transition-colors">
                        {scenario.name}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                        {scenario.description || "Practice this scenario with an AI avatar."}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>5-10 min</span>
                        </div>
                        <span className="text-xs font-medium text-slate-700 group-hover:underline">
                          Start →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </SidebarLayout>
  );
}
