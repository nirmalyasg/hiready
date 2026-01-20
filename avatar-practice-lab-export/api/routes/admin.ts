import { Router } from "express";
import { db } from "../db.js";
import { 
  authUsers, 
  users, 
  userRoles, 
  userLoginEvents, 
  apiUsageEvents, 
  adminSettings, 
  userMediaPreferences,
  apiCostDailyRollup,
  roleplaySession,
  aiSessionAnalysis,
  transcripts,
  skills,
  scenarios,
  heygenSessions,
  sessionJourneyEvents,
  budgetGuards,
  budgetAlerts,
  customScenarios,
  employerCompanies,
  employerJobs,
  companyShareLinks,
  interviewSets
} from "../../shared/schema.js";
import { eq, desc, sql, and, gte, lte, count, sum, avg } from "drizzle-orm";
import { requireAdmin, populateUserRole } from "../middleware/auth.js";
import { buildEmployerInterviewPlan } from "../lib/archetype-resolver.js";

export const adminRouter = Router();

adminRouter.use(async (req, res, next) => {
  const sessionUser = (req.session as any)?.user;
  if (sessionUser) {
    req.user = sessionUser;
  }
  next();
});

adminRouter.get("/analytics/summary", requireAdmin, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsersResult,
      activeUsersLast30Days,
      activeUsersLast7Days,
      totalSessionsResult,
      sessionsLast30Days,
      avgSessionDuration,
      totalLoginEvents
    ] = await Promise.all([
      db.select({ count: count() }).from(authUsers),
      db.select({ count: sql<number>`COUNT(DISTINCT ${roleplaySession.userId})` })
        .from(roleplaySession)
        .where(gte(roleplaySession.createdAt, thirtyDaysAgo)),
      db.select({ count: sql<number>`COUNT(DISTINCT ${roleplaySession.userId})` })
        .from(roleplaySession)
        .where(gte(roleplaySession.createdAt, sevenDaysAgo)),
      db.select({ count: count() }).from(roleplaySession),
      db.select({ count: count() })
        .from(roleplaySession)
        .where(gte(roleplaySession.createdAt, thirtyDaysAgo)),
      db.select({ avg: avg(roleplaySession.duration) })
        .from(roleplaySession)
        .where(sql`${roleplaySession.duration} IS NOT NULL`),
      db.select({ count: count() })
        .from(userLoginEvents)
        .where(and(
          eq(userLoginEvents.eventType, "login"),
          gte(userLoginEvents.occurredAt, thirtyDaysAgo)
        ))
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: totalUsersResult[0]?.count || 0,
        activeUsersLast30Days: activeUsersLast30Days[0]?.count || 0,
        activeUsersLast7Days: activeUsersLast7Days[0]?.count || 0,
        totalSessions: totalSessionsResult[0]?.count || 0,
        sessionsLast30Days: sessionsLast30Days[0]?.count || 0,
        avgSessionDuration: Math.round(Number(avgSessionDuration[0]?.avg) || 0),
        loginEventsLast30Days: totalLoginEvents[0]?.count || 0,
      }
    });
  } catch (error) {
    console.error("Error fetching analytics summary:", error);
    res.status(500).json({ success: false, error: "Failed to fetch analytics" });
  }
});

