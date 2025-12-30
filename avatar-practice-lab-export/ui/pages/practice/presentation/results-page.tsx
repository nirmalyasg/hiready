import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import ModernDashboardLayout from "@/components/layout/modern-dashboard-layout";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  ChevronRight,
  MessageCircle,
  Target,
  Presentation,
  Lightbulb,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Mic,
  BarChart3,
  Brain,
  FileText,
  Users,
  Zap,
  Layout,
  ListChecks,
  Award,
  TrendingUp
} from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

// Skill dimension assessment for Skill ID 104
interface SkillDimensionAssessment {
  dimensionName: string;
  score: number;
  maxScore: number;
  feedback: string;
  behavioralEvidence: string[];
  improvementSuggestions: string[];
}

interface PresentationSkillAssessment {
  skillId: number;
  skillName: string;
  overallScore: number;
  dimensions: {
    messageStructureClarity: SkillDimensionAssessment;
    audienceAwareness: SkillDimensionAssessment;
    deliveryPresence: SkillDimensionAssessment;
    engagementInteraction: SkillDimensionAssessment;
    responsivenessAdaptability: SkillDimensionAssessment;
  };
  summary: string;
  keyStrengths: string[];
  developmentPriorities: string[];
}

// Document analysis feedback - detailed slide-by-slide review
interface SlideIssue {
  category: "text_density" | "structure" | "clarity" | "hierarchy" | "consistency" | "missing_content" | "redundancy";
  severity: "high" | "medium" | "low";
  description: string;
  location: string;
  currentText: string;
  suggestedFix: string;
}

interface RewriteSuggestion {
  element: string;
  current: string;
  suggested: string;
  rationale: string;
}

interface SlideAnalysis {
  slideNumber: number;
  title: string;
  slideType?: "title" | "content" | "section_break" | "data" | "summary" | "agenda";
  overallScore?: number;
  structureScore?: number;
  clarityScore?: number;
  feedback?: string;
  issues?: SlideIssue[];
  strengths?: string[];
  suggestions?: string[];
  rewriteSuggestions?: RewriteSuggestion[];
  designTips?: string[];
}

interface CrossSlidePattern {
  pattern: string;
  frequency: string;
  recommendation: string;
}

interface DocumentAnalysisFeedback {
  overallScore: number;
  executiveSummary?: string;
  structureAnalysis: {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  };
  clarityAnalysis: {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  };
  headingsAnalysis: {
    score: number;
    feedback: string;
    suggestions: string[];
  };
  contentOrganization: {
    score: number;
    feedback: string;
    suggestions: string[];
  };
  visualHierarchy: {
    score: number;
    feedback: string;
    suggestions: string[];
  };
  slideBySlideAnalysis: SlideAnalysis[];
  crossSlidePatterns?: CrossSlidePattern[];
  summary: string;
  topRecommendations: string[];
}

interface PresentationFeedback {
  id: number;
  sessionId: number;
  presentationScenarioId: number;
  overallScore: number;
  communicationScore: number;
  communicationFeedback: string;
  deliveryScore: number;
  deliveryFeedback: string;
  subjectMatterScore: number;
  subjectMatterFeedback: string;
  slideCoverage: { slideNumber: number; covered: boolean; notes: string }[];
  strengths: string[];
  improvements: string[];
  summary: string;
}

interface PresentationScenario {
  id: number;
  title: string;
  topic: string;
  fileName: string;
  totalSlides: number;
}

const getScoreColor = (score: number) => {
  if (score >= 4) return "text-green-600";
  if (score >= 2.5) return "text-amber-600";
  return "text-red-600";
};

const getScoreBgColor = (score: number) => {
  if (score >= 4) return "bg-green-100";
  if (score >= 2.5) return "bg-amber-100";
  return "bg-red-100";
};

const getProgressColor = (score: number) => {
  if (score >= 4) return "bg-green-500";
  if (score >= 2.5) return "bg-amber-500";
  return "bg-red-500";
};

const getSlideScore = (slide: SlideAnalysis): number => {
  if (slide.overallScore !== undefined) {
    return slide.overallScore <= 5 ? slide.overallScore * 20 : slide.overallScore;
  }
  if (slide.structureScore !== undefined && slide.clarityScore !== undefined) {
    return ((slide.structureScore + slide.clarityScore) / 2) * 20;
  }
  return 50;
};

