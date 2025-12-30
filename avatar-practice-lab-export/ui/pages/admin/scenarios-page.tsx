import React, { useState, useEffect } from "react";
import { Search, SquarePen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ModernDashboardLayout from "@/components/layout/modern-dashboard-layout";
import img from "/images/scenarios/default-scenario.png";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MultiSelect } from "@/components/ui/multi-select";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";

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

export default function AdminAvatarScenarioPage() {
  // const [skills, setSkills] = useState<Record<string, any>[]>([]);
  const [scenarios, setScenarios] = useState<Record<string, any>[]>([]);
  const [filteredScenarios, setFilteredScenarios] = useState<
    Record<string, any>[]
  >([]);
  // const [isLoading, setIsLoading] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = (scenario: any) => {
    setEditingScenario(scenario);
    setOpen(true);
  };

  const [searchParams] = useSearchParams();
  const skillFilter = searchParams.get("skill");
  const { data: skills } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["scenarios", selectedSkill],
    queryFn: async () => {
      const res = await fetch(
        `/api/avatar/get-scenarios${selectedSkill ? `?skillId=${selectedSkill}` : ""}`,
      );
      if (!res.ok) throw new Error("Failed to fetch scenarios");
      const data = await res.json();

      if (!data.success) return [];

      return data.scenarios.map((s: any) => ({
        id: s.id,
        skillId: s.skill_id || s.skillId,
        name: s.name,
        description: s.description || "",
        context: s.context || "",
        instructions: s.instructions || "",
        difficulty: s.difficulty || "STANDARD",
        knowledgeId: s.knowledge_id || s.knowledgeId || "",
        image: s.image || "/demo.png",
        avatarName: s?.avatar_name || s?.avatarName || "",
        avatarRole: s?.avatar_role || s?.avatarRole || "",
        ...s
      }));
    },
  });
  useEffect(() => {
    if (data) {
      console.log('scenario ',data)
      setScenarios(data);
      setFilteredScenarios(data);
    }
  }, [data]);
  // Initialize selected skill from URL parameter
  useEffect(() => {
    if (skillFilter && skillFilter !== selectedSkill) {
      setSelectedSkill(skillFilter);
    }
  }, [skillFilter]);

 
  const handleSkillFilter = (skillId: string | null) => {
    setSelectedSkill(skillId);
    if (skillId) {
      window.history.pushState({}, "", `/avatar/practice?skill=${skillId}`);
    } else {
      window.history.pushState({}, "", `/avatar/practice`);
    }
  };
  const handleOpenCreate = () => {
    setEditingScenario(null);
    setOpen(true);
  };
  const handleOpenEdit = (scenario: any) => {
    const skillIds = scenario?.skills?.map((skill: any) => skill.id)||[]
    
    setEditingScenario({...scenario,skillIds});
    setOpen(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      setIsEditing(true);
      const res = await fetch(
        editingScenario
          ? `/api/avatar/scenario/${editingScenario.id}`
          : `/api/avatar/scenario`,
        {
          method: editingScenario ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );

      if (!res.ok) throw new Error("Failed to update scenario");
      refetch()
      setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEditing(false);
    }
  };
  const skillOptions =
    skills?.map((skill) => ({
      value: skill.id.toString(),
      label: skill.name,
    })) || [];
  return (
    <ModernDashboardLayout>
      <>
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
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">
                  Avatar Scenarios
                </h1>
                 <Button onClick={handleOpenCreate}>+ New Scenario</Button>
              </div>

              {/* Scenarios Section */}
              <div>
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

                            <Button
                              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 group-hover:shadow-lg"
                              onClick={() => handleOpenEdit(scenario)}
                            >
                              Edit Scenario
                              <SquarePen className="ml-2" />
                            </Button>
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-scroll">
            <DialogHeader>
              <DialogTitle>
                {editingScenario ? "Edit Scenario" : "New Scenario"}
              </DialogTitle>
            </DialogHeader>
            <ScenarioForm
              defaultValues={editingScenario || {}}
              onSubmit={handleSubmit}
              isEditing={isEditing}
              skillOptions={skillOptions}
            />
          </DialogContent>
        </Dialog>
      </>
    </ModernDashboardLayout>
  );
}
const scenarioSchema = z.object({
  skillId: z.number().optional().nullable(),
  skillIds: z.array(z.number()).optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  context: z.string().optional(),
  instructions: z.string().optional(),
  avatarName: z.string().optional(),
  avatarRole: z.string().optional(),
  difficulty: z.string().optional(),
  duration: z.number().positive().optional(),
  scenarioKey: z.string().optional(),
  shortTitle: z.string().optional(),
  displayTitle: z.string().optional(),
  tags: z.array(z.string()).optional(),
  personaOverlays: z.record(z.object({
    userRoleTitle: z.string(),
    authorityAndConstraints: z.array(z.string()),
    successCriteria: z.array(z.string()),
    commonMistakes: z.array(z.string()),
    toneGuidance: z.string(),
    avatarPushbackLevel: z.enum(["low", "medium", "high"]),
  })).optional(),
});

