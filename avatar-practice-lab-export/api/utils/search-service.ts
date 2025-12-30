import { tavily } from "@tavily/core";
import { trackTavilyUsage } from "./api-usage-tracker.js";

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate?: string;
}

export interface TopicResearch {
  query: string;
  answer?: string;
  sources: SearchResult[];
  searchedAt: string;
  hasReliableInfo: boolean;
}

let tavilyClient: ReturnType<typeof tavily> | null = null;

function getTavilyClient() {
  if (!tavilyClient) {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      console.warn("TAVILY_API_KEY not configured - search functionality disabled");
      return null;
    }
    tavilyClient = tavily({ apiKey });
  }
  return tavilyClient;
}

export async function searchTopic(topic: string, options?: {
  searchDepth?: "basic" | "advanced";
  maxResults?: number;
  includeAnswer?: boolean;
  topic?: "general" | "news";
  days?: number;
}): Promise<TopicResearch> {
  const client = getTavilyClient();
  
  if (!client) {
    return {
      query: topic,
      sources: [],
      searchedAt: new Date().toISOString(),
      hasReliableInfo: false,
    };
  }

  try {
    const searchOptions = {
      searchDepth: options?.searchDepth || "basic" as const,
      maxResults: options?.maxResults || 5,
      includeAnswer: options?.includeAnswer ?? true,
      topic: options?.topic || "general" as const,
      ...(options?.days && { days: options.days }),
    };

    const response = await client.search(topic, searchOptions);

    // Track Tavily usage
    await trackTavilyUsage("search", { metadata: { topic, resultsCount: response.results?.length || 0 } });

    const sources: SearchResult[] = (response.results || []).map((result: any) => ({
      title: result.title || "",
      url: result.url || "",
      content: result.content || "",
      score: result.score || 0,
      publishedDate: result.publishedDate,
    }));

    // Consider research reliable if we have ANY answer or ANY sources from Tavily
    // Tavily's summaries are high-quality - trust them regardless of length or source scores
    const hasReliableInfo = Boolean(response.answer?.trim()) || sources.length > 0;
    
    console.log(`[Research] Topic: "${topic}" - Answer: ${response.answer ? response.answer.length + ' chars' : 'none'}, Sources: ${sources.length}, Reliable: ${hasReliableInfo}`);
    
    return {
      query: topic,
      answer: response.answer,
      sources,
      searchedAt: new Date().toISOString(),
      hasReliableInfo,
    };
  } catch (error) {
    console.error("Error searching topic:", error);
    return {
      query: topic,
      sources: [],
      searchedAt: new Date().toISOString(),
      hasReliableInfo: false,
    };
  }
}

