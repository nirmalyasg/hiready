import { Router, Request, Response } from "express";
import { db } from "../db.js";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
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

    const uniqueRoleKitIds = [...new Set(assignments.filter(a => a.roleKitId).map(a => a.roleKitId))] as number[];
    const uniqueJobTargetIds = [...new Set(assignments.filter(a => a.jobTargetId).map(a => a.jobTargetId))] as string[];

    // Fetch role kit details with parameterized query
    const roleKitDetails = uniqueRoleKitIds.length > 0
      ? await db
          .select({
            id: roleKits.id,
            name: roleKits.name,
            archetypeId: roleKits.roleArchetypeId,
          })
          .from(roleKits)
          .where(inArray(roleKits.id, uniqueRoleKitIds))
      : [];

    // Fetch job target details with parameterized query and userId filter
    const jobTargetDetails = uniqueJobTargetIds.length > 0
      ? await db
          .select({
            id: jobTargets.id,
            roleTitle: jobTargets.roleTitle,
            companyName: jobTargets.companyName,
            roleArchetypeId: jobTargets.roleArchetypeId,
          })
          .from(jobTargets)
          .where(and(
            inArray(jobTargets.id, uniqueJobTargetIds),
            eq(jobTargets.userId, userId)
          ))
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
        .where(and(
          eq(jobTargets.id, String(jobTargetId)),
          eq(jobTargets.userId, userId)
        ))
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
          .where(inArray(interviewAnalysis.interviewSessionId, sessionIds))
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

// =====================
// Skills-to-Interview-Type Mapping
// =====================

// Categorize skills into interview type buckets
const SKILL_INTERVIEW_TYPE_MAPPING: Record<string, string[]> = {
  // Technical/Coding skills
  coding: [
    "python", "java", "javascript", "typescript", "c++", "go", "rust", "ruby", "php",
    "data structures", "algorithms", "leetcode", "programming", "software development",
    "coding", "debugging", "object-oriented", "oop", "functional programming",
    "api development", "backend", "frontend", "full stack", "web development",
    "mobile development", "react", "angular", "vue", "node.js", "django", "flask",
    "spring", "docker", "kubernetes", "git", "version control"
  ],
  // SQL/Analytics skills  
  sql: [
    "sql", "mysql", "postgresql", "database", "query optimization", "data modeling",
    "etl", "data warehousing", "snowflake", "redshift", "bigquery", "nosql", "mongodb"
  ],
  // System Design skills
  system_design: [
    "system design", "architecture", "scalability", "distributed systems", "microservices",
    "load balancing", "caching", "database design", "api design", "high availability",
    "fault tolerance", "performance optimization", "cloud architecture", "aws", "gcp", "azure"
  ],
  // ML/Data Science skills
  ml: [
    "machine learning", "deep learning", "neural networks", "nlp", "computer vision",
    "tensorflow", "pytorch", "scikit-learn", "data science", "statistics", "modeling",
    "feature engineering", "model deployment", "mlops", "a/b testing"
  ],
  // Analytics/Product skills
  analytics: [
    "analytics", "data analysis", "metrics", "kpis", "dashboards", "tableau", "power bi",
    "excel", "data visualization", "business intelligence", "reporting", "insights"
  ],
  // Behavioral/HR skills
  behavioral: [
    "communication", "teamwork", "collaboration", "leadership", "problem solving",
    "conflict resolution", "time management", "adaptability", "creativity", "initiative",
    "work ethic", "self-motivation", "emotional intelligence", "interpersonal skills"
  ],
  // Case Study/Product Sense skills
  case_study: [
    "case study", "business analysis", "strategy", "market analysis", "competitive analysis",
    "financial modeling", "consulting", "problem framing", "hypothesis testing",
    "product sense", "product management", "user research", "product strategy",
    "prioritization", "roadmap", "stakeholder management"
  ],
  // Hiring Manager/General skills
  hiring_manager: [
    "project management", "agile", "scrum", "team leadership", "mentoring",
    "cross-functional", "stakeholder communication", "business acumen", "domain expertise"
  ],
  // Technical (general technical)
  technical: [
    "technical skills", "technical knowledge", "engineering", "development",
    "testing", "qa", "debugging", "troubleshooting", "code review"
  ],
};

