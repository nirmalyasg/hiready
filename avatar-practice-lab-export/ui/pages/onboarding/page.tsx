
import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    role: "",
    industry: "",
    skillLevel: "beginner",
    goals: [],
    assessmentAnswers: [],
  });

  const industries = [
    { value: "technology", label: "Technology" },
    { value: "healthcare", label: "Healthcare" },
    { value: "finance", label: "Finance" },
    { value: "education", label: "Education" },
    { value: "other", label: "Other" },
  ];

  const goals = [
    { value: "feedback", label: "Improve giving feedback" },
    { value: "objections", label: "Handle objections" },
    { value: "presentations", label: "Deliver better presentations" },
    { value: "conflicts", label: "Resolve conflicts" },
  ];

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/save-onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        window.location.href = "/"; // Redirect to main app
      }
    } catch (error) {
      console.error("Error saving onboarding data:", error);
    }
  };

  return (
  <div className="max-w-2xl mx-auto py-8">
    <Card>
      <CardContent className="p-6">
        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold mb-6">
              Welcome! Let's get started
            </h1>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Role</Label>
                <Input
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Industry</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) =>
                    setFormData({ ...formData, industry: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry.value} value={industry.value}>
                        {industry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleNext}>Next</Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold mb-6">
              Your Communication Skills
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">
                  How would you rate your current communication skills?
                </Label>
                <RadioGroup
                  value={formData.skillLevel}
                  onValueChange={(value) =>
                    setFormData({ ...formData, skillLevel: value })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="beginner" id="beginner" />
                    <Label htmlFor="beginner">Beginner</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="intermediate" id="intermediate" />
                    <Label htmlFor="intermediate">Intermediate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="advanced" id="advanced" />
                    <Label htmlFor="advanced">Advanced</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="mb-2 block">Select your learning goals</Label>
                <MultiSelect
                  options={goals}
                  selected={formData.goals.map((val) => ({
                    value: val,
                    label: goals.find((goal) => goal.value === val)?.label || val,
                  }))}
                  onChange={(selected) =>
                    setFormData({
                      ...formData,
                      goals: selected.map((item) => item.value),
                    })
                  }
                  placeholder="Select goals..."
                />
              </div>

              <Button onClick={handleNext}>Next</Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-2xl font-bold mb-6">Quick Assessment</h2>
            <div className="space-y-6">
              <div>
                <p className="mb-2">
                  How do you typically handle disagreements at work?
                </p>
                <RadioGroup
                  onValueChange={(value) => {
                    const answers = [...formData.assessmentAnswers];
                    answers[0] = value;
                    setFormData({ ...formData, assessmentAnswers: answers });
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="a" id="a1" />
                    <Label htmlFor="a1">Try to find common ground</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="b" id="b1" />
                    <Label htmlFor="b1">Stand firm on my position</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="c" id="c1" />
                    <Label htmlFor="c1">Seek help from others</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <p className="mb-2">
                  When giving feedback, what's your approach?
                </p>
                <RadioGroup
                  onValueChange={(value) => {
                    const answers = [...formData.assessmentAnswers];
                    answers[1] = value;
                    setFormData({ ...formData, assessmentAnswers: answers });
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="a" id="a2" />
                    <Label htmlFor="a2">Direct and to the point</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="b" id="b2" />
                    <Label htmlFor="b2">
                      Sandwich negative feedback between positives
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="c" id="c2" />
                    <Label htmlFor="c2">
                      Focus on solutions and improvements
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button onClick={handleSubmit}>Complete Setup</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  </div> );
}
