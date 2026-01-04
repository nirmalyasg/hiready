import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Code, ChevronRight, Search, Clock, Target, Eye, Bug, Wrench, Check, X, AlertTriangle, Building2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SidebarLayout from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CodingExercise {
  id: number;
  roleKitId: number | null;
  name: string;
  activityType: "explain" | "debug" | "modify";
  language: string;
  difficulty: "easy" | "medium" | "hard";
  codeSnippet: string;
  expectedBehavior: string | null;
  bugDescription: string | null;
  modificationRequirement: string | null;
  tags: string[] | null;
}

interface RoleKit {
  id: number;
  name: string;
  level: string;
  domain: string;
}

interface PracticeContext {
  roundCategory: string;
  taxonomy: {
    label: string;
    description: string;
    typicalDuration: string;
  };
  companyContext: {
    jobTargetId: string;
    companyName: string | null;
    roleTitle: string | null;
    archetype: string | null;
    hasBlueprint: boolean;
    blueprintNotes: string | null;
  };
  promptHints: {
    avatarPersona: string;
    evaluationFocus: string[];
    sampleQuestions: string[];
    companySpecificGuidance: string | null;
  };
}

const activityTypeConfig = {
  explain: {
    label: "Explain Code",
    description: "Walk through existing code and explain how it works",
    icon: Eye,
    color: "bg-blue-100 text-blue-700 border-blue-200"
  },
  debug: {
    label: "Debug Code",
    description: "Find and fix bugs in broken code",
    icon: Bug,
    color: "bg-red-100 text-red-700 border-red-200"
  },
  modify: {
    label: "Modify Code",
    description: "Add features or make improvements to existing code",
    icon: Wrench,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200"
  }
};

const difficultyConfig = {
  easy: { label: "Easy", color: "bg-green-100 text-green-700" },
  medium: { label: "Medium", color: "bg-amber-100 text-amber-700" },
  hard: { label: "Hard", color: "bg-red-100 text-red-700" }
};

const languageColors: Record<string, string> = {
  python: "bg-blue-50 text-blue-700",
  typescript: "bg-blue-50 text-blue-700",
  javascript: "bg-yellow-50 text-yellow-700",
  java: "bg-orange-50 text-orange-700",
  go: "bg-cyan-50 text-cyan-700",
  rust: "bg-orange-50 text-orange-700"
};

