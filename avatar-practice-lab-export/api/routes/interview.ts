import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { db } from "../db.js";
import { eq, desc, and } from "drizzle-orm";
import {
  roleKits,
  interviewRubrics,
  userDocuments,
  userProfileExtracted,
  interviewConfigs,
  interviewPlans,
  interviewSessions,
  interviewAnalysis,
  interviewArtifacts,
  jobTargets,
  RoleKit,
  UserDocument,
  InterviewConfig,
  InterviewPlan,
  InterviewSession,
  InterviewRubric,
  InterviewAnalysisType,
} from "../../shared/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { getOpenAI } from "../utils/openai-client.js";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const interviewRouter = Router();

const uploadDir = path.join(__dirname, "..", "uploads", "documents");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `doc-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOCX, DOC, and TXT files are allowed"));
    }
  },
});

interviewRouter.use((req, res, next) => {
  const sessionUser = (req.session as any)?.user;
  if (sessionUser) {
    req.user = sessionUser;
  }
  next();
});

// ===================================================================
// Role Kit Endpoints
// ===================================================================

interviewRouter.get("/role-kits", async (req: Request, res: Response) => {
  try {
    const { domain, level, search } = req.query;
    
    let query = db.select().from(roleKits).where(eq(roleKits.isActive, true));
    
    const kits = await query.orderBy(roleKits.name);
    
    let filtered = kits;
    if (domain && typeof domain === "string") {
      filtered = filtered.filter(k => k.domain === domain);
    }
    if (level && typeof level === "string") {
      filtered = filtered.filter(k => k.level === level);
    }
    if (search && typeof search === "string") {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(k => 
        k.name.toLowerCase().includes(searchLower) ||
        k.description?.toLowerCase().includes(searchLower) ||
        k.domain.toLowerCase().includes(searchLower)
      );
    }
    
    res.json({ success: true, roleKits: filtered });
  } catch (error: any) {
    console.error("Error fetching role kits:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.get("/role-kits/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [kit] = await db.select().from(roleKits).where(eq(roleKits.id, id));
    
    if (!kit) {
      return res.status(404).json({ success: false, error: "Role kit not found" });
    }
    
    let rubric: InterviewRubric | undefined;
    if (kit.defaultRubricId) {
      const [r] = await db.select().from(interviewRubrics).where(eq(interviewRubrics.id, kit.defaultRubricId));
      rubric = r;
    }
    
    res.json({ success: true, roleKit: kit, rubric });
  } catch (error: any) {
    console.error("Error fetching role kit:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================================================
// Document Upload & Parsing Endpoints
// ===================================================================

interviewRouter.post("/documents/upload", requireAuth, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }
    
    const userId = req.user!.id;
    const docType = req.body.docType || "resume";
    
    let rawText = "";
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    
    if (mimeType === "application/pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: dataBuffer });
      const pdfData = await parser.getText();
      rawText = pdfData.text;
      await parser.destroy();
    } else if (mimeType.includes("wordprocessingml") || mimeType === "application/msword") {
      const result = await mammoth.extractRawText({ path: filePath });
      rawText = result.value;
    } else if (mimeType === "text/plain") {
      rawText = fs.readFileSync(filePath, "utf-8");
    }
    
    const [doc] = await db
      .insert(userDocuments)
      .values({
        userId,
        docType: docType as "resume" | "job_description" | "company_notes" | "other",
        fileName: req.file.originalname,
        mimeType,
        s3Url: filePath,
        rawText,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    res.json({
      success: true,
      document: {
        id: doc.id,
        fileName: doc.fileName,
        docType: doc.docType,
        textLength: rawText.length,
        createdAt: doc.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error uploading document:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.get("/documents", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { docType } = req.query;
    
    let docs = await db
      .select({
        id: userDocuments.id,
        fileName: userDocuments.fileName,
        docType: userDocuments.docType,
        mimeType: userDocuments.mimeType,
        createdAt: userDocuments.createdAt,
      })
      .from(userDocuments)
      .where(eq(userDocuments.userId, userId))
      .orderBy(desc(userDocuments.createdAt));
    
    if (docType && typeof docType === "string") {
      docs = docs.filter(d => d.docType === docType);
    }
    
    res.json({ success: true, documents: docs });
  } catch (error: any) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.get("/documents/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = parseInt(req.params.id);
    
    const [doc] = await db
      .select()
      .from(userDocuments)
      .where(and(eq(userDocuments.id, id), eq(userDocuments.userId, userId)));
    
    if (!doc) {
      return res.status(404).json({ success: false, error: "Document not found" });
    }
    
    res.json({ success: true, document: doc });
  } catch (error: any) {
    console.error("Error fetching document:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.post("/documents/:id/parse", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = parseInt(req.params.id);
    
    const [doc] = await db
      .select()
      .from(userDocuments)
      .where(and(eq(userDocuments.id, id), eq(userDocuments.userId, userId)));
    
    if (!doc) {
      return res.status(404).json({ success: false, error: "Document not found" });
    }
    
    if (!doc.rawText) {
      return res.status(400).json({ success: false, error: "Document has no text content" });
    }
    
    let extractorPrompt = "";
    if (doc.docType === "resume") {
      extractorPrompt = RESUME_EXTRACTOR_PROMPT;
    } else if (doc.docType === "job_description") {
      extractorPrompt = JD_EXTRACTOR_PROMPT;
    } else {
      extractorPrompt = GENERAL_DOC_EXTRACTOR_PROMPT;
    }
    
    const openaiClient = getOpenAI();
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: extractorPrompt },
        { role: "user", content: doc.rawText.substring(0, 15000) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });
    
    const parsedJson = JSON.parse(response.choices[0].message.content || "{}");
    
    const [updated] = await db
      .update(userDocuments)
      .set({
        parsedJson,
        updatedAt: new Date(),
      })
      .where(eq(userDocuments.id, id))
      .returning();
    
    if (doc.docType === "resume") {
      await db
        .insert(userProfileExtracted)
        .values({
          userId,
          latestResumeDocId: id,
          headline: parsedJson.headline || null,
          workHistory: parsedJson.workHistory || null,
          projects: parsedJson.projects || null,
          skillsClaimed: parsedJson.skills || null,
          riskFlags: parsedJson.riskFlags || null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userProfileExtracted.userId,
          set: {
            latestResumeDocId: id,
            headline: parsedJson.headline || null,
            workHistory: parsedJson.workHistory || null,
            projects: parsedJson.projects || null,
            skillsClaimed: parsedJson.skills || null,
            riskFlags: parsedJson.riskFlags || null,
            updatedAt: new Date(),
          },
        });
    }
    
    res.json({
      success: true,
      parsedJson,
      documentId: id,
    });
  } catch (error: any) {
    console.error("Error parsing document:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.delete("/documents/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = parseInt(req.params.id);
    
    const [doc] = await db
      .select()
      .from(userDocuments)
      .where(and(eq(userDocuments.id, id), eq(userDocuments.userId, userId)));
    
    if (!doc) {
      return res.status(404).json({ success: false, error: "Document not found" });
    }
    
    await db.delete(userDocuments).where(eq(userDocuments.id, id));
    
    if (doc.docType === "resume") {
      const [profile] = await db
        .select()
        .from(userProfileExtracted)
        .where(eq(userProfileExtracted.userId, userId));
      
      if (profile && profile.latestResumeDocId === id) {
        const [nextResume] = await db
          .select()
          .from(userDocuments)
          .where(and(eq(userDocuments.userId, userId), eq(userDocuments.docType, "resume")))
          .orderBy(desc(userDocuments.createdAt))
          .limit(1);
        
        await db
          .update(userProfileExtracted)
          .set({ 
            latestResumeDocId: nextResume?.id || null, 
            updatedAt: new Date() 
          })
          .where(eq(userProfileExtracted.userId, userId));
      }
    }
    
    res.json({ success: true, message: "Document deleted" });
  } catch (error: any) {
    console.error("Error deleting document:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================================================
// Interview Config Endpoints
// ===================================================================

interviewRouter.post("/config", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      roleKitId,
      resumeDocId,
      jdDocId,
      companyNotesDocId,
      interviewType,
      style,
      seniority,
      mode,
      jobTargetId,
    } = req.body;
    
    const interviewMode = mode || (roleKitId && !resumeDocId ? "role_based" : "custom");
    
    if (interviewMode !== "role_based" && !resumeDocId) {
      return res.status(400).json({ success: false, error: "Resume document is required for custom interviews" });
    }
    
    if (interviewMode === "role_based" && !roleKitId) {
      return res.status(400).json({ success: false, error: "Role kit is required for role-based interviews" });
    }
    
    // If jobTargetId provided, verify it belongs to this user
    if (jobTargetId) {
      const [jobTarget] = await db
        .select()
        .from(jobTargets)
        .where(and(eq(jobTargets.id, jobTargetId), eq(jobTargets.userId, userId)));
      
      if (!jobTarget) {
        return res.status(404).json({ success: false, error: "Job target not found" });
      }
    }
    
    const [config] = await db
      .insert(interviewConfigs)
      .values({
        userId,
        roleKitId: roleKitId || null,
        resumeDocId: resumeDocId || null,
        jdDocId: jdDocId || null,
        companyNotesDocId: companyNotesDocId || null,
        interviewType: interviewType || "behavioral",
        style: style || "neutral",
        seniority: seniority || "entry",
        jobTargetId: jobTargetId || null,
        createdAt: new Date(),
      })
      .returning();
    
    res.json({ success: true, config });
  } catch (error: any) {
    console.error("Error creating interview config:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.get("/config/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = parseInt(req.params.id);
    
    const [config] = await db
      .select()
      .from(interviewConfigs)
      .where(and(eq(interviewConfigs.id, id), eq(interviewConfigs.userId, userId)));
    
    if (!config) {
      return res.status(404).json({ success: false, error: "Config not found" });
    }
    
    let resumeDoc: UserDocument | undefined;
    let jdDoc: UserDocument | undefined;
    let roleKit: RoleKit | undefined;
    
    if (config.resumeDocId) {
      const [doc] = await db.select().from(userDocuments).where(eq(userDocuments.id, config.resumeDocId));
      resumeDoc = doc;
    }
    if (config.jdDocId) {
      const [doc] = await db.select().from(userDocuments).where(eq(userDocuments.id, config.jdDocId));
      jdDoc = doc;
    }
    if (config.roleKitId) {
      const [kit] = await db.select().from(roleKits).where(eq(roleKits.id, config.roleKitId));
      roleKit = kit;
    }
    
    res.json({ success: true, config, resumeDoc, jdDoc, roleKit });
  } catch (error: any) {
    console.error("Error fetching config:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================================================
// Interview Plan Generation
// ===================================================================

interviewRouter.post("/config/:id/plan", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const configId = parseInt(req.params.id);
    
    const [config] = await db
      .select()
      .from(interviewConfigs)
      .where(and(eq(interviewConfigs.id, configId), eq(interviewConfigs.userId, userId)));
    
    if (!config) {
      return res.status(404).json({ success: false, error: "Config not found" });
    }
    
    let resumeParsed: any = null;
    let jdParsed: any = null;
    let roleKitData: RoleKit | null = null;
    
    if (config.resumeDocId) {
      const [doc] = await db.select().from(userDocuments).where(eq(userDocuments.id, config.resumeDocId));
      resumeParsed = doc?.parsedJson;
    }
    if (config.jdDocId) {
      const [doc] = await db.select().from(userDocuments).where(eq(userDocuments.id, config.jdDocId));
      jdParsed = doc?.parsedJson;
    }
    if (config.roleKitId) {
      const [kit] = await db.select().from(roleKits).where(eq(roleKits.id, config.roleKitId));
      roleKitData = kit;
    }
    
    const planContext = {
      interviewType: config.interviewType,
      style: config.style,
      seniority: config.seniority,
      roleKit: roleKitData ? { name: roleKitData.name, domain: roleKitData.domain, skillsFocus: roleKitData.skillsFocus } : null,
      candidateProfile: resumeParsed,
      jobDescription: jdParsed,
    };
    
    const openaiClient = getOpenAI();
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: INTERVIEW_PLAN_GENERATOR_PROMPT },
        { role: "user", content: JSON.stringify(planContext) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });
    
    const planJson = JSON.parse(response.choices[0].message.content || "{}");
    
    const [plan] = await db
      .insert(interviewPlans)
      .values({
        interviewConfigId: configId,
        planJson,
        version: 1,
        createdAt: new Date(),
      })
      .returning();
    
    res.json({ success: true, plan });
  } catch (error: any) {
    console.error("Error generating plan:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.get("/plan/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    const [plan] = await db.select().from(interviewPlans).where(eq(interviewPlans.id, id));
    
    if (!plan) {
      return res.status(404).json({ success: false, error: "Plan not found" });
    }
    
    res.json({ success: true, plan });
  } catch (error: any) {
    console.error("Error fetching plan:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================================================
// Interview Session Endpoints
// ===================================================================

interviewRouter.post("/session/start", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { interviewConfigId, interviewPlanId, rubricId } = req.body;
    
    if (!interviewConfigId) {
      return res.status(400).json({ success: false, error: "Interview config ID is required" });
    }
    
    const [config] = await db
      .select()
      .from(interviewConfigs)
      .where(and(eq(interviewConfigs.id, interviewConfigId), eq(interviewConfigs.userId, userId)));
    
    if (!config) {
      return res.status(404).json({ success: false, error: "Config not found" });
    }
    
    let defaultRubricId = rubricId;
    if (!defaultRubricId) {
      const [defaultRubric] = await db.select().from(interviewRubrics).where(eq(interviewRubrics.isDefault, true));
      defaultRubricId = defaultRubric?.id;
    }
    
    const [session] = await db
      .insert(interviewSessions)
      .values({
        interviewConfigId,
        interviewPlanId: interviewPlanId || null,
        rubricId: defaultRubricId || null,
        status: "created",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    res.json({ success: true, session });
  } catch (error: any) {
    console.error("Error starting interview session:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.post("/session/:id/link-roleplay", requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { roleplaySessionId } = req.body;
    
    const [updated] = await db
      .update(interviewSessions)
      .set({
        roleplaySessionId,
        status: "running",
        updatedAt: new Date(),
      })
      .where(eq(interviewSessions.id, sessionId))
      .returning();
    
    res.json({ success: true, session: updated });
  } catch (error: any) {
    console.error("Error linking roleplay session:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.post("/session/:id/end", requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.id);
    
    const [updated] = await db
      .update(interviewSessions)
      .set({
        status: "ended",
        updatedAt: new Date(),
      })
      .where(eq(interviewSessions.id, sessionId))
      .returning();
    
    res.json({ success: true, session: updated });
  } catch (error: any) {
    console.error("Error ending interview session:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.get("/session/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.id);
    
    const [session] = await db.select().from(interviewSessions).where(eq(interviewSessions.id, sessionId));
    
    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }
    
    let config: InterviewConfig | undefined;
    let plan: InterviewPlan | undefined;
    let analysis: InterviewAnalysisType | undefined;
    let roleKit: RoleKit | undefined;
    
    if (session.interviewConfigId) {
      const [c] = await db.select().from(interviewConfigs).where(eq(interviewConfigs.id, session.interviewConfigId));
      config = c;
      
      if (c?.roleKitId) {
        const [kit] = await db.select().from(roleKits).where(eq(roleKits.id, c.roleKitId));
        roleKit = kit;
      }
    }
    if (session.interviewPlanId) {
      const [p] = await db.select().from(interviewPlans).where(eq(interviewPlans.id, session.interviewPlanId));
      plan = p;
    }
    
    const [a] = await db.select().from(interviewAnalysis).where(eq(interviewAnalysis.interviewSessionId, sessionId));
    analysis = a;
    
    res.json({ 
      success: true, 
      session: {
        ...session,
        roleKit,
        config,
        plan: plan?.planJson,
      },
      config, 
      plan, 
      analysis 
    });
  } catch (error: any) {
    console.error("Error fetching session:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================================================
// Interview Analysis Endpoints
// ===================================================================

interviewRouter.post("/session/:id/analyze", requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { transcript, transcriptId } = req.body;
    
    const [session] = await db.select().from(interviewSessions).where(eq(interviewSessions.id, sessionId));
    
    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }
    
    let config: InterviewConfig | undefined;
    let resumeParsed: any;
    let jdParsed: any;
    let rubric: InterviewRubric | undefined;
    let roleKitData: RoleKit | undefined;
    
    if (session.interviewConfigId) {
      const [c] = await db.select().from(interviewConfigs).where(eq(interviewConfigs.id, session.interviewConfigId));
      config = c;
      
      if (c?.resumeDocId) {
        const [doc] = await db.select().from(userDocuments).where(eq(userDocuments.id, c.resumeDocId));
        resumeParsed = doc?.parsedJson;
      }
      if (c?.jdDocId) {
        const [doc] = await db.select().from(userDocuments).where(eq(userDocuments.id, c.jdDocId));
        jdParsed = doc?.parsedJson;
      }
      if (c?.roleKitId) {
        const [kit] = await db.select().from(roleKits).where(eq(roleKits.id, c.roleKitId));
        roleKitData = kit;
      }
    }
    
    if (session.rubricId) {
      const [r] = await db.select().from(interviewRubrics).where(eq(interviewRubrics.id, session.rubricId));
      rubric = r;
    }
    
    const evaluatorContext = {
      rubric: rubric?.dimensions,
      scoringGuide: rubric?.scoringGuide,
      roleKit: roleKitData ? { name: roleKitData.name, domain: roleKitData.domain } : null,
      interviewType: config?.interviewType,
      candidateProfile: resumeParsed,
      jobDescription: jdParsed,
      transcript,
    };
    
    const openaiEval = getOpenAI();
    const evaluatorResponse = await openaiEval.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: EVALUATOR_PROMPT },
        { role: "user", content: JSON.stringify(evaluatorContext) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });
    
    const evaluatorResult = JSON.parse(evaluatorResponse.choices[0].message.content || "{}");
    
    const feedbackResponse = await openaiEval.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: FEEDBACK_WRITER_PROMPT },
        { role: "user", content: JSON.stringify({ evaluatorResult, transcript }) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });
    
    const feedbackResult = JSON.parse(feedbackResponse.choices[0].message.content || "{}");
    
    const [analysisRecord] = await db
      .insert(interviewAnalysis)
      .values({
        interviewSessionId: sessionId,
        transcriptId: transcriptId || null,
        overallRecommendation: evaluatorResult.overall?.recommendation?.toLowerCase().replace(/\s+/g, "_") || null,
        confidenceLevel: evaluatorResult.overall?.confidence?.toLowerCase() || null,
        summary: evaluatorResult.overall?.summary || null,
        dimensionScores: evaluatorResult.dimension_scores || null,
        strengths: evaluatorResult.strengths || null,
        risks: evaluatorResult.risks || null,
        roleFitNotes: evaluatorResult.role_fit_notes || null,
        betterAnswers: feedbackResult.better_answers || null,
        practicePlan: feedbackResult.practice_plan_7_days || null,
        wins: feedbackResult.wins || null,
        improvements: feedbackResult.improvements || null,
        createdAt: new Date(),
      })
      .returning();
    
    await db
      .update(interviewSessions)
      .set({ status: "analyzed", updatedAt: new Date() })
      .where(eq(interviewSessions.id, sessionId));
    
    res.json({
      success: true,
      analysis: analysisRecord,
      evaluatorResult,
      feedbackResult,
    });
  } catch (error: any) {
    console.error("Error analyzing interview:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.get("/analysis/:sessionId", requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    
    const [analysis] = await db
      .select()
      .from(interviewAnalysis)
      .where(eq(interviewAnalysis.interviewSessionId, sessionId));
    
    if (!analysis) {
      return res.status(404).json({ success: false, error: "Analysis not found" });
    }

    // Get session and config to find job context
    const [session] = await db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.id, sessionId));

    let jobContext: { id: string; roleTitle: string; companyName: string | null; readinessScore: number | null } | null = null;

    if (session) {
      const [config] = await db
        .select()
        .from(interviewConfigs)
        .where(eq(interviewConfigs.id, session.interviewConfigId));

      if (config?.jobTargetId) {
        const [job] = await db
          .select({
            id: jobTargets.id,
            roleTitle: jobTargets.roleTitle,
            companyName: jobTargets.companyName,
            readinessScore: jobTargets.readinessScore,
          })
          .from(jobTargets)
          .where(eq(jobTargets.id, config.jobTargetId));
        
        if (job) {
          jobContext = job;
        }
      }
    }
    
    res.json({ success: true, analysis, jobContext });
  } catch (error: any) {
    console.error("Error fetching analysis:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================================================
// Interview History
// ===================================================================

interviewRouter.get("/sessions", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const configs = await db
      .select()
      .from(interviewConfigs)
      .where(eq(interviewConfigs.userId, userId));
    
    const configIds = configs.map(c => c.id);
    
    if (configIds.length === 0) {
      return res.json({ success: true, sessions: [] });
    }
    
    const sessions = await db
      .select()
      .from(interviewSessions)
      .orderBy(desc(interviewSessions.createdAt));
    
    const userSessions = sessions.filter(s => configIds.includes(s.interviewConfigId));
    
    const enrichedSessions = await Promise.all(
      userSessions.map(async (session) => {
        const config = configs.find(c => c.id === session.interviewConfigId);
        let roleKit: RoleKit | undefined;
        let analysis: InterviewAnalysisType | undefined;
        
        if (config?.roleKitId) {
          const [kit] = await db.select().from(roleKits).where(eq(roleKits.id, config.roleKitId));
          roleKit = kit;
        }
        
        const [a] = await db.select().from(interviewAnalysis).where(eq(interviewAnalysis.interviewSessionId, session.id));
        analysis = a;
        
        return {
          ...session,
          config,
          roleKit,
          analysis: analysis ? {
            id: analysis.id,
            overallRecommendation: analysis.overallRecommendation,
            summary: analysis.summary,
          } : null,
        };
      })
    );
    
    res.json({ success: true, sessions: enrichedSessions });
  } catch (error: any) {
    console.error("Error fetching interview sessions:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================================================
// Knowledge Base Builder (for HeyGen integration)
// ===================================================================

interviewRouter.get("/knowledge-base/:configId", requireAuth, async (req: Request, res: Response) => {
  try {
    const configId = parseInt(req.params.configId);
    const userId = req.user!.id;
    
    const [config] = await db
      .select()
      .from(interviewConfigs)
      .where(and(eq(interviewConfigs.id, configId), eq(interviewConfigs.userId, userId)));
    
    if (!config) {
      return res.status(404).json({ success: false, error: "Config not found" });
    }
    
    let resumeParsed: any;
    let jdParsed: any;
    let roleKitData: RoleKit | undefined;
    let plan: InterviewPlan | undefined;
    
    if (config.resumeDocId) {
      const [doc] = await db.select().from(userDocuments).where(eq(userDocuments.id, config.resumeDocId));
      resumeParsed = doc?.parsedJson;
    }
    if (config.jdDocId) {
      const [doc] = await db.select().from(userDocuments).where(eq(userDocuments.id, config.jdDocId));
      jdParsed = doc?.parsedJson;
    }
    if (config.roleKitId) {
      const [kit] = await db.select().from(roleKits).where(eq(roleKits.id, config.roleKitId));
      roleKitData = kit;
    }
    
    const [latestPlan] = await db
      .select()
      .from(interviewPlans)
      .where(eq(interviewPlans.interviewConfigId, configId))
      .orderBy(desc(interviewPlans.createdAt))
      .limit(1);
    plan = latestPlan;
    
    const knowledgeBase = buildInterviewKnowledgeBase({
      config,
      resumeParsed,
      jdParsed,
      roleKit: roleKitData || null,
      plan: plan?.planJson,
    });
    
    res.json({ success: true, knowledgeBase });
  } catch (error: any) {
    console.error("Error building knowledge base:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

function buildInterviewKnowledgeBase(data: {
  config: InterviewConfig;
  resumeParsed: any;
  jdParsed: any;
  roleKit: RoleKit | null;
  plan: any;
}): string {
  const { config, resumeParsed, jdParsed, roleKit, plan } = data;
  
  let kb = `You are an interviewer conducting a ${config.interviewType} interview.\n\n`;
  kb += `Interview Style: ${config.style}\n`;
  kb += `Seniority Level: ${config.seniority}\n\n`;
  
  if (roleKit) {
    kb += `Role: ${roleKit.name}\n`;
    kb += `Domain: ${roleKit.domain}\n`;
    if (roleKit.skillsFocus) {
      kb += `Key Skills to Assess: ${(roleKit.skillsFocus as string[]).join(", ")}\n`;
    }
    kb += "\n";
  }
  
  if (resumeParsed) {
    kb += "=== CANDIDATE PROFILE ===\n";
    if (resumeParsed.headline) kb += `Headline: ${resumeParsed.headline}\n`;
    if (resumeParsed.skills) kb += `Skills: ${resumeParsed.skills.join(", ")}\n`;
    if (resumeParsed.workHistory) {
      kb += "Work History:\n";
      resumeParsed.workHistory.forEach((w: any) => {
        kb += `- ${w.role} at ${w.company} (${w.duration})\n`;
      });
    }
    if (resumeParsed.riskFlags && resumeParsed.riskFlags.length > 0) {
      kb += "Areas to Probe:\n";
      resumeParsed.riskFlags.forEach((f: any) => {
        kb += `- ${f.type}: ${f.description}\n`;
      });
    }
    kb += "\n";
  }
  
  if (jdParsed) {
    kb += "=== JOB REQUIREMENTS ===\n";
    if (jdParsed.title) kb += `Title: ${jdParsed.title}\n`;
    if (jdParsed.requiredSkills) kb += `Required: ${jdParsed.requiredSkills.join(", ")}\n`;
    if (jdParsed.responsibilities) {
      kb += "Responsibilities:\n";
      jdParsed.responsibilities.forEach((r: string) => {
        kb += `- ${r}\n`;
      });
    }
    kb += "\n";
  }
  
  if (plan) {
    kb += "=== INTERVIEW PLAN ===\n";
    if (plan.phases) {
      plan.phases.forEach((phase: any) => {
        kb += `Phase: ${phase.name} (~${phase.duration}s)\n`;
        if (phase.objectives) {
          phase.objectives.forEach((o: string) => kb += `  - ${o}\n`);
        }
      });
    }
    if (plan.focusAreas) {
      kb += `Focus Areas: ${plan.focusAreas.join(", ")}\n`;
    }
    kb += "\n";
  }
  
  kb += INTERVIEWER_BEHAVIOR_RULES;
  
  return kb;
}

// ===================================================================
// AI Prompts
// ===================================================================

const RESUME_EXTRACTOR_PROMPT = `You are a resume parser. Extract structured information from the resume text.

