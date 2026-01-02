import { Router, Request, Response } from "express";
import { db } from "../db.js";
import { eq, desc, and, sql, count } from "drizzle-orm";
import {
  jobTargets,
  interviewConfigs,
  interviewSessions,
  exerciseSessions,
  interviewAnalysis,
  exerciseAnalysis,
} from "../../shared/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { getOpenAI } from "../utils/openai-client.js";

export const jobsRouter = Router();

jobsRouter.use((req, res, next) => {
  const sessionUser = (req.session as any)?.user;
  if (sessionUser) {
    req.user = sessionUser;
  }
  next();
});

type JDParsedType = {
  requiredSkills?: string[];
  preferredSkills?: string[];
  experienceLevel?: string;
  responsibilities?: string[];
  companyContext?: string;
  redFlags?: string[];
  focusAreas?: string[];
  salaryRange?: string;
};

type JobTarget = {
  id: string;
  userId: string;
  source: "linkedin" | "naukri" | "indeed" | "company" | "manual" | null;
  jobUrl: string | null;
  companyName: string | null;
  roleTitle: string;
  location: string | null;
  jdText: string | null;
  jdParsed: JDParsedType | null;
  status: "saved" | "applied" | "interview" | "offer" | "rejected" | "archived";
  readinessScore: number | null;
  lastPracticedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type JobWithPracticeStats = JobTarget & {
  practiceStats: {
    totalSessions: number;
    interviewSessions: number;
    exerciseSessions: number;
    avgScore: number | null;
  };
};

const JD_PARSE_PROMPT = `You are an expert job description analyst. Analyze the given job description and extract structured information.

Return a JSON object with the following fields:
- requiredSkills: array of specific required skills mentioned (be specific, include both technical and soft skills)
- preferredSkills: array of nice-to-have or preferred skills
- experienceLevel: one of "entry", "mid", "senior", "lead", or "executive"
- responsibilities: array of key job responsibilities (max 8)
- companyContext: brief summary of the company culture or context if mentioned
- redFlags: any concerning aspects (unrealistic requirements, vague expectations, etc.)
- focusAreas: top 3-5 areas the candidate should focus practice on
- salaryRange: salary range if mentioned, otherwise null

Be precise and extract only what is explicitly stated or strongly implied. If something is not mentioned, use an empty array or null.`;

jobsRouter.get("/job-targets", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status, limit = "50" } = req.query;

    let conditions = [eq(jobTargets.userId, userId)];
    
    if (status && typeof status === "string" && status !== "all") {
      conditions.push(eq(jobTargets.status, status as any));
    } else {
      conditions.push(sql`${jobTargets.status} != 'archived'`);
    }

    const jobs = await db
      .select()
      .from(jobTargets)
      .where(and(...conditions))
      .orderBy(desc(jobTargets.updatedAt))
      .limit(parseInt(limit as string));

    const jobsWithStats: JobWithPracticeStats[] = await Promise.all(
      jobs.map(async (job) => {
        const [interviewCount] = await db
          .select({ count: count() })
          .from(interviewConfigs)
          .where(eq(interviewConfigs.jobTargetId, job.id));

        const [exerciseCount] = await db
          .select({ count: count() })
          .from(exerciseSessions)
          .where(eq(exerciseSessions.jobTargetId, job.id));

        return {
          ...job,
          practiceStats: {
            totalSessions: (interviewCount?.count || 0) + (exerciseCount?.count || 0),
            interviewSessions: interviewCount?.count || 0,
            exerciseSessions: exerciseCount?.count || 0,
            avgScore: null,
          },
        } as JobWithPracticeStats;
      })
    );

    res.json({ success: true, jobs: jobsWithStats });
  } catch (error: any) {
    console.error("Error fetching job targets:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

jobsRouter.get("/job-targets/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const jobId = req.params.id;

    const [job] = await db
      .select()
      .from(jobTargets)
      .where(and(eq(jobTargets.id, jobId), eq(jobTargets.userId, userId)));

    if (!job) {
      return res.status(404).json({ success: false, error: "Job target not found" });
    }

    const relatedInterviews = await db
      .select()
      .from(interviewConfigs)
      .where(eq(interviewConfigs.jobTargetId, jobId))
      .orderBy(desc(interviewConfigs.createdAt))
      .limit(10);

    const relatedExercises = await db
      .select()
      .from(exerciseSessions)
      .where(eq(exerciseSessions.jobTargetId, jobId))
      .orderBy(desc(exerciseSessions.createdAt))
      .limit(10);

    res.json({
      success: true,
      job,
      practiceHistory: {
        interviews: relatedInterviews,
        exercises: relatedExercises,
      },
    });
  } catch (error: any) {
    console.error("Error fetching job target:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

jobsRouter.post("/job-targets", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { roleTitle, companyName, jdText, jobUrl, location, source } = req.body;

    if (!roleTitle) {
      return res.status(400).json({ success: false, error: "Role title is required" });
    }

    const [newJob] = await db
      .insert(jobTargets)
      .values({
        userId,
        roleTitle,
        companyName: companyName || null,
        jdText: jdText || null,
        jobUrl: jobUrl || null,
        location: location || null,
        source: source || "manual",
        status: "saved",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json({ success: true, job: newJob });
  } catch (error: any) {
    console.error("Error creating job target:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

jobsRouter.put("/job-targets/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const jobId = req.params.id;
    const updates = req.body;

    const [existing] = await db
      .select()
      .from(jobTargets)
      .where(and(eq(jobTargets.id, jobId), eq(jobTargets.userId, userId)));

    if (!existing) {
      return res.status(404).json({ success: false, error: "Job target not found" });
    }

    const [updated] = await db
      .update(jobTargets)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(jobTargets.id, jobId))
      .returning();

    res.json({ success: true, job: updated });
  } catch (error: any) {
    console.error("Error updating job target:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

jobsRouter.patch("/job-targets/:id/status", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const jobId = req.params.id;
    const { status } = req.body;

    const validStatuses = ["saved", "applied", "interview", "offer", "rejected", "archived"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const [existing] = await db
      .select()
      .from(jobTargets)
      .where(and(eq(jobTargets.id, jobId), eq(jobTargets.userId, userId)));

    if (!existing) {
      return res.status(404).json({ success: false, error: "Job target not found" });
    }

    const [updated] = await db
      .update(jobTargets)
      .set({ status, updatedAt: new Date() })
      .where(eq(jobTargets.id, jobId))
      .returning();

    res.json({ success: true, job: updated });
  } catch (error: any) {
    console.error("Error updating job status:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

jobsRouter.delete("/job-targets/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const jobId = req.params.id;

    const [existing] = await db
      .select()
      .from(jobTargets)
      .where(and(eq(jobTargets.id, jobId), eq(jobTargets.userId, userId)));

    if (!existing) {
      return res.status(404).json({ success: false, error: "Job target not found" });
    }

    await db.delete(jobTargets).where(eq(jobTargets.id, jobId));

    res.json({ success: true, message: "Job target deleted" });
  } catch (error: any) {
    console.error("Error deleting job target:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

jobsRouter.post("/job-targets/:id/parse-jd", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const jobId = req.params.id;

    const [job] = await db
      .select()
      .from(jobTargets)
      .where(and(eq(jobTargets.id, jobId), eq(jobTargets.userId, userId)));

    if (!job) {
      return res.status(404).json({ success: false, error: "Job target not found" });
    }

    if (!job.jdText || job.jdText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        error: "Job description text is too short or missing. Please add the full JD first.",
      });
    }

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: JD_PARSE_PROMPT },
        { role: "user", content: `Job Title: ${job.roleTitle}\nCompany: ${job.companyName || "Unknown"}\n\nJob Description:\n${job.jdText}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}") as JDParsedType;

    const [updated] = await db
      .update(jobTargets)
      .set({
        jdParsed: parsed,
        updatedAt: new Date(),
      })
      .where(eq(jobTargets.id, jobId))
      .returning();

    res.json({ success: true, job: updated, parsed });
  } catch (error: any) {
    console.error("Error parsing job description:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

jobsRouter.post("/job-targets/parse-paste", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { pastedText } = req.body;

    if (!pastedText || pastedText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        error: "Please paste a job description with at least 50 characters",
      });
    }

    const openai = getOpenAI();
    
    const extractPrompt = `Analyze this job posting text and extract:
1. roleTitle: The job title (required)
2. companyName: Company name if mentioned
3. location: Job location if mentioned
4. All the structured JD analysis fields

Return JSON with: roleTitle, companyName, location, and jdParsed object containing:
requiredSkills, preferredSkills, experienceLevel, responsibilities, companyContext, redFlags, focusAreas, salaryRange`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: extractPrompt },
        { role: "user", content: pastedText },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const extracted = JSON.parse(response.choices[0]?.message?.content || "{}");
    
    if (!extracted.roleTitle) {
      return res.status(400).json({
        success: false,
        error: "Could not extract job title from the pasted text. Please ensure it contains a valid job description.",
      });
    }

    const [newJob] = await db
      .insert(jobTargets)
      .values({
        userId,
        roleTitle: extracted.roleTitle,
        companyName: extracted.companyName || null,
        location: extracted.location || null,
        jdText: pastedText,
        jdParsed: extracted.jdParsed || null,
        source: "manual",
        status: "saved",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json({
      success: true,
      job: newJob,
      extracted: {
        roleTitle: extracted.roleTitle,
        companyName: extracted.companyName,
        location: extracted.location,
      },
    });
  } catch (error: any) {
    console.error("Error parsing pasted JD:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

jobsRouter.get("/job-targets/:id/practice-suggestions", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const jobId = req.params.id;

    const [job] = await db
      .select()
      .from(jobTargets)
      .where(and(eq(jobTargets.id, jobId), eq(jobTargets.userId, userId)));

    if (!job) {
      return res.status(404).json({ success: false, error: "Job target not found" });
    }

    type PracticeSuggestion = {
      type: string;
      priority: "high" | "medium" | "low";
      title: string;
      description: string;
      action: Record<string, unknown>;
    };
    
    const suggestions: PracticeSuggestion[] = [];
    const parsed = job.jdParsed as JDParsedType | null;

    if (!parsed) {
      suggestions.push({
        type: "parse_jd",
        priority: "high",
        title: "Analyze Job Description",
        description: "Parse the job description to get personalized practice recommendations",
        action: { type: "parse_jd", jobId },
      });
    } else {
      if (parsed.focusAreas && parsed.focusAreas.length > 0) {
        suggestions.push({
          type: "interview_practice",
          priority: "high",
          title: "Practice Interview Questions",
          description: `Focus on: ${parsed.focusAreas.slice(0, 3).join(", ")}`,
          action: { type: "start_interview", jobId, focusAreas: parsed.focusAreas },
        });
      }

      if (parsed.requiredSkills && parsed.requiredSkills.length > 0) {
        const technicalSkills = parsed.requiredSkills.filter(s => 
          s.toLowerCase().includes("python") ||
          s.toLowerCase().includes("javascript") ||
          s.toLowerCase().includes("sql") ||
          s.toLowerCase().includes("coding") ||
          s.toLowerCase().includes("programming")
        );
        
        if (technicalSkills.length > 0) {
          suggestions.push({
            type: "coding_practice",
            priority: "medium",
            title: "Coding Challenge Practice",
            description: `Sharpen skills in: ${technicalSkills.slice(0, 3).join(", ")}`,
            action: { type: "start_coding", jobId, skills: technicalSkills },
          });
        }
      }

      suggestions.push({
        type: "case_study",
        priority: "medium",
        title: "Case Study Practice",
        description: "Practice analytical thinking for behavioral questions",
        action: { type: "start_case", jobId },
      });
    }

    res.json({ success: true, suggestions, job });
  } catch (error: any) {
    console.error("Error generating practice suggestions:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

