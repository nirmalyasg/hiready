/**
 * Job Screening Agent API Routes
 *
 * Handles job screening agents, job catalog, and user interactions
 */

import { Router } from "express";
import { db } from "../db.js";
import { eq, and, desc, sql, inArray, or, ilike } from "drizzle-orm";
import {
  jobScreeningAgents,
  jobCatalog,
  jobScreeningAgentResults,
  userJobCatalogInteractions,
  jobTargets,
  publicJobPages,
  publicJobPageAnalytics,
} from "../../shared/schema.js";
import { requireAuth } from "../middleware/auth.js";
import jobSearchService, {
  generateJobFingerprint,
  parseExperienceYears,
  extractSkillsFromDescription,
} from "../lib/job-search-service.js";

const router = Router();

// =====================
// Job Screening Agents
// =====================

/**
 * Get all screening agents for the current user
 */
router.get("/agents", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    const agents = await db
      .select()
      .from(jobScreeningAgents)
      .where(eq(jobScreeningAgents.userId, userId))
      .orderBy(desc(jobScreeningAgents.createdAt));

    res.json({ success: true, agents });
  } catch (error) {
    console.error("[Job Screening] Error fetching agents:", error);
    res.status(500).json({ success: false, error: "Failed to fetch agents" });
  }
});

/**
 * Get a single screening agent by ID
 */
router.get("/agents/:agentId", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { agentId } = req.params;

    const [agent] = await db
      .select()
      .from(jobScreeningAgents)
      .where(
        and(
          eq(jobScreeningAgents.id, agentId),
          eq(jobScreeningAgents.userId, userId)
        )
      );

    if (!agent) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }

    res.json({ success: true, agent });
  } catch (error) {
    console.error("[Job Screening] Error fetching agent:", error);
    res.status(500).json({ success: false, error: "Failed to fetch agent" });
  }
});

/**
 * Create a new screening agent
 */
router.post("/agents", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const {
      name,
      description,
      searchKeywords,
      locations,
      experienceMin,
      experienceMax,
      companySizes,
      industries,
      jobTypes,
      excludedCompanies,
      runFrequency,
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: "Name is required" });
    }

    const [agent] = await db
      .insert(jobScreeningAgents)
      .values({
        userId,
        name,
        description,
        searchKeywords: searchKeywords || [],
        locations: locations || [],
        experienceMin: experienceMin || 0,
        experienceMax: experienceMax || 99,
        companySizes: companySizes || [],
        industries: industries || [],
        jobTypes: jobTypes || [],
        excludedCompanies: excludedCompanies || [],
        runFrequency: runFrequency || "manual",
        isActive: true,
      })
      .returning();

    res.json({ success: true, agent });
  } catch (error) {
    console.error("[Job Screening] Error creating agent:", error);
    res.status(500).json({ success: false, error: "Failed to create agent" });
  }
});

/**
 * Update a screening agent
 */
router.put("/agents/:agentId", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { agentId } = req.params;
    const updates = req.body;

    // Verify ownership
    const [existing] = await db
      .select()
      .from(jobScreeningAgents)
      .where(
        and(
          eq(jobScreeningAgents.id, agentId),
          eq(jobScreeningAgents.userId, userId)
        )
      );

    if (!existing) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }

    const [agent] = await db
      .update(jobScreeningAgents)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(jobScreeningAgents.id, agentId))
      .returning();

    res.json({ success: true, agent });
  } catch (error) {
    console.error("[Job Screening] Error updating agent:", error);
    res.status(500).json({ success: false, error: "Failed to update agent" });
  }
});

/**
 * Delete a screening agent
 */
router.delete("/agents/:agentId", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { agentId } = req.params;

    await db
      .delete(jobScreeningAgents)
      .where(
        and(
          eq(jobScreeningAgents.id, agentId),
          eq(jobScreeningAgents.userId, userId)
        )
      );

    res.json({ success: true });
  } catch (error) {
    console.error("[Job Screening] Error deleting agent:", error);
    res.status(500).json({ success: false, error: "Failed to delete agent" });
  }
});

/**
 * Run a screening agent to fetch new jobs
 */
