
// import React, { useState, useEffect } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Spinner } from "@/components/ui/spinner";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { useQuery } from "@tanstack/react-query";
// import { apiRequest } from "@/lib/queryClient";
// import DashboardLayout from '@/components/layout/dashboard-layout';
// import ModernDashboardLayout from "@/components/layout/modern-dashboard-layout";
// export default function AdminAvatarPage() {
//   const [skills, setSkills] = useState<Record<string,any>[]>([]);
//   const [scenarios, setScenarios] = useState<Record<string,any>[]>([]);
//   const [activeTab, setActiveTab] = useState("skills");
//   const { data, isLoading } = useQuery({
//     queryKey: ["/api/avatar/get-skills"],
//     queryFn: async () => {
//       const response = await apiRequest(`/api/avatar/get-skills`);
//       return response.data;
//     },
//   });
//   const { data: scenariosData, isLoading: scenariosLoading } = useQuery({
//     queryKey: ["/api/avatar/get-scenarios"],
//     queryFn: async () => {
//       const response = await apiRequest(`/api/avatar/get-scenarios`);

//       return response.data;
//     },
//   });
//   useEffect(() => {
//     data && setSkills(data?.skills);
//     scenariosData && setScenarios(scenariosData?.scenarios);
//   }, [data, scenariosData]);

//   // Function to get color based on difficulty
//   const getDifficultyColor = (difficulty) => {
//     switch (difficulty?.toUpperCase()) {
//       case "CRITICAL":
//         return "danger";
//       case "BLUNT":
//         return "warning";
//       case "ENTHUSIASTIC":
//         return "success";
//       case "EMPATHETIC":
//         return "secondary";
//       case "CURIOUS":
//         return "primary";
//       default:
//         return "default";
//     }
//   };

//   return (
//     <ModernDashboardLayout>
//     <div className="p-8">
//       <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

//       <div className="flex mb-6 gap-4">
//         <Button
//           variant={activeTab === "skills" ? "default" : "outline"}
//           onClick={() => setActiveTab("skills")}
//         >
//           Skills
//         </Button>
//         <Button
//           variant={activeTab === "skills" ? "default" : "outline"}
//           onClick={() => setActiveTab("scenarios")}
//         >
//           Scenarios
//         </Button>
//       </div>

//       {isLoading || scenariosLoading ? (
//         <div className="flex justify-center items-center h-64">
//           <Spinner size="lg" />
//         </div>
//       ) : (
//         <>
//           {activeTab === "skills" && (
//             <div className="grid grid-cols-1 gap-4">
//               <>
//                 {!skills || !skills?.length ? (
//                   <div className="flex justify-center items-center h-64">
//                     <p>No skills available</p>
//                   </div>
//                 ) : (
//                   <>
//                     {skills?.map((skill) => (
//                       <Card key={skill?.id} className="p-4">
//                         <div className="flex justify-between items-start">
//                           <div>
//                             <h3 className="text-xl font-semibold">
//                               {skill?.name || ""}
//                             </h3>
//                             <p className="text-default-500">
//                               {skill?.description || ""}
//                             </p>
//                           </div>
//                           <Badge color="primary">{skill?.id || ""}</Badge>
//                         </div>
//                         <Separator className="my-3" />
//                         <div>
//                           <h4 className="text-md font-medium mb-2">
//                             Scenarios:
//                           </h4>
//                           <div className="space-y-2">
//                             {scenarios
//                               .filter(
//                                 (scenario) => scenario?.skillId === skill?.id,
//                               )
//                               .map((scenario) => (
//                                 <div
//                                   key={scenario?.id}
//                                   className="pl-4 border-l-2 border-default-200"
//                                 >
//                                   <span className="font-medium">
//                                     {scenario?.name}
//                                   </span>
//                                   <span className="ml-2">
//                                     <Badge
//                                       color={getDifficultyColor(
//                                         scenario?.difficulty,
//                                       )}
//                                     >
//                                       {scenario?.difficulty || "STANDARD"}
//                                     </Badge>
//                                   </span>
//                                 </div>
//                               ))}
//                           </div>
//                         </div>
//                       </Card>
//                     ))}
//                   </>
//                 )}
//               </>
//             </div>
//           )}