export function formatResearchForPrompt(research: TopicResearch, conversationStyle?: {
  mode?: string;
  objective?: string;
}): string {
  // Include research if we have ANY answer or ANY sources - be fully permissive
  const hasContent = Boolean(research.answer?.trim()) || research.sources.length > 0;
  
  if (!hasContent) {
    console.log(`[Research] No content to format for topic: "${research.query}"`);
    return "";
  }

  // Extract specific facts, names, numbers from research for targeted questions
  const allContent = [research.answer || "", ...research.sources.map(s => s.content)].join(" ");
  
  // Extract percentages and numbers (filter out empty/short matches)
  const numberMatches = (allContent.match(/\d+(?:\.\d+)?(?:\s*%|\s*percent|\s*billion|\s*million|\s*thousand)?/gi) || [])
    .filter(m => m.trim().length >= 2);
  // Extract quoted phrases  
  const quoteMatches = (allContent.match(/"[^"]+"/g) || [])
    .filter(m => m.length > 5);
  // Extract named entities (capitalized multi-word phrases)
  const namedEntities = (allContent.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g) || [])
    .filter(m => m.length > 5);
  
  const specificDetails = [...new Set([...numberMatches.slice(0, 5), ...quoteMatches.slice(0, 3), ...namedEntities.slice(0, 5)])]
    .filter(d => d && d.trim().length > 0);

  let factsSection = `\n\n## YOUR KNOWLEDGE & PERSPECTIVE ON THIS TOPIC\n`;
  factsSection += `Topic: "${research.query}" (current as of ${new Date(research.searchedAt).toLocaleDateString()})\n\n`;

  if (research.answer) {
    factsSection += `### FACTS YOU KNOW WELL:\n${research.answer}\n\n`;
  }

  if (research.sources.length > 0) {
    factsSection += `### DETAILS YOU'VE PICKED UP:\n`;
    research.sources.slice(0, 5).forEach((source) => {
      factsSection += `\n- ${source.content.substring(0, 500)}${source.content.length > 500 ? "..." : ""}\n`;
    });
  }

  // Generate specific discussion angles based on conversation mode
  const mode = conversationStyle?.mode || "explore";
  
  factsSection += `\n### HOW TO ENGAGE IN THIS CONVERSATION:\n`;
  
  if (specificDetails.length > 0) {
    factsSection += `Facts you can weave into your opinions: ${specificDetails.slice(0, 5).join(", ")}\n\n`;
  }
  
  if (mode === "challenge") {
    factsSection += `CONVERSATION STYLE: Spirited debate - you have strong opinions and love a good argument
- Share your perspective boldly: "Honestly, I think..." or "I've been following this and my take is..."
- Push back when you disagree: "I hear you, but I actually see it differently because..."
- Play devil's advocate naturally: "That's interesting, but here's what bugs me about that view..."
- Challenge their logic respectfully: "OK but how do you square that with [fact]?"
- Be genuinely curious about their reasoning while defending your own position
`;
  } else if (mode === "resolve") {
    factsSection += `CONVERSATION STYLE: Pragmatic problem-solver - you want to get to the heart of the matter
- Share your opinion on what matters: "From what I've seen, the real issue here is..."
- Offer your perspective on solutions: "If you ask me, the smart move would be..."
- Push for clarity: "But what does that actually mean in practice? Here's how I see it..."
- Share trade-offs you see: "The tricky part is... on one hand X, on the other Y"
- Engage like a thoughtful friend working through a problem together
`;
  } else {
    factsSection += `CONVERSATION STYLE: Engaging conversationalist - you're genuinely interested and have thoughts to share
- Open with your own perspective: "You know what I find fascinating about this..." or "My honest take on this is..."
- Share what intrigues you: "What really gets me thinking is..." or "I've been mulling over..."
- React authentically: "Oh that's an interesting angle, I hadn't thought of it that way. I was more thinking..."
- Build on their ideas: "Yeah, and that connects to something I was reading about..."
- Occasionally push back gently: "Hmm, I'm not totally sure I agree. Here's my hesitation..."
`;
  }

  factsSection += `
### YOUR CONVERSATION PERSONA:
1. YOU HAVE OPINIONS: Don't just ask questions - share your actual views, perspectives, and reactions. Lead with "I think...", "My take is...", "What strikes me is..."
2. REAL CONVERSATION FLOW: This is a two-way discussion, not an interview. Share your thoughts BEFORE asking for theirs. React to what they say with your own perspective.
3. BE SPECIFIC & KNOWLEDGEABLE: Reference actual facts, names, numbers from your knowledge above. Say things like "Did you see that [specific fact]? I thought that was really telling."
4. NATURAL DISAGREEMENT: It's OK to disagree! Real conversations have pushback. "I hear you, but I'm not sure I buy that because..."
5. GENUINE CURIOSITY: When you ask questions, it's because you genuinely want to understand their view, not to quiz them.
6. NO SOURCE-CITING: Never say "according to sources" or "I read that" - you just KNOW these things like any informed person would.
7. STAY GROUNDED: Only discuss facts from above. If something's not in your knowledge, say "I'm not sure about that part - what have you heard?"
8. NO FABRICATION: Never invent facts. Use what you know; admit when you don't know something specific.
9. CONVERSATIONAL RHYTHM: Aim for roughly equal talk time. Share your view (2-3 sentences), then invite their perspective or reaction.
`;

  console.log(`[Research] Formatted ${research.answer ? research.answer.length : 0} char answer + ${research.sources.length} sources for prompt (mode: ${mode})`);
  
  return factsSection;
}