router.post("/agents/:agentId/run", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { agentId } = req.params;

    // Get agent config
    const [agent] = await db
      .select()
      .from(jobScreeningAgents)
      .where(
        and(
          eq(jobScreeningAgents.id, agentId),
          eq(jobScreeningAgents.userId, userId)
        )
      );

    if (!agent) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }

    // Build search params from agent config
    const keywords = agent.searchKeywords || [];
    const locations = agent.locations || [];

    let totalNewJobs = 0;
    const allJobs: any[] = [];

    // Search for each keyword/location combination
    for (const keyword of keywords.length ? keywords : ['']) {
      for (const location of locations.length ? locations : ['']) {
        const searchResult = await jobSearchService.searchJobs({
          query: keyword || undefined,
          location: location || undefined,
          remote: agent.jobTypes?.includes('remote'),
          limit: 50,
        });

        if (searchResult.success) {
          for (const job of searchResult.jobs) {
            // Generate fingerprint for deduplication
            const fingerprint = generateJobFingerprint({
              roleTitle: job.title,
              companyName: job.company_name,
              location: job.location,
            });

            // Check if job already exists
            const [existing] = await db
              .select()
              .from(jobCatalog)
              .where(eq(jobCatalog.fingerprint, fingerprint));

            let catalogJobId: string;

            if (existing) {
              // Update last seen
              await db
                .update(jobCatalog)
                .set({ lastSeenAt: new Date(), updatedAt: new Date() })
                .where(eq(jobCatalog.id, existing.id));
              catalogJobId = existing.id;
            } else {
              // Parse experience years
              const expYears = parseExperienceYears(job.experience_level);

              // Check experience filter
              if (agent.experienceMin && expYears.max < agent.experienceMin) continue;
              if (agent.experienceMax && expYears.min > agent.experienceMax) continue;

              // Check excluded companies
              if (
                agent.excludedCompanies?.length &&
                job.company_name &&
                agent.excludedCompanies.some(
                  (exc) => job.company_name?.toLowerCase().includes(exc.toLowerCase())
                )
              ) {
                continue;
              }

              // Insert new job
              const [newJob] = await db
                .insert(jobCatalog)
                .values({
                  source: searchResult.source || "job_search",
                  externalId: job.id,
                  sourceUrl: job.url,
                  roleTitle: job.title,
                  companyName: job.company_name,
                  companyId: job.company_id,
                  companyLogoUrl: job.company_logo_url,
                  companySize: job.company_size,
                  companyIndustry: job.company_industry,
                  location: job.location,
                  city: job.city,
                  country: job.country,
                  isRemote: job.is_remote,
                  jobDescription: job.description,
                  experienceRequired: job.experience_level,
                  experienceYearsMin: expYears.min,
                  experienceYearsMax: expYears.max,
                  employmentType: job.employment_type,
                  salaryMin: job.salary_min,
                  salaryMax: job.salary_max,
                  salaryCurrency: job.salary_currency,
                  requiredSkills: job.skills || extractSkillsFromDescription(job.description),
                  postedAt: job.posted_at ? new Date(job.posted_at) : null,
                  expiresAt: job.expires_at ? new Date(job.expires_at) : null,
                  fingerprint,
                  isActive: true,
                })
                .returning();

              catalogJobId = newJob.id;
              totalNewJobs++;
              allJobs.push(newJob);
            }

            // Link job to agent if not already linked
            const [existingLink] = await db
              .select()
              .from(jobScreeningAgentResults)
              .where(
                and(
                  eq(jobScreeningAgentResults.agentId, agentId),
                  eq(jobScreeningAgentResults.jobCatalogId, catalogJobId)
                )
              );

            if (!existingLink) {
              await db.insert(jobScreeningAgentResults).values({
                agentId,
                jobCatalogId: catalogJobId,
              });
            }
          }
        }
      }
    }

    // Update agent stats
    await db
      .update(jobScreeningAgents)
      .set({
        lastRunAt: new Date(),
        jobsFoundLastRun: totalNewJobs,
        totalJobsFound: sql`${jobScreeningAgents.totalJobsFound} + ${totalNewJobs}`,
        updatedAt: new Date(),
      })
      .where(eq(jobScreeningAgents.id, agentId));

    res.json({
      success: true,
      newJobsFound: totalNewJobs,
      jobs: allJobs,
    });
  } catch (error) {
    console.error("[Job Screening] Error running agent:", error);
    res.status(500).json({ success: false, error: "Failed to run agent" });
  }
});