adminRouter.get("/analytics/users", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const usersWithStats = await db.execute(sql`
      SELECT 
        au.id,
        au.username,
        au.email,
        au.first_name,
        au.last_name,
        au.created_at,
        COALESCE(ur.role, 'learner') as role,
        COUNT(DISTINCT rs.id) as total_sessions,
        COALESCE(SUM(rs.duration), 0) as total_duration,
        MAX(rs.created_at) as last_session,
        COALESCE(AVG(asa.overall_score), 0) as avg_score,
        (SELECT COUNT(*) FROM user_login_events ule WHERE ule.auth_user_id = au.id AND ule.event_type = 'login') as login_count,
        (SELECT MAX(occurred_at) FROM user_login_events ule WHERE ule.auth_user_id = au.id AND ule.event_type = 'login') as last_login
      FROM auth_users au
      LEFT JOIN users u ON u.auth_user_id = au.id
      LEFT JOIN user_roles ur ON ur.auth_user_id = au.id
      LEFT JOIN roleplay_session rs ON rs.user_id = u.id
      LEFT JOIN ai_session_analysis asa ON asa.session_id = rs.id
      GROUP BY au.id, au.username, au.email, au.first_name, au.last_name, au.created_at, ur.role
      ORDER BY au.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const totalCountResult = await db.select({ count: count() }).from(authUsers);

    res.json({
      success: true,
      data: {
        users: usersWithStats.rows,
        pagination: {
          page,
          limit,
          total: totalCountResult[0]?.count || 0,
          totalPages: Math.ceil((totalCountResult[0]?.count || 0) / limit)
        }
      }
    });
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    res.status(500).json({ success: false, error: "Failed to fetch user analytics" });
  }
});

adminRouter.get("/analytics/user/:userId", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const userDetails = await db.execute(sql`
      SELECT 
        au.id,
        au.username,
        au.email,
        au.first_name,
        au.last_name,
        au.created_at,
        au.profile_image_url,
        COALESCE(ur.role, 'learner') as role,
        ump.media_mode
      FROM auth_users au
      LEFT JOIN user_roles ur ON ur.auth_user_id = au.id
      LEFT JOIN user_media_preferences ump ON ump.auth_user_id = au.id
      WHERE au.id = ${userId}
    `);

    if (userDetails.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const sessions = await db.execute(sql`
      SELECT 
        rs.id,
        rs.start_time,
        rs.end_time,
        rs.duration,
        COALESCE(t.skill, sk.name) as skill,
        COALESCE(t.scenario, sc.name, cs.title) as scenario,
        asa.overall_score,
        a.name as avatar_name
      FROM roleplay_session rs
      JOIN users u ON u.id = rs.user_id
      LEFT JOIN transcripts t ON t.session_id = rs.id
      LEFT JOIN skills sk ON sk.id = t.skill_id
      LEFT JOIN scenarios sc ON sc.id = t.scenario_id
      LEFT JOIN custom_scenarios cs ON cs.id = t.custom_scenario_id
      LEFT JOIN ai_session_analysis asa ON asa.session_id = rs.id
      LEFT JOIN avatars a ON a.id = rs.avatar_id
      WHERE u.auth_user_id = ${userId}
      ORDER BY rs.start_time DESC
      LIMIT 50
    `);

    const loginEvents = await db.select()
      .from(userLoginEvents)
      .where(eq(userLoginEvents.authUserId, userId))
      .orderBy(desc(userLoginEvents.occurredAt))
      .limit(20);

    res.json({
      success: true,
      data: {
        user: userDetails.rows[0],
        sessions: sessions.rows,
        loginEvents
      }
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ success: false, error: "Failed to fetch user details" });
  }
});

adminRouter.get("/analytics/sessions", requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailySessions = await db.execute(sql`
      SELECT 
        DATE(start_time) as date,
        COUNT(*) as session_count,
        COUNT(DISTINCT user_id) as unique_users,
        COALESCE(AVG(duration), 0) as avg_duration
      FROM roleplay_session
      WHERE start_time >= ${startDate}
      GROUP BY DATE(start_time)
      ORDER BY date DESC
    `);

    res.json({
      success: true,
      data: dailySessions.rows
    });
  } catch (error) {
    console.error("Error fetching session analytics:", error);
    res.status(500).json({ success: false, error: "Failed to fetch session analytics" });
  }
});

adminRouter.get("/analytics/user-breakdown", requireAdmin, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userBreakdown = await db.execute(sql`
      SELECT 
        au.id,
        au.username,
        au.first_name,
        au.last_name,
        COUNT(DISTINCT rs.id) as total_sessions,
        COALESCE(SUM(rs.duration), 0) as total_duration,
        COALESCE(AVG(rs.duration), 0) as avg_session_duration,
        COALESCE(AVG(asa.overall_score), 0) as avg_score,
        MIN(rs.start_time) as first_session,
        MAX(rs.start_time) as last_session,
        COUNT(DISTINCT DATE(rs.start_time)) as active_days,
        COUNT(DISTINCT COALESCE(t.skill, sk.name)) as skills_practiced,
        (SELECT COUNT(*) FROM user_login_events ule WHERE ule.auth_user_id = au.id AND ule.event_type = 'login') as login_count
      FROM auth_users au
      LEFT JOIN users u ON u.auth_user_id = au.id
      LEFT JOIN roleplay_session rs ON rs.user_id = u.id
      LEFT JOIN ai_session_analysis asa ON asa.session_id = rs.id
      LEFT JOIN transcripts t ON t.session_id = rs.id
      LEFT JOIN skills sk ON sk.id = t.skill_id
      GROUP BY au.id, au.username, au.first_name, au.last_name
      HAVING COUNT(rs.id) > 0
      ORDER BY total_sessions DESC
    `);

    const topPerformers = await db.execute(sql`
      SELECT 
        au.username,
        au.first_name,
        au.last_name,
        ROUND(AVG(asa.overall_score)::numeric, 1) as avg_score,
        COUNT(DISTINCT rs.id) as session_count
      FROM auth_users au
      JOIN users u ON u.auth_user_id = au.id
      JOIN roleplay_session rs ON rs.user_id = u.id
      JOIN ai_session_analysis asa ON asa.session_id = rs.id
      WHERE asa.overall_score IS NOT NULL
      GROUP BY au.id, au.username, au.first_name, au.last_name
      HAVING COUNT(DISTINCT rs.id) >= 2
      ORDER BY AVG(asa.overall_score) DESC
      LIMIT 10
    `);

    const userSkillMatrix = await db.execute(sql`
      SELECT 
        au.username,
        COALESCE(t.skill, sk.name, 'Custom/Impromptu') as skill_name,
        COUNT(DISTINCT rs.id) as session_count,
        ROUND(AVG(asa.overall_score)::numeric, 1) as avg_score
      FROM auth_users au
      JOIN users u ON u.auth_user_id = au.id
      JOIN roleplay_session rs ON rs.user_id = u.id
      LEFT JOIN transcripts t ON t.session_id = rs.id
      LEFT JOIN skills sk ON sk.id = t.skill_id
      LEFT JOIN ai_session_analysis asa ON asa.session_id = rs.id
      GROUP BY au.username, COALESCE(t.skill, sk.name, 'Custom/Impromptu')
      HAVING COUNT(DISTINCT rs.id) > 0
      ORDER BY au.username, session_count DESC
    `);

    const engagementMetrics = await db.execute(sql`
      SELECT 
        engagement_tier,
        COUNT(*) as user_count
      FROM (
        SELECT 
          u.id,
          CASE 
            WHEN COUNT(rs.id) = 1 THEN '1 session'
            WHEN COUNT(rs.id) BETWEEN 2 AND 5 THEN '2-5 sessions'
            WHEN COUNT(rs.id) BETWEEN 6 AND 10 THEN '6-10 sessions'
            WHEN COUNT(rs.id) > 10 THEN '10+ sessions'
          END as engagement_tier,
          CASE 
            WHEN COUNT(rs.id) = 1 THEN 1
            WHEN COUNT(rs.id) BETWEEN 2 AND 5 THEN 2
            WHEN COUNT(rs.id) BETWEEN 6 AND 10 THEN 3
            WHEN COUNT(rs.id) > 10 THEN 4
          END as sort_order
        FROM users u
        LEFT JOIN roleplay_session rs ON rs.user_id = u.id
        GROUP BY u.id
        HAVING COUNT(rs.id) > 0
      ) user_sessions
      GROUP BY engagement_tier, sort_order
      ORDER BY sort_order
    `);

    res.json({
      success: true,
      data: {
        userBreakdown: userBreakdown.rows,
        topPerformers: topPerformers.rows,
        userSkillMatrix: userSkillMatrix.rows,
        engagementMetrics: engagementMetrics.rows
      }
    });
  } catch (error) {
    console.error("Error fetching user breakdown:", error);
    res.status(500).json({ success: false, error: "Failed to fetch user breakdown" });
  }
});

adminRouter.get("/config/settings", requireAdmin, async (req, res) => {
  try {
    const settings = await db.select().from(adminSettings);
    
    const settingsMap: Record<string, any> = {};
    settings.forEach(s => {
      settingsMap[s.key] = {
        value: s.value,
        category: s.category,
        description: s.description,
        updatedAt: s.updatedAt
      };
    });

    res.json({ success: true, data: settingsMap });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ success: false, error: "Failed to fetch settings" });
  }
});

adminRouter.put("/config/settings/:key", requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description, category } = req.body;

    await db.insert(adminSettings)
      .values({
        key,
        value,
        description,
        category: category || "general",
        updatedBy: req.user!.id,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: adminSettings.key,
        set: {
          value,
          description: description || undefined,
          category: category || undefined,
          updatedBy: req.user!.id,
          updatedAt: new Date()
        }
      });

    res.json({ success: true, message: "Setting updated" });
  } catch (error) {
    console.error("Error updating setting:", error);
    res.status(500).json({ success: false, error: "Failed to update setting" });
  }
});

adminRouter.get("/config/media-preferences", requireAdmin, async (req, res) => {
  try {
    const preferences = await db.execute(sql`
      SELECT 
        ump.*,
        au.username,
        au.email
      FROM user_media_preferences ump
      JOIN auth_users au ON au.id = ump.auth_user_id
      ORDER BY ump.updated_at DESC
    `);

    const defaultMode = await db.select()
      .from(adminSettings)
      .where(eq(adminSettings.key, "default_media_mode"));

    res.json({
      success: true,
      data: {
        defaultMode: defaultMode[0]?.value || "both",
        userPreferences: preferences.rows
      }
    });
  } catch (error) {
    console.error("Error fetching media preferences:", error);
    res.status(500).json({ success: false, error: "Failed to fetch media preferences" });
  }
});

adminRouter.put("/config/media-preferences/:userId", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { mediaMode } = req.body;

    if (!["voice", "video", "both"].includes(mediaMode)) {
      return res.status(400).json({ success: false, error: "Invalid media mode" });
    }

    await db.insert(userMediaPreferences)
      .values({
        authUserId: userId,
        mediaMode,
        updatedBy: req.user!.id,
        effectiveFrom: new Date()
      })
      .onConflictDoUpdate({
        target: userMediaPreferences.authUserId,
        set: {
          mediaMode,
          updatedBy: req.user!.id,
          updatedAt: new Date()
        }
      });

    res.json({ success: true, message: "Media preference updated" });
  } catch (error) {
    console.error("Error updating media preference:", error);
    res.status(500).json({ success: false, error: "Failed to update media preference" });
  }
});

adminRouter.get("/config/skills", requireAdmin, async (req, res) => {
  try {
    const allSkills = await db.select().from(skills).orderBy(skills.name);
    res.json({ success: true, data: allSkills });
  } catch (error) {
    console.error("Error fetching skills:", error);
    res.status(500).json({ success: false, error: "Failed to fetch skills" });
  }
});

adminRouter.post("/config/skills", requireAdmin, async (req, res) => {
  try {
    const { name, description, definition, level, category } = req.body;

    if (!name || !description || !definition) {
      return res.status(400).json({ success: false, error: "Name, description, and definition are required" });
    }

    const [newSkill] = await db.insert(skills)
      .values({
        name,
        description,
        definition,
        level: level || 1,
        category: category || "General"
      })
      .returning();

    res.json({ success: true, data: newSkill });
  } catch (error) {
    console.error("Error creating skill:", error);
    res.status(500).json({ success: false, error: "Failed to create skill" });
  }
});

adminRouter.put("/config/skills/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, definition, level, category, isActive } = req.body;

    const [updated] = await db.update(skills)
      .set({
        name,
        description,
        definition,
        level,
        category,
        isActive,
        updatedAt: new Date()
      })
      .where(eq(skills.id, parseInt(id)))
      .returning();

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating skill:", error);
    res.status(500).json({ success: false, error: "Failed to update skill" });
  }
});

adminRouter.delete("/config/skills/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.update(skills)
      .set({ isActive: false })
      .where(eq(skills.id, parseInt(id)));

    res.json({ success: true, message: "Skill deactivated" });
  } catch (error) {
    console.error("Error deleting skill:", error);
    res.status(500).json({ success: false, error: "Failed to delete skill" });
  }
});

adminRouter.get("/config/scenarios", requireAdmin, async (req, res) => {
  try {
    const allScenarios = await db.select().from(scenarios).orderBy(scenarios.name);
    res.json({ success: true, data: allScenarios });
  } catch (error) {
    console.error("Error fetching scenarios:", error);
    res.status(500).json({ success: false, error: "Failed to fetch scenarios" });
  }
});

adminRouter.post("/config/scenarios", requireAdmin, async (req, res) => {
  try {
    const { name, description, context, instructions, skillId, difficulty, avatarName, avatarRole } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: "Name is required" });
    }

    const [newScenario] = await db.insert(scenarios)
      .values({
        name,
        description,
        context,
        instructions,
        skillId,
        difficulty,
        avatarName,
        avatarRole
      })
      .returning();

    res.json({ success: true, data: newScenario });
  } catch (error) {
    console.error("Error creating scenario:", error);
    res.status(500).json({ success: false, error: "Failed to create scenario" });
  }
});

adminRouter.put("/config/scenarios/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, context, instructions, skillId, difficulty, avatarName, avatarRole } = req.body;

    const [updated] = await db.update(scenarios)
      .set({
        name,
        description,
        context,
        instructions,
        skillId,
        difficulty,
        avatarName,
        avatarRole
      })
      .where(eq(scenarios.id, parseInt(id)))
      .returning();

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating scenario:", error);
    res.status(500).json({ success: false, error: "Failed to update scenario" });
  }
});

adminRouter.delete("/config/scenarios/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(scenarios).where(eq(scenarios.id, parseInt(id)));
    res.json({ success: true, message: "Scenario deleted" });
  } catch (error) {
    console.error("Error deleting scenario:", error);
    res.status(500).json({ success: false, error: "Failed to delete scenario" });
  }
});

adminRouter.get("/config/user-roles", requireAdmin, async (req, res) => {
  try {
    const roles = await db.execute(sql`
      SELECT 
        ur.*,
        au.username,
        au.email,
        assigner.username as assigned_by_username
      FROM user_roles ur
      JOIN auth_users au ON au.id = ur.auth_user_id
      LEFT JOIN auth_users assigner ON assigner.id = ur.assigned_by
      ORDER BY ur.created_at DESC
    `);

    res.json({ success: true, data: roles.rows });
  } catch (error) {
    console.error("Error fetching user roles:", error);
    res.status(500).json({ success: false, error: "Failed to fetch user roles" });
  }
});

adminRouter.put("/config/user-roles/:userId", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["admin", "coach", "learner"].includes(role)) {
      return res.status(400).json({ success: false, error: "Invalid role" });
    }

    await db.insert(userRoles)
      .values({
        authUserId: userId,
        role,
        assignedBy: req.user!.id,
        assignedAt: new Date()
      })
      .onConflictDoUpdate({
        target: userRoles.authUserId,
        set: {
          role,
          assignedBy: req.user!.id,
          updatedAt: new Date()
        }
      });

    res.json({ success: true, message: "User role updated" });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ success: false, error: "Failed to update user role" });
  }
});

adminRouter.get("/costs/summary", requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const costsByService = await db.execute(sql`
      SELECT 
        service,
        COUNT(*) as total_requests,
        COALESCE(SUM(tokens_in), 0) as total_tokens_in,
        COALESCE(SUM(tokens_out), 0) as total_tokens_out,
        COALESCE(SUM(estimated_cost), 0) as total_cost
      FROM api_usage_events
      WHERE occurred_at >= ${startDate}
      GROUP BY service
      ORDER BY total_cost DESC
    `);

    const totalCost = await db.execute(sql`
      SELECT COALESCE(SUM(estimated_cost), 0) as total
      FROM api_usage_events
      WHERE occurred_at >= ${startDate}
    `);

    res.json({
      success: true,
      data: {
        byService: costsByService.rows,
        totalCost: totalCost.rows[0]?.total || 0,
        period: { days, startDate }
      }
    });
  } catch (error) {
    console.error("Error fetching cost summary:", error);
    res.status(500).json({ success: false, error: "Failed to fetch cost summary" });
  }
});

adminRouter.get("/costs/by-user", requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const costsByUser = await db.execute(sql`
      SELECT 
        au.id as user_id,
        au.username,
        au.email,
        COUNT(aue.*) as total_requests,
        COALESCE(SUM(aue.estimated_cost), 0) as total_cost,
        COALESCE(SUM(CASE WHEN aue.service = 'openai' THEN aue.estimated_cost ELSE 0 END), 0) as openai_cost,
        COALESCE(SUM(CASE WHEN aue.service = 'heygen' THEN aue.estimated_cost ELSE 0 END), 0) as heygen_cost,
        COALESCE(SUM(CASE WHEN aue.service = 'tavily' THEN aue.estimated_cost ELSE 0 END), 0) as tavily_cost,
        COALESCE(SUM(CASE WHEN aue.service = 'whisper' THEN aue.estimated_cost ELSE 0 END), 0) as whisper_cost
      FROM auth_users au
      LEFT JOIN api_usage_events aue ON aue.auth_user_id = au.id AND aue.occurred_at >= ${startDate}
      GROUP BY au.id, au.username, au.email
      HAVING COUNT(aue.*) > 0
      ORDER BY total_cost DESC
    `);

    res.json({
      success: true,
      data: costsByUser.rows
    });
  } catch (error) {
    console.error("Error fetching costs by user:", error);
    res.status(500).json({ success: false, error: "Failed to fetch costs by user" });
  }
});

adminRouter.get("/costs/daily", requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyCosts = await db.execute(sql`
      SELECT 
        DATE(occurred_at) as date,
        service,
        COUNT(*) as requests,
        COALESCE(SUM(estimated_cost), 0) as cost
      FROM api_usage_events
      WHERE occurred_at >= ${startDate}
      GROUP BY DATE(occurred_at), service
      ORDER BY date DESC, service
    `);

    res.json({
      success: true,
      data: dailyCosts.rows
    });
  } catch (error) {
    console.error("Error fetching daily costs:", error);
    res.status(500).json({ success: false, error: "Failed to fetch daily costs" });
  }
});

adminRouter.get("/costs/usage-log", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const service = req.query.service as string;

    let query = sql`
      SELECT 
        aue.*,
        au.username,
        au.email
      FROM api_usage_events aue
      LEFT JOIN auth_users au ON au.id = aue.auth_user_id
    `;

    if (service) {
      query = sql`${query} WHERE aue.service = ${service}`;
    }

    query = sql`${query} ORDER BY aue.occurred_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const usageLog = await db.execute(query);

    const totalResult = await db.select({ count: count() }).from(apiUsageEvents);

    res.json({
      success: true,
      data: {
        logs: usageLog.rows,
        pagination: {
          page,
          limit,
          total: totalResult[0]?.count || 0,
          totalPages: Math.ceil((totalResult[0]?.count || 0) / limit)
        }
      }
    });
  } catch (error) {
    console.error("Error fetching usage log:", error);
    res.status(500).json({ success: false, error: "Failed to fetch usage log" });
  }
});

