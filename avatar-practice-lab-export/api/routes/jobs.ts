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
  userSkillPatterns,
  roleKits,
} from "../../shared/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { getOpenAI } from "../utils/openai-client.js";
import puppeteer from "puppeteer";
import { getCompanyAwarePracticeOptions, findCompanyBlueprint } from "../lib/practice-suggestions-generator.js";
import { 
  generatePracticeOptions as generateTaxonomyPracticeOptions,
  ROUND_TAXONOMY,
  RoundCategory,
  CompanyPracticeContext,
  PracticeOption,
  PracticeMode
} from "../../shared/practice-context.js";
import { execSync } from "child_process";
import { resolveAndSaveJobArchetypes, resolveCompanyArchetype, resolveRoleArchetype, listAllRoleArchetypes, listAllCompanyArchetypes, getRoleInterviewStructure, getUnifiedInterviewPlan, getEnrichedInterviewPlan, getEnrichedInterviewPlanWithSkills, getRoleTaskBlueprints } from "../lib/archetype-resolver.js";
import { mapRoleTitleToRoleKit, ensureRoleKitForJob, reprocessAllJobs, normalizeTitle, detectDomain, detectSeniority } from "../lib/role-kit-mapper.js";

let cachedChromiumPath: string | null = null;

function getChromiumPath(): string {
  if (cachedChromiumPath) return cachedChromiumPath;
  
  try {
    cachedChromiumPath = execSync("which chromium", { encoding: "utf-8" }).trim();
    console.log("Found Chromium at:", cachedChromiumPath);
    return cachedChromiumPath;
  } catch {
    const fallbackPaths = [
      "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
    ];
    for (const p of fallbackPaths) {
      try {
        execSync(`test -x "${p}"`, { encoding: "utf-8" });
        cachedChromiumPath = p;
        console.log("Using fallback Chromium at:", p);
        return p;
      } catch {}
    }
  }
  throw new Error("Chromium not found. Please install chromium system package.");
}

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
  detectedRoleTitle?: string;
  analysisDimensions?: string[];
  interviewTopics?: string[];
};

async function findDuplicateJob(userId: string, options: { jobUrl?: string; roleTitle?: string; companyName?: string }) {
  const { jobUrl, roleTitle, companyName } = options;
  
  if (jobUrl) {
    const normalizedUrl = jobUrl.split('?')[0].replace(/\/$/, '');
    const [existingByUrl] = await db
      .select({ id: jobTargets.id, roleTitle: jobTargets.roleTitle, companyName: jobTargets.companyName })
      .from(jobTargets)
      .where(and(
        eq(jobTargets.userId, userId),
        sql`REPLACE(SPLIT_PART(${jobTargets.jobUrl}, '?', 1), '/', '') = REPLACE(${normalizedUrl}, '/', '')`
      ))
      .limit(1);
    if (existingByUrl) return existingByUrl;
  }
  
  if (roleTitle && companyName) {
    const [existingByDetails] = await db
      .select({ id: jobTargets.id, roleTitle: jobTargets.roleTitle, companyName: jobTargets.companyName })
      .from(jobTargets)
      .where(and(
        eq(jobTargets.userId, userId),
        sql`LOWER(${jobTargets.roleTitle}) = LOWER(${roleTitle})`,
        sql`LOWER(${jobTargets.companyName}) = LOWER(${companyName})`
      ))
      .limit(1);
    if (existingByDetails) return existingByDetails;
  }
  
  return null;
}

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
- detectedRoleTitle: the specific job title/role name extracted from the JD (e.g., "Senior Software Engineer", "Data Analyst", "Product Manager")
- requiredSkills: array of specific required skills mentioned (be specific, include both technical and soft skills)
- preferredSkills: array of nice-to-have or preferred skills
- experienceLevel: one of "entry", "mid", "senior", "lead", or "executive"
- responsibilities: array of key job responsibilities (max 8)
- companyContext: brief summary of the company culture or context if mentioned
- redFlags: any concerning aspects (unrealistic requirements, vague expectations, etc.)
- focusAreas: top 3-5 areas the candidate should focus practice on for interviews
- salaryRange: salary range if mentioned, otherwise null
- analysisDimensions: array of 4-6 key competency dimensions to assess the candidate on (e.g., "Technical Problem Solving", "Communication", "Leadership", "Domain Expertise", "Collaboration")
- interviewTopics: array of 5-8 specific topics/questions areas to cover in practice interviews based on the JD requirements

