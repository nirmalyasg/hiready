import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { db } from "../db.js";
import { eq, desc, and } from "drizzle-orm";
import {
  roleKits,
  roleArchetypes,
  interviewRubrics,
  userDocuments,
  userProfileExtracted,
  interviewConfigs,
  interviewPlans,
  interviewSessions,
  interviewAnalysis,
  interviewArtifacts,
  jobTargets,
  userSkillPatterns,
  companies,
  questionPatterns,
  companyRoleBlueprints,
  userSkillMemory,
  jobPracticeLinks,
  codingExercises,
  roleTaskBlueprints,
  roleInterviewStructureDefaults,
  RoleKit,
  UserDocument,
  InterviewConfig,
  InterviewPlan,
  InterviewSession,
  InterviewRubric,
  InterviewAnalysisType,
} from "../../shared/schema.js";
import {
  extractSkillsFromText,
  combineSkillProfiles,
  matchExercisesToProfile,
  generateCompositeProblem,
  type CapabilityProfile,
} from "../lib/capability-vectorizer.js";
import { requireAuth } from "../middleware/auth.js";
import { getOpenAI } from "../utils/openai-client.js";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import {
  loadQuestionPatterns,
  getCompanyBlueprint,
  generateEnhancedPlan,
  classifyAnswer,
  selectProbe,
  updateUserSkillMemory,
  getUserSkillTrends,
  calculateReadinessScore,
  getJobReadinessSummary,
  generateSevenDayPlan,
  generateAIPracticePlan,
  type InterviewContext,
  type JobTargetForReadiness,
  type ReadinessScore,
} from "../lib/interview-intelligence.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const interviewRouter = Router();

// Normalize exercise content: ensure both singular and array fields are populated
function normalizePlanExercises(planJson: any, interviewMode?: string): any {
  const normalized = { ...planJson };
  
  // Handle coding problems
  if (normalized.codingProblems && normalized.codingProblems.length > 0) {
    // If arrays exist but singular doesn't, populate singular from first array item
    if (!normalized.codingProblem) {
      normalized.codingProblem = normalized.codingProblems[0];
    }
  } else if (normalized.codingProblem) {
    // If singular exists but array doesn't, create array from singular
    normalized.codingProblems = [normalized.codingProblem];
  }
  
  // Handle case studies
  if (normalized.caseStudies && normalized.caseStudies.length > 0) {
    if (!normalized.caseStudy) {
      normalized.caseStudy = normalized.caseStudies[0];
    }
  } else if (normalized.caseStudy) {
    normalized.caseStudies = [normalized.caseStudy];
  }
  
  // Ensure puzzles array exists
  if (!normalized.puzzles) {
    normalized.puzzles = [];
  }
  
  // Store the interview mode for downstream use
  if (interviewMode) {
    normalized.interviewMode = interviewMode;
  }
  
  return normalized;
}

function mapPhasesToFrontendFormat(planJson: any): any {
  if (!planJson || !planJson.phases) return planJson;
  
  return {
    ...planJson,
    phases: planJson.phases.map((phase: any) => ({
      name: phase.name,
      duration: phase.durationMins || phase.duration || 5,
      objectives: phase.objective || phase.objectives || [],
      questionPatterns: phase.patternTypes || phase.questionPatterns || [],
      phaseType: phase.phaseType || inferPhaseType(phase.id, phase.name),
    })),
  };
}

function inferPhaseType(id: string, name: string): string {
  const nameLower = name.toLowerCase();
  const idLower = id?.toLowerCase() || "";
  
  if (idLower === "intro" || nameLower.includes("introduction") || nameLower.includes("rapport")) {
    return "warmup";
  }
  if (idLower === "close" || nameLower.includes("closing") || nameLower.includes("wrap")) {
    return "wrap_up";
  }
  if (nameLower.includes("coding") || nameLower.includes("problem solving")) {
    return "coding";
  }
  if (nameLower.includes("case study") || nameLower.includes("case-study")) {
    return "case_study";
  }
  if (nameLower.includes("behavioral") || nameLower.includes("cultural") || nameLower.includes("motivation")) {
    return "behavioral";
  }
  if (nameLower.includes("technical") || nameLower.includes("skill") || nameLower.includes("domain")) {
    return "technical";
  }
  return "general";
}

const INTERVIEW_MODE_TO_TASK_TYPES: Record<string, string[]> = {
  coding_technical: ["coding_explain", "debugging", "code_modification", "code_review"],
  case_problem_solving: ["case_interview", "metrics_case", "metrics_investigation", "account_plan_case"],
  behavioral: ["behavioral_star"],
  hiring_manager: ["execution_scenario", "behavioral_star", "metrics_case"],
  system_deep_dive: ["code_review", "debugging", "critique"],
};

async function loadBlueprintsForMode(
  roleArchetypeId: string,
  interviewMode: string,
  seniority: string
): Promise<{ taskBlueprints: any[]; structureDefaults: any | null }> {
  const taskTypes = INTERVIEW_MODE_TO_TASK_TYPES[interviewMode] || [];
  
  let taskBlueprints: any[] = [];
  if (taskTypes.length > 0) {
    const allBlueprints = await db
      .select()
      .from(roleTaskBlueprints)
      .where(eq(roleTaskBlueprints.roleArchetypeId, roleArchetypeId));
    
    taskBlueprints = allBlueprints.filter(bp => {
      const matchesTaskType = taskTypes.includes(bp.taskType);
      const matchesSeniority = bp.difficultyBand === "all" || 
        bp.difficultyBand?.includes(seniority) ||
        bp.difficultyBand?.includes("entry-mid") && (seniority === "entry" || seniority === "mid") ||
        bp.difficultyBand?.includes("mid-senior") && (seniority === "mid" || seniority === "senior");
      
      return matchesTaskType && matchesSeniority;
    });
    
    if (taskBlueprints.length === 0) {
      taskBlueprints = allBlueprints.filter(bp => taskTypes.includes(bp.taskType));
    }
  }
  
  const seniorityMap: Record<string, string> = { entry: "l1_l2", mid: "l3_l4", senior: "l5_plus" };
  const mappedSeniority = seniorityMap[seniority] || "l3_l4";
  
  const [structureDefaults] = await db
    .select()
    .from(roleInterviewStructureDefaults)
    .where(and(
      eq(roleInterviewStructureDefaults.roleArchetypeId, roleArchetypeId),
      eq(roleInterviewStructureDefaults.seniority, mappedSeniority as any)
    ))
    .limit(1);
  
  return { taskBlueprints, structureDefaults };
}

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