adminRouter.get("/costs/pricing", requireAdmin, async (req, res) => {
  try {
    const pricingSettings = await db.select()
      .from(adminSettings)
      .where(eq(adminSettings.category, "pricing"));

    const pricing: Record<string, number> = {};
    pricingSettings.forEach(s => {
      pricing[s.key] = Number(s.value) || 0;
    });

    res.json({ success: true, data: pricing });
  } catch (error) {
    console.error("Error fetching pricing:", error);
    res.status(500).json({ success: false, error: "Failed to fetch pricing" });
  }
});

adminRouter.put("/costs/pricing", requireAdmin, async (req, res) => {
  try {
    const pricingUpdates = req.body;

    for (const [key, value] of Object.entries(pricingUpdates)) {
      await db.insert(adminSettings)
        .values({
          key,
          value: String(value),
          category: "pricing",
          updatedBy: req.user!.id
        })
        .onConflictDoUpdate({
          target: adminSettings.key,
          set: {
            value: String(value),
            updatedBy: req.user!.id,
            updatedAt: new Date()
          }
        });
    }

    res.json({ success: true, message: "Pricing updated" });
  } catch (error) {
    console.error("Error updating pricing:", error);
    res.status(500).json({ success: false, error: "Failed to update pricing" });
  }
});

