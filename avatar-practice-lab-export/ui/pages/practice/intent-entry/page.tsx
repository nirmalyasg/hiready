import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { MessageSquare, BookOpen, ArrowRight, Presentation, Briefcase, Globe, TrendingUp, Heart, Laptop, Trophy, Mic, Loader2, UserCheck, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VoiceInputField } from "@/components/ui/voice-input";
import SidebarLayout from "@/components/layout/sidebar-layout";
import { useAvatars } from "@/hooks/use-avatars";
import {
  type ConversationBlueprint,
  type ConversationMode, 
  type UserObjective, 
  type CounterPersonaArchetype, 
  type TensionArchetype 
} from "@/lib/conversation-framework";
import { detectLanguage, getLanguageName } from "@/lib/detect-language";

interface CategoryConfig {
  id: string;
  icon: React.ReactNode;
  label: string;
  coachingContext: string;
  conversationMode: ConversationMode;
  userObjective: UserObjective;
  archetype: CounterPersonaArchetype;
  tensionType: TensionArchetype;
  avatarStance: string;
  discussionStyle: string;
}

const TOPIC_CATEGORIES: CategoryConfig[] = [
  {
    id: "custom",
    icon: <MessageSquare className="w-4 h-4" />,
    label: "Custom Topic",
    coachingContext: "general discussion and idea exploration",
    conversationMode: "explore",
    userObjective: "reflect",
    archetype: "idealistic_thinker",
    tensionType: "uncertainty_ambiguity",
    avatarStance: "curious and engaged, asks thoughtful questions to explore your perspective",
    discussionStyle: "Open, exploratory discussion. Ask good questions, explore different angles, help articulate ideas clearly.",
  },
  {
    id: "current-affairs",
    icon: <Globe className="w-4 h-4" />,
    label: "Current Affairs",
    coachingContext: "news, politics, global events, and societal debates",
    conversationMode: "challenge",
    userObjective: "influence",
    archetype: "skeptical_peer",
    tensionType: "value_disagreement",
    avatarStance: "plays devil's advocate, challenges your position with counterarguments",
    discussionStyle: "Sharp, debate-style discussion. Push back on claims, ask for evidence, present opposing viewpoints.",
  },
  {
    id: "technology",
    icon: <Laptop className="w-4 h-4" />,
    label: "Technology",
    coachingContext: "AI, innovation, digital trends, and tech ethics",
    conversationMode: "challenge",
    userObjective: "reflect",
    archetype: "skeptical_peer",
    tensionType: "uncertainty_ambiguity",
    avatarStance: "skeptical about hype, asks tough questions about implications",
    discussionStyle: "Analytical discussion. Question assumptions, explore second-order effects, debate ethics and trade-offs.",
  },
  {
    id: "business",
    icon: <Briefcase className="w-4 h-4" />,
    label: "Business",
    coachingContext: "strategy, markets, entrepreneurship, and business ideas",
    conversationMode: "resolve",
    userObjective: "resolve",
    archetype: "impatient_stakeholder",
    tensionType: "conflicting_incentives",
    avatarStance: "focuses on practical outcomes, asks 'what would you actually do?'",
    discussionStyle: "Decision-oriented discussion. Push toward concrete actions, challenge vague strategies, end with 'so what's your next step?'",
  },
  {
    id: "career",
    icon: <TrendingUp className="w-4 h-4" />,
    label: "Career",
    coachingContext: "professional growth, work challenges, and career decisions",
    conversationMode: "explore",
    userObjective: "reflect",
    archetype: "idealistic_thinker",
    tensionType: "uncertainty_ambiguity",
    avatarStance: "curious and supportive, helps you think through options",
    discussionStyle: "Reflective discussion. Ask open questions, explore motivations, help articulate goals and trade-offs.",
  },
  {
    id: "wellness",
    icon: <Heart className="w-4 h-4" />,
    label: "Wellness",
    coachingContext: "health, lifestyle, relationships, and personal growth",
    conversationMode: "explore",
    userObjective: "reflect",
    archetype: "idealistic_thinker",
    tensionType: "uncertainty_ambiguity",
    avatarStance: "empathetic and curious, explores the 'why' behind choices",
    discussionStyle: "Supportive exploration. Listen actively, ask thoughtful follow-ups, help connect dots.",
  },
  {
    id: "sports",
    icon: <Trophy className="w-4 h-4" />,
    label: "Sports",
    coachingContext: "competitions, teams, athletic debates, and sports culture",
    conversationMode: "challenge",
    userObjective: "influence",
    archetype: "overconfident_expert",
    tensionType: "credibility_challenge",
    avatarStance: "takes the opposing fan's perspective, debates passionately",
    discussionStyle: "Spirited debate. Defend opposing positions, bring up stats and history, make it fun and competitive.",
  },
];