//           {activeTab === "scenarios" && (
//             <>
//               {!scenarios || !scenarios?.length ? (
//                 <div className="flex justify-center items-center h-64">
//                   <p>No scenarios available</p>
//                 </div>
//               ) : (
//                 <>
//                   <div className="grid grid-cols-1 gap-4">
//                     {scenarios?.map((scenario) => {
//                       const relatedSkill = skills.find(
//                         (skill) => skill.id === scenario.skillId,
//                       );
//                       return (
//                         <Card key={scenario.id} className="p-4">
//                           <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
//                             <div>
//                               <h3 className="text-xl font-semibold">
//                                 {scenario.name}
//                               </h3>
//                               <p className="text-default-500">
//                                 {scenario.description}
//                               </p>
//                             </div>
//                             <div className="flex flex-wrap gap-2">
//                               <Badge color="primary">
//                                 {relatedSkill?.name || "Unknown Skill"}
//                               </Badge>
//                               <Badge
//                                 color={getDifficultyColor(scenario.difficulty)}
//                               >
//                                 {scenario.difficulty || "STANDARD"}
//                               </Badge>
//                             </div>
//                           </div>
//                           <Separator className="my-3" />
//                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <div>
//                               <h4 className="text-md font-medium">Context:</h4>
//                               <p>{scenario.context}</p>
//                             </div>
//                             <div>
//                               <h4 className="text-md font-medium">
//                                 Instructions:
//                               </h4>
//                               <p>{scenario.instructions}</p>
//                             </div>
//                           </div>
//                           <div className="mt-3">
//                             <p className="text-sm text-default-400">
//                               Knowledge ID: {scenario.knowledgeId}
//                             </p>
//                           </div>
//                         </Card>
//                       );
//                     })}
//                   </div>
//                 </>
//               )}
//             </>
//           )}
//         </>
//       )}
//     </div>
//       </ModernDashboardLayout>
// );
// }
import React, { useState, useEffect } from "react";
import { Search ,SquarePen} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ModernDashboardLayout from "@/components/layout/modern-dashboard-layout";
import img from "/images/scenarios/default-scenario.png";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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

export default function AdminAvatarPage() {
  const [skills, setSkills] = useState<Record<string, any>[]>([]);
  const [scenarios, setScenarios] = useState<Record<string, any>[]>([]);
  const [filteredScenarios, setFilteredScenarios] = useState<
    Record<string, any>[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const skillFilter = searchParams.get("skill");

  useEffect(() => {
    let mounted = true;
    let controller = new AbortController();

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [scenariosResponse, skillsResponse] = await Promise.all([
          fetch(
            `/api/avatar/get-scenarios${selectedSkill ? `?skillId=${selectedSkill}` : ""}`,
            {
              signal: controller.signal,
            },
          ),
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
          const normalizedScenarios = scenariosData.scenarios.map((s) => ({
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
      window.history.pushState({}, '', `/avatar/practice?skill=${skillId}`);
    } else {
      window.history.pushState({}, '', `/avatar/practice`);
    }
  };
  return (
    <ModernDashboardLayout>
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="min-h-screen bg-white">
          <div className="container mx-auto px-6 py-8 max-w-7xl">
            {/* Header */}
            {/* <div className="mb-4">
              <Link
                to="/avatar/dashboard"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 font-medium transition-colors"
              >
                ← Back to Dashboard
              </Link>
            
            </div> */}

          

            {/* Scenarios Section */}
            <div>
 

              {filteredScenarios.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">No scenarios available</h3>
                  <p className="text-gray-500 mb-6">Try selecting a different category or check back later for new scenarios.</p>
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
                      { icon: '💬', bg: 'from-blue-500 to-cyan-500' },
                      { icon: '🎯', bg: 'from-purple-500 to-pink-500' },
                      { icon: '⚡', bg: 'from-green-500 to-teal-500' },
                      { icon: '🚀', bg: 'from-orange-500 to-red-500' },
                      { icon: '✨', bg: 'from-indigo-500 to-purple-500' },
                      { icon: '🔥', bg: 'from-pink-500 to-rose-500' }
                    ];
                    const iconData = icons[index % icons.length];

                    return (
                      <Card key={scenario.id} className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-0 overflow-hidden bg-white">
                        {/* Icon Header */}
                        <div className={`h-24 bg-gradient-to-r ${iconData.bg} relative flex items-center justify-center`}>
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
                            to={`/avatar/practice/avatar-select?scenarioId=${scenario.id}`}
                            className="block"
                          >
                            <Button 
                              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 group-hover:shadow-lg"
                            >
                              Edit Scenario
                              <SquarePen  className="ml-2"/>
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
