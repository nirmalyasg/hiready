import { Router, Request, Response } from "express";
import { db } from "../db.js";
import { eq, desc, and, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import {
  interviewAssignments,
  hireadyIndexSnapshots,
  hireadyShareLinks,
  interviewSessions,
  interviewAnalysis,
  interviewConfigs,
  roleKits,
  jobTargets,
  authUsers,
  roleArchetypes,
} from "../../shared/schema.js";
import { requireAuth } from "../middleware/auth.js";

export const interviewProgressRouter = Router();

const INTERVIEW_WEIGHTS: Record<string, number> = {
  technical: 3.0,
  coding: 2.5,
  system_design: 2.5,
  case_study: 2.0,
  case: 2.0,
  product_sense: 2.0,
  hr: 1.5,
  behavioral: 1.5,
  hiring_manager: 1.5,
  general: 1.0,
  skill_practice: 1.0,
  analytics: 2.0,
  sql: 2.0,
  ml: 2.5,
  panel: 1.5,
};

// Core 5 dimensions for Hiready Index (from spec)
const CORE_DIMENSIONS = [
  { key: "clarity", label: "Clarity", aliases: ["Clarity & Structure", "clarity_structure"] },
  { key: "structure", label: "Structure", aliases: ["Clarity & Structure", "structure"] },
  { key: "confidence", label: "Confidence", aliases: ["Confidence & Composure", "confidence_composure"] },
  { key: "problem_solving", label: "Problem Solving", aliases: ["Problem Solving Approach", "problem_solving"] },
  { key: "role_fit", label: "Role Fit", aliases: ["Role Fit", "role_fit"] },
];

// Default dimension weights (if no role-specific weights available)
const DEFAULT_DIMENSION_WEIGHTS: Record<string, number> = {
  clarity: 20,
  structure: 20,
  confidence: 20,
  problem_solving: 20,
  role_fit: 20,
};

// Role-specific dimension weight presets based on role category
const ROLE_DIMENSION_WEIGHTS: Record<string, Record<string, number>> = {
  data_analyst: { clarity: 20, structure: 25, confidence: 10, problem_solving: 25, role_fit: 20 },
  data_scientist: { clarity: 15, structure: 20, confidence: 10, problem_solving: 35, role_fit: 20 },
  software_engineer: { clarity: 15, structure: 20, confidence: 15, problem_solving: 30, role_fit: 20 },
  product_manager: { clarity: 25, structure: 20, confidence: 15, problem_solving: 20, role_fit: 20 },
  sales_account: { clarity: 25, structure: 15, confidence: 25, problem_solving: 15, role_fit: 20 },
  marketing_growth: { clarity: 25, structure: 15, confidence: 20, problem_solving: 20, role_fit: 20 },
  hr_recruiter: { clarity: 25, structure: 15, confidence: 20, problem_solving: 15, role_fit: 25 },
  consulting: { clarity: 20, structure: 25, confidence: 15, problem_solving: 25, role_fit: 15 },
  finance: { clarity: 20, structure: 25, confidence: 15, problem_solving: 25, role_fit: 15 },
  default: { clarity: 20, structure: 20, confidence: 20, problem_solving: 20, role_fit: 20 },
};

// Get readiness band from score (0-100 scale)
function getReadinessBand(score: number): { band: string; label: string; description: string } {
  if (score >= 75) {
    return { band: "interview_ready", label: "Interview-Ready", description: "Can confidently handle real interviews" };
  }
  if (score >= 55) {
    return { band: "strong_foundation", label: "Strong Foundation", description: "Ready with minor refinement" };
  }
  if (score >= 35) {
    return { band: "developing", label: "Developing Readiness", description: "Needs practice before applying" };
  }
  return { band: "early_stage", label: "Early Stage", description: "Not interview-ready yet" };
}

// Map raw dimension names from interview_analysis to core dimension keys
function mapDimensionToCore(dimensionName: string): string | null {
  const lower = dimensionName.toLowerCase();
  if (lower.includes("clarity") || lower.includes("structure")) return "clarity";
  if (lower.includes("confidence") || lower.includes("composure")) return "confidence";
  if (lower.includes("problem") || lower.includes("solving") || lower.includes("approach")) return "problem_solving";
  if (lower.includes("role") || lower.includes("fit")) return "role_fit";
  if (lower.includes("depth") || lower.includes("evidence")) return "structure";
  if (lower.includes("communication") || lower.includes("hygiene")) return "clarity";
  if (lower.includes("ownership") || lower.includes("impact")) return "problem_solving";
  if (lower.includes("consistency") || lower.includes("honesty")) return "confidence";
  return null;
}

function getInterviewWeight(interviewType: string): number {
  return INTERVIEW_WEIGHTS[interviewType] || 1.0;
}

function computeOverallScore(dimensionScores: any[]): number {
  if (!dimensionScores || dimensionScores.length === 0) return 0;
  const totalScore = dimensionScores.reduce((sum, d) => sum + (d.score || 0), 0);
  return Math.round((totalScore / dimensionScores.length) * 10) / 10;
}

// Get or create assignment for user + role/job + interview type
async function getOrCreateAssignment(
  userId: string,
  roleKitId: number | null,
  jobTargetId: string | null,
  interviewType: string
) {
  const baseConditions = and(
    eq(interviewAssignments.userId, userId),
    roleKitId ? eq(interviewAssignments.roleKitId, roleKitId) : sql`${interviewAssignments.roleKitId} IS NULL`,
    jobTargetId ? eq(interviewAssignments.jobTargetId, jobTargetId) : sql`${interviewAssignments.jobTargetId} IS NULL`
  );

  const existing = await db
    .select()
    .from(interviewAssignments)
    .where(baseConditions)
    .limit(1);

  const matchingType = existing.filter(e => e.interviewType === interviewType);
  if (matchingType.length > 0) {
    return matchingType[0];
  }

  const [newAssignment] = await db
    .insert(interviewAssignments)
    .values({
      userId,
      roleKitId,
      jobTargetId,
      interviewType: interviewType as any,
      attemptCount: 0,
    })
    .returning();

  return newAssignment;
}

// Create a new attempt (retake) for an interview
interviewProgressRouter.post("/retake", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { interviewSessionId, configId } = req.body;

    if (!interviewSessionId && !configId) {
      return res.status(400).json({ success: false, error: "Either interview session ID or config ID is required" });
    }

    let config: any;

    if (configId) {
      const [foundConfig] = await db
        .select()
        .from(interviewConfigs)
        .where(eq(interviewConfigs.id, configId))
        .limit(1);

      if (!foundConfig || foundConfig.userId !== userId) {
        return res.status(403).json({ success: false, error: "Access denied" });
      }
      config = foundConfig;
    } else {
      const [session] = await db
        .select()
        .from(interviewSessions)
        .where(eq(interviewSessions.id, interviewSessionId))
        .limit(1);

      if (!session) {
        return res.status(404).json({ success: false, error: "Interview session not found" });
      }

      const [foundConfig] = await db
        .select()
        .from(interviewConfigs)
        .where(eq(interviewConfigs.id, session.interviewConfigId))
        .limit(1);

      if (!foundConfig || foundConfig.userId !== userId) {
        return res.status(403).json({ success: false, error: "Access denied" });
      }
      config = foundConfig;
    }

    const assignment = await getOrCreateAssignment(
      userId,
      config.roleKitId,
      config.jobTargetId,
      config.interviewType
    );

    const newAttemptNumber = (assignment.attemptCount || 0) + 1;

    const [newConfig] = await db
      .insert(interviewConfigs)
      .values({
        userId,
        roleKitId: config.roleKitId,
        roleArchetypeId: config.roleArchetypeId,
        interviewMode: config.interviewMode,
        jobTargetId: config.jobTargetId,
        resumeDocId: config.resumeDocId,
        jdDocId: config.jdDocId,
        companyNotesDocId: config.companyNotesDocId,
        interviewType: config.interviewType,
        style: config.style,
        seniority: config.seniority,
        exerciseCount: config.exerciseCount,
        includePuzzles: config.includePuzzles,
      })
      .returning();

    res.json({
      success: true,
      configId: newConfig.id,
      attemptNumber: newAttemptNumber,
      assignmentId: assignment.id,
    });
  } catch (error) {
    console.error("Error creating retake:", error);
    res.status(500).json({ success: false, error: "Failed to create retake" });
  }
});

