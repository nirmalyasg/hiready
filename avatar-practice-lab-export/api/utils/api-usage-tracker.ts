import { db } from "../db.js";
import { apiUsageEvents, adminSettings } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

export type ApiService = "openai" | "tavily" | "heygen" | "whisper" | "other";

interface TrackApiUsageParams {
  service: ApiService;
  operation: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  durationMs?: number;
  userId?: number;
  authUserId?: string;
  sessionId?: number;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

const pricingCache: Record<string, number> = {};
let pricingLoaded = false;

async function loadPricing(): Promise<void> {
  if (pricingLoaded) return;
  
  try {
    const settings = await db.select()
      .from(adminSettings)
      .where(eq(adminSettings.category, "pricing"));
    
    settings.forEach(s => {
      pricingCache[s.key] = Number(s.value) || 0;
    });
    pricingLoaded = true;
  } catch (error) {
    console.error("Error loading pricing settings:", error);
  }
}

function calculateCost(params: TrackApiUsageParams): number {
  const { service, model, tokensIn = 0, tokensOut = 0, durationMs = 0 } = params;
  
  switch (service) {
    case "openai":
      const inputPrice = pricingCache["openai_gpt4_price_per_1k_input"] || 0.01;
      const outputPrice = pricingCache["openai_gpt4_price_per_1k_output"] || 0.03;
      return (tokensIn / 1000) * inputPrice + (tokensOut / 1000) * outputPrice;
    
    case "whisper":
      const whisperPrice = pricingCache["openai_whisper_price_per_minute"] || 0.006;
      const minutes = durationMs / 60000;
      return minutes * whisperPrice;
    
    case "tavily":
      const tavilyPrice = pricingCache["tavily_price_per_search"] || 0.001;
      return tavilyPrice;
    
    case "heygen":
      const heygenPrice = pricingCache["heygen_price_per_minute"] || 0.10;
      const heygenMinutes = durationMs / 60000;
      return heygenMinutes * heygenPrice;
    
    default:
      return 0;
  }
}

export async function trackApiUsage(params: TrackApiUsageParams): Promise<void> {
  try {
    await loadPricing();
    
    const estimatedCost = calculateCost(params);
    
    await db.insert(apiUsageEvents).values({
      service: params.service,
      operation: params.operation,
      model: params.model,
      tokensIn: params.tokensIn || 0,
      tokensOut: params.tokensOut || 0,
      durationMs: params.durationMs,
      userId: params.userId,
      authUserId: params.authUserId,
      sessionId: params.sessionId,
      success: params.success ?? true,
      errorMessage: params.errorMessage,
      estimatedCost,
      metadata: params.metadata,
      occurredAt: new Date()
    });
  } catch (error) {
    console.error("Error tracking API usage:", error);
  }
}

export async function trackOpenAIUsage(
  operation: string,
  model: string,
  tokensIn: number,
  tokensOut: number,
  options?: {
    userId?: number;
    authUserId?: string;
    sessionId?: number;
    durationMs?: number;
    success?: boolean;
    errorMessage?: string;
  }
): Promise<void> {
  return trackApiUsage({
    service: "openai",
    operation,
    model,
    tokensIn,
    tokensOut,
    ...options
  });
}

export async function trackWhisperUsage(
  durationMs: number,
  options?: {
    userId?: number;
    authUserId?: string;
    sessionId?: number;
    success?: boolean;
    errorMessage?: string;
  }
): Promise<void> {
  return trackApiUsage({
    service: "whisper",
    operation: "transcription",
    model: "whisper-1",
    durationMs,
    ...options
  });
}

export async function trackTavilyUsage(
  operation: string = "search",
  options?: {
    userId?: number;
    authUserId?: string;
    sessionId?: number;
    success?: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  return trackApiUsage({
    service: "tavily",
    operation,
    ...options
  });
}

export async function trackHeygenUsage(
  operation: string,
  durationMs: number,
  options?: {
    userId?: number;
    authUserId?: string;
    sessionId?: number;
    avatarId?: string;
    success?: boolean;
    errorMessage?: string;
  }
): Promise<void> {
  return trackApiUsage({
    service: "heygen",
    operation,
    durationMs,
    metadata: options?.avatarId ? { avatarId: options.avatarId } : undefined,
    ...options
  });
}

export function refreshPricingCache(): void {
  pricingLoaded = false;
}