adminRouter.get("/analytics/skills", requireAdmin, async (req, res) => {
  try {
    const skillStats = await db.execute(sql`
      SELECT 
        s.id,
        s.name,
        s.category,
        COUNT(DISTINCT rs.id) as session_count,
        COUNT(DISTINCT rs.user_id) as unique_users,
        COALESCE(AVG(asa.overall_score), 0) as avg_score,
        COALESCE(SUM(rs.duration), 0) as total_duration
      FROM skills s
      LEFT JOIN transcripts t ON t.skill = s.name
      LEFT JOIN roleplay_session rs ON rs.id = t.session_id
      LEFT JOIN ai_session_analysis asa ON asa.session_id = rs.id
      GROUP BY s.id, s.name, s.category
      ORDER BY session_count DESC
      LIMIT 20
    `);

    res.json({ success: true, data: skillStats.rows });
  } catch (error) {
    console.error("Error fetching skill analytics:", error);
    res.status(500).json({ success: false, error: "Failed to fetch skill analytics" });
  }
});

adminRouter.get("/analytics/activity", requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const [dailyActive, weeklyActive, monthlyActive, peakHours, recentActivity] = await Promise.all([
      db.execute(sql`
        SELECT COUNT(DISTINCT user_id) as count
        FROM roleplay_session
        WHERE start_time >= ${today}
      `),
      db.execute(sql`
        SELECT COUNT(DISTINCT user_id) as count
        FROM roleplay_session
        WHERE start_time >= ${weekAgo}
      `),
      db.execute(sql`
        SELECT COUNT(DISTINCT user_id) as count
        FROM roleplay_session
        WHERE start_time >= ${monthAgo}
      `),
      db.execute(sql`
        SELECT 
          EXTRACT(HOUR FROM start_time) as hour,
          COUNT(*) as session_count
        FROM roleplay_session
        WHERE start_time >= ${monthAgo}
        GROUP BY EXTRACT(HOUR FROM start_time)
        ORDER BY hour
      `),
      db.execute(sql`
        SELECT 
          DATE(start_time) as date,
          COUNT(*) as sessions,
          COUNT(DISTINCT user_id) as users,
          COALESCE(AVG(duration), 0) as avg_duration
        FROM roleplay_session
        WHERE start_time >= ${monthAgo}
        GROUP BY DATE(start_time)
        ORDER BY date DESC
        LIMIT 30
      `)
    ]);

    res.json({
      success: true,
      data: {
        dailyActiveUsers: Number(dailyActive.rows[0]?.count) || 0,
        weeklyActiveUsers: Number(weeklyActive.rows[0]?.count) || 0,
        monthlyActiveUsers: Number(monthlyActive.rows[0]?.count) || 0,
        peakHours: peakHours.rows,
        recentActivity: recentActivity.rows
      }
    });
  } catch (error) {
    console.error("Error fetching activity analytics:", error);
    res.status(500).json({ success: false, error: "Failed to fetch activity analytics" });
  }
});