// =====================
// Job Catalog
// =====================

/**
 * Get job catalog with filters and pagination
 */
router.get("/catalog", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const {
      search,
      location,
      experienceMin,
      experienceMax,
      employmentType,
      remote,
      agentId,
      page = "1",
      limit = "20",
      sortBy = "discoveredAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions
    let conditions = [eq(jobCatalog.isActive, true)];

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(jobCatalog.roleTitle, searchTerm),
          ilike(jobCatalog.companyName, searchTerm),
          ilike(jobCatalog.location, searchTerm)
        )!
      );
    }

    if (location) {
      conditions.push(ilike(jobCatalog.location, `%${location}%`));
    }

    if (experienceMin) {
      conditions.push(
        sql`${jobCatalog.experienceYearsMax} >= ${parseInt(experienceMin as string)}`
      );
    }

    if (experienceMax) {
      conditions.push(
        sql`${jobCatalog.experienceYearsMin} <= ${parseInt(experienceMax as string)}`
      );
    }

    if (employmentType) {
      conditions.push(eq(jobCatalog.employmentType, employmentType as string));
    }

    if (remote === "true") {
      conditions.push(eq(jobCatalog.isRemote, true));
    }

    // If filtering by agent, join with results table
    let jobIds: string[] | null = null;
    if (agentId) {
      const agentJobs = await db
        .select({ jobCatalogId: jobScreeningAgentResults.jobCatalogId })
        .from(jobScreeningAgentResults)
        .where(eq(jobScreeningAgentResults.agentId, agentId as string));

      jobIds = agentJobs.map((j) => j.jobCatalogId);
      if (jobIds.length > 0) {
        conditions.push(inArray(jobCatalog.id, jobIds));
      } else {
        // No jobs found for this agent
        return res.json({
          success: true,
          jobs: [],
          pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
        });
      }
    }

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobCatalog)
      .where(and(...conditions));

    const total = Number(countResult?.count || 0);

    // Get jobs with user interactions
    const jobs = await db
      .select({
        job: jobCatalog,
        interaction: userJobCatalogInteractions,
      })
      .from(jobCatalog)
      .leftJoin(
        userJobCatalogInteractions,
        and(
          eq(userJobCatalogInteractions.jobCatalogId, jobCatalog.id),
          eq(userJobCatalogInteractions.userId, userId)
        )
      )
      .where(and(...conditions))
      .orderBy(sortOrder === "asc" ? sql`${jobCatalog.discoveredAt} ASC` : desc(jobCatalog.discoveredAt))
      .limit(limitNum)
      .offset(offset);

    const formattedJobs = jobs.map(({ job, interaction }) => ({
      ...job,
      userInteraction: interaction,
    }));

    res.json({
      success: true,
      jobs: formattedJobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("[Job Screening] Error fetching catalog:", error);
    res.status(500).json({ success: false, error: "Failed to fetch catalog" });
  }
});

/**
 * Get a single job from catalog
 */
router.get("/catalog/:jobId", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { jobId } = req.params;

    const [result] = await db
      .select({
        job: jobCatalog,
        interaction: userJobCatalogInteractions,
      })
      .from(jobCatalog)
      .leftJoin(
        userJobCatalogInteractions,
        and(
          eq(userJobCatalogInteractions.jobCatalogId, jobCatalog.id),
          eq(userJobCatalogInteractions.userId, userId)
        )
      )
      .where(eq(jobCatalog.id, jobId));

    if (!result) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    // Record view interaction
    if (result.interaction) {
      await db
        .update(userJobCatalogInteractions)
        .set({ viewedAt: new Date(), updatedAt: new Date() })
        .where(eq(userJobCatalogInteractions.id, result.interaction.id));
    } else {
      await db.insert(userJobCatalogInteractions).values({
        userId,
        jobCatalogId: jobId,
        viewedAt: new Date(),
      });
    }

    res.json({
      success: true,
      job: {
        ...result.job,
        userInteraction: result.interaction,
      },
    });
  } catch (error) {
    console.error("[Job Screening] Error fetching job:", error);
    res.status(500).json({ success: false, error: "Failed to fetch job" });
  }
});