Be precise and extract only what is explicitly stated or strongly implied. If something is not mentioned, use an empty array or null.`;

jobsRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const jobs = await db
      .select()
      .from(jobTargets)
      .where(and(eq(jobTargets.userId, userId), sql`${jobTargets.status} != 'archived'`))
      .orderBy(desc(jobTargets.updatedAt))
      .limit(50);
    res.json({ success: true, jobs });
  } catch (error: any) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

jobsRouter.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { roleTitle, companyName, location, jdText, source = "manual" } = req.body;

    if (!roleTitle) {
      return res.status(400).json({ success: false, error: "Role title is required" });
    }

    const existingJob = await findDuplicateJob(userId, { roleTitle, companyName });
    if (existingJob) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        existingJobId: existingJob.id,
        message: `You already have this role saved: ${existingJob.roleTitle}${existingJob.companyName ? ` at ${existingJob.companyName}` : ''}`
      });
    }

    let parsedJd: JDParsedType | null = null;
    if (jdText && jdText.length > 50) {
      try {
        const openai = getOpenAI();
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: JD_PARSE_PROMPT },
            { role: "user", content: jdText.substring(0, 8000) },
          ],
          response_format: { type: "json_object" },
        });
        parsedJd = JSON.parse(response.choices[0].message.content || "{}") as JDParsedType;
      } catch (e) {
        console.error("Failed to parse JD:", e);
      }
    }

    const placeholderTitles = ["new job", "job from paste", "untitled job", "untitled", ""];
    const isPlaceholderTitle = placeholderTitles.includes(roleTitle.toLowerCase().trim());
    
    const finalRoleTitle = parsedJd?.detectedRoleTitle || 
      (isPlaceholderTitle ? (parsedJd?.focusAreas?.[0] || "Untitled Role") : roleTitle);
    
    const roleKitMatch = await ensureRoleKitForJob(finalRoleTitle, jdText, parsedJd, companyName);

    const [newJob] = await db
      .insert(jobTargets)
      .values({
        userId,
        roleTitle: finalRoleTitle,
        companyName: companyName || null,
        location: location || null,
        jdText: jdText || null,
        jdParsed: parsedJd,
        source,
        status: "saved",
        roleKitId: roleKitMatch.roleKitId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json({ success: true, job: newJob, roleKitMatch });
  } catch (error: any) {
    console.error("Error creating job:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

jobsRouter.post("/import-linkedin", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { url } = req.body;

    if (!url || !url.includes("linkedin.com/jobs")) {
      return res.status(400).json({ success: false, error: "Valid LinkedIn job URL required" });
    }

    const existingJob = await findDuplicateJob(userId, { jobUrl: url });
    if (existingJob) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        existingJobId: existingJob.id,
        message: `You already have this job saved: ${existingJob.roleTitle}${existingJob.companyName ? ` at ${existingJob.companyName}` : ''}`
      });
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote'
      ],
      executablePath: getChromiumPath(),
      timeout: 30000,
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    const scraped = await page.evaluate(`
      (function() {
        function getText(selectors) {
          for (var i = 0; i < selectors.length; i++) {
            var el = document.querySelector(selectors[i]);
            if (el && el.textContent && el.textContent.trim()) return el.textContent.trim();
          }
          return "";
        }
        return {
          title: getText(["h1.top-card-layout__title", "h1.jobs-unified-top-card__job-title", ".job-details-jobs-unified-top-card__job-title", "h1"]),
          company: getText([".topcard__org-name-link", ".jobs-unified-top-card__company-name a", ".job-details-jobs-unified-top-card__company-name"]),
          location: getText([".topcard__flavor--bullet", ".jobs-unified-top-card__bullet", ".job-details-jobs-unified-top-card__bullet"]),
          description: getText([".description__text", ".jobs-description-content__text", ".jobs-box__html-content"])
        };
      })()
    `) as { title: string; company: string; location: string; description: string };

    await browser.close();

    let parsedJd: JDParsedType | null = null;
    if (scraped.description && scraped.description.length > 50) {
      try {
        const openai = getOpenAI();
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: JD_PARSE_PROMPT },
            { role: "user", content: scraped.description.substring(0, 8000) },
          ],
          response_format: { type: "json_object" },
        });
        parsedJd = JSON.parse(response.choices[0].message.content || "{}") as JDParsedType;
      } catch (e) {
        console.error("Failed to parse JD:", e);
      }
    }

    const finalRoleTitle = parsedJd?.detectedRoleTitle || scraped.title || "Untitled Role";
    const roleKitMatch = await ensureRoleKitForJob(finalRoleTitle, scraped.description, parsedJd, scraped.company);

    const [newJob] = await db
      .insert(jobTargets)
      .values({
        userId,
        roleTitle: finalRoleTitle,
        companyName: scraped.company || null,
        location: scraped.location || null,
        jobUrl: url,
        jdText: scraped.description || null,
        jdParsed: parsedJd,
        source: "linkedin",
        status: "saved",
        roleKitId: roleKitMatch.roleKitId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json({ success: true, job: newJob, roleKitMatch });
  } catch (error: any) {
    console.error("Error importing LinkedIn job:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

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

    const existingJob = await findDuplicateJob(userId, { jobUrl, roleTitle, companyName });
    if (existingJob) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        existingJobId: existingJob.id,
        message: `You already have this role saved: ${existingJob.roleTitle}${existingJob.companyName ? ` at ${existingJob.companyName}` : ''}`
      });
    }

    const roleKitMatch = await ensureRoleKitForJob(roleTitle, jdText, null, companyName);

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
        roleKitId: roleKitMatch.roleKitId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    let archetypeInfo: any = null;
    if (companyName || roleTitle) {
      try {
        archetypeInfo = await resolveAndSaveJobArchetypes(
          newJob.id,
          companyName || "",
          roleTitle,
          jdText || undefined
        );
      } catch (archetypeError) {
        console.error("Error resolving archetypes:", archetypeError);
      }
    }

    res.status(201).json({ success: true, job: newJob, archetypeInfo, roleKitMatch });
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

jobsRouter.patch("/job-targets/:id/role-kit", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const jobId = req.params.id;
    const { roleKitId } = req.body;

    const [existing] = await db
      .select()
      .from(jobTargets)
      .where(and(eq(jobTargets.id, jobId), eq(jobTargets.userId, userId)));

    if (!existing) {
      return res.status(404).json({ success: false, error: "Job target not found" });
    }

    if (roleKitId !== null) {
      const [roleKit] = await db
        .select()
        .from(roleKits)
        .where(eq(roleKits.id, roleKitId));

      if (!roleKit) {
        return res.status(400).json({ success: false, error: "Invalid role kit" });
      }
    }

    const [updated] = await db
      .update(jobTargets)
      .set({ roleKitId, updatedAt: new Date() })
      .where(eq(jobTargets.id, jobId))
      .returning();

    res.json({ success: true, job: updated });
  } catch (error: any) {
    console.error("Error updating job role kit:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

jobsRouter.post("/job-targets/:id/auto-map-role-kit", requireAuth, async (req: Request, res: Response) => {
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

    const roleKitMatch = await ensureRoleKitForJob(
      existing.roleTitle,
      existing.jdText,
      existing.jdParsed as any,
      existing.companyName
    );

    const [updated] = await db
      .update(jobTargets)
      .set({ 
        roleKitId: roleKitMatch.roleKitId,
        updatedAt: new Date() 
      })
      .where(eq(jobTargets.id, jobId))
      .returning();

    res.json({ 
      success: true, 
      mapped: true,
      job: updated, 
      roleKitMatch 
    });
  } catch (error: any) {
    console.error("Error auto-mapping role kit:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reprocess all jobs to fix mismatched role kits
jobsRouter.post("/reprocess-role-kits", requireAuth, async (req: Request, res: Response) => {
  try {
    console.log("Starting reprocessing of all jobs for role kit mapping...");
    const results = await reprocessAllJobs();
    
    console.log(`Reprocessing complete: ${results.processed} processed, ${results.updated} updated, ${results.errors} errors`);
    
    res.json({ 
      success: true, 
      ...results,
      summary: `Processed ${results.processed} jobs. Updated ${results.updated} role kit assignments. ${results.errors} errors.`
    });
  } catch (error: any) {
    console.error("Error reprocessing role kits:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Preview role kit derivation for a title without creating
jobsRouter.post("/preview-role-kit-derivation", requireAuth, async (req: Request, res: Response) => {
  try {
    const { roleTitle, jdText } = req.body;
    
    if (!roleTitle) {
      return res.status(400).json({ success: false, error: "roleTitle is required" });
    }
    
    const normalizedTitle = normalizeTitle(roleTitle);
    const domain = detectDomain(roleTitle, jdText);
    const seniority = detectSeniority(roleTitle, jdText);
    
    res.json({
      success: true,
      original: roleTitle,
      normalized: normalizedTitle,
      domain,
      seniority,
      suggestedKitName: `${normalizedTitle} - ${domain.charAt(0).toUpperCase() + domain.slice(1)} (${seniority.charAt(0).toUpperCase() + seniority.slice(1)})`
    });
  } catch (error: any) {
    console.error("Error previewing role kit derivation:", error);
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

type JobPortal = "linkedin" | "indeed" | "glassdoor" | "naukri" | "monster" | "wellfound" | "generic";

interface PortalConfig {
  name: string;
  titleSelectors: string[];
  companySelectors: string[];
  locationSelectors: string[];
  descriptionSelectors: string[];
  waitSelector?: string;
}

const PORTAL_CONFIGS: Record<JobPortal, PortalConfig> = {
  linkedin: {
    name: "LinkedIn",
    titleSelectors: [
      'h1.top-card-layout__title', 'h1.topcard__title',
      'h1.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title', 'h1'
    ],
    companySelectors: [
      '.topcard__org-name-link', '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name', '.topcard__flavor--black-link'
    ],
    locationSelectors: [
      '.topcard__flavor--bullet', '.jobs-unified-top-card__bullet',
      '.job-details-jobs-unified-top-card__primary-description-container span'
    ],
    descriptionSelectors: [
      '.show-more-less-html__markup', '.description__text',
      '.jobs-description__content', '.jobs-box__html-content'
    ],
    waitSelector: 'h1, .job-details, .show-more-less-html'
  },
  indeed: {
    name: "Indeed",
    titleSelectors: [
      'h1.jobsearch-JobInfoHeader-title', '.jobsearch-JobInfoHeader-title',
      '[data-testid="jobsearch-JobInfoHeader-title"]', 'h1'
    ],
    companySelectors: [
      '[data-testid="inlineHeader-companyName"]', '.jobsearch-InlineCompanyRating-companyHeader',
      '.jobsearch-CompanyInfoContainer a', '.css-1saizt3'
    ],
    locationSelectors: [
      '[data-testid="jobsearch-JobInfoHeader-companyLocation"]',
      '[data-testid="inlineHeader-companyLocation"]', '.jobsearch-JobInfoHeader-subtitle > div'
    ],
    descriptionSelectors: [
      '#jobDescriptionText', '.jobsearch-jobDescriptionText', '[data-testid="jobDescriptionText"]'
    ],
    waitSelector: '#jobDescriptionText, .jobsearch-JobInfoHeader-title'
  },
  glassdoor: {
    name: "Glassdoor",
    titleSelectors: [
      '[data-test="job-title"]', '.job-title', '.css-1vg6q84', 'h1'
    ],
    companySelectors: [
      '[data-test="employer-name"]', '.employer-name', '.css-87uc0g', '.job-details-employer-link'
    ],
    locationSelectors: [
      '[data-test="location"]', '.job-location', '.css-1buaf54'
    ],
    descriptionSelectors: [
      '[data-test="description"]', '.jobDescriptionContent', '.desc', '.job-description'
    ],
    waitSelector: '[data-test="job-title"], .job-title'
  },
  naukri: {
    name: "Naukri",
    titleSelectors: [
      '.jd-header-title', 'h1.title', '.job-title', 'h1'
    ],
    companySelectors: [
      '.jd-header-comp-name', '.company-title', '.companyName', 'a.company-name'
    ],
    locationSelectors: [
      '.loc', '.location', '.ni-job-tuple-icon-location + span'
    ],
    descriptionSelectors: [
      '.job-desc', '.dang-inner-html', '.job-description-inner', '#job-description'
    ],
    waitSelector: '.jd-header-title, .job-title'
  },
  monster: {
    name: "Monster",
    titleSelectors: [
      '[data-testid="viewJobTitle"]', '.job-title', 'h1'
    ],
    companySelectors: [
      '[data-testid="viewJobCompanyName"]', '.company-name', '.job-company'
    ],
    locationSelectors: [
      '[data-testid="viewJobLocation"]', '.location', '.job-location'
    ],
    descriptionSelectors: [
      '[data-testid="viewJobDescription"]', '.job-description', '#JobDescription'
    ],
    waitSelector: '[data-testid="viewJobTitle"], .job-title'
  },
  wellfound: {
    name: "Wellfound",
    titleSelectors: [
      '.job-title', 'h1', '[data-test="JobTitle"]'
    ],
    companySelectors: [
      '.company-link', '.startup-link', '[data-test="CompanyName"]'
    ],
    locationSelectors: [
      '.location', '.job-location', '[data-test="JobLocation"]'
    ],
    descriptionSelectors: [
      '.job-description', '.description-content', '[data-test="JobDescription"]'
    ]
  },
  generic: {
    name: "Job Portal",
    titleSelectors: ['h1', '[class*="title"]', '[class*="job-title"]', '[class*="jobtitle"]'],
    companySelectors: ['[class*="company"]', '[class*="employer"]', '[class*="org"]'],
    locationSelectors: ['[class*="location"]', '[class*="city"]', 'address'],
    descriptionSelectors: [
      '[class*="description"]', '[class*="job-desc"]', 
      'article', 'main', '[role="main"]'
    ]
  }
};

function detectPortal(url: string): JobPortal {
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname.includes('linkedin.com')) return 'linkedin';
  if (hostname.includes('indeed.com') || hostname.includes('indeed.co')) return 'indeed';
  if (hostname.includes('glassdoor.com') || hostname.includes('glassdoor.co')) return 'glassdoor';
  if (hostname.includes('naukri.com')) return 'naukri';
  if (hostname.includes('monster.com') || hostname.includes('monster.co')) return 'monster';
  if (hostname.includes('wellfound.com') || hostname.includes('angel.co')) return 'wellfound';
  return 'generic';
}

function isValidJobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

jobsRouter.post("/job-targets/parse-url", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: "URL is required" });
    }

    if (!isValidJobUrl(url)) {
      return res.status(400).json({ 
        success: false, 
        error: "Please provide a valid URL starting with http:// or https://" 
      });
    }

    const existingJob = await findDuplicateJob(userId, { jobUrl: url });
    if (existingJob) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        existingJobId: existingJob.id,
        message: `You already have this job saved: ${existingJob.roleTitle}${existingJob.companyName ? ` at ${existingJob.companyName}` : ''}`
      });
    }

    const portal = detectPortal(url);
    const config = PORTAL_CONFIGS[portal];
    console.log(`Scraping job from ${config.name}: ${url}`);

    let browser;
    try {
      const chromePath = getChromiumPath();
      console.log("Launching Chromium from:", chromePath);
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
          '--no-first-run',
          '--no-zygote'
        ],
        executablePath: chromePath,
        timeout: 30000,
      });
    } catch (launchError: any) {
      console.error("Failed to launch Chromium:", launchError.message);
      return res.status(500).json({
        success: false,
        error: "Browser failed to start. Please try again or enter job details manually."
      });
    }

    let jobData = { title: '', company: '', location: '', description: '' };
    let pageText = '';

    try {
      console.log("Creating new page...");
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      console.log("Navigating to URL...");
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      console.log("Page loaded, waiting for content...");
      
      const currentUrl = page.url();
      const pageTitle = await page.title();
      
      const isLoginBlocked = 
        currentUrl.includes('/login') ||
        currentUrl.includes('/uas/') ||
        currentUrl.includes('/authwall') ||
        currentUrl.includes('/signup') ||
        pageTitle.toLowerCase().includes('sign in') ||
        pageTitle.toLowerCase().includes('log in') ||
        pageTitle === 'LinkedIn';
      
      if (isLoginBlocked && portal === 'linkedin') {
        await browser.close();
        console.log("LinkedIn login wall detected");
        return res.status(409).json({
          success: false,
          error: "IMPORT_BLOCKED",
          message: "LinkedIn requires login to view this job. Please copy the job description text and paste it below instead.",
          suggestion: "paste"
        });
      }
      
      if (config.waitSelector) {
        await page.waitForSelector(config.waitSelector, { timeout: 10000 }).catch(() => {});
      }
      await new Promise(r => setTimeout(r, 2000));

      const extractWithSelectors = async (selectors: string[]): Promise<string> => {
        for (const sel of selectors) {
          const text = await page.$eval(sel, el => el.textContent?.trim() || '').catch(() => '');
          if (text) return text;
        }
        return '';
      };

      jobData.title = await extractWithSelectors(config.titleSelectors);
      jobData.company = await extractWithSelectors(config.companySelectors);
      jobData.location = await extractWithSelectors(config.locationSelectors);
      jobData.description = await extractWithSelectors(config.descriptionSelectors);
      
      pageText = await page.evaluate(() => document.body.innerText || '').catch(() => '');
      
      await browser.close();

      console.log("Scraped job data:", {
        portal: config.name,
        title: jobData.title?.substring(0, 50),
        company: jobData.company,
        location: jobData.location,
        descLength: jobData.description?.length
      });

      if (!jobData.title && !jobData.description && pageText.length > 200) {
        console.log("Selector extraction failed, using AI fallback...");
        try {
          const openai = getOpenAI();
          const aiExtract = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: `Extract job posting details from this webpage text. Return JSON with: title (job title), company (company name), location (job location), description (full job description text). If any field is unclear, leave it empty.` },
              { role: "user", content: pageText.substring(0, 12000) }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
          });
          const extracted = JSON.parse(aiExtract.choices[0].message.content || "{}");
          jobData.title = extracted.title || jobData.title;
          jobData.company = extracted.company || jobData.company;
          jobData.location = extracted.location || jobData.location;
          jobData.description = extracted.description || jobData.description;
        } catch (e) {
          console.error("AI extraction fallback failed:", e);
        }
      }

      if (!jobData.title) {
        return res.status(400).json({
          success: false,
          error: "Could not extract job details. The page might require login or have a different format. Try entering manually instead."
        });
      }

      let jdParsed: JDParsedType | null = null;
      const descToAnalyze = jobData.description || pageText;
      if (descToAnalyze && descToAnalyze.length > 100) {
        try {
          const openai = getOpenAI();
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: JD_PARSE_PROMPT },
              { role: "user", content: descToAnalyze.substring(0, 8000) }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
          });
          jdParsed = JSON.parse(completion.choices[0].message.content || "{}") as JDParsedType;
        } catch (e) {
          console.error("Error parsing JD:", e);
        }
      }

      const roleKitMatch = await ensureRoleKitForJob(jobData.title, jobData.description, jdParsed, jobData.company);

      const [newJob] = await db
        .insert(jobTargets)
        .values({
          userId,
          roleTitle: jobData.title,
          companyName: jobData.company || null,
          location: jobData.location || null,
          jdText: jobData.description || null,
          jdParsed,
          jobUrl: url,
          source: portal,
          status: "saved",
          roleKitId: roleKitMatch.roleKitId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      res.status(201).json({ 
        success: true, 
        job: newJob,
        portal: config.name,
        roleKitMatch,
        scraped: {
          title: jobData.title,
          company: jobData.company,
          location: jobData.location,
          descriptionLength: jobData.description?.length || 0,
          parsed: jdParsed !== null
        }
      });

    } catch (scrapeError: any) {
      await browser.close();
      console.error("Scraping error:", scrapeError);
      return res.status(500).json({
        success: false,
        error: "Failed to load the job page. Please check the URL or try entering the job details manually."
      });
    }

  } catch (error: any) {
    console.error("Error parsing job URL:", error);
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

    const existingJob = await findDuplicateJob(userId, { 
      roleTitle: extracted.roleTitle, 
      companyName: extracted.companyName 
    });
    if (existingJob) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        existingJobId: existingJob.id,
        message: `You already have this role saved: ${existingJob.roleTitle}${existingJob.companyName ? ` at ${existingJob.companyName}` : ''}`
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

    const parsed = job.jdParsed as JDParsedType | null;

    const preliminaryCompanyData = await getCompanyAwarePracticeOptions(
      job.companyName,
      job.roleTitle,
      null
    );

    if (!parsed) {
      return res.json({
        success: true,
        suggestions: [{
          id: "parse_jd",
          type: "parse_jd",
          priority: "high",
          title: "Analyze Job Description",
          description: "Parse the job description to get personalized practice recommendations",
          focusAreas: [],
          companySpecific: false,
          action: { type: "parse_jd", jobId },
        }],
        job,
        companyData: preliminaryCompanyData.companyData ? {
          companyName: preliminaryCompanyData.companyData.companyName,
          archetype: preliminaryCompanyData.companyData.archetype,
          tier: preliminaryCompanyData.companyData.tier,
          hasBlueprint: !!preliminaryCompanyData.companyData.blueprint,
          blueprintNotes: preliminaryCompanyData.companyData.blueprint?.notes || null,
          hasContext: true,
        } : {
          companyName: job.companyName || null,
          archetype: null,
          tier: null,
          hasBlueprint: false,
          blueprintNotes: null,
          hasContext: false,
        },
      });
    }

    const { options, companyData } = await getCompanyAwarePracticeOptions(
      job.companyName,
      job.roleTitle,
      {
        focusAreas: parsed.focusAreas,
        requiredSkills: parsed.requiredSkills,
        experienceLevel: parsed.experienceLevel,
      }
    );

    const suggestions = options.map(opt => ({
      ...opt,
      action: {
        ...opt.action,
        jobId,
      },
    }));

    res.json({ 
      success: true, 
      suggestions, 
      job,
      companyData: companyData ? {
        companyName: companyData.companyName,
        archetype: companyData.archetype,
        tier: companyData.tier,
        hasBlueprint: !!companyData.blueprint,
        blueprintNotes: companyData.blueprint?.notes || null,
        hasContext: true,
      } : {
        companyName: job.companyName || null,
        archetype: null,
        tier: null,
        hasBlueprint: false,
        blueprintNotes: null,
        hasContext: false,
      },
    });
  } catch (error: any) {
    console.error("Error generating practice suggestions:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// V2 Practice suggestions using unified archetype-based interview structure
jobsRouter.get("/job-targets/:id/practice-options", requireAuth, async (req: Request, res: Response) => {
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

    const parsed = job.jdParsed as JDParsedType | null;
    
    const blueprintData = await findCompanyBlueprint(
      job.companyName,
      job.roleTitle,
      parsed?.experienceLevel
    );
    const companyNotes = blueprintData?.blueprint?.notes || null;
    
    // Use skill-based interview plan when JD text is available
    const interviewPlan = await getEnrichedInterviewPlanWithSkills(
      job.roleArchetypeId || null,
      job.roleFamily || null,
      job.companyArchetype || null,
      job.archetypeConfidence as "high" | "medium" | "low" | null,
      parsed?.experienceLevel || null,
      companyNotes,
      job.companyName || null,
      job.jdText || null,  // Pass JD text for skill-based derivation
      job.roleTitle || null
    );
    
    const technicalCategories = ["technical_interview", "coding_assessment", "system_design", "coding"];
    const seenCategories = new Set<string>();
    
    // Get skills matched per interview type from derivation
    const skillDerivation = interviewPlan.skillDerivation;
    const getSkillsForType = (category: string): string[] => {
      if (!skillDerivation?.recommendedTypes) return [];
      const matched = skillDerivation.recommendedTypes.find(t => t.type === category);
      return matched?.matchedSkills || [];
    };
    
    // Interview type objectives based on the stage
    const interviewObjectives: Record<string, string> = {
      hr: "Assess cultural fit, communication skills, and career motivation",
      hiring_manager: "Evaluate domain expertise, role fit, and team dynamics",
      behavioral: "Explore past experiences using STAR format to predict future behavior",
      case_study: "Test structured problem-solving and business acumen",
      technical: "Verify technical depth, coding skills, and engineering fundamentals",
      technical_interview: "Verify technical depth, coding skills, and engineering fundamentals",
      coding: "Evaluate algorithmic thinking and code implementation skills",
      system_design: "Assess ability to design scalable systems and make architectural decisions",
      sql: "Test database querying skills and data manipulation proficiency",
      analytics: "Evaluate data analysis skills and insight generation ability",
      product_sense: "Assess product thinking, user empathy, and prioritization skills",
    };
    
    const options = interviewPlan.phases
      .filter((phase) => {
        const normalizedCategory = technicalCategories.includes(phase.category) 
          ? "technical_interview" 
          : phase.category;
        
        if (seenCategories.has(normalizedCategory)) {
          return false;
        }
        seenCategories.add(normalizedCategory);
        return true;
      })
      .map((phase) => {
        const blueprints = phase.blueprints || [];
        const primaryBlueprint = blueprints[0];
        
        const isTechnical = technicalCategories.includes(phase.category);
        const normalizedCategory = isTechnical ? "technical_interview" : phase.category;
        const taxonomy = ROUND_TAXONOMY[normalizedCategory as RoundCategory];
        
        // Get matched skills for this interview type
        const matchedSkills = isTechnical 
          ? [...new Set([
              ...getSkillsForType("technical"),
              ...getSkillsForType("coding"),
              ...getSkillsForType("system_design")
            ])]
          : getSkillsForType(phase.category);
        
        // Get objective for this interview type
        const objective = interviewObjectives[normalizedCategory] || phase.description;
        
        return {
          id: `${jobId}-${phase.phaseId}`,
          phaseId: phase.phaseId,
          roundCategory: normalizedCategory as RoundCategory,
          label: isTechnical 
            ? (job.companyName ? `${job.companyName} Technical Interview` : "Technical Interview")
            : (job.companyName ? `${job.companyName} ${phase.name}` : phase.name),
          description: isTechnical 
            ? "Technical problem solving including coding, system design, and domain expertise verification"
            : phase.description,
          objective,
          skillsAssessed: matchedSkills,
          practiceMode: "live_interview" as PracticeMode,
          typicalDuration: taxonomy?.typicalDuration || "10-15 min",
          icon: taxonomy?.icon || "code",
          companySpecific: !!job.companyArchetype,
          provenance: phase.provenance || null,
          companyContext: {
            jobTargetId: jobId,
            companyName: job.companyName,
            companyId: null,
            roleTitle: job.roleTitle,
            archetype: job.companyArchetype || null,
            tier: null,
            hasBlueprint: !!companyNotes,
            blueprintNotes: companyNotes,
            focusAreas: parsed?.focusAreas || [],
            leadershipPrinciples: null,
            interviewStyle: job.companyArchetype === "big_tech" ? "structured" : 
                            job.companyArchetype === "startup" ? "conversational" : "mixed",
          },
          focusHint: phase.subphases?.length ? `Focus areas: ${phase.subphases.join(", ")}` : null,
          roleBlueprint: primaryBlueprint ? {
            taskType: primaryBlueprint.taskType,
            promptTemplate: primaryBlueprint.promptTemplate,
            expectedSignals: primaryBlueprint.expectedSignals,
            probeQuestions: primaryBlueprint.probeTree,
            difficultyBand: primaryBlueprint.difficultyBand,
          } : null,
          allBlueprints: blueprints.map(b => ({
            taskType: b.taskType,
            promptTemplate: b.promptTemplate,
            expectedSignals: b.expectedSignals,
            probeQuestions: b.probeTree,
            difficultyBand: b.difficultyBand,
          })),
        };
      });

    res.json({
      success: true,
      options,
      interviewPlan,
      job: {
        id: job.id,
        roleTitle: job.roleTitle,
        companyName: job.companyName,
        location: job.location,
        roleArchetypeId: job.roleArchetypeId,
        roleFamily: job.roleFamily,
        companyArchetype: job.companyArchetype,
        archetypeConfidence: job.archetypeConfidence,
      },
      companyContext: {
        companyId: blueprintData?.companyId || null,
        companyName: blueprintData?.companyName || job.companyName,
        archetype: job.companyArchetype || blueprintData?.archetype || null,
        tier: blueprintData?.tier || null,
        hasBlueprint: !!companyNotes,
        hasContext: !!job.companyArchetype || !!companyNotes,
        blueprintNotes: companyNotes,
        interviewRounds: blueprintData?.blueprint?.interviewRounds || null,
        skillFocus: blueprintData?.blueprint?.skillFocus || null,
      },
      taxonomy: ROUND_TAXONOMY,
    });
  } catch (error: any) {
    console.error("Error generating practice options:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get practice context for a specific round
jobsRouter.get("/job-targets/:id/practice-context/:roundCategory", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const jobId = req.params.id;
    const roundCategory = req.params.roundCategory as RoundCategory;

    const [job] = await db
      .select()
      .from(jobTargets)
      .where(and(eq(jobTargets.id, jobId), eq(jobTargets.userId, userId)));

    if (!job) {
      return res.status(404).json({ success: false, error: "Job target not found" });
    }

    const taxonomy = ROUND_TAXONOMY[roundCategory];
    if (!taxonomy) {
      return res.status(400).json({ success: false, error: "Invalid round category" });
    }

    const parsed = job.jdParsed as JDParsedType | null;
    const blueprintData = await findCompanyBlueprint(
      job.companyName,
      job.roleTitle,
      parsed?.experienceLevel
    );

    const companyContext: CompanyPracticeContext = {
      jobTargetId: jobId,
      companyName: blueprintData?.companyName || job.companyName,
      companyId: blueprintData?.companyId || null,
      roleTitle: job.roleTitle,
      archetype: blueprintData?.archetype || null,
      tier: blueprintData?.tier || null,
      hasBlueprint: !!blueprintData?.blueprint,
      blueprintNotes: blueprintData?.blueprint?.notes || null,
      focusAreas: parsed?.focusAreas || [],
      leadershipPrinciples: blueprintData?.blueprint?.skillFocus?.filter(s => 
        s.includes("ownership") || s.includes("leadership") || s.includes("customer")
      ) || null,
      interviewStyle: blueprintData?.archetype === "faang" ? "structured" : 
                      blueprintData?.archetype === "startup" ? "conversational" : "mixed",
    };

    const matchingRound = blueprintData?.blueprint?.interviewRounds?.find(r => {
      const roundLower = r.type.toLowerCase();
      if (roundCategory === "aptitude_assessment" && roundLower.includes("aptitude")) return true;
      if (roundCategory === "hr_screening" && (roundLower.includes("phone") || roundLower.includes("hr"))) return true;
      if (roundCategory === "hiring_manager" && roundLower.includes("hiring")) return true;
      if (roundCategory === "technical_interview" && roundLower.includes("technical")) return true;
      if (roundCategory === "coding_assessment" && (roundLower.includes("coding") || roundLower.includes("dsa"))) return true;
      if (roundCategory === "system_design" && roundLower.includes("system")) return true;
      if (roundCategory === "case_study" && roundLower.includes("case")) return true;
      if (roundCategory === "behavioral" && roundLower.includes("behavioral")) return true;
      if (roundCategory === "culture_values" && (roundLower.includes("culture") || roundLower.includes("values"))) return true;
      if (roundCategory === "bar_raiser" && roundLower.includes("bar_raiser")) return true;
      if (roundCategory === "group_discussion" && roundLower.includes("group")) return true;
      return false;
    });

    res.json({
      success: true,
      roundCategory,
      taxonomy,
      companyContext,
      roundDetails: matchingRound || null,
      practiceMode: taxonomy.practiceMode,
      promptHints: generatePromptHints(roundCategory, companyContext, matchingRound),
    });
  } catch (error: any) {
    console.error("Error getting practice context:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

function generatePromptHints(
  roundCategory: RoundCategory,
  context: CompanyPracticeContext,
  roundDetails: any
): {
  avatarPersona: string;
  evaluationFocus: string[];
  sampleQuestions: string[];
  companySpecificGuidance: string | null;
} {
  const companyName = context.companyName || "the company";
  const archetype = context.archetype || "enterprise";
  
  const basePersonas: Record<RoundCategory, string> = {
    aptitude_assessment: `You are conducting an aptitude assessment at ${companyName}. Present quantitative, logical, and verbal reasoning problems. Evaluate analytical thinking and problem-solving speed.`,
    hr_screening: `You are a friendly but professional HR recruiter at ${companyName}. Your goal is to assess basic qualifications, communication skills, and culture fit. Ask about background, motivation for the role, and salary expectations.`,
    hiring_manager: `You are the hiring manager for this ${context.roleTitle} position at ${companyName}. You're looking for someone who can hit the ground running. Ask about relevant experience, leadership style, and how they'd approach key challenges.`,
    technical_interview: `You are a senior engineer at ${companyName} conducting a technical interview. Ask about technical concepts, past projects, and problem-solving approach. Probe for depth of understanding.`,
    coding_assessment: `You are conducting a coding assessment for ${companyName}. Present algorithmic problems and evaluate code quality, problem decomposition, and communication during coding.`,
    system_design: `You are a senior architect at ${companyName} conducting a system design interview. Ask the candidate to design a scalable system and probe their understanding of trade-offs, reliability, and performance.`,
    case_study: `You are presenting a business case study at ${companyName}. Present a realistic business problem and evaluate the candidate's analytical thinking, structured approach, and recommendations.`,
    behavioral: `You are conducting a behavioral interview at ${companyName}. Ask STAR-format questions about past experiences. Look for specific examples demonstrating key competencies.`,
    culture_values: `You are assessing culture fit at ${companyName}. Ask about values alignment, collaboration style, and how they handle ambiguity and conflict.`,
    bar_raiser: `You are a bar raiser at ${companyName} (cross-functional interviewer ensuring hiring standards). Ask probing questions across domains and evaluate if this candidate raises the bar for the team.`,
    group_discussion: `You are facilitating a group discussion at ${companyName}. Observe communication skills, teamwork, leadership potential, and ability to articulate and defend positions.`,
  };

  const evaluationFocus: Record<RoundCategory, string[]> = {
    aptitude_assessment: ["quantitative reasoning", "logical thinking", "verbal ability", "problem-solving speed"],
    hr_screening: ["communication clarity", "motivation", "cultural fit basics", "salary alignment"],
    hiring_manager: ["relevant experience", "leadership potential", "problem-solving", "role fit"],
    technical_interview: ["technical depth", "problem decomposition", "communication", "learning ability"],
    coding_assessment: ["code quality", "algorithmic thinking", "testing mindset", "communication while coding"],
    system_design: ["scalability", "trade-off analysis", "reliability thinking", "technical breadth"],
    case_study: ["structured thinking", "hypothesis generation", "quantitative reasoning", "recommendation clarity"],
    behavioral: ["STAR format usage", "specific examples", "self-awareness", "growth mindset"],
    culture_values: ["values alignment", "collaboration style", "adaptability", "ethical reasoning"],
    bar_raiser: ["overall bar-raising", "cross-functional impact", "long-term potential", "culture contribution"],
    group_discussion: ["communication clarity", "teamwork", "leadership emergence", "listening skills"],
  };

  const sampleQuestions: Record<RoundCategory, string[]> = {
    aptitude_assessment: [
      "If a train travels 120 km in 2 hours, what is its average speed?",
      "Complete the pattern: 2, 6, 12, 20, ?",
      "Which word is the odd one out: Apple, Mango, Carrot, Banana?",
    ],
    hr_screening: [
      "Walk me through your background and what attracted you to this role.",
      "What do you know about our company and why do you want to work here?",
      "What are your salary expectations?",
    ],
    hiring_manager: [
      "Tell me about a challenging project you led and how you handled it.",
      "How would you approach the first 90 days in this role?",
      "What's your leadership style when dealing with cross-functional teams?",
    ],
    technical_interview: [
      "Explain the architecture of a system you've built.",
      "How do you approach debugging a production issue?",
      "Walk me through your thought process when learning a new technology.",
    ],
    coding_assessment: [
      "Let's work through a problem: design an algorithm to...",
      "How would you optimize this code for performance?",
      "Write test cases for this function.",
    ],
    system_design: [
      "Design a URL shortener that handles millions of requests per day.",
      "How would you architect a real-time notification system?",
      "Walk me through the trade-offs between consistency and availability.",
    ],
    case_study: [
      "A client's revenue dropped 20% last quarter. How would you diagnose the issue?",
      "Should we enter this new market? Walk me through your analysis.",
      "How would you prioritize these three initiatives given limited resources?",
    ],
    behavioral: [
      "Tell me about a time you had to influence without authority.",
      "Describe a situation where you failed and what you learned.",
      "How do you handle disagreements with teammates?",
    ],
    culture_values: [
      "Describe your ideal work environment.",
      "How do you handle ambiguity and changing priorities?",
      "Tell me about a time you had to make an ethical decision at work.",
    ],
    bar_raiser: [
      "What makes you uniquely qualified for this role?",
      "How have you raised the bar in your previous teams?",
      "Tell me about your biggest career accomplishment and why it matters.",
    ],
    group_discussion: [
      "What are your views on this topic?",
      "How do you respond to the previous speaker's point?",
      "Can you summarize the key points made by the group?",
    ],
  };

  let companySpecificGuidance: string | null = null;
  if (context.blueprintNotes) {
    companySpecificGuidance = context.blueprintNotes;
  } else if (archetype === "faang" || archetype === "big_tech") {
    companySpecificGuidance = "Focus on problem-solving approach, scalability thinking, and clear communication. Expect structured interview format with defined evaluation criteria.";
  } else if (archetype === "startup") {
    companySpecificGuidance = "Emphasize adaptability, ownership, and ability to wear multiple hats. Expect more conversational interview style with focus on cultural fit.";
  } else if (archetype === "consulting") {
    companySpecificGuidance = "Demonstrate structured thinking, hypothesis-driven approach, and client-facing communication skills.";
  }

  if (roundDetails?.focus?.length > 0) {
    companySpecificGuidance = `${companySpecificGuidance || ""} Focus areas for this round: ${roundDetails.focus.join(", ")}`.trim();
  }

  return {
    avatarPersona: basePersonas[roundCategory],
    evaluationFocus: evaluationFocus[roundCategory],
    sampleQuestions: sampleQuestions[roundCategory],
    companySpecificGuidance,
  };
}