export function getResearchQualityScore(research: TopicResearch): {
  score: number;
  reason: string;
  isUsable: boolean;
} {
  let score = 0;
  const reasons: string[] = [];
  
  // Answer quality (0-40 points)
  if (research.answer) {
    const answerLen = research.answer.length;
    if (answerLen > 500) {
      score += 40;
      reasons.push("comprehensive answer");
    } else if (answerLen > 200) {
      score += 30;
      reasons.push("good answer");
    } else if (answerLen > 50) {
      score += 20;
      reasons.push("brief answer");
    } else {
      score += 10;
      reasons.push("minimal answer");
    }
  }
  
  // Source quality (0-40 points)
  const highQualitySources = research.sources.filter(s => s.score > 0.7).length;
  const mediumQualitySources = research.sources.filter(s => s.score > 0.5 && s.score <= 0.7).length;
  
  score += Math.min(highQualitySources * 10, 30);
  score += Math.min(mediumQualitySources * 5, 10);
  
  if (highQualitySources >= 2) reasons.push(`${highQualitySources} high-quality sources`);
  else if (research.sources.length > 0) reasons.push(`${research.sources.length} sources`);
  
  // Freshness (0-20 points)
  const recentSources = research.sources.filter(s => {
    if (!s.publishedDate) return false;
    const pubDate = new Date(s.publishedDate);
    const daysSince = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince < 30;
  }).length;
  
  if (recentSources >= 2) {
    score += 20;
    reasons.push("recent news");
  } else if (recentSources === 1) {
    score += 10;
    reasons.push("some recent info");
  }
  
  // Usable if score >= 30 (has either a decent answer OR multiple sources)
  const isUsable = score >= 30;
  
  return {
    score,
    reason: reasons.join(", ") || "no usable research",
    isUsable
  };
}

export function shouldResearchTopic(topic: string, category?: string): boolean {
  // Categories that benefit from real-world facts
  const researchCategories = [
    "current-affairs", "technology", "business", "news", 
    "impromptu", "discussion", "debate", "opinion",
    "scenario", "roleplay", "professional", "workplace",
    "custom", "sports", "career", "wellness"
  ];
  if (category && researchCategories.includes(category)) {
    return true;
  }

  const lowerTopic = topic.toLowerCase();

  // FIRST: Check for real-world entities that ALWAYS benefit from research
  // This runs before skip patterns so "Handling Tesla layoffs" still gets researched
  const factualIndicators = [
    // Company names and organizations
    /\b(google|apple|microsoft|amazon|meta|tesla|nvidia|openai|anthropic|netflix|uber|airbnb|ibm|samsung|intel|oracle|salesforce|adobe|spotify|twitter|linkedin)\b/i,
    // Country/region mentions
    /\b(india|china|usa|america|europe|asia|africa|russia|japan|korea|germany|france|uk|brazil|canada|australia|mexico|singapore|dubai|kolkata|mumbai|delhi|bangalore)\b/i,
    // Current events indicators
    /\b(latest|recent|today|2024|2025|news|current|trending|update|breaking)\b/i,
    // Industry/sector topics
    /\b(election|market|economy|stock|crypto|ai|tech|government|policy|climate|health|science|sports|layoff|merger|acquisition|ipo)\b/i,
    // Specific people or events
    /\b(president|prime minister|ceo|founder|visit|summit|conference|launch|release|announcement|messi|trump|modi|biden)\b/i,
  ];

  if (factualIndicators.some(pattern => pattern.test(lowerTopic))) {
    return true;
  }

  // SECOND: Skip very generic topics that don't benefit from research
  // Only applies if no real-world entities were found above
  const skipPatterns = [
    /^(hello|hi|test|practice)$/i,
    /^my (day|life|hobby|experience)$/i,
  ];
  
  if (skipPatterns.some(pattern => pattern.test(topic.trim()))) {
    return false;
  }

  // Research any topic that's substantial (3+ words usually indicates specificity)
  const words = topic.trim().split(/\s+/);
  if (words.length >= 3) {
    return true;
  }

  return false;
}