Return a JSON object with these fields:
{
  "headline": "Professional headline/summary",
  "workHistory": [
    {
      "company": "Company name",
      "role": "Job title",
      "duration": "Time period",
      "highlights": ["Key achievements"]
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Brief description",
      "technologies": ["Tech used"],
      "impact": "Business impact"
    }
  ],
  "skills": ["List of technical and soft skills"],
  "education": [
    {
      "institution": "School name",
      "degree": "Degree type and field",
      "year": "Graduation year"
    }
  ],
  "certifications": ["Relevant certifications"],
  "riskFlags": [
    {
      "type": "gap|short_tenure|career_change|overqualified|underqualified",
      "description": "Description of the flag",
      "severity": "low|medium|high"
    }
  ]
}

Be thorough but concise. Identify any potential interview risk areas like employment gaps, frequent job changes, or skill mismatches.`;

const JD_EXTRACTOR_PROMPT = `You are a job description parser. Extract structured information from the JD text.

Return a JSON object with these fields:
{
  "title": "Job title",
  "company": "Company name if mentioned",
  "level": "entry|mid|senior|executive",
  "department": "Team/department",
  "responsibilities": ["Key responsibilities"],
  "requiredSkills": ["Must-have skills"],
  "preferredSkills": ["Nice-to-have skills"],
  "qualifications": ["Required qualifications"],
  "culture": "Company culture signals",
  "signals": ["Key phrases that indicate what they're really looking for"]
}

