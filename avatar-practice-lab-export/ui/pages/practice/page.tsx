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
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-accent/10 rounded-full text-brand-accent text-sm font-medium mb-3">
                <Target className="w-4 h-4" />
                Practice Mode
              </div>
              <h1 className="text-3xl font-bold text-brand-dark" data-testid="text-page-title">
                {selectedSkill && currentSkill ? currentSkill.name : "Choose a Scenario"}
              </h1>
              <p className="text-brand-muted mt-2 max-w-xl" data-testid="text-page-subtitle">
                Select a real-world situation to practice with an AI conversation partner.
              </p>
            </div>

            {/* Search */}
            <div className="w-full lg:w-80">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                <Input
                  type="text"
                  placeholder="Search scenarios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 bg-white"
                  data-testid="input-search-scenarios"
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3" ref={filterRef}>
            <div className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 bg-white border rounded-xl text-sm font-medium shadow-sm transition-all ${
                  selectedSkill 
                    ? "border-brand-accent text-brand-accent" 
                    : "border-gray-200 text-brand-dark hover:border-gray-300"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="max-w-[150px] truncate">
                  {selectedSkill ? currentSkill?.name || "Filter" : "All Skills"}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
              </button>

              {filterOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                  <button
                    onClick={() => handleSkillFilter(null)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-gray-50 ${
                      !selectedSkill ? "bg-brand-accent/5 text-brand-accent font-medium" : "text-brand-dark"
                    }`}
                  >
                    All Skills
                    {!selectedSkill && <Check className="w-4 h-4 text-brand-accent" />}
                  </button>
                  {skills.map((skill) => (
                    <button
                      key={skill.id}
                      onClick={() => handleSkillFilter(skill.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-gray-50 border-t border-gray-100 ${
                        selectedSkill === skill.id ? "bg-brand-accent/5 text-brand-accent font-medium" : "text-brand-dark"
                      }`}
                    >
                      <span className="truncate pr-2">{skill.name}</span>
                      {selectedSkill === skill.id && <Check className="w-4 h-4 text-brand-accent flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedSkill && (
              <button
                onClick={() => handleSkillFilter(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-accent/10 text-brand-accent text-sm font-medium rounded-full hover:bg-brand-accent/20 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}

            <span className="text-sm text-brand-muted ml-auto">
              <span className="font-semibold text-brand-dark">{filteredScenarios.length}</span> scenarios
            </span>
          </div>

          {/* Scenarios Grid */}
          {filteredScenarios.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-brand-muted" />
              </div>
              <h3 className="text-xl font-bold text-brand-dark mb-2">No scenarios found</h3>
              <p className="text-brand-muted mb-6 max-w-md mx-auto">
                Try adjusting your search or filters.
              </p>
              <Button variant="outline" onClick={() => { handleSkillFilter(null); setSearchQuery(""); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredScenarios.map((scenario, index) => {
                const iconData = scenarioIcons[index % scenarioIcons.length];
                const IconComponent = iconData.icon;
                const difficultyConfig = getDifficultyConfig(scenario.difficulty);

                return (
                  <Link
                    key={scenario.id}
                    to={`/avatar/practice/pre-session?scenarioId=${scenario.id}`}
                    className="group"
                  >
                    <div className="h-full bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-brand-accent/30 transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 ${iconData.bg} rounded-xl flex items-center justify-center`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${difficultyConfig.color}`}>
                          {difficultyConfig.label}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-brand-dark mb-2 line-clamp-2 group-hover:text-brand-accent transition-colors">
                        {scenario.name}
                      </h3>

                      <p className="text-sm text-brand-muted line-clamp-2 mb-5">
                        {scenario.description || "Practice this scenario with an AI avatar."}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 text-xs text-brand-muted">
                          <Clock className="w-3.5 h-3.5" />
                          <span>5-10 min</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-accent group-hover:gap-2 transition-all">
                          Start
                          <ArrowRight className="w-4 h-4" />
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