// =====================
// User Interactions
// =====================

/**
 * Save a catalog job to user's job targets
 */
router.post("/catalog/:jobId/save-to-targets", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { jobId } = req.params;

    // Get the catalog job
    const [catalogJob] = await db
      .select()
      .from(jobCatalog)
      .where(eq(jobCatalog.id, jobId));

    if (!catalogJob) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    // Create job target
    const [jobTarget] = await db
      .insert(jobTargets)
      .values({
        userId,
        source: catalogJob.source as any,
        jobUrl: catalogJob.sourceUrl,
        companyName: catalogJob.companyName,
        roleTitle: catalogJob.roleTitle,
        location: catalogJob.location,
        jdText: catalogJob.jobDescription,
        jdParsed: catalogJob.jdParsed,
        status: "saved",
      })
      .returning();

    // Update interaction
    const [existingInteraction] = await db
      .select()
      .from(userJobCatalogInteractions)
      .where(
        and(
          eq(userJobCatalogInteractions.userId, userId),
          eq(userJobCatalogInteractions.jobCatalogId, jobId)
        )
      );

    if (existingInteraction) {
      await db
        .update(userJobCatalogInteractions)
        .set({
          isSaved: true,
          savedAt: new Date(),
          jobTargetId: jobTarget.id,
          updatedAt: new Date(),
        })
        .where(eq(userJobCatalogInteractions.id, existingInteraction.id));
    } else {
      await db.insert(userJobCatalogInteractions).values({
        userId,
        jobCatalogId: jobId,
        isSaved: true,
        savedAt: new Date(),
        jobTargetId: jobTarget.id,
      });
    }

    res.json({ success: true, jobTarget });
  } catch (error) {
    console.error("[Job Screening] Error saving job to targets:", error);
    res.status(500).json({ success: false, error: "Failed to save job" });
  }
});

/**
 * Hide a job from catalog
 */
router.post("/catalog/:jobId/hide", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { jobId } = req.params;

    const [existingInteraction] = await db
      .select()
      .from(userJobCatalogInteractions)
      .where(
        and(
          eq(userJobCatalogInteractions.userId, userId),
          eq(userJobCatalogInteractions.jobCatalogId, jobId)
        )
      );

    if (existingInteraction) {
      await db
        .update(userJobCatalogInteractions)
        .set({ isHidden: true, updatedAt: new Date() })
        .where(eq(userJobCatalogInteractions.id, existingInteraction.id));
    } else {
      await db.insert(userJobCatalogInteractions).values({
        userId,
        jobCatalogId: jobId,
        isHidden: true,
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[Job Screening] Error hiding job:", error);
    res.status(500).json({ success: false, error: "Failed to hide job" });
  }
});

/**
 * Unhide a job
 */
router.post("/catalog/:jobId/unhide", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { jobId } = req.params;

    await db
      .update(userJobCatalogInteractions)
      .set({ isHidden: false, updatedAt: new Date() })
      .where(
        and(
          eq(userJobCatalogInteractions.userId, userId),
          eq(userJobCatalogInteractions.jobCatalogId, jobId)
        )
      );

    res.json({ success: true });
  } catch (error) {
    console.error("[Job Screening] Error unhiding job:", error);
    res.status(500).json({ success: false, error: "Failed to unhide job" });
  }
});

/**
 * Quick search without saving - for testing/preview
 */
router.post("/search-preview", requireAuth, async (req, res) => {
  try {
    const { keywords, location, experienceLevel, employmentType, limit = 10 } = req.body;

    const searchResult = await jobSearchService.searchJobs({
      query: keywords,
      location,
      experienceLevel,
      employmentType,
      limit: Math.min(limit, 50),
    });

    res.json({
      success: true,
      jobs: searchResult.jobs,
      total: searchResult.total,
    });
  } catch (error) {
    console.error("[Job Screening] Error in search preview:", error);
    res.status(500).json({ success: false, error: "Search failed" });
  }
});