adminRouter.get("/analytics/sessions-list", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const sessions = await db.execute(sql`
      SELECT 
        rs.id,
        rs.start_time,
        rs.end_time,
        rs.duration,
        au.username,
        (SELECT COALESCE(t2.skill, sk2.name) 
         FROM transcripts t2 
         LEFT JOIN skills sk2 ON sk2.id = t2.skill_id 
         WHERE t2.session_id = rs.id LIMIT 1) as skill,
        (SELECT COALESCE(t2.scenario, sc2.name, cs2.title) 
         FROM transcripts t2 
         LEFT JOIN scenarios sc2 ON sc2.id = t2.scenario_id 
         LEFT JOIN custom_scenarios cs2 ON cs2.id = t2.custom_scenario_id 
         WHERE t2.session_id = rs.id LIMIT 1) as scenario,
        asa.overall_score,
        a.name as avatar_name
      FROM roleplay_session rs
      LEFT JOIN users u ON u.id = rs.user_id
      LEFT JOIN auth_users au ON au.id = u.auth_user_id
      LEFT JOIN ai_session_analysis asa ON asa.session_id = rs.id
      LEFT JOIN avatars a ON a.id = rs.avatar_id
      ORDER BY rs.start_time DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const totalResult = await db.select({ count: count() }).from(roleplaySession);

    res.json({
      success: true,
      data: {
        sessions: sessions.rows,
        pagination: {
          page,
          limit,
          total: totalResult[0]?.count || 0,
          totalPages: Math.ceil((totalResult[0]?.count || 0) / limit)
        }
      }
    });
  } catch (error) {
    console.error("Error fetching sessions list:", error);
    res.status(500).json({ success: false, error: "Failed to fetch sessions list" });
  }
});

adminRouter.get("/analytics/avatars", requireAdmin, async (req, res) => {
  try {
    const avatarStats = await db.execute(sql`
      SELECT 
        a.id,
        a.name,
        a.gender,
        COUNT(DISTINCT rs.id) as session_count,
        COUNT(DISTINCT rs.user_id) as unique_users,
        COALESCE(AVG(rs.duration), 0) as avg_duration,
        COALESCE(AVG(asa.overall_score), 0) as avg_score
      FROM avatars a
      LEFT JOIN roleplay_session rs ON rs.avatar_id = a.id
      LEFT JOIN ai_session_analysis asa ON asa.session_id = rs.id
      GROUP BY a.id, a.name, a.gender
      ORDER BY session_count DESC
    `);

    res.json({ success: true, data: avatarStats.rows });
  } catch (error) {
    console.error("Error fetching avatar analytics:", error);
    res.status(500).json({ success: false, error: "Failed to fetch avatar analytics" });
  }
});

adminRouter.get("/analytics/scenarios", requireAdmin, async (req, res) => {
  try {
    const scenarioStats = await db.execute(sql`
      SELECT 
        sc.id,
        sc.name,
        s.name as skill_name,
        COUNT(DISTINCT rs.id) as session_count,
        COUNT(DISTINCT rs.user_id) as unique_users,
        COALESCE(AVG(asa.overall_score), 0) as avg_score,
        COALESCE(AVG(rs.duration), 0) as avg_duration
      FROM scenarios sc
      LEFT JOIN skills s ON s.id = sc.skill_id
      LEFT JOIN transcripts t ON t.scenario = sc.name
      LEFT JOIN roleplay_session rs ON rs.id = t.session_id
      LEFT JOIN ai_session_analysis asa ON asa.session_id = rs.id
      GROUP BY sc.id, sc.name, s.name
      ORDER BY session_count DESC
      LIMIT 20
    `);

    res.json({ success: true, data: scenarioStats.rows });
  } catch (error) {
    console.error("Error fetching scenario analytics:", error);
    res.status(500).json({ success: false, error: "Failed to fetch scenario analytics" });
  }
});

adminRouter.get("/analytics/retention", requireAdmin, async (req, res) => {
  try {
    const retentionData = await db.execute(sql`
      WITH user_first_session AS (
        SELECT 
          user_id,
          MIN(DATE(start_time)) as first_session_date
        FROM roleplay_session
        GROUP BY user_id
      ),
      cohort_activity AS (
        SELECT 
          ufs.first_session_date,
          DATE(rs.start_time) as activity_date,
          COUNT(DISTINCT rs.user_id) as active_users
        FROM user_first_session ufs
        JOIN roleplay_session rs ON rs.user_id = ufs.user_id
        WHERE ufs.first_session_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY ufs.first_session_date, DATE(rs.start_time)
      )
      SELECT 
        first_session_date as cohort_date,
        COUNT(DISTINCT activity_date) as days_active,
        SUM(active_users) as total_activity
      FROM cohort_activity
      GROUP BY first_session_date
      ORDER BY first_session_date DESC
      LIMIT 30
    `);

    const returningUsers = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT user_id) as returning_users
      FROM roleplay_session
      WHERE user_id IN (
        SELECT user_id 
        FROM roleplay_session 
        GROUP BY user_id 
        HAVING COUNT(*) > 1
      )
    `);

    res.json({
      success: true,
      data: {
        cohorts: retentionData.rows,
        returningUsers: Number(returningUsers.rows[0]?.returning_users) || 0
      }
    });
  } catch (error) {
    console.error("Error fetching retention analytics:", error);
    res.status(500).json({ success: false, error: "Failed to fetch retention analytics" });
  }
});

