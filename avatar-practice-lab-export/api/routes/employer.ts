import { Router, Request, Response } from "express";
import { db } from "../db.js";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  employerCompanies,
  employerJobs,
  employerCandidates,
  employerCompanyUsers,
  authUsers,
  roleKits,
  interviewSessions,
  interviewConfigs,
  hireadyRoleIndex,
} from "../../shared/schema.js";
import { requireAuth } from "../middleware/auth.js";

const employerRouter = Router();

function generateSlug(title: string, companyName: string): string {
  const baseSlug = `${companyName}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}

employerRouter.post("/companies", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { name, domain, logoUrl } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: "Company name is required" });
    }

    const [company] = await db.insert(employerCompanies).values({
      name,
      domain,
      logoUrl,
      ownerUserId: userId,
      plan: "free",
    }).returning();

    await db.insert(employerCompanyUsers).values({
      companyId: company.id,
      userId,
      role: "owner",
      joinedAt: new Date(),
    });

    res.json({ success: true, company });
  } catch (error: any) {
    console.error("Error creating company:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

employerRouter.get("/companies", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const userCompanies = await db
      .select({
        company: employerCompanies,
        role: employerCompanyUsers.role,
      })
      .from(employerCompanyUsers)
      .innerJoin(employerCompanies, eq(employerCompanyUsers.companyId, employerCompanies.id))
      .where(eq(employerCompanyUsers.userId, userId));

    res.json({ 
      success: true, 
      companies: userCompanies.map(uc => ({
        ...uc.company,
        userRole: uc.role,
      }))
    });
  } catch (error: any) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

employerRouter.get("/companies/:companyId", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { companyId } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const [membership] = await db
      .select()
      .from(employerCompanyUsers)
      .where(and(
        eq(employerCompanyUsers.companyId, companyId),
        eq(employerCompanyUsers.userId, userId)
      ))
      .limit(1);

    if (!membership) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const [company] = await db
      .select()
      .from(employerCompanies)
      .where(eq(employerCompanies.id, companyId))
      .limit(1);

    res.json({ success: true, company, userRole: membership.role });
  } catch (error: any) {
    console.error("Error fetching company:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

employerRouter.post("/companies/:companyId/jobs", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { companyId } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const [membership] = await db
      .select()
      .from(employerCompanyUsers)
      .where(and(
        eq(employerCompanyUsers.companyId, companyId),
        eq(employerCompanyUsers.userId, userId)
      ))
      .limit(1);

    if (!membership || !["owner", "admin"].includes(membership.role || "")) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const [company] = await db
      .select()
      .from(employerCompanies)
      .where(eq(employerCompanies.id, companyId))
      .limit(1);

    const { title, jdText, jdUrl, roleKitId, assessmentConfig } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: "Job title is required" });
    }

    const applyLinkSlug = generateSlug(title, company?.name || "job");

    const [job] = await db.insert(employerJobs).values({
      companyId,
      title,
      jdText,
      jdUrl,
      roleKitId,
      assessmentConfig: assessmentConfig || { interviewTypes: ["hr", "technical"], totalDuration: 45 },
      applyLinkSlug,
      status: "active",
    }).returning();

    res.json({ success: true, job });
  } catch (error: any) {
    console.error("Error creating job:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

employerRouter.get("/companies/:companyId/jobs", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { companyId } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const [membership] = await db
      .select()
      .from(employerCompanyUsers)
      .where(and(
        eq(employerCompanyUsers.companyId, companyId),
        eq(employerCompanyUsers.userId, userId)
      ))
      .limit(1);

    if (!membership) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const jobs = await db
      .select()
      .from(employerJobs)
      .where(eq(employerJobs.companyId, companyId))
      .orderBy(desc(employerJobs.createdAt));

    res.json({ success: true, jobs });
  } catch (error: any) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

employerRouter.get("/jobs/:jobId/candidates", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { jobId } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const [job] = await db
      .select()
      .from(employerJobs)
      .where(eq(employerJobs.id, jobId))
      .limit(1);

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    const [membership] = await db
      .select()
      .from(employerCompanyUsers)
      .where(and(
        eq(employerCompanyUsers.companyId, job.companyId),
        eq(employerCompanyUsers.userId, userId)
      ))
      .limit(1);

    if (!membership) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const candidates = await db
      .select({
        candidate: employerCandidates,
        user: {
          id: authUsers.id,
          username: authUsers.username,
          firstName: authUsers.firstName,
          lastName: authUsers.lastName,
          email: authUsers.email,
        },
      })
      .from(employerCandidates)
      .innerJoin(authUsers, eq(employerCandidates.userId, authUsers.id))
      .where(eq(employerCandidates.jobId, jobId))
      .orderBy(desc(employerCandidates.createdAt));

    res.json({ 
      success: true, 
      candidates: candidates.map(c => ({
        ...c.candidate,
        user: {
          id: c.user.id,
          name: c.user.firstName && c.user.lastName 
            ? `${c.user.firstName} ${c.user.lastName}` 
            : c.user.username,
          email: c.user.email,
        },
      }))
    });
  } catch (error: any) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

employerRouter.get("/jobs/:jobId/candidates/export", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { jobId } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const [job] = await db
      .select()
      .from(employerJobs)
      .where(eq(employerJobs.id, jobId))
      .limit(1);

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    const [membership] = await db
      .select()
      .from(employerCompanyUsers)
      .where(and(
        eq(employerCompanyUsers.companyId, job.companyId),
        eq(employerCompanyUsers.userId, userId)
      ))
      .limit(1);

    if (!membership) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const candidates = await db
      .select({
        candidate: employerCandidates,
        user: {
          id: authUsers.id,
          username: authUsers.username,
          firstName: authUsers.firstName,
          lastName: authUsers.lastName,
          email: authUsers.email,
        },
      })
      .from(employerCandidates)
      .innerJoin(authUsers, eq(employerCandidates.userId, authUsers.id))
      .where(eq(employerCandidates.jobId, jobId))
      .orderBy(desc(employerCandidates.hireadyIndexScore));

    const csvRows = [
      ["Name", "Email", "Hiready Score", "Status", "Completed Interviews", "Submitted At"].join(","),
      ...candidates.map(c => {
        const displayName = c.user.firstName && c.user.lastName 
          ? `${c.user.firstName} ${c.user.lastName}` 
          : c.user.username;
        return [
          `"${displayName || ''}"`,
          `"${c.user.email || ''}"`,
          c.candidate.hireadyIndexScore || "",
          c.candidate.status,
          `"${(c.candidate.completedInterviewTypes as string[] || []).join(", ")}"`,
          c.candidate.submittedAt?.toISOString() || "",
        ].join(",");
      })
    ];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="candidates-${job.applyLinkSlug}.csv"`);
    res.send(csvRows.join("\n"));
  } catch (error: any) {
    console.error("Error exporting candidates:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

employerRouter.patch("/candidates/:candidateId/status", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { candidateId } = req.params;
    const { status, reviewerNotes } = req.body;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const [candidate] = await db
      .select()
      .from(employerCandidates)
      .where(eq(employerCandidates.id, candidateId))
      .limit(1);

    if (!candidate) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }

    const [job] = await db
      .select()
      .from(employerJobs)
      .where(eq(employerJobs.id, candidate.jobId))
      .limit(1);

    const [membership] = await db
      .select()
      .from(employerCompanyUsers)
      .where(and(
        eq(employerCompanyUsers.companyId, job?.companyId || ""),
        eq(employerCompanyUsers.userId, userId)
      ))
      .limit(1);

    if (!membership) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const updateData: any = { status };
    if (reviewerNotes !== undefined) updateData.reviewerNotes = reviewerNotes;
    if (status === "reviewed" || status === "shortlisted" || status === "rejected") {
      updateData.reviewedAt = new Date();
    }

    const [updated] = await db
      .update(employerCandidates)
      .set(updateData)
      .where(eq(employerCandidates.id, candidateId))
      .returning();

    res.json({ success: true, candidate: updated });
  } catch (error: any) {
    console.error("Error updating candidate:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

employerRouter.get("/apply/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const [job] = await db
      .select({
        job: employerJobs,
        company: employerCompanies,
        roleKit: roleKits,
      })
      .from(employerJobs)
      .innerJoin(employerCompanies, eq(employerJobs.companyId, employerCompanies.id))
      .leftJoin(roleKits, eq(employerJobs.roleKitId, roleKits.id))
      .where(eq(employerJobs.applyLinkSlug, slug))
      .limit(1);

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    if (job.job.status !== "active") {
      return res.status(410).json({ success: false, error: "This job is no longer accepting applications" });
    }

    res.json({
      success: true,
      job: {
        id: job.job.id,
        title: job.job.title,
        jdText: job.job.jdText,
        assessmentConfig: job.job.assessmentConfig,
        company: {
          name: job.company.name,
          logoUrl: job.company.logoUrl,
          domain: job.company.domain,
        },
        roleKit: job.roleKit ? {
          id: job.roleKit.id,
          name: job.roleKit.name,
          domain: job.roleKit.domain,
        } : null,
      },
    });
  } catch (error: any) {
    console.error("Error fetching job by slug:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

employerRouter.post("/apply/:slug/start", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { slug } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Please log in to start the assessment" });
    }

    const [job] = await db
      .select()
      .from(employerJobs)
      .where(eq(employerJobs.applyLinkSlug, slug))
      .limit(1);

    if (!job || job.status !== "active") {
      return res.status(404).json({ success: false, error: "Job not found or inactive" });
    }

    const [existingCandidate] = await db
      .select()
      .from(employerCandidates)
      .where(and(
        eq(employerCandidates.jobId, job.id),
        eq(employerCandidates.userId, userId)
      ))
      .limit(1);

    if (existingCandidate) {
      return res.json({ 
        success: true, 
        candidate: existingCandidate,
        message: "Assessment already started" 
      });
    }

    const [candidate] = await db.insert(employerCandidates).values({
      jobId: job.id,
      userId,
      status: "in_progress",
      completedInterviewTypes: [],
    }).returning();

    await db
      .update(employerJobs)
      .set({ candidateCount: sql`${employerJobs.candidateCount} + 1` })
      .where(eq(employerJobs.id, job.id));

    res.json({ success: true, candidate });
  } catch (error: any) {
    console.error("Error starting assessment:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

employerRouter.post("/apply/:slug/complete", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { slug } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const [job] = await db
      .select()
      .from(employerJobs)
      .where(eq(employerJobs.applyLinkSlug, slug))
      .limit(1);

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    const [existingIndex] = await db
      .select()
      .from(hireadyRoleIndex)
      .where(and(
        eq(hireadyRoleIndex.userId, userId),
        eq(hireadyRoleIndex.employerJobId, job.id)
      ))
      .limit(1);

    const [updatedCandidate] = await db
      .update(employerCandidates)
      .set({
        status: "completed",
        submittedAt: new Date(),
        hireadyIndexScore: existingIndex?.overallScore || null,
        completedInterviewTypes: existingIndex?.completedInterviewTypes || [],
      })
      .where(and(
        eq(employerCandidates.jobId, job.id),
        eq(employerCandidates.userId, userId)
      ))
      .returning();

    res.json({ success: true, candidate: updatedCandidate });
  } catch (error: any) {
    console.error("Error completing assessment:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default employerRouter;