export interface TopicInsight {
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

export async function generateTopicInsights(topic: string): Promise<TopicInsight | null> {
  const client = getTavilyClient();
  
  if (!client) {
    console.log("[TopicInsights] Tavily client not available");
    return null;
  }

  try {
    console.log("[TopicInsights] Researching topic for knowledge enrichment:", topic);
    
    const response = await client.search(topic, {
      searchDepth: "advanced",
      maxResults: 8,
      includeAnswer: true,
      topic: "general",
    });

    // Track Tavily usage
    await trackTavilyUsage("search", { metadata: { topic: `knowledge_enrichment: ${topic}`, resultsCount: response.results?.length || 0 } });

    const sources = (response.results || []).slice(0, 5).map((r: any) => ({
      title: r.title || "",
      url: r.url || "",
    }));

    // Extract key facts from the answer
    const keyFacts: string[] = [];
    if (response.answer) {
      // Split answer into sentences and take the most informative ones
      const sentences = response.answer.split(/[.!?]+/).filter(s => s.trim().length > 20);
      keyFacts.push(...sentences.slice(0, 5).map(s => s.trim() + "."));
    }

    // Extract additional facts from source content
    const allContent = (response.results || []).map((r: any) => r.content || "").join(" ");
    
    // Extract interesting data points
    const dataPoints = allContent.match(/\d+(?:\.\d+)?(?:\s*%|\s*percent|\s*billion|\s*million)/gi) || [];
    const uniqueDataPoints = [...new Set(dataPoints)].slice(0, 3);
    
    // Find sentences containing data points for context
    uniqueDataPoints.forEach(dp => {
      const regex = new RegExp(`[^.]*${dp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^.]*\\.`, 'i');
      const match = allContent.match(regex);
      if (match && match[0].length > 30 && match[0].length < 200) {
        if (!keyFacts.some(f => f.includes(dp))) {
          keyFacts.push(match[0].trim());
        }
      }
    });

    // Generate different perspectives based on content analysis
    const perspectives: Array<{ viewpoint: string; explanation: string }> = [];
    
    // Look for contrasting views in the content
    const contrastIndicators = [
      { pattern: /(?:supporters?|proponents?|advocates?)\s+(?:argue|believe|say|claim)/gi, viewpoint: "Supporters' View" },
      { pattern: /(?:critics?|opponents?|skeptics?)\s+(?:argue|believe|say|claim)/gi, viewpoint: "Critics' View" },
      { pattern: /(?:on\s+one\s+hand|some\s+(?:people|experts?))/gi, viewpoint: "One Perspective" },
      { pattern: /(?:on\s+the\s+other\s+hand|others?|however)/gi, viewpoint: "Alternative View" },
    ];
    
    contrastIndicators.forEach(({ pattern, viewpoint }) => {
      const match = allContent.match(new RegExp(`[^.]*${pattern.source}[^.]*\\.`, 'i'));
      if (match && match[0].length > 50 && match[0].length < 300) {
        perspectives.push({
          viewpoint,
          explanation: match[0].trim()
        });
      }
    });

    // If no explicit perspectives found, create general ones based on topic
    if (perspectives.length < 2) {
      perspectives.push(
        { viewpoint: "Key Consideration", explanation: keyFacts[1] || response.answer?.substring(0, 200) || "Multiple factors influence this topic." },
        { viewpoint: "Broader Context", explanation: keyFacts[2] || "This topic connects to wider trends and developments." }
      );
    }

    // Things to consider / deeper questions
    const thingsToConsider = [
      "How might this evolve in the next few years?",
      "What are the implications for different stakeholders?",
      "What factors could change the current situation?",
    ];
    
    // Try to extract actual considerations from the content
    const considerPatterns = [
      /(?:important\s+to\s+(?:note|consider|remember)|worth\s+noting)[^.]*\./gi,
      /(?:implications?|consequences?|effects?)\s+(?:include|are)[^.]*\./gi,
    ];
    
    considerPatterns.forEach(pattern => {
      const matches = allContent.match(pattern);
      if (matches) {
        matches.slice(0, 2).forEach(m => {
          if (m.length > 30 && m.length < 200) {
            thingsToConsider.unshift(m.trim());
          }
        });
      }
    });

    const summary = response.answer 
      ? response.answer.substring(0, 500) + (response.answer.length > 500 ? "..." : "")
      : "This topic involves multiple considerations and perspectives worth exploring.";

    const insights: TopicInsight = {
      keyFacts: keyFacts.slice(0, 6),
      differentPerspectives: perspectives.slice(0, 3),
      thingsToConsider: thingsToConsider.slice(0, 4),
      sources,
      summary
    };

    console.log("[TopicInsights] Generated insights:", {
      keyFactsCount: insights.keyFacts.length,
      perspectivesCount: insights.differentPerspectives.length,
      sourcesCount: insights.sources.length
    });

    return insights;
  } catch (error) {
    console.error("[TopicInsights] Error generating topic insights:", error);
    return null;
  }
}