/**
 * Get catalog statistics
 */
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Get agent count
    const [agentCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobScreeningAgents)
      .where(eq(jobScreeningAgents.userId, userId));

    // Get total jobs in catalog
    const [catalogCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobCatalog)
      .where(eq(jobCatalog.isActive, true));

    // Get saved jobs count
    const [savedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userJobCatalogInteractions)
      .where(
        and(
          eq(userJobCatalogInteractions.userId, userId),
          eq(userJobCatalogInteractions.isSaved, true)
        )
      );

    // Get jobs found by user's agents
    const userAgents = await db
      .select({ id: jobScreeningAgents.id })
      .from(jobScreeningAgents)
      .where(eq(jobScreeningAgents.userId, userId));

    let agentJobsCount = 0;
    if (userAgents.length > 0) {
      const agentIds = userAgents.map((a) => a.id);
      const [agentJobsResult] = await db
        .select({ count: sql<number>`count(distinct ${jobScreeningAgentResults.jobCatalogId})` })
        .from(jobScreeningAgentResults)
        .where(inArray(jobScreeningAgentResults.agentId, agentIds));
      agentJobsCount = Number(agentJobsResult?.count || 0);
    }

    res.json({
      success: true,
      stats: {
        agentCount: Number(agentCount?.count || 0),
        totalCatalogJobs: Number(catalogCount?.count || 0),
        savedJobs: Number(savedCount?.count || 0),
        jobsFromAgents: agentJobsCount,
      },
    });
  } catch (error) {
    console.error("[Job Screening] Error fetching stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

// =====================
// Public Job Pages
// =====================

/**
 * Generate a URL-friendly slug from job details
 */
function generateSlug(roleTitle: string, companyName?: string | null): string {
  const parts = [roleTitle];
  if (companyName) parts.push(companyName);

  const baseSlug = parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);

  // Add a short random suffix to ensure uniqueness
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${suffix}`;
}

/**
 * Generate public pages from selected catalog jobs
 */
router.post("/public-pages/generate", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { jobIds } = req.body;

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({ success: false, error: "No jobs selected" });
    }

    // Fetch the catalog jobs
    const catalogJobs = await db
      .select()
      .from(jobCatalog)
      .where(inArray(jobCatalog.id, jobIds));

    if (catalogJobs.length === 0) {
      return res.status(404).json({ success: false, error: "No jobs found" });
    }

    const createdPages: any[] = [];

    for (const job of catalogJobs) {
      // Check if a public page already exists for this catalog job
      const [existingPage] = await db
        .select()
        .from(publicJobPages)
        .where(eq(publicJobPages.jobCatalogId, job.id));

      if (existingPage) {
        createdPages.push(existingPage);
        continue;
      }

      // Generate a unique slug
      const slug = generateSlug(job.roleTitle, job.companyName);

      // Create the public page
      const [newPage] = await db
        .insert(publicJobPages)
        .values({
          jobCatalogId: job.id,
          slug,
          roleTitle: job.roleTitle,
          companyName: job.companyName,
          companyLogoUrl: job.companyLogoUrl,
          companyIndustry: job.companyIndustry,
          location: job.location,
          isRemote: job.isRemote,
          jobDescription: job.jobDescription,
          experienceRequired: job.experienceRequired,
          employmentType: job.employmentType,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryCurrency: job.salaryCurrency,
          requiredSkills: job.requiredSkills,
          isPublished: true,
          publishedAt: new Date(),
          createdBy: userId,
        })
        .returning();

      createdPages.push(newPage);
    }

    res.json({
      success: true,
      pages: createdPages,
      message: `Created ${createdPages.length} public job pages`,
    });
  } catch (error) {
    console.error("[Job Screening] Error generating public pages:", error);
    res.status(500).json({ success: false, error: "Failed to generate public pages" });
  }
});

/**
 * Get all public job pages (admin view)
 */
router.get("/public-pages", requireAuth, async (req, res) => {
  try {
    const { page = "1", limit = "20", search } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    let conditions = [];

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(publicJobPages.roleTitle, searchTerm),
          ilike(publicJobPages.companyName, searchTerm)
        )!
      );
    }

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(publicJobPages)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult?.count || 0);

    // Get pages
    const pages = await db
      .select()
      .from(publicJobPages)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(publicJobPages.createdAt))
      .limit(limitNum)
      .offset(offset);

    res.json({
      success: true,
      pages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("[Job Screening] Error fetching public pages:", error);
    res.status(500).json({ success: false, error: "Failed to fetch public pages" });
  }
});

/**
 * Get a single public job page by slug (public endpoint)
 */
router.get("/public-pages/by-slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const [page] = await db
      .select()
      .from(publicJobPages)
      .where(and(eq(publicJobPages.slug, slug), eq(publicJobPages.isPublished, true)));

    if (!page) {
      return res.status(404).json({ success: false, error: "Page not found" });
    }

    // Increment view count
    await db
      .update(publicJobPages)
      .set({ viewCount: sql`${publicJobPages.viewCount} + 1` })
      .where(eq(publicJobPages.id, page.id));

    // Record analytics
    const userAgent = req.headers["user-agent"] || "";
    const referrer = req.headers["referer"] || "";

    await db.insert(publicJobPageAnalytics).values({
      jobPageId: page.id,
      eventType: "view",
      userAgent,
      referrer,
    });

    res.json({ success: true, page });
  } catch (error) {
    console.error("[Job Screening] Error fetching public page:", error);
    res.status(500).json({ success: false, error: "Failed to fetch page" });
  }
});

/**
 * Record a practice click event for analytics
 */
router.post("/public-pages/:pageId/practice-click", async (req, res) => {
  try {
    const { pageId } = req.params;

    // Increment click count
    await db
      .update(publicJobPages)
      .set({ practiceClickCount: sql`${publicJobPages.practiceClickCount} + 1` })
      .where(eq(publicJobPages.id, pageId));

    // Record analytics
    const userAgent = req.headers["user-agent"] || "";
    const referrer = req.headers["referer"] || "";

    await db.insert(publicJobPageAnalytics).values({
      jobPageId: pageId,
      eventType: "practice_click",
      userAgent,
      referrer,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("[Job Screening] Error recording practice click:", error);
    res.status(500).json({ success: false, error: "Failed to record click" });
  }
});

/**
 * Update a public job page
 */
router.put("/public-pages/:pageId", requireAuth, async (req, res) => {
  try {
    const { pageId } = req.params;
    const updates = req.body;

    const [page] = await db
      .update(publicJobPages)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(publicJobPages.id, pageId))
      .returning();

    if (!page) {
      return res.status(404).json({ success: false, error: "Page not found" });
    }

    res.json({ success: true, page });
  } catch (error) {
    console.error("[Job Screening] Error updating public page:", error);
    res.status(500).json({ success: false, error: "Failed to update page" });
  }
});

/**
 * Delete a public job page
 */
router.delete("/public-pages/:pageId", requireAuth, async (req, res) => {
  try {
    const { pageId } = req.params;

    await db.delete(publicJobPages).where(eq(publicJobPages.id, pageId));

    res.json({ success: true });
  } catch (error) {
    console.error("[Job Screening] Error deleting public page:", error);
    res.status(500).json({ success: false, error: "Failed to delete page" });
  }
});

/**
 * Toggle publish status of a public job page
 */
router.post("/public-pages/:pageId/toggle-publish", requireAuth, async (req, res) => {
  try {
    const { pageId } = req.params;

    const [existing] = await db
      .select()
      .from(publicJobPages)
      .where(eq(publicJobPages.id, pageId));

    if (!existing) {
      return res.status(404).json({ success: false, error: "Page not found" });
    }

    const [page] = await db
      .update(publicJobPages)
      .set({
        isPublished: !existing.isPublished,
        publishedAt: !existing.isPublished ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(publicJobPages.id, pageId))
      .returning();

    res.json({ success: true, page });
  } catch (error) {
    console.error("[Job Screening] Error toggling publish status:", error);
    res.status(500).json({ success: false, error: "Failed to toggle publish status" });
  }
});

export { router as jobScreeningRouter };