Focus on extracting what the interviewer will likely prioritize.`;

const GENERAL_DOC_EXTRACTOR_PROMPT = `Extract and structure the key information from this document.

Return a JSON object with relevant fields based on the content type.`;

const INTERVIEW_PLAN_GENERATOR_PROMPT = `You are an interview planning expert. Create a structured interview plan based on the provided context.

INPUTS:
- interviewType: HR/hiring_manager/technical/panel
- style: friendly/neutral/stress
- seniority: entry/mid/senior
- roleKit: role information and skills focus
- candidateProfile: parsed resume data
- jobDescription: parsed JD data

Generate a JSON interview plan with this structure:
{
  "phases": [
    {
      "name": "Warmup",
      "duration": 60,
      "objectives": ["Build rapport", "Set expectations"],
      "questionPatterns": ["Tell me about yourself", "Why this role?"]
    },
    {
      "name": "Resume Deep-Dive",
      "duration": 120,
      "objectives": ["Validate claims", "Assess depth"],
      "questionPatterns": ["Walk me through [specific project]", "What was your role in [achievement]?"]
    },
    {
      "name": "Role Skills",
      "duration": 120,
      "objectives": ["Test job-specific competencies"],
      "questionPatterns": ["Based on skills focus from role kit"]
    },
    {
      "name": "Scenario/Case",
      "duration": 90,
      "objectives": ["Assess problem-solving"],
      "questionPatterns": ["Situational questions relevant to role"]
    },
    {
      "name": "Wrap-up",
      "duration": 30,
      "objectives": ["Answer candidate questions", "Close positively"],
      "questionPatterns": ["Questions for me?", "Timeline communication"]
    }
  ],
  "triggers": [
    {
      "type": "skill_gap|risk_flag|claim_to_validate",
      "source": "resume|jd|role_kit",
      "probeRules": ["Specific follow-up approaches"]
    }
  ],
  "focusAreas": ["Top 3-5 things to assess based on resume vs JD fit"]
}

