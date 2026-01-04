import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Briefcase, ChevronRight, Search, Filter, Clock, Target, Building2, Brain, AlertTriangle, Check, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SidebarLayout from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CaseTemplate {
  id: number;
  roleKitId: number | null;
  name: string;
  caseType: "business_diagnosis" | "execution_planning" | "stakeholder";
  difficulty: "easy" | "medium" | "hard";
  promptStatement: string;
  context: string | null;
  evaluationFocus: string[] | null;
  expectedDurationMinutes: number | null;
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

const caseTypeConfig = {
  business_diagnosis: {
    label: "Business Diagnosis",
    description: "Analyze root causes and identify problems",
    icon: Search,
    color: "bg-blue-100 text-blue-700 border-blue-200"
  },
  execution_planning: {
    label: "Execution Planning",
    description: "Create actionable implementation plans",
    icon: Target,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200"
  },
  stakeholder: {
    label: "Stakeholder Case",
    description: "Navigate influence and alignment scenarios",
    icon: Building2,
    color: "bg-purple-100 text-purple-700 border-purple-200"
  }
};

const difficultyConfig = {
  easy: { label: "Easy", color: "bg-green-100 text-green-700" },
  medium: { label: "Medium", color: "bg-amber-100 text-amber-700" },
  hard: { label: "Hard", color: "bg-red-100 text-red-700" }
};

export default function CaseStudyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedRoleKitId = searchParams.get("roleKitId");
  const jobTargetId = searchParams.get("jobTargetId");
  const roundCategory = searchParams.get("roundCategory");

  const [templates, setTemplates] = useState<CaseTemplate[]>([]);
  const [roleKits, setRoleKits] = useState<RoleKit[]>([]);
  const [practiceContext, setPracticeContext] = useState<PracticeContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCaseType, setSelectedCaseType] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedRoleKitId, setSelectedRoleKitId] = useState<number | null>(
    preSelectedRoleKitId ? parseInt(preSelectedRoleKitId) : null
  );
  const [filterOpen, setFilterOpen] = useState(false);

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
        
        const [templatesRes, roleKitsRes] = await Promise.all([
          fetch("/api/exercise-mode/case-templates"),
          fetch("/api/interview/role-kits")
        ]);
        
        const templatesData = await templatesRes.json();
        const roleKitsData = await roleKitsRes.json();
        
        if (templatesData.success) {
          setTemplates(templatesData.templates);
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

  const filteredTemplates = templates.filter(template => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        template.name.toLowerCase().includes(query) ||
        template.promptStatement.toLowerCase().includes(query) ||
        template.tags?.some(tag => tag.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    
    if (selectedCaseType && template.caseType !== selectedCaseType) return false;
    if (selectedDifficulty && template.difficulty !== selectedDifficulty) return false;
    if (selectedRoleKitId && template.roleKitId !== selectedRoleKitId) return false;
    
    return true;
  });

  const handleSelectTemplate = (template: CaseTemplate) => {
    navigate(`/exercise-mode/case-study/avatar-select?templateId=${template.id}`);
  };

  const clearFilters = () => {
    setSelectedCaseType(null);
    setSelectedDifficulty(null);
    setSelectedRoleKitId(null);
    setSearchQuery("");
  };

  const hasActiveFilters = selectedCaseType || selectedDifficulty || selectedRoleKitId || searchQuery;
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
                <Building2 className="w-8 h-8 text-emerald-600" />
              ) : (
                <Briefcase className="w-8 h-8 text-emerald-600" />
              )}
              <h1 className="text-2xl font-bold text-slate-900">
                {isJobTargetMode && practiceContext?.companyContext.companyName
                  ? `${practiceContext.companyContext.companyName} Case Study`
                  : "Case Study Mode"}
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
                : "Select a case to practice structured problem-solving with AI interviewer feedback."}
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
            {Object.entries(caseTypeConfig).map(([type, config]) => {
              const Icon = config.icon;
              const isSelected = selectedCaseType === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedCaseType(isSelected ? null : type)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected 
                      ? "border-emerald-500 bg-emerald-50" 
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-5 h-5 ${isSelected ? "text-emerald-600" : "text-slate-600"}`} />
                    <span className={`font-medium ${isSelected ? "text-emerald-900" : "text-slate-900"}`}>
                      {config.label}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 ml-auto" />}
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
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
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
              
              <select
                value={selectedRoleKitId?.toString() || ""}
                onChange={(e) => setSelectedRoleKitId(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="">All Roles</option>
                {roleKits.map(kit => (
                  <option key={kit.id} value={kit.id}>{kit.name}</option>
                ))}
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
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No cases found</h3>
              <p className="text-slate-500 mb-4">Try adjusting your filters or search query</p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTemplates.map(template => {
                const typeConfig = caseTypeConfig[template.caseType];
                const diffConfig = difficultyConfig[template.difficulty];
                const roleKit = roleKits.find(r => r.id === template.roleKitId);
                
                return (
                  <div
                    key={template.id}
                    className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${typeConfig.color}`}>
                            {typeConfig.label}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${diffConfig.color}`}>
                            {diffConfig.label}
                          </span>
                          {template.expectedDurationMinutes && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              {template.expectedDurationMinutes} min
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{template.name}</h3>
                        <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                          {template.promptStatement}
                        </p>
                        {roleKit && (
                          <div className="text-xs text-slate-500">
                            Role: {roleKit.name}
                          </div>
                        )}
                        {template.tags && template.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.tags.slice(0, 4).map(tag => (
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