const practiceOptions = [
  {
    id: "interview",
    icon: <UserCheck className="w-8 h-8" />,
    title: "Interview Practice",
    description: "Practice job interviews by role",
    route: "/interview",
    bgColor: "bg-gradient-to-br from-indigo-600 to-indigo-800",
    iconBg: "bg-white/20",
  },
  {
    id: "interview-custom",
    icon: <FileText className="w-8 h-8" />,
    title: "Custom Interview",
    description: "Upload resume & job description",
    route: "/interview/custom",
    bgColor: "bg-gradient-to-br from-emerald-600 to-teal-700",
    iconBg: "bg-white/20",
  },
  {
    id: "scenario",
    icon: <BookOpen className="w-8 h-8" />,
    title: "Workplace Scenarios",
    description: "Practice difficult conversations",
    route: "/avatar/practice",
    bgColor: "bg-gradient-to-br from-brand-primary to-brand-dark",
    iconBg: "bg-white/20",
  },
  {
    id: "situation",
    icon: <MessageSquare className="w-8 h-8" />,
    title: "Custom Situation",
    description: "Describe your own situation",
    route: "/avatar/practice/custom-scenario",
    bgColor: "bg-gradient-to-br from-brand-light to-brand-primary",
    iconBg: "bg-white/20",
  },
  {
    id: "presentation",
    icon: <Presentation className="w-8 h-8" />,
    title: "Presentation Practice",
    description: "Upload slides and practice",
    route: "/avatar/practice/presentation",
    bgColor: "bg-gradient-to-br from-brand-accent to-brand-accent-light",
    iconBg: "bg-white/20",
  }
];