export default function CodingLabPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedRoleKitId = searchParams.get("roleKitId");
  const jobTargetId = searchParams.get("jobTargetId");
  const roundCategory = searchParams.get("roundCategory");

  const [exercises, setExercises] = useState<CodingExercise[]>([]);
  const [roleKits, setRoleKits] = useState<RoleKit[]>([]);
  const [practiceContext, setPracticeContext] = useState<PracticeContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActivityType, setSelectedActivityType] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedRoleKitId, setSelectedRoleKitId] = useState<number | null>(
    preSelectedRoleKitId ? parseInt(preSelectedRoleKitId) : null
  );

  const isJobTargetMode = !!jobTargetId && !!roundCategory;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        if (isJobTargetMode) {
          const contextRes = await fetch(`/api/jobs/job-targets/${jobTargetId}/practice-context/${roundCategory}`);
          const contextData = await contextRes.json();
          if (contextData.success) {
            setPracticeContext(contextData);
          }
        }
        
        const [exercisesRes, roleKitsRes] = await Promise.all([
          fetch("/api/exercise-mode/coding-exercises"),
          fetch("/api/interview/role-kits")
        ]);
        
        const exercisesData = await exercisesRes.json();
        const roleKitsData = await roleKitsRes.json();
        
        if (exercisesData.success) {
          setExercises(exercisesData.exercises);
        }
        if (roleKitsData.success) {
          setRoleKits(roleKitsData.roleKits);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isJobTargetMode, jobTargetId, roundCategory]);

  const filteredExercises = exercises.filter(exercise => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        exercise.name.toLowerCase().includes(query) ||
        exercise.expectedBehavior?.toLowerCase().includes(query) ||
        exercise.tags?.some(tag => tag.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    
    if (selectedActivityType && exercise.activityType !== selectedActivityType) return false;
    if (selectedDifficulty && exercise.difficulty !== selectedDifficulty) return false;
    if (selectedLanguage && exercise.language !== selectedLanguage) return false;
    if (selectedRoleKitId && exercise.roleKitId !== selectedRoleKitId) return false;
    
    return true;
  });

  const languages = [...new Set(exercises.map(e => e.language))];

  const handleSelectExercise = (exercise: CodingExercise) => {
    navigate(`/exercise-mode/coding-lab/avatar-select?exerciseId=${exercise.id}`);
  };

  const clearFilters = () => {
    setSelectedActivityType(null);
    setSelectedDifficulty(null);
    setSelectedLanguage(null);
    setSelectedRoleKitId(null);
    setSearchQuery("");
  };

  const hasActiveFilters = selectedActivityType || selectedDifficulty || selectedLanguage || selectedRoleKitId || searchQuery;

  const backLink = isJobTargetMode ? `/jobs/${jobTargetId}` : "/exercise-mode";
  const backLabel = isJobTargetMode ? "← Back to Job" : "← Back to Exercise Mode";

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-8">
            <button 
              onClick={() => navigate(backLink)}
              className="text-sm text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1"
            >
              {backLabel}
            </button>
            <div className="flex items-center gap-3 mb-2">
              {isJobTargetMode ? (
                <Building2 className="w-8 h-8 text-blue-600" />
              ) : (
                <Code className="w-8 h-8 text-blue-600" />
              )}
              <h1 className="text-2xl font-bold text-slate-900">
                {isJobTargetMode && practiceContext?.companyContext.companyName
                  ? `${practiceContext.companyContext.companyName} Coding Assessment`
                  : "Coding Lab Mode"}
              </h1>
              {isJobTargetMode && practiceContext?.companyContext.hasBlueprint && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  Blueprint Available
                </span>
              )}
            </div>
            <p className="text-slate-600">
              {isJobTargetMode && practiceContext
                ? `Practice ${practiceContext.taxonomy.label} for ${practiceContext.companyContext.roleTitle || "this role"}.`
                : "Practice code-focused interview skills with AI interviewer feedback."}
            </p>
          </div>

          {isJobTargetMode && practiceContext?.promptHints.companySpecificGuidance && (
            <Card className="border-amber-200 bg-amber-50/50 rounded-2xl overflow-hidden mb-6">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900 mb-1">Company Insight</h4>
                    <p className="text-sm text-amber-800">{practiceContext.promptHints.companySpecificGuidance}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {Object.entries(activityTypeConfig).map(([type, config]) => {
              const Icon = config.icon;
              const isSelected = selectedActivityType === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedActivityType(isSelected ? null : type)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-5 h-5 ${isSelected ? "text-blue-600" : "text-slate-600"}`} />
                    <span className={`font-medium ${isSelected ? "text-blue-900" : "text-slate-900"}`}>
                      {config.label}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 ml-auto" />}
                  </div>
                  <p className="text-sm text-slate-500">{config.description}</p>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={selectedLanguage || ""}
                onChange={(e) => setSelectedLanguage(e.target.value || null)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="">All Languages</option>
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              
              <select
                value={selectedDifficulty || ""}
                onChange={(e) => setSelectedDifficulty(e.target.value || null)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No exercises found</h3>
              <p className="text-slate-500 mb-4">Try adjusting your filters or search query</p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredExercises.map(exercise => {
                const typeConfig = activityTypeConfig[exercise.activityType];
                const diffConfig = difficultyConfig[exercise.difficulty];
                const langColor = languageColors[exercise.language] || "bg-slate-100 text-slate-700";
                const roleKit = roleKits.find(r => r.id === exercise.roleKitId);
                const TypeIcon = typeConfig.icon;
                
                return (
                  <div
                    key={exercise.id}
                    className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleSelectExercise(exercise)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${typeConfig.color}`}>
                            <TypeIcon className="w-3 h-3 inline mr-1" />
                            {typeConfig.label}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${langColor}`}>
                            {exercise.language}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${diffConfig.color}`}>
                            {diffConfig.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{exercise.name}</h3>
                        <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                          {exercise.activityType === "debug" && exercise.bugDescription
                            ? exercise.bugDescription
                            : exercise.activityType === "modify" && exercise.modificationRequirement
                            ? exercise.modificationRequirement
                            : exercise.expectedBehavior}
                        </p>
                        {roleKit && (
                          <div className="text-xs text-slate-500">
                            Role: {roleKit.name}
                          </div>
                        )}
                        {exercise.tags && exercise.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {exercise.tags.slice(0, 4).map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 ml-4 flex-shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
