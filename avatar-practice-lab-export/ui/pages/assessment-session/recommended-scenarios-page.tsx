import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate, useSearchParams, useParams } from "react-router-dom";
import ModernDashboardLayout from "@/components/layout/modern-dashboard-layout";
import { useQuery } from "@tanstack/react-query";
import img from "/images/scenarios/default-scenario.png";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Updated image fetching logic using direct naming
const getScenarioImage = (scenarioName: string): string => {
  const imageMap: { [key: string]: string } = {
    "Addressing Team Concerns":
      "/images/scenarios/addressing-team-concerns.png",
    "Addressing a Denied Salary or Promotion Request":
      "/images/scenarios/addressing-denied-salary.png",
    "Addressing a Peer Who Frequently Misses Team Deadlines":
      "/images/scenarios/missing-team-deadlines.png",
    "Asking for Support or Backup During a Busy Period":
      "/images/scenarios/teammate-collaboration.png",
    "Collaborating on a Cross-Functional Project with Tight Deadlines":
      "/images/scenarios/cross-functional-project.png",
    "Asking for Accommodations":
      "/images/scenarios/workplace-accommodations.png",
    "Clarifying Leave Policies or Compensation Structures":
      "/images/scenarios/leave-policies.png",
    "Clarifying Miscommunication in a One-on-One Meeting":
      "/images/scenarios/one-on-one-meeting.png",
    "Asking for Support During a Busy Period":
      "/images/scenarios/workplace-support.png",
  };

  return imageMap[scenarioName] || "/images/scenarios/default-scenario.png";
};

