import OpenAI from "openai";
import { trackOpenAIUsage } from "../utils/api-usage-tracker.js";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const PresentationFeedbackSchema = {
    type: "object",
    additionalProperties: false,
    required: ["overallScore", "communication", "delivery", "subjectMatter", "slideCoverage", "strengths", "improvements", "summary"],
    properties: {
        overallScore: { type: "number" },
        communication: {
            type: "object",
            additionalProperties: false,
            required: ["name", "score", "maxScore", "feedback", "evidence"],
            properties: {
                name: { type: "string" },
                score: { type: "number" },
                maxScore: { type: "number" },
                feedback: { type: "string" },
                evidence: { type: "array", items: { type: "string" } }
            }
        },
        delivery: {
            type: "object",
            additionalProperties: false,
            required: ["name", "score", "maxScore", "feedback", "evidence"],
            properties: {
                name: { type: "string" },
                score: { type: "number" },
                maxScore: { type: "number" },
                feedback: { type: "string" },
                evidence: { type: "array", items: { type: "string" } }
            }
        },
        subjectMatter: {
            type: "object",
            additionalProperties: false,
            required: ["name", "score", "maxScore", "feedback", "evidence"],
            properties: {
                name: { type: "string" },
                score: { type: "number" },
                maxScore: { type: "number" },
                feedback: { type: "string" },
                evidence: { type: "array", items: { type: "string" } }
            }
        },
        slideCoverage: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                required: ["slideNumber", "slideTitle", "covered", "coveragePercentage", "keyPointsMentioned", "keyPointsMissed"],
                properties: {
                    slideNumber: { type: "number" },
                    slideTitle: { type: "string" },
                    covered: { type: "boolean" },
                    coveragePercentage: { type: "number" },
                    keyPointsMentioned: { type: "array", items: { type: "string" } },
                    keyPointsMissed: { type: "array", items: { type: "string" } }
                }
            }
        },
        strengths: { type: "array", items: { type: "string" } },
        improvements: { type: "array", items: { type: "string" } },
        summary: { type: "string" }
    }
};
export async function generatePresentationFeedback(transcript, presentationData, topic) {
    console.log("[Feedback Gen] Starting with topic:", topic);
    console.log("[Feedback Gen] Slides:", presentationData.slides?.length || 0);
    console.log("[Feedback Gen] Transcript length:", transcript?.length || 0);
    // Limit slide summary to first 30 slides for very large presentations
    const maxSlides = Math.min(presentationData.slides?.length || 0, 30);
    const slideSummary = presentationData.slides?.slice(0, maxSlides).map(s => `Slide ${s.slideNumber}: "${s.title}" - Key points: ${s.bulletPoints?.join(", ") || "No bullet points"}`).join("\n") || "No slides available";
    // Limit extracted text to ~30KB to avoid token limits
    const maxTextLength = 30000;
    const extractedText = presentationData.extractedText?.substring(0, maxTextLength) || "No content extracted";
    const textWasTruncated = (presentationData.extractedText?.length || 0) > maxTextLength;
    console.log("[Feedback Gen] Using", maxSlides, "slides, text truncated:", textWasTruncated);
    const prompt = `You are an expert presentation coach analyzing a practice presentation session.

PRESENTATION CONTENT (what the presenter should have covered):
Topic: ${topic}
${slideSummary}

Full slide content${textWasTruncated ? " (truncated for length)" : ""}:
${extractedText}

TRANSCRIPT OF THE PRACTICE SESSION:
${transcript || "No transcript recorded - presenter may have had audio issues"}

Analyze the presenter's performance and provide detailed feedback on:

1. COMMUNICATION (score 0-5):
   - Clarity of speech and explanations
   - Pacing and rhythm
   - Use of filler words
   - Confidence in delivery

2. PRESENTATION DELIVERY (score 0-5):
   - How well they followed the slide structure
   - Transitions between topics
   - Engagement with the audience (asking/answering questions)
   - Opening and closing effectiveness

3. SUBJECT MATTER ACCURACY (score 0-5):
   - How accurately they explained the slide content
   - Whether key points were covered
   - Any factual errors or contradictions
   - Depth of understanding demonstrated

4. SLIDE COVERAGE:
   For each slide, identify:
   - Whether it was covered
   - Percentage of key points mentioned
   - What was mentioned vs missed

Provide specific evidence from the transcript for all feedback.`;
    try {
        console.log("[Feedback Gen] Calling OpenAI...");
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.1,
            max_tokens: 4000,
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "presentation_feedback",
                    strict: true,
                    schema: PresentationFeedbackSchema,
                },
            },
            messages: [
                {
                    role: "system",
                    content: "You are an expert presentation coach. Analyze the presentation practice session and provide detailed, actionable feedback. Output ONLY valid JSON matching the schema.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });
        console.log("[Feedback Gen] OpenAI response received");
        // Track OpenAI usage
        const usage = completion.usage;
        if (usage) {
            await trackOpenAIUsage("presentation_feedback", "gpt-4o", usage.prompt_tokens || 0, usage.completion_tokens || 0);
        }
        const msg = completion.choices[0]?.message?.content?.trim();
        if (!msg) {
            console.error("[Feedback Gen] No response content");
            return null;
        }
        console.log("[Feedback Gen] Parsing response...");
        return JSON.parse(msg);
    }
    catch (error) {
        console.error("[Feedback Gen] Error:", error?.message || error);
        return null;
    }
}
// JSON Schema for Skill-based Assessment (Skill ID 104)
const SkillDimensionSchema = {
    type: "object",
    additionalProperties: false,
    required: ["dimensionName", "score", "maxScore", "feedback", "behavioralEvidence", "improvementSuggestions"],
    properties: {
        dimensionName: { type: "string" },
        score: { type: "number" },
        maxScore: { type: "number" },
        feedback: { type: "string" },
        behavioralEvidence: { type: "array", items: { type: "string" } },
        improvementSuggestions: { type: "array", items: { type: "string" } }
    }
};
const PresentationSkillAssessmentSchema = {
    type: "object",
    additionalProperties: false,
    required: ["skillId", "skillName", "overallScore", "dimensions", "summary", "keyStrengths", "developmentPriorities"],
    properties: {
        skillId: { type: "number" },
        skillName: { type: "string" },
        overallScore: { type: "number" },
        dimensions: {
            type: "object",
            additionalProperties: false,
            required: ["messageStructureClarity", "audienceAwareness", "deliveryPresence", "engagementInteraction", "responsivenessAdaptability"],
            properties: {
                messageStructureClarity: SkillDimensionSchema,
                audienceAwareness: SkillDimensionSchema,
                deliveryPresence: SkillDimensionSchema,
                engagementInteraction: SkillDimensionSchema,
                responsivenessAdaptability: SkillDimensionSchema
            }
        },
        summary: { type: "string" },
        keyStrengths: { type: "array", items: { type: "string" } },
        developmentPriorities: { type: "array", items: { type: "string" } }
    }
};
// JSON Schema for Document Analysis - Enhanced with detailed slide-by-slide review
const SlideIssueSchema = {
    type: "object",
    additionalProperties: false,
    required: ["category", "severity", "description", "location", "currentText", "suggestedFix"],
    properties: {
        category: { type: "string", enum: ["text_density", "structure", "clarity", "hierarchy", "consistency", "missing_content", "redundancy"] },
        severity: { type: "string", enum: ["high", "medium", "low"] },
        description: { type: "string" },
        location: { type: "string" },
        currentText: { type: "string" },
        suggestedFix: { type: "string" }
    }
};
const RewriteSuggestionSchema = {
    type: "object",
    additionalProperties: false,
    required: ["element", "current", "suggested", "rationale"],
    properties: {
        element: { type: "string" },
        current: { type: "string" },
        suggested: { type: "string" },
        rationale: { type: "string" }
    }
};
const CrossSlidePatternSchema = {
    type: "object",
    additionalProperties: false,
    required: ["pattern", "frequency", "recommendation"],
    properties: {
        pattern: { type: "string" },
        frequency: { type: "string" },
        recommendation: { type: "string" }
    }
};
const DocumentAnalysisSchema = {
    type: "object",
    additionalProperties: false,
    required: ["overallScore", "executiveSummary", "structureAnalysis", "clarityAnalysis", "headingsAnalysis", "contentOrganization", "visualHierarchy", "slideBySlideAnalysis", "crossSlidePatterns", "summary", "topRecommendations"],
    properties: {
        overallScore: { type: "number" },
        executiveSummary: { type: "string" },
        structureAnalysis: {
            type: "object",
            additionalProperties: false,
            required: ["score", "feedback", "strengths", "improvements"],
            properties: {
                score: { type: "number" },
                feedback: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                improvements: { type: "array", items: { type: "string" } }
            }
        },
        clarityAnalysis: {
            type: "object",
            additionalProperties: false,
            required: ["score", "feedback", "strengths", "improvements"],
            properties: {
                score: { type: "number" },
                feedback: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                improvements: { type: "array", items: { type: "string" } }
            }
        },
        headingsAnalysis: {
            type: "object",
            additionalProperties: false,
            required: ["score", "feedback", "suggestions"],
            properties: {
                score: { type: "number" },
                feedback: { type: "string" },
                suggestions: { type: "array", items: { type: "string" } }
            }
        },
        contentOrganization: {
            type: "object",
            additionalProperties: false,
            required: ["score", "feedback", "suggestions"],
            properties: {
                score: { type: "number" },
                feedback: { type: "string" },
                suggestions: { type: "array", items: { type: "string" } }
            }
        },
        visualHierarchy: {
            type: "object",
            additionalProperties: false,
            required: ["score", "feedback", "suggestions"],
            properties: {
                score: { type: "number" },
                feedback: { type: "string" },
                suggestions: { type: "array", items: { type: "string" } }
            }
        },
        slideBySlideAnalysis: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                required: ["slideNumber", "title", "slideType", "overallScore", "issues", "strengths", "rewriteSuggestions", "designTips"],
                properties: {
                    slideNumber: { type: "number" },
                    title: { type: "string" },
                    slideType: { type: "string", enum: ["title", "content", "section_break", "data", "summary", "agenda"] },
                    overallScore: { type: "number" },
                    issues: { type: "array", items: SlideIssueSchema },
                    strengths: { type: "array", items: { type: "string" } },
                    rewriteSuggestions: { type: "array", items: RewriteSuggestionSchema },
                    designTips: { type: "array", items: { type: "string" } }
                }
            }
        },
        crossSlidePatterns: { type: "array", items: CrossSlidePatternSchema },
        summary: { type: "string" },
        topRecommendations: { type: "array", items: { type: "string" } }
    }
};
/**
 * Generate skill-based assessment for Skill ID 104: Effective Presentation & Communication in Groups
 * Evaluates the transcript against 5 behavioral dimensions with scores and evidence
 */