// Get attempt history for a role/job + interview type
interviewProgressRouter.get("/attempts", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { roleKitId, jobTargetId, interviewType } = req.query;

    let baseQuery = db
      .select()
      .from(interviewAssignments)
      .where(eq(interviewAssignments.userId, userId))
      .$dynamic();
    
    if (roleKitId) {
      baseQuery = baseQuery.where(eq(interviewAssignments.roleKitId, Number(roleKitId)));
    }
    if (jobTargetId) {
      baseQuery = baseQuery.where(eq(interviewAssignments.jobTargetId, String(jobTargetId)));
    }

    const assignments = await baseQuery.orderBy(desc(interviewAssignments.updatedAt));

    const filteredAssignments = interviewType 
      ? assignments.filter(a => a.interviewType === interviewType)
      : assignments;

    const results = await Promise.all(
      filteredAssignments.map(async (assignment) => {
        const sessions = await db
          .select({
            session: interviewSessions,
            analysis: interviewAnalysis,
          })
          .from(interviewSessions)
          .leftJoin(interviewAnalysis, eq(interviewAnalysis.interviewSessionId, interviewSessions.id))
          .innerJoin(interviewConfigs, eq(interviewConfigs.id, interviewSessions.interviewConfigId))
          .where(
            and(
              eq(interviewConfigs.userId, userId),
              eq(interviewConfigs.interviewType, assignment.interviewType),
              assignment.roleKitId
                ? eq(interviewConfigs.roleKitId, assignment.roleKitId)
                : sql`1=1`,
              assignment.jobTargetId
                ? eq(interviewConfigs.jobTargetId, assignment.jobTargetId)
                : sql`1=1`
            )
          )
          .orderBy(desc(interviewSessions.createdAt));

        const attempts = sessions.map((s, index) => ({
          attemptNumber: sessions.length - index,
          sessionId: s.session.id,
          status: s.session.status,
          score: s.analysis?.dimensionScores
            ? computeOverallScore(s.analysis.dimensionScores as any[])
            : null,
          recommendation: s.analysis?.overallRecommendation,
          createdAt: s.session.createdAt,
        }));

        return {
          ...assignment,
          attempts,
        };
      })
    );

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Error fetching attempts:", error);
    res.status(500).json({ success: false, error: "Failed to fetch attempt history" });
  }
});

