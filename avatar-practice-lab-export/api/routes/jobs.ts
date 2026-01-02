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

    const portal = detectPortal(url);
    const config = PORTAL_CONFIGS[portal];
    console.log(`Scraping job from ${config.name}: ${url}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process']
    });

    let jobData = { title: '', company: '', location: '', description: '' };
    let pageText = '';

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
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
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      res.status(201).json({ 
        success: true, 
        job: newJob,
        portal: config.name,
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