export async function generatePresentationSkillAssessment(transcript, presentationData, topic) {
    console.log("[Skill Assessment] Starting skill-based assessment for presentation");
    const maxSlides = Math.min(presentationData.slides?.length || 0, 20);
    const slideSummary = presentationData.slides?.slice(0, maxSlides).map(s => `Slide ${s.slideNumber}: "${s.title}"`).join("\n") || "No slides available";
    const prompt = `You are an expert communication skills assessor evaluating a presentation practice session against the skill framework: "Effective Presentation & Communication in Groups".

SKILL FRAMEWORK DEFINITION:
The ability to structure and deliver messages in group settings—meetings, presentations, workshops, or discussions—so that ideas are clear, engaging, contextually relevant, and lead to shared understanding and informed decision-making. This includes adapting content to the audience, managing group dynamics, and responding effectively to questions or resistance.

ASSESSMENT FRAMEWORK: Pyramid Principle (Structured Communication) + Executive Presence + Audience-Centered Communication

PRESENTATION CONTEXT:
Topic: ${topic}
Slides Overview:
${slideSummary}

TRANSCRIPT OF THE PRACTICE SESSION:
${transcript || "No transcript recorded"}

Evaluate the presenter's performance on these 5 DIMENSIONS (score each 0-5):

1. MESSAGE STRUCTURE & CLARITY
   - Logical flow of ideas (uses pyramid principle: lead with conclusion, support with arguments)
   - Clear key takeaways
   - Coherent transitions between points
   - Appropriate use of signposting language

2. AUDIENCE AWARENESS
   - Relevance of content to audience needs
   - Tailoring complexity and language appropriately
   - Context-setting at the beginning
   - Anticipating audience knowledge gaps

3. DELIVERY & PRESENCE
   - Confidence in voice and language
   - Professional tone and vocabulary
   - Avoiding filler words and hedging
   - Authoritative but approachable presence

4. ENGAGEMENT & INTERACTION
   - Inviting questions and participation
   - Managing discussion effectively
   - Reading and responding to audience cues
   - Creating moments for reflection or input

5. RESPONSIVENESS & ADAPTABILITY
   - Handling questions skillfully
   - Addressing objections constructively
   - Adapting to time pressure or interruptions
   - Recovering from unexpected situations

For each dimension, provide:
- A score (0-5)
- Specific feedback explaining the score
- Behavioral evidence from the transcript (direct quotes or observations)
- 2-3 actionable improvement suggestions

Calculate the overall score as the weighted average of all dimensions.`;
    try {
        console.log("[Skill Assessment] Calling OpenAI for skill assessment...");
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.1,
            max_tokens: 4000,
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "skill_assessment",
                    strict: true,
                    schema: PresentationSkillAssessmentSchema,
                },
            },
            messages: [
                {
                    role: "system",
                    content: "You are an expert in communication skills assessment using the Pyramid Principle and Executive Presence frameworks. Evaluate presentations objectively with specific behavioral evidence. Output ONLY valid JSON matching the schema.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });
        console.log("[Skill Assessment] OpenAI response received");
        const usage = completion.usage;
        if (usage) {
            await trackOpenAIUsage("presentation_skill_assessment", "gpt-4o", usage.prompt_tokens || 0, usage.completion_tokens || 0);
        }
        const msg = completion.choices[0]?.message?.content?.trim();
        if (!msg) {
            console.error("[Skill Assessment] No response content");
            return null;
        }
        console.log("[Skill Assessment] Parsing response...");
        return JSON.parse(msg);
    }
    catch (error) {
        console.error("[Skill Assessment] Error:", error?.message || error);
        return null;
    }
}
/**
 * Analyze the uploaded presentation document for structure, clarity, design, and provide detailed slide-by-slide improvement suggestions
 */