function categorizeSkillsByInterviewType(skills: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {
    coding: [],
    sql: [],
    system_design: [],
    ml: [],
    analytics: [],
    behavioral: [],
    case_study: [],
    hiring_manager: [],
    technical: [],
    general: [],
  };

  for (const skill of skills) {
    const lowerSkill = skill.toLowerCase();
    let matched = false;

    for (const [interviewType, keywords] of Object.entries(SKILL_INTERVIEW_TYPE_MAPPING)) {
      if (keywords.some(kw => lowerSkill.includes(kw) || kw.includes(lowerSkill))) {
        if (result[interviewType]) {
          result[interviewType].push(skill);
        }
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Default to technical for unmatched technical-sounding skills
      if (lowerSkill.match(/\b(api|sdk|framework|library|tool|platform)\b/i)) {
        result.technical.push(skill);
      } else {
        result.general.push(skill);
      }
    }
  }

  return result;
}

// Get comprehensive analysis across all interview types for a role/job
interviewProgressRouter.get("/comprehensive-analysis", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { roleKitId, jobTargetId } = req.query;

    if (!roleKitId && !jobTargetId) {
      return res.status(400).json({ 
        success: false, 
        error: "Role kit ID or Job target ID is required",
      });
    }

    // Get role context and skills
    let roleName = "General";
    let companyContext: string | null = null;
    let jdSkills: string[] = [];
    let skillsFocus: string[] = [];
    let roleArchetypeId: string | null = null;

    if (jobTargetId) {
      const [jobTarget] = await db
        .select()
        .from(jobTargets)
        .where(and(
          eq(jobTargets.id, String(jobTargetId)),
          eq(jobTargets.userId, userId)
        ))
        .limit(1);
      
      if (jobTarget) {
        roleName = jobTarget.roleTitle || "Unknown Role";
        companyContext = jobTarget.companyName || null;
        roleArchetypeId = jobTarget.roleArchetypeId || null;
        
        // Extract skills from parsed JD
        const parsed = jobTarget.jdParsed as { requiredSkills?: string[]; preferredSkills?: string[] } | null;
        if (parsed) {
          jdSkills = [...(parsed.requiredSkills || []), ...(parsed.preferredSkills || [])];
        }
      }
    } else if (roleKitId) {
      const [roleKit] = await db
        .select()
        .from(roleKits)
        .where(eq(roleKits.id, Number(roleKitId)))
        .limit(1);
      
      if (roleKit) {
        roleName = roleKit.name;
        roleArchetypeId = roleKit.roleArchetypeId;
        skillsFocus = (roleKit.skillsFocus as string[]) || [];
        jdSkills = skillsFocus;
      }
    }

    // Categorize skills by interview type
    const skillsByInterviewType = categorizeSkillsByInterviewType(jdSkills);

    // Get all assignments for this role
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

    if (assignments.length === 0) {
      return res.json({
        success: true,
        comprehensiveAnalysis: null,
        message: "No interview data found for this role",
        role: { name: roleName, companyContext },
        skillsByInterviewType,
        allSkills: jdSkills,
      });
    }

    // Get all session IDs
    const allSessionIds: number[] = [];
    for (const a of assignments) {
      if (a.latestSessionId) allSessionIds.push(a.latestSessionId);
      if (a.bestSessionId && a.bestSessionId !== a.latestSessionId) {
        allSessionIds.push(a.bestSessionId);
      }
    }

    // Fetch all analyses with their session/config data
    const analysesWithConfig = allSessionIds.length > 0
      ? await db
          .select({
            analysis: interviewAnalysis,
            session: interviewSessions,
            config: interviewConfigs,
          })
          .from(interviewAnalysis)
          .innerJoin(interviewSessions, eq(interviewAnalysis.interviewSessionId, interviewSessions.id))
          .innerJoin(interviewConfigs, eq(interviewSessions.interviewConfigId, interviewConfigs.id))
          .where(inArray(interviewAnalysis.interviewSessionId, allSessionIds))
      : [];

    // Group analyses by interview type
    const analysisByType: Record<string, {
      interviewType: string;
      sessions: Array<{
        sessionId: number;
        createdAt: string;
        recommendation: string | null;
        summary: string | null;
        dimensionScores: any[];
        strengths: string[];
        improvements: string[];
        risks: string[];
        betterAnswers: any[];
      }>;
      relevantSkills: string[];
      aggregatedScore: number | null;
      overallRecommendation: string | null;
      topStrengths: string[];
      topImprovements: string[];
    }> = {};

    for (const { analysis, session, config } of analysesWithConfig) {
      const interviewType = config.interviewType || "general";
      
      if (!analysisByType[interviewType]) {
        analysisByType[interviewType] = {
          interviewType,
          sessions: [],
          relevantSkills: skillsByInterviewType[interviewType] || [],
          aggregatedScore: null,
          overallRecommendation: null,
          topStrengths: [],
          topImprovements: [],
        };
      }

      analysisByType[interviewType].sessions.push({
        sessionId: session.id,
        createdAt: session.createdAt?.toISOString() || new Date().toISOString(),
        recommendation: analysis.overallRecommendation,
        summary: analysis.summary,
        dimensionScores: (analysis.dimensionScores as any[]) || [],
        strengths: (analysis.strengths as string[]) || [],
        improvements: (analysis.improvements as string[]) || [],
        risks: (analysis.risks as string[]) || [],
        betterAnswers: (analysis.betterAnswers as any[]) || [],
      });
    }

    // Calculate aggregated metrics for each interview type
    for (const typeData of Object.values(analysisByType)) {
      if (typeData.sessions.length === 0) continue;

      // Calculate average score across sessions
      const scores: number[] = [];
      const allStrengths: string[] = [];
      const allImprovements: string[] = [];
      const recommendations: string[] = [];

      for (const session of typeData.sessions) {
        if (session.dimensionScores && session.dimensionScores.length > 0) {
          const avgScore = session.dimensionScores.reduce((sum, d) => sum + (d.score || 0), 0) / session.dimensionScores.length;
          scores.push(avgScore);
        }
        allStrengths.push(...session.strengths);
        allImprovements.push(...session.improvements);
        if (session.recommendation) recommendations.push(session.recommendation);
      }

      typeData.aggregatedScore = scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length / 5) * 100)
        : null;

      // Get most recent/frequent recommendation
      if (recommendations.length > 0) {
        const recCounts = recommendations.reduce((acc, r) => {
          acc[r] = (acc[r] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        typeData.overallRecommendation = Object.entries(recCounts)
          .sort((a, b) => b[1] - a[1])[0][0];
      }

      // Top strengths and improvements (deduplicated)
      const strengthCounts = allStrengths.reduce((acc, s) => {
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      typeData.topStrengths = Object.entries(strengthCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([s]) => s);

      const improvementCounts = allImprovements.reduce((acc, s) => {
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      typeData.topImprovements = Object.entries(improvementCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([s]) => s);
    }

    // Generate overall consolidated summary
    const allTypeScores = Object.values(analysisByType)
      .filter(t => t.aggregatedScore !== null)
      .map(t => ({ type: t.interviewType, score: t.aggregatedScore!, weight: getInterviewWeight(t.interviewType) }));

    let overallWeightedScore = 0;
    let totalWeight = 0;
    for (const ts of allTypeScores) {
      overallWeightedScore += ts.score * ts.weight;
      totalWeight += ts.weight;
    }
    const consolidatedScore = totalWeight > 0 ? Math.round(overallWeightedScore / totalWeight) : null;

    // Determine strongest and weakest areas
    const sortedTypes = [...allTypeScores].sort((a, b) => b.score - a.score);
    const strongestAreas = sortedTypes.slice(0, 2).map(t => t.type);
    const weakestAreas = sortedTypes.slice(-2).reverse().map(t => t.type);

    // Generate narrative summary
    let narrativeSummary = "";
    if (consolidatedScore !== null) {
      const readinessBand = getReadinessBand(consolidatedScore);
      narrativeSummary = `Overall interview readiness: ${readinessBand.label} (${consolidatedScore}%). `;
      
      if (strongestAreas.length > 0) {
        narrativeSummary += `Strongest performance in ${strongestAreas.map(a => a.replace(/_/g, ' ')).join(' and ')}. `;
      }
      if (weakestAreas.length > 0 && weakestAreas[0] !== strongestAreas[0]) {
        narrativeSummary += `Focus on improving ${weakestAreas[0].replace(/_/g, ' ')} skills. `;
      }
      
      const totalInterviewTypes = Object.keys(analysisByType).length;
      const totalSessions = Object.values(analysisByType).reduce((sum, t) => sum + t.sessions.length, 0);
      narrativeSummary += `Based on ${totalSessions} interview sessions across ${totalInterviewTypes} interview types.`;
    }

    res.json({
      success: true,
      comprehensiveAnalysis: {
        role: {
          name: roleName,
          companyContext,
          archetypeId: roleArchetypeId,
        },
        allSkills: jdSkills,
        skillsByInterviewType,
        interviewTypeAnalyses: Object.values(analysisByType),
        consolidatedMetrics: {
          overallScore: consolidatedScore,
          readinessBand: consolidatedScore ? getReadinessBand(consolidatedScore) : null,
          strongestAreas,
          weakestAreas,
          totalInterviewTypes: Object.keys(analysisByType).length,
          totalSessions: Object.values(analysisByType).reduce((sum, t) => sum + t.sessions.length, 0),
        },
        narrativeSummary,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching comprehensive analysis:", error);
    res.status(500).json({ success: false, error: "Failed to fetch comprehensive analysis" });
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
          .where(inArray(interviewAnalysis.interviewSessionId, sessionIds))
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

// Detailed Interview Type Report - Deep analysis for a specific interview type
interviewProgressRouter.get("/interview-type-report", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { roleKitId, jobTargetId, interviewType } = req.query;

    if (!interviewType) {
      return res.status(400).json({ 
        success: false, 
        error: "Interview type is required",
      });
    }

    if (!roleKitId && !jobTargetId) {
      return res.status(400).json({ 
        success: false, 
        error: "Role kit ID or Job target ID is required",
      });
    }

    // Get role context and skills
    let roleName = "General";
    let companyContext: string | null = null;
    let jdSkills: string[] = [];
    let roleArchetypeId: string | null = null;

    if (jobTargetId) {
      const [jobTarget] = await db
        .select()
        .from(jobTargets)
        .where(and(
          eq(jobTargets.id, String(jobTargetId)),
          eq(jobTargets.userId, userId)
        ))
        .limit(1);
      
      if (jobTarget) {
        roleName = jobTarget.roleTitle || "Unknown Role";
        companyContext = jobTarget.companyName || null;
        roleArchetypeId = jobTarget.roleArchetypeId || null;
        
        const parsed = jobTarget.jdParsed as { requiredSkills?: string[]; preferredSkills?: string[] } | null;
        if (parsed) {
          jdSkills = [...(parsed.requiredSkills || []), ...(parsed.preferredSkills || [])];
        }
      }
    } else if (roleKitId) {
      const [roleKit] = await db
        .select()
        .from(roleKits)
        .where(eq(roleKits.id, Number(roleKitId)))
        .limit(1);
      
      if (roleKit) {
        roleName = roleKit.name;
        roleArchetypeId = roleKit.roleArchetypeId;
        jdSkills = (roleKit.skillsFocus as string[]) || [];
      }
    }

    // Categorize skills by interview type and get skills relevant to this interview type
    const skillsByInterviewType = categorizeSkillsByInterviewType(jdSkills);
    const relevantSkills = skillsByInterviewType[String(interviewType)] || [];

    // Get all configs for this user with the specific interview type
    const configConditions = [
      eq(interviewConfigs.userId, userId),
      eq(interviewConfigs.interviewType, String(interviewType) as any),
    ];
    if (roleKitId) {
      configConditions.push(eq(interviewConfigs.roleKitId, Number(roleKitId)));
    }
    if (jobTargetId) {
      configConditions.push(eq(interviewConfigs.jobTargetId, String(jobTargetId)));
    }

    const configs = await db
      .select()
      .from(interviewConfigs)
      .where(and(...configConditions));

    if (configs.length === 0) {
      return res.json({
        success: true,
        report: null,
        message: `No ${interviewType} interview sessions found for this role`,
        role: { name: roleName, companyContext },
        interviewType: String(interviewType),
        relevantSkills,
      });
    }

    const configIds = configs.map(c => c.id);

    // Fetch all sessions with their analyses for these configs
    const sessionsWithAnalysis = await db
      .select({
        session: interviewSessions,
        analysis: interviewAnalysis,
        config: interviewConfigs,
      })
      .from(interviewSessions)
      .leftJoin(interviewAnalysis, eq(interviewAnalysis.interviewSessionId, interviewSessions.id))
      .innerJoin(interviewConfigs, eq(interviewSessions.interviewConfigId, interviewConfigs.id))
      .where(inArray(interviewSessions.interviewConfigId, configIds))
      .orderBy(desc(interviewSessions.createdAt));

    // Build attempt-by-attempt data
    const attempts: Array<{
      sessionId: number;
      attemptNumber: number;
      createdAt: string;
      status: string;
      recommendation: string | null;
      summary: string | null;
      overallScore: number | null;
      dimensionScores: Array<{
        dimension: string;
        score: number;
        evidence: string[];
        rationale: string;
        improvement: string;
      }>;
      strengths: string[];
      improvements: string[];
      risks: string[];
      betterAnswers: Array<{ question: string; betterAnswer: string }>;
      resultsUrl: string;
    }> = [];

    // Track skill-by-skill scores across all attempts
    const skillScoreHistory: Record<string, Array<{
      attemptNumber: number;
      sessionId: number;
      score: number;
      date: string;
    }>> = {};

    // Initialize relevant skills tracking
    for (const skill of relevantSkills) {
      skillScoreHistory[skill] = [];
    }

    // Also track dimension scores across attempts
    const dimensionScoreHistory: Record<string, Array<{
      attemptNumber: number;
      sessionId: number;
      score: number;
      date: string;
    }>> = {};

    let attemptNum = sessionsWithAnalysis.length;
    for (const { session, analysis, config } of sessionsWithAnalysis) {
      const dimensionScores = (analysis?.dimensionScores as any[]) || [];
      const strengths = (analysis?.strengths as string[]) || [];
      const improvements = (analysis?.improvements as string[]) || [];
      const risks = (analysis?.risks as string[]) || [];
      const betterAnswers = (analysis?.betterAnswers as any[]) || [];

      // Calculate overall score from dimensions
      let overallScore: number | null = null;
      if (dimensionScores.length > 0) {
        const avgScore = dimensionScores.reduce((sum, d) => sum + (d.score || 0), 0) / dimensionScores.length;
        overallScore = Math.round((avgScore / 5) * 100);
      }

      attempts.push({
        sessionId: session.id,
        attemptNumber: attemptNum,
        createdAt: session.createdAt?.toISOString() || new Date().toISOString(),
        status: session.status,
        recommendation: analysis?.overallRecommendation || null,
        summary: analysis?.summary || null,
        overallScore,
        dimensionScores,
        strengths,
        improvements,
        risks,
        betterAnswers,
        resultsUrl: `/interview/results?sessionId=${session.id}`,
      });

      // Track dimension scores over time
      for (const dimScore of dimensionScores) {
        const dimName = dimScore.dimension || "Unknown";
        if (!dimensionScoreHistory[dimName]) {
          dimensionScoreHistory[dimName] = [];
        }
        dimensionScoreHistory[dimName].push({
          attemptNumber: attemptNum,
          sessionId: session.id,
          score: dimScore.score || 0,
          date: session.createdAt?.toISOString() || new Date().toISOString(),
        });

        // Map dimension to relevant skills if possible
        const mappedSkill = mapDimensionToSkill(dimName, relevantSkills);
        if (mappedSkill && skillScoreHistory[mappedSkill]) {
          skillScoreHistory[mappedSkill].push({
            attemptNumber: attemptNum,
            sessionId: session.id,
            score: dimScore.score || 0,
            date: session.createdAt?.toISOString() || new Date().toISOString(),
          });
        }
      }

      attemptNum--;
    }

    // Sort attempts by attempt number (oldest first for progression display)
    attempts.sort((a, b) => a.attemptNumber - b.attemptNumber);

    // Calculate skill summaries with trends
    const skillSummaries: Array<{
      skill: string;
      latestScore: number | null;
      avgScore: number | null;
      trend: "improving" | "declining" | "stable" | "insufficient_data";
      attemptCount: number;
      bestScore: number | null;
      evidenceSnippets: string[];
    }> = [];

    for (const skill of relevantSkills) {
      const history = skillScoreHistory[skill] || [];
      if (history.length === 0) {
        skillSummaries.push({
          skill,
          latestScore: null,
          avgScore: null,
          trend: "insufficient_data",
          attemptCount: 0,
          bestScore: null,
          evidenceSnippets: [],
        });
        continue;
      }

      const sortedHistory = [...history].sort((a, b) => a.attemptNumber - b.attemptNumber);
      const latestScore = sortedHistory[sortedHistory.length - 1]?.score || null;
      const avgScore = Math.round((history.reduce((sum, h) => sum + h.score, 0) / history.length) * 10) / 10;
      const bestScore = Math.max(...history.map(h => h.score));

      // Determine trend
      let trend: "improving" | "declining" | "stable" | "insufficient_data" = "insufficient_data";
      if (sortedHistory.length >= 2) {
        const firstHalf = sortedHistory.slice(0, Math.ceil(sortedHistory.length / 2));
        const secondHalf = sortedHistory.slice(Math.ceil(sortedHistory.length / 2));
        const firstAvg = firstHalf.reduce((sum, h) => sum + h.score, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, h) => sum + h.score, 0) / secondHalf.length;
        const diff = secondAvg - firstAvg;
        if (diff > 0.3) trend = "improving";
        else if (diff < -0.3) trend = "declining";
        else trend = "stable";
      }

      skillSummaries.push({
        skill,
        latestScore,
        avgScore,
        trend,
        attemptCount: history.length,
        bestScore,
        evidenceSnippets: [],
      });
    }

    // Calculate overall metrics for this interview type
    const analyzedAttempts = attempts.filter(a => a.overallScore !== null);
    const overallScore = analyzedAttempts.length > 0
      ? Math.round(analyzedAttempts.reduce((sum, a) => sum + (a.overallScore || 0), 0) / analyzedAttempts.length)
      : null;

    // Aggregate all dimension scores
    const allDimensionScores: Record<string, { total: number; count: number }> = {};
    for (const attempt of attempts) {
      for (const dim of attempt.dimensionScores) {
        if (!allDimensionScores[dim.dimension]) {
          allDimensionScores[dim.dimension] = { total: 0, count: 0 };
        }
        allDimensionScores[dim.dimension].total += dim.score || 0;
        allDimensionScores[dim.dimension].count++;
      }
    }

    const dimensionAverages = Object.entries(allDimensionScores).map(([dimension, data]) => ({
      dimension,
      avgScore: Math.round((data.total / data.count) * 10) / 10,
      percentile: Math.round((data.total / data.count / 5) * 100),
    }));

    // Collect all strengths and improvements across attempts
    const allStrengths = attempts.flatMap(a => a.strengths);
    const allImprovements = attempts.flatMap(a => a.improvements);
    const allRisks = attempts.flatMap(a => a.risks);

    // Count frequency of each
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
      .slice(0, 5)
      .map(([s, count]) => ({ text: s, frequency: count }));

    const topImprovements = Object.entries(improvementCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([s, count]) => ({ text: s, frequency: count }));

    // Calculate progression data for chart
    const progressionData = attempts
      .filter(a => a.overallScore !== null)
      .map(a => ({
        attemptNumber: a.attemptNumber,
        date: a.createdAt,
        score: a.overallScore,
      }));

    // Determine readiness band
    const readinessBand = overallScore !== null ? getReadinessBand(overallScore) : null;

    // Generate interview-type specific metrics
    const typeSpecificMetrics = getTypeSpecificMetrics(String(interviewType), dimensionAverages, attempts);

    // Calculate skill coverage (skills practiced vs total relevant skills)
    const skillsCovered = skillSummaries.filter(s => s.attemptCount > 0).length;
    const skillCoverage = {
      covered: skillsCovered,
      total: relevantSkills.length,
      percentage: relevantSkills.length > 0 ? Math.round((skillsCovered / relevantSkills.length) * 100) : 0,
      uncoveredSkills: skillSummaries.filter(s => s.attemptCount === 0).map(s => s.skill),
    };

    res.json({
      success: true,
      report: {
        role: {
          name: roleName,
          companyContext,
          archetypeId: roleArchetypeId,
        },
        interviewType: String(interviewType),
        interviewTypeLabel: formatInterviewTypeLabel(String(interviewType)),
        relevantSkills,
        overallMetrics: {
          overallScore,
          readinessBand,
          totalAttempts: attempts.length,
          analyzedAttempts: analyzedAttempts.length,
          latestAttemptDate: attempts.length > 0 ? attempts[attempts.length - 1].createdAt : null,
        },
        skillSummaries,
        skillCoverage,
        dimensionAverages,
        typeSpecificMetrics,
        attempts,
        progressionData,
        topStrengths,
        topImprovements,
        commonRisks: [...new Set(allRisks)].slice(0, 5),
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching interview type report:", error);
    res.status(500).json({ success: false, error: "Failed to fetch interview type report" });
  }
});

// Helper: Map dimension name to relevant skill
function mapDimensionToSkill(dimension: string, relevantSkills: string[]): string | null {
  const lower = dimension.toLowerCase();
  for (const skill of relevantSkills) {
    const skillLower = skill.toLowerCase();
    if (lower.includes(skillLower) || skillLower.includes(lower)) {
      return skill;
    }
    // Check for common mappings
    if ((lower.includes("problem") || lower.includes("solving")) && 
        (skillLower.includes("problem") || skillLower.includes("analytical"))) {
      return skill;
    }
    if (lower.includes("communication") && skillLower.includes("communication")) {
      return skill;
    }
    if (lower.includes("clarity") && (skillLower.includes("clarity") || skillLower.includes("communication"))) {
      return skill;
    }
  }
  return null;
}

// Helper: Format interview type as readable label
function formatInterviewTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    technical: "Technical Interview",
    coding: "Coding Interview",
    behavioral: "Behavioral Interview",
    case_study: "Case Study Interview",
    case: "Case Interview",
    system_design: "System Design Interview",
    hr: "HR Screening",
    hiring_manager: "Hiring Manager Interview",
    sql: "SQL Technical Interview",
    ml: "Machine Learning Interview",
    analytics: "Analytics Interview",
    panel: "Panel Interview",
    product_sense: "Product Sense Interview",
    general: "General Interview",
    skill_practice: "Skill Practice",
  };
  return labels[type] || type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

// Helper: Get interview-type-specific metrics
function getTypeSpecificMetrics(
  interviewType: string,
  dimensionAverages: Array<{ dimension: string; avgScore: number; percentile: number }>,
  attempts: any[]
): Record<string, any> {
  const metrics: Record<string, any> = {};

  switch (interviewType) {
    case "technical":
    case "coding":
      metrics.focusAreas = ["Problem Solving", "Code Quality", "Algorithm Knowledge", "Debugging Skills"];
      metrics.keyDimensions = dimensionAverages.filter(d => 
        d.dimension.toLowerCase().includes("problem") ||
        d.dimension.toLowerCase().includes("depth") ||
        d.dimension.toLowerCase().includes("technical")
      );
      break;
    case "behavioral":
      metrics.focusAreas = ["STAR Structure", "Leadership Examples", "Communication Clarity", "Self-Awareness"];
      metrics.keyDimensions = dimensionAverages.filter(d => 
        d.dimension.toLowerCase().includes("clarity") ||
        d.dimension.toLowerCase().includes("confidence") ||
        d.dimension.toLowerCase().includes("structure")
      );
      break;
    case "case_study":
    case "case":
      metrics.focusAreas = ["Structured Thinking", "Hypothesis Formation", "Data Analysis", "Recommendation Quality"];
      metrics.keyDimensions = dimensionAverages.filter(d => 
        d.dimension.toLowerCase().includes("structure") ||
        d.dimension.toLowerCase().includes("problem") ||
        d.dimension.toLowerCase().includes("analysis")
      );
      break;
    case "system_design":
      metrics.focusAreas = ["Scalability", "Trade-off Analysis", "Component Design", "Requirements Gathering"];
      metrics.keyDimensions = dimensionAverages.filter(d => 
        d.dimension.toLowerCase().includes("depth") ||
        d.dimension.toLowerCase().includes("problem")
      );
      break;
    case "hr":
    case "hiring_manager":
      metrics.focusAreas = ["Culture Fit", "Career Motivation", "Role Understanding", "Communication"];
      metrics.keyDimensions = dimensionAverages.filter(d => 
        d.dimension.toLowerCase().includes("fit") ||
        d.dimension.toLowerCase().includes("confidence") ||
        d.dimension.toLowerCase().includes("communication")
      );
      break;
    default:
      metrics.focusAreas = ["Overall Performance", "Communication", "Problem Solving", "Role Fit"];
      metrics.keyDimensions = dimensionAverages.slice(0, 4);
  }

  return metrics;
}

// =====================================================
// UNIFIED FULL REPORT - Single endpoint for complete shareable page
// =====================================================
interviewProgressRouter.get("/full-report", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { roleKitId, jobTargetId } = req.query;

    if (!roleKitId && !jobTargetId) {
      return res.status(400).json({ 
        success: false, 
        error: "Role kit ID or Job target ID is required",
      });
    }

    // Get role context and skills
    let roleName = "General";
    let companyContext: string | null = null;
    let jdSkills: string[] = [];
    let roleArchetypeId: string | null = null;

    if (jobTargetId) {
      const [jobTarget] = await db
        .select()
        .from(jobTargets)
        .where(and(
          eq(jobTargets.id, String(jobTargetId)),
          eq(jobTargets.userId, userId)
        ))
        .limit(1);
      
      if (jobTarget) {
        roleName = jobTarget.roleTitle || "Unknown Role";
        companyContext = jobTarget.companyName || null;
        roleArchetypeId = jobTarget.roleArchetypeId || null;
        
        const parsed = jobTarget.jdParsed as { requiredSkills?: string[]; preferredSkills?: string[] } | null;
        if (parsed) {
          jdSkills = [...(parsed.requiredSkills || []), ...(parsed.preferredSkills || [])];
        }
      }
    } else if (roleKitId) {
      const [roleKit] = await db
        .select()
        .from(roleKits)
        .where(eq(roleKits.id, Number(roleKitId)))
        .limit(1);
      
      if (roleKit) {
        roleName = roleKit.name;
        roleArchetypeId = roleKit.roleArchetypeId;
        jdSkills = (roleKit.skillsFocus as string[]) || [];
      }
    }

    // Categorize skills by interview type
    const skillsByInterviewType = categorizeSkillsByInterviewType(jdSkills);

    // Get all assignments for this role
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

    // Get all session IDs
    const allSessionIds: number[] = [];
    for (const a of assignments) {
      if (a.latestSessionId) allSessionIds.push(a.latestSessionId);
      if (a.bestSessionId && a.bestSessionId !== a.latestSessionId) {
        allSessionIds.push(a.bestSessionId);
      }
    }

    // Get all configs for this user
    const configConditions = [eq(interviewConfigs.userId, userId)];
    if (roleKitId) {
      configConditions.push(eq(interviewConfigs.roleKitId, Number(roleKitId)));
    }
    if (jobTargetId) {
      configConditions.push(eq(interviewConfigs.jobTargetId, String(jobTargetId)));
    }

    const configs = await db
      .select()
      .from(interviewConfigs)
      .where(and(...configConditions));

    const configIds = configs.map(c => c.id);

    // Fetch ALL sessions with their analyses (not just latest/best)
    const allSessionsWithAnalysis = configIds.length > 0
      ? await db
          .select({
            session: interviewSessions,
            analysis: interviewAnalysis,
            config: interviewConfigs,
          })
          .from(interviewSessions)
          .leftJoin(interviewAnalysis, eq(interviewAnalysis.interviewSessionId, interviewSessions.id))
          .innerJoin(interviewConfigs, eq(interviewSessions.interviewConfigId, interviewConfigs.id))
          .where(inArray(interviewSessions.interviewConfigId, configIds))
          .orderBy(desc(interviewSessions.createdAt))
      : [];

    // Group sessions by interview type
    const sessionsByType: Record<string, typeof allSessionsWithAnalysis> = {};
    for (const row of allSessionsWithAnalysis) {
      const interviewType = row.config.interviewType || "general";
      if (!sessionsByType[interviewType]) {
        sessionsByType[interviewType] = [];
      }
      sessionsByType[interviewType].push(row);
    }

    // Build comprehensive per-type reports
    const interviewTypeReports: Array<{
      interviewType: string;
      interviewTypeLabel: string;
      relevantSkills: string[];
      overallMetrics: {
        overallScore: number | null;
        readinessBand: ReadinessBand | null;
        totalAttempts: number;
        analyzedAttempts: number;
        latestAttemptDate: string | null;
      };
      attempts: Array<{
        sessionId: number;
        attemptNumber: number;
        createdAt: string;
        status: string;
        recommendation: string | null;
        summary: string | null;
        overallScore: number | null;
        dimensionScores: any[];
        strengths: string[];
        improvements: string[];
        risks: string[];
        resultsUrl: string;
      }>;
      progressionData: Array<{ attemptNumber: number; date: string; score: number | null }>;
      dimensionAverages: Array<{ dimension: string; avgScore: number; percentile: number }>;
      topStrengths: Array<{ text: string; frequency: number }>;
      topImprovements: Array<{ text: string; frequency: number }>;
      typeSpecificMetrics: Record<string, any>;
    }> = [];

    // Process each interview type
    for (const [interviewType, typeSessions] of Object.entries(sessionsByType)) {
      const relevantSkills = skillsByInterviewType[interviewType] || [];

      const attempts: typeof interviewTypeReports[0]["attempts"] = [];
      let attemptNum = typeSessions.length;

      // Track dimension scores
      const allDimensionScores: Record<string, { total: number; count: number }> = {};

      for (const { session, analysis, config } of typeSessions) {
        const dimensionScores = (analysis?.dimensionScores as any[]) || [];
        const strengths = (analysis?.strengths as string[]) || [];
        const improvements = (analysis?.improvements as string[]) || [];
        const risks = (analysis?.risks as string[]) || [];

        let overallScore: number | null = null;
        if (dimensionScores.length > 0) {
          const avgScore = dimensionScores.reduce((sum, d) => sum + (d.score || 0), 0) / dimensionScores.length;
          overallScore = Math.round((avgScore / 5) * 100);
        }

        attempts.push({
          sessionId: session.id,
          attemptNumber: attemptNum,
          createdAt: session.createdAt?.toISOString() || new Date().toISOString(),
          status: session.status,
          recommendation: analysis?.overallRecommendation || null,
          summary: analysis?.summary || null,
          overallScore,
          dimensionScores,
          strengths,
          improvements,
          risks,
          resultsUrl: `/interview/results?sessionId=${session.id}`,
        });

        // Track dimension scores
        for (const dim of dimensionScores) {
          const dimName = dim.dimension || "Unknown";
          if (!allDimensionScores[dimName]) {
            allDimensionScores[dimName] = { total: 0, count: 0 };
          }
          allDimensionScores[dimName].total += dim.score || 0;
          allDimensionScores[dimName].count++;
        }

        attemptNum--;
      }

      // Sort attempts (oldest first)
      attempts.sort((a, b) => a.attemptNumber - b.attemptNumber);

      // Calculate dimension averages
      const dimensionAverages = Object.entries(allDimensionScores).map(([dimension, data]) => ({
        dimension,
        avgScore: Math.round((data.total / data.count) * 10) / 10,
        percentile: Math.round((data.total / data.count / 5) * 100),
      }));

      // Progression data
      const progressionData = attempts
        .filter(a => a.overallScore !== null)
        .map(a => ({
          attemptNumber: a.attemptNumber,
          date: a.createdAt,
          score: a.overallScore,
        }));

      // Strengths and improvements
      const allStrengths = attempts.flatMap(a => a.strengths);
      const allImprovements = attempts.flatMap(a => a.improvements);

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
        .slice(0, 5)
        .map(([s, count]) => ({ text: s, frequency: count }));

      const topImprovements = Object.entries(improvementCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([s, count]) => ({ text: s, frequency: count }));

      // Calculate overall metrics
      const analyzedAttempts = attempts.filter(a => a.overallScore !== null);
      const overallScore = analyzedAttempts.length > 0
        ? Math.round(analyzedAttempts.reduce((sum, a) => sum + (a.overallScore || 0), 0) / analyzedAttempts.length)
        : null;
      const readinessBand = overallScore !== null ? getReadinessBand(overallScore) : null;

      interviewTypeReports.push({
        interviewType,
        interviewTypeLabel: formatInterviewTypeLabel(interviewType),
        relevantSkills,
        overallMetrics: {
          overallScore,
          readinessBand,
          totalAttempts: attempts.length,
          analyzedAttempts: analyzedAttempts.length,
          latestAttemptDate: attempts.length > 0 ? attempts[attempts.length - 1].createdAt : null,
        },
        attempts,
        progressionData,
        dimensionAverages,
        topStrengths,
        topImprovements,
        typeSpecificMetrics: getTypeSpecificMetrics(interviewType, dimensionAverages, attempts),
      });
    }

    // Sort by number of attempts (most practiced first)
    interviewTypeReports.sort((a, b) => b.attempts.length - a.attempts.length);

    // Calculate overall HiReady metrics
    const allTypeScores = interviewTypeReports
      .filter(t => t.overallMetrics.overallScore !== null)
      .map(t => ({
        type: t.interviewType,
        score: t.overallMetrics.overallScore!,
        weight: getInterviewWeight(t.interviewType),
      }));

    let overallWeightedScore = 0;
    let totalWeight = 0;
    for (const ts of allTypeScores) {
      overallWeightedScore += ts.score * ts.weight;
      totalWeight += ts.weight;
    }
    const consolidatedScore = totalWeight > 0 ? Math.round(overallWeightedScore / totalWeight) : null;

    // Generate interview breakdown for overview
    const interviewBreakdown = interviewTypeReports.map(report => {
      const assignment = assignments.find(a => {
        const matchingConfig = configs.find(c => 
          c.interviewType === report.interviewType &&
          (roleKitId ? c.roleKitId === Number(roleKitId) : true) &&
          (jobTargetId ? c.jobTargetId === String(jobTargetId) : true)
        );
        return matchingConfig !== undefined;
      });

      return {
        interviewType: report.interviewType,
        weight: getInterviewWeight(report.interviewType),
        attemptCount: report.attempts.length,
        latestScore: report.overallMetrics.overallScore,
        bestScore: report.attempts.length > 0
          ? Math.max(...report.attempts.filter(a => a.overallScore !== null).map(a => a.overallScore!))
          : null,
        latestSessionId: report.attempts.length > 0 ? report.attempts[report.attempts.length - 1].sessionId : null,
      };
    });

    // Calculate dimension aggregates across all interview types
    const overallDimensions: Record<string, { total: number; count: number; weight: number }> = {};
    for (const report of interviewTypeReports) {
      for (const dim of report.dimensionAverages) {
        const key = dim.dimension.toLowerCase().replace(/[^a-z_]/g, '_');
        if (!overallDimensions[key]) {
          overallDimensions[key] = { total: 0, count: 0, weight: 0 };
        }
        overallDimensions[key].total += dim.avgScore;
        overallDimensions[key].count++;
      }
    }

    const dimensions: DimensionResult[] = Object.entries(overallDimensions).map(([key, data]) => {
      const score = data.total / data.count;
      const weight = 1 / Object.keys(overallDimensions).length;
      return {
        key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        score: Math.round(score * 10) / 10,
        weight,
        weightedScore: Math.round(score * weight * 100) / 100,
      };
    });

    // Get user info
    const [user] = await db.select().from(authUsers).where(eq(authUsers.id, userId)).limit(1);

    // Calculate capability milestones
    const totalSessions = interviewTypeReports.reduce((sum, r) => sum + r.attempts.length, 0);
    const allAttemptScores = interviewTypeReports.flatMap(r => 
      r.attempts.filter(a => a.overallScore !== null).map(a => ({
        score: a.overallScore!,
        sessionId: a.sessionId,
        interviewType: r.interviewType,
      }))
    );
    const bestAttempt = allAttemptScores.length > 0
      ? allAttemptScores.reduce((best, curr) => curr.score > best.score ? curr : best)
      : { score: 0, sessionId: null, interviewType: null };

    // Session score history for overall chart
    const sessionScoreHistory = interviewTypeReports.flatMap(r =>
      r.attempts
        .filter(a => a.overallScore !== null)
        .map(a => ({
          sessionId: a.sessionId,
          date: a.createdAt,
          score: a.overallScore!,
          interviewType: r.interviewType,
        }))
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Strongest and weakest areas
    const sortedTypes = [...allTypeScores].sort((a, b) => b.score - a.score);
    const strongestAreas = sortedTypes.slice(0, 2).map(t => t.type);
    const weakestAreas = sortedTypes.slice(-2).reverse().map(t => t.type);

    res.json({
      success: true,
      fullReport: {
        // User info
        user: {
          id: userId,
          displayName: user?.firstName && user?.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user?.username || "Anonymous",
        },
        // Role context
        role: {
          name: roleName,
          companyContext,
          archetypeId: roleArchetypeId,
          roleKitId: roleKitId ? Number(roleKitId) : null,
          jobTargetId: jobTargetId ? String(jobTargetId) : null,
        },
        // Overall HiReady Score
        overallScore: consolidatedScore,
        readinessBand: consolidatedScore ? getReadinessBand(consolidatedScore) : null,
        dimensions,
        // Summary stats
        totalSessions,
        totalInterviewTypes: interviewTypeReports.length,
        strongestAreas,
        weakestAreas,
        // Interview breakdown for overview cards
        interviewBreakdown,
        // Full session score history for overall chart
        sessionScoreHistory,
        // Capability milestones
        capabilityMilestones: {
          practiceVolume: totalSessions,
          bestAttempt,
          consistencyScore: allAttemptScores.length >= 3
            ? Math.round(100 - (standardDeviation(allAttemptScores.map(a => a.score)) * 10))
            : null,
          coveragePercentage: Math.round((interviewTypeReports.length / 5) * 100), // Assuming 5 main interview types
        },
        // All skills
        allSkills: jdSkills,
        skillsByInterviewType,
        // Complete per-type reports with all attempts
        interviewTypeReports,
        // Metadata
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching full report:", error);
    res.status(500).json({ success: false, error: "Failed to fetch full report" });
  }
});

// Helper: Calculate standard deviation
function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

// Public share endpoint for full report
interviewProgressRouter.get("/share/:token/full-report", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Find valid share link
    const [shareLink] = await db
      .select()
      .from(hireadyShareLinks)
      .where(
        and(
          eq(hireadyShareLinks.token, token),
          sql`${hireadyShareLinks.revokedAt} IS NULL`,
          sql`(${hireadyShareLinks.expiresAt} IS NULL OR ${hireadyShareLinks.expiresAt} > NOW())`
        )
      )
      .limit(1);

    if (!shareLink) {
      return res.status(404).json({ success: false, error: "Share link not found or expired" });
    }

    // Increment view count
    await db
      .update(hireadyShareLinks)
      .set({ viewCount: (shareLink.viewCount || 0) + 1 })
      .where(eq(hireadyShareLinks.id, shareLink.id));

    const userId = shareLink.userId;
    const roleKitId = shareLink.roleKitId;
    const jobTargetId = shareLink.jobTargetId;

    // Get role context and skills
    let roleName = "General";
    let companyContext: string | null = null;
    let jdSkills: string[] = [];
    let roleArchetypeId: string | null = null;

    if (jobTargetId) {
      const [jobTarget] = await db
        .select()
        .from(jobTargets)
        .where(and(
          eq(jobTargets.id, String(jobTargetId)),
          eq(jobTargets.userId, userId)
        ))
        .limit(1);
      
      if (jobTarget) {
        roleName = jobTarget.roleTitle || "Unknown Role";
        companyContext = jobTarget.companyName || null;
        roleArchetypeId = jobTarget.roleArchetypeId || null;
        
        const parsed = jobTarget.jdParsed as { requiredSkills?: string[]; preferredSkills?: string[] } | null;
        if (parsed) {
          jdSkills = [...(parsed.requiredSkills || []), ...(parsed.preferredSkills || [])];
        }
      }
    } else if (roleKitId) {
      const [roleKit] = await db
        .select()
        .from(roleKits)
        .where(eq(roleKits.id, Number(roleKitId)))
        .limit(1);
      
      if (roleKit) {
        roleName = roleKit.name;
        roleArchetypeId = roleKit.roleArchetypeId;
        jdSkills = (roleKit.skillsFocus as string[]) || [];
      }
    }

    // Categorize skills
    const skillsByInterviewType = categorizeSkillsByInterviewType(jdSkills);

    // Get all assignments
    const conditions: any[] = [eq(interviewAssignments.userId, userId)];
    if (roleKitId) conditions.push(eq(interviewAssignments.roleKitId, Number(roleKitId)));
    if (jobTargetId) conditions.push(eq(interviewAssignments.jobTargetId, String(jobTargetId)));

    const assignments = await db
      .select()
      .from(interviewAssignments)
      .where(and(...conditions));

    // Get configs
    const configConditions: any[] = [eq(interviewConfigs.userId, userId)];
    if (roleKitId) configConditions.push(eq(interviewConfigs.roleKitId, Number(roleKitId)));
    if (jobTargetId) configConditions.push(eq(interviewConfigs.jobTargetId, String(jobTargetId)));

    const configs = await db
      .select()
      .from(interviewConfigs)
      .where(and(...configConditions));

    const configIds = configs.map(c => c.id);

    // Fetch all sessions with analyses
    const allSessionsWithAnalysis = configIds.length > 0
      ? await db
          .select({
            session: interviewSessions,
            analysis: interviewAnalysis,
            config: interviewConfigs,
          })
          .from(interviewSessions)
          .leftJoin(interviewAnalysis, eq(interviewAnalysis.interviewSessionId, interviewSessions.id))
          .innerJoin(interviewConfigs, eq(interviewSessions.interviewConfigId, interviewConfigs.id))
          .where(inArray(interviewSessions.interviewConfigId, configIds))
          .orderBy(desc(interviewSessions.createdAt))
      : [];

    // Group by interview type and build reports (same logic as authenticated endpoint)
    const sessionsByType: Record<string, typeof allSessionsWithAnalysis> = {};
    for (const row of allSessionsWithAnalysis) {
      const interviewType = row.config.interviewType || "general";
      if (!sessionsByType[interviewType]) {
        sessionsByType[interviewType] = [];
      }
      sessionsByType[interviewType].push(row);
    }

    const interviewTypeReports: any[] = [];
    for (const [interviewType, typeSessions] of Object.entries(sessionsByType)) {
      const relevantSkills = skillsByInterviewType[interviewType] || [];
      const attempts: any[] = [];
      let attemptNum = typeSessions.length;
      const allDimensionScores: Record<string, { total: number; count: number }> = {};

      for (const { session, analysis } of typeSessions) {
        const dimensionScores = (analysis?.dimensionScores as any[]) || [];
        const strengths = (analysis?.strengths as string[]) || [];
        const improvements = (analysis?.improvements as string[]) || [];

        let overallScore: number | null = null;
        if (dimensionScores.length > 0) {
          const avgScore = dimensionScores.reduce((sum, d) => sum + (d.score || 0), 0) / dimensionScores.length;
          overallScore = Math.round((avgScore / 5) * 100);
        }

        attempts.push({
          sessionId: session.id,
          attemptNumber: attemptNum,
          createdAt: session.createdAt?.toISOString() || new Date().toISOString(),
          overallScore,
          dimensionScores,
          strengths,
          improvements,
        });

        for (const dim of dimensionScores) {
          const dimName = dim.dimension || "Unknown";
          if (!allDimensionScores[dimName]) {
            allDimensionScores[dimName] = { total: 0, count: 0 };
          }
          allDimensionScores[dimName].total += dim.score || 0;
          allDimensionScores[dimName].count++;
        }

        attemptNum--;
      }

      attempts.sort((a, b) => a.attemptNumber - b.attemptNumber);

      const dimensionAverages = Object.entries(allDimensionScores).map(([dimension, data]) => ({
        dimension,
        avgScore: Math.round((data.total / data.count) * 10) / 10,
        percentile: Math.round((data.total / data.count / 5) * 100),
      }));

      const progressionData = attempts
        .filter(a => a.overallScore !== null)
        .map(a => ({ attemptNumber: a.attemptNumber, date: a.createdAt, score: a.overallScore }));

      const analyzedAttempts = attempts.filter(a => a.overallScore !== null);
      const overallScore = analyzedAttempts.length > 0
        ? Math.round(analyzedAttempts.reduce((sum, a) => sum + (a.overallScore || 0), 0) / analyzedAttempts.length)
        : null;

      interviewTypeReports.push({
        interviewType,
        interviewTypeLabel: formatInterviewTypeLabel(interviewType),
        relevantSkills,
        overallMetrics: {
          overallScore,
          readinessBand: overallScore !== null ? getReadinessBand(overallScore) : null,
          totalAttempts: attempts.length,
          analyzedAttempts: analyzedAttempts.length,
        },
        attempts,
        progressionData,
        dimensionAverages,
      });
    }

    interviewTypeReports.sort((a, b) => b.attempts.length - a.attempts.length);

    // Calculate overall score
    const allTypeScores = interviewTypeReports
      .filter(t => t.overallMetrics.overallScore !== null)
      .map(t => ({ type: t.interviewType, score: t.overallMetrics.overallScore!, weight: getInterviewWeight(t.interviewType) }));

    let overallWeightedScore = 0;
    let totalWeight = 0;
    for (const ts of allTypeScores) {
      overallWeightedScore += ts.score * ts.weight;
      totalWeight += ts.weight;
    }
    const consolidatedScore = totalWeight > 0 ? Math.round(overallWeightedScore / totalWeight) : null;

    // Get user info
    const [user] = await db.select().from(authUsers).where(eq(authUsers.id, userId)).limit(1);

    res.json({
      success: true,
      isSharedView: true,
      fullReport: {
        user: { displayName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || "Anonymous" },
        role: { name: roleName, companyContext, archetypeId: roleArchetypeId },
        overallScore: consolidatedScore,
        readinessBand: consolidatedScore ? getReadinessBand(consolidatedScore) : null,
        totalSessions: allSessionsWithAnalysis.length,
        totalInterviewTypes: interviewTypeReports.length,
        allSkills: jdSkills,
        skillsByInterviewType,
        interviewTypeReports,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching shared full report:", error);
    res.status(500).json({ success: false, error: "Failed to fetch shared report" });
  }
});

export default interviewProgressRouter;
