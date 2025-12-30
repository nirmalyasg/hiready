import { useState } from "react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

interface CreateScenarioProps {
  skillId: string;
  onScenarioCreated: () => void;
}

export default function CreateScenario({
  skillId,
  onScenarioCreated,
}: CreateScenarioProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const aiResponse = await fetch("/api/generate-scenario-instructions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          skillId,
        }),
      });

      const { instructions, context } = await aiResponse.json();

      const saveResponse = await fetch("/api/save-scenario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: title,
          description,
          skillId,
          instructions,
          context,
          difficulty: "CUSTOM",
          knowledgeId: `custom_${Date.now()}`,
        }),
      });

      if (saveResponse.ok) {
        onScenarioCreated();
        toast({
          title: "Your scenario has been created!",
          description: "You can now start the simulation.",
        });
        setTitle("");
        setDescription("");
      }
    } catch (error) {
      console.error("Error creating scenario:", error);
      toast({
        title: "Failed to create scenario. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <Card className="custom-scenario-form">
        <CardContent className="p-8 bg-white">
          <h3 className="text-xl font-semibold text-gray-900 mb-8">
            Create Custom Scenario
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <Label
                htmlFor="scenario-title"
                className="text-gray-700 font-medium mb-2 block"
              >
                Scenario Title
              </Label>
              <Input
                id="scenario-title"
                placeholder="Enter a descriptive title for your scenario"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
                required
                className="bg-white text-gray-900 border border-gray-300 h-12 focus-visible:ring-primary focus-visible:border-primary"
              />
              <small className="block text-gray-500 mt-2">
                Choose a clear title that describes the communication challenge
              </small>
            </div>

            <div>
              <Label
                htmlFor="scenario-description"
                className="text-gray-700 font-medium mb-2 block"
              >
                Scenario Description
              </Label>
              <Textarea
                id="scenario-description"
                placeholder="Describe the conversation scenario in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                required
                className="bg-white text-gray-900 border border-gray-300 min-h-[120px] focus-visible:ring-primary focus-visible:border-primary"
              />
              <small className="block text-gray-500 mt-2">
                Include relevant context and what skills should be practiced
              </small>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full font-medium bg-primary hover:bg-primary/90 text-white mt-8 h-12 rounded-lg"
            >
              {isLoading ? "Creating Scenario..." : "Generate Scenario"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