adminRouter.get("/check-access", async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ isAdmin: false, authenticated: false });
    }

    const roles = await db.select()
      .from(userRoles)
      .where(eq(userRoles.authUserId, req.user.id));

    const role = roles.length > 0 ? roles[0].role : "learner";

    res.json({
      isAdmin: role === "admin",
      role,
      authenticated: true,
      userId: req.user.id
    });
  } catch (error) {
    console.error("Error checking admin access:", error);
    res.status(500).json({ success: false, error: "Failed to check access" });
  }
});

adminRouter.get("/analytics/funnel", requireAdmin, async (req, res) => {
  try {
    const period = (req.query.period as string) || "7d";
    const mode = req.query.mode as string;
    const device = req.query.device as string;
    
    let periodDays = 7;
    if (period === "24h") periodDays = 1;
    else if (period === "30d") periodDays = 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Fixed funnel query - aggregate by step only to avoid double-counting users
    const funnelData = await db.execute(sql`
      SELECT 
        step,
        COUNT(*) as event_count,
        COUNT(DISTINCT COALESCE(user_id::text, auth_user_id, 'anonymous')) as unique_users
      FROM session_journey_events
      WHERE occurred_at >= ${startDate}
      ${mode ? sql` AND mode = ${mode}` : sql``}
      ${device ? sql` AND device = ${device}` : sql``}
      GROUP BY step
      ORDER BY 
        CASE step
          WHEN 'landing' THEN 1
          WHEN 'mode_selection' THEN 2
          WHEN 'pre_session_setup' THEN 3
          WHEN 'avatar_loaded' THEN 4
          WHEN 'session_started' THEN 5
          WHEN 'session_completed' THEN 6
          WHEN 'analysis_viewed' THEN 7
        END
    `);

    const stepOrder = ['landing', 'mode_selection', 'pre_session_setup', 'avatar_loaded', 'session_started', 'session_completed', 'analysis_viewed'];
    const stepLabels = {
      'landing': 'Landing Page',
      'mode_selection': 'Mode Selection',
      'pre_session_setup': 'Pre-Session Setup',
      'avatar_loaded': 'Avatar Loaded',
      'session_started': 'Session Started',
      'session_completed': 'Session Completed',
      'analysis_viewed': 'Analysis Viewed'
    };

    // Convert rows to a map for easy lookup
    const stepData = new Map<string, { count: number; uniqueUsers: number }>();
    for (const row of funnelData.rows as any[]) {
      stepData.set(row.step, {
        count: Number(row.event_count) || 0,
        uniqueUsers: Number(row.unique_users) || 0
      });
    }

    const funnel = stepOrder.map((step, index) => {
      const data = stepData.get(step) || { count: 0, uniqueUsers: 0 };
      const prevStep = index > 0 ? stepOrder[index - 1] : null;
      const prevData = prevStep ? stepData.get(prevStep) : null;
      const dropOffPercent = prevData && prevData.uniqueUsers > 0 
        ? Math.round((1 - data.uniqueUsers / prevData.uniqueUsers) * 100) 
        : 0;
      
      return {
        step,
        label: stepLabels[step as keyof typeof stepLabels],
        count: data.count,
        uniqueUsers: data.uniqueUsers,
        dropOffPercent: Math.max(0, index === 0 ? 0 : dropOffPercent)
      };
    });

    res.json({
      success: true,
      data: {
        funnel,
        period,
        filters: { mode, device }
      }
    });
  } catch (error) {
    console.error("Error fetching funnel analytics:", error);
    res.status(500).json({ success: false, error: "Failed to fetch funnel analytics" });
  }
});

