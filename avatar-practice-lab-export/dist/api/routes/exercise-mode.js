import { Router } from "express";
import { db } from "../db.js";
import { eq, desc, and } from "drizzle-orm";
import { caseTemplates, codingExercises, exerciseSessions, exerciseRubrics, exerciseAnalysis, roleKits, jobTargets, } from "../../shared/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { getOpenAI } from "../utils/openai-client.js";
import { v4 as uuidv4 } from "uuid";
import { getAutoLinkSuggestion, getRankedJobSuggestions } from "../lib/exercise-job-matcher.js";
export const exerciseModeRouter = Router();
exerciseModeRouter.use((req, res, next) => {
    const sessionUser = req.session?.user;
    if (sessionUser) {
        req.user = sessionUser;
    }
    next();
});
// ===================================================================
// Case Templates Endpoints
// ===================================================================
exerciseModeRouter.get("/case-templates", async (req, res) => {
    try {
        const { roleKitId, caseType, difficulty } = req.query;
        let templates = await db
            .select()
            .from(caseTemplates)
            .where(eq(caseTemplates.isActive, true))
            .orderBy(caseTemplates.name);
        if (roleKitId && typeof roleKitId === "string") {
            templates = templates.filter(t => t.roleKitId === parseInt(roleKitId));
        }
        if (caseType && typeof caseType === "string") {
            templates = templates.filter(t => t.caseType === caseType);
        }
        if (difficulty && typeof difficulty === "string") {
            templates = templates.filter(t => t.difficulty === difficulty);
        }
        res.json({ success: true, templates });
    }
    catch (error) {
        console.error("Error fetching case templates:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
exerciseModeRouter.get("/case-templates/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const [template] = await db.select().from(caseTemplates).where(eq(caseTemplates.id, id));
        if (!template) {
            return res.status(404).json({ success: false, error: "Case template not found" });
        }
        let roleKit = null;
        if (template.roleKitId) {
            const [rk] = await db.select().from(roleKits).where(eq(roleKits.id, template.roleKitId));
            roleKit = rk || null;
        }
        res.json({ success: true, template, roleKit });
    }
    catch (error) {
        console.error("Error fetching case template:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// ===================================================================
// Coding Exercises Endpoints
// ===================================================================
exerciseModeRouter.get("/coding-exercises", async (req, res) => {
    try {
        const { roleKitId, activityType, language, difficulty } = req.query;
        let exercises = await db
            .select()
            .from(codingExercises)
            .where(eq(codingExercises.isActive, true))
            .orderBy(codingExercises.name);
        if (roleKitId && typeof roleKitId === "string") {
            exercises = exercises.filter(e => e.roleKitId === parseInt(roleKitId));
        }
        if (activityType && typeof activityType === "string") {
            exercises = exercises.filter(e => e.activityType === activityType);
        }
        if (language && typeof language === "string") {
            exercises = exercises.filter(e => e.language === language);
        }
        if (difficulty && typeof difficulty === "string") {
            exercises = exercises.filter(e => e.difficulty === difficulty);
        }
        res.json({ success: true, exercises });
    }
    catch (error) {
        console.error("Error fetching coding exercises:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
exerciseModeRouter.get("/coding-exercises/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const [exercise] = await db.select().from(codingExercises).where(eq(codingExercises.id, id));
        if (!exercise) {
            return res.status(404).json({ success: false, error: "Coding exercise not found" });
        }
        let roleKit = null;
        if (exercise.roleKitId) {
            const [rk] = await db.select().from(roleKits).where(eq(roleKits.id, exercise.roleKitId));
            roleKit = rk || null;
        }
        res.json({ success: true, exercise, roleKit });
    }
    catch (error) {
        console.error("Error fetching coding exercise:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// ===================================================================
// Exercise Rubrics Endpoints
// ===================================================================
exerciseModeRouter.get("/rubrics", async (req, res) => {
    try {
        const { exerciseType } = req.query;
        let rubrics = await db.select().from(exerciseRubrics).orderBy(exerciseRubrics.name);
        if (exerciseType && typeof exerciseType === "string") {
            rubrics = rubrics.filter(r => r.exerciseType === exerciseType);
        }
        res.json({ success: true, rubrics });
    }
    catch (error) {
        console.error("Error fetching exercise rubrics:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
exerciseModeRouter.get("/rubrics/default/:exerciseType", async (req, res) => {
    try {
        const { exerciseType } = req.params;
        const [rubric] = await db
            .select()
            .from(exerciseRubrics)
            .where(and(eq(exerciseRubrics.exerciseType, exerciseType), eq(exerciseRubrics.isDefault, true)));
        if (!rubric) {
            return res.status(404).json({ success: false, error: "Default rubric not found" });
        }
        res.json({ success: true, rubric });
    }
    catch (error) {
        console.error("Error fetching default rubric:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// ===================================================================
// Auto-Link Job Target Suggestion Endpoints
// ===================================================================
exerciseModeRouter.post("/auto-link", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { exerciseType, templateId, codingExerciseId, roleKitId } = req.body;
        if (!exerciseType || !["case_study", "coding_lab"].includes(exerciseType)) {
            return res.status(400).json({ success: false, error: "Invalid exercise type" });
        }
        const suggestion = await getAutoLinkSuggestion(userId, {
            exerciseType,
            templateId: templateId ? parseInt(templateId) : undefined,
            codingExerciseId: codingExerciseId ? parseInt(codingExerciseId) : undefined,
            roleKitId: roleKitId ? parseInt(roleKitId) : undefined,
        });
        res.json({
            success: true,
            suggestion,
            hasSuggestion: suggestion !== null,
        });
    }
    catch (error) {
        console.error("Error getting auto-link suggestion:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
exerciseModeRouter.post("/auto-link/ranked", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { exerciseType, templateId, codingExerciseId, roleKitId, limit = 3 } = req.body;
        if (!exerciseType || !["case_study", "coding_lab"].includes(exerciseType)) {
            return res.status(400).json({ success: false, error: "Invalid exercise type" });
        }
        const suggestions = await getRankedJobSuggestions(userId, {
            exerciseType,
            templateId: templateId ? parseInt(templateId) : undefined,
            codingExerciseId: codingExerciseId ? parseInt(codingExerciseId) : undefined,
            roleKitId: roleKitId ? parseInt(roleKitId) : undefined,
        }, limit);
        res.json({
            success: true,
            suggestions,
            count: suggestions.length,
        });
    }
    catch (error) {
        console.error("Error getting ranked job suggestions:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// ===================================================================
// Exercise Sessions Endpoints
// ===================================================================
exerciseModeRouter.post("/sessions", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { exerciseType, caseTemplateId, codingExerciseId, roleKitId, interviewType, style, jobTargetId, autoLinked, autoLinkConfidence, autoLinkSignals, } = req.body;
        if (!exerciseType || !["case_study", "coding_lab"].includes(exerciseType)) {
            return res.status(400).json({ success: false, error: "Invalid exercise type" });
        }
        if (exerciseType === "case_study" && !caseTemplateId) {
            return res.status(400).json({ success: false, error: "Case template ID required for case study" });
        }
        if (exerciseType === "coding_lab" && !codingExerciseId) {
            return res.status(400).json({ success: false, error: "Coding exercise ID required for coding lab" });
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
        const sessionUid = uuidv4();
        const [session] = await db
            .insert(exerciseSessions)
            .values({
            userId,
            exerciseType: exerciseType,
            caseTemplateId: caseTemplateId ? parseInt(caseTemplateId) : null,
            codingExerciseId: codingExerciseId ? parseInt(codingExerciseId) : null,
            roleKitId: roleKitId ? parseInt(roleKitId) : null,
            interviewType: interviewType || "hiring_manager",
            style: style || "neutral",
            jobTargetId: jobTargetId || null,
            autoLinked: autoLinked || false,
            autoLinkConfidence: autoLinkConfidence || null,
            autoLinkSignals: autoLinkSignals || null,
            sessionUid,
            status: "created",
            createdAt: new Date(),
            updatedAt: new Date(),
        })
            .returning();
        res.json({ success: true, session });
    }
    catch (error) {
        console.error("Error creating exercise session:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
exerciseModeRouter.get("/sessions/:id", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);
        const [session] = await db
            .select()
            .from(exerciseSessions)
            .where(and(eq(exerciseSessions.id, id), eq(exerciseSessions.userId, userId)));
        if (!session) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }
        let caseTemplate = null;
        let codingExercise = null;
        let roleKit = null;
        if (session.caseTemplateId) {
            const [ct] = await db.select().from(caseTemplates).where(eq(caseTemplates.id, session.caseTemplateId));
            caseTemplate = ct || null;
        }
        if (session.codingExerciseId) {
            const [ce] = await db.select().from(codingExercises).where(eq(codingExercises.id, session.codingExerciseId));
            codingExercise = ce || null;
        }
        if (session.roleKitId) {
            const [rk] = await db.select().from(roleKits).where(eq(roleKits.id, session.roleKitId));
            roleKit = rk || null;
        }
        res.json({ success: true, session, caseTemplate, codingExercise, roleKit });
    }
    catch (error) {
        console.error("Error fetching exercise session:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
exerciseModeRouter.get("/sessions/by-uid/:uid", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { uid } = req.params;
        const [session] = await db
            .select()
            .from(exerciseSessions)
            .where(and(eq(exerciseSessions.sessionUid, uid), eq(exerciseSessions.userId, userId)));
        if (!session) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }
        res.json({ success: true, session });
    }
    catch (error) {
        console.error("Error fetching exercise session by UID:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
exerciseModeRouter.patch("/sessions/:id/status", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);
        const { status, thinkingTimeUsed, duration, transcript, userCodeSubmission } = req.body;
        const [existing] = await db
            .select()
            .from(exerciseSessions)
            .where(and(eq(exerciseSessions.id, id), eq(exerciseSessions.userId, userId)));
        if (!existing) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }
        const updateData = {
            updatedAt: new Date(),
        };
        if (status)
            updateData.status = status;
        if (thinkingTimeUsed !== undefined)
            updateData.thinkingTimeUsed = thinkingTimeUsed;
        if (duration !== undefined)
            updateData.duration = duration;
        if (transcript !== undefined)
            updateData.transcript = transcript;
        if (userCodeSubmission !== undefined)
            updateData.userCodeSubmission = userCodeSubmission;
        const [updated] = await db
            .update(exerciseSessions)
            .set(updateData)
            .where(eq(exerciseSessions.id, id))
            .returning();
        res.json({ success: true, session: updated });
    }
    catch (error) {
        console.error("Error updating exercise session:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
exerciseModeRouter.get("/sessions", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { exerciseType, limit } = req.query;
        let sessions = await db
            .select()
            .from(exerciseSessions)
            .where(eq(exerciseSessions.userId, userId))
            .orderBy(desc(exerciseSessions.createdAt));
        if (exerciseType && typeof exerciseType === "string") {
            sessions = sessions.filter(s => s.exerciseType === exerciseType);
        }
        if (limit && typeof limit === "string") {
            sessions = sessions.slice(0, parseInt(limit));
        }
        res.json({ success: true, sessions });
    }
    catch (error) {
        console.error("Error fetching exercise sessions:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// ===================================================================
// Exercise Analysis Endpoints
// ===================================================================
exerciseModeRouter.post("/sessions/:id/analyze", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const sessionId = parseInt(req.params.id);
        const { transcript } = req.body;
        const [session] = await db
            .select()
            .from(exerciseSessions)
            .where(and(eq(exerciseSessions.id, sessionId), eq(exerciseSessions.userId, userId)));
        if (!session) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }
        const finalTranscript = transcript || session.transcript;
        if (!finalTranscript) {
            return res.status(400).json({ success: false, error: "No transcript available for analysis" });
        }
        const [defaultRubric] = await db
            .select()
            .from(exerciseRubrics)
            .where(and(eq(exerciseRubrics.exerciseType, session.exerciseType), eq(exerciseRubrics.isDefault, true)));
        let exerciseContext = "";
        if (session.exerciseType === "case_study" && session.caseTemplateId) {
            const [ct] = await db.select().from(caseTemplates).where(eq(caseTemplates.id, session.caseTemplateId));
            if (ct) {
                exerciseContext = `Case Study: ${ct.name}\nPrompt: ${ct.promptStatement}\nCase Type: ${ct.caseType}`;
            }
        }
        else if (session.exerciseType === "coding_lab" && session.codingExerciseId) {
            const [ce] = await db.select().from(codingExercises).where(eq(codingExercises.id, session.codingExerciseId));
            if (ce) {
                exerciseContext = `Coding Exercise: ${ce.name}\nActivity Type: ${ce.activityType}\nLanguage: ${ce.language}\nCode:\n${ce.codeSnippet}`;
            }
        }
        const openai = getOpenAI();
        const rubricDimensions = defaultRubric?.dimensions || [];
        const analysisPrompt = session.exerciseType === "case_study"
            ? `Analyze this case study interview response. Score each dimension from 1-5 with evidence.
      
Exercise Context:
${exerciseContext}

Transcript:
${finalTranscript}

Scoring Dimensions:
${JSON.stringify(rubricDimensions, null, 2)}

Respond in JSON format:
{
  "overallScore": number (1-5),
  "dimensionScores": [
    {
      "dimension": "dimension name",
      "score": number,
      "maxScore": 5,
      "evidence": ["quote1", "quote2"],
      "feedback": "specific feedback"
    }
  ],
  "strengthsIdentified": ["strength1", "strength2"],
  "areasForImprovement": ["area1", "area2"],
  "rewrittenAnswer": "A better structured answer would be...",
  "betterClarifyingQuestions": ["question1", "question2", "question3"],
  "practicePlan": [
    {"day": 1, "task": "task description", "timeMinutes": 10}
  ],
  "summary": "Overall assessment summary"
}`
            : `Analyze this coding exercise interview response. Score each dimension from 1-5 with evidence.
      
Exercise Context:
${exerciseContext}

Transcript:
${finalTranscript}

User's Code Submission:
${session.userCodeSubmission || "No code submitted"}

Scoring Dimensions:
${JSON.stringify(rubricDimensions, null, 2)}

Respond in JSON format:
{
  "overallScore": number (1-5),
  "dimensionScores": [
    {
      "dimension": "dimension name",
      "score": number,
      "maxScore": 5,
      "evidence": ["quote1", "quote2"],
      "feedback": "specific feedback"
    }
  ],
  "strengthsIdentified": ["strength1", "strength2"],
  "areasForImprovement": ["area1", "area2"],
  "rewrittenAnswer": "A better explanation would be...",
  "missedEdgeCases": ["edge case 1", "edge case 2"],
  "suggestedPatch": "// Suggested code fix...",
  "practicePlan": [
    {"day": 1, "task": "task description", "timeMinutes": 10}
  ],
  "summary": "Overall assessment summary"
}`;
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are an expert interview coach providing detailed, actionable feedback. Always respond with valid JSON." },
                { role: "user", content: analysisPrompt },
            ],
            response_format: { type: "json_object" },
        });
        const analysisResult = JSON.parse(completion.choices[0]?.message?.content || "{}");
        const [analysis] = await db
            .insert(exerciseAnalysis)
            .values({
            exerciseSessionId: sessionId,
            rubricId: defaultRubric?.id || null,
            overallScore: analysisResult.overallScore || 3,
            dimensionScores: analysisResult.dimensionScores || [],
            strengthsIdentified: analysisResult.strengthsIdentified || [],
            areasForImprovement: analysisResult.areasForImprovement || [],
            rewrittenAnswer: analysisResult.rewrittenAnswer || null,
            betterClarifyingQuestions: analysisResult.betterClarifyingQuestions || null,
            missedEdgeCases: analysisResult.missedEdgeCases || null,
            suggestedPatch: analysisResult.suggestedPatch || null,
            practicePlan: analysisResult.practicePlan || null,
            summary: analysisResult.summary || null,
            createdAt: new Date(),
        })
            .returning();
        await db
            .update(exerciseSessions)
            .set({ status: "analyzed", transcript: finalTranscript, updatedAt: new Date() })
            .where(eq(exerciseSessions.id, sessionId));
        res.json({ success: true, analysis });
    }
    catch (error) {
        console.error("Error analyzing exercise session:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
exerciseModeRouter.get("/sessions/:id/analysis", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const sessionId = parseInt(req.params.id);
        const [session] = await db
            .select()
            .from(exerciseSessions)
            .where(and(eq(exerciseSessions.id, sessionId), eq(exerciseSessions.userId, userId)));
        if (!session) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }
        const [analysis] = await db
            .select()
            .from(exerciseAnalysis)
            .where(eq(exerciseAnalysis.exerciseSessionId, sessionId));
        if (!analysis) {
            return res.status(404).json({ success: false, error: "Analysis not found" });
        }
        res.json({ success: true, analysis, session });
    }
    catch (error) {
        console.error("Error fetching exercise analysis:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// ===================================================================
// Session History - Get user's exercise sessions
// ===================================================================
exerciseModeRouter.get("/session-history", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { exerciseType, limit: limitParam } = req.query;
        const limitNum = limitParam ? parseInt(limitParam) : 50;
        const sessions = await db
            .select()
            .from(exerciseSessions)
            .where(eq(exerciseSessions.userId, userId))
            .orderBy(desc(exerciseSessions.createdAt))
            .limit(limitNum);
        const filteredSessions = exerciseType
            ? sessions.filter(s => s.exerciseType === exerciseType)
            : sessions;
        const enrichedSessions = await Promise.all(filteredSessions.map(async (session) => {
            let exerciseName = "";
            let exerciseData = null;
            if (session.exerciseType === "case_study" && session.caseTemplateId) {
                const [ct] = await db.select().from(caseTemplates).where(eq(caseTemplates.id, session.caseTemplateId));
                exerciseName = ct?.name || "Case Study";
                exerciseData = ct ? { name: ct.name, caseType: ct.caseType, difficulty: ct.difficulty } : null;
            }
            else if (session.exerciseType === "coding_lab" && session.codingExerciseId) {
                const [ce] = await db.select().from(codingExercises).where(eq(codingExercises.id, session.codingExerciseId));
                exerciseName = ce?.name || "Coding Exercise";
                exerciseData = ce ? { name: ce.name, activityType: ce.activityType, language: ce.language, difficulty: ce.difficulty } : null;
            }
            const [analysis] = await db
                .select()
                .from(exerciseAnalysis)
                .where(eq(exerciseAnalysis.exerciseSessionId, session.id));
            return {
                id: session.id,
                sessionUid: session.sessionUid,
                exerciseType: session.exerciseType,
                exerciseName,
                exerciseData,
                status: session.status,
                duration: session.duration,
                createdAt: session.createdAt,
                analysis: analysis ? {
                    id: analysis.id,
                    overallScore: analysis.overallScore,
                    summary: analysis.summary,
                } : null,
            };
        }));
        res.json({ success: true, sessions: enrichedSessions });
    }
    catch (error) {
        console.error("Error fetching exercise session history:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// ===================================================================
// AI Interviewer Prompts - Generate system prompts for sessions
// ===================================================================
exerciseModeRouter.get("/sessions/:id/interviewer-prompt", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const sessionId = parseInt(req.params.id);
        const [session] = await db
            .select()
            .from(exerciseSessions)
            .where(and(eq(exerciseSessions.id, sessionId), eq(exerciseSessions.userId, userId)));
        if (!session) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }
        let systemPrompt = "";
        let exerciseData = null;
        if (session.exerciseType === "case_study" && session.caseTemplateId) {
            const [ct] = await db.select().from(caseTemplates).where(eq(caseTemplates.id, session.caseTemplateId));
            if (ct) {
                exerciseData = ct;
                const probingMap = ct.probingMap || {};
                const styleModifier = session.style === "stress"
                    ? "Be more direct and time-pressured. Challenge weak points immediately."
                    : session.style === "friendly"
                        ? "Be supportive but still probe for clarity. Encourage the candidate."
                        : "Be professional and neutral. Probe systematically.";
                systemPrompt = `You are an experienced ${session.interviewType === "panel" ? "panel interviewer" : "hiring manager"} conducting a case study interview.

CASE PROMPT TO PRESENT:
"${ct.promptStatement}"

${ct.context ? `CONTEXT:\n${ct.context}` : ""}

INTERVIEW STYLE: ${session.style}
${styleModifier}

PROBING RULES (CRITICAL):
- If the candidate is VAGUE: ${(probingMap.ifVague || ["Ask for specifics", "Request examples", "Push for metrics"]).join(", ")}
- If the candidate is WRONG: ${(probingMap.ifWrong || ["Gently redirect", "Ask clarifying questions", "Provide hints"]).join(", ")}
- If the candidate is STRONG: ${(probingMap.ifStrong || ["Push deeper", "Add constraints", "Ask about edge cases"]).join(", ")}

REVEALABLE DATA (only share if candidate asks the right questions):
${JSON.stringify(ct.revealableData || [], null, 2)}

EVALUATION FOCUS:
${(ct.evaluationFocus || []).join("\n- ")}

BEHAVIOR RULES:
1. Start by presenting the case clearly
2. Allow ${ct.clarifyingQuestionsAllowed || 3} clarifying questions
3. Interrupt if candidate rambles beyond 90 seconds
4. Probe on every assertion - ask "why" and "how"
5. Force trade-off discussions
6. End by asking for a summary recommendation

Never break character. Respond as the interviewer would.`;
            }
        }
        else if (session.exerciseType === "coding_lab" && session.codingExerciseId) {
            const [ce] = await db.select().from(codingExercises).where(eq(codingExercises.id, session.codingExerciseId));
            if (ce) {
                exerciseData = ce;
                const styleModifier = session.style === "stress"
                    ? "Be time-pressured. Push for quick answers."
                    : session.style === "friendly"
                        ? "Be encouraging but still thorough in probing."
                        : "Be professional and methodical.";
                const activityInstructions = ce.activityType === "explain"
                    ? `Ask the candidate to explain:
1. What does this code do?
2. What is the time/space complexity?
3. What edge cases could break it?
4. How would you improve it?`
                    : ce.activityType === "debug"
                        ? `Present the bug scenario:
"${ce.bugDescription || "This code has a bug."}"
Failing test case: ${ce.failingTestCase || "Not specified"}

Ask the candidate to:
1. Identify the likely bug
2. Explain their debugging approach
3. Walk through the fix`
                        : `Present the modification requirement:
"${ce.modificationRequirement || "Modify this code."}"

Ask the candidate to:
1. Explain what changes are needed
2. Discuss edge cases
3. Walk through the implementation`;
                systemPrompt = `You are an experienced technical interviewer conducting a ${ce.activityType} coding exercise.

CODE TO PRESENT:
\`\`\`${ce.language}
${ce.codeSnippet}
\`\`\`

ACTIVITY TYPE: ${ce.activityType.toUpperCase()}
${activityInstructions}

INTERVIEW STYLE: ${session.style}
${styleModifier}

PROBING QUESTIONS TO USE:
${(ce.probingQuestions || []).map((q, i) => `${i + 1}. ${q}`).join("\n")}

EXPECTED SIGNALS (what good answers include):
${(ce.expectedSignals || []).map((s) => `- ${s.signal} (${s.importance})`).join("\n")}

COMMON FAILURE MODES (watch for these):
${(ce.commonFailureModes || []).map((f) => `- ${f.mistake}: Feedback: ${f.feedback}`).join("\n")}

EDGE CASES TO PROBE:
${(ce.edgeCases || []).join("\n- ")}

BEHAVIOR RULES:
1. Present the code and activity clearly
2. Interrupt if candidate rambles beyond 60 seconds
3. Always ask "why" on complexity claims
4. Force edge case discussion
5. If they miss something critical, hint and re-ask
6. Ask for a quick test plan before finishing

Never break character. Respond as the interviewer would.`;
            }
        }
        if (!systemPrompt) {
            return res.status(400).json({ success: false, error: "Could not generate interviewer prompt" });
        }
        res.json({ success: true, systemPrompt, exerciseData });
    }
    catch (error) {
        console.error("Error generating interviewer prompt:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
export default exerciseModeRouter;
