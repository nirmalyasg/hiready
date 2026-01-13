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

// Get consolidated Hiready Index for role/job
interviewProgressRouter.get("/hiready-index", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    console.log("[Hiready Index] userId from auth:", userId);
    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { roleKitId, jobTargetId } = req.query;

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
    
    console.log("[Hiready Index] Found assignments:", assignments.length);

    const interviewScores = assignments.map((a) => ({
      interviewType: a.interviewType,
      weight: getInterviewWeight(a.interviewType),
      latestScore: a.latestScore,
      bestScore: a.bestScore,
      attemptCount: a.attemptCount,
      latestSessionId: a.latestSessionId,
      bestSessionId: a.bestSessionId,
    }));

    const consolidatedLatest = await computeConsolidatedIndex(
      userId,
      roleKitId ? Number(roleKitId) : null,
      jobTargetId ? String(jobTargetId) : null
    );

    let consolidatedBest = 0;
    let totalWeight = 0;
    for (const score of interviewScores) {
      if (score.bestScore !== null) {
        consolidatedBest += (score.bestScore || 0) * score.weight;
        totalWeight += score.weight;
      }
    }
    if (totalWeight > 0) {
      consolidatedBest = Math.round((consolidatedBest / totalWeight) * 10) / 10;
    }

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

    const [previousSnapshot] = await db
      .select()
      .from(hireadyIndexSnapshots)
      .where(
        and(
          eq(hireadyIndexSnapshots.userId, userId),
          eq(hireadyIndexSnapshots.isLatest, false),
          roleKitId ? eq(hireadyIndexSnapshots.roleKitId, Number(roleKitId)) : sql`1=1`,
          jobTargetId ? eq(hireadyIndexSnapshots.jobTargetId, String(jobTargetId)) : sql`1=1`
        )
      )
      .orderBy(desc(hireadyIndexSnapshots.createdAt))
      .limit(1);

    const totalSessions = assignments.reduce((sum, a) => sum + (a.attemptCount || 0), 0);

    const getReadinessLevel = (score: number): string => {
      if (score >= 85) return "exceptional";
      if (score >= 70) return "strong";
      if (score >= 55) return "ready";
      if (score >= 40) return "developing";
      return "not_ready";
    };

    const breakdown = interviewScores.map((s) => ({
      interviewType: s.interviewType,
      weight: s.weight,
      weightedScore: s.latestScore !== null ? Math.round((s.latestScore / 5) * 100) : 0,
      attemptCount: s.attemptCount || 0,
      bestScore: s.bestScore !== null ? Math.round((s.bestScore / 5) * 100) : null,
      latestScore: s.latestScore !== null ? Math.round((s.latestScore / 5) * 100) : null,
      latestSessionId: s.latestSessionId,
      dimensions: [] as any[],
    }));

    const overallScore = consolidatedLatest > 0 
      ? Math.round((consolidatedLatest / 5) * 100) 
      : 0;
    const previousScore = previousSnapshot?.consolidatedIndex 
      ? Math.round((previousSnapshot.consolidatedIndex / 5) * 100) 
      : null;

    let trend: "improving" | "stable" | "declining" = "stable";
    if (previousScore !== null) {
      const delta = overallScore - previousScore;
      if (delta > 5) trend = "improving";
      else if (delta < -5) trend = "declining";
    }

    const strongInterviews = breakdown.filter(b => (b.latestScore || 0) >= 75);
    const weakInterviews = breakdown.filter(b => (b.latestScore || 0) < 60 && b.attemptCount > 0);

    const formatType = (t: string) => t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    const strengths = strongInterviews.slice(0, 3).map(
      s => `Strong ${formatType(s.interviewType)} performance (${s.latestScore}%)`
    );
    const improvements = weakInterviews.slice(0, 3).map(
      s => `Focus on ${formatType(s.interviewType)} (currently ${s.latestScore}%)`
    );

    res.json({
      success: true,
      hireadyIndex: {
        overallScore,
        readinessLevel: getReadinessLevel(overallScore),
        totalSessions,
        lastUpdated: latestSnapshot?.createdAt || new Date().toISOString(),
        breakdown,
        strengths,
        improvements,
        trend,
        previousScore,
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

    res.json({
      success: true,
      token: shareLink.token,
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

    const interviewScores = assignments.map((a) => ({
      interviewType: a.interviewType,
      weight: getInterviewWeight(a.interviewType),
      latestScore: a.latestScore,
      attemptCount: a.attemptCount,
    }));

    const consolidatedIndex = await computeConsolidatedIndex(
      shareLink.userId,
      shareLink.roleKitId,
      shareLink.jobTargetId
    );

    res.json({
      success: true,
      data: {
        candidateName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Anonymous" : "Anonymous",
        roleInfo,
        jobInfo,
        consolidatedIndex,
        interviewScores,
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