interviewRouter.get("/role-archetypes", async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    
    let archetypes = await db
      .select()
      .from(roleArchetypes)
      .where(eq(roleArchetypes.isActive, true))
      .orderBy(roleArchetypes.name);
    
    if (category && typeof category === "string" && category !== "all") {
      archetypes = archetypes.filter(a => a.roleCategory === category);
    }
    
    res.json({ 
      success: true, 
      archetypes: archetypes.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        roleCategory: a.roleCategory,
        primarySkillDimensions: a.primarySkillDimensions || [],
        commonInterviewTypes: a.commonInterviewTypes || [],
        typicalTaskTypes: a.typicalTaskTypes || [],
      }))
    });
  } catch (error: any) {
    console.error("Error fetching role archetypes:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

import { getEnrichedInterviewPlan, getRolePracticeOptions } from "../lib/archetype-resolver.js";

interviewRouter.get("/role-kits/:id/practice-options", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: "Invalid role kit ID" });
    }
    
    const [kit] = await db.select().from(roleKits).where(eq(roleKits.id, id));
    
    if (!kit) {
      return res.status(404).json({ success: false, error: "Role kit not found" });
    }
    
    const roleArchetypeId = kit.roleArchetypeId || kit.domain;
    
    if (!roleArchetypeId) {
      return res.status(400).json({ success: false, error: "Role kit has no archetype mapping" });
    }
    
    // Use the new helper that reads directly from role_archetypes.common_interview_types
    const practiceOptions = await getRolePracticeOptions(roleArchetypeId, kit.level);
    
    if (practiceOptions.length === 0) {
      return res.status(500).json({ success: false, error: "No practice options available for this role" });
    }
    
    // Enrich options with role kit context
    const options = practiceOptions.map((option, index) => ({
      id: `rolekit-${kit.id}-${option.roundCategory}`,
      phaseId: option.id,
      roundCategory: option.roundCategory,
      label: option.label,
      description: option.description,
      practiceMode: option.practiceMode,
      typicalDuration: option.typicalDuration,
      icon: option.icon,
      taxonomy: {
        label: option.label,
        description: option.description,
        typicalDuration: option.typicalDuration,
      },
      roleContext: {
        roleKitId: kit.id,
        roleName: kit.name,
        level: kit.level,
        domain: kit.domain,
        skillsFocus: kit.skillsFocus || [],
        roleArchetypeId,
      },
      focusAreas: option.focusAreas,
      roleBlueprint: option.blueprints.length > 0 ? {
        taskType: option.blueprints[0].taskType,
        promptTemplate: option.blueprints[0].promptTemplate,
        expectedSignals: option.blueprints[0].expectedSignals,
        probeQuestions: option.blueprints[0].probeTree,
        difficultyBand: option.blueprints[0].difficultyBand,
      } : null,
    }));
    
    res.json({ 
      success: true, 
      roleKit: {
        id: kit.id,
        name: kit.name,
        level: kit.level,
        domain: kit.domain,
        description: kit.description,
        skillsFocus: kit.skillsFocus,
        estimatedDuration: kit.estimatedDuration,
        coreCompetencies: kit.coreCompetencies,
        defaultInterviewTypes: kit.defaultInterviewTypes,
      },
      options,
    });
  } catch (error: any) {
    console.error("Error fetching role kit practice options:", error);
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
      roleArchetypeId,
      interviewMode: requestedMode,
      resumeDocId: providedResumeDocId,
      jdDocId,
      companyNotesDocId,
      interviewType,
      style,
      seniority,
      mode,
      jobTargetId,
      exerciseCount,
      includePuzzles,
    } = req.body;
    
    const interviewModeTypes = ["coding_technical", "case_problem_solving", "behavioral", "hiring_manager", "system_deep_dive"];
    const isInterviewModeType = requestedMode && interviewModeTypes.includes(requestedMode);
    
    const interviewMode = requestedMode || mode || (roleKitId && !providedResumeDocId ? "role_based" : "custom");
    
    let resumeDocId = providedResumeDocId;
    
    const skipResumeModes = ["role_based", "skill_only", "interview_mode", ...interviewModeTypes];
    if (!skipResumeModes.includes(interviewMode) && !resumeDocId) {
      const [profile] = await db
        .select({ latestResumeDocId: userProfileExtracted.latestResumeDocId })
        .from(userProfileExtracted)
        .where(eq(userProfileExtracted.userId, userId));
      
      if (profile?.latestResumeDocId) {
        resumeDocId = profile.latestResumeDocId;
      } else {
        const [latestResume] = await db
          .select({ id: userDocuments.id })
          .from(userDocuments)
          .where(and(eq(userDocuments.userId, userId), eq(userDocuments.docType, "resume")))
          .orderBy(desc(userDocuments.createdAt))
          .limit(1);
        
        if (latestResume) {
          resumeDocId = latestResume.id;
        }
      }
      
      if (!resumeDocId) {
        return res.status(400).json({ success: false, error: "No resume found. Please upload a resume first." });
      }
    }
    
    if (interviewMode === "role_based" && !roleKitId) {
      return res.status(400).json({ success: false, error: "Role kit is required for role-based interviews" });
    }
    
    if (isInterviewModeType && !roleArchetypeId) {
      return res.status(400).json({ success: false, error: "Role archetype is required for interview mode practice" });
    }
    
    if (jobTargetId) {
      const [jobTarget] = await db
        .select()
        .from(jobTargets)
        .where(and(eq(jobTargets.id, jobTargetId), eq(jobTargets.userId, userId)));
      
      if (!jobTarget) {
        return res.status(404).json({ success: false, error: "Job target not found" });
      }
    }
    
    const modeToInterviewType: Record<string, string> = {
      coding_technical: "technical",
      case_problem_solving: "case_study",
      behavioral: "behavioral",
      hiring_manager: "hiring_manager",
      system_deep_dive: "technical",
    };
    
    const resolvedInterviewType = isInterviewModeType 
      ? modeToInterviewType[requestedMode] || "behavioral"
      : interviewType || "behavioral";
    
    const [config] = await db
      .insert(interviewConfigs)
      .values({
        userId,
        roleKitId: roleKitId || null,
        roleArchetypeId: roleArchetypeId || null,
        interviewMode: interviewMode as any,
        resumeDocId: resumeDocId || null,
        jdDocId: jdDocId || null,
        companyNotesDocId: companyNotesDocId || null,
        interviewType: resolvedInterviewType as any,
        style: style || "neutral",
        seniority: seniority || "entry",
        jobTargetId: jobTargetId || null,
        exerciseCount: exerciseCount || 1,
        includePuzzles: includePuzzles || false,
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
    const { roundCategory, typicalDuration } = req.body || {};
    
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
    let jobTargetData: any = null;
    let roleArchetypeData: any = null;
    let blueprintData: { taskBlueprints: any[]; structureDefaults: any | null } = { taskBlueprints: [], structureDefaults: null };
    
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
    
    if (config.roleArchetypeId) {
      const [archetype] = await db
        .select()
        .from(roleArchetypes)
        .where(eq(roleArchetypes.id, config.roleArchetypeId));
      roleArchetypeData = archetype;
      
      if (config.interviewMode && INTERVIEW_MODE_TO_TASK_TYPES[config.interviewMode]) {
        blueprintData = await loadBlueprintsForMode(
          config.roleArchetypeId,
          config.interviewMode,
          config.seniority
        );
      }
    }
    
    if (config.jobTargetId) {
      const [job] = await db.select().from(jobTargets).where(eq(jobTargets.id, config.jobTargetId));
      if (job) {
        jobTargetData = {
          roleTitle: job.roleTitle,
          company: job.companyName,
          location: job.location,
          description: job.jdText,
          parsedJd: job.jdParsed,
        };
        if (!jdParsed && job.jdParsed) {
          jdParsed = job.jdParsed;
        }
      }
    }
    
    const planContext: any = {
      interviewType: config.interviewType,
      interviewMode: config.interviewMode,
      style: config.style,
      seniority: config.seniority,
      exerciseCount: config.exerciseCount || 1,
      includePuzzles: config.includePuzzles || false,
      roleKit: roleKitData ? { name: roleKitData.name, domain: roleKitData.domain, skillsFocus: roleKitData.skillsFocus } : null,
      roleArchetype: roleArchetypeData ? { id: roleArchetypeData.id, name: roleArchetypeData.name, domain: roleArchetypeData.domain } : null,
      candidateProfile: resumeParsed,
      jobDescription: jdParsed,
      jobTarget: jobTargetData,
      roundCategory: roundCategory || null,
      targetDuration: typicalDuration || "30-45 min",
    };
    
    if (blueprintData.taskBlueprints.length > 0) {
      planContext.taskBlueprints = blueprintData.taskBlueprints.map(bp => ({
        taskType: bp.taskType,
        difficultyBand: bp.difficultyBand,
        promptTemplate: bp.promptTemplate,
        expectedSignals: bp.expectedSignalsJson,
        probeTree: bp.probeTreeJson,
      }));
    }
    
    if (blueprintData.structureDefaults) {
      planContext.structureDefaults = {
        phases: blueprintData.structureDefaults.phasesJson,
        emphasisWeights: blueprintData.structureDefaults.emphasisWeightsJson,
      };
    }
    
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
    
    const rawPlanJson = JSON.parse(response.choices[0].message.content || "{}");
    
    // Normalize exercise content: populate both singular and array fields
    const normalizedPlan = normalizePlanExercises(rawPlanJson, planContext.interviewMode);
    const mappedPlanJson = mapPhasesToFrontendFormat(normalizedPlan);
    
    const [plan] = await db
      .insert(interviewPlans)
      .values({
        interviewConfigId: configId,
        planJson: mappedPlanJson,
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
    
    let planData: any = null;
    if (interviewPlanId) {
      const [plan] = await db.select().from(interviewPlans).where(eq(interviewPlans.id, interviewPlanId));
      if (plan) {
        planData = plan.planJson;
      }
    }
    
    // Add case study data if interview type is case_study
    if (config.interviewType === 'case_study') {
      if (!planData) {
        planData = { phases: [], focusAreas: [] };
      }
      
      // Generate case study context from plan phases or create default
      const caseStudyPhase = planData.phases?.find((p: any) => 
        p.name?.toLowerCase().includes('case') || 
        p.practiceMode === 'case_study' ||
        p.category === 'case_study'
      );
      
      planData.caseStudy = {
        id: `case-${config.id}`,
        title: caseStudyPhase?.name || 'Business Case Study',
        prompt: caseStudyPhase?.objectives?.join('. ') || 
          'You will be presented with a business problem to analyze. Structure your approach, identify key factors, and present your recommendations.',
        context: planData.focusAreas?.join(', ') || 'Business strategy and problem-solving',
        caseType: 'strategy',
        difficulty: config.seniority === 'senior' ? 'Hard' : config.seniority === 'entry' ? 'Easy' : 'Medium',
        evaluationFocus: ['Problem structuring', 'Analytical thinking', 'Communication', 'Recommendations'],
        expectedDurationMinutes: caseStudyPhase?.duration || 30,
      };
    }
    
    res.json({ success: true, session: { ...session, plan: planData } });
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

// Code Review Endpoint - Uses OpenAI to review user's code submission
interviewRouter.post("/session/:id/code-review", requireAuth, async (req: Request, res: Response) => {
  try {
    const { code, language, challengeId, challengeTitle, challengeDescription, examples } = req.body;
    
    if (!code || !challengeDescription) {
      return res.status(400).json({ 
        success: false, 
        error: "Code and challenge description are required" 
      });
    }

    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const examplesText = examples?.map((ex: any) => 
      `Input: ${ex.input}\nExpected Output: ${ex.output}${ex.explanation ? `\nExplanation: ${ex.explanation}` : ''}`
    ).join('\n\n') || 'No examples provided';
    
    const prompt = `You are an expert code reviewer evaluating a candidate's solution during a technical interview.

## Problem
**Title:** ${challengeTitle || 'Coding Challenge'}
**Description:** ${challengeDescription}

## Examples
${examplesText}

## Candidate's Solution (${language || 'Unknown language'})
\`\`\`${language || ''}
${code}
\`\`\`

## Your Task
Evaluate this solution and provide a structured review. Be constructive but honest.

Respond in this exact JSON format:
{
  "isCorrect": boolean (true if the solution would produce correct output for the examples),
  "score": number (0-100, considering correctness, efficiency, and code quality),
  "feedback": "2-3 sentence overall assessment",
  "suggestions": ["specific improvement 1", "specific improvement 2", ...],
  "efficiency": "Brief assessment of time/space complexity",
  "style": "Brief assessment of code style and readability"
}

Only respond with valid JSON, no additional text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });
    
    const content = response.choices[0]?.message?.content || '';
    
    // Parse JSON response
    let review;
    try {
      // Extract JSON from response (in case there's any extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        review = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      review = {
        isCorrect: false,
        score: 0,
        feedback: "Unable to analyze the code. Please ensure your solution is properly formatted.",
        suggestions: ["Try writing a complete solution"],
        efficiency: "N/A",
        style: "N/A"
      };
    }
    
    res.json({ success: true, review });
  } catch (error: any) {
    console.error("Error reviewing code:", error);
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
    
    // Map plan data and add case study if needed
    let mappedPlan: any = mapPhasesToFrontendFormat(plan?.planJson);
    
    // Add default case study data only if interview type is case_study and no case study exists in plan
    const isCaseStudyMode = config?.interviewType === 'case_study' || config?.interviewMode === 'case_problem_solving';
    
    if (isCaseStudyMode && mappedPlan && !mappedPlan.caseStudy) {
      const caseStudyPhase = mappedPlan.phases?.find((p: any) => 
        p.name?.toLowerCase().includes('case') || 
        p.practiceMode === 'case_study' ||
        p.category === 'case_study'
      );
      
      mappedPlan.caseStudy = {
        id: `case-${config.id}`,
        title: caseStudyPhase?.name || 'Business Case Study',
        prompt: caseStudyPhase?.objectives?.join('. ') || 
          'You will be presented with a business problem to analyze. Structure your approach, identify key factors, and present your recommendations.',
        context: mappedPlan.focusAreas?.join(', ') || 'Business strategy and problem-solving',
        caseType: 'strategy',
        difficulty: config.seniority === 'senior' ? 'Hard' : config.seniority === 'entry' ? 'Easy' : 'Medium',
        evaluationFocus: ['Problem structuring', 'Analytical thinking', 'Communication', 'Recommendations'],
        expectedDurationMinutes: caseStudyPhase?.duration || 30,
      };
    } else if (isCaseStudyMode && !mappedPlan) {
      mappedPlan = {
        phases: [],
        focusAreas: [],
        caseStudy: {
          id: `case-${config.id}`,
          title: 'Business Case Study',
          prompt: 'You will be presented with a business problem to analyze. Structure your approach, identify key factors, and present your recommendations.',
          context: 'Business strategy and problem-solving',
          caseType: 'strategy',
          difficulty: config.seniority === 'senior' ? 'Hard' : config.seniority === 'entry' ? 'Easy' : 'Medium',
          evaluationFocus: ['Problem structuring', 'Analytical thinking', 'Communication', 'Recommendations'],
          expectedDurationMinutes: 30,
        }
      };
    }
    
    res.json({ 
      success: true, 
      session: {
        ...session,
        roleKit,
        config,
        plan: mappedPlan,
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
    const { transcript, transcriptId, codeSubmission, caseStudyNotes, codingChallenge, caseStudyChallenge } = req.body;
    
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
      codeSubmission: codeSubmission || null,
      caseStudyNotes: caseStudyNotes || null,
      codingChallenge: codingChallenge ? {
        title: codingChallenge.title,
        description: codingChallenge.description,
        difficulty: codingChallenge.difficulty,
      } : null,
      caseStudyChallenge: caseStudyChallenge ? {
        title: caseStudyChallenge.title,
        prompt: caseStudyChallenge.prompt,
        caseType: caseStudyChallenge.caseType,
      } : null,
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
    
    // Update skill patterns for career memory (failure pattern detection)
    const userId = req.user!.id;
    const dimensionScores = evaluatorResult.dimension_scores || [];
    
    for (const dimScore of dimensionScores) {
      if (!dimScore.dimension || typeof dimScore.score !== "number") continue;
      
      const [existingPattern] = await db
        .select()
        .from(userSkillPatterns)
        .where(and(
          eq(userSkillPatterns.userId, userId),
          eq(userSkillPatterns.dimension, dimScore.dimension)
        ));
      
      if (existingPattern) {
        const newOccurrences = (existingPattern.occurrences || 0) + 1;
        const oldAvg = existingPattern.avgScore || dimScore.score;
        const newAvg = ((oldAvg * (newOccurrences - 1)) + dimScore.score) / newOccurrences;
        
        let trend: "improving" | "stagnant" | "declining" = "stagnant";
        if (dimScore.score > oldAvg + 0.3) trend = "improving";
        else if (dimScore.score < oldAvg - 0.3) trend = "declining";
        
        await db
          .update(userSkillPatterns)
          .set({
            occurrences: newOccurrences,
            avgScore: newAvg,
            trend,
            lastSeenAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userSkillPatterns.id, existingPattern.id));
      } else {
        await db
          .insert(userSkillPatterns)
          .values({
            userId,
            dimension: dimScore.dimension,
            occurrences: 1,
            avgScore: dimScore.score,
            trend: "stagnant",
            lastSeenAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
      }
    }
    
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
    let interviewType: string | null = null;
    let interviewMode: string | null = null;
    let roleKitInfo: { id: number; name: string; domain: string } | null = null;
    let jdSkills: string[] = [];

    if (session) {
      const [config] = await db
        .select()
        .from(interviewConfigs)
        .where(eq(interviewConfigs.id, session.interviewConfigId));

      if (config) {
        interviewType = config.interviewType;
        interviewMode = config.interviewMode;

        if (config.roleKitId) {
          const [kit] = await db.select().from(roleKits).where(eq(roleKits.id, config.roleKitId));
          if (kit) {
            roleKitInfo = { id: kit.id, name: kit.name, domain: kit.domain };
          }
        }

        if (config.jobTargetId) {
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

        // Extract JD skills from parsed job description document
        if (config.jdDocId) {
          const [jdDoc] = await db.select().from(userDocuments).where(eq(userDocuments.id, config.jdDocId));
          if (jdDoc?.parsedJson) {
            const parsed = jdDoc.parsedJson as any;
            jdSkills = parsed.requiredSkills || parsed.skills || parsed.technicalSkills || [];
            if (parsed.softSkills) {
              jdSkills = [...jdSkills, ...parsed.softSkills];
            }
          }
        }
      }
    }
    
    res.json({ 
      success: true, 
      analysis, 
      jobContext,
      interviewType,
      interviewMode,
      roleKitInfo,
      jdSkills,
    });
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
        let jobTarget: { id: string; companyName: string | null; roleTitle: string } | null = null;
        
        if (config?.roleKitId) {
          const [kit] = await db.select().from(roleKits).where(eq(roleKits.id, config.roleKitId));
          roleKit = kit;
        }
        
        if (config?.jobTargetId) {
          const [job] = await db.select({
            id: jobTargets.id,
            companyName: jobTargets.companyName,
            roleTitle: jobTargets.roleTitle,
          }).from(jobTargets).where(eq(jobTargets.id, config.jobTargetId));
          jobTarget = job || null;
        }
        
        const [a] = await db.select().from(interviewAnalysis).where(eq(interviewAnalysis.interviewSessionId, session.id));
        analysis = a;
        
        return {
          ...session,
          config: config ? {
            id: config.id,
            interviewType: config.interviewType,
            interviewMode: config.interviewMode,
            roleKitId: config.roleKitId,
            jobTargetId: config.jobTargetId,
          } : null,
          roleKit,
          jobTarget,
          analysis: analysis ? {
            id: analysis.id,
            overallRecommendation: analysis.overallRecommendation,
            summary: analysis.summary,
            dimensionScores: analysis.dimensionScores,
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

const INTERVIEW_PLAN_GENERATOR_PROMPT = `You are an interview planning expert. Create a CUSTOMIZED interview plan based on the provided context.

INPUTS:
- interviewType: "hr" | "hiring_manager" | "technical" | "panel" | "behavioral" | "case_study"
- interviewMode: "coding_technical" | "case_problem_solving" | "behavioral" | "hiring_manager" | "system_deep_dive" (optional - focused practice modes)
- style: "friendly" | "neutral" | "stress"
- seniority: "entry" | "mid" | "senior"
- exerciseCount: 1 | 2 | 3 (number of coding/case exercises to include - default 1)
- includePuzzles: true | false (whether to include brain teasers/puzzles - default false)
- roleKit: role information and skills focus (may be null)
- roleArchetype: role category like "core_software_engineer", "data_analyst", "product_manager" (may be null)
- candidateProfile: parsed resume data (may be null)
- jobDescription: parsed JD data (may be null)
- jobTarget: target job details including company, role title, description
- taskBlueprints: predefined question templates and expected signals for this role+mode (may be null)
- structureDefaults: recommended phase structure and scoring weights for this role (may be null)

CRITICAL CUSTOMIZATION RULES:

1. INTERVIEW MODE (if provided) determines the focus:
   - "coding_technical": Live coding, debugging, code review - use coding/debugging blueprints
   - "case_problem_solving": Business cases, metrics diagnosis, strategic thinking
   - "behavioral": STAR-format questions, ownership, conflict resolution, leadership
   - "hiring_manager": Role fit, team dynamics, execution scenarios, situational questions
   - "system_deep_dive": Architecture, design patterns, deep technical probing

2. TASK BLUEPRINTS (if provided):
   - USE the promptTemplate from blueprints as question patterns
   - ASSESS candidates based on expectedSignals from blueprints
   - Use probeTree for follow-up questions when answers are vague or strong
   - Adapt difficulty based on seniority level

3. STRUCTURE DEFAULTS (if provided):
   - Follow the phase structure (phases[]) from structureDefaults
   - Use emphasisWeights to prioritize dimensions in evaluation
   - Adjust phase durations proportionally for 10-15 min total

4. INTERVIEW TYPE fallback (if no interviewMode):
   - "hr": Focus on culture fit, motivation, career goals, behavioral questions, soft skills
   - "hiring_manager": Focus on role fit, team dynamics, problem-solving, situational questions
   - "technical": Focus on technical skills, coding concepts, system design, hands-on scenarios
   - "panel": Mix of all above with multiple perspectives

5. STYLE determines the tone and pressure:
   - "friendly": Supportive, encouraging follow-ups, hints when stuck, conversational
   - "neutral": Professional, balanced, standard interview pacing
   - "stress": Challenging, probing deeply, time pressure, pushback on answers

6. JOB TARGET context:
   - If jobTarget is provided, tailor ALL questions to that specific role and company
   - Reference the company name and role in warmup questions
   - Use job description requirements to create relevant scenario questions
   - Focus skills assessment on what the JD emphasizes

7. CANDIDATE PROFILE:
   - If candidateProfile (resume) is provided, create specific questions about their experience
   - Identify potential gaps between resume and job requirements
   - Probe claimed achievements and skills

8. EXERCISE COUNT (for coding_technical and case_problem_solving modes):
   - exerciseCount determines how many distinct problems/cases to include
   - If exerciseCount=1: Include 1 focused exercise (default)
   - If exerciseCount=2: Include 2 different exercises covering different skills
   - If exerciseCount=3: Include 3 exercises for comprehensive assessment
   - Each exercise should test different aspects of the role
   - Adjust phase durations proportionally (more exercises = slightly longer)

9. PUZZLES AND BRAIN TEASERS (when includePuzzles=true):
   - Include 1-2 logical puzzles, estimation questions, or brain teasers
   - Puzzles should be relevant to the role (e.g., Fermi estimation for PM, logic puzzles for SWE)
   - Add a "Puzzle" phase of 3-5 minutes to the interview structure
   - Example puzzle types:
     * Estimation: "How many golf balls fit in a school bus?"
     * Logic: "You have 8 balls, one is heavier. Find it in 2 weighings."
     * Market sizing: "Estimate the market size for electric scooters in NYC."
     * Pattern recognition: "What comes next in this sequence?"
   - Tailor puzzle difficulty to seniority level

PHASE DURATION GUIDELINES (durationMins field, in MINUTES):
IMPORTANT: All practice interviews are LIMITED TO 10-15 MINUTES TOTAL for cost optimization.
Ignore any longer "targetDuration" - always create a focused 10-15 minute practice session.

Standard interview structure (3-4 phases, 12-15 min total):
- Warmup/Introduction: 2 min
- Main Phase 1: 5 min (core questions)
- Main Phase 2: 5 min (follow-up/deeper dive)
- Wrap-up: 2 min

CRITICAL RULES:
1. Total interview duration MUST be between 10-15 minutes
2. NO single phase can exceed 5 minutes
3. Focus on the most important 3-5 questions for this interview type
4. The sum of all phase durationMins MUST equal 12-15 minutes

Generate a JSON interview plan with this structure:
{
  "phases": [
    {
      "name": "Phase name (e.g., Warmup, Technical Deep-Dive, Behavioral, Case Study, Wrap-up)",
      "durationMins": 10,
      "objectives": ["What to assess in this phase"],
      "questionPatterns": ["Specific question templates tailored to the context"]
    }
  ],
  "triggers": [
    {
      "type": "skill_gap|risk_flag|claim_to_validate",
      "source": "resume|jd|job_target",
      "probeRules": ["How to follow up based on this trigger"]
    }
  ],
  "focusAreas": ["Top 3-5 specific things to assess based on ALL inputs"],
  "interviewerTone": "Description of how the interviewer should behave based on style",
  "keyQuestions": ["5-7 most important questions to ask, fully customized to this specific interview"],
  "codingProblem": null,
  "codingProblems": [],
  "caseStudy": null,
  "caseStudies": [],
  "puzzles": []
}

5. CODING PROBLEMS (for technical interviews only):
   When interviewType is "technical", you MUST include a coding problem tailored to the role and JD:
   - For Software Engineer roles: algorithm/data structure problems
   - For Data roles: SQL queries, data manipulation
   - For Frontend roles: DOM manipulation, React components
   - For Backend roles: API design, system problems
   
   The codingProblem field should be:
   {
     "id": "unique-problem-id",
     "title": "Problem Title",
     "difficulty": "Easy|Medium|Hard",
     "description": "Full problem description with context. Be specific about what the function should do, inputs, and expected outputs.",
     "examples": [
       { "input": "example input", "output": "expected output", "explanation": "optional explanation" }
     ],
     "constraints": ["constraint 1", "constraint 2"],
     "hints": ["hint 1 for when candidate is stuck"],
     "starterCode": {
       "javascript": "function solution(input) {\\n  // Your code here\\n}",
       "python": "def solution(input):\\n    # Your code here\\n    pass"
     }
   }
   
   Make the problem RELEVANT to the job requirements. For example:
   - If JD mentions "React", give a component optimization problem
   - If JD mentions "algorithms", give a classic DSA problem
   - If JD mentions "data processing", give a data transformation problem

   When exerciseCount > 1, populate the "codingProblems" array with multiple distinct problems:
   - Each problem should test different skills (e.g., arrays, trees, strings, dynamic programming)
   - Vary difficulty slightly across problems
   - Ensure they are all relevant to the role

6. CASE STUDIES (for case_problem_solving mode or case_study interview type):
   When interviewMode is "case_problem_solving" or interviewType is "case_study", you MUST include a case study:
   {
     "id": "unique-case-id",
     "title": "Case Study Title",
     "category": "strategy|product|metrics|market_sizing|operations|financial",
     "difficulty": "Easy|Medium|Hard",
     "scenario": "The full scenario description. Set up the business context clearly - company background, current situation, the challenge they face. Make it 2-3 paragraphs.",
     "prompt": "The specific question or task the candidate needs to address.",
     "timeLimit": 10,
     "materials": [
       {
         "id": "material-1",
         "title": "Revenue Data",
         "type": "table|text|data|chart",
         "content": "The actual data or text content. For tables, use markdown format."
       }
     ],
     "evaluationCriteria": ["Framework application", "Quantitative analysis", "Logical structure", "Actionable recommendations"],
     "hints": ["Consider the unit economics", "Think about customer segments"],
     "sampleApproach": "A brief outline of how a strong candidate might structure their answer"
   }

   Tailor the case to the role:
   - PM roles: Product strategy, feature prioritization, go-to-market
   - Data roles: Metrics investigation, A/B test analysis, data interpretation
   - Strategy roles: Market entry, competitive analysis, M&A evaluation
   - Sales roles: Account planning, territory analysis, deal strategy
   - Operations roles: Process optimization, supply chain, capacity planning

   When exerciseCount > 1 for case studies, generate multiple distinct cases in a "caseStudies" array.

7. PUZZLES AND BRAIN TEASERS (when includePuzzles is true):
   Include puzzles in the "puzzles" array:
   [
     {
       "id": "puzzle-1",
       "type": "estimation|logic|pattern|market_sizing",
       "title": "Puzzle Title",
       "difficulty": "Easy|Medium|Hard",
       "question": "The full puzzle question",
       "hints": ["Hint 1 if stuck"],
       "approach": "Brief description of how to approach this",
       "solution": "The solution or reasonable answer range"
     }
   ]

   Match puzzles to the role:
   - PM/Strategy: Market sizing, Fermi estimation
   - Engineering: Logic puzzles, algorithmic thinking
   - Data: Statistical reasoning, probability puzzles
   - General: Pattern recognition, lateral thinking

IMPORTANT: Do NOT use generic placeholder questions. Every question should be specific to the job target, candidate profile, and interview type provided. If company/role info is available, mention them by name.`;


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

// =====================
// Interview Intelligence Endpoints
// =====================

interviewRouter.get("/intelligence/patterns", requireAuth, async (req: Request, res: Response) => {
  try {
    const { roleCategory = "general", interviewType = "hiring_manager", types } = req.query;
    const patternTypes = types ? (types as string).split(",") : ["resume_claim", "behavioral", "jd_requirement"];
    
    const patterns = await loadQuestionPatterns(
      roleCategory as string,
      interviewType as string,
      patternTypes
    );
    
    res.json({ success: true, patterns, count: patterns.length });
  } catch (error: any) {
    console.error("Error loading patterns:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.get("/intelligence/companies", async (req: Request, res: Response) => {
  try {
    const { tier, archetype, search } = req.query;
    
    const conditions = [];
    
    if (tier) {
      conditions.push(eq(companies.tier, tier as any));
    }
    if (archetype) {
      conditions.push(eq(companies.archetype, archetype as any));
    }
    
    let results;
    if (conditions.length > 0) {
      results = await db.select().from(companies).where(and(...conditions)).limit(100);
    } else {
      results = await db.select().from(companies).limit(100);
    }
    
    if (search) {
      const searchLower = (search as string).toLowerCase();
      results = results.filter((c) => c.name.toLowerCase().includes(searchLower));
    }
    
    res.json({ success: true, companies: results });
  } catch (error: any) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.get("/intelligence/company/:name/blueprint", async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { roleCategory = "swe" } = req.query;
    
    const result = await getCompanyBlueprint(name, roleCategory as string);
    
    if (!result) {
      return res.status(404).json({ success: false, error: "Company not found" });
    }
    
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error fetching blueprint:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.post("/intelligence/plan/generate", requireAuth, async (req: Request, res: Response) => {
  try {
    const context: InterviewContext = req.body;
    
    if (!context.roleCategory || !context.interviewType || !context.seniority) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields: roleCategory, interviewType, seniority" 
      });
    }
    
    context.style = context.style || "neutral";
    
    if (context.companyName && !context.blueprintFocus) {
      const blueprintData = await getCompanyBlueprint(context.companyName, context.roleCategory);
      if (blueprintData?.blueprint) {
        const interviewRounds = blueprintData.blueprint.interviewRounds as { type: string; focus: string[] }[] || [];
        const focusAreas = interviewRounds.flatMap(r => r.focus || []);
        const focusLower = focusAreas.map(f => f.toLowerCase());
        
        const hasCodingRounds = focusLower.some(f => 
          ["coding", "dsa", "algorithms", "machine-coding", "leetcode"].includes(f)
        );
        const hasCaseStudyRounds = focusLower.some(f => 
          ["case", "case-study", "estimation", "market-sizing", "business-case"].includes(f)
        );
        const hasSystemDesign = focusLower.some(f => 
          ["system-design", "system_design", "architecture", "scale"].includes(f)
        );
        
        context.blueprintFocus = {
          focusAreas,
          hasCodingRounds,
          hasCaseStudyRounds,
          hasSystemDesign,
          interviewStyle: blueprintData.blueprint.rubricOverrides?.style,
          notes: blueprintData.blueprint.notes,
        };
        context.companyArchetype = blueprintData.company.archetype;
      }
    }
    
    const plan = await generateEnhancedPlan(context);
    
    res.json({ success: true, plan });
  } catch (error: any) {
    console.error("Error generating enhanced plan:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.post("/intelligence/answer/classify", requireAuth, async (req: Request, res: Response) => {
  try {
    const { answer, question, context } = req.body;
    
    if (!answer || !question) {
      return res.status(400).json({ success: false, error: "Missing answer or question" });
    }
    
    const classification = await classifyAnswer(answer, question, context || {});
    
    res.json({ success: true, classification });
  } catch (error: any) {
    console.error("Error classifying answer:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.post("/intelligence/probe/select", requireAuth, async (req: Request, res: Response) => {
  try {
    const { pattern, classification, probeCount = 0 } = req.body;
    
    if (!pattern || !classification) {
      return res.status(400).json({ success: false, error: "Missing pattern or classification" });
    }
    
    const decision = selectProbe(pattern, classification, probeCount);
    
    res.json({ success: true, decision });
  } catch (error: any) {
    console.error("Error selecting probe:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.get("/intelligence/skill-memory", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { roleCategory } = req.query;
    
    const trends = await getUserSkillTrends(userId, roleCategory as string | undefined);
    
    res.json({ success: true, ...trends });
  } catch (error: any) {
    console.error("Error fetching skill memory:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.post("/intelligence/skill-memory/update", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { roleCategory, dimensionScores, sessionId } = req.body;
    
    if (!roleCategory || !dimensionScores?.length) {
      return res.status(400).json({ success: false, error: "Missing roleCategory or dimensionScores" });
    }
    
    await updateUserSkillMemory(userId, roleCategory, dimensionScores, sessionId);
    
    res.json({ success: true, message: "Skill memory updated" });
  } catch (error: any) {
    console.error("Error updating skill memory:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.post("/practice-link", requireAuth, async (req: Request, res: Response) => {
  try {
    const { jobTargetId, interviewConfigId, interviewSessionId, exerciseSessionId, sessionType } = req.body;
    
    if (!jobTargetId || !sessionType) {
      return res.status(400).json({ success: false, error: "Missing jobTargetId or sessionType" });
    }
    
    const [link] = await db.insert(jobPracticeLinks).values({
      jobTargetId,
      interviewConfigId: interviewConfigId || null,
      interviewSessionId: interviewSessionId || null,
      exerciseSessionId: exerciseSessionId || null,
      sessionType,
    }).returning();
    
    res.json({ success: true, link });
  } catch (error: any) {
    console.error("Error creating practice link:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.get("/practice-links/:jobTargetId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { jobTargetId } = req.params;
    
    const links = await db
      .select()
      .from(jobPracticeLinks)
      .where(eq(jobPracticeLinks.jobTargetId, jobTargetId))
      .orderBy(jobPracticeLinks.createdAt);
    
    res.json({ success: true, links });
  } catch (error: any) {
    console.error("Error fetching practice links:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================
// Readiness Score Endpoints
// =====================

interviewRouter.get("/readiness/:jobTargetId", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { jobTargetId } = req.params;
    
    const [job] = await db
      .select()
      .from(jobTargets)
      .where(and(eq(jobTargets.id, parseInt(jobTargetId)), eq(jobTargets.userId, userId)))
      .limit(1);
    
    if (!job) {
      return res.status(404).json({ success: false, error: "Job target not found" });
    }
    
    const jobForReadiness: JobTargetForReadiness = {
      id: job.id,
      roleTitle: job.roleTitle || "General",
      company: job.company || undefined,
      jdText: job.jdRaw || undefined,
      mustHaveSkills: (job.jdParsed as any)?.mustHave || [],
      niceToHaveSkills: (job.jdParsed as any)?.niceToHave || [],
      seniority: (job.jdParsed as any)?.senioritySignal || undefined,
    };
    
    const roleCategory = detectRoleCategoryFromTitle(job.roleTitle || "");
    const readiness = await calculateReadinessScore(userId, jobForReadiness, roleCategory);
    
    res.json({ 
      success: true, 
      readiness,
      job: {
        id: job.id,
        roleTitle: job.roleTitle,
        company: job.company,
        status: job.status,
      }
    });
  } catch (error: any) {
    console.error("Error calculating readiness:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.get("/readiness-summary", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const jobs = await db
      .select()
      .from(jobTargets)
      .where(eq(jobTargets.userId, userId))
      .orderBy(desc(jobTargets.priority));
    
    if (jobs.length === 0) {
      return res.json({ 
        success: true, 
        summary: {
          jobs: [],
          overallFocus: ["Save some job targets to start tracking your readiness"],
          commonWeaknesses: [],
        }
      });
    }
    
    const jobsForReadiness: JobTargetForReadiness[] = jobs.map(job => ({
      id: job.id,
      roleTitle: job.roleTitle || "General",
      company: job.company || undefined,
      jdText: job.jdRaw || undefined,
      mustHaveSkills: (job.jdParsed as any)?.mustHave || [],
      niceToHaveSkills: (job.jdParsed as any)?.niceToHave || [],
      seniority: (job.jdParsed as any)?.senioritySignal || undefined,
    }));
    
    const summary = await getJobReadinessSummary(userId, jobsForReadiness);
    
    res.json({ success: true, summary });
  } catch (error: any) {
    console.error("Error fetching readiness summary:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

function detectRoleCategoryFromTitle(roleTitle: string): string {
  const lower = roleTitle.toLowerCase();
  if (lower.includes("engineer") || lower.includes("developer") || lower.includes("swe")) return "swe";
  if (lower.includes("product") || lower.includes("pm")) return "pm";
  if (lower.includes("data") || lower.includes("analyst") || lower.includes("scientist")) return "data";
  if (lower.includes("design") || lower.includes("ux") || lower.includes("ui")) return "design";
  if (lower.includes("sales") || lower.includes("account")) return "sales";
  if (lower.includes("manager") || lower.includes("director") || lower.includes("lead")) return "manager";
  return "general";
}

// =====================
// Coach Agent Endpoints (7-Day Practice Plans)
// =====================

interviewRouter.post("/coach/plan", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { 
      jobTargetId, 
      dailyTimeAvailable = 45, 
      useAI = true,
      interviewDate,
    } = req.body;
    
    let jobForReadiness: JobTargetForReadiness | undefined;
    let roleCategory = "general";
    
    if (jobTargetId) {
      const [job] = await db
        .select()
        .from(jobTargets)
        .where(and(eq(jobTargets.id, parseInt(jobTargetId)), eq(jobTargets.userId, userId)))
        .limit(1);
      
      if (job) {
        jobForReadiness = {
          id: job.id,
          roleTitle: job.roleTitle || "General",
          company: job.company || undefined,
          jdText: job.jdRaw || undefined,
          mustHaveSkills: (job.jdParsed as any)?.mustHave || [],
          niceToHaveSkills: (job.jdParsed as any)?.niceToHave || [],
          seniority: (job.jdParsed as any)?.senioritySignal || undefined,
        };
        roleCategory = detectRoleCategoryFromTitle(job.roleTitle || "");
      }
    }
    
    const readiness = await calculateReadinessScore(
      userId, 
      jobForReadiness || { id: 0, roleTitle: "General" }, 
      roleCategory
    );
    
    const coachingContext = {
      userId,
      readiness,
      jobTarget: jobForReadiness,
      roleCategory,
      interviewDate: interviewDate ? new Date(interviewDate) : undefined,
      dailyTimeAvailable,
    };
    
    const plan = useAI 
      ? await generateAIPracticePlan(coachingContext)
      : await generateSevenDayPlan(coachingContext);
    
    res.json({ success: true, plan });
  } catch (error: any) {
    console.error("Error generating practice plan:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.get("/coach/plan/:jobTargetId", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { jobTargetId } = req.params;
    const { dailyTimeAvailable = 45 } = req.query;
    
    const [job] = await db
      .select()
      .from(jobTargets)
      .where(and(eq(jobTargets.id, parseInt(jobTargetId)), eq(jobTargets.userId, userId)))
      .limit(1);
    
    if (!job) {
      return res.status(404).json({ success: false, error: "Job target not found" });
    }
    
    const jobForReadiness: JobTargetForReadiness = {
      id: job.id,
      roleTitle: job.roleTitle || "General",
      company: job.company || undefined,
      jdText: job.jdRaw || undefined,
      mustHaveSkills: (job.jdParsed as any)?.mustHave || [],
      niceToHaveSkills: (job.jdParsed as any)?.niceToHave || [],
      seniority: (job.jdParsed as any)?.senioritySignal || undefined,
    };
    
    const roleCategory = detectRoleCategoryFromTitle(job.roleTitle || "");
    const readiness = await calculateReadinessScore(userId, jobForReadiness, roleCategory);
    
    const plan = await generateSevenDayPlan({
      userId,
      readiness,
      jobTarget: jobForReadiness,
      roleCategory,
      dailyTimeAvailable: parseInt(dailyTimeAvailable as string) || 45,
    });
    
    res.json({ 
      success: true, 
      plan,
      job: {
        id: job.id,
        roleTitle: job.roleTitle,
        company: job.company,
      },
      readiness: {
        overall: readiness.overall,
        level: readiness.readinessLevel,
      }
    });
  } catch (error: any) {
    console.error("Error generating practice plan for job:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

interviewRouter.get("/coach/today", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { jobTargetId, startDate } = req.query;
    
    let jobForReadiness: JobTargetForReadiness | undefined;
    let roleCategory = "general";
    
    if (jobTargetId) {
      const [job] = await db
        .select()
        .from(jobTargets)
        .where(and(eq(jobTargets.id, parseInt(jobTargetId as string)), eq(jobTargets.userId, userId)))
        .limit(1);
      
      if (job) {
        jobForReadiness = {
          id: job.id,
          roleTitle: job.roleTitle || "General",
          company: job.company || undefined,
          jdText: job.jdRaw || undefined,
          mustHaveSkills: (job.jdParsed as any)?.mustHave || [],
          niceToHaveSkills: (job.jdParsed as any)?.niceToHave || [],
          seniority: (job.jdParsed as any)?.senioritySignal || undefined,
        };
        roleCategory = detectRoleCategoryFromTitle(job.roleTitle || "");
      }
    }
    
    const readiness = await calculateReadinessScore(
      userId, 
      jobForReadiness || { id: 0, roleTitle: "General" }, 
      roleCategory
    );
    
    const plan = await generateSevenDayPlan({
      userId,
      readiness,
      jobTarget: jobForReadiness,
      roleCategory,
      dailyTimeAvailable: 45,
    });
    
    let dayIndex = 0;
    if (startDate) {
      const start = new Date(startDate as string);
      const now = new Date();
      const diffTime = now.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      dayIndex = Math.max(0, Math.min(6, diffDays));
    } else {
      const dayOfWeek = new Date().getDay();
      dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    }
    
    const today = plan.days[dayIndex];
    
    res.json({ 
      success: true, 
      today: {
        ...today,
        dayNumber: dayIndex + 1,
        isWeekday: dayIndex < 5,
        readiness: {
          overall: readiness.overall,
          level: readiness.readinessLevel,
          topGap: readiness.gaps[0]?.dimension,
        }
      },
      planSummary: {
        weeklyGoal: plan.weeklyGoal,
        totalDays: 7,
        currentDay: dayIndex + 1,
        focusAreas: plan.focusAreas,
      }
    });
  } catch (error: any) {
    console.error("Error fetching today's plan:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================================================
// JD-Driven Coding Exercise Matching
// ===================================================================

interviewRouter.post("/match-exercise", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { configId, sessionId, roleKitId, interviewType } = req.body;
    
    if (interviewType !== "technical") {
      return res.json({ success: true, exercise: null, reason: "Non-technical interview" });
    }

    let jdText = "";
    let resumeText = "";
    let roleKitSkills: string[] = [];
    let targetRoleKitId = roleKitId;

    if (configId) {
      const [config] = await db
        .select()
        .from(interviewConfigs)
        .where(and(eq(interviewConfigs.id, configId), eq(interviewConfigs.userId, userId)));

      if (config) {
        targetRoleKitId = config.roleKitId || roleKitId;

        if (config.jdDocId) {
          const [jdDoc] = await db.select().from(userDocuments).where(eq(userDocuments.id, config.jdDocId));
          if (jdDoc?.rawText) {
            jdText = jdDoc.rawText;
          }
        }

        if (config.resumeDocId) {
          const [resumeDoc] = await db.select().from(userDocuments).where(eq(userDocuments.id, config.resumeDocId));
          if (resumeDoc?.rawText) {
            resumeText = resumeDoc.rawText;
          }
        }
      }
    }

    if (targetRoleKitId) {
      const [kit] = await db.select().from(roleKits).where(eq(roleKits.id, targetRoleKitId));
      if (kit?.skillsFocus) {
        roleKitSkills = (kit.skillsFocus as string[]) || [];
      }
    }

    const jdSkills = extractSkillsFromText(jdText, "jd");
    const resumeSkills = extractSkillsFromText(resumeText, "resume");
    const profile = combineSkillProfiles(jdSkills, resumeSkills, roleKitSkills);

    const availableExercises = await db
      .select()
      .from(codingExercises)
      .where(eq(codingExercises.isActive, true));

    const matchedExercises = matchExercisesToProfile(
      availableExercises.map(e => ({
        id: e.id,
        name: e.name,
        activityType: e.activityType,
        language: e.language,
        difficulty: e.difficulty,
        codeSnippet: e.codeSnippet,
      })),
      profile
    );

    if (matchedExercises.length > 0 && matchedExercises[0].score > 3) {
      const bestMatch = matchedExercises[0];
      const fullExercise = availableExercises.find(e => e.id === bestMatch.exercise.id);
      
      return res.json({
        success: true,
        exercise: fullExercise,
        matchScore: bestMatch.score,
        matchedSkills: bestMatch.matchedSkills,
        source: "matched",
        profile: {
          primaryLanguages: profile.primaryLanguages,
          combinedRequirements: profile.combinedRequirements,
          seniorityLevel: profile.seniorityLevel,
        },
      });
    }

    if (profile.combinedRequirements.length > 0) {
      try {
        const openai = getOpenAI();
        const generated = await generateCompositeProblem(
          profile,
          availableExercises.map(e => ({ name: e.name, activityType: e.activityType })),
          openai
        );

        return res.json({
          success: true,
          exercise: {
            id: null,
            name: generated.title,
            activityType: generated.activityType,
            language: generated.language,
            difficulty: generated.difficulty,
            codeSnippet: generated.codeSnippet,
            expectedBehavior: generated.expectedBehavior,
            generated: true,
          },
          matchedSkills: generated.skillsCovered,
          source: "generated",
          profile: {
            primaryLanguages: profile.primaryLanguages,
            combinedRequirements: profile.combinedRequirements,
            seniorityLevel: profile.seniorityLevel,
          },
        });
      } catch (genError: any) {
        console.error("Error generating composite problem:", genError);
      }
    }

    if (targetRoleKitId) {
      const roleKitExercises = availableExercises.filter(e => e.roleKitId === targetRoleKitId);
      if (roleKitExercises.length > 0) {
        const randomIndex = Math.floor(Math.random() * roleKitExercises.length);
        return res.json({
          success: true,
          exercise: roleKitExercises[randomIndex],
          source: "role_kit_fallback",
          profile: {
            primaryLanguages: profile.primaryLanguages,
            combinedRequirements: profile.combinedRequirements,
            seniorityLevel: profile.seniorityLevel,
          },
        });
      }
    }

    if (availableExercises.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableExercises.length);
      return res.json({
        success: true,
        exercise: availableExercises[randomIndex],
        source: "random_fallback",
      });
    }

    res.json({ success: true, exercise: null, reason: "No exercises available" });
  } catch (error: any) {
    console.error("Error matching exercise:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default interviewRouter;