type ScenarioFormValues = z.infer<typeof scenarioSchema>;

export function ScenarioForm({
  defaultValues,
  onSubmit,
  isEditing,
  skillOptions
}: {
  defaultValues?: Partial<ScenarioFormValues>;
  onSubmit: (data: ScenarioFormValues) => void;
  isEditing: boolean;
  skillOptions: { value: string; label: string }[]
}) {
 const form = useForm<ScenarioFormValues>({
    resolver: zodResolver(scenarioSchema),
    defaultValues,
  });
  console.log('erros', form.formState.errors, form.watch('duration'))

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 p-4 max-w-xl "
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Scenario name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Scenario description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="context"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Context</FormLabel>
              <FormControl>
                <Textarea placeholder="Scenario context" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions</FormLabel>
              <FormControl>
                <Textarea placeholder="Scenario instructions" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="avatarName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar Name</FormLabel>
              <FormControl>
                <Input placeholder="Avatar name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="avatarRole"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar Role</FormLabel>
              <FormControl>
                <Input placeholder="Avatar role" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="difficulty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Difficulty</FormLabel>
              <FormControl>
                <Input placeholder="Difficulty" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`duration`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration</FormLabel>
              <FormControl>
                <Input
                   min="1"
                  placeholder="Duration in minutes"
                  type="number"
                  {...field}
                  onChange={(e) =>
                    field.onChange(
                      parseFloat(e.target.value, 10),
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="skillIds"
          render={({ field }) => {
            const selectedSkills =
              field.value && Array.isArray(field.value)
                ? field.value
                : [];
            return (
              <FormItem>
                <FormLabel>Skills</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={skillOptions}
                    selected={selectedSkills.map((id) => ({
                      value: String(id),
                      label:
                        skillOptions.find(
                          (opt) => opt.value === String(id),
                        )?.label || String(id),
                    }))}
                    onChange={(selected) =>
                      field.onChange(
                        selected.map((s) => parseInt(s.value)),
                      )
                    }
                    placeholder="Select skills..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-semibold mb-2">Scenario Metadata</h4>
          
          <FormField
            control={form.control}
            name="scenarioKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scenario Key (unique identifier)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., difficult_feedback_giver" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shortTitle"
            render={({ field }) => (
              <FormItem className="mt-3">
                <FormLabel>Short Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Difficult Feedback" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="displayTitle"
            render={({ field }) => (
              <FormItem className="mt-3">
                <FormLabel>Display Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Giving difficult feedback to an underperformer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-semibold mb-2">Persona Overlays (JSON)</h4>
          <p className="text-xs text-muted-foreground mb-2">
            Define how this scenario adapts to different role levels (ic, manager, senior, exec)
          </p>
          <FormField
            control={form.control}
            name="personaOverlays"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder={`{
  "ic": {
    "userRoleTitle": "Team Member",
    "authorityAndConstraints": ["Limited scope"],
    "successCriteria": ["Raise concerns clearly"],
    "commonMistakes": ["Being too passive"],
    "toneGuidance": "Be direct but respectful",
    "avatarPushbackLevel": "low"
  }
}`}
                    className="font-mono text-xs h-48"
                    value={field.value ? JSON.stringify(field.value, null, 2) : ""}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        field.onChange(parsed);
                      } catch {
                        // Allow invalid JSON while typing
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isEditing}>
          Save Scenario
          {isEditing && <LoadingSpinner size="sm" className="ml-2" />}
        </Button>
      </form>
    </Form>
  );
}
