import { Router, Request, Response } from "express";
import { db } from "../db.js";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  employerCompanies,
  employerJobs,
  employerCandidates,
  authUsers,
  roleKits,
  interviewSessions,
  interviewConfigs,
  hireadyRoleIndex,
} from "../../shared/schema.js";
import { requireEmployerAuth } from "./employer-auth.js";
import { 
  resolveRoleArchetype, 
  resolveCompanyArchetype, 
  getUnifiedInterviewPlan 
} from "../lib/archetype-resolver.js";

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

employerRouter.get("/my-company", requireEmployerAuth, async (req: Request, res: Response) => {
  try {
    const employerUser = (req as any).employerUser;
    if (!employerUser?.companyId) {
      return res.status(404).json({ success: false, error: "No company associated with this account" });
    }

    const [company] = await db
      .select()
      .from(employerCompanies)
      .where(eq(employerCompanies.id, employerUser.companyId))
      .limit(1);

    if (!company) {
      return res.status(404).json({ success: false, error: "Company not found" });
    }

    res.json({ success: true, company, userRole: employerUser.role || "owner" });
  } catch (error: any) {
    console.error("Error fetching company:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

employerRouter.post("/jobs", requireEmployerAuth, async (req: Request, res: Response) => {
  try {
    const employerUser = (req as any).employerUser;
    if (!employerUser?.companyId) {
      return res.status(403).json({ success: false, error: "No company associated with this account" });
    }

    if (!["owner", "admin"].includes(employerUser.role || "owner")) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const [company] = await db
      .select()
      .from(employerCompanies)
      .where(eq(employerCompanies.id, employerUser.companyId))
      .limit(1);

    const { title, jdText, jdUrl, roleKitId, assessmentConfig } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: "Job title is required" });
    }

    const applyLinkSlug = generateSlug(title, company?.name || "job");

    let generatedInterviewPlan: any = null;
    let roleArchetypeId: string | null = null;
    let companyArchetype: string | null = null;
    let archetypeConfidence: string | null = null;

    if (jdText || title) {
      try {
        const roleResolution = await resolveRoleArchetype(title, jdText || undefined);
        const companyResolution = await resolveCompanyArchetype(company?.name || "", jdText || undefined);
        
        roleArchetypeId = roleResolution.roleArchetypeId;
        companyArchetype = companyResolution.archetype;
        archetypeConfidence = roleResolution.confidence;

        const interviewPlan = await getUnifiedInterviewPlan(
          roleArchetypeId,
          roleResolution.roleFamily,
          companyArchetype,
          companyResolution.confidence as "high" | "medium" | "low",
          "mid",
          null,
          company?.name || null
        );

        generatedInterviewPlan = {
          ...interviewPlan,
          roleArchetype: {
            id: roleResolution.roleArchetypeId,
            name: roleResolution.roleArchetypeName,
            family: roleResolution.roleFamily,
            confidence: roleResolution.confidence,
          },
          companyArchetype: {
            name: company?.name,
            archetype: companyResolution.archetype,
            confidence: companyResolution.confidence,
          },
          generatedAt: new Date().toISOString(),
        };

        console.log(`Generated interview plan for job "${title}": ${interviewPlan.phases?.length || 0} phases`);
      } catch (planError: any) {
        console.error("Error generating interview plan:", planError);
      }
    }

    const [job] = await db.insert(employerJobs).values({
      companyId: employerUser.companyId,
      title,
      jdText,
      jdUrl,
      roleKitId,
      roleArchetypeId,
      assessmentConfig: assessmentConfig || { 
        interviewTypes: generatedInterviewPlan?.phases?.map((p: any) => p.category) || ["hr", "technical"], 
        totalDuration: generatedInterviewPlan?.totalMinutes || 45 
      },
      applyLinkSlug,
      status: "active",
    }).returning();

    await db.execute(sql`
      UPDATE employer_jobs 
      SET generated_interview_plan = ${JSON.stringify(generatedInterviewPlan)}::jsonb,
          company_archetype = ${companyArchetype},
          archetype_confidence = ${archetypeConfidence}
      WHERE id = ${job.id}
    `);

    res.json({ 
      success: true, 
      job: {
        ...job,
        generatedInterviewPlan,
      }
    });
  } catch (error: any) {
    console.error("Error creating job:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

employerRouter.get("/jobs", requireEmployerAuth, async (req: Request, res: Response) => {
  try {
    const employerUser = (req as any).employerUser;
    if (!employerUser?.companyId) {
      return res.status(403).json({ success: false, error: "No company associated with this account" });
    }

    const jobs = await db
      .select()
      .from(employerJobs)
      .where(eq(employerJobs.companyId, employerUser.companyId))
      .orderBy(desc(employerJobs.createdAt));

    res.json({ success: true, jobs });
  } catch (error: any) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

employerRouter.get("/jobs/:jobId", requireEmployerAuth, async (req: Request, res: Response) => {
  try {
    const employerUser = (req as any).employerUser;
    const { jobId } = req.params;

    const [job] = await db
      .select()
      .from(employerJobs)
      .where(eq(employerJobs.id, jobId))
      .limit(1);

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    if (job.companyId !== employerUser?.companyId) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    res.json({ success: true, job });
  } catch (error: any) {
    console.error("Error fetching job:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

employerRouter.put("/jobs/:jobId", requireEmployerAuth, async (req: Request, res: Response) => {
  try {
    const employerUser = (req as any).employerUser;
    const { jobId } = req.params;

    const [job] = await db
      .select()
      .from(employerJobs)
      .where(eq(employerJobs.id, jobId))
      .limit(1);

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    if (job.companyId !== employerUser?.companyId) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const { title, jdText, jdUrl, roleKitId, assessmentConfig, status } = req.body;

    const [updatedJob] = await db
      .update(employerJobs)
      .set({
        title: title || job.title,
        jdText: jdText !== undefined ? jdText : job.jdText,
        jdUrl: jdUrl !== undefined ? jdUrl : job.jdUrl,
        roleKitId: roleKitId !== undefined ? roleKitId : job.roleKitId,
        assessmentConfig: assessmentConfig || job.assessmentConfig,
        status: status || job.status,
        updatedAt: new Date(),
      })
      .where(eq(employerJobs.id, jobId))
      .returning();

    res.json({ success: true, job: updatedJob });
  } catch (error: any) {
    console.error("Error updating job:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

employerRouter.delete("/jobs/:jobId", requireEmployerAuth, async (req: Request, res: Response) => {
  try {
    const employerUser = (req as any).employerUser;
    const { jobId } = req.params;

    const [job] = await db
      .select()
      .from(employerJobs)
      .where(eq(employerJobs.id, jobId))
      .limit(1);

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    if (job.companyId !== employerUser?.companyId) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    await db.delete(employerJobs).where(eq(employerJobs.id, jobId));

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting job:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

employerRouter.get("/jobs/:jobId/candidates", requireEmployerAuth, async (req: Request, res: Response) => {
  try {
    const employerUser = (req as any).employerUser;
    const { jobId } = req.params;

    const [job] = await db
      .select()
      .from(employerJobs)
      .where(eq(employerJobs.id, jobId))
      .limit(1);

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    if (job.companyId !== employerUser?.companyId) {
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

employerRouter.get("/jobs/:jobId/candidates/export", requireEmployerAuth, async (req: Request, res: Response) => {
  try {
    const employerUser = (req as any).employerUser;
    const { jobId } = req.params;

    const [job] = await db
      .select()
      .from(employerJobs)
      .where(eq(employerJobs.id, jobId))
      .limit(1);

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    if (job.companyId !== employerUser?.companyId) {
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
      ["Name", "Email", "Hiready Index Score", "Status", "Submitted At"].join(","),
      ...candidates.map(c => [
        c.user.firstName && c.user.lastName ? `${c.user.firstName} ${c.user.lastName}` : c.user.username,
        c.user.email || "",
        c.candidate.hireadyIndexScore || "N/A",
        c.candidate.status || "pending",
        c.candidate.submittedAt?.toISOString() || "N/A",
      ].join(","))
    ];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${job.title}-candidates.csv"`);
    res.send(csvRows.join("\n"));
  } catch (error: any) {
    console.error("Error exporting candidates:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

employerRouter.put("/candidates/:candidateId/status", requireEmployerAuth, async (req: Request, res: Response) => {
  try {
    const employerUser = (req as any).employerUser;
    const { candidateId } = req.params;
    const { status, reviewerNotes } = req.body;

    const [candidate] = await db
      .select({
        candidate: employerCandidates,
        job: employerJobs,
      })
      .from(employerCandidates)
      .innerJoin(employerJobs, eq(employerCandidates.jobId, employerJobs.id))
      .where(eq(employerCandidates.id, candidateId))
      .limit(1);

    if (!candidate) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }

    if (candidate.job.companyId !== employerUser?.companyId) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const [updated] = await db
      .update(employerCandidates)
      .set({
        status,
        reviewerNotes: reviewerNotes || candidate.candidate.reviewerNotes,
        reviewedAt: new Date(),
      })
      .where(eq(employerCandidates.id, candidateId))
      .returning();

    res.json({ success: true, candidate: updated });
  } catch (error: any) {
    console.error("Error updating candidate status:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

employerRouter.get("/candidates/:candidateId/analysis", requireEmployerAuth, async (req: Request, res: Response) => {
  try {
    const employerUser = (req as any).employerUser;
    const { candidateId } = req.params;

    const [candidate] = await db
      .select({
        candidate: employerCandidates,
        job: employerJobs,
        user: {
          id: authUsers.id,
          username: authUsers.username,
          firstName: authUsers.firstName,
          lastName: authUsers.lastName,
          email: authUsers.email,
        },
      })
      .from(employerCandidates)
      .innerJoin(employerJobs, eq(employerCandidates.jobId, employerJobs.id))
      .innerJoin(authUsers, eq(employerCandidates.userId, authUsers.id))
      .where(eq(employerCandidates.id, candidateId))
      .limit(1);

    if (!candidate) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }

    if (candidate.job.companyId !== employerUser?.companyId) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    res.json({ 
      success: true, 
      candidate: {
        ...candidate.candidate,
        user: {
          id: candidate.user.id,
          name: candidate.user.firstName && candidate.user.lastName 
            ? `${candidate.user.firstName} ${candidate.user.lastName}` 
            : candidate.user.username,
          email: candidate.user.email,
        },
      },
      job: candidate.job,
    });
  } catch (error: any) {
    console.error("Error fetching candidate analysis:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

employerRouter.get("/dashboard/stats", requireEmployerAuth, async (req: Request, res: Response) => {
  try {
    const employerUser = (req as any).employerUser;
    if (!employerUser?.companyId) {
      return res.status(403).json({ success: false, error: "No company associated with this account" });
    }

    const jobs = await db
      .select()
      .from(employerJobs)
      .where(eq(employerJobs.companyId, employerUser.companyId));

    const activeJobs = jobs.filter(j => j.status === "active").length;
    const totalJobs = jobs.length;

    let totalCandidates = 0;
    let pendingReview = 0;
    let shortlisted = 0;

    for (const job of jobs) {
      const candidates = await db
        .select()
        .from(employerCandidates)
        .where(eq(employerCandidates.jobId, job.id));
      
      totalCandidates += candidates.length;
      pendingReview += candidates.filter(c => c.status === "pending" || c.status === "completed").length;
      shortlisted += candidates.filter(c => c.status === "shortlisted").length;
    }

    res.json({
      success: true,
      stats: {
        activeJobs,
        totalJobs,
        totalCandidates,
        pendingReview,
        shortlisted,
      }
    });
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default employerRouter;
