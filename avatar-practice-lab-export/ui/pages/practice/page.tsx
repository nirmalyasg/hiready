import { useState, useEffect } from "react";
import { Search, MessageSquare, Clock, ArrowRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link, useSearchParams } from "react-router-dom";
import SidebarLayout from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const getDifficultyConfig = (difficulty: string) => {
  switch (difficulty?.toUpperCase()) {
    case "BEGINNER":
      return { label: "Beginner", color: "bg-emerald-100 text-emerald-700" };
    case "INTERMEDIATE":
      return { label: "Intermediate", color: "bg-amber-100 text-amber-700" };
    case "ADVANCED":
      return { label: "Advanced", color: "bg-red-100 text-red-700" };
    default:
      return { label: "Standard", color: "bg-slate-100 text-slate-600" };
  }
};

export default function PracticePage() {
  const [skills, setSkills] = useState<Record<string, any>[]>([]);
  const [scenarios, setScenarios] = useState<Record<string, any>[]>([]);
  const [filteredScenarios, setFilteredScenarios] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams] = useSearchParams();
  const skillFilter = searchParams.get("skill");

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (selectedSkill) params.append("skillId", selectedSkill.toString());

        const [scenariosResponse, skillsResponse] = await Promise.all([
          fetch(`/api/avatar/get-scenarios?${params.toString() || ""}`),
          fetch("/api/avatar/get-skills"),
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
            difficulty: s.difficulty || "STANDARD",
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
      const query = searchQuery.toLowerCase();
      const filtered = scenarios.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query)
      );
      setFilteredScenarios(filtered);
    } else {
      setFilteredScenarios(scenarios);
    }
  }, [searchQuery, scenarios]);

  const handleSkillFilter = (skillId: string | null) => {
    setSelectedSkill(skillId);
    if (skillId) {
      window.history.pushState({}, "", `/avatar/practice?skill=${skillId}`);
    } else {
      window.history.pushState({}, "", `/avatar/practice`);
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <LoadingSpinner />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#fbfbfc]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          
          {/* Simple Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Practice Scenarios</h1>
            <p className="text-slate-500 text-sm">
              Choose a scenario to practice with an AI conversation partner
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search scenarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white rounded-xl border-slate-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Skill Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            <button
              onClick={() => handleSkillFilter(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                !selectedSkill
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
              }`}
            >
              All
            </button>
            {skills.map((skill) => (
              <button
                key={skill.id}
                onClick={() => handleSkillFilter(skill.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedSkill === skill.id
                    ? "bg-[#24c4b8] text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
                }`}
              >
                {skill.name}
              </button>
            ))}
          </div>

          {/* Results count */}
          <p className="text-sm text-slate-400 mb-4">
            {filteredScenarios.length} scenario{filteredScenarios.length !== 1 ? "s" : ""}
          </p>

          {/* Scenario List */}
          {filteredScenarios.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-700 mb-1">No scenarios found</h3>
              <p className="text-sm text-slate-500 mb-4">Try a different search or filter</p>
              <button
                onClick={() => { handleSkillFilter(null); setSearchQuery(""); }}
                className="text-sm text-[#24c4b8] font-medium hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredScenarios.map((scenario) => {
                const difficultyConfig = getDifficultyConfig(scenario.difficulty);

                return (
                  <Link
                    key={scenario.id}
                    to={`/avatar/practice/pre-session?scenarioId=${scenario.id}`}
                    className="block group"
                  >
                    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-[#24c4b8] hover:shadow-md transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-[#24c4b8]/10 transition-colors">
                          <MessageSquare className="w-5 h-5 text-slate-500 group-hover:text-[#24c4b8]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 group-hover:text-[#24c4b8] transition-colors truncate">
                              {scenario.name}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyConfig.color} flex-shrink-0`}>
                              {difficultyConfig.label}
                            </span>
                          </div>
                          {scenario.description && (
                            <p className="text-sm text-slate-500 line-clamp-1">
                              {scenario.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <span className="text-xs text-slate-400 flex items-center gap-1 hidden sm:flex">
                            <Clock className="w-3 h-3" />
                            5-10 min
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#24c4b8] transition-colors" />
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
    </SidebarLayout>
  );
}
