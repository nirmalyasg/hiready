import { Router, Request, Response } from "express";
import { db } from "../db.js";
import { 
  seoPages, 
  seoPageSections, 
  seoInternalLinks, 
  seoGenerationQueue,
  seoAnalyticsEvents,
  roleArchetypes,
  companies
} from "../../shared/schema.js";
import { eq, desc, and, sql, inArray, isNull, or, gte, lte, SQL } from "drizzle-orm";
import {
  generatePillarPage,
  generateRolePrepPage,
  generateCompanyPrepPage,
  generateCompanyRolePage,
  generateSkillPracticePage,
  saveSeoPage
} from "../lib/seo-content-generator.js";

const router = Router();

router.get("/pages", async (req: Request, res: Response) => {
  try {
    const { status, pageType, limit = "50", offset = "0" } = req.query;
    
    const conditions: SQL[] = [];
    if (status && typeof status === "string") {
      conditions.push(eq(seoPages.status, status as "draft" | "published" | "archived"));
    }
    if (pageType && typeof pageType === "string") {
      conditions.push(eq(seoPages.pageType, pageType as any));
    }

    const pages = await db.select({
      id: seoPages.id,
      pageType: seoPages.pageType,
      slug: seoPages.slug,
      title: seoPages.title,
      h1: seoPages.h1,
      status: seoPages.status,
      lastGeneratedAt: seoPages.lastGeneratedAt,
      publishedAt: seoPages.publishedAt,
      viewCount: seoPages.viewCount,
      practiceStarts: seoPages.practiceStarts,
      createdAt: seoPages.createdAt
    })
      .from(seoPages)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(seoPages.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(seoPages)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json({ pages, total: count });
  } catch (error) {
    console.error("Error fetching SEO pages:", error);
    res.status(500).json({ error: "Failed to fetch SEO pages" });
  }
});

router.get("/pages/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const [page] = await db.select().from(seoPages).where(eq(seoPages.id, id));
    if (!page) {
      return res.status(404).json({ error: "Page not found" });
    }

    const sections = await db.select()
      .from(seoPageSections)
      .where(eq(seoPageSections.seoPageId, id))
      .orderBy(seoPageSections.sectionOrder);

    const outgoingLinks = await db.select({
      id: seoInternalLinks.id,
      targetSlug: seoPages.slug,
      targetTitle: seoPages.title,
      anchorText: seoInternalLinks.anchorText,
      linkType: seoInternalLinks.linkType
    })
      .from(seoInternalLinks)
      .innerJoin(seoPages, eq(seoInternalLinks.targetPageId, seoPages.id))
      .where(eq(seoInternalLinks.sourcePageId, id));

    res.json({ page, sections, outgoingLinks });
  } catch (error) {
    console.error("Error fetching SEO page:", error);
    res.status(500).json({ error: "Failed to fetch SEO page" });
  }
});

router.get("/page-by-slug/:slug(*)", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    const [page] = await db.select().from(seoPages)
      .where(and(eq(seoPages.slug, slug), eq(seoPages.status, "published")));
    
    if (!page) {
      return res.status(404).json({ error: "Page not found" });
    }

    const sections = await db.select()
      .from(seoPageSections)
      .where(eq(seoPageSections.seoPageId, page.id))
      .orderBy(seoPageSections.sectionOrder);

    const relatedLinks = await db.select({
      slug: seoPages.slug,
      title: seoPages.title,
      anchorText: seoInternalLinks.anchorText,
      linkType: seoInternalLinks.linkType
    })
      .from(seoInternalLinks)
      .innerJoin(seoPages, eq(seoInternalLinks.targetPageId, seoPages.id))
      .where(eq(seoInternalLinks.sourcePageId, page.id));

    await db.update(seoPages)
      .set({ viewCount: (page.viewCount || 0) + 1 })
      .where(eq(seoPages.id, page.id));

    res.json({ page, sections, relatedLinks });
  } catch (error) {
    console.error("Error fetching SEO page by slug:", error);
    res.status(500).json({ error: "Failed to fetch SEO page" });
  }
});

router.post("/generate/pillar/:type", async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    
    if (type !== "mock-interview" && type !== "interview-preparation") {
      return res.status(400).json({ error: "Invalid pillar page type" });
    }

    const generatedPage = await generatePillarPage(type);
    const pageId = await saveSeoPage(generatedPage);

    res.json({ 
      success: true, 
      pageId, 
      slug: generatedPage.slug,
      message: `Generated pillar page: ${generatedPage.title}`
    });
  } catch (error) {
    console.error("Error generating pillar page:", error);
    res.status(500).json({ error: "Failed to generate pillar page" });
  }
});

