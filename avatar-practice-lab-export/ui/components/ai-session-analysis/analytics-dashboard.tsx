import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { 
  MessageSquare, 
  Clock, 
  TrendingUp, 
  Mic,
  Target,
  Award,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { SkillAssessmentDisplay } from "./skill-assessment-display";

interface TopicInsight {
  keyFacts: string[];
  differentPerspectives: Array<{
    viewpoint: string;
    explanation: string;
  }>;
  thingsToConsider: string[];
  sources: Array<{
    title: string;
    url: string;
  }>;
  summary: string;
}

interface AnalyticsDashboardProps {
  analysis?: any;
  transcript?: any;
  transcriptMessages?: any;
  sessionData?: any;
  skillAssessments?: {
    summary: any[];
    dimensions: any[];
  };
  topicInsights?: TopicInsight | null;
}

export function AnalyticsDashboard({ 
  analysis, 
  transcript, 
  transcriptMessages,
  sessionData,
  skillAssessments,
  topicInsights
}: AnalyticsDashboardProps) {
  const data = analysis || sessionData?.analytics || sessionData;
  const skillData = skillAssessments || sessionData?.skillAssessments || data?.skillAssessments;
  const messages = transcriptMessages?.messages || sessionData?.transcript || transcript?.messages || [];
  
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading analysis...</p>
        </CardContent>
      </Card>
    );
  }

  const overallScore = data.overallScore || 0;
  const userTalkPercentage = data.userTalkPercentage || data.talkTime?.userPercentage || 0;
  const userTalkTime = data.userTalkTime || data.talkTime?.userTime || 0;
  const otherTalkTime = data.otherTalkTime || data.talkTime?.otherTime || 0;
  const questionsAsked = data.questionsAsked || data.listening?.questionsAsked || 0;
  const engagementLevel = data.engagementLevel || data.listening?.engagementLevel || 0;
  const activeListening = data.activeListening || data.listening?.activeListening || false;
  const acknowledgments = data.acknowledgments || data.listening?.acknowledgments || 0;
  const interruptions = data.interruptions || data.listening?.interruptions || 0;
  const averagePacing = data.averagePacing || data.delivery?.averagePacing || 0;
  const tone = data.tone || data.delivery?.tone || [];
  const pauseCount = data.pauseCount || data.delivery?.pauseCount || 0;
  const averagePauseLength = data.averagePauseLength || data.delivery?.averagePauseLength || 0;
  const fillerWords = data.fillerWords || data.wordChoice?.fillerWords || [];
  const weakWords = data.weakWords || data.wordChoice?.weakWords || [];
  const sentenceOpeners = data.sentenceOpeners || data.wordChoice?.sentenceOpeners || [];
  const strengths = data.strengths || data.feedback?.strengths || [];
  const growthAreas = data.growthAreas || data.feedback?.growthAreas || [];
  const followUpQuestions = data.followUpQuestions || data.feedback?.followUpQuestions || [];
  const summary = data.summary || data.feedback?.summary || "";
  const pronunciationIssues = data.pronunciationIssues || data.feedback?.pronunciation?.issues || [];
  const pronunciationSuggestions = data.pronunciationSuggestions || data.feedback?.pronunciation?.suggestions || [];
  const pacingVariation = data.pacingVariation || data.delivery?.pacingVariation || [];

  const talkTimeData = [
    { name: "You", value: userTalkTime, fill: "#3b82f6" },
    { name: "Avatar", value: otherTalkTime, fill: "#e5e7eb" },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return "bg-green-100 border-green-200";
    if (score >= 6) return "bg-yellow-100 border-yellow-200";
    return "bg-red-100 border-red-200";
  };

  const getScoreRing = (score: number) => {
    if (score >= 8) return "ring-green-500";
    if (score >= 6) return "ring-yellow-500";
    return "ring-red-500";
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero Section - Score + Summary */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Overall Score Card */}
        <Card className={`${getScoreBg(overallScore)} border-2`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ring-4 ${getScoreRing(overallScore)} bg-white`}>
                <span className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Overall Score</h3>
                <p className="text-sm text-muted-foreground">Based on your conversation performance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card - spans 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-blue-500" />
              Session Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{summary || "No summary available."}</p>
          </CardContent>
        </Card>
      </div>

      {/* Skill Framework Assessment - Prominent Position */}
      {skillData && skillData.summary && skillData.summary.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Skill Assessment Results</h2>
            <Badge variant="secondary" className="ml-2">Detailed Analysis</Badge>
          </div>
          <SkillAssessmentDisplay 
            summary={skillData.summary} 
            dimensions={skillData.dimensions || []} 
          />
        </div>
      )}

      {/* Topic Insights - Knowledge Enrichment for Impromptu Sessions */}
      {topicInsights && (
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-indigo-800">
              <BookOpen className="w-5 h-5" />
              Learn More About This Topic
              <Sparkles className="w-4 h-4 text-amber-500" />
            </CardTitle>
            <p className="text-sm text-indigo-600">
              Broaden your knowledge with facts and perspectives from authoritative sources
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            {topicInsights.summary && (
              <div className="p-3 bg-white/60 rounded-lg border border-indigo-100">
                <p className="text-sm text-gray-700 leading-relaxed">{topicInsights.summary}</p>
              </div>
            )}

            {/* Key Facts */}
            {topicInsights.keyFacts && topicInsights.keyFacts.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-indigo-700 mb-2 flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  Key Facts
                </h4>
                <ul className="space-y-2">
                  {topicInsights.keyFacts.map((fact, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-indigo-500 mt-0.5">•</span>
                      <span className="text-gray-700">{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Different Perspectives */}
            {topicInsights.differentPerspectives && topicInsights.differentPerspectives.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-indigo-700 mb-2 flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  Different Perspectives
                </h4>
                <div className="space-y-2">
                  {topicInsights.differentPerspectives.map((perspective, index) => (
                    <div key={index} className="p-2 bg-white/60 rounded border-l-2 border-indigo-300">
                      <span className="font-medium text-indigo-600 text-sm">{perspective.viewpoint}:</span>
                      <p className="text-sm text-gray-600 mt-0.5">{perspective.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Things to Consider */}
            {topicInsights.thingsToConsider && topicInsights.thingsToConsider.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-indigo-700 mb-2 flex items-center gap-1">
                  <Lightbulb className="w-4 h-4" />
                  Things to Consider
                </h4>
                <ul className="space-y-1">
                  {topicInsights.thingsToConsider.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-amber-500 mt-0.5">→</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sources */}
            {topicInsights.sources && topicInsights.sources.length > 0 && (
              <div className="pt-2 border-t border-indigo-100">
                <h4 className="font-semibold text-xs text-indigo-600 mb-2 uppercase tracking-wide">
                  Sources for Further Reading
                </h4>
                <div className="flex flex-wrap gap-2">
                  {topicInsights.sources.slice(0, 4).map((source, index) => (
                    <a
                      key={index}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:underline bg-white/80 px-2 py-1 rounded border border-indigo-100"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {source.title.length > 40 ? source.title.substring(0, 40) + "..." : source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{Math.round(userTalkPercentage)}%</div>
            <div className="text-xs text-muted-foreground">Talk Time</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{questionsAsked}</div>
            <div className="text-xs text-muted-foreground">Questions</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{engagementLevel}/10</div>
            <div className="text-xs text-muted-foreground">Engagement</div>
          </CardContent>
        </Card>
        <Card className="bg-cyan-50 border-cyan-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-cyan-600">{averagePacing}</div>
            <div className="text-xs text-muted-foreground">WPM</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{acknowledgments}</div>
            <div className="text-xs text-muted-foreground">Acks</div>
          </CardContent>
        </Card>
        <Card className={interruptions > 0 ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${interruptions > 0 ? "text-red-600" : "text-green-600"}`}>{interruptions}</div>
            <div className="text-xs text-muted-foreground">Interrupts</div>
          </CardContent>
        </Card>
      </div>

      {/* Strengths & Growth - Side by Side */}
      <div className="grid md:grid-cols-2 gap-4">
        {strengths.length > 0 && (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-4 h-4" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1">
                {strengths.map((strength: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {growthAreas.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                <TrendingUp className="w-4 h-4" />
                Areas for Growth
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1">
                {growthAreas.map((area: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Collapsible Detailed Analysis */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Detailed Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {/* Talk Time & Listening */}
            <AccordionItem value="talk-time">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Talk Time & Listening
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-2 gap-4 pt-2">
                  <div className="h-40 overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={talkTimeData}
                          innerRadius={35}
                          outerRadius={55}
                          paddingAngle={4}
                          dataKey="value"
                          label={({ value }) => `${value}s`}
                        >
                          {talkTimeData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} seconds`} />
                        <Legend verticalAlign="bottom" height={20} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 min-w-0">
                    <div className="flex justify-between items-center p-2 bg-muted rounded text-sm gap-2">
                      <span className="truncate">Active Listening</span>
                      <Badge variant={activeListening ? "default" : "secondary"} className="text-xs flex-shrink-0">
                        {activeListening ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded text-sm gap-2">
                      <span className="truncate">Questions Asked</span>
                      <span className="font-semibold flex-shrink-0 min-w-[2rem] text-right">{questionsAsked}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded text-sm gap-2">
                      <span className="truncate">Acknowledgments</span>
                      <span className="font-semibold flex-shrink-0 min-w-[2rem] text-right">{acknowledgments}</span>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Delivery */}
            <AccordionItem value="delivery">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Delivery & Pacing
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="text-center p-3 bg-muted rounded">
                    <div className="text-xl font-bold">{averagePacing}</div>
                    <div className="text-xs text-muted-foreground">Avg WPM</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded">
                    <div className="text-xl font-bold">{pauseCount}</div>
                    <div className="text-xs text-muted-foreground">Pauses</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded">
                    <div className="text-xl font-bold">{averagePauseLength.toFixed(1)}s</div>
                    <div className="text-xs text-muted-foreground">Avg Pause</div>
                  </div>
                </div>
                {Array.isArray(tone) && tone.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium mb-2">Tone:</p>
                    <div className="flex flex-wrap gap-1">
                      {tone.map((t: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {Array.isArray(pacingVariation) && pacingVariation.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium mb-2">Pacing Trend</p>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={pacingVariation}>
                          <XAxis dataKey="segment" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                          <Tooltip formatter={(value) => `${value} WPM`} />
                          <Line 
                            type="monotone" 
                            dataKey="wpm" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Word Choice */}
            <AccordionItem value="word-choice">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Word Choice
                  {(fillerWords.length > 0 || weakWords.length > 0) && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {fillerWords.length + weakWords.length} items
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs font-medium mb-2">Filler Words</p>
                    {fillerWords.length > 0 ? (
                      <div className="space-y-1">
                        {fillerWords.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center p-2 bg-red-50 rounded text-sm">
                            <span className="text-red-700">"{item.word}"</span>
                            <Badge variant="destructive" className="text-xs">{item.count}x</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-green-600">No filler words detected</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-2">Weak Words</p>
                    {weakWords.length > 0 ? (
                      <div className="space-y-1">
                        {weakWords.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center p-2 bg-yellow-50 rounded text-sm">
                            <span className="text-yellow-700">"{item.word}"</span>
                            <Badge variant="outline" className="text-xs">{item.count}x</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-green-600">Great word choice</p>
                    )}
                  </div>
                </div>
                {sentenceOpeners.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium mb-2">Common Sentence Openers</p>
                    <div className="flex flex-wrap gap-1">
                      {sentenceOpeners.slice(0, 5).map((item: any, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {item.opener?.substring(0, 20)}... ({item.count}x)
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Follow-up Questions & Pronunciation */}
            {(followUpQuestions.length > 0 || pronunciationIssues.length > 0 || pronunciationSuggestions.length > 0) && (
              <AccordionItem value="suggestions">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Suggestions & Feedback
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {followUpQuestions.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-2">Suggested Follow-up Questions</p>
                        <ul className="space-y-1">
                          {followUpQuestions.map((question: string, index: number) => (
                            <li key={index} className="p-2 bg-blue-50 rounded text-sm text-blue-800">
                              {question}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(pronunciationIssues.length > 0 || pronunciationSuggestions.length > 0) && (
                      <div>
                        <p className="text-xs font-medium mb-2">Pronunciation Feedback</p>
                        {pronunciationIssues.length > 0 && pronunciationIssues[0] !== "None" && (
                          <div className="mb-2">
                            <p className="text-xs text-red-600 mb-1">Issues:</p>
                            <ul className="list-disc pl-4 space-y-1 text-sm">
                              {pronunciationIssues.map((issue: string, i: number) => (
                                <li key={i}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {pronunciationSuggestions.length > 0 && (
                          <div>
                            <p className="text-xs text-blue-600 mb-1">Suggestions:</p>
                            <ul className="list-disc pl-4 space-y-1 text-sm">
                              {pronunciationSuggestions.map((sugg: string, i: number) => (
                                <li key={i}>{sugg}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Transcript */}
            {messages.length > 0 && (
              <AccordionItem value="transcript">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Session Transcript
                    <Badge variant="secondary" className="ml-2 text-xs">{messages.length} messages</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="max-h-80 overflow-y-auto space-y-3 pt-2">
                    {messages.map((msg: any, i: number) => {
                      const isUser = msg.speaker?.toLowerCase() === "user" || msg.speaker?.toLowerCase() === "you";
                      return (
                        <div
                          key={i}
                          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                              isUser
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <p>{msg.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