adminRouter.post("/analytics/track-journey", async (req, res) => {
  try {
    const { step, mode, device, language, avatarId, sessionId, metadata } = req.body;
    const sessionUser = (req.session as any)?.user;
    
    let userId: number | null = null;
    let authUserId: string | null = null;
    
    if (sessionUser) {
      authUserId = sessionUser.id;
      const userResult = await db.select().from(users).where(eq(users.authUserId, sessionUser.id));
      if (userResult.length > 0) {
        userId = userResult[0].id;
      }
    }

    await db.insert(sessionJourneyEvents).values({
      userId,
      authUserId,
      sessionId: sessionId || null,
      step,
      mode,
      device,
      language,
      avatarId,
      metadata
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error tracking journey event:", error);
    res.status(500).json({ success: false, error: "Failed to track journey" });
  }
});

adminRouter.get("/analytics/session-quality", requireAdmin, async (req, res) => {
  try {
    const period = (req.query.period as string) || "7d";
    
    let periodDays = 7;
    if (period === "24h") periodDays = 1;
    else if (period === "30d") periodDays = 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Fixed SQI query - handle null values properly to avoid NaN
    const sessionsWithSQI = await db.execute(sql`
      SELECT 
        rs.id,
        rs.start_time,
        rs.end_time,
        COALESCE(rs.duration, 0) as duration,
        COALESCE(au.username, 'Anonymous') as username,
        COALESCE(asa.overall_score, 0) as overall_score,
        CASE WHEN rs.end_time IS NOT NULL THEN 1 ELSE 0 END as completed,
        CASE WHEN asa.id IS NOT NULL THEN 1 ELSE 0 END as analysis_viewed,
        CASE WHEN COALESCE(rs.duration, 0) >= 120 THEN 1 ELSE 0 END as adequate_duration,
        (
          (CASE WHEN rs.end_time IS NOT NULL THEN 25 ELSE 0 END) +
          (CASE WHEN COALESCE(rs.duration, 0) >= 120 THEN 25 
                WHEN COALESCE(rs.duration, 0) >= 60 THEN 15 
                ELSE 0 END) +
          (CASE WHEN asa.id IS NOT NULL THEN 25 ELSE 0 END) +
          (CASE WHEN COALESCE(asa.overall_score, 0) >= 70 THEN 25 
                ELSE COALESCE(asa.overall_score, 0) * 0.25 END)
        ) as sqi_score,
        t.session_type as mode,
        COALESCE(sc.name, cs.title, 'Practice Session') as scenario_name
      FROM roleplay_session rs
      LEFT JOIN users u ON u.id = rs.user_id
      LEFT JOIN auth_users au ON au.id = u.auth_user_id
      LEFT JOIN ai_session_analysis asa ON asa.session_id = rs.id
      LEFT JOIN transcripts t ON t.session_id = rs.id
      LEFT JOIN scenarios sc ON sc.id = t.scenario_id
      LEFT JOIN custom_scenarios cs ON cs.id = t.custom_scenario_id
      WHERE rs.start_time >= ${startDate}
      ORDER BY rs.start_time DESC
      LIMIT 100
    `);

    const sessions = sessionsWithSQI.rows as any[];
    
    const avgSQI = sessions.length > 0 
      ? Math.round(sessions.reduce((sum, s) => sum + Number(s.sqi_score || 0), 0) / sessions.length)
      : 0;
    
    const lowQualitySessions = sessions.filter(s => Number(s.sqi_score) < 50);
    const highQualitySessions = sessions.filter(s => Number(s.sqi_score) >= 75);

    const qualityDistribution = {
      excellent: sessions.filter(s => Number(s.sqi_score) >= 90).length,
      good: sessions.filter(s => Number(s.sqi_score) >= 75 && Number(s.sqi_score) < 90).length,
      fair: sessions.filter(s => Number(s.sqi_score) >= 50 && Number(s.sqi_score) < 75).length,
      poor: sessions.filter(s => Number(s.sqi_score) < 50).length
    };

    res.json({
      success: true,
      data: {
        sessions: sessions.map(s => ({
          ...s,
          sqi_score: Math.round(Number(s.sqi_score) || 0)
        })),
        summary: {
          avgSQI,
          totalSessions: sessions.length,
          lowQualityCount: lowQualitySessions.length,
          highQualityCount: highQualitySessions.length,
          qualityDistribution
        },
        period
      }
    });
  } catch (error) {
    console.error("Error fetching session quality:", error);
    res.status(500).json({ success: false, error: "Failed to fetch session quality" });
  }
});

adminRouter.get("/budget-guards", requireAdmin, async (req, res) => {
  try {
    const guards = await db.select().from(budgetGuards).orderBy(budgetGuards.guardType);
    
    res.json({
      success: true,
      data: guards
    });
  } catch (error) {
    console.error("Error fetching budget guards:", error);
    res.status(500).json({ success: false, error: "Failed to fetch budget guards" });
  }
});

adminRouter.post("/budget-guards", requireAdmin, async (req, res) => {
  try {
    const { guardType, limitValue, currency, isActive, fallbackAction, description } = req.body;
    
    const existing = await db.select().from(budgetGuards).where(eq(budgetGuards.guardType, guardType));
    
    if (existing.length > 0) {
      await db.update(budgetGuards)
        .set({
          limitValue,
          currency: currency || "USD",
          isActive: isActive !== false,
          fallbackAction: fallbackAction || "warn",
          description,
          updatedBy: req.user?.id,
          updatedAt: new Date()
        })
        .where(eq(budgetGuards.guardType, guardType));
    } else {
      await db.insert(budgetGuards).values({
        guardType,
        limitValue,
        currency: currency || "USD",
        isActive: isActive !== false,
        fallbackAction: fallbackAction || "warn",
        description,
        updatedBy: req.user?.id
      });
    }

    const guards = await db.select().from(budgetGuards).orderBy(budgetGuards.guardType);
    
    res.json({
      success: true,
      data: guards
    });
  } catch (error) {
    console.error("Error saving budget guard:", error);
    res.status(500).json({ success: false, error: "Failed to save budget guard" });
  }
});

adminRouter.delete("/budget-guards/:guardType", requireAdmin, async (req, res) => {
  try {
    await db.delete(budgetGuards).where(eq(budgetGuards.guardType, req.params.guardType));
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting budget guard:", error);
    res.status(500).json({ success: false, error: "Failed to delete budget guard" });
  }
});

adminRouter.get("/budget-alerts", requireAdmin, async (req, res) => {
  try {
    const alerts = await db.execute(sql`
      SELECT 
        ba.*,
        bg.guard_type,
        bg.description as guard_description
      FROM budget_alerts ba
      LEFT JOIN budget_guards bg ON bg.id = ba.guard_id
      ORDER BY ba.occurred_at DESC
      LIMIT 50
    `);
    
    res.json({
      success: true,
      data: alerts.rows
    });
  } catch (error) {
    console.error("Error fetching budget alerts:", error);
    res.status(500).json({ success: false, error: "Failed to fetch budget alerts" });
  }
});

adminRouter.post("/budget-alerts/:id/acknowledge", requireAdmin, async (req, res) => {
  try {
    await db.update(budgetAlerts)
      .set({
        acknowledged: true,
        acknowledgedBy: req.user?.id
      })
      .where(eq(budgetAlerts.id, parseInt(req.params.id)));
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    res.status(500).json({ success: false, error: "Failed to acknowledge alert" });
  }
});

adminRouter.post("/execute-sql", async (req, res) => {
  try {
    const { sqlStatements, adminKey } = req.body;

    const expectedKey = process.env.ADMIN_SEED_KEY;
    if (!expectedKey || adminKey !== expectedKey) {
      return res.status(403).json({ success: false, error: "Invalid admin key" });
    }

    if (!sqlStatements || typeof sqlStatements !== "string") {
      return res.status(400).json({ success: false, error: "SQL statements required" });
    }

    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const fs = await import("fs");
    const path = await import("path");
    const execAsync = promisify(exec);

    const tempFile = path.join("/tmp", `seed_${Date.now()}.sql`);
    fs.writeFileSync(tempFile, sqlStatements);

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({ success: false, error: "DATABASE_URL not configured" });
    }

    try {
      const { stdout, stderr } = await execAsync(`psql "${databaseUrl}" -f "${tempFile}" 2>&1`, {
        timeout: 300000,
        maxBuffer: 50 * 1024 * 1024
      });

      fs.unlinkSync(tempFile);

      const lines = (stdout + stderr).split("\n").filter(l => l.trim());
      const insertCount = lines.filter(l => l.includes("INSERT")).length;
      const errorLines = lines.filter(l => l.toLowerCase().includes("error"));

      res.json({
        success: errorLines.length === 0,
        message: errorLines.length === 0 
          ? `Successfully executed SQL file. ${insertCount} INSERT operations detected.`
          : `Executed with ${errorLines.length} errors`,
        details: lines.slice(0, 100),
        errors: errorLines.slice(0, 20)
      });
    } catch (execError: any) {
      fs.unlinkSync(tempFile);
      
      const output = execError.stdout || execError.stderr || execError.message;
      const lines = output.split("\n").filter((l: string) => l.trim());
      const errorLines = lines.filter((l: string) => l.toLowerCase().includes("error"));
      
      res.json({
        success: false,
        message: `Execution completed with errors`,
        details: lines.slice(0, 100),
        errors: errorLines.slice(0, 20)
      });
    }
  } catch (error: any) {
    console.error("Error executing SQL:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to execute SQL" });
  }
});