export async function generateDocumentAnalysis(presentationData, topic) {
    console.log("[Document Analysis] Starting detailed document analysis");
    console.log("[Document Analysis] Slides:", presentationData.slides?.length || 0);
    const maxSlides = Math.min(presentationData.slides?.length || 0, 20);
    const slideDetails = presentationData.slides?.slice(0, maxSlides).map(s => {
        const bulletContent = s.bulletPoints?.map((bp, i) => `  • ${bp}`).join("\n") || "";
        const rawContent = s.rawText?.substring(0, 800) || "";
        return `=== SLIDE ${s.slideNumber} ===
Title: "${s.title || 'Untitled'}"
Content:
${bulletContent || rawContent || "No content extracted"}`;
    }).join("\n\n") || "No slides available";
    const prompt = `You are a McKinsey-trained presentation consultant providing DETAILED, SPECIFIC feedback on a presentation document. Your analysis should be actionable and include concrete rewrite suggestions.

PRESENTATION DOCUMENT:
File: ${presentationData.fileName}
Topic: ${topic}
Total Slides: ${presentationData.totalSlides}

SLIDE CONTENT:
${slideDetails}

ANALYSIS REQUIREMENTS:

1. EXECUTIVE SUMMARY (2-3 sentences): What is the single biggest improvement this deck needs?

2. HIGH-LEVEL ANALYSIS (score each 0-100):
   a) STRUCTURE: Flow, story arc, section breaks, balance
   b) CLARITY: Conciseness, jargon, key messages, one-idea-per-slide
   c) HEADINGS: Action-oriented titles that tell the story
   d) CONTENT ORGANIZATION: Pyramid principle, MECE, bullets vs prose
   e) VISUAL HIERARCHY: Text density, emphasis, layering

3. SLIDE-BY-SLIDE ANALYSIS (CRITICAL - be very specific):
   For EACH slide, provide:
   
   a) slideType: Classify as title/content/section_break/data/summary/agenda
   
   b) overallScore: 0-100
   
   c) issues: List specific problems found. For each issue:
      - category: text_density | structure | clarity | hierarchy | consistency | missing_content | redundancy
      - severity: high | medium | low
      - description: What exactly is wrong
      - location: Which element (e.g., "Title", "Bullet 2", "Subheading")
      - currentText: Quote the problematic text
      - suggestedFix: Concrete rewritten version
   
   d) strengths: What works well (be specific)
   
   e) rewriteSuggestions: Concrete before/after rewrites:
      - element: What you're rewriting (e.g., "Title", "Bullet 3")
      - current: The original text
      - suggested: Your improved version
      - rationale: Why this is better
   
   f) designTips: Layout/visual suggestions (e.g., "Convert bullets to 3-column visual", "Add supporting data chart")

4. CROSS-SLIDE PATTERNS: Identify recurring issues across multiple slides (e.g., "8 of 12 slides have more than 7 bullets")

5. TOP 5 RECOMMENDATIONS: Prioritized list of highest-impact improvements

EXAMPLE OF GOOD SLIDE ANALYSIS:
{
  "slideNumber": 3,
  "title": "Market Overview",
  "slideType": "content",
  "overallScore": 45,
  "issues": [
    {
      "category": "text_density",
      "severity": "high",
      "description": "Slide has 12 bullet points - too dense for audience to absorb",
      "location": "Main content area",
      "currentText": "12 separate bullet points covering market size, growth, competition...",
      "suggestedFix": "Split into 3 slides: Market Size, Growth Drivers, Competitive Landscape"
    },
    {
      "category": "clarity",
      "severity": "medium",
      "description": "Title is vague and doesn't convey the key message",
      "location": "Title",
      "currentText": "Market Overview",
      "suggestedFix": "Market Growing 15% YoY, Driven by Digital Transformation"
    }
  ],
  "strengths": ["Uses specific data points ($2.3B market size)", "Includes competitor names"],
  "rewriteSuggestions": [
    {
      "element": "Title",
      "current": "Market Overview",
      "suggested": "Digital Services Market Growing 15% YoY to $2.3B",
      "rationale": "Action-oriented title that states the key insight upfront (Pyramid Principle)"
    },
    {
      "element": "Bullet 1",
      "current": "The market is experiencing significant growth in the digital transformation space",
      "suggested": "15% YoY growth driven by enterprise cloud adoption",
      "rationale": "Removes filler words, leads with the number, specifies the driver"
    }
  ],
  "designTips": ["Replace bullet list with 2x2 matrix: Market Size vs Growth Rate", "Add trend line chart showing 5-year growth"]
}

Be SPECIFIC and ACTIONABLE. Generic feedback like "improve clarity" is not acceptable.`;
    try {
        console.log("[Document Analysis] Calling OpenAI with detailed analysis...");
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.2,
            max_tokens: 8000,
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "document_analysis",
                    strict: true,
                    schema: DocumentAnalysisSchema,
                },
            },
            messages: [
                {
                    role: "system",
                    content: `You are a McKinsey-trained presentation consultant providing detailed slide-by-slide analysis. Your feedback must be:
1. SPECIFIC - Quote actual text from slides, name exact elements
2. ACTIONABLE - Provide concrete rewritten versions, not vague suggestions
3. COMPLETE - Analyze EVERY slide with issues, strengths, and rewrites
4. PRACTICAL - Give design tips that can be immediately implemented

For each slide issue, always include the currentText (quote it) and suggestedFix (rewrite it).
For rewriteSuggestions, show the exact before/after text.
Output ONLY valid JSON matching the schema.`,
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });
        console.log("[Document Analysis] OpenAI response received");
        const usage = completion.usage;
        if (usage) {
            await trackOpenAIUsage("presentation_document_analysis", "gpt-4o", usage.prompt_tokens || 0, usage.completion_tokens || 0);
        }
        const msg = completion.choices[0]?.message?.content?.trim();
        if (!msg) {
            console.error("[Document Analysis] No response content");
            return null;
        }
        console.log("[Document Analysis] Parsing response...");
        return JSON.parse(msg);
    }
    catch (error) {
        console.error("[Document Analysis] Error:", error?.message || error);
        return null;
    }
}
