import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { ChevronRight, ChevronLeft, Target, Clock, Users, BookOpen, Sparkles, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Separator } from "@/components/ui/separator";
import { anonymizeScenarioText } from "@/lib/utils";

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty?.toUpperCase()) {
    case "BEGINNER":
      return "bg-green-100 text-green-700 border-green-200";
    case "INTERMEDIATE":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "ADVANCED":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getDifficultyDescription = (difficulty: string) => {
  switch (difficulty?.toUpperCase()) {
    case "BEGINNER":
      return "Great for those new to this type of conversation";
    case "INTERMEDIATE":
      return "Suitable for those with some experience";
    case "ADVANCED":
      return "Challenging scenario for experienced practitioners";
    default:
      return "Standard difficulty level";
  }
};

export default function ScenarioDetailsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scenarioId = searchParams.get("scenarioId");
  const [scenario, setScenario] = useState<any>(null);
  const [skill, setSkill] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchScenarioDetails = async () => {
      if (!scenarioId) {
        setError("No scenario selected");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/avatar/get-scenarios?scenarioId=${scenarioId}`);
        const data = await response.json();
        
        if (data.success && data.scenarios && data.scenarios.length > 0) {
          const scenarioData = data.scenarios[0];
          setScenario({
            id: scenarioData.id,
            skillId: scenarioData.skill_id || scenarioData.skillId,
            name: scenarioData.name,
            description: scenarioData.description || "",
            context: scenarioData.context || "",
            instructions: scenarioData.instructions || "",
            difficulty: scenarioData.difficulty || "STANDARD",
            avatarRole: scenarioData.avatar_role || scenarioData.avatarRole || "",
            estimatedTime: scenarioData.estimated_time || "5-10 minutes",
          });

          if (scenarioData.skill_id || scenarioData.skillId) {
            const skillsResponse = await fetch("/api/avatar/get-skills");
            const skillsData = await skillsResponse.json();
            if (skillsData.success && skillsData.skills) {
              const foundSkill = skillsData.skills.find(
                (s: any) => s.id === (scenarioData.skill_id || scenarioData.skillId)
              );
              if (foundSkill) {
                setSkill(foundSkill);
              }
            }
          }
        } else {
          setError("Scenario not found");
        }
      } catch (err) {
        console.error("Error fetching scenario:", err);
        setError("Failed to load scenario details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchScenarioDetails();
  }, [scenarioId]);

  const handleContinueToAvatarSelect = () => {
    navigate(`/avatar/practice/pre-session?scenarioId=${scenarioId}`);
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <LoadingSpinner />
            <p className="text-gray-500 mt-4">Loading scenario details...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error || !scenario) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-gray-50/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-4xl">
            <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
              <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {error || "Scenario not found"}
              </h3>
              <p className="text-gray-500 mb-6">
                Please go back and select a valid scenario to practice.
              </p>
              <Link to="/avatar/practice">
                <Button variant="outline" data-testid="button-back-to-scenarios">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Scenarios
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-4xl">
          <Link
            to="/avatar/practice"
            className="inline-flex items-center text-gray-500 hover:text-primary mb-6 text-sm font-medium transition-colors"
            data-testid="link-back-scenarios"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Scenarios
          </Link>

          <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-scenario-title">
                      {scenario.name}
                    </CardTitle>
                    {skill && (
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-medium">{skill.name}</span>
                      </div>
                    )}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`flex-shrink-0 text-sm px-3 py-1 ${getDifficultyColor(scenario.difficulty)}`}
                    data-testid="badge-difficulty"
                  >
                    {scenario.difficulty || "Standard"}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{scenario.estimatedTime}</span>
                  </div>
                  {scenario.avatarRole && (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>You'll practice with: {scenario.avatarRole}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-6 space-y-6">
              {scenario.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Description
                  </h3>
                  <p className="text-gray-600 leading-relaxed" data-testid="text-scenario-description">
                    {scenario.description}
                  </p>
                </div>
              )}

              {scenario.context && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Context
                  </h3>
                  <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg" data-testid="text-scenario-context">
                    {anonymizeScenarioText(scenario.context, scenario.avatarRole || "The other person")}
                  </p>
                </div>
              )}

              {scenario.instructions && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Instructions
                  </h3>
                  <p className="text-gray-600 leading-relaxed" data-testid="text-scenario-instructions">
                    {scenario.instructions}
                  </p>
                </div>
              )}

              <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Difficulty: {scenario.difficulty || "Standard"}
                </h3>
                <p className="text-sm text-gray-600">
                  {getDifficultyDescription(scenario.difficulty)}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              onClick={handleContinueToAvatarSelect}
              className="px-8 py-3 text-base font-semibold min-w-[280px] bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all"
              data-testid="button-continue-avatar-select"
            >
              Continue to Select Avatar
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <p className="text-center text-sm text-gray-400 mt-4 hidden sm:block">
            Next step: Choose an AI avatar to practice with
          </p>
        </div>
      </div>
    </SidebarLayout>
  );
}