function generateSlug(title: string, companyName: string): string {
  const baseSlug = `${companyName}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}

function generateToken(): string {
  return `st_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 15)}`;
}

adminRouter.get("/companies", requireAdmin, async (req, res) => {
  try {
    const companies = await db.select({
      id: employerCompanies.id,
      name: employerCompanies.name,
      domain: employerCompanies.domain
    }).from(employerCompanies).orderBy(desc(employerCompanies.createdAt));
    
    res.json({ success: true, companies });
  } catch (error: any) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

adminRouter.get("/jobs", requireAdmin, async (req, res) => {
  try {
    const jobs = await db.execute(sql`
      SELECT 
        j.id,
        j.company_id as "companyId",
        c.name as "companyName",
        j.title,
        j.jd_text as "jdText",
        j.status,
        j.apply_link_slug as "applyLinkSlug",
        j.candidate_count as "candidateCount",
        j.generated_interview_plan as "generatedInterviewPlan",
        j.created_at as "createdAt",
        csl.share_token as "shareToken"
      FROM employer_jobs j
      LEFT JOIN employer_companies c ON j.company_id = c.id
      LEFT JOIN interview_sets iset ON iset.job_description LIKE '%employerJobId:' || j.id || '%' OR iset.name = j.title
      LEFT JOIN company_share_links csl ON csl.interview_set_id = iset.id AND csl.expires_at > NOW() AND csl.is_active = true
      ORDER BY j.created_at DESC
    `);
    
    res.json({ success: true, jobs: jobs.rows });
  } catch (error: any) {
    console.error("Error fetching admin jobs:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

adminRouter.post("/jobs", requireAdmin, async (req, res) => {
  try {
    const { companyId, companyName, title, jdText } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, error: "Job title is required" });
    }
    
    let finalCompanyId = companyId;
    let finalCompanyName = companyName || "Demo Company";
    
    if (!finalCompanyId && companyName) {
      const [newCompany] = await db.insert(employerCompanies).values({
        name: companyName,
        plan: "free"
      }).returning();
      finalCompanyId = newCompany.id;
      finalCompanyName = newCompany.name;
    } else if (!finalCompanyId) {
      const [existingCompany] = await db.select().from(employerCompanies).limit(1);
      if (existingCompany) {
        finalCompanyId = existingCompany.id;
        finalCompanyName = existingCompany.name;
      } else {
        const [newCompany] = await db.insert(employerCompanies).values({
          name: "Demo Company",
          plan: "free"
        }).returning();
        finalCompanyId = newCompany.id;
        finalCompanyName = newCompany.name;
      }
    } else {
      const [company] = await db.select().from(employerCompanies).where(eq(employerCompanies.id, finalCompanyId)).limit(1);
      if (company) {
        finalCompanyName = company.name;
      }
    }

    const applyLinkSlug = generateSlug(title, finalCompanyName);

    let generatedInterviewPlan: any = null;
    let roleArchetypeId: string | null = null;
    let companyArchetype: string | null = null;
    let archetypeConfidence: number | null = null;

    if (jdText || title) {
      try {
        generatedInterviewPlan = await buildEmployerInterviewPlan(
          title,
          jdText || "",
          finalCompanyName,
          "mid"
        );
        
        if (generatedInterviewPlan) {
          roleArchetypeId = generatedInterviewPlan.roleArchetype?.id || null;
          companyArchetype = generatedInterviewPlan.companyArchetype?.type || null;
          archetypeConfidence = generatedInterviewPlan.companyArchetype?.confidence || null;
          console.log(`Generated admin interview plan for job "${title}": ${generatedInterviewPlan.phases?.length || 0} phases, ${generatedInterviewPlan.totalMins} mins`);
        }
      } catch (planError: any) {
        console.error("Error generating interview plan:", planError);
      }
    }

    const [job] = await db.insert(employerJobs).values({
      companyId: finalCompanyId,
      title,
      jdText,
      roleArchetypeId,
      assessmentConfig: { 
        interviewTypes: generatedInterviewPlan?.phases?.map((p: any) => p.category) || ["hr", "technical"], 
        totalDuration: generatedInterviewPlan?.totalMins || 12,
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
        companyName: finalCompanyName,
        generatedInterviewPlan,
        shareToken: null
      }
    });
  } catch (error: any) {
    console.error("Error creating admin job:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

adminRouter.post("/jobs/:jobId/share-token", requireAdmin, async (req, res) => {
  try {
    const { jobId } = req.params;

    const [job] = await db.select().from(employerJobs).where(eq(employerJobs.id, jobId)).limit(1);
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    const [company] = await db.select().from(employerCompanies).where(eq(employerCompanies.id, job.companyId)).limit(1);

    let interviewSetId: number;

    const existingSet = await db.execute(sql`
      SELECT id FROM interview_sets 
      WHERE job_description LIKE ${'%employerJobId:' + jobId + '%'}
      OR name = ${job.title}
      LIMIT 1
    `);

    if (existingSet.rows.length > 0) {
      interviewSetId = (existingSet.rows[0] as any).id;
    } else {
      const plan = job.assessmentConfig as any;
      const [newSet] = await db.insert(interviewSets).values({
        name: job.title,
        description: `Interview practice for ${job.title}`,
        jobDescription: `employerJobId:${jobId}`,
        interviewTypes: plan?.interviewTypes || ["hr", "technical"],
        visibility: "private",
        priceCents: 0
      }).returning();
      interviewSetId = newSet.id;
    }

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    await db.insert(companyShareLinks).values({
      interviewSetId,
      shareToken: token,
      companyName: company?.name || null,
      description: `Access to ${job.title} interview practice`,
      maxUses: 1000,
      currentUses: 0,
      expiresAt,
      isActive: true
    });

    res.json({ success: true, token });
  } catch (error: any) {
    console.error("Error generating share token:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