Customize phases and questions based on the interview type and candidate profile. For technical interviews, include more technical depth. For HR, focus on culture fit and soft skills.`;

const EVALUATOR_PROMPT = `You are an interview evaluator.

GOAL
Score the candidate's interview performance using the provided rubric. Be specific and evidence-based, quoting short transcript snippets as proof.

INPUTS
- rubric: dimensions + scoring guide
- roleKit + interviewType
- candidateProfile + jobDescription (for fit context)
- transcript (full)

SCORING RULES
- Score each dimension 1-5.
- Every score MUST include:
  - evidence: 1-3 short excerpts (max ~20 words each)
  - rationale: why this score
  - improvement: one concrete suggestion
- Also provide:
  - top strengths (max 5)
  - top risks (max 5)
  - hire recommendation: Strong Yes / Yes / Lean Yes / Lean No / No
  - confidence level: High/Med/Low (based on transcript coverage)

OUTPUT FORMAT (STRICT JSON)
{
  "overall": { "recommendation": "...", "confidence": "...", "summary": "..." },
  "dimension_scores": [
    {
      "dimension": "string",
      "score": 1-5,
      "evidence": ["...", "..."],
      "rationale": "...",
      "improvement": "..."
    }
  ],
  "strengths": ["...", "..."],
  "risks": ["...", "..."],
  "role_fit_notes": ["...", "..."]
}`;

const FEEDBACK_WRITER_PROMPT = `You are a career coach writing actionable feedback after an interview practice.

