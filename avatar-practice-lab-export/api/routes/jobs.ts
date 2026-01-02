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
} from "../../shared/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { getOpenAI } from "../utils/openai-client.js";
import puppeteer from "puppeteer";

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

    const [newJob] = await db
      .insert(jobTargets)
      .values({
        userId,
        roleTitle: parsedJd?.focusAreas?.[0] ? roleTitle.replace("Job from Paste", parsedJd.focusAreas[0]) : roleTitle,
        companyName: companyName || null,
        location: location || null,
        jdText: jdText || null,
        jdParsed: parsedJd,
        source,
        status: "saved",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json({ success: true, job: newJob });
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

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    const scraped = await page.evaluate(() => {
      const getText = (selectors: string[]): string => {
        for (const s of selectors) {
          const el = document.querySelector(s);
          if (el?.textContent?.trim()) return el.textContent.trim();
        }
        return "";
      };
      return {
        title: getText(["h1.top-card-layout__title", "h1.jobs-unified-top-card__job-title", ".job-details-jobs-unified-top-card__job-title", "h1"]),
        company: getText([".topcard__org-name-link", ".jobs-unified-top-card__company-name a", ".job-details-jobs-unified-top-card__company-name"]),
        location: getText([".topcard__flavor--bullet", ".jobs-unified-top-card__bullet", ".job-details-jobs-unified-top-card__bullet"]),
        description: getText([".description__text", ".jobs-description-content__text", ".jobs-box__html-content"]),
      };
    });

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

    const [newJob] = await db
      .insert(jobTargets)
      .values({
        userId,
        roleTitle: scraped.title || "Untitled Role",
        companyName: scraped.company || null,
        location: scraped.location || null,
        jobUrl: url,
        jdText: scraped.description || null,
        jdParsed: parsedJd,
        source: "linkedin",
        status: "saved",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json({ success: true, job: newJob });
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

// Scrape LinkedIn job URL and auto-create job target with parsed data
jobsRouter.post("/job-targets/parse-url", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: "URL is required" });
    }

    // Validate LinkedIn URL
    const linkedinPattern = /linkedin\.com\/jobs\/(view|search)/i;
    if (!linkedinPattern.test(url)) {
      return res.status(400).json({ 
        success: false, 
        error: "Please provide a valid LinkedIn job URL" 
      });
    }

    console.log("Scraping LinkedIn job URL:", url);

    // Launch Puppeteer to scrape the LinkedIn job page
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process'
      ]
    });

    try {
      const page = await browser.newPage();
      
      // Set a realistic user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for content to load
      await page.waitForSelector('h1, .job-details, .show-more-less-html', { timeout: 10000 }).catch(() => {});

      // Extract job details from the page
      const jobData = await page.evaluate(() => {
        // Try multiple selectors for job title
        const titleSelectors = [
          'h1.top-card-layout__title',
          'h1.topcard__title',
          'h1.job-details-jobs-unified-top-card__job-title',
          '.jobs-unified-top-card__job-title',
          'h1'
        ];
        let title = '';
        for (const sel of titleSelectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent?.trim()) {
            title = el.textContent.trim();
            break;
          }
        }

        // Try multiple selectors for company name
        const companySelectors = [
          '.topcard__org-name-link',
          '.top-card-layout__card a.topcard__org-name-link',
          '.job-details-jobs-unified-top-card__company-name',
          '.jobs-unified-top-card__company-name',
          'a[data-tracking-control-name="public_jobs_topcard-org-name"]',
          '.topcard__flavor--black-link'
        ];
        let company = '';
        for (const sel of companySelectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent?.trim()) {
            company = el.textContent.trim();
            break;
          }
        }

        // Try multiple selectors for location
        const locationSelectors = [
          '.topcard__flavor--bullet',
          '.top-card-layout__second-subline .topcard__flavor--bullet',
          '.job-details-jobs-unified-top-card__primary-description-container span',
          '.jobs-unified-top-card__bullet'
        ];
        let location = '';
        for (const sel of locationSelectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent?.trim()) {
            location = el.textContent.trim();
            break;
          }
        }

        // Try to get the job description
        const descriptionSelectors = [
          '.show-more-less-html__markup',
          '.description__text',
          '.jobs-description__content',
          '.job-details-module__content',
          '.jobs-box__html-content'
        ];
        let description = '';
        for (const sel of descriptionSelectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent?.trim()) {
            description = el.textContent.trim();
            break;
          }
        }

        return { title, company, location, description };
      });

      await browser.close();

      console.log("Scraped job data:", {
        title: jobData.title?.substring(0, 50),
        company: jobData.company,
        location: jobData.location,
        descLength: jobData.description?.length
      });

      if (!jobData.title && !jobData.company) {
        return res.status(400).json({
          success: false,
          error: "Could not extract job details from the URL. The page might require login or have a different format."
        });
      }

      // Parse the JD with OpenAI if we have a description
      let jdParsed: JDParsedType | null = null;
      if (jobData.description && jobData.description.length > 100) {
        try {
          const openai = getOpenAI();
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: JD_PARSE_PROMPT },
              { role: "user", content: jobData.description }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
          });

          const parsed = JSON.parse(completion.choices[0].message.content || "{}");
          jdParsed = parsed as JDParsedType;
        } catch (parseError) {
          console.error("Error parsing JD with OpenAI:", parseError);
        }
      }

      // Create the job target
      const [newJob] = await db
        .insert(jobTargets)
        .values({
          userId,
          roleTitle: jobData.title || "Unknown Role",
          companyName: jobData.company || null,
          location: jobData.location || null,
          jdText: jobData.description || null,
          jdParsed,
          jobUrl: url,
          source: "linkedin",
          status: "saved",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      res.status(201).json({ 
        success: true, 
        job: newJob,
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
        error: "Failed to scrape the LinkedIn job page. Please try pasting the job description manually."
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