// Compute and update readiness score for a job target
jobsRouter.post("/job-targets/:id/compute-readiness", requireAuth, async (req: Request, res: Response) => {
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

    // Get all interview sessions for this job
    const interviewSessionsForJob = await db
      .select({
        sessionId: interviewSessions.id,
        dimensionScores: interviewAnalysis.dimensionScores,
        createdAt: interviewSessions.createdAt,
      })
      .from(interviewConfigs)
      .innerJoin(interviewSessions, eq(interviewSessions.interviewConfigId, interviewConfigs.id))
      .leftJoin(interviewAnalysis, eq(interviewAnalysis.interviewSessionId, interviewSessions.id))
      .where(eq(interviewConfigs.jobTargetId, jobId));

    // Get all exercise sessions for this job
    const exerciseSessionsForJob = await db
      .select({
        sessionId: exerciseSessions.id,
        score: exerciseAnalysis.overallScore,
        createdAt: exerciseSessions.createdAt,
      })
      .from(exerciseSessions)
      .leftJoin(exerciseAnalysis, eq(exerciseAnalysis.exerciseSessionId, exerciseSessions.id))
      .where(eq(exerciseSessions.jobTargetId, jobId));

    const totalSessions = interviewSessionsForJob.length + exerciseSessionsForJob.length;
    
    // Calculate average score from all sessions
    // For interview sessions, compute average from dimensionScores
    const interviewScores = interviewSessionsForJob
      .filter(s => s.dimensionScores && Array.isArray(s.dimensionScores))
      .map(s => {
        const scores = (s.dimensionScores as { score: number }[]).map(d => d.score);
        return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      })
      .filter((s): s is number => s !== null);
    
    const allScores = [
      ...interviewScores,
      ...exerciseSessionsForJob.filter(s => s.score !== null).map(s => s.score as number),
    ];
    
    const avgScore = allScores.length > 0 
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length 
      : null;

    // Compute readiness score based on:
    // 1. Practice volume (up to 30 points): 3 points per session, max 10 sessions
    // 2. Average performance (up to 50 points): score directly maps
    // 3. Skill coverage (up to 20 points): based on how many JD skills are practiced
    
    let readinessScore = 0;
    
    // Practice volume component (max 30 points)
    const volumeScore = Math.min(totalSessions * 3, 30);
    readinessScore += volumeScore;
    
    // Performance component (max 50 points)
    if (avgScore !== null) {
      const performanceScore = (avgScore / 100) * 50;
      readinessScore += performanceScore;
    }
    
    // Skill coverage component (max 20 points)
    // Requires at least 3 sessions AND parsed JD with skills to award 20 points
    const parsed = job.jdParsed as JDParsedType | null;
    let coverageScore = 0;
    if (parsed && parsed.requiredSkills && parsed.requiredSkills.length > 0 && totalSessions >= 3) {
      coverageScore = 20;
      readinessScore += coverageScore;
    }
    
    readinessScore = Math.round(readinessScore);

    // Find last practice date
    const allDates = [
      ...interviewSessionsForJob.map(s => s.createdAt),
      ...exerciseSessionsForJob.map(s => s.createdAt),
    ].filter(d => d !== null) as Date[];
    
    const lastPracticedAt = allDates.length > 0 
      ? new Date(Math.max(...allDates.map(d => d.getTime())))
      : null;

    // Update the job target with computed readiness score
    const [updated] = await db
      .update(jobTargets)
      .set({
        readinessScore,
        lastPracticedAt,
        updatedAt: new Date(),
      })
      .where(eq(jobTargets.id, jobId))
      .returning();

    res.json({
      success: true,
      job: updated,
      breakdown: {
        totalSessions,
        avgScore: avgScore ? Math.round(avgScore) : null,
        volumeScore,
        performanceScore: avgScore ? Math.round((avgScore / 100) * 50) : 0,
        coverageScore,
        readinessScore,
      },
    });
  } catch (error: any) {
    console.error("Error computing readiness score:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET readiness data for a specific job target with dimension analysis
jobsRouter.get("/job-targets/:id/readiness", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const jobId = req.params.id;

    // Verify job belongs to user
    const [job] = await db
      .select()
      .from(jobTargets)
      .where(and(eq(jobTargets.id, jobId), eq(jobTargets.userId, userId)));

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    // Get all interview sessions for this job via interview configs
    const configs = await db
      .select({ id: interviewConfigs.id })
      .from(interviewConfigs)
      .where(eq(interviewConfigs.jobTargetId, jobId));

    const configIds = configs.map(c => c.id);

    // Get interview sessions and their analysis
    let interviewSessionsWithAnalysis: {
      sessionId: number;
      createdAt: Date;
      analysisId: number | null;
      dimensionScores: { dimension: string; score: number; evidence: string[]; rationale: string; improvement: string }[] | null;
      overallRecommendation: string | null;
    }[] = [];

    if (configIds.length > 0) {
      for (const configId of configIds) {
        const sessions = await db
          .select({
            sessionId: interviewSessions.id,
            createdAt: interviewSessions.createdAt,
            analysisId: interviewAnalysis.id,
            dimensionScores: interviewAnalysis.dimensionScores,
            overallRecommendation: interviewAnalysis.overallRecommendation,
          })
          .from(interviewSessions)
          .leftJoin(interviewAnalysis, eq(interviewAnalysis.interviewSessionId, interviewSessions.id))
          .where(eq(interviewSessions.interviewConfigId, configId));
        
        interviewSessionsWithAnalysis.push(...sessions);
      }
    }

    // Aggregate dimension scores across all sessions
    const dimensionAggregates: Record<string, { scores: number[]; evidence: string[]; improvements: string[] }> = {};

    for (const session of interviewSessionsWithAnalysis) {
      if (session.dimensionScores && Array.isArray(session.dimensionScores)) {
        for (const dim of session.dimensionScores) {
          if (!dimensionAggregates[dim.dimension]) {
            dimensionAggregates[dim.dimension] = { scores: [], evidence: [], improvements: [] };
          }
          dimensionAggregates[dim.dimension].scores.push(dim.score);
          if (dim.evidence) dimensionAggregates[dim.dimension].evidence.push(...dim.evidence);
          if (dim.improvement) dimensionAggregates[dim.dimension].improvements.push(dim.improvement);
        }
      }
    }

    // Calculate average and trend for each dimension
    const dimensionSummary = Object.entries(dimensionAggregates).map(([dimension, data]) => {
      const avgScore = data.scores.length > 0 
        ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
        : 0;
      
      // Calculate trend from first half vs second half of scores
      let trend: "improving" | "stable" | "declining" = "stable";
      if (data.scores.length >= 2) {
        const mid = Math.floor(data.scores.length / 2);
        const firstHalfAvg = data.scores.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
        const secondHalfAvg = data.scores.slice(mid).reduce((a, b) => a + b, 0) / (data.scores.length - mid);
        if (secondHalfAvg > firstHalfAvg + 5) trend = "improving";
        else if (secondHalfAvg < firstHalfAvg - 5) trend = "declining";
      }

      return {
        dimension,
        avgScore,
        trend,
        sessionCount: data.scores.length,
        latestScore: data.scores.length > 0 ? data.scores[data.scores.length - 1] : null,
        topEvidence: data.evidence.slice(0, 3),
        topImprovement: data.improvements[data.improvements.length - 1] || null,
      };
    });

    // Sort by average score to find strongest and weakest
    const sortedDimensions = [...dimensionSummary].sort((a, b) => b.avgScore - a.avgScore);
    const strongestDimensions = sortedDimensions.slice(0, 3);
    const weakestDimensions = sortedDimensions.slice(-3).reverse();

    // Calculate overall averages
    const overallAvg = dimensionSummary.length > 0
      ? Math.round(dimensionSummary.reduce((sum, d) => sum + d.avgScore, 0) / dimensionSummary.length)
      : 0;

    // Get exercise sessions count
    const exerciseSessionsForJob = await db
      .select({ id: exerciseSessions.id })
      .from(exerciseSessions)
      .where(eq(exerciseSessions.jobTargetId, jobId));

    // Calculate new readiness score based on volume + performance + coverage
    const totalSessions = interviewSessionsWithAnalysis.length + exerciseSessionsForJob.length;
    let volumeScore = Math.min(totalSessions * 10, 30); // 0-30 points

    // Performance score based on overall avg (0-50 points, scaled from 0-100)
    const performanceScore = overallAvg > 0 ? Math.round((overallAvg / 5) * 50) : 0;

    // Coverage score based on focus areas practiced (0-20 points)
    const focusAreas = (job.jdParsed as JDParsedType)?.focusAreas || [];
    const coveredDimensions = dimensionSummary.map(d => d.dimension.toLowerCase());
    const coverageRatio = focusAreas.length > 0
      ? focusAreas.filter(f => coveredDimensions.some(d => d.includes(f.toLowerCase()) || f.toLowerCase().includes(d))).length / focusAreas.length
      : (dimensionSummary.length > 0 ? 0.5 : 0);
    const coverageScore = Math.round(coverageRatio * 20);

    const computedReadinessScore = Math.min(volumeScore + performanceScore + coverageScore, 100);
    const previousScore = job.readinessScore || 0;
    const readinessDelta = computedReadinessScore - previousScore;

    // Determine overall trend
    const improvingDimensions = dimensionSummary.filter(d => d.trend === "improving").length;
    const decliningDimensions = dimensionSummary.filter(d => d.trend === "declining").length;
    let overallTrend: "improving" | "stable" | "declining" = "stable";
    if (improvingDimensions > decliningDimensions + 1) overallTrend = "improving";
    else if (decliningDimensions > improvingDimensions + 1) overallTrend = "declining";

    // Persist computed readiness score if changed
    if (computedReadinessScore !== previousScore) {
      await db
        .update(jobTargets)
        .set({
          readinessScore: computedReadinessScore,
          updatedAt: new Date(),
        })
        .where(eq(jobTargets.id, jobId));
    }

    res.json({
      success: true,
      jobId,
      roleTitle: job.roleTitle,
      companyName: job.companyName,
      readinessScore: computedReadinessScore,
      previousScore,
      readinessDelta,
      overallTrend,
      lastPracticedAt: job.lastPracticedAt,
      stats: {
        interviewSessionCount: interviewSessionsWithAnalysis.length,
        exerciseSessionCount: exerciseSessionsForJob.length,
        totalSessionCount: totalSessions,
        overallAvgScore: overallAvg,
      },
      breakdown: {
        volumeScore,
        performanceScore,
        coverageScore,
      },
      dimensions: dimensionSummary,
      strongestDimensions,
      weakestDimensions,
      focusAreas,
    });
  } catch (error: any) {
    console.error("Error fetching readiness data:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user skill patterns (career memory)
jobsRouter.get("/skill-patterns", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const patterns = await db
      .select()
      .from(userSkillPatterns)
      .where(eq(userSkillPatterns.userId, userId))
      .orderBy(desc(userSkillPatterns.occurrences));

    res.json({ success: true, patterns });
  } catch (error: any) {
    console.error("Error fetching skill patterns:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get AI insights from career memory patterns
jobsRouter.get("/ai-insights", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const patterns = await db
      .select()
      .from(userSkillPatterns)
      .where(eq(userSkillPatterns.userId, userId))
      .orderBy(desc(userSkillPatterns.occurrences));

    if (patterns.length === 0) {
      return res.json({
        success: true,
        insights: [],
        summary: "Complete a few interview practice sessions to unlock personalized insights about your performance patterns.",
        hasData: false,
      });
    }

    // Generate insights from patterns
    const insights: { type: "strength" | "weakness" | "trend" | "tip"; title: string; description: string; dimension?: string }[] = [];

    // Find persistent weaknesses (low avg score, multiple occurrences)
    const weakPatterns = patterns
      .filter(p => p.avgScore !== null && p.avgScore < 3 && (p.occurrences || 0) >= 2)
      .sort((a, b) => (a.avgScore || 0) - (b.avgScore || 0));

    for (const weak of weakPatterns.slice(0, 2)) {
      insights.push({
        type: "weakness",
        title: `Recurring Challenge: ${weak.dimension}`,
        description: `You've scored below average on ${weak.dimension} across ${weak.occurrences} sessions (avg: ${(weak.avgScore || 0).toFixed(1)}/5). Focus your next practice on improving this area.`,
        dimension: weak.dimension,
      });
    }

    // Find strengths (high avg score, multiple occurrences)
    const strongPatterns = patterns
      .filter(p => p.avgScore !== null && p.avgScore >= 4 && (p.occurrences || 0) >= 2)
      .sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0));

    for (const strong of strongPatterns.slice(0, 2)) {
      insights.push({
        type: "strength",
        title: `Consistent Strength: ${strong.dimension}`,
        description: `You consistently perform well on ${strong.dimension} (avg: ${(strong.avgScore || 0).toFixed(1)}/5 across ${strong.occurrences} sessions). This is a reliable asset in interviews.`,
        dimension: strong.dimension,
      });
    }

    // Find improving trends
    const improvingPatterns = patterns.filter(p => p.trend === "improving" && (p.occurrences || 0) >= 2);
    for (const improving of improvingPatterns.slice(0, 1)) {
      insights.push({
        type: "trend",
        title: `Improving: ${improving.dimension}`,
        description: `Your ${improving.dimension} scores are trending upward. Keep practicing to solidify these gains.`,
        dimension: improving.dimension,
      });
    }

    // Find declining trends
    const decliningPatterns = patterns.filter(p => p.trend === "declining" && (p.occurrences || 0) >= 2);
    for (const declining of decliningPatterns.slice(0, 1)) {
      insights.push({
        type: "trend",
        title: `Attention Needed: ${declining.dimension}`,
        description: `Your ${declining.dimension} scores have declined recently. Consider focused practice or review of fundamentals.`,
        dimension: declining.dimension,
      });
    }

    // Generate summary
    const totalSessions = patterns.reduce((sum, p) => Math.max(sum, p.occurrences || 0), 0);
    const avgOverall = patterns.reduce((sum, p) => sum + (p.avgScore || 0), 0) / patterns.length;
    
    let summary = `Based on ${patterns.length} skill dimensions tracked across your practice sessions, `;
    if (avgOverall >= 4) {
      summary += "you're performing strongly overall. Focus on maintaining consistency.";
    } else if (avgOverall >= 3) {
      summary += "you're showing solid progress with room for improvement in specific areas.";
    } else {
      summary += "there's significant opportunity for growth. Regular practice will help build confidence.";
    }

    res.json({
      success: true,
      insights,
      summary,
      hasData: true,
      stats: {
        dimensionsTracked: patterns.length,
        avgScore: avgOverall,
        improvingCount: improvingPatterns.length,
        decliningCount: decliningPatterns.length,
      },
    });
  } catch (error: any) {
    console.error("Error generating AI insights:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update skill patterns after a session analysis (called by analysis endpoints)
jobsRouter.post("/skill-patterns/update", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { dimensions } = req.body;

    if (!dimensions || !Array.isArray(dimensions)) {
      return res.status(400).json({ success: false, error: "Dimensions array required" });
    }

    const updatedPatterns: (typeof userSkillPatterns.$inferSelect)[] = [];

    for (const dim of dimensions) {
      const { name, score } = dim;
      if (!name || score === undefined) continue;

      // Check if pattern exists
      const [existing] = await db
        .select()
        .from(userSkillPatterns)
        .where(and(
          eq(userSkillPatterns.userId, userId),
          eq(userSkillPatterns.dimension, name)
        ));

      if (existing) {
        // Update existing pattern
        const newOccurrences = (existing.occurrences || 1) + 1;
        const prevAvg = existing.avgScore || score;
        const newAvgScore = ((prevAvg * (newOccurrences - 1)) + score) / newOccurrences;
        
        // Determine trend
        let trend: "improving" | "stagnant" | "declining" = "stagnant";
        if (prevAvg && score > prevAvg + 5) trend = "improving";
        else if (prevAvg && score < prevAvg - 5) trend = "declining";

        const [updated] = await db
          .update(userSkillPatterns)
          .set({
            occurrences: newOccurrences,
            avgScore: newAvgScore,
            trend,
            lastSeenAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userSkillPatterns.id, existing.id))
          .returning();

        updatedPatterns.push(updated);
      } else {
        // Create new pattern
        const [created] = await db
          .insert(userSkillPatterns)
          .values({
            userId,
            dimension: name,
            occurrences: 1,
            avgScore: score,
            trend: "stagnant",
            lastSeenAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        updatedPatterns.push(created);
      }
    }

    res.json({ success: true, patterns: updatedPatterns });
  } catch (error: any) {
    console.error("Error updating skill patterns:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

jobsRouter.get("/archetypes/roles", requireAuth, async (req: Request, res: Response) => {
  try {
    const archetypes = await listAllRoleArchetypes();
    res.json({ success: true, archetypes });
  } catch (error: any) {
    console.error("Error fetching role archetypes:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

jobsRouter.get("/archetypes/companies", requireAuth, async (req: Request, res: Response) => {
  try {
    const archetypes = await listAllCompanyArchetypes();
    res.json({ success: true, archetypes });
  } catch (error: any) {
    console.error("Error fetching company archetypes:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

jobsRouter.get("/archetypes/structure/:roleArchetypeId/:seniority", requireAuth, async (req: Request, res: Response) => {
  try {
    const { roleArchetypeId, seniority } = req.params;
    const validSeniorities = ["entry", "mid", "senior"];
    
    if (!validSeniorities.includes(seniority)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid seniority. Must be one of: ${validSeniorities.join(", ")}` 
      });
    }
    
    const structure = await getRoleInterviewStructure(
      roleArchetypeId, 
      seniority as "entry" | "mid" | "senior"
    );
    
    if (!structure) {
      return res.status(404).json({ success: false, error: "Structure not found for this archetype and seniority" });
    }
    
    res.json({ success: true, structure });
  } catch (error: any) {
    console.error("Error fetching interview structure:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

jobsRouter.put("/job-targets/:id/archetype", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const jobId = req.params.id;
    const { companyArchetype, roleArchetypeId, roleFamily, autoDetect } = req.body;

    const [existing] = await db
      .select()
      .from(jobTargets)
      .where(and(eq(jobTargets.id, jobId), eq(jobTargets.userId, userId)));

    if (!existing) {
      return res.status(404).json({ success: false, error: "Job target not found" });
    }

    if (autoDetect) {
      const archetypeInfo = await resolveAndSaveJobArchetypes(
        jobId,
        existing.companyName || "",
        existing.roleTitle,
        existing.jdText || undefined
      );
      
      const [updated] = await db
        .select()
        .from(jobTargets)
        .where(eq(jobTargets.id, jobId));

      return res.json({ success: true, job: updated, archetypeInfo });
    }

    const [updated] = await db
      .update(jobTargets)
      .set({
        companyArchetype: companyArchetype === "" ? null : (companyArchetype !== undefined ? companyArchetype : existing.companyArchetype),
        archetypeConfidence: companyArchetype === "" ? null : (companyArchetype ? "high" : existing.archetypeConfidence),
        roleArchetypeId: roleArchetypeId === "" ? null : (roleArchetypeId !== undefined ? roleArchetypeId : existing.roleArchetypeId),
        roleFamily: roleFamily === "" ? null : (roleFamily !== undefined ? roleFamily : existing.roleFamily),
        updatedAt: new Date(),
      })
      .where(eq(jobTargets.id, jobId))
      .returning();

    res.json({ success: true, job: updated });
  } catch (error: any) {
    console.error("Error updating job archetype:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

jobsRouter.post("/job-targets/:id/resolve-archetypes", requireAuth, async (req: Request, res: Response) => {
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

    const archetypeInfo = await resolveAndSaveJobArchetypes(
      jobId,
      existing.companyName || "",
      existing.roleTitle,
      existing.jdText || undefined
    );

    const [updated] = await db
      .select()
      .from(jobTargets)
      .where(eq(jobTargets.id, jobId));

    res.json({ success: true, job: updated, archetypeInfo });
  } catch (error: any) {
    console.error("Error resolving job archetypes:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