// Update assignment after session analysis
interviewProgressRouter.post("/update-assignment", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { interviewSessionId } = req.body;

    if (!interviewSessionId) {
      return res.status(400).json({ success: false, error: "Interview session ID is required" });
    }

    const [session] = await db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.id, interviewSessionId))
      .limit(1);

    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    const [config] = await db
      .select()
      .from(interviewConfigs)
      .where(eq(interviewConfigs.id, session.interviewConfigId))
      .limit(1);

    if (!config || config.userId !== userId) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const [analysis] = await db
      .select()
      .from(interviewAnalysis)
      .where(eq(interviewAnalysis.interviewSessionId, interviewSessionId))
      .limit(1);

    const currentScore = analysis?.dimensionScores
      ? computeOverallScore(analysis.dimensionScores as any[])
      : null;

    const assignment = await getOrCreateAssignment(
      userId,
      config.roleKitId,
      config.jobTargetId,
      config.interviewType
    );

    const updates: any = {
      attemptCount: (assignment.attemptCount || 0) + 1,
      latestSessionId: interviewSessionId,
      latestScore: currentScore,
      updatedAt: new Date(),
    };

    if (currentScore !== null && (assignment.bestScore === null || currentScore > (assignment.bestScore || 0))) {
      updates.bestSessionId = interviewSessionId;
      updates.bestScore = currentScore;
    }

    await db
      .update(interviewAssignments)
      .set(updates)
      .where(eq(interviewAssignments.id, assignment.id));

    await db
      .update(interviewSessions)
      .set({
        assignmentId: assignment.id,
        attemptNumber: updates.attemptCount,
      })
      .where(eq(interviewSessions.id, interviewSessionId));

    if (currentScore !== null) {
      await createHireadySnapshot(
        userId,
        config.roleKitId,
        config.jobTargetId,
        interviewSessionId,
        currentScore,
        config.interviewType
      );
    }

    res.json({
      success: true,
      assignment: { ...assignment, ...updates },
      isNewBest: updates.bestSessionId === interviewSessionId,
    });
  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ success: false, error: "Failed to update assignment" });
  }
});

// Create Hiready Index snapshot
async function createHireadySnapshot(
  userId: string,
  roleKitId: number | null,
  jobTargetId: string | null,
  sessionId: number,
  score: number,
  interviewType: string
) {
  await db
    .update(hireadyIndexSnapshots)
    .set({ isLatest: false })
    .where(
      and(
        eq(hireadyIndexSnapshots.userId, userId),
        roleKitId ? eq(hireadyIndexSnapshots.roleKitId, roleKitId) : sql`1=1`,
        jobTargetId ? eq(hireadyIndexSnapshots.jobTargetId, jobTargetId) : sql`1=1`
      )
    );

  const consolidatedIndex = await computeConsolidatedIndex(userId, roleKitId, jobTargetId);

  const [snapshot] = await db
    .insert(hireadyIndexSnapshots)
    .values({
      userId,
      roleKitId,
      jobTargetId,
      interviewSessionId: sessionId,
      indexValue: score,
      weightedScores: [
        {
          interviewType,
          weight: getInterviewWeight(interviewType),
          score,
          weightedScore: score * getInterviewWeight(interviewType),
        },
      ],
      consolidatedIndex,
      isLatest: true,
      isBest: false,
    })
    .returning();

  const allSnapshots = await db
    .select()
    .from(hireadyIndexSnapshots)
    .where(
      and(
        eq(hireadyIndexSnapshots.userId, userId),
        roleKitId ? eq(hireadyIndexSnapshots.roleKitId, roleKitId) : sql`1=1`,
        jobTargetId ? eq(hireadyIndexSnapshots.jobTargetId, jobTargetId) : sql`1=1`
      )
    );

  const maxConsolidated = Math.max(...allSnapshots.map((s) => s.consolidatedIndex || 0));

  await db
    .update(hireadyIndexSnapshots)
    .set({ isBest: false })
    .where(
      and(
        eq(hireadyIndexSnapshots.userId, userId),
        roleKitId ? eq(hireadyIndexSnapshots.roleKitId, roleKitId) : sql`1=1`,
        jobTargetId ? eq(hireadyIndexSnapshots.jobTargetId, jobTargetId) : sql`1=1`
      )
    );

  if (snapshot.consolidatedIndex === maxConsolidated) {
    await db
      .update(hireadyIndexSnapshots)
      .set({ isBest: true })
      .where(eq(hireadyIndexSnapshots.id, snapshot.id));
  }

  return snapshot;
}