const getSlideScoreColor = (score: number) => {
  if (score >= 70) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
};

export default function PresentationResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const presentationId = searchParams.get("presentationId");
  
  const [sessionFeedback, setSessionFeedback] = useState<any>(null);
  const [isLoadingFromApi, setIsLoadingFromApi] = useState(false);
  
  useEffect(() => {
    const loadFeedback = async () => {
      if (!sessionId) return;
      
      // First try sessionStorage (for freshly generated feedback)
      const stored = sessionStorage.getItem(`presentation_feedback_${sessionId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // If sessionStorage has skillAssessment/documentAnalysis, use it
          if (parsed.skillAssessment || parsed.documentAnalysis) {
            setSessionFeedback(parsed);
            return;
          }
        } catch (e) {
          console.error('Failed to parse stored feedback:', e);
        }
      }
      
      // Fall back to API (for returning to older sessions or when sessionStorage is incomplete)
      setIsLoadingFromApi(true);
      try {
        const response = await fetch(`/api/avatar/presentation-feedback/${sessionId}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSessionFeedback(data);
            return;
          }
        }
      } catch (e) {
        console.error('Failed to fetch feedback from API:', e);
      }
      
      // Last resort: use sessionStorage even without new assessments
      if (stored) {
        try {
          setSessionFeedback(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse stored feedback:', e);
        }
      }
      
      setIsLoadingFromApi(false);
    };
    
    loadFeedback();
  }, [sessionId]);

  const feedback = sessionFeedback?.feedback ? {
    id: 0,
    sessionId: 0,
    presentationScenarioId: parseInt(presentationId || '0'),
    overallScore: sessionFeedback.feedback.overallScore,
    communicationScore: sessionFeedback.feedback.communication?.score || 0,
    communicationFeedback: sessionFeedback.feedback.communication?.feedback || '',
    deliveryScore: sessionFeedback.feedback.delivery?.score || 0,
    deliveryFeedback: sessionFeedback.feedback.delivery?.feedback || '',
    subjectMatterScore: sessionFeedback.feedback.subjectMatter?.score || 0,
    subjectMatterFeedback: sessionFeedback.feedback.subjectMatter?.feedback || '',
    slideCoverage: sessionFeedback.feedback.slideCoverage || [],
    strengths: sessionFeedback.feedback.strengths || [],
    improvements: sessionFeedback.feedback.improvements || [],
    summary: sessionFeedback.feedback.summary || '',
  } as PresentationFeedback : null;

  const skillAssessment = sessionFeedback?.skillAssessment as PresentationSkillAssessment | null;
  const documentAnalysis = sessionFeedback?.documentAnalysis as DocumentAnalysisFeedback | null;
  
  const scenario = sessionFeedback ? {
    id: parseInt(presentationId || '0'),
    title: sessionFeedback.presentationTopic || 'Presentation',
    topic: sessionFeedback.presentationTopic || 'Presentation',
    fileName: '',
    totalSlides: sessionFeedback.totalSlides || 0,
  } as PresentationScenario : null;

  const isLoading = (!sessionFeedback && sessionId) || isLoadingFromApi;

  if (isLoading) {
    return (
      <ModernDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner className="h-12 w-12" />
        </div>
      </ModernDashboardLayout>
    );
  }

  if (!feedback) {
    return (
      <ModernDashboardLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Feedback Not Available</h2>
              <p className="text-gray-500 mb-6">
                The feedback for this session is still being generated or was not found.
              </p>
              <Button onClick={() => navigate("/avatar/practice")}>
                Back to Practice
              </Button>
            </CardContent>
          </Card>
        </div>
      </ModernDashboardLayout>
    );
  }

  const scorePercent = (score: number) => (score / 5) * 100;

  return (
    <ModernDashboardLayout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-5xl">
          <div className="mb-6">
            <Link
              to="/avatar/results"
              className="inline-flex items-center text-gray-500 hover:text-primary mb-4 text-sm font-medium transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
              Back to Results
            </Link>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-brand-light/20">
                <Presentation className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Presentation Feedback
                </h1>
                {scenario && (
                  <p className="text-gray-500">{scenario.title}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Overall Performance
                  </span>
                  <div className="text-3xl font-bold">
                    {feedback.overallScore.toFixed(1)}/5
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Progress 
                      value={scorePercent(feedback.overallScore)} 
                      className="flex-1 h-3"
                    />
                    <span className={`font-semibold ${getScoreColor(feedback.overallScore)}`}>
                      {feedback.overallScore >= 4 ? "Excellent" : feedback.overallScore >= 2.5 ? "Good" : "Needs Work"}
                    </span>
                  </div>
                  {feedback.summary && (
                    <p className="text-gray-600 mt-4 leading-relaxed">
                      {feedback.summary}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className={`p-1.5 rounded ${getScoreBgColor(feedback.communicationScore)}`}>
                      <MessageCircle className={`h-4 w-4 ${getScoreColor(feedback.communicationScore)}`} />
                    </div>
                    Communication
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{feedback.communicationScore.toFixed(1)}/5</div>
                  <Progress value={scorePercent(feedback.communicationScore)} className="h-2 mb-3" />
                  <p className="text-sm text-gray-600">{feedback.communicationFeedback}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className={`p-1.5 rounded ${getScoreBgColor(feedback.deliveryScore)}`}>
                      <Mic className={`h-4 w-4 ${getScoreColor(feedback.deliveryScore)}`} />
                    </div>
                    Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{feedback.deliveryScore.toFixed(1)}/5</div>
                  <Progress value={scorePercent(feedback.deliveryScore)} className="h-2 mb-3" />
                  <p className="text-sm text-gray-600">{feedback.deliveryFeedback}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className={`p-1.5 rounded ${getScoreBgColor(feedback.subjectMatterScore)}`}>
                      <BookOpen className={`h-4 w-4 ${getScoreColor(feedback.subjectMatterScore)}`} />
                    </div>
                    Subject Matter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{feedback.subjectMatterScore.toFixed(1)}/5</div>
                  <Progress value={scorePercent(feedback.subjectMatterScore)} className="h-2 mb-3" />
                  <p className="text-sm text-gray-600">{feedback.subjectMatterFeedback}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {feedback.strengths && feedback.strengths.length > 0 ? (
                    <ul className="space-y-2">
                      {feedback.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-green-500 mt-0.5">+</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">No specific strengths identified</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {feedback.improvements && feedback.improvements.length > 0 ? (
                    <ul className="space-y-2">
                      {feedback.improvements.map((improvement, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-amber-500 mt-0.5">!</span>
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">No specific improvements identified</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Skill Assessment Section - Skill ID 104 */}
            {skillAssessment && (
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Skill Assessment: {skillAssessment.skillName || "Effective Presentation & Communication"}
                    </span>
                    <div className="text-3xl font-bold">
                      {skillAssessment.overallScore.toFixed(1)}/5
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-600 mb-6">{skillAssessment.summary}</p>
                  
                  <Accordion type="multiple" className="space-y-2">
                    {/* Message Structure & Clarity */}
                    <AccordionItem value="messageStructure" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-2">
                            <Layout className="h-4 w-4 text-purple-600" />
                            <span className="font-medium">Message Structure & Clarity</span>
                          </div>
                          <span className={`text-sm font-bold ${getScoreColor(skillAssessment.dimensions.messageStructureClarity?.score || 0)}`}>
                            {(skillAssessment.dimensions.messageStructureClarity?.score || 0).toFixed(1)}/5
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <p className="text-gray-600 mb-3">{skillAssessment.dimensions.messageStructureClarity?.feedback}</p>
                        {skillAssessment.dimensions.messageStructureClarity?.behavioralEvidence?.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-semibold text-gray-700 mb-1">Evidence:</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {skillAssessment.dimensions.messageStructureClarity.behavioralEvidence.map((e, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-purple-500">•</span>
                                  <span className="italic">"{e}"</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {skillAssessment.dimensions.messageStructureClarity?.improvementSuggestions?.length > 0 && (
                          <div>
                            <h5 className="text-sm font-semibold text-gray-700 mb-1">Suggestions:</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {skillAssessment.dimensions.messageStructureClarity.improvementSuggestions.map((s, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-amber-500">→</span>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    {/* Audience Awareness */}
                    <AccordionItem value="audienceAwareness" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-600" />
                            <span className="font-medium">Audience Awareness</span>
                          </div>
                          <span className={`text-sm font-bold ${getScoreColor(skillAssessment.dimensions.audienceAwareness?.score || 0)}`}>
                            {(skillAssessment.dimensions.audienceAwareness?.score || 0).toFixed(1)}/5
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <p className="text-gray-600 mb-3">{skillAssessment.dimensions.audienceAwareness?.feedback}</p>
                        {skillAssessment.dimensions.audienceAwareness?.behavioralEvidence?.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-semibold text-gray-700 mb-1">Evidence:</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {skillAssessment.dimensions.audienceAwareness.behavioralEvidence.map((e, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-purple-500">•</span>
                                  <span className="italic">"{e}"</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {skillAssessment.dimensions.audienceAwareness?.improvementSuggestions?.length > 0 && (
                          <div>
                            <h5 className="text-sm font-semibold text-gray-700 mb-1">Suggestions:</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {skillAssessment.dimensions.audienceAwareness.improvementSuggestions.map((s, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-amber-500">→</span>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    {/* Delivery & Presence */}
                    <AccordionItem value="deliveryPresence" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-purple-600" />
                            <span className="font-medium">Delivery & Presence</span>
                          </div>
                          <span className={`text-sm font-bold ${getScoreColor(skillAssessment.dimensions.deliveryPresence?.score || 0)}`}>
                            {(skillAssessment.dimensions.deliveryPresence?.score || 0).toFixed(1)}/5
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <p className="text-gray-600 mb-3">{skillAssessment.dimensions.deliveryPresence?.feedback}</p>
                        {skillAssessment.dimensions.deliveryPresence?.behavioralEvidence?.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-semibold text-gray-700 mb-1">Evidence:</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {skillAssessment.dimensions.deliveryPresence.behavioralEvidence.map((e, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-purple-500">•</span>
                                  <span className="italic">"{e}"</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {skillAssessment.dimensions.deliveryPresence?.improvementSuggestions?.length > 0 && (
                          <div>
                            <h5 className="text-sm font-semibold text-gray-700 mb-1">Suggestions:</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {skillAssessment.dimensions.deliveryPresence.improvementSuggestions.map((s, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-amber-500">→</span>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    {/* Engagement & Interaction */}
                    <AccordionItem value="engagementInteraction" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-purple-600" />
                            <span className="font-medium">Engagement & Interaction</span>
                          </div>
                          <span className={`text-sm font-bold ${getScoreColor(skillAssessment.dimensions.engagementInteraction?.score || 0)}`}>
                            {(skillAssessment.dimensions.engagementInteraction?.score || 0).toFixed(1)}/5
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <p className="text-gray-600 mb-3">{skillAssessment.dimensions.engagementInteraction?.feedback}</p>
                        {skillAssessment.dimensions.engagementInteraction?.behavioralEvidence?.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-semibold text-gray-700 mb-1">Evidence:</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {skillAssessment.dimensions.engagementInteraction.behavioralEvidence.map((e, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-purple-500">•</span>
                                  <span className="italic">"{e}"</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {skillAssessment.dimensions.engagementInteraction?.improvementSuggestions?.length > 0 && (
                          <div>
                            <h5 className="text-sm font-semibold text-gray-700 mb-1">Suggestions:</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {skillAssessment.dimensions.engagementInteraction.improvementSuggestions.map((s, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-amber-500">→</span>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    {/* Responsiveness & Adaptability */}
                    <AccordionItem value="responsivenessAdaptability" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-purple-600" />
                            <span className="font-medium">Responsiveness & Adaptability</span>
                          </div>
                          <span className={`text-sm font-bold ${getScoreColor(skillAssessment.dimensions.responsivenessAdaptability?.score || 0)}`}>
                            {(skillAssessment.dimensions.responsivenessAdaptability?.score || 0).toFixed(1)}/5
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <p className="text-gray-600 mb-3">{skillAssessment.dimensions.responsivenessAdaptability?.feedback}</p>
                        {skillAssessment.dimensions.responsivenessAdaptability?.behavioralEvidence?.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-semibold text-gray-700 mb-1">Evidence:</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {skillAssessment.dimensions.responsivenessAdaptability.behavioralEvidence.map((e, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-purple-500">•</span>
                                  <span className="italic">"{e}"</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {skillAssessment.dimensions.responsivenessAdaptability?.improvementSuggestions?.length > 0 && (
                          <div>
                            <h5 className="text-sm font-semibold text-gray-700 mb-1">Suggestions:</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {skillAssessment.dimensions.responsivenessAdaptability.improvementSuggestions.map((s, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-amber-500">→</span>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* Key Strengths & Development Priorities */}
                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-800 flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4" /> Key Strengths
                      </h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        {skillAssessment.keyStrengths?.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span>+</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg">
                      <h4 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4" /> Development Priorities
                      </h4>
                      <ul className="text-sm text-amber-700 space-y-1">
                        {skillAssessment.developmentPriorities?.map((p, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span>!</span> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Document Analysis Section */}
            {documentAnalysis && (
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Document Analysis
                    </span>
                    <div className="text-3xl font-bold">
                      {documentAnalysis.overallScore.toFixed(1)}/5
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-600 mb-6">{documentAnalysis.summary}</p>

                  {/* Analysis Score Cards */}
                  <div className="grid md:grid-cols-5 gap-3 mb-6">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className={`text-xl font-bold ${getScoreColor(documentAnalysis.structureAnalysis?.score || 0)}`}>
                        {(documentAnalysis.structureAnalysis?.score || 0).toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">Structure</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className={`text-xl font-bold ${getScoreColor(documentAnalysis.clarityAnalysis?.score || 0)}`}>
                        {(documentAnalysis.clarityAnalysis?.score || 0).toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">Clarity</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className={`text-xl font-bold ${getScoreColor(documentAnalysis.headingsAnalysis?.score || 0)}`}>
                        {(documentAnalysis.headingsAnalysis?.score || 0).toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">Headings</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className={`text-xl font-bold ${getScoreColor(documentAnalysis.contentOrganization?.score || 0)}`}>
                        {(documentAnalysis.contentOrganization?.score || 0).toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">Organization</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className={`text-xl font-bold ${getScoreColor(documentAnalysis.visualHierarchy?.score || 0)}`}>
                        {(documentAnalysis.visualHierarchy?.score || 0).toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">Visual</div>
                    </div>
                  </div>

                  <Accordion type="multiple" className="space-y-2">
                    {/* Structure Analysis */}
                    <AccordionItem value="structureAnalysis" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Layout className="h-4 w-4 text-teal-600" />
                          <span className="font-medium">Structure Analysis</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <p className="text-gray-600 mb-3">{documentAnalysis.structureAnalysis?.feedback}</p>
                        {documentAnalysis.structureAnalysis?.strengths?.length > 0 && (
                          <div className="mb-2">
                            <span className="text-sm font-semibold text-green-700">Strengths: </span>
                            <span className="text-sm text-gray-600">{documentAnalysis.structureAnalysis.strengths.join("; ")}</span>
                          </div>
                        )}
                        {documentAnalysis.structureAnalysis?.improvements?.length > 0 && (
                          <div>
                            <span className="text-sm font-semibold text-amber-700">To Improve: </span>
                            <span className="text-sm text-gray-600">{documentAnalysis.structureAnalysis.improvements.join("; ")}</span>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    {/* Clarity Analysis */}
                    <AccordionItem value="clarityAnalysis" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-teal-600" />
                          <span className="font-medium">Clarity Analysis</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <p className="text-gray-600 mb-3">{documentAnalysis.clarityAnalysis?.feedback}</p>
                        {documentAnalysis.clarityAnalysis?.strengths?.length > 0 && (
                          <div className="mb-2">
                            <span className="text-sm font-semibold text-green-700">Strengths: </span>
                            <span className="text-sm text-gray-600">{documentAnalysis.clarityAnalysis.strengths.join("; ")}</span>
                          </div>
                        )}
                        {documentAnalysis.clarityAnalysis?.improvements?.length > 0 && (
                          <div>
                            <span className="text-sm font-semibold text-amber-700">To Improve: </span>
                            <span className="text-sm text-gray-600">{documentAnalysis.clarityAnalysis.improvements.join("; ")}</span>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    {/* Headings & Content Organization */}
                    <AccordionItem value="headingsOrganization" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <ListChecks className="h-4 w-4 text-teal-600" />
                          <span className="font-medium">Headings & Content Organization</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <div className="mb-4">
                          <h5 className="text-sm font-semibold mb-1">Headings:</h5>
                          <p className="text-gray-600 text-sm mb-2">{documentAnalysis.headingsAnalysis?.feedback}</p>
                          {documentAnalysis.headingsAnalysis?.suggestions?.length > 0 && (
                            <ul className="text-sm text-gray-600 space-y-1">
                              {documentAnalysis.headingsAnalysis.suggestions.map((s, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-teal-500">→</span> {s}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold mb-1">Content Organization:</h5>
                          <p className="text-gray-600 text-sm mb-2">{documentAnalysis.contentOrganization?.feedback}</p>
                          {documentAnalysis.contentOrganization?.suggestions?.length > 0 && (
                            <ul className="text-sm text-gray-600 space-y-1">
                              {documentAnalysis.contentOrganization.suggestions.map((s, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-teal-500">→</span> {s}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Visual Hierarchy */}
                    <AccordionItem value="visualHierarchy" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Layout className="h-4 w-4 text-teal-600" />
                          <span className="font-medium">Visual Hierarchy</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <p className="text-gray-600 mb-2">{documentAnalysis.visualHierarchy?.feedback}</p>
                        {documentAnalysis.visualHierarchy?.suggestions?.length > 0 && (
                          <ul className="text-sm text-gray-600 space-y-1">
                            {documentAnalysis.visualHierarchy.suggestions.map((s, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-teal-500">→</span> {s}
                              </li>
                            ))}
                          </ul>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    {/* Slide-by-Slide Analysis */}
                    {documentAnalysis.slideBySlideAnalysis?.length > 0 && (
                      <AccordionItem value="slideBySlide" className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-teal-600" />
                            <span className="font-medium">Slide-by-Slide Review ({documentAnalysis.slideBySlideAnalysis.length} slides)</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                          <div className="space-y-4">
                            {documentAnalysis.slideBySlideAnalysis.map((slide) => {
                              const slideScore = getSlideScore(slide);
                              return (
                              <div key={slide.slideNumber} className="border rounded-lg p-4 bg-gray-50">
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <span className="font-semibold text-gray-800">Slide {slide.slideNumber}: </span>
                                    <span className="text-gray-600">{slide.title || "Untitled"}</span>
                                    {slide.slideType && <span className="ml-2 text-xs px-2 py-0.5 bg-gray-200 rounded">{slide.slideType}</span>}
                                  </div>
                                  <div className={`text-lg font-bold ${getSlideScoreColor(slideScore)}`}>
                                    {slideScore}/100
                                  </div>
                                </div>

                                {/* Legacy feedback display for old format */}
                                {slide.feedback && !slide.issues?.length && (
                                  <p className="text-gray-600 mb-2 text-sm">{slide.feedback}</p>
                                )}

                                {/* Legacy suggestions for old format */}
                                {slide.suggestions && slide.suggestions.length > 0 && !slide.issues?.length && (
                                  <div className="mb-3">
                                    <h6 className="text-xs font-semibold text-teal-700 uppercase mb-1">Suggestions</h6>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                      {slide.suggestions.map((s, i) => (
                                        <li key={i} className="flex items-start gap-1">
                                          <span className="text-teal-500">→</span> {s}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Issues */}
                                {(slide.issues?.length ?? 0) > 0 && (
                                  <div className="mb-3">
                                    <h6 className="text-xs font-semibold text-red-700 uppercase mb-1">Issues Found</h6>
                                    <div className="space-y-2">
                                      {slide.issues?.map((issue, i) => (
                                        <div key={i} className={`p-2 rounded text-sm ${issue.severity === 'high' ? 'bg-red-50 border-l-2 border-red-500' : issue.severity === 'medium' ? 'bg-amber-50 border-l-2 border-amber-500' : 'bg-gray-100 border-l-2 border-gray-400'}`}>
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-semibold uppercase ${issue.severity === 'high' ? 'text-red-600' : issue.severity === 'medium' ? 'text-amber-600' : 'text-gray-600'}`}>{issue.severity}</span>
                                            <span className="text-xs text-gray-500">• {issue.category.replace('_', ' ')}</span>
                                            <span className="text-xs text-gray-400">@ {issue.location}</span>
                                          </div>
                                          <p className="text-gray-700">{issue.description}</p>
                                          {issue.currentText && (
                                            <div className="mt-1 text-xs">
                                              <span className="text-gray-500">Current: </span>
                                              <span className="text-gray-600 italic">"{issue.currentText}"</span>
                                            </div>
                                          )}
                                          {issue.suggestedFix && (
                                            <div className="mt-1 text-xs">
                                              <span className="text-green-600 font-semibold">Fix: </span>
                                              <span className="text-green-700">"{issue.suggestedFix}"</span>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Rewrite Suggestions */}
                                {(slide.rewriteSuggestions?.length ?? 0) > 0 && (
                                  <div className="mb-3">
                                    <h6 className="text-xs font-semibold text-blue-700 uppercase mb-1">Suggested Rewrites</h6>
                                    <div className="space-y-2">
                                      {slide.rewriteSuggestions?.map((rewrite, i) => (
                                        <div key={i} className="p-2 bg-blue-50 rounded text-sm">
                                          <div className="font-medium text-blue-800 mb-1">{rewrite.element}</div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div>
                                              <span className="text-xs text-gray-500 block">Before:</span>
                                              <span className="text-gray-600 line-through text-xs">{rewrite.current}</span>
                                            </div>
                                            <div>
                                              <span className="text-xs text-green-600 block">After:</span>
                                              <span className="text-green-700 font-medium text-xs">{rewrite.suggested}</span>
                                            </div>
                                          </div>
                                          {rewrite.rationale && (
                                            <div className="mt-1 text-xs text-blue-600 italic">Why: {rewrite.rationale}</div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Strengths */}
                                {(slide.strengths?.length ?? 0) > 0 && (
                                  <div className="mb-2">
                                    <h6 className="text-xs font-semibold text-green-700 uppercase mb-1">Strengths</h6>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                      {slide.strengths?.map((s, i) => (
                                        <li key={i} className="flex items-start gap-1">
                                          <span className="text-green-500">✓</span> {s}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Design Tips */}
                                {(slide.designTips?.length ?? 0) > 0 && (
                                  <div>
                                    <h6 className="text-xs font-semibold text-purple-700 uppercase mb-1">Design Tips</h6>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                      {slide.designTips?.map((tip, i) => (
                                        <li key={i} className="flex items-start gap-1">
                                          <span className="text-purple-500">💡</span> {tip}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>

                  {/* Cross-Slide Patterns */}
                  {(documentAnalysis.crossSlidePatterns?.length ?? 0) > 0 && (
                    <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                      <h4 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4" /> Patterns Across Multiple Slides
                      </h4>
                      <div className="space-y-2">
                        {documentAnalysis.crossSlidePatterns?.map((p, i) => (
                          <div key={i} className="text-sm">
                            <span className="font-medium text-amber-700">{p.pattern}</span>
                            <span className="text-gray-500 ml-2">({p.frequency})</span>
                            <p className="text-gray-600 ml-4">→ {p.recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Executive Summary */}
                  {documentAnalysis.executiveSummary && (
                    <div className="mt-4 p-4 bg-teal-100 rounded-lg border border-teal-200">
                      <h4 className="font-semibold text-teal-800 mb-2">Key Insight</h4>
                      <p className="text-teal-700">{documentAnalysis.executiveSummary}</p>
                    </div>
                  )}

                  {/* Top Recommendations */}
                  {documentAnalysis.topRecommendations?.length > 0 && (
                    <div className="mt-4 p-4 bg-teal-50 rounded-lg">
                      <h4 className="font-semibold text-teal-800 flex items-center gap-2 mb-3">
                        <Target className="h-4 w-4" /> Top Recommendations to Improve This Document
                      </h4>
                      <ol className="text-sm text-teal-700 space-y-2">
                        {documentAnalysis.topRecommendations.map((r, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="font-bold">{i + 1}.</span> {r}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-center gap-4 mt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/avatar/results")}
              >
                View All Results
              </Button>
              <Button
                onClick={() => navigate("/avatar/practice")}
              >
                Practice Again
              </Button>
            </div>
          </div>
        </div>
      </div>
      <MobileBottomNav />
    </ModernDashboardLayout>
  );
}