router.post("/generate/role/:roleArchetypeId", async (req: Request, res: Response) => {
  try {
    const { roleArchetypeId } = req.params;
    
    const generatedPage = await generateRolePrepPage(roleArchetypeId);
    if (!generatedPage) {
      return res.status(404).json({ error: "Role archetype not found" });
    }

    const pageId = await saveSeoPage(generatedPage, roleArchetypeId);

    res.json({ 
      success: true, 
      pageId, 
      slug: generatedPage.slug,
      message: `Generated role prep page: ${generatedPage.title}`
    });
  } catch (error) {
    console.error("Error generating role prep page:", error);
    res.status(500).json({ error: "Failed to generate role prep page" });
  }
});

router.post("/generate/company/:companyId", async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    
    const generatedPage = await generateCompanyPrepPage(companyId);
    if (!generatedPage) {
      return res.status(404).json({ error: "Company not found" });
    }

    const pageId = await saveSeoPage(generatedPage, undefined, companyId);

    res.json({ 
      success: true, 
      pageId, 
      slug: generatedPage.slug,
      message: `Generated company prep page: ${generatedPage.title}`
    });
  } catch (error) {
    console.error("Error generating company prep page:", error);
    res.status(500).json({ error: "Failed to generate company prep page" });
  }
});

router.post("/generate/company-role", async (req: Request, res: Response) => {
  try {
    const { companyId, roleArchetypeId } = req.body;
    
    if (!companyId || !roleArchetypeId) {
      return res.status(400).json({ error: "companyId and roleArchetypeId are required" });
    }

    const generatedPage = await generateCompanyRolePage(companyId, roleArchetypeId);
    if (!generatedPage) {
      return res.status(404).json({ error: "Company or role archetype not found" });
    }

    const pageId = await saveSeoPage(generatedPage, roleArchetypeId, companyId);

    res.json({ 
      success: true, 
      pageId, 
      slug: generatedPage.slug,
      message: `Generated company+role page: ${generatedPage.title}`
    });
  } catch (error) {
    console.error("Error generating company+role page:", error);
    res.status(500).json({ error: "Failed to generate company+role page" });
  }
});

router.post("/generate/skill/:skillType", async (req: Request, res: Response) => {
  try {
    const { skillType } = req.params;
    
    const generatedPage = await generateSkillPracticePage(skillType);
    if (!generatedPage) {
      return res.status(400).json({ error: "Invalid skill type" });
    }

    const pageId = await saveSeoPage(generatedPage);

    res.json({ 
      success: true, 
      pageId, 
      slug: generatedPage.slug,
      message: `Generated skill practice page: ${generatedPage.title}`
    });
  } catch (error) {
    console.error("Error generating skill practice page:", error);
    res.status(500).json({ error: "Failed to generate skill practice page" });
  }
});

router.post("/generate/batch", async (req: Request, res: Response) => {
  try {
    const { pageType, limit = 5 } = req.body;
    const results: { success: boolean; slug?: string; error?: string }[] = [];

    if (pageType === "pillar") {
      for (const type of ["mock-interview", "interview-preparation"] as const) {
        try {
          const page = await generatePillarPage(type);
          await saveSeoPage(page);
          results.push({ success: true, slug: page.slug });
        } catch (error: any) {
          results.push({ success: false, error: error.message });
        }
      }
    } else if (pageType === "role_prep") {
      const archetypes = await db.select().from(roleArchetypes).limit(limit);
      for (const archetype of archetypes) {
        try {
          const page = await generateRolePrepPage(archetype.id);
          if (page) {
            await saveSeoPage(page, archetype.id);
            results.push({ success: true, slug: page.slug });
          }
        } catch (error: any) {
          results.push({ success: false, error: error.message });
        }
      }
    } else if (pageType === "company_prep") {
      const companiesList = await db.select().from(companies)
        .where(eq(companies.tier, "top50"))
        .limit(limit);
      for (const company of companiesList) {
        try {
          const page = await generateCompanyPrepPage(company.id);
          if (page) {
            await saveSeoPage(page, undefined, company.id);
            results.push({ success: true, slug: page.slug });
          }
        } catch (error: any) {
          results.push({ success: false, error: error.message });
        }
      }
    } else if (pageType === "skill_practice") {
      const skillTypes = [
        "behavioral-interview",
        "technical-interview", 
        "case-interview",
        "sql-interview",
        "coding-interview",
        "system-design",
        "product-sense",
        "hiring-manager"
      ];
      for (const skillType of skillTypes.slice(0, limit)) {
        try {
          const page = await generateSkillPracticePage(skillType);
          if (page) {
            await saveSeoPage(page);
            results.push({ success: true, slug: page.slug });
          }
        } catch (error: any) {
          results.push({ success: false, error: error.message });
        }
      }
    }

    res.json({ 
      results,
      summary: {
        total: results.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    console.error("Error in batch generation:", error);
    res.status(500).json({ error: "Failed to run batch generation" });
  }
});

router.patch("/pages/:id/publish", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const [updated] = await db.update(seoPages)
      .set({ 
        status: "published", 
        publishedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(seoPages.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Page not found" });
    }

    res.json({ success: true, page: updated });
  } catch (error) {
    console.error("Error publishing page:", error);
    res.status(500).json({ error: "Failed to publish page" });
  }
});

router.patch("/pages/:id/unpublish", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const [updated] = await db.update(seoPages)
      .set({ 
        status: "draft",
        updatedAt: new Date()
      })
      .where(eq(seoPages.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Page not found" });
    }

    res.json({ success: true, page: updated });
  } catch (error) {
    console.error("Error unpublishing page:", error);
    res.status(500).json({ error: "Failed to unpublish page" });
  }
});

router.delete("/pages/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await db.delete(seoPages).where(eq(seoPages.id, id));
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting page:", error);
    res.status(500).json({ error: "Failed to delete page" });
  }
});