export default function IntentEntryPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [categoryCustomTopic, setCategoryCustomTopic] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [voiceInputLanguage, setVoiceInputLanguage] = useState("en");
  const [userManuallySelectedLanguage, setUserManuallySelectedLanguage] = useState(false);

  const detectedLanguage = useMemo(() => {
    const topicText = customTopic || categoryCustomTopic || "";
    const detected = detectLanguage(topicText);
    return detected;
  }, [customTopic, categoryCustomTopic]);
  
  useEffect(() => {
    if (!userManuallySelectedLanguage && detectedLanguage.confidence === "high" && detectedLanguage.code !== voiceInputLanguage) {
      setVoiceInputLanguage(detectedLanguage.code);
    }
  }, [detectedLanguage, userManuallySelectedLanguage]);
  
  const sessionLanguage = useMemo(() => {
    return { code: voiceInputLanguage, name: getLanguageName(voiceInputLanguage) };
  }, [voiceInputLanguage]);

  const handleLanguageChange = (newLanguage: string) => {
    setVoiceInputLanguage(newLanguage);
    setUserManuallySelectedLanguage(true);
  };
  
  const { avatarData: avatars, isLoading: avatarsLoading } = useAvatars({ initialLimit: 50 });

  const getRandomAvatar = () => {
    if (!avatars || avatars.length === 0) {
      return "Dexter_Lawyer_Sitting_public";
    }
    const randomIndex = Math.floor(Math.random() * avatars.length);
    return avatars[randomIndex].id;
  };

  useEffect(() => {
    if (selectedCategory && selectedCategory !== "custom") {
      fetchSuggestedTopics(selectedCategory);
      setSelectedTopic(null);
    } else if (!selectedCategory) {
      setSuggestedTopics([]);
      setSelectedTopic(null);
    }
    // When selectedCategory === "custom", we keep the topic intact (user typed it)
  }, [selectedCategory]);

  const fetchSuggestedTopics = async (categoryId: string) => {
    setIsLoadingTopics(true);
    try {
      const response = await fetch('/api/avatar/suggest-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId }),
      });
      if (response.ok) {
        const data = await response.json();
        setSuggestedTopics(data.topics || []);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setIsLoadingTopics(false);
    }
  };

  const handleStartConversation = async () => {
    if (!selectedCategory || !selectedTopic) return;
    
    setIsStarting(true);
    
    // Auto-categorize if user typed a custom topic
    let finalCategory = selectedCategory;
    if (selectedCategory === "custom") {
      try {
        console.log("[Impromptu] Auto-categorizing topic:", selectedTopic);
        const response = await fetch('/api/avatar/categorize-topic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: selectedTopic }),
        });
        const data = await response.json();
        if (data.success && data.category) {
          finalCategory = data.category;
          console.log("[Impromptu] Auto-detected category:", finalCategory);
        }
      } catch (error) {
        console.error("Auto-categorization failed, using default:", error);
        finalCategory = "current-affairs";
      }
    }
    
    const category = TOPIC_CATEGORIES.find(c => c.id === finalCategory) || TOPIC_CATEGORIES.find(c => c.id === "custom");
    const coachingArea = category?.coachingContext || "general discussion";
    
    // Use category-specific conversation settings
    const conversationMode = category?.conversationMode || "explore";
    const userObjective = category?.userObjective || "reflect";
    const archetype = category?.archetype || "idealistic_thinker";
    const tensionType = category?.tensionType || "uncertainty_ambiguity";
    const avatarStance = category?.avatarStance || "helps you think through the topic";
    const discussionStyle = category?.discussionStyle || "Open, exploratory discussion.";
    
    // Build a richer, category-specific persona description
    const personaDescription = `A discussion partner who ${avatarStance}. They are knowledgeable about ${coachingArea}.

## DISCUSSION APPROACH
${discussionStyle}

## YOUR CONVERSATION GOALS
- Drive the conversation with specific questions based on the topic
- Reference specific facts, names, and details when you have them (from research)
- Don't just passively agree - actively engage, challenge, and explore
- If the user makes a claim, ask "why do you think that?" or "what about [counterpoint]?"
- Use the research/facts you have to make informed follow-up questions`;
    
    const blueprint: ConversationBlueprint = {
      context: "public_intellectual",
      counterPersona: {
        archetype: archetype,
        caresAbout: "engaging in substantive discussion with specific details",
        pressureResponse: conversationMode === "challenge" ? "pushes_back" : "asks_questions",
        trigger: "vague_or_generic_responses",
      },
      tension: {
        primary: tensionType,
      },
      userObjective: userObjective,
      conversationMode: conversationMode,
      skillLens: {
        primary: "clarity_of_thought",
        secondary: "structured_reasoning",
      },
      scenarioSummary: {
        title: selectedTopic,
        context: `Impromptu discussion about: ${selectedTopic}`,
        counterPersonaDescription: personaDescription,
        whatMakesItTricky: conversationMode === "challenge" 
          ? "Defending your position with evidence and handling counterarguments"
          : "Articulating a clear perspective and exploring different angles",
        objectiveStatement: conversationMode === "challenge"
          ? "Build a well-reasoned argument and handle pushback effectively"
          : "Develop and articulate a thoughtful perspective through discussion",
      },
    };

    // Store blueprint in sessionStorage to avoid URL length limits
    const blueprintId = uuidv4();
    sessionStorage.setItem(`blueprint:${blueprintId}`, JSON.stringify(blueprint));
    
    const randomAvatarId = getRandomAvatar();
    
    console.log(`[Language] Session will use: ${sessionLanguage.name} (${sessionLanguage.code}) | Manual selection: ${userManuallySelectedLanguage} | Detected: ${detectedLanguage.name} (${detectedLanguage.confidence})`);
    console.log(`[Impromptu] Category: ${finalCategory} (original: ${selectedCategory}), Mode: ${conversationMode}, Objective: ${userObjective}, Archetype: ${archetype}`);
    
    // Pass blueprintId instead of full blueprint to avoid URL truncation
    // Also pass blueprint as backup for pages that don't support blueprintId yet
    const blueprintParam = encodeURIComponent(JSON.stringify(blueprint));
    // Go directly to avatar selection for impromptu conversations (bypass pre-session)
    navigate(`/avatar/practice/avatar-select?blueprint=${blueprintParam}&blueprintId=${blueprintId}&mode=voice&category=${finalCategory}&topic=${encodeURIComponent(selectedTopic)}&language=${sessionLanguage.code}`);
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen pb-16 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-10 max-w-3xl">
          
          <h1 className="text-lg sm:text-2xl font-bold text-brand-dark mb-4 sm:mb-8 text-center">
            What would you like to do?
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-5 mb-6 sm:mb-14">
            {practiceOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => navigate(option.route)}
                className={`${option.bgColor} rounded-xl sm:rounded-2xl p-3 sm:p-6 text-left hover:scale-[1.02] hover:shadow-xl transition-all group flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0`}
              >
                <div className={`${option.iconBg} w-10 sm:w-14 h-10 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center sm:mb-4 flex-shrink-0`}>
                  <div className="text-white [&>svg]:w-6 [&>svg]:h-6 sm:[&>svg]:w-8 sm:[&>svg]:h-8">
                    {option.icon}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-lg mb-0 sm:mb-2">
                    {option.title}
                  </h3>
                  <p className="text-xs text-white/80 hidden sm:block">
                    {option.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-brand-light/30 pt-5 sm:pt-10">
            <h2 className="text-sm sm:text-lg font-semibold text-brand-dark mb-1.5 text-center">
              Impromptu Speaking
            </h2>
            <p className="text-xs sm:text-sm text-brand-dark/60 mb-4 sm:mb-6 text-center">
              Pick a topic and practice speaking off-the-cuff
            </p>

            <div className="bg-white rounded-xl border border-brand-light/30 p-4 sm:p-5 mb-4 sm:mb-6">
              <p className="text-xs text-brand-dark/60 mb-2">Type or tap the mic to speak your topic:</p>
              <VoiceInputField
                value={customTopic}
                onChange={(value) => {
                  setCustomTopic(value);
                  if (value.trim()) {
                    setSelectedTopic(value);
                    setSelectedCategory("custom");
                  } else {
                    setSelectedTopic(null);
                  }
                }}
                placeholder="Type or speak any topic..."
                language={voiceInputLanguage}
                onLanguageChange={handleLanguageChange}
                showLanguagePicker={true}
              />

              {/* Start button when topic entered */}
              {customTopic.trim() && (
                <div className="mt-4 space-y-3">
                  {sessionLanguage.code !== "en" && (
                    <p className="text-center text-sm text-brand-dark/70">
                      Session will be in <span className="font-medium text-brand-primary">{sessionLanguage.name}</span>
                    </p>
                  )}
                  <Button
                    onClick={handleStartConversation}
                    disabled={isStarting || avatarsLoading}
                    className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white py-3"
                  >
                    {isStarting ? (
                      <span className="animate-pulse">Starting...</span>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Start Speaking Practice
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <p className="text-xs text-brand-dark/60 mb-3 text-center">Or pick a category for suggested topics:</p>
            <div className="flex flex-wrap justify-center gap-2 mb-4 sm:mb-6">
              {TOPIC_CATEGORIES.filter(c => c.id !== "custom").map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )}
                  className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? "bg-brand-primary text-white"
                      : "bg-white border border-brand-light/30 text-brand-dark/70 hover:border-brand-primary"
                  }`}
                >
                  {category.icon}
                  {category.label}
                </button>
              ))}
            </div>

            {selectedCategory && selectedCategory !== "custom" && (
              <div className="bg-white rounded-xl border border-brand-light/30 p-5">
                {isLoadingTopics ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
                    <span className="ml-2 text-sm text-brand-dark/60">Finding trending topics...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestedTopics.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-brand-dark/60">Trending topics:</p>
                        {suggestedTopics.map((topic, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedTopic(topic)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all ${
                              selectedTopic === topic
                                ? "bg-brand-primary text-white"
                                : "bg-brand-light/10 text-brand-dark hover:bg-brand-light/20"
                            }`}
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <div className="pt-3 border-t border-brand-light/20">
                      <p className="text-xs text-brand-dark/60 mb-2">Or add your own topic:</p>
                      <VoiceInputField
                        value={categoryCustomTopic}
                        onChange={(value) => {
                          setCategoryCustomTopic(value);
                          if (value.trim()) {
                            setSelectedTopic(value);
                          } else {
                            setSelectedTopic(null);
                          }
                        }}
                        placeholder="Type or speak your topic..."
                        language={voiceInputLanguage}
                        onLanguageChange={handleLanguageChange}
                        showLanguagePicker={true}
                      />
                    </div>
                  </div>
                )}

                {selectedTopic && (
                  <div className="mt-5 pt-5 border-t border-brand-light/20 space-y-3">
                    {sessionLanguage.code !== "en" && (
                      <p className="text-center text-sm text-brand-dark/70">
                        Session will be in <span className="font-medium text-brand-primary">{sessionLanguage.name}</span>
                      </p>
                    )}
                    <Button
                      onClick={handleStartConversation}
                      disabled={isStarting || avatarsLoading}
                      className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white py-3"
                    >
                      {isStarting ? (
                        <span className="animate-pulse">Starting...</span>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Start Discussion
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-10 text-center hidden sm:block">
            <button
              onClick={() => navigate("/avatar/dashboard")}
              className="text-sm text-brand-primary hover:text-brand-dark"
            >
              View practice history
            </button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