export default function RecommendedScenariosPage() {
  const [skills, setSkills] = useState<Record<string, any>[]>([]);
  const [scenarios, setScenarios] = useState<Record<string, any>[]>([]);
  const [filteredScenarios, setFilteredScenarios] = useState<
    Record<string, any>[]
  >([]);
  const params = useParams()
  const assignmentId = params.id ? parseInt(params.id) : NaN;
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const skillFilter = searchParams.get("skill");
  const [selectedRole, setSelectedRole] = useState("");
  
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/avatar/avatar-roles"],
    queryFn: async () => {
      const res = await fetch("/api/avatar/avatar-roles");
      if (!res.ok) throw new Error("Failed to fetch roles");
      const json = await res.json();
      return json?.data as string[];
    },
  });

   useEffect(() => {
    let mounted = true;
    let controller = new AbortController();

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        selectedSkill && params.append("skillId", selectedSkill.toString());
        selectedRole && params.append("role", selectedRole.toString());

        const [scenariosResponse, skillsResponse] = await Promise.all([
          fetch(`/api/avatar/recommended-scenarios?assignmentId=${assignmentId}`, {
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
          const normalizedScenarios = scenariosData.data.map((s) => ({
            id: s.id,
            skillId: s.skill_id || s.skillId,
            name: s.name,
            description: s.description || "",
            context: s.context || "",
            instructions: s.instructions || "",
            difficulty: s.difficulty || "STANDARD",
            knowledgeId: s.knowledge_id || s.knowledgeId || "",
            image: s.image || "/demo.png",
            avatarRole: s.avatar_role || s.avatarRole || "",
            avatarName: s.avatar_name || s.avatarName || "",
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

  // Initialize selected skill from URL parameter
  useEffect(() => {
    if (skillFilter && skillFilter !== selectedSkill) {
      setSelectedSkill(skillFilter);
    }
  }, [skillFilter]);

  const currentSkill = skills.find((skill) => skill.id === selectedSkill);

  const handleSkillFilter = (skillId: string | null) => {
    setSelectedSkill(skillId);
    if (skillId) {
      window.history.pushState({}, "", `/avatar/practice?skill=${skillId}`);
    } else {
      window.history.pushState({}, "", `/avatar/practice`);
    }
  };
  useEffect(() =>{
    console.log({selectedRole,scenarios})
    if (selectedRole){
      const filtered = scenarios.filter((scenario) => scenario.avatarRole === selectedRole);
        setFilteredScenarios(filtered);
    }else{
      setFilteredScenarios(scenarios);
    }
  },[selectedRole])
  return (
    <ModernDashboardLayout>
      {isLoading || rolesLoading ? (
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="min-h-screen bg-white">
          <div className="container mx-auto px-6 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
              <Link
                to="/avatar/dashboard"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 font-medium transition-colors"
              >
                ← Back to Dashboard
              </Link>
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {selectedSkill && currentSkill
                    ? `${currentSkill.name} Practice`
                    : "AI Practice Scenarios"}
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  {selectedSkill && currentSkill
                    ? `Master your ${currentSkill.name.toLowerCase()} skills with interactive AI scenarios`
                    : "Choose a skill category and practice with AI-powered scenarios"}
                </p>
              </div>
            </div>

            {/* Filters: Skills + Roles */}
            <div className="mb-10 flex flex-col gap-6 justify-center items-center">
              {/* Skills Filter */}
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => handleSkillFilter(null)}
                  className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                    !selectedSkill
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All Categories
                </button>
                {skills.map((skill) => (
                  <button
                    key={skill.id}
                    onClick={() => handleSkillFilter(skill.id)}
                    className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedSkill === skill.id
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {skill.icon && <span className="mr-2">{skill.icon}</span>}
                    {skill.name}
                    {skill.scenario_count > 0 && (
                      <span className="ml-2 px-2 py-1 bg-black/10 rounded-full text-xs">
                        {skill.scenario_count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Role Select */}
              <div className="flex flex-col">
<label className="text-sm font-semibold text-gray-700 mb-1 ">Select Role</label><Select
                value={selectedRole}
                onValueChange={(v) => {
                  if (v === "all") {
                    setSelectedRole(undefined);
                  } else {
                    setSelectedRole(v);
                  }
                }}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </div>
            {/* Scenarios Section */}
            <div>
              {filteredScenarios.length > 0 && (
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    {selectedSkill && currentSkill
                      ? `${currentSkill.name} Scenarios`
                      : "Available Scenarios"}
                  </h2>
                  <p className="text-gray-500">
                    {filteredScenarios.length} scenario
                    {filteredScenarios.length !== 1 ? "s" : ""} ready for
                    practice
                  </p>
                </div>
              )}

              {filteredScenarios.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    No scenarios available
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Try selecting a different category or check back later for
                    new scenarios.
                  </p>
                  {selectedSkill && (
                    <button
                      onClick={() => handleSkillFilter(null)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View all categories
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                  {filteredScenarios.map((scenario, index) => {
                    const icons = [
                      { icon: "💬", bg: "from-blue-500 to-cyan-500" },
                      { icon: "🎯", bg: "from-purple-500 to-pink-500" },
                      { icon: "⚡", bg: "from-green-500 to-teal-500" },
                      { icon: "🚀", bg: "from-orange-500 to-red-500" },
                      { icon: "✨", bg: "from-indigo-500 to-purple-500" },
                      { icon: "🔥", bg: "from-pink-500 to-rose-500" },
                    ];
                    const iconData = icons[index % icons.length];

                    return (
                      <Card
                        key={scenario.id}
                        className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-0 overflow-hidden bg-white"
                      >
                        {/* Icon Header */}
                        <div
                          className={`h-24 bg-gradient-to-r ${iconData.bg} relative flex items-center justify-center`}
                        >
                          <div className="text-4xl">{iconData.icon}</div>
                          <div className="absolute top-4 right-4">
                            <Badge className="bg-white/20 text-white border-white/30 font-medium backdrop-blur-sm">
                              {scenario.difficulty || "Beginner"}
                            </Badge>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                            {scenario.name}
                          </h3>
                          <p className="text-gray-600 mb-6 leading-relaxed line-clamp-3">
                            {scenario.description}
                          </p>

                          {/* Action Button */}
                          <Link
                            to={`/micro-assessment-roleplay-session?scenarioId=${scenario.id}`}
                            className="block"
                          >
                            <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 group-hover:shadow-lg">
                              Start Practice
                              <svg
                                className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                                />
                              </svg>
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ModernDashboardLayout>
  );
}