router.post("/analytics/event", async (req: Request, res: Response) => {
  try {
    const { seoPageId, eventType, eventData, sessionId, referrer, userAgent } = req.body;
    
    await db.insert(seoAnalyticsEvents).values({
      seoPageId,
      eventType,
      eventData,
      sessionId,
      referrer,
      userAgent
    });

    if (eventType === "practice_start" && seoPageId) {
      await db.update(seoPages)
        .set({ practiceStarts: sql`practice_starts + 1` })
        .where(eq(seoPages.id, seoPageId));
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error tracking analytics event:", error);
    res.status(500).json({ error: "Failed to track event" });
  }
});

router.get("/analytics/summary", async (req: Request, res: Response) => {
  try {
    const [totalPages] = await db.select({ count: sql<number>`count(*)` }).from(seoPages);
    const [publishedPages] = await db.select({ count: sql<number>`count(*)` })
      .from(seoPages)
      .where(eq(seoPages.status, "published"));
    
    const [totalViews] = await db.select({ sum: sql<number>`coalesce(sum(view_count), 0)` })
      .from(seoPages);
    
    const [totalPracticeStarts] = await db.select({ sum: sql<number>`coalesce(sum(practice_starts), 0)` })
      .from(seoPages);

    const pagesByType = await db.select({
      pageType: seoPages.pageType,
      count: sql<number>`count(*)`
    })
      .from(seoPages)
      .groupBy(seoPages.pageType);

    const topPages = await db.select({
      id: seoPages.id,
      slug: seoPages.slug,
      title: seoPages.title,
      viewCount: seoPages.viewCount,
      practiceStarts: seoPages.practiceStarts
    })
      .from(seoPages)
      .where(eq(seoPages.status, "published"))
      .orderBy(desc(seoPages.viewCount))
      .limit(10);

    res.json({
      totalPages: totalPages.count,
      publishedPages: publishedPages.count,
      totalViews: totalViews.sum,
      totalPracticeStarts: totalPracticeStarts.sum,
      pagesByType,
      topPages
    });
  } catch (error) {
    console.error("Error fetching analytics summary:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

router.get("/data/roles", async (req: Request, res: Response) => {
  try {
    const roles = await db.select({
      id: roleArchetypes.id,
      name: roleArchetypes.name,
      category: roleArchetypes.roleCategory
    }).from(roleArchetypes);
    
    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

router.get("/data/companies", async (req: Request, res: Response) => {
  try {
    const { tier } = req.query;
    
    const conditions = tier ? eq(companies.tier, tier as any) : undefined;
    
    const companiesList = await db.select({
      id: companies.id,
      name: companies.name,
      sector: companies.sector,
      tier: companies.tier
    })
      .from(companies)
      .where(conditions)
      .orderBy(companies.name);
    
    res.json(companiesList);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});

router.get("/sitemap.xml", async (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.APP_URL || "https://hiready.com";
    
    const publishedPages = await db.select({
      slug: seoPages.slug,
      updatedAt: seoPages.updatedAt,
      pageType: seoPages.pageType
    })
      .from(seoPages)
      .where(eq(seoPages.status, "published"));

    const priorityMap: Record<string, string> = {
      pillar: "1.0",
      company_role: "0.9",
      role_prep: "0.8",
      company_prep: "0.8",
      skill_practice: "0.7"
    };

    const urls = publishedPages.map(page => {
      const priority = priorityMap[page.pageType] || "0.5";
      const lastmod = page.updatedAt?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0];
      return `  <url>
    <loc>${baseUrl}/${page.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`;
    });

    const staticPages = [
      { loc: "/", priority: "1.0" },
      { loc: "/interview", priority: "0.9" },
      { loc: "/practice", priority: "0.9" },
      { loc: "/features", priority: "0.7" },
      { loc: "/pricing", priority: "0.7" }
    ];

    const staticUrls = staticPages.map(page => {
      return `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.join("\n")}
${urls.join("\n")}
</urlset>`;

    res.set("Content-Type", "application/xml");
    res.send(sitemap);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    res.status(500).json({ error: "Failed to generate sitemap" });
  }
});

export default router;