GOAL
Turn the evaluator JSON into a practical improvement plan.

RULES
- Keep it structured and specific.
- Provide:
  1) 3 key wins
  2) 3 key improvements
  3) rewrite 2 answers (better versions) using the candidate's context
  4) 7-day practice plan (10-15 min/day)
- Do not shame. Be direct and helpful.
- Avoid buzzwords.

OUTPUT FORMAT (STRICT JSON)
{
  "wins": ["...", "...", "..."],
  "improvements": ["...", "...", "..."],
  "better_answers": [
    { "question": "...", "better_answer": "..." },
    { "question": "...", "better_answer": "..." }
  ],
  "practice_plan_7_days": [
    { "day": 1, "task": "...", "time_minutes": 15 },
    { "day": 2, "task": "...", "time_minutes": 15 },
    { "day": 3, "task": "...", "time_minutes": 15 },
    { "day": 4, "task": "...", "time_minutes": 15 },
    { "day": 5, "task": "...", "time_minutes": 15 },
    { "day": 6, "task": "...", "time_minutes": 15 },
    { "day": 7, "task": "...", "time_minutes": 15 }
  ]
}`;

const INTERVIEWER_BEHAVIOR_RULES = `
=== INTERVIEWER BEHAVIOR RULES ===

1. VALIDATE CLAIMS: For any achievement or skill mentioned, ask "what you did" + "how" + "impact" + "evidence"
2. PROBE DEPTH: If an answer is shallow, ask for specifics (numbers, tradeoffs, decisions made)
3. CONSISTENCY CHECK: Cross-reference against the resume; clarify any contradictions
4. RISK AREAS: Respectfully test gaps, job changes, big claims, short tenures
5. FIT CHECK: Connect to role + company context; ask how they'll handle likely situations

STYLE RULES:
- Keep questions crisp (1 question at a time)
- Speak like a real interviewer (no coaching, no long lectures)
- For Friendly style: encouraging, warm, supportive
- For Neutral style: professional, matter-of-fact
- For Stress style: skeptical, time-pressured, challenging (but not rude)

PHASE TRACKING:
- Start with warmup/intro
- Progress through resume deep-dive
- Move to role-specific skills assessment
- Include scenario/case questions
- End with candidate questions and wrap-up
`;

export default interviewRouter;
