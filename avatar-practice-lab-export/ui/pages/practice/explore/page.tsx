import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lightbulb, Brain, Compass, Briefcase, Globe, Heart, Mic } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ModernDashboardLayout from "@/components/layout/modern-dashboard-layout";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import { useAvatars } from "@/hooks/use-avatars";
import {
  type ConversationBlueprint,
} from "@/lib/conversation-framework";

const EXPLORE_TOPICS = [
  {
    id: "current-affairs",
    icon: <Globe className="w-6 h-6" />,
    title: "Current Affairs & News",
    description: "Discuss what's happening in the world and form your perspective",
    prompt: "Let's discuss what's happening in the world",
  },
  {
    id: "business",
    icon: <Briefcase className="w-6 h-6" />,
    title: "Business & Work",
    description: "Talk through a work situation, strategy, or professional challenge",
    prompt: "Let's talk through a work or business situation",
  },
  {
    id: "ideas",
    icon: <Lightbulb className="w-6 h-6" />,
    title: "Ideas & Innovation",
    description: "Develop and refine an idea you've been thinking about",
    prompt: "Help me develop and explore an idea",
  },
  {
    id: "career",
    icon: <Compass className="w-6 h-6" />,
    title: "Career & Growth",
    description: "Think through career decisions, goals, or growth opportunities",
    prompt: "Let's think through career decisions or growth",
  },
  {
    id: "personal",
    icon: <Heart className="w-6 h-6" />,
    title: "Personal & Relationships",
    description: "Process something personal or think through a relationship dynamic",
    prompt: "Help me think through a personal matter",
  },
  {
    id: "just-thinking",
    icon: <Brain className="w-6 h-6" />,
    title: "Just Thinking",
    description: "No specific topic - just talk through whatever's on your mind",
    prompt: "I just want to think out loud about something",
  },
];

export default function ExplorePage() {
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  
  const { avatarData: avatars, isLoading: avatarsLoading } = useAvatars({ initialLimit: 50 });

  const getRandomAvatar = () => {
    if (!avatars || avatars.length === 0) {
      return "Dexter_Lawyer_Sitting_public";
    }
    const randomIndex = Math.floor(Math.random() * avatars.length);
    return avatars[randomIndex].id;
  };

  const handleStartExploration = () => {
    if (!selectedTopic && !customTopic.trim()) return;
    
    setIsStarting(true);
    
    const topic = EXPLORE_TOPICS.find(t => t.id === selectedTopic);
    const topicContext = customTopic.trim() || topic?.prompt || "An open exploration of ideas";
    
    const blueprint: ConversationBlueprint = {
      context: "reflective_coaching",
      counterPersona: {
        archetype: "idealistic_thinker",
        caresAbout: "understanding",
        pressureResponse: "asks_questions",
        trigger: "surface_level_thinking",
      },
      tension: {
        primary: "uncertainty_ambiguity",
      },
      userObjective: "reflect",
      conversationMode: "explore",
      skillLens: {
        primary: "clarity_of_thought",
        secondary: "structured_reasoning",
      },
      scenarioSummary: {
        title: topic?.title || "Think it through",
        context: topicContext,
        counterPersonaDescription: "A thoughtful thinking partner who asks good questions, reflects back what they hear, and helps you gain clarity",
        whatMakesItTricky: "Articulating thoughts clearly and examining assumptions",
        objectiveStatement: "Gain clarity and insight through conversation",
      },
    };

    const randomAvatarId = getRandomAvatar();
    const blueprintParam = encodeURIComponent(JSON.stringify(blueprint));
    
    navigate(`/avatar/practice/pre-session?avatarId=${randomAvatarId}&blueprint=${blueprintParam}&mode=explore`);
  };

  const canStart = selectedTopic || customTopic.trim().length > 0;

  return (
    <ModernDashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-6 py-8 max-w-3xl">
          <button
            onClick={() => navigate("/avatar/start")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Lightbulb className="w-4 h-4" />
                Think it through
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                What's on your mind?
              </h1>
              <p className="text-slate-600">
                Talk something out with a thoughtful AI partner. No scenario, no pressure.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Tell me what you're thinking about
              </label>
              <textarea
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Something I'm considering... a decision I'm facing... an idea I want to explore..."
                className="w-full h-28 p-4 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Or pick a topic area
              </label>
              <div className="grid grid-cols-2 gap-3">
                {EXPLORE_TOPICS.map((topic) => (
                  <Card
                    key={topic.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedTopic === topic.id
                        ? "border-2 border-emerald-500 bg-emerald-50"
                        : "border-2 border-transparent hover:border-slate-200"
                    }`}
                    onClick={() => setSelectedTopic(
                      selectedTopic === topic.id ? null : topic.id
                    )}
                  >
                    <div className={`mb-2 ${selectedTopic === topic.id ? "text-emerald-600" : "text-slate-400"}`}>
                      {topic.icon}
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1 text-sm">{topic.title}</h3>
                    <p className="text-xs text-slate-600">{topic.description}</p>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleStartExploration}
                disabled={!canStart || isStarting || avatarsLoading}
                className="bg-emerald-600 hover:bg-emerald-700 px-8 py-6 text-lg"
              >
                {isStarting ? (
                  <span className="animate-pulse">Starting...</span>
                ) : (
                  <>
                    <Mic className="w-5 h-5 mr-2" />
                    Start Talking
                  </>
                )}
              </Button>
            </div>
            
            <p className="text-xs text-slate-500 text-right hidden sm:block">
              2-3 minute voice conversation with an AI thinking partner
            </p>
          </div>
        </div>
      </div>
      <MobileBottomNav />
    </ModernDashboardLayout>
  );
}