// Compute consolidated Hiready Index from latest attempts across all interview types
async function computeConsolidatedIndex(
  userId: string,
  roleKitId: number | null,
  jobTargetId: string | null
): Promise<number> {
  const conditions = [eq(interviewAssignments.userId, userId)];
  
  if (roleKitId) {
    conditions.push(eq(interviewAssignments.roleKitId, roleKitId));
  }
  if (jobTargetId) {
    conditions.push(eq(interviewAssignments.jobTargetId, jobTargetId));
  }

  const assignments = await db
    .select()
    .from(interviewAssignments)
    .where(and(...conditions));

  if (assignments.length === 0) return 0;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const assignment of assignments) {
    if (assignment.latestScore !== null) {
      const weight = getInterviewWeight(assignment.interviewType);
      totalWeight += weight;
      weightedSum += (assignment.latestScore || 0) * weight;
    }
  }

  if (totalWeight === 0) return 0;
  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

// Get list of roles/jobs user has practiced for
interviewProgressRouter.get("/hiready-roles", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    // Get unique roleKitIds from assignments
    const assignments = await db
      .select({
        roleKitId: interviewAssignments.roleKitId,
        jobTargetId: interviewAssignments.jobTargetId,
      })
      .from(interviewAssignments)
      .where(eq(interviewAssignments.userId, userId));

    const uniqueRoleKitIds = [...new Set(assignments.filter(a => a.roleKitId).map(a => a.roleKitId))];
    const uniqueJobTargetIds = [...new Set(assignments.filter(a => a.jobTargetId).map(a => a.jobTargetId))];

    // Fetch role kit details
    const roleKitDetails = uniqueRoleKitIds.length > 0
      ? await db
          .select({
            id: roleKits.id,
            name: roleKits.name,
            archetypeId: roleKits.roleArchetypeId,
          })
          .from(roleKits)
          .where(sql`${roleKits.id} = ANY(${sql.raw(`ARRAY[${uniqueRoleKitIds.join(',')}]`)})`)
      : [];

    // Fetch job target details
    const jobTargetDetails = uniqueJobTargetIds.length > 0
      ? await db
          .select({
            id: jobTargets.id,
            roleTitle: jobTargets.roleTitle,
            companyName: jobTargets.companyName,
            roleArchetypeId: jobTargets.roleArchetypeId,
          })
          .from(jobTargets)
          .where(sql`${jobTargets.id} = ANY(${sql.raw(`ARRAY['${uniqueJobTargetIds.join("','")}']`)})`)
      : [];

    res.json({
      success: true,
      roles: {
        roleKits: roleKitDetails.map(r => ({
          id: r.id,
          name: r.name,
          type: "role_kit",
          archetypeId: r.archetypeId,
        })),
        jobTargets: jobTargetDetails.map(j => ({
          id: j.id,
          name: `${j.roleTitle}${j.companyName ? ` at ${j.companyName}` : ''}`,
          type: "job_target",
          archetypeId: j.roleArchetypeId,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching hiready roles:", error);
    res.status(500).json({ success: false, error: "Failed to fetch roles" });
  }
});

// Get consolidated Hiready Index for role/job (ROLE-SPECIFIC)
interviewProgressRouter.get("/hiready-index", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    console.log("[Hiready Index] userId from auth:", userId);
    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { roleKitId, jobTargetId } = req.query;

    // Role or job target is required for role-specific index
    if (!roleKitId && !jobTargetId) {
      return res.status(400).json({ 
        success: false, 
        error: "Role kit ID or Job target ID is required for Hiready Index",
        requiresRole: true 
      });
    }

    // Get role context
    let roleName = "General";
    let roleArchetypeId: string | null = null;
    let companyContext: string | null = null;

    if (roleKitId) {
      const [roleKit] = await db
        .select()
        .from(roleKits)
        .where(eq(roleKits.id, Number(roleKitId)))
        .limit(1);
      
      if (roleKit) {
        roleName = roleKit.name;
        roleArchetypeId = roleKit.roleArchetypeId;
      }
    } else if (jobTargetId) {
      const [jobTarget] = await db
        .select()
        .from(jobTargets)
        .where(eq(jobTargets.id, String(jobTargetId)))
        .limit(1);
      
      if (jobTarget) {
        roleName = jobTarget.roleTitle || "Unknown Role";
        companyContext = jobTarget.companyName || null;
        roleArchetypeId = jobTarget.roleArchetypeId || null;
      }
    }

    // Get dimension weights for this role
    let dimensionWeights = ROLE_DIMENSION_WEIGHTS.default;
    if (roleArchetypeId && ROLE_DIMENSION_WEIGHTS[roleArchetypeId]) {
      dimensionWeights = ROLE_DIMENSION_WEIGHTS[roleArchetypeId];
    }

    // Build query conditions
    const conditions = [eq(interviewAssignments.userId, userId)];
    if (roleKitId) {
      conditions.push(eq(interviewAssignments.roleKitId, Number(roleKitId)));
    }
    if (jobTargetId) {
      conditions.push(eq(interviewAssignments.jobTargetId, String(jobTargetId)));
    }

    const assignments = await db
      .select()
      .from(interviewAssignments)
      .where(and(...conditions));
    
    console.log("[Hiready Index] Found assignments for role:", assignments.length);

    if (assignments.length === 0) {
      return res.json({
        success: true,
        hireadyIndex: null,
        message: "No interview practice data found for this role",
        role: { name: roleName, companyContext },
      });
    }

    // Get all session IDs from assignments
    const sessionIds = assignments
      .filter(a => a.latestSessionId)
      .map(a => a.latestSessionId!);

    // Fetch dimension scores from all related interview analyses
    const analyses = sessionIds.length > 0
      ? await db
          .select({
            sessionId: interviewAnalysis.interviewSessionId,
            dimensionScores: interviewAnalysis.dimensionScores,
            strengths: interviewAnalysis.strengths,
            improvements: interviewAnalysis.improvements,
          })
          .from(interviewAnalysis)
          .where(sql`${interviewAnalysis.interviewSessionId} = ANY(${sql.raw(`ARRAY[${sessionIds.join(',')}]`)})`)
      : [];

    // Aggregate dimension scores across all sessions
    const dimensionAggregates: Record<string, { scores: number[]; count: number }> = {
      clarity: { scores: [], count: 0 },
      structure: { scores: [], count: 0 },
      confidence: { scores: [], count: 0 },
      problem_solving: { scores: [], count: 0 },
      role_fit: { scores: [], count: 0 },
    };

    const allStrengths: string[] = [];
    const allImprovements: string[] = [];

    for (const analysis of analyses) {
      if (analysis.dimensionScores && Array.isArray(analysis.dimensionScores)) {
        for (const dim of analysis.dimensionScores as any[]) {
          const coreKey = mapDimensionToCore(dim.dimension);
          if (coreKey && dimensionAggregates[coreKey]) {
            dimensionAggregates[coreKey].scores.push(dim.score);
            dimensionAggregates[coreKey].count++;
          }
        }
      }
      if (analysis.strengths && Array.isArray(analysis.strengths)) {
        allStrengths.push(...(analysis.strengths as string[]));
      }
      if (analysis.improvements && Array.isArray(analysis.improvements)) {
        allImprovements.push(...(analysis.improvements as string[]));
      }
    }

    // Calculate weighted average score for each dimension
    const dimensionResults: Array<{
      key: string;
      label: string;
      score: number;
      weight: number;
      weightedScore: number;
    }> = [];

    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const dim of CORE_DIMENSIONS) {
      const agg = dimensionAggregates[dim.key];
      const avgScore = agg.scores.length > 0
        ? agg.scores.reduce((a, b) => a + b, 0) / agg.scores.length
        : 0;
      
      // Convert from 1-5 scale to 0-100 scale
      const normalizedScore = Math.round((avgScore / 5) * 100);
      const weight = dimensionWeights[dim.key] || 20;
      const weightedScore = normalizedScore * (weight / 100);

      dimensionResults.push({
        key: dim.key,
        label: dim.label,
        score: normalizedScore,
        weight,
        weightedScore,
      });

      totalWeightedScore += weightedScore;
      totalWeight += weight;
    }

    // Calculate overall score (0-100)
    const overallScore = totalWeight > 0 ? Math.round(totalWeightedScore) : 0;
    const readinessBand = getReadinessBand(overallScore);

    // Interview type breakdown
    const interviewBreakdown = assignments.map((a) => ({
      interviewType: a.interviewType,
      weight: getInterviewWeight(a.interviewType),
      attemptCount: a.attemptCount || 0,
      latestScore: a.latestScore !== null ? Math.round((a.latestScore / 5) * 100) : null,
      bestScore: a.bestScore !== null ? Math.round((a.bestScore / 5) * 100) : null,
      latestSessionId: a.latestSessionId,
    }));

    const totalSessions = assignments.reduce((sum, a) => sum + (a.attemptCount || 0), 0);

    // Extract top strengths and improvements
    const strengthCounts = allStrengths.reduce((acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const improvementCounts = allImprovements.reduce((acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topStrengths = Object.entries(strengthCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([s]) => s);

    const topImprovements = Object.entries(improvementCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([s]) => s);

    // Get historical snapshots for trend analysis
    const historicalSnapshots = await db
      .select()
      .from(hireadyIndexSnapshots)
      .where(
        and(
          eq(hireadyIndexSnapshots.userId, userId),
          roleKitId ? eq(hireadyIndexSnapshots.roleKitId, Number(roleKitId)) : sql`1=1`,
          jobTargetId ? eq(hireadyIndexSnapshots.jobTargetId, String(jobTargetId)) : sql`1=1`
        )
      )
      .orderBy(desc(hireadyIndexSnapshots.createdAt))
      .limit(10);

    // Use second snapshot as previous (first is most recent, need to compare to older one)
    const previousSnapshot = historicalSnapshots.length >= 2 ? historicalSnapshots[1] : null;
    const previousScore = previousSnapshot?.consolidatedIndex
      ? Math.round((previousSnapshot.consolidatedIndex / 5) * 100)
      : null;

    let trend: "improving" | "stable" | "declining" = "stable";
    if (previousScore !== null) {
      const delta = overallScore - previousScore;
      if (delta > 5) trend = "improving";
      else if (delta < -5) trend = "declining";
    }

    // Build session history for timeline chart - join sessions with configs for user/role info
    const sessionsForTimeline = await db
      .select({
        id: interviewSessions.id,
        createdAt: interviewSessions.createdAt,
        interviewType: interviewConfigs.interviewType,
        dimensionScores: interviewAnalysis.dimensionScores,
      })
      .from(interviewSessions)
      .innerJoin(interviewConfigs, eq(interviewSessions.interviewConfigId, interviewConfigs.id))
      .leftJoin(interviewAnalysis, eq(interviewAnalysis.interviewSessionId, interviewSessions.id))
      .where(
        and(
          eq(interviewConfigs.userId, userId),
          roleKitId ? eq(interviewConfigs.roleKitId, Number(roleKitId)) : sql`1=1`,
          jobTargetId ? eq(interviewConfigs.jobTargetId, String(jobTargetId)) : sql`1=1`
        )
      )
      .orderBy(interviewSessions.createdAt);

    // Build session scores from query results - compute overall score from dimension scores
    const sessionScores: Array<{
      sessionId: number;
      date: string;
      score: number;
      interviewType: string;
    }> = sessionsForTimeline
      .filter(s => s.dimensionScores && Array.isArray(s.dimensionScores) && s.dimensionScores.length > 0)
      .map(s => {
        const dims = s.dimensionScores as Array<{ score: number }>;
        const avgScore = dims.reduce((sum, d) => sum + (d.score || 0), 0) / dims.length;
        return {
          sessionId: s.id,
          date: s.createdAt?.toISOString() || new Date().toISOString(),
          score: Math.round((avgScore / 5) * 100),
          interviewType: s.interviewType || 'general',
        };
      });

    // Calculate capability milestones
    const practiceVolume = totalSessions;
    
    // Best attempt - use assignment data directly (most accurate source)
    let bestAttemptScore = 0;
    let bestAttemptSessionId: number | null = null;
    let bestAttemptInterviewType: string | null = null;
    
    for (const assignment of assignments) {
      if (assignment.bestScore !== null) {
        const normalizedScore = Math.round((assignment.bestScore / 5) * 100);
        if (normalizedScore > bestAttemptScore) {
          bestAttemptScore = normalizedScore;
          bestAttemptSessionId = assignment.bestSessionId || assignment.latestSessionId;
          bestAttemptInterviewType = assignment.interviewType;
        }
      } else if (assignment.latestScore !== null) {
        const normalizedScore = Math.round((assignment.latestScore / 5) * 100);
        if (normalizedScore > bestAttemptScore) {
          bestAttemptScore = normalizedScore;
          bestAttemptSessionId = assignment.latestSessionId;
          bestAttemptInterviewType = assignment.interviewType;
        }
      }
    }

    // Consistency score (how stable are the scores)
    let consistencyScore = 0;
    if (sessionScores.length >= 2) {
      const scores = sessionScores.map(s => s.score);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
      const stdDev = Math.sqrt(variance);
      // Consistency = 100 - (stdDev normalized). Higher consistency = lower variance
      consistencyScore = Math.max(0, Math.min(100, 100 - stdDev * 2));
    } else if (sessionScores.length === 1) {
      consistencyScore = 50; // Not enough data
    }

    // Interview coverage - count of completed types vs total assigned types
    const assignedTypes = new Set(assignments.map(a => a.interviewType));
    const completedTypes = new Set(assignments.filter(a => a.attemptCount && a.attemptCount > 0).map(a => a.interviewType));
    const coveragePercentage = assignedTypes.size > 0 
      ? Math.round((completedTypes.size / assignedTypes.size) * 100) 
      : 0;

    // Note: Dimension trends would require historical dimension-level data to compute accurately
    // For now, we omit trend data rather than show fabricated values
    const hasTrendData = false;

    // Calculate momentum only if we have sufficient data (6+ sessions)
    let momentum: "accelerating" | "steady" | "slowing" | null = null;
    if (sessionScores.length >= 6) {
      const recent3 = sessionScores.slice(-3).map(s => s.score);
      const prev3 = sessionScores.slice(-6, -3).map(s => s.score);
      const recentAvg = recent3.reduce((a, b) => a + b, 0) / 3;
      const prevAvg = prev3.reduce((a, b) => a + b, 0) / 3;
      if (recentAvg - prevAvg > 5) momentum = "accelerating";
      else if (prevAvg - recentAvg > 5) momentum = "slowing";
      else momentum = "steady";
    }

    res.json({
      success: true,
      hireadyIndex: {
        overallScore,
        readinessBand,
        role: {
          name: roleName,
          companyContext,
          archetypeId: roleArchetypeId,
        },
        dimensions: dimensionResults,
        dimensionWeights,
        interviewBreakdown: interviewBreakdown.map(ib => {
          const assignment = assignments.find(a => a.interviewType === ib.interviewType);
          return {
            ...ib,
            bestSessionId: assignment?.bestSessionId || assignment?.latestSessionId || null,
          };
        }),
        totalSessions,
        strengths: topStrengths,
        growthAreas: topImprovements,
        trend,
        previousScore,
        momentum,
        capabilityMilestones: {
          practiceVolume,
          bestAttempt: {
            score: bestAttemptScore,
            sessionId: bestAttemptSessionId,
            interviewType: bestAttemptInterviewType,
          },
          consistencyScore: sessionScores.length >= 2 ? Math.round(consistencyScore) : null,
          coveragePercentage,
        },
        progressTimeline: sessionScores,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching Hiready index:", error);
    res.status(500).json({ success: false, error: "Failed to fetch Hiready index" });
  }
});

// Generate share link
interviewProgressRouter.post("/share-link", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { roleKitId, jobTargetId, expiresInDays } = req.body;

    const [latestSnapshot] = await db
      .select()
      .from(hireadyIndexSnapshots)
      .where(
        and(
          eq(hireadyIndexSnapshots.userId, userId),
          eq(hireadyIndexSnapshots.isLatest, true),
          roleKitId ? eq(hireadyIndexSnapshots.roleKitId, Number(roleKitId)) : sql`1=1`,
          jobTargetId ? eq(hireadyIndexSnapshots.jobTargetId, String(jobTargetId)) : sql`1=1`
        )
      )
      .orderBy(desc(hireadyIndexSnapshots.createdAt))
      .limit(1);

    const token = randomBytes(16).toString("hex");
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const [shareLink] = await db
      .insert(hireadyShareLinks)
      .values({
        userId,
        roleKitId: roleKitId ? Number(roleKitId) : null,
        jobTargetId: jobTargetId || null,
        token,
        snapshotId: latestSnapshot?.id || null,
        expiresAt,
      })
      .returning();

    const baseUrl = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
      : `${req.protocol}://${req.get('host')}`;
    const shareUrl = `${baseUrl}/share/${shareLink.token}`;

    res.json({
      success: true,
      token: shareLink.token,
      shareUrl,
      shareLink: {
        id: shareLink.id,
        token: shareLink.token,
        url: `/share/${shareLink.token}`,
        expiresAt: shareLink.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error generating share link:", error);
    res.status(500).json({ success: false, error: "Failed to generate share link" });
  }
});

// Resolve share link (public)
interviewProgressRouter.get("/share/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const [shareLink] = await db
      .select()
      .from(hireadyShareLinks)
      .where(eq(hireadyShareLinks.token, token))
      .limit(1);

    if (!shareLink) {
      return res.status(404).json({ success: false, error: "Share link not found" });
    }

    if (shareLink.revokedAt) {
      return res.status(410).json({ success: false, error: "Share link has been revoked" });
    }

    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      return res.status(410).json({ success: false, error: "Share link has expired" });
    }

    await db
      .update(hireadyShareLinks)
      .set({ viewCount: (shareLink.viewCount || 0) + 1 })
      .where(eq(hireadyShareLinks.id, shareLink.id));

    const [user] = await db
      .select({ firstName: authUsers.firstName, lastName: authUsers.lastName })
      .from(authUsers)
      .where(eq(authUsers.id, shareLink.userId))
      .limit(1);

    let roleInfo: { name: string; roleCategory: string | null } | null = null;
    if (shareLink.roleKitId) {
      const [role] = await db
        .select({ name: roleKits.name, roleCategory: roleKits.roleCategory })
        .from(roleKits)
        .where(eq(roleKits.id, shareLink.roleKitId))
        .limit(1);
      roleInfo = role || null;
    }

    let jobInfo: { title: string; company: string | null } | null = null;
    if (shareLink.jobTargetId) {
      const [job] = await db
        .select({ title: jobTargets.roleTitle, company: jobTargets.companyName })
        .from(jobTargets)
        .where(eq(jobTargets.id, shareLink.jobTargetId))
        .limit(1);
      jobInfo = job || null;
    }

    const conditions = [eq(interviewAssignments.userId, shareLink.userId)];
    if (shareLink.roleKitId) {
      conditions.push(eq(interviewAssignments.roleKitId, shareLink.roleKitId));
    }
    if (shareLink.jobTargetId) {
      conditions.push(eq(interviewAssignments.jobTargetId, shareLink.jobTargetId));
    }

    const assignments = await db
      .select()
      .from(interviewAssignments)
      .where(and(...conditions));

    // Get session IDs for dimension analysis
    const sessionIds = assignments
      .filter(a => a.latestSessionId)
      .map(a => a.latestSessionId!);

    // Fetch dimension scores from interview analyses
    const analyses = sessionIds.length > 0
      ? await db
          .select({
            dimensionScores: interviewAnalysis.dimensionScores,
            strengths: interviewAnalysis.strengths,
          })
          .from(interviewAnalysis)
          .where(sql`${interviewAnalysis.interviewSessionId} = ANY(${sql.raw(`ARRAY[${sessionIds.join(',')}]`)})`)
      : [];

    // Aggregate dimension scores
    const dimensionAggregates: Record<string, { scores: number[]; count: number }> = {
      clarity: { scores: [], count: 0 },
      structure: { scores: [], count: 0 },
      confidence: { scores: [], count: 0 },
      problem_solving: { scores: [], count: 0 },
      role_fit: { scores: [], count: 0 },
    };

    const allStrengths: string[] = [];

    for (const analysis of analyses) {
      if (analysis.dimensionScores && Array.isArray(analysis.dimensionScores)) {
        for (const dim of analysis.dimensionScores as any[]) {
          const coreKey = mapDimensionToCore(dim.dimension);
          if (coreKey && dimensionAggregates[coreKey]) {
            dimensionAggregates[coreKey].scores.push(dim.score);
            dimensionAggregates[coreKey].count++;
          }
        }
      }
      if (analysis.strengths && Array.isArray(analysis.strengths)) {
        allStrengths.push(...(analysis.strengths as string[]));
      }
    }

    // Calculate dimension averages
    const dimensionResults = CORE_DIMENSIONS.map(dim => {
      const agg = dimensionAggregates[dim.key];
      const avgScore = agg.scores.length > 0
        ? agg.scores.reduce((a, b) => a + b, 0) / agg.scores.length
        : 0;
      return {
        key: dim.key,
        label: dim.label,
        score: Math.round((avgScore / 5) * 100),
      };
    });

    // Calculate overall score
    const totalScore = dimensionResults.reduce((sum, d) => sum + d.score, 0);
    const overallScore = Math.round(totalScore / dimensionResults.length);
    const readinessBand = getReadinessBand(overallScore);

    // Get top strengths
    const strengthCounts = allStrengths.reduce((acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topStrengths = Object.entries(strengthCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([s]) => s);

    const interviewScores = assignments.map((a) => ({
      interviewType: a.interviewType,
      weight: getInterviewWeight(a.interviewType),
      latestScore: a.latestScore !== null ? Math.round((a.latestScore / 5) * 100) : null,
      attemptCount: a.attemptCount,
    }));

    const totalSessions = assignments.reduce((sum, a) => sum + (a.attemptCount || 0), 0);

    res.json({
      success: true,
      data: {
        candidateName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Anonymous" : "Anonymous",
        role: roleInfo?.name || jobInfo?.title || "General",
        companyContext: jobInfo?.company || null,
        overallScore,
        readinessBand,
        dimensions: dimensionResults,
        strengths: topStrengths,
        interviewScores,
        totalSessions,
        lastUpdated: shareLink.createdAt,
      },
    });
  } catch (error) {
    console.error("Error resolving share link:", error);
    res.status(500).json({ success: false, error: "Failed to resolve share link" });
  }
});

// Revoke share link
interviewProgressRouter.post("/share/:token/revoke", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { token } = req.params;

    const [shareLink] = await db
      .select()
      .from(hireadyShareLinks)
      .where(and(eq(hireadyShareLinks.token, token), eq(hireadyShareLinks.userId, userId)))
      .limit(1);

    if (!shareLink) {
      return res.status(404).json({ success: false, error: "Share link not found" });
    }

    await db
      .update(hireadyShareLinks)
      .set({ revokedAt: new Date() })
      .where(eq(hireadyShareLinks.id, shareLink.id));

    res.json({ success: true, message: "Share link revoked" });
  } catch (error) {
    console.error("Error revoking share link:", error);
    res.status(500).json({ success: false, error: "Failed to revoke share link" });
  }
});

export default interviewProgressRouter;
