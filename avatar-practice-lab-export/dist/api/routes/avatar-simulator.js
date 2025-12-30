import { Router } from "express";
import fs from "fs";
import path from "path";
import { getGender } from "gender-detection-from-name";
import { db, pool } from "../db.js";
import { openai } from "../utils/openai-client.js";
import multer from "multer";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { s3Client, uploadAudioFileToS3 } from "../utils/s3.js";
import * as storage from "../storage.js";
import { ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { avatars, scenarios, roleplaySession, aiSessionAnalysis, transcriptMessages, transcripts, scenarioSkills, tones, personas, } from "../../shared/schema.js";
import { getCulturalPresetById, getDefaultCulturalPreset, getAllCulturalPresets, } from "../../shared/cultural-presets.js";
import { eq, sql, and, isNotNull } from "drizzle-orm";
export const avatarSimulator = Router();
import { fileURLToPath } from "url";
import { mapCustomScenarioToSkills, getSkillMappingsForCustomScenario } from "../lib/scenario-skill-mapper.js";
import { performSkillAssessmentForSession, getSkillAssessmentsForSession } from "../lib/skill-dimension-assessment.js";
import { suggestRolesFromContext, analyzeScenarioContext } from "../lib/role-suggestion.js";
dotenv.config();
// Recreate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Set up disk storage with multer
const mutlterStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
});
const upload = multer({ storage: mutlterStorage });
// avatarSimulator.use(requireAuth);
avatarSimulator.get("/get-skills", async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        s.*, 
        COALESCE(json_agg(sc.*), '[]') as scenarios
      FROM 
        skills s 
      LEFT JOIN 
        scenarios sc ON s.id = sc.skill_id 
      GROUP BY 
        s.id, s.name, s.description 
      ORDER BY 
        s.name
    `);
        res.json({ success: true, skills: result.rows });
    }
    catch (error) {
        console.error("Error getting skills:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to get skills",
            details: error.message,
        });
    }
});
// =====================
// Cultural Style Presets API
// =====================
avatarSimulator.get("/cultural-presets", async (req, res) => {
    try {
        const presets = getAllCulturalPresets();
        const simplifiedPresets = presets.map((preset) => ({
            id: preset.id,
            name: preset.name,
            description: preset.userFacingDescription,
            isDefault: preset.isDefault,
            learningOutcomes: preset.typicalUserLearnings,
        }));
        res.json({ success: true, presets: simplifiedPresets });
    }
    catch (error) {
        console.error("Error getting cultural presets:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to get cultural presets",
            details: error.message,
        });
    }
});
avatarSimulator.get("/cultural-presets/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const preset = getCulturalPresetById(id);
        if (!preset) {
            return res.status(404).json({
                success: false,
                error: "Cultural preset not found",
            });
        }
        res.json({ success: true, preset });
    }
    catch (error) {
        console.error("Error getting cultural preset:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to get cultural preset",
            details: error.message,
        });
    }
});
avatarSimulator.get("/cultural-presets/default", async (req, res) => {
    try {
        const preset = getDefaultCulturalPreset();
        res.json({ success: true, preset });
    }
    catch (error) {
        console.error("Error getting default cultural preset:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to get default cultural preset",
            details: error.message,
        });
    }
});
avatarSimulator.post("/transcribe", upload.single("file"), async (req, res) => {
    try {
        const audioFile = req.file;
        if (!audioFile || !audioFile.path) {
            return res
                .status(400)
                .json({ success: false, error: "No file provided" });
        }
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioFile.path),
            model: "whisper-1",
        });
        // Clean up: delete the file after processing
        fs.unlink(audioFile.path, () => { });
        res.json({ success: true, text: transcription.text });
    }
    catch (error) {
        console.error("Transcription error:", error);
        res.status(500).json({ success: false, error: "Transcription failed" });
    }
});
avatarSimulator.post("/end-sessions", async (req, res) => {
    const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
    if (!HEYGEN_API_KEY) {
        console.error("API key is missing from .env file");
        return res.status(500).send("HeyGen API key is missing from .env file");
    }
    console.log("Attempting to end all HeyGen sessions...");
    try {
        // Try the streaming.stop endpoint which is more reliable for ending sessions
        const response = await fetch("https://api.heygen.com/v1/streaming.list", {
            method: "GET",
            headers: {
                "x-api-key": HEYGEN_API_KEY,
                "Content-Type": "application/json",
            },
        });
        // Check content type before parsing
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const textResponse = await response.text();
            console.log("HeyGen returned non-JSON response:", textResponse.substring(0, 200));
            // This is not a critical error - just means there might be no sessions or endpoint changed
            return res.json({
                success: true,
                message: "No sessions to end or endpoint unavailable",
                sessions: [],
            });
        }
        const listData = await response.json();
        console.log("Active sessions list:", listData);
        // If there are active sessions, try to stop each one
        if (listData.data && listData.data.sessions && listData.data.sessions.length > 0) {
            const stopPromises = listData.data.sessions.map(async (session) => {
                try {
                    const stopResponse = await fetch("https://api.heygen.com/v1/streaming.stop", {
                        method: "POST",
                        headers: {
                            "x-api-key": HEYGEN_API_KEY,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ session_id: session.session_id }),
                    });
                    const stopContentType = stopResponse.headers.get("content-type");
                    if (stopContentType && stopContentType.includes("application/json")) {
                        return await stopResponse.json();
                    }
                    return { stopped: true, session_id: session.session_id };
                }
                catch (stopError) {
                    console.log(`Error stopping session ${session.session_id}:`, stopError);
                    return { error: true, session_id: session.session_id };
                }
            });
            const results = await Promise.all(stopPromises);
            console.log("Sessions stopped:", results);
            return res.json({
                success: true,
                message: `Stopped ${listData.data.sessions.length} sessions`,
                results,
            });
        }
        res.json({
            success: true,
            message: "No active sessions to end",
            sessions: [],
        });
    }
    catch (error) {
        console.error("Error ending sessions:", error);
        // Return success anyway since this is a non-critical cleanup operation
        res.json({
            success: true,
            message: "Session cleanup attempted (may have had no active sessions)",
        });
    }
});
// Keep-alive endpoint per HeyGen best practices
// Call this to reset the idle timer for an active session
avatarSimulator.post("/keep-alive", async (req, res) => {
    const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
    if (!HEYGEN_API_KEY) {
        console.error("API key is missing from .env file");
        return res.status(500).json({ success: false, error: "HeyGen API key is missing" });
    }
    const { session_id } = req.body;
    if (!session_id) {
        return res.status(400).json({ success: false, error: "session_id is required" });
    }
    console.log(`Keep-alive request for session: ${session_id}`);
    try {
        const response = await fetch("https://api.heygen.com/v1/streaming.keep_alive", {
            method: "POST",
            headers: {
                "x-api-key": HEYGEN_API_KEY,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ session_id }),
        });
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const textResponse = await response.text();
            console.log("Keep-alive non-JSON response:", textResponse.substring(0, 200));
            return res.json({ success: false, message: "Keep-alive endpoint unavailable" });
        }
        const data = await response.json();
        console.log("Keep-alive response:", data);
        // Update DB session tracking with lastSeenAt
        try {
            const dbSession = await storage.getHeygenSessionByHeygenId(session_id);
            if (dbSession) {
                await storage.updateHeygenSession(dbSession.id, {
                    lastSeenAt: new Date()
                });
            }
        }
        catch (dbError) {
            console.warn("Failed to update session lastSeenAt:", dbError);
        }
        if (response.ok) {
            return res.json({ success: true, message: "Session kept alive", data });
        }
        else {
            return res.status(response.status).json({
                success: false,
                error: data.message || "Keep-alive failed",
                data
            });
        }
    }
    catch (error) {
        console.error("Error in keep-alive:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Keep-alive request failed"
        });
    }
});
// ===================================================================
// HeyGen Session Management Endpoints (with 6-minute limit enforcement)
// ===================================================================
const HEYGEN_SESSION_DURATION_SEC = 360; // 6 minutes
const HEYGEN_MAX_CONCURRENT_SESSIONS = 100; // Paid account limit
// Check if sessions are available (before requesting token)
avatarSimulator.get("/session/availability", async (req, res) => {
    try {
        const authUserId = req.user?.id;
        // Convert auth user ID to legacy user ID
        let legacyUserId = null;
        if (authUserId) {
            const legacyUser = await storage.getLegacyUserByAuthUserId(authUserId);
            if (legacyUser) {
                legacyUserId = legacyUser.id;
            }
        }
        // Check current active session count
        const activeCount = await storage.getActiveHeygenSessionsCount();
        const isAvailable = activeCount < HEYGEN_MAX_CONCURRENT_SESSIONS;
        // Check if user already has an active session
        let userActiveSession = null;
        if (legacyUserId) {
            userActiveSession = await storage.getUserActiveHeygenSession(legacyUserId);
        }
        // Get queue info
        const queueLength = await storage.getHeygenQueueLength();
        res.json({
            success: true,
            available: isAvailable && !userActiveSession,
            activeSessionCount: activeCount,
            maxConcurrentSessions: HEYGEN_MAX_CONCURRENT_SESSIONS,
            queueLength,
            userHasActiveSession: !!userActiveSession,
            userActiveSessionId: userActiveSession?.id || null,
            estimatedWaitMinutes: isAvailable ? 0 : Math.ceil(queueLength * 2), // ~2 min avg session
        });
    }
    catch (error) {
        console.error("Error checking session availability:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Start a new tracked session (called after HeyGen SDK creates session)
avatarSimulator.post("/session/start", async (req, res) => {
    try {
        const authUserId = req.user?.id;
        const { heygenSessionId, scenarioId, avatarId, mode, culturalPresetId } = req.body;
        // Convert auth user ID (UUID) to legacy user ID (integer)
        let legacyUserId = null;
        if (authUserId) {
            const legacyUser = await storage.getLegacyUserByAuthUserId(authUserId);
            if (legacyUser) {
                legacyUserId = legacyUser.id;
            }
            else if (req.user?.username) {
                const created = await storage.getOrCreateLegacyUser(authUserId, req.user.username);
                legacyUserId = created.id;
            }
        }
        if (!heygenSessionId) {
            return res.status(400).json({
                success: false,
                error: "heygenSessionId is required"
            });
        }
        // Check if user already has an active session
        if (legacyUserId) {
            const existingSession = await storage.getUserActiveHeygenSession(legacyUserId);
            if (existingSession) {
                return res.status(409).json({
                    success: false,
                    error: "User already has an active session",
                    existingSessionId: existingSession.id,
                });
            }
        }
        // Check concurrent session limit
        const activeCount = await storage.getActiveHeygenSessionsCount();
        if (activeCount >= HEYGEN_MAX_CONCURRENT_SESSIONS) {
            return res.status(503).json({
                success: false,
                error: "Maximum concurrent sessions reached",
                queueRequired: true,
            });
        }
        // Calculate expiry time (6 minutes from now)
        const now = new Date();
        const expiresAt = new Date(now.getTime() + HEYGEN_SESSION_DURATION_SEC * 1000);
        // Validate cultural preset if provided - reject invalid IDs
        let validCulturalPresetId = null;
        if (culturalPresetId) {
            const preset = getCulturalPresetById(culturalPresetId);
            if (!preset) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid cultural preset ID",
                    validPresets: getAllCulturalPresets().map(p => p.id),
                });
            }
            validCulturalPresetId = culturalPresetId;
        }
        // Create the tracked session
        const session = await storage.createHeygenSession({
            userId: legacyUserId || null,
            heygenSessionId,
            scenarioId: scenarioId ? Number(scenarioId) : null,
            avatarId: avatarId || null,
            mode: mode || "voice",
            status: "active",
            maxDurationSec: HEYGEN_SESSION_DURATION_SEC,
            startedAt: now,
            expiresAt,
            lastSeenAt: now,
            culturalPresetId: validCulturalPresetId,
        });
        console.log(`[HeyGen Session] Started session ${session.id} for user ${legacyUserId}, expires at ${expiresAt.toISOString()}`);
        res.json({
            success: true,
            session: {
                id: session.id,
                heygenSessionId: session.heygenSessionId,
                startedAt: session.startedAt,
                expiresAt: session.expiresAt,
                maxDurationSec: HEYGEN_SESSION_DURATION_SEC,
                remainingSec: HEYGEN_SESSION_DURATION_SEC,
                culturalPresetId: session.culturalPresetId,
            },
        });
    }
    catch (error) {
        console.error("Error starting tracked session:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Get current session status (for timer and expiry checks)
avatarSimulator.get("/session/status", async (req, res) => {
    try {
        const { sessionId, heygenSessionId } = req.query;
        let session;
        if (sessionId) {
            session = await storage.getHeygenSession(Number(sessionId));
        }
        else if (heygenSessionId) {
            session = await storage.getHeygenSessionByHeygenId(heygenSessionId);
        }
        else {
            const authUserId = req.user?.id;
            if (authUserId) {
                const legacyUser = await storage.getLegacyUserByAuthUserId(authUserId);
                if (legacyUser) {
                    session = await storage.getUserActiveHeygenSession(legacyUser.id);
                }
            }
        }
        if (!session) {
            return res.json({ success: true, session: null });
        }
        // Calculate remaining time
        const now = new Date();
        const startedAt = session.startedAt ? new Date(session.startedAt) : now;
        const expiresAt = session.expiresAt ? new Date(session.expiresAt) : new Date(startedAt.getTime() + HEYGEN_SESSION_DURATION_SEC * 1000);
        const elapsedSec = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
        const remainingSec = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
        const isExpired = remainingSec <= 0;
        res.json({
            success: true,
            session: {
                id: session.id,
                heygenSessionId: session.heygenSessionId,
                status: session.status,
                mode: session.mode,
                startedAt: session.startedAt,
                expiresAt,
                elapsedSec,
                remainingSec,
                maxDurationSec: session.maxDurationSec || HEYGEN_SESSION_DURATION_SEC,
                isExpired,
                warningAt: session.maxDurationSec ? session.maxDurationSec - 60 : HEYGEN_SESSION_DURATION_SEC - 60, // 1 min warning
            },
        });
    }
    catch (error) {
        console.error("Error getting session status:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Heartbeat - update lastSeenAt and check for expiry
avatarSimulator.post("/session/heartbeat", async (req, res) => {
    try {
        const { sessionId, heygenSessionId } = req.body;
        let session;
        if (sessionId) {
            session = await storage.getHeygenSession(Number(sessionId));
        }
        else if (heygenSessionId) {
            session = await storage.getHeygenSessionByHeygenId(heygenSessionId);
        }
        if (!session) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }
        if (session.status !== "active") {
            return res.json({
                success: false,
                error: "Session is not active",
                status: session.status,
                shouldEnd: true,
            });
        }
        // Check if session has expired
        const now = new Date();
        const expiresAt = session.expiresAt ? new Date(session.expiresAt) : null;
        if (expiresAt && now >= expiresAt) {
            // Session has expired - mark it as ended
            await storage.endHeygenSession(session.id, "expired");
            return res.json({
                success: true,
                expired: true,
                shouldEnd: true,
                message: "Session time limit reached",
            });
        }
        // Update lastSeenAt
        await storage.updateHeygenSession(session.id, { lastSeenAt: now });
        // Calculate remaining time
        const remainingSec = expiresAt
            ? Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
            : HEYGEN_SESSION_DURATION_SEC;
        res.json({
            success: true,
            expired: false,
            shouldEnd: false,
            remainingSec,
            warningActive: remainingSec <= 60, // Last minute warning
        });
    }
    catch (error) {
        console.error("Error in session heartbeat:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// End session (graceful end or forced termination)
avatarSimulator.post("/session/end", async (req, res) => {
    const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
    try {
        const { sessionId, heygenSessionId, reason } = req.body;
        let session;
        if (sessionId) {
            session = await storage.getHeygenSession(Number(sessionId));
        }
        else if (heygenSessionId) {
            session = await storage.getHeygenSessionByHeygenId(heygenSessionId);
        }
        if (!session) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }
        // End the session in HeyGen if we have their session ID
        if (session.heygenSessionId && HEYGEN_API_KEY) {
            try {
                await fetch("https://api.heygen.com/v1/streaming.stop", {
                    method: "POST",
                    headers: {
                        "x-api-key": HEYGEN_API_KEY,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ session_id: session.heygenSessionId }),
                });
            }
            catch (heygenError) {
                console.warn("Failed to stop HeyGen session:", heygenError);
            }
        }
        // Update our database
        const endedSession = await storage.endHeygenSession(session.id, reason || "user_ended");
        console.log(`[HeyGen Session] Ended session ${session.id}, reason: ${reason || "user_ended"}`);
        // Check if anyone is waiting in queue and notify
        const nextInQueue = await storage.getNextInHeygenQueue();
        res.json({
            success: true,
            session: {
                id: endedSession.id,
                status: endedSession.status,
                endReason: endedSession.endReason,
                actualDurationSec: endedSession.actualDurationSec,
            },
            queueNotified: !!nextInQueue,
        });
    }
    catch (error) {
        console.error("Error ending session:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// ===================================================================
// Queue Management Endpoints
// ===================================================================
// Join the queue when sessions are at capacity
avatarSimulator.post("/session/queue/join", async (req, res) => {
    try {
        const userId = req.user?.id;
        const { scenarioId, avatarId, mode, priority } = req.body;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Authentication required" });
        }
        // Check if user is already in queue
        const existingEntry = await storage.getUserHeygenQueueEntry(userId);
        if (existingEntry) {
            const position = await storage.getHeygenQueuePosition(existingEntry.id);
            return res.json({
                success: true,
                alreadyQueued: true,
                queueEntry: {
                    id: existingEntry.id,
                    position,
                    queuedAt: existingEntry.queuedAt,
                },
            });
        }
        // Check if sessions are actually at capacity
        const activeCount = await storage.getActiveHeygenSessionsCount();
        if (activeCount < HEYGEN_MAX_CONCURRENT_SESSIONS) {
            return res.json({
                success: true,
                queueNotRequired: true,
                message: "Sessions are available, no queue needed",
            });
        }
        // Add to queue
        const queueEntry = await storage.addToHeygenQueue({
            userId,
            scenarioId: scenarioId ? Number(scenarioId) : null,
            avatarId: avatarId || null,
            mode: mode || "voice",
            status: "queued",
            priority: priority || 0,
            queuedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min queue expiry
        });
        const position = await storage.getHeygenQueuePosition(queueEntry.id);
        const queueLength = await storage.getHeygenQueueLength();
        console.log(`[HeyGen Queue] User ${userId} joined queue at position ${position}`);
        res.json({
            success: true,
            queueEntry: {
                id: queueEntry.id,
                position,
                queuedAt: queueEntry.queuedAt,
                estimatedWaitMinutes: Math.ceil(position * 2),
            },
            totalInQueue: queueLength,
        });
    }
    catch (error) {
        console.error("Error joining queue:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Check queue position
avatarSimulator.get("/session/queue/position", async (req, res) => {
    try {
        const userId = req.user?.id;
        const { queueId } = req.query;
        let entry;
        if (queueId) {
            entry = await storage.getHeygenQueueEntry(Number(queueId));
        }
        else if (userId) {
            entry = await storage.getUserHeygenQueueEntry(userId);
        }
        if (!entry) {
            return res.json({ success: true, inQueue: false });
        }
        if (entry.status !== "queued") {
            return res.json({
                success: true,
                inQueue: false,
                status: entry.status,
                assignedSessionId: entry.assignedSessionId,
            });
        }
        const position = await storage.getHeygenQueuePosition(entry.id);
        const activeCount = await storage.getActiveHeygenSessionsCount();
        const isReady = activeCount < HEYGEN_MAX_CONCURRENT_SESSIONS && position === 1;
        res.json({
            success: true,
            inQueue: true,
            queueEntry: {
                id: entry.id,
                position,
                queuedAt: entry.queuedAt,
                estimatedWaitMinutes: Math.ceil(position * 2),
            },
            isReady,
            activeSessionCount: activeCount,
        });
    }
    catch (error) {
        console.error("Error checking queue position:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Leave the queue
avatarSimulator.post("/session/queue/leave", async (req, res) => {
    try {
        const userId = req.user?.id;
        const { queueId } = req.body;
        let entry;
        if (queueId) {
            entry = await storage.getHeygenQueueEntry(Number(queueId));
        }
        else if (userId) {
            entry = await storage.getUserHeygenQueueEntry(userId);
        }
        if (!entry) {
            return res.json({ success: true, message: "Not in queue" });
        }
        await storage.cancelHeygenQueueEntry(entry.id);
        console.log(`[HeyGen Queue] User ${userId || entry.userId} left queue`);
        res.json({ success: true, message: "Left queue successfully" });
    }
    catch (error) {
        console.error("Error leaving queue:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Admin: Cleanup stale sessions and expired queue entries
avatarSimulator.post("/session/cleanup", async (req, res) => {
    try {
        // Cleanup stale sessions (no heartbeat for 5+ minutes)
        const staleSessions = await storage.cleanupStaleHeygenSessions();
        // Cleanup expired queue entries
        const expiredQueue = await storage.cleanupExpiredQueueEntries();
        // Also end any sessions past their expiry time
        const expiredSessions = await storage.getExpiredHeygenSessions();
        for (const session of expiredSessions) {
            await storage.endHeygenSession(session.id, "expired");
        }
        console.log(`[HeyGen Cleanup] Cleaned up ${staleSessions} stale sessions, ${expiredSessions.length} expired sessions, ${expiredQueue} expired queue entries`);
        res.json({
            success: true,
            cleanedUp: {
                staleSessions,
                expiredSessions: expiredSessions.length,
                expiredQueueEntries: expiredQueue,
            },
        });
    }
    catch (error) {
        console.error("Error in session cleanup:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
avatarSimulator.post("/save-scenario", async (req, res) => {
    try {
        const scenario = req.body;
        // const client = await pool.connect();
        const result = await pool.query(`INSERT INTO scenarios (
        id, skill_id, name, description, context, instructions, difficulty, knowledge_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`, [
            `scenario_${Date.now()}`,
            scenario.skillId,
            scenario.name,
            scenario.description,
            scenario.context,
            scenario.instructions,
            scenario.difficulty,
            scenario.knowledgeId,
        ]);
        res.json({ success: true, scenarioId: result.rows[0].id });
    }
    catch (error) {
        console.error("Error saving scenario:", error);
        res.status(500).json({ success: false, error: "Failed to save scenario" });
    }
});
// avatarSimulator.get("/get-scenarios", async (req, res) => {
//   const skillId = req.query.skillId;
//   const role = req.query?.role;
//   console.log(
//     `GET /api/get-scenarios called with skillId: ${skillId}, role: ${role}`,
//   );
//   try {
//     // const client = await pool.connect();
//     const scenarioId = req.query?.scenarioId;
//     let query = `
//       SELECT
//         scenarios.id,
//   scenarios.skill_id AS "skillId",
//   scenarios.name,
//   scenarios.avatar_role AS "avatarRole",
//   scenarios.avatar_name AS "avatarName",
//   scenarios.description,
//   scenarios.context,
//   scenarios.instructions,
//   scenarios.difficulty,
//   skills.name AS "skillName"
//       FROM scenarios
//       LEFT JOIN skills ON scenarios.skill_id = skills.id
//     `;
//     const params = [];
//     let paramCount = 1;
//     if (scenarioId) {
//       query += ` WHERE scenarios.id = $${paramCount}`;
//       params.push(scenarioId);
//       paramCount++;
//     } else if (skillId) {
//       query += ` WHERE scenarios.skill_id = $${paramCount}`;
//       params.push(skillId);
//       paramCount++;
//     } else if (role) {
//       query += ` WHERE scenarios.avatar_role = $${paramCount}`;
//       params.push(role);
//       paramCount++;
//     }
//     query += ` ORDER BY name`;
//     const result = await pool.query(query, params);
//     res.json({ success: true, scenarios: result.rows });
//   } catch (error) {
//     console.error("Error getting scenarios:", error);
//     res.status(500).json({
//       success: false,
//       error: (error as Error).message || "Database error",
//     });
//   }
// });
avatarSimulator.get("/get-scenarios", async (req, res) => {
    // Properly handle "null", "undefined", and empty strings as null values
    const parseParam = (param) => {
        if (param === undefined || param === null || param === "null" || param === "undefined" || param === "") {
            return null;
        }
        return String(param);
    };
    const skillId = parseParam(req.query.skillId);
    const role = parseParam(req.query?.role);
    const scenarioId = parseParam(req.query?.scenarioId);
    console.log(`GET /api/get-scenarios called with skillId: ${skillId}, role: ${role}, scenarioId: ${scenarioId}`);
    try {
        let query = `
      SELECT 
        scenarios.id, 
        scenarios.duration,
        scenarios.skill_id AS "skillId",       
        scenarios.name, 
        scenarios.avatar_role AS "avatarRole",
        scenarios.avatar_name AS "avatarName",
        scenarios.description, 
        scenarios.context, 
        scenarios.instructions, 
        scenarios.difficulty, 
        skills.name AS "skillName",            
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', skills_multi.id,
              'name', skills_multi.name
            )
          ) FILTER (WHERE skills_multi.id IS NOT NULL),
          '[]'
        ) AS "skills"                          
      FROM scenarios
      LEFT JOIN skills 
        ON scenarios.skill_id = skills.id             
      LEFT JOIN scenario_skills 
        ON scenario_skills.scenario_id = scenarios.id -- many-to-many
      LEFT JOIN skills AS skills_multi 
        ON scenario_skills.skill_id = skills_multi.id
    `;
        const params = [];
        let conditions = [];
        if (scenarioId) {
            conditions.push(`scenarios.id = $${params.length + 1}`);
            params.push(scenarioId);
        }
        else if (skillId) {
            conditions.push(`scenarios.id IN (
        SELECT scenario_id 
        FROM scenario_skills 
        WHERE skill_id = $${params.length + 1}
      )`);
            params.push(skillId);
        }
        else if (role) {
            conditions.push(`scenarios.avatar_role = $${params.length + 1}`);
            params.push(role);
        }
        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(" AND ");
        }
        query += `
      GROUP BY 
        scenarios.id, scenarios.skill_id, skills.name
      ORDER BY scenarios.id desc
    `;
        const result = await pool.query(query, params);
        res.json({ success: true, scenarios: result.rows });
    }
    catch (error) {
        console.error("Error getting scenarios:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Database error",
            error: error,
        });
    }
});
avatarSimulator.get("/personas", async (req, res) => {
    try {
        const data = await db.select().from(personas).orderBy(personas.id);
        res.json({ success: true, data });
    }
    catch (e) {
        console.error(e);
        res
            .status(500)
            .json({ success: false, error: e, message: "Failed to get personas" });
    }
});
avatarSimulator.post("/personas", async (req, res) => {
    try {
        const { persona, description } = req.body;
        const [created] = await db
            .insert(personas)
            .values({ persona, description })
            .returning();
        res.json({ success: true, data: created });
    }
    catch (e) {
        console.error(e);
        res
            .status(500)
            .json({ success: false, error: e, message: "Failed to get personas" });
    }
});
avatarSimulator.put("/personas/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { persona, description } = req.body;
        const [updated] = await db
            .update(personas)
            .set({ persona, description })
            .where(eq(personas.id, Number(id)))
            .returning();
        res.json({ success: true, data: updated });
    }
    catch (e) {
        console.error(e);
        res
            .status(500)
            .json({ success: false, error: e, message: "Failed to get personas" });
    }
});
// ===== Tones =====
avatarSimulator.get("/tones", async (req, res) => {
    try {
        const data = await db.select().from(tones).orderBy(tones.id);
        res.json({ success: true, data });
    }
    catch (e) {
        console.error(e);
        res
            .status(500)
            .json({ success: false, error: e, message: "Failed to get tones" });
    }
});
avatarSimulator.post("/tones", async (req, res) => {
    try {
        const { tone, description } = req.body;
        const [created] = await db
            .insert(tones)
            .values({ tone, description })
            .returning();
        res.json({ sucess: true, data: created });
    }
    catch (e) {
        console.error(e);
        res
            .status(500)
            .json({ success: false, error: e, message: "Failed to get tones" });
    }
});
avatarSimulator.put("/tones/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { tone, description } = req.body;
        const [updated] = await db
            .update(tones)
            .set({ tone, description })
            .where(eq(tones.id, Number(id)))
            .returning();
        res.json({ success: true, data: updated });
    }
    catch (e) {
        console.error(e);
        res
            .status(500)
            .json({ success: false, error: e, message: "Failed to get tones" });
    }
});
avatarSimulator.post("/analyze-transcript", async (req, res) => {
    try {
        console.log("📝 Starting transcript analysis...");
        const { transcript } = req.body;
        const userId = req.user?.id || transcript?.user_id || null;
        if (!transcript) {
            console.error("❌ Missing transcript in request");
            return res.status(400).json({
                success: false,
                error: "Missing transcript data",
            });
        }
        const validMessages = Array.isArray(transcript.messages)
            ? transcript.messages
                .filter((m) => {
                if (!m || !m.text || typeof m.text !== "string")
                    return false;
                const skipPatterns = [
                    "● User speaking",
                    "● Avatar speaking",
                    "Listening to you...",
                    "Avatar speaking...",
                    "Voice chat",
                    "Ending session",
                    "Session ended",
                ];
                return !skipPatterns.some((pattern) => m.text.includes(pattern));
            })
                .map((m) => ({
                speaker: m.speaker || "Unknown",
                text: m.text
                    .replace(/(?:Avatar|You)\d{1,2}:\d{2}:\d{2}\s?(?:AM|PM)?\s?/, "")
                    .trim(),
                timestamp: m.timestamp,
            }))
                .filter((m) => m.text.length > 0)
            : [];
        console.log(`Processing ${validMessages.length} valid messages for analysis`, JSON.stringify(validMessages, null, 2));
        if (validMessages.length < 2) {
            return res.status(400).json({
                success: false,
                error: "Not enough conversation to analyze",
            });
        }
        try {
            const existingAnalysis = await pool.query(`SELECT * FROM analysis_results WHERE transcript_id = $1`, [transcript.id]);
            if (existingAnalysis.rows.length > 0) {
                const row = existingAnalysis.rows[0];
                if (row) {
                    const reconstructedAnalysis = `
           PERFORMANCE SUMMARY
          - Overall Rating: ${row.overall_rating}
          - Key Strength Demonstrated: ${row.key_strengths}
          - Primary Development Area: ${row.development_areas}

          COMMUNICATION SKILLS EVALUATION
          Score and analyze the user's:
          - Clarity of Expression: ${row.clarity_score}
          - Professional Demeanor: ${row.professional_score}
          - Information Delivery: ${row.information_score}
          - Question Handling: ${row.question_handling_score}

          DEVELOPMENT RECOMMENDATIONS
          ${row.recommendations}
              `.trim();
                    return res.status(200).json({
                        success: true,
                        analysis: row?.full_analysis || reconstructedAnalysis || null,
                        messageCount: validMessages.length,
                    });
                }
            }
        }
        catch (dbCheckError) {
            console.error("❌ Error checking for existing analysis:", dbCheckError);
        }
        const conversation = validMessages
            .map((m) => `${m.speaker}: ${m.text}`)
            .join("\n");
        const prompt = `
You are an expert communication coach analyzing a training simulation conversation.

CONTEXT:
Skill Area: ${transcript.knowledge_id || "Not specified"}
Context: ${transcript.context || "Not specified"}
Instructions: ${transcript.instructions || "Not specified"}

CONVERSATION TRANSCRIPT:
${conversation}

Analyze the USER's communication performance in this conversation and provide focused feedback:

1. PERFORMANCE SUMMARY
- Overall Rating: [1-10]
- Key Strength Demonstrated: (highlight user's best communication aspect)
- Primary Development Area: (most important area for user improvement)

2. COMMUNICATION SKILLS EVALUATION
Score and analyze the user's:
- Clarity of Expression: [1-5]
- Professional Demeanor: [1-5]
- Information Delivery: [1-5]
- Question Handling: [1-5]

3. HIGHLIGHTED STRENGTHS
Identify 2-3 specific moments where the user demonstrated effective communication.

4. IMPROVEMENT OPPORTUNITIES
Point out 2-3 specific instances where communication could be enhanced.

5. DEVELOPMENT RECOMMENDATIONS
- Immediate Focus
- Practice Point
- Resource/Tool

Use specific examples from the user's responses to support each point.
Keep feedback specific, actionable, and evidence-based.`;
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are an expert communication skills coach specializing in workplace scenarios. Provide clear, actionable feedback focused on practical improvement.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.7,
        });
        const analysis = response.choices?.[0]?.message?.content;
        if (!analysis) {
            throw new Error("Invalid response from OpenAI");
        }
        console.log("✅ Analysis completed, saving to database...");
        // Extract key values from text
        const overallRating = parseInt(analysis.match(/Overall Rating: \[(\d+)/)?.[1] || "0");
        const clarityScore = parseInt(analysis.match(/Clarity of Expression: \[(\d+)/)?.[1] || "0");
        const professionalScore = parseInt(analysis.match(/Professional Demeanor: \[(\d+)/)?.[1] || "0");
        const informationScore = parseInt(analysis.match(/Information Delivery: \[(\d+)/)?.[1] || "0");
        const questionHandlingScore = parseInt(analysis.match(/Question Handling: \[(\d+)/)?.[1] || "0");
        try {
            const analysisId = `ar_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
            await pool.query(`INSERT INTO analysis_results 
         (id, transcript_id, overall_rating, key_strengths, development_areas, 
          clarity_score, professional_score, information_score, question_handling_score, recommendations, full_analysis, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`, [
                analysisId,
                transcript.id,
                overallRating,
                analysis
                    .split("Key Strength Demonstrated:")[1]
                    ?.split("\n")[0]
                    ?.trim() || "",
                analysis
                    .split("Primary Development Area:")[1]
                    ?.split("\n")[0]
                    ?.trim() || "",
                clarityScore,
                professionalScore,
                informationScore,
                questionHandlingScore,
                analysis.split("5. DEVELOPMENT RECOMMENDATIONS")[1]?.trim() || "",
                analysis,
                userId,
            ]);
            console.log("✅ Analysis saved to database");
        }
        catch (dbError) {
            console.error("❌ Error saving to database:", dbError);
        }
        return res.status(200).json({
            success: true,
            analysis,
            messageCount: validMessages.length,
        });
    }
    catch (error) {
        console.error("❌ Analysis error:", error);
        return res.status(error.status || 500).json({
            success: false,
            error: error.message || "Failed to analyze transcript",
        });
    }
});
avatarSimulator.post("/capture-avatar-audio", async (req, res) => {
    try {
        const { sessionId, speakerType, text, audioData } = req.body;
        const timestamp = new Date().toISOString();
        const uniqueId = uuidv4();
        let audioBuffer;
        if (audioData instanceof ArrayBuffer ||
            (typeof audioData === "object" && audioData.byteLength)) {
            audioBuffer = Buffer.from(audioData);
        }
        else if (typeof audioData === "string") {
            audioBuffer = Buffer.from(audioData, "base64");
        }
        else {
            throw new Error("Invalid audio data format: " + typeof audioData);
        }
        const bucketName = process.env.S3_BUCKET_NAME?.split("/")[0] || "a3cendkb";
        const filename = `recordings/${sessionId}/${speakerType}_${timestamp}_${uniqueId}.webm`;
        await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: filename,
            Body: audioBuffer,
            ContentType: "audio/webm",
            Metadata: {
                sessionId,
                speakerType,
                text: text || "",
                timestamp,
            },
        }));
        const fileUrl = `https://${bucketName}.s3.amazonaws.com/${filename}`;
        return res.status(200).json({
            success: true,
            message: `${speakerType} audio captured successfully`,
            fileUrl,
            metadata: {
                sessionId,
                speakerType,
                text: text || "",
                timestamp,
            },
        });
    }
    catch (error) {
        console.error("Error in capture-avatar-audio:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Unknown error",
        });
    }
});
avatarSimulator.post("/generate-feedback", async (req, res) => {
    try {
        const { conversation, context, instructions, skill, scenario } = req.body;
        if (!conversation ||
            !Array.isArray(conversation) ||
            conversation.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Valid conversation data is required",
            });
        }
        // Format conversation
        const formattedMessages = conversation
            .map((msg) => `${msg.speaker}: ${msg.text}`)
            .join("\n");
        // Construct prompt
        const prompt = `
Please provide structured feedback on the following conversation between a User and an Avatar.

Context: ${context || "Not provided"}
Instructions: ${instructions || "Not provided"}
Skill focus: ${skill || "Communication skills"}
Scenario: ${scenario || "Professional interaction"}

Conversation transcript:
${formattedMessages}

Please provide feedback in the following format:
1. Overall impression (1-2 paragraphs)
2. Strengths (3-5 bullet points)
3. Areas for improvement (3-5 bullet points)
4. Specific suggestions for better handling this conversation (3-5 bullet points)
5. Score (on a scale of 1-10)
`;
        // Call OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are an expert communication coach specializing in workplace scenarios and interpersonal skills. Your task is to provide constructive, actionable feedback on conversation transcripts.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 1500,
        });
        const feedback = completion.choices[0].message.content;
        return res.status(200).json({
            success: true,
            feedback,
        });
    }
    catch (error) {
        console.error("Error generating feedback:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to generate feedback",
        });
    }
});
avatarSimulator.post("/generate-scenario", async (req, res) => {
    try {
        const { title, description, skillId } = req.body;
        const origin = req.headers.origin || process.env.BASE_URL;
        // Step 1: Get AI-generated instructions
        const aiResponse = await fetch(`${origin}/api/generate-scenario-instructions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, description, skillId }),
        });
        if (!aiResponse.ok) {
            throw new Error("Failed to generate instructions");
        }
        const { context, instructions } = await aiResponse.json();
        // Step 2: Save the new scenario
        const saveResponse = await fetch(`${origin}/api/save-scenario`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: title,
                description,
                skillId,
                instructions,
                context,
                difficulty: "CUSTOM",
                knowledgeId: `custom_${Date.now()}`,
            }),
        });
        if (!saveResponse.ok) {
            throw new Error("Failed to save scenario");
        }
        const saveResult = await saveResponse.json();
        return res.status(200).json({ success: true, ...saveResult });
    }
    catch (error) {
        console.error("Error generating scenario:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Failed to generate scenario",
        });
    }
});
avatarSimulator.post("/generate-scenario-response", async (req, res) => {
    try {
        const { title, description, skillId } = await req.body;
        const prompt = `
    Create detailed instructions for a 10-minute conversation practice scenario based on the following:

    Title: ${title}
    Description: ${description}

    Generate two parts:
    1. Context: A brief background setting for the scenario
    2. Instructions: Specific guidance for the AI avatar's role and behavior

    Key Behavioral Requirements for the Avatar:
    - WAIT for the user to initiate the conversation
    - STAY strictly within the given context and role
    - RESPOND to user questions rather than leading the conversation
    - MAINTAIN the character's role and knowledge boundaries
    - AVOID introducing new topics outside the scenario context
    - KEEP responses concise, clear, and relevant

    Conversation Guidelines:
    - Maximum duration: 10 minutes
    - Create opportunities for natural dialogue
    - Include specific challenges aligned with learning objectives
    - Allow user to practice their communication skills actively

    Format the response as a JSON object with "context" and "instructions" fields.
    Ensure instructions clearly state the avatar should wait for user initiation.`;
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are an expert in creating realistic conversation scenarios for communication practice. Format your response as a JSON object with 'context' and 'instructions' fields.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });
        const response = JSON.parse(completion.choices?.[0]?.message?.content || "{}");
        return res.status(200).json({ success: true, response });
    }
    catch (error) {
        console.error("Error generating scenario:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Failed to generate scenario",
        });
    }
});
avatarSimulator.post("/generate-scenario-response", async (req, res) => {
    try {
        const { transcriptId } = await req.body;
        if (!transcriptId) {
            return res
                .status(400)
                .json({ success: false, error: "Transcript ID is required" });
        }
        // Get transcript from database
        const transcript = await getTranscript(transcriptId);
        if (!transcript) {
            return res
                .status(404)
                .json({ success: false, error: "Transcript not found" });
        }
        // Format transcript for analysis
        const formattedMessages = transcript.messages
            .map((msg) => `${msg.speaker}: ${msg.text}`)
            .join("\n");
        // Prepare context for OpenAI
        const prompt = `
    Please provide structured feedback on the following conversation between a User and an Avatar.

    Context: ${transcript.context || "Not provided"}
    Instructions: ${transcript.instructions || "Not provided"}
    Skill focus: ${transcript.skill || "Communication skills"}
    Scenario: ${transcript.scenario || "Professional interaction"}

    Conversation transcript:
    ${formattedMessages}

    Please provide feedback in the following format:
    1. Overall impression (1-2 paragraphs)
    2. Strengths (3-5 bullet points)
    3. Areas for improvement (3-5 bullet points)
    4. Specific suggestions for better handling this conversation (3-5 bullet points)
    5. Score (on a scale of 1-10)
    `;
        // Get AI analysis
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are an expert communication coach specializing in workplace scenarios and interpersonal skills. Your task is to provide constructive, actionable feedback on conversation transcripts.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 1500,
        });
        const feedback = completion.choices[0].message.content;
        // Save feedback to database
        // await saveFeedback(transcriptId, feedback);
        return res.status(200).json({ success: true, feedback });
    }
    catch (error) {
        console.error("Error generating scenario:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Failed to generate scenario",
        });
    }
});
function cleanObject(obj) {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
}
// CREATE scenario
avatarSimulator.post("/scenario", async (req, res) => {
    try {
        const data = cleanObject({
            skillId: req.body.skillId,
            name: req.body.name,
            description: req.body.description,
            context: req.body.context,
            instructions: req.body.instructions,
            avatarName: req.body.avatarName,
            avatarRole: req.body.avatarRole,
            difficulty: req.body.difficulty,
            duration: req.body?.duration
        });
        const [inserted] = await db.insert(scenarios).values(data).returning();
        const skillIds = req.body?.skillIds;
        if (skillIds?.length) {
            await db
                .insert(scenarioSkills)
                .values(skillIds.map((skillId) => ({
                scenarioId: inserted.id,
                skillId,
            })))
                .onConflictDoNothing();
        }
        res.json({ success: true, scenario: inserted });
    }
    catch (err) {
        console.error(err);
        res
            .status(500)
            .json({ success: false, error, message: "Failed to create scenario" });
    }
});
// UPDATE scenario
avatarSimulator.put("/scenario/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const data = cleanObject(req.body);
        if (Object.keys(data).length === 0) {
            return res
                .status(400)
                .json({ success: false, error: "No valid fields provided" });
        }
        const [updated] = await db
            .update(scenarios)
            .set(data)
            .where(eq(scenarios.id, Number(id)))
            .returning();
        const skillIds = req.body?.skillIds;
        if (skillIds?.length) {
            await db
                .insert(scenarioSkills)
                .values(skillIds.map((skillId) => ({
                scenarioId: updated.id,
                skillId,
            })))
                .onConflictDoNothing();
        }
        if (!updated) {
            return res
                .status(404)
                .json({ success: false, error: "Scenario not found" });
        }
        res.json({ success: true, scenario: updated });
    }
    catch (err) {
        console.error(err);
        res
            .status(500)
            .json({ success: false, error, message: "Failed to update scenario" });
    }
});
avatarSimulator.post("/get-access-token", async (req, res) => {
    try {
        const apiKey = process.env.HEYGEN_API_KEY;
        if (!apiKey) {
            console.error("HEYGEN_API_KEY is not defined in environment variables");
            return res.status(500).send("API key not configured");
        }
        console.log("Attempting to create streaming token...");
        console.log(`API Key exists: ${!!apiKey}, length: ${apiKey?.length}`);
        // Try the new streaming.create_token endpoint
        try {
            console.log("Calling HeyGen streaming.create_token endpoint...");
            const streamingResponse = await fetch("https://api.heygen.com/v1/streaming.create_token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Api-Key": apiKey,
                },
            });
            console.log(`streaming.create_token response status: ${streamingResponse.status}`);
            if (streamingResponse.ok) {
                const data = await streamingResponse.json();
                console.log("✅ Token created successfully via streaming.create_token");
                if (data?.data?.token) {
                    return res.status(200).type("text/plain").send(data.data.token);
                }
                else {
                    console.error("Token response structure unexpected:", JSON.stringify(data));
                }
            }
            else {
                const errorText = await streamingResponse.text();
                console.warn(`streaming.create_token failed (${streamingResponse.status}):`, errorText);
            }
        }
        catch (streamingError) {
            console.warn("Exception in streaming.create_token endpoint:", streamingError);
        }
        // Fallback to access_token endpoint
        console.log("Trying fallback access_token endpoint...");
        const fallbackResponse = await fetch("https://api.heygen.com/v1/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": apiKey,
            },
        });
        console.log(`access_token response status: ${fallbackResponse.status}`);
        if (!fallbackResponse.ok) {
            const errorText = await fallbackResponse.text();
            console.error(`HeyGen fallback API error (${fallbackResponse.status}):`, errorText);
            return res
                .status(fallbackResponse.status)
                .send(`Error from HeyGen API: ${fallbackResponse.status} ${errorText}`);
        }
        const data = await fallbackResponse.json();
        console.log("✅ Token created successfully via access_token fallback");
        if (data?.access_token) {
            return res.status(200).type("text/plain").send(data.access_token);
        }
        else {
            console.error("Fallback token response structure unexpected:", JSON.stringify(data));
            return res.status(500).send("Token response format unexpected");
        }
    }
    catch (error) {
        console.error("Error generating access token:", error);
        return res.status(500).send(`Server error: ${error.message}`);
    }
});
// Server-side avatar session creation for debugging HeyGen errors
avatarSimulator.post("/create-avatar-session", async (req, res) => {
    try {
        const apiKey = process.env.HEYGEN_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ success: false, error: "API key not configured" });
        }
        const { avatarName, quality, knowledgeBase, language } = req.body;
        console.log("=== SERVER-SIDE AVATAR SESSION CREATION ===");
        console.log("Request params:", { avatarName, quality, knowledgeBase: !!knowledgeBase, language });
        // Build the request body matching HeyGen's streaming.new API
        const requestBody = {
            avatar_name: avatarName || "Monica_greeting_public",
            quality: quality || "low",
        };
        if (knowledgeBase) {
            requestBody.knowledge_base = knowledgeBase;
        }
        if (language) {
            requestBody.language = language;
        }
        console.log("Calling HeyGen streaming.new with:", JSON.stringify(requestBody, null, 2));
        const response = await fetch("https://api.heygen.com/v1/streaming.new", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": apiKey,
            },
            body: JSON.stringify(requestBody),
        });
        const responseText = await response.text();
        console.log(`HeyGen streaming.new response status: ${response.status}`);
        console.log(`HeyGen streaming.new response body: ${responseText}`);
        if (!response.ok) {
            console.error(`❌ HeyGen streaming.new failed: ${response.status} - ${responseText}`);
            return res.status(response.status).json({
                success: false,
                error: `HeyGen API error: ${response.status}`,
                details: responseText,
                heygenStatus: response.status,
            });
        }
        let data;
        try {
            data = JSON.parse(responseText);
        }
        catch (e) {
            return res.status(500).json({
                success: false,
                error: "Invalid JSON response from HeyGen",
                rawResponse: responseText,
            });
        }
        console.log("✅ HeyGen streaming.new succeeded:", JSON.stringify(data, null, 2));
        return res.json({
            success: true,
            data: data,
            sessionId: data?.data?.session_id,
            sdpOffer: data?.data?.sdp?.sdp,
            iceServers: data?.data?.ice_servers2,
        });
    }
    catch (error) {
        console.error("Error creating avatar session:", error);
        return res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack,
        });
    }
});
avatarSimulator.get("/get-session-recordings", async (req, res) => {
    const sessionId = req.query.sessionId;
    if (!sessionId) {
        return res.status(400).json({
            success: false,
            error: "No sessionId provided",
        });
    }
    const bucketName = process.env.S3_BUCKET_NAME?.split("/")[0] || "a3cendkb";
    if (!bucketName) {
        return res.status(500).json({
            success: false,
            error: "Missing AWS_S3_BUCKET_NAME in environment variables",
        });
    }
    console.log(`Looking for recordings for session: ${sessionId}`);
    try {
        const prefix = `${sessionId}/`;
        const listParams = {
            Bucket: bucketName,
            Prefix: prefix,
        };
        const data = await s3Client.send(new ListObjectsV2Command(listParams));
        if (!data.Contents || data.Contents.length === 0) {
            console.log("No files found for this session");
            return res.json({ success: true, files: [] });
        }
        console.log(`Found ${data.Contents.length} files for session ${sessionId}`);
        const files = data.Contents.map((item) => {
            const key = item.Key || "";
            const filename = key.split("/").pop() || "";
            let speakerType = "unknown";
            if (filename.startsWith("user_"))
                speakerType = "user";
            else if (filename.startsWith("avatar_"))
                speakerType = "avatar";
            else if (filename.startsWith("combined_"))
                speakerType = "combined";
            const rawTimestamp = filename.replace(".webm", "").split("_").pop();
            const timestampNum = parseInt(rawTimestamp || "");
            const timestamp = !isNaN(timestampNum)
                ? new Date(timestampNum).toISOString()
                : "";
            return {
                fileUrl: `https://${bucketName}.s3.amazonaws.com/${encodeURIComponent(key)}`,
                key,
                speakerType,
                filename,
                timestamp,
                size: item.Size,
            };
        });
        console.log(`Processed ${files.length} file entries for client`);
        res.json({
            success: true,
            files,
            bucket: bucketName,
            sessionId,
        });
    }
    catch (error) {
        console.error("Error listing session recordings:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Failed to retrieve recordings",
            sessionId,
        });
    }
});
avatarSimulator.post("/get-session-transcript-id", async (req, res) => {
    try {
        const { sessionId } = req.body;
        // const client = await pool.connect();
        const result = await pool.query("SELECT transcript_id FROM streaming_sessions WHERE session_id = $1", [sessionId]);
        res.json({
            success: true,
            transcriptId: result.rows[0]?.transcript_id || null,
        });
    }
    catch (error) {
        console.error("Error getting transcript id: ", error);
        res.status(500).json({
            success: false,
            error: error.message || "Failed to retrieve treanscript id",
        });
    }
});
avatarSimulator.get("/get-transcript", async (req, res) => {
    const transcriptId = req.query.id;
    try {
        const result = await getTranscriptById(transcriptId);
        if (!result) {
            console.error("No result returned from getTranscriptById");
            return res.status(500).json({
                success: false,
                error: "No result returned from database",
            });
        }
        if (!result.success) {
            console.error(`Failed to get transcript: ${result.error}`);
            return res.status(500).json({
                success: false,
                error: result.error || "Failed to get transcript",
            });
        }
        if (!result.transcript) {
            console.log(`❌ Transcript not found: ${id}`);
            return res.status(404).json({
                success: false,
                error: "Transcript not found",
            });
        }
        // Ensure messages is properly structured
        const transcript = {
            ...result.transcript,
            messages: Array.isArray(result.transcript.messages)
                ? result.transcript.messages
                : typeof result.transcript.messages === "string"
                    ? JSON.parse(result.transcript.messages)
                    : [],
        };
        return res.json({
            success: true,
            transcript,
            source: result.source || "database",
        });
    }
    catch (error) {
        console.error("Error getting transcript:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get transcript",
            error: error.message || "Failed to get skills",
        });
    }
});
avatarSimulator.get("/get-transcripts", async (req, res) => {
    try {
        let userId = 1; // Default to demo user
        // If authenticated, get the legacy user ID linked to this auth user
        if (req.user?.id) {
            const legacyUser = await storage.getLegacyUserByAuthUserId(req.user.id);
            if (legacyUser) {
                userId = legacyUser.id;
            }
        }
        else if (req.query.userId) {
            const parsed = parseInt(req.query.userId, 10);
            if (!isNaN(parsed))
                userId = parsed;
        }
        const result = await getAllTranscripts(userId);
        if (!result) {
            console.error("No result returned from getTranscriptById");
            return res.status(500).json({
                success: false,
                error: "No result returned from database",
            });
        }
        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: result?.error || "Failed to get transcripts",
            });
        }
        else {
            return res.json({
                success: result.success,
                transcripts: result.transcripts,
                source: result.source || "database",
            });
        }
    }
    catch (error) {
        console.error("Error getting transcript:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get transcripts",
            error: error.message || "Failed to get trascripts",
        });
    }
});
avatarSimulator.get("/skill-progress", async (req, res) => {
    try {
        let userId = 1; // Default to demo user
        // If authenticated, get the legacy user ID linked to this auth user
        if (req.user?.id) {
            const legacyUser = await storage.getLegacyUserByAuthUserId(req.user.id);
            if (legacyUser) {
                userId = legacyUser.id;
            }
        }
        else if (req.query.userId) {
            const parsed = parseInt(req.query.userId, 10);
            if (!isNaN(parsed))
                userId = parsed;
        }
        // Get skill progress with average scores per skill for this user
        // Join with roleplay_session (where skill assessments are stored)
        const result = await pool.query(`
      SELECT 
        s.id as skill_id,
        s.name as skill_name,
        s.framework_mapping,
        COALESCE(user_scores.session_count, 0) as session_count,
        user_scores.avg_score,
        user_scores.best_score,
        user_scores.framework_used,
        user_scores.last_practiced
      FROM skills s
      LEFT JOIN (
        SELECT 
          sas.skill_id,
          COUNT(DISTINCT sas.session_id) as session_count,
          ROUND(AVG(sas.overall_skill_score)::numeric, 1) as avg_score,
          MAX(sas.overall_skill_score) as best_score,
          MAX(sas.framework_used) as framework_used,
          MAX(rs.created_at) as last_practiced
        FROM skill_assessment_summary sas
        JOIN roleplay_session rs ON sas.session_id = rs.id
        WHERE rs.user_id = $1
        GROUP BY sas.skill_id
      ) user_scores ON s.id = user_scores.skill_id
      ORDER BY COALESCE(user_scores.session_count, 0) DESC, s.name
    `, [userId]);
        // Also get recent dimension scores for additional detail
        const dimensionsResult = await pool.query(`
      SELECT 
        s.id as skill_id,
        sda.dimension_name,
        ROUND(AVG(sda.score)::numeric, 1) as avg_score,
        COUNT(*) as count
      FROM skill_dimension_assessments sda
      JOIN skills s ON sda.skill_id = s.id
      JOIN roleplay_session rs ON sda.session_id = rs.id
      WHERE rs.user_id = $1
      GROUP BY s.id, sda.dimension_name
      ORDER BY s.id, sda.dimension_name
    `, [userId]);
        // Group dimensions by skill
        const dimensionsBySkill = {};
        for (const row of dimensionsResult.rows) {
            if (!dimensionsBySkill[row.skill_id]) {
                dimensionsBySkill[row.skill_id] = [];
            }
            dimensionsBySkill[row.skill_id].push({
                dimension: row.dimension_name,
                avgScore: parseFloat(row.avg_score) || 0,
                count: parseInt(row.count) || 0
            });
        }
        const skillProgress = result.rows.map(row => ({
            skillId: row.skill_id,
            skillName: row.skill_name,
            sessionCount: parseInt(row.session_count) || 0,
            avgScore: parseFloat(row.avg_score) || null,
            bestScore: parseFloat(row.best_score) || null,
            frameworkUsed: row.framework_used,
            frameworkMapping: row.framework_mapping,
            lastPracticed: row.last_practiced,
            dimensions: dimensionsBySkill[row.skill_id] || []
        }));
        return res.json({
            success: true,
            skillProgress
        });
    }
    catch (error) {
        console.error("Error getting skill progress:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get skill progress",
            error: error.message
        });
    }
});
avatarSimulator.post("/process-transcripts", async (req, res) => {
    try {
        const { transcript } = await req.body;
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Structure the conversation transcript into a clear format with timestamp, speakers, and key points. For non-English text, provide both the original text and its English translation. Organize it professionally.",
                },
                {
                    role: "user",
                    content: transcript,
                },
            ],
        });
        res.json({
            success: true,
            structured_transcript: response.choices[0].message.content,
        });
    }
    catch (error) {
        console.error("Error processing transcript:", error);
        res.status(500).json({
            success: false,
            message: "Failed to process transcripts",
            error: error.message || "Failed to process trascripts",
        });
    }
});
avatarSimulator.post("/save-onboarding", async (req, res) => {
    try {
        const data = await req.body;
        // const client = await pool.connect();
        // Insert user data
        const result = await pool.query(`INSERT INTO users (email, role, industry, skill_level, goals, assessment_answers)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`, [
            data.email,
            data.role,
            data.industry,
            data.skillLevel,
            data.goals,
            data.assessmentAnswers,
        ]);
        return res.json({
            success: true,
            userId: result.rows[0].id,
        });
    }
    catch (error) {
        console.error("Error saving:", error);
        res.status(500).json({
            success: false,
            message: "Failed to process transcripts",
            error: error.message || "Failed to process trascripts",
        });
    }
});
avatarSimulator.post("/save-streaming-session", async (req, res) => {
    try {
        const data = await req.body;
        console.log("📝 Received session data:", data);
        if (!data.sessionId || !data.avatarId || !data.knowledgeId) {
            return res
                .status(400)
                .json({ success: false, error: "Missing required fields" });
        }
        // Save session using the db utility function
        // Prioritize session user ID (proper UUID) over request body userId
        const sessionResult = await saveStreamingSession({
            sessionId: data.sessionId,
            avatarId: data.avatarId,
            knowledgeId: data.knowledgeId,
            startTime: data.startTime || new Date().toISOString(),
            endTime: data.endTime || new Date().toISOString(),
            transcriptId: data.transcriptId,
            userId: req.user?.id || null,
        });
        if (!sessionResult.success) {
            throw new Error(sessionResult.error || "Failed to save streaming session");
        }
        return res.json({ success: true, sessionId: data.sessionId });
    }
    catch (error) {
        console.error("❌ Error saving streaming session:", error);
        return res.json({ success: false, error: error.message });
    }
});
avatarSimulator.post("/save-transcript", async (req, res) => {
    try {
        console.log("=== 🚀 Save transcript API endpoint called ===");
        // Check if request body exists
        if (!req.body) {
            console.error("❌ Error: No request body provided");
            return res
                .status(400)
                .json({ success: false, error: "No request body provided" });
        }
        // Parse request JSON
        console.log("🔍 Parsing request JSON...");
        const data = await req.body;
        // Validate required fields
        if (!data.sessionId || !data.messages || !Array.isArray(data.messages)) {
            console.error("❌ Invalid data structure:", {
                hasSessionId: !!data.sessionId,
                hasMessages: !!data.messages,
                messagesIsArray: Array.isArray(data.messages),
            });
            return res.status(400).json({
                success: false,
                error: "Invalid data structure: sessionId and messages array required",
            });
        }
        // Convert auth user ID (UUID) to legacy user ID (integer)
        // Prioritize session user ID (proper UUID) over request body userId (may be legacy int)
        let legacyUserId = null;
        const authUserId = req.user?.id;
        if (authUserId) {
            const legacyUser = await storage.getLegacyUserByAuthUserId(authUserId);
            if (legacyUser) {
                legacyUserId = legacyUser.id;
            }
            else if (req.user?.username) {
                // Create legacy user if authenticated but not linked
                const created = await storage.getOrCreateLegacyUser(authUserId, req.user.username);
                legacyUserId = created.id;
            }
        }
        // Generate or use provided transcript ID
        const transcriptId = data.transcriptId || generateUniqueId();
        console.log("📝 Using transcript ID:", transcriptId);
        // Normalize data for database
        console.log("🔍 Normalizing data for database...");
        const normalizedData = {
            transcriptId,
            sessionId: data.sessionId,
            avatarId: data.avatarId || "unknown",
            knowledgeId: data.knowledgeId || "unknown",
            context: data.context || null,
            instructions: data.instructions || null,
            scenario: data.scenario || null,
            skill: data.skill || null,
            duration: data.duration || null,
            messages: data.messages.map((msg) => ({
                speaker: msg.speaker,
                text: msg.text,
                timestamp: msg.timestamp || new Date().toLocaleTimeString(),
                createdAt: msg?.createdAt,
            })),
            userId: legacyUserId,
            skillId: data.skillId || null,
            scenarioId: data.scenarioId || null,
            customScenarioId: data.customScenarioId || null,
            sessionType: data?.sessionType,
        };
        // Log message structure for first message (if exists)
        if (normalizedData.messages.length > 0) {
            console.log("📝 First message structure:", JSON.stringify(normalizedData.messages[0]));
        }
        console.log("🔍 Saving transcript with ID:", transcriptId);
        const result = await saveTranscriptToDatabase(normalizedData);
        if (!result.success) {
            throw new Error("Failed to save transcript");
        }
        // Return success response
        return res.json({
            success: true,
            transcriptId: result.transcriptId,
        });
    }
    catch (error) {
        console.error("❌ Error in save-transcript API:", error);
        return res.status(500).json({
            success: false,
            error: error?.message || "Failed to save transcript",
        });
    }
});
avatarSimulator.post("/update-scenarios", async (req, res) => {
    try {
        // const client = await pool.connect();
        await pool.query(`
      -- First make sure the columns exist
      ALTER TABLE scenarios 
      ADD COLUMN IF NOT EXISTS avatar_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS avatar_role VARCHAR(100);

      -- Update all scenarios with avatar data
      UPDATE scenarios SET avatar_name = 'Priya Sharma', avatar_role = 'Manager'
      WHERE name = 'Delivering a Difficult Message About Organizational Change';

      UPDATE scenarios SET avatar_name = 'Karan', avatar_role = 'Marketing Manager'
      WHERE name = 'Resolving a Conflict About Shared Responsibilities';

      UPDATE scenarios SET avatar_name = 'Sophie', avatar_role = 'Analyst'
      WHERE name = 'Addressing a Denied Salary or Promotion Request';

      UPDATE scenarios SET avatar_name = 'Sam', avatar_role = 'Lead UX Designer'
      WHERE name = 'Addressing a Peer Who Frequently Misses Team Deadlines';

      UPDATE scenarios SET avatar_name = 'Karan Mehta', avatar_role = 'Marketing Manager'
      WHERE name = 'Asking for Support or Backup During a Busy Period';

      UPDATE scenarios SET avatar_name = 'Ravi Desai', avatar_role = 'Engineering Lead'
      WHERE name = 'Collaborating on a Cross-Functional Project with Tight Deadlines';

      UPDATE scenarios SET avatar_name = 'Neha Kapoor', avatar_role = 'Lead UX Designer'
      WHERE name = 'Navigating a Difference in Working Styles';

      UPDATE scenarios SET avatar_name = 'Arjun', avatar_role = 'HR Business Partner'
      WHERE name = 'Reporting Unethical Behavior or Policy Violations';

      UPDATE scenarios SET avatar_name = 'Anil', avatar_role = 'Project Manager'
      WHERE name = 'Sharing Ideas for Process Improvements';

      UPDATE scenarios SET avatar_name = 'Raj', avatar_role = 'Software Engineer'
      WHERE name = 'Understanding and Communicating Company Values and Culture';

      UPDATE scenarios SET avatar_name = 'Sophia', avatar_role = 'Product Designer'
      WHERE name = 'Asking a Teammate to Change How They Work on a Shared Task';

      UPDATE scenarios SET avatar_name = 'Jordan', avatar_role = 'Marketing Specialist'
      WHERE name = 'Asking for Accommodations';

      UPDATE scenarios SET avatar_name = 'Asha', avatar_role = 'Marketing Specialist'
      WHERE name = 'Clarifying Leave Policies or Compensation Structures';

      UPDATE scenarios SET avatar_name = 'Alex', avatar_role = 'Analyst'
      WHERE name = 'Clarifying Miscommunication in a One-on-One Meeting';

      UPDATE scenarios SET avatar_name = 'Alex', avatar_role = 'Project Manager'
      WHERE name = 'Communicating a Company-wide Decision Employees May Not Agree With';

      UPDATE scenarios SET avatar_name = 'Ethan', avatar_role = 'Team lead'
      WHERE name = 'Communicating Burnout or Stress in a Professional Manner';

      UPDATE scenarios SET avatar_name = 'Neel', avatar_role = 'Senior Manager'
      WHERE name = 'Communicating During Performance Review Conversations';

      UPDATE scenarios SET avatar_name = 'Daniel', avatar_role = 'Engineering Lead'
      WHERE name = 'Confronting Gossip or Workplace Rumors';

      UPDATE scenarios SET avatar_name = 'Peter', avatar_role = 'Peer'
      WHERE name = 'Discussing Behavioral Concerns with a Colleague';

      UPDATE scenarios SET avatar_name = 'Anna', avatar_role = 'Project Manager'
      WHERE name = 'Discussing Concerns About Psychological Safety or Well-being';

      UPDATE scenarios SET avatar_name = 'Nina', avatar_role = 'Sr. Analyst'
      WHERE name = 'Discussing Potential for Internal Mobility or Role Change';

      UPDATE scenarios SET avatar_name = 'Alex', avatar_role = 'Product Manager'
      WHERE name = 'Expressing Disagreement Respectfully';

      UPDATE scenarios SET avatar_name = 'James', avatar_role = 'Software Engineer'
      WHERE name = 'Giving Feedback on Workplace Policies or Practices';

      UPDATE scenarios SET avatar_name = 'Jordan', avatar_role = 'Analyst'
      WHERE name = 'Giving Tough Feedback About Performance';

      UPDATE scenarios SET avatar_name = 'Emily', avatar_role = 'Marketing Specialist'
      WHERE name = 'Inquiring About Learning and Development Opportunities';

      UPDATE scenarios SET avatar_name = 'Sarah', avatar_role = 'Chief Financial Officer'
      WHERE name = 'Leading a High-Stakes Meeting and Projecting Confidence';

      UPDATE scenarios SET avatar_name = 'David', avatar_role = 'Software Engineer'
      WHERE name = 'Navigating Sensitive Issues Like Mental Health or Personal Crises';

      UPDATE scenarios SET avatar_name = 'Adrian', avatar_role = 'Project Specialist'
      WHERE name = 'Negotiating Workload or Prioritization of Tasks';

      UPDATE scenarios SET avatar_name = 'Maya', avatar_role = 'Sr. Analyst'
      WHERE name = 'Presenting a Major Project Update to Senior Leadership';

      UPDATE scenarios SET avatar_name = 'Arjun', avatar_role = 'Sr. Analyst'
      WHERE name = 'Proactively Sharing Accomplishments and Contributions';

      UPDATE scenarios SET avatar_name = 'Sarah', avatar_role = 'Team lead'
      WHERE name = 'Raising Concerns About Team Dynamics or Morale';

      UPDATE scenarios SET avatar_name = 'Layla', avatar_role = 'Sr. Analyst'
      WHERE name = 'Reporting Harassment or Discrimination';

      UPDATE scenarios SET avatar_name = 'James', avatar_role = 'Director of Strategy'
      WHERE name = 'Responding to Challenging Questions from Senior Executives';

      UPDATE scenarios SET avatar_name = 'Liam', avatar_role = 'Senior Analyst'
      WHERE name = 'Seeking Help in Resolving Team or Manager Conflict';

      UPDATE scenarios SET avatar_name = 'Liam', avatar_role = 'Peer'
      WHERE name = 'Sharing Credit Fairly for a Joint Achievement';
    `);
        return res.json({
            success: true,
            message: "All scenarios updated successfully with avatar information",
        });
    }
    catch (error) {
        console.error("Error updating scenarios:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Internal server error",
        });
    }
});
avatarSimulator.post("/session-analysis", async (req, res) => {
    try {
        const { transcriptId, sessionId, sessionType = "audio_roleplay", } = req.body;
        if (!transcriptId) {
            return res.json({
                success: false,
                message: "No transcriptId provided, skipping session analysis.",
            });
        }
        // 1. Fetch transcript meta
        const [transcript] = await db
            .select()
            .from(transcripts)
            .where(eq(transcripts.id, transcriptId));
        if (!transcript) {
            return res.status(404).json({
                success: false,
                message: "Transcript not found for given transcriptId",
            });
        }
        // 2. Fetch transcript messages
        const transcriptMessagesResults = await db
            .select()
            .from(transcriptMessages)
            .where(eq(transcriptMessages.transcriptId, transcriptId));
        if (!transcriptMessagesResults?.length) {
            return res.status(404).json({
                success: false,
                message: "Transcript messages not found for given transcriptId",
            });
        }
        const transcriptMessagesResult = transcriptMessagesResults[0];
        console.log("Transcript messages:", JSON.stringify(transcriptMessagesResult, null, 2));
        // 3. Check if analysis already exists
        const existingAnalysis = await db
            .select()
            .from(aiSessionAnalysis)
            .where(eq(aiSessionAnalysis.transcriptId, transcriptId));
        if (existingAnalysis?.length) {
            console.log("Analysis already exists for transcriptId:", JSON.stringify(existingAnalysis, null, 2));
            // Fetch skill assessments for existing analysis
            let skillAssessments = { summary: [], dimensions: [] };
            const sessionIdForAssessment = existingAnalysis[0].sessionId;
            console.log(`Fetching skill assessments for sessionId: ${sessionIdForAssessment}`);
            if (sessionIdForAssessment) {
                try {
                    skillAssessments = await getSkillAssessmentsForSession(pool, sessionIdForAssessment);
                    console.log(`Skill assessments fetched: summary count=${skillAssessments.summary.length}, dimensions count=${skillAssessments.dimensions.length}`);
                    // If no skill assessments exist, try to generate them now
                    if (skillAssessments.summary.length === 0 && skillAssessments.dimensions.length === 0) {
                        console.log("No skill assessments found, attempting to generate them for existing analysis...");
                        const conversationText = transcriptMessagesResult.messages
                            .map((m) => `${m.speaker}: ${m.text}`)
                            .join("\n");
                        const customScenarioId = transcript.customScenarioId || null;
                        const scenarioId = transcript.scenarioId || null;
                        console.log(`Generating skill assessments with scenarioId: ${scenarioId}, customScenarioId: ${customScenarioId}`);
                        const generatedAssessments = await performSkillAssessmentForSession(pool, sessionIdForAssessment, scenarioId, conversationText, customScenarioId);
                        if (generatedAssessments.length > 0) {
                            console.log(`Generated ${generatedAssessments.length} skill assessments for existing session`);
                            // Re-fetch the saved assessments to return properly formatted data
                            skillAssessments = await getSkillAssessmentsForSession(pool, sessionIdForAssessment);
                        }
                    }
                }
                catch (skillError) {
                    console.error("Error fetching/generating skill assessments for existing analysis:", skillError);
                }
            }
            return res.json({
                success: true,
                transcript: transcript,
                transcriptMessage: transcriptMessagesResult,
                analysis: existingAnalysis[0],
                skillAssessments,
            });
        }
        // 4. Generate new analysis
        const analysisResult = await generateSessionAnalysis(transcriptMessagesResult.messages);
        console.log("New Analysis result:", JSON.stringify(analysisResult, null, 2));
        // 5. Insert new analysis - Get the roleplay session ID from the transcript
        // Handle both numeric and string types for sessionId
        let roleplaySessionId = null;
        if (transcript.sessionId) {
            roleplaySessionId = typeof transcript.sessionId === 'number'
                ? transcript.sessionId
                : parseInt(transcript.sessionId, 10);
        }
        else if (sessionId) {
            roleplaySessionId = typeof sessionId === 'number'
                ? sessionId
                : parseInt(sessionId, 10);
        }
        if (!roleplaySessionId || isNaN(roleplaySessionId)) {
            console.error("No valid session ID found. transcript.sessionId:", transcript.sessionId, "sessionId:", sessionId);
            return res.status(400).json({
                success: false,
                message: "No valid session ID found for analysis. Ensure the transcript has a valid session.",
            });
        }
        const [inserted] = await db
            .insert(aiSessionAnalysis)
            .values({
            sessionId: roleplaySessionId,
            transcriptId,
            sessionType: transcript.sessionType || "streaming_avatar",
            overallScore: Math.round(analysisResult.overallScore),
            userTalkTime: analysisResult.talkTime.userTime,
            otherTalkTime: analysisResult.talkTime.otherTime,
            userTalkPercentage: analysisResult.talkTime.userPercentage,
            fillerWords: analysisResult.wordChoice.fillerWords,
            weakWords: analysisResult.wordChoice.weakWords,
            sentenceOpeners: analysisResult.wordChoice.sentenceOpeners,
            activeListening: analysisResult.listening.activeListening,
            engagementLevel: analysisResult.listening.engagementLevel,
            questionsAsked: analysisResult.listening.questionsAsked,
            acknowledgments: analysisResult.listening.acknowledgments,
            interruptions: analysisResult.listening.interruptions,
            averagePacing: analysisResult.delivery.averagePacing,
            pacingVariation: analysisResult.delivery.pacingVariation,
            tone: analysisResult.delivery.tone,
            pauseCount: analysisResult.delivery.pauseCount,
            averagePauseLength: analysisResult.delivery.averagePauseLength,
            strengths: analysisResult.feedback.strengths,
            growthAreas: analysisResult.feedback.growthAreas,
            followUpQuestions: analysisResult.feedback.followUpQuestions,
            summary: analysisResult.feedback.summary,
            pronunciationIssues: analysisResult.feedback.pronunciation.issues,
            pronunciationSuggestions: analysisResult.feedback.pronunciation.suggestions,
        })
            .returning();
        // 6. Perform skill dimension assessment if scenario has skills with frameworks
        let skillAssessments = [];
        try {
            const conversationText = transcriptMessagesResult.messages
                .map((m) => `${m.speaker}: ${m.text}`)
                .join("\n");
            skillAssessments = await performSkillAssessmentForSession(pool, roleplaySessionId, transcript.scenarioId || null, conversationText, transcript.customScenarioId || null);
            console.log(`Completed skill dimension assessment: ${skillAssessments.length} skills assessed`);
        }
        catch (skillError) {
            console.error("Error during skill dimension assessment:", skillError);
        }
        return res.json({
            success: true,
            transcript: transcript,
            transcriptMessage: transcriptMessagesResult,
            analysis: inserted,
            skillAssessments,
        });
    }
    catch (error) {
        console.error("Analysis error:", error);
        return res.status(500).json({
            success: false,
            error,
            message: "Failed to analyze transcript",
        });
    }
});
avatarSimulator.get("/session-analysis/:id", async (req, res) => {
    try {
        const roleplaySessionId = req.params?.id;
        const transcriptId = req.query?.transcript;
        if (!roleplaySessionId) {
            return res.status(400).json({
                success: false,
                error: "Invalid session ID",
            });
        }
        const result = await db
            .select({
            session: roleplaySession,
            transcript: transcriptMessages,
            analysis: aiSessionAnalysis,
        })
            .from(roleplaySession)
            .leftJoin(transcriptMessages, eq(roleplaySession.transcriptId, transcriptMessages.transcriptId))
            .leftJoin(aiSessionAnalysis, eq(roleplaySession.id, aiSessionAnalysis.sessionId))
            .where(eq(roleplaySession.id, roleplaySessionId));
        console.log("✅ Session analysis fetched successfully", JSON.stringify(result, null, 2));
        if (!result?.length) {
            return res.status(404).json({
                success: true,
                data: null,
            });
        }
        // Fetch skill dimension assessments for this session
        let skillAssessments = { summary: [], dimensions: [] };
        try {
            skillAssessments = await getSkillAssessmentsForSession(pool, parseInt(roleplaySessionId));
        }
        catch (skillError) {
            console.error("Error fetching skill assessments:", skillError);
        }
        res.json({
            success: true,
            data: {
                ...result[0],
                skillAssessments,
            },
        });
    }
    catch (e) {
        console.error("Error fetching session analysis:", e);
        res.status(500).json({
            success: false,
            message: "Failed to fetch session analysis",
            error: e,
        });
    }
});
avatarSimulator.get("/skill-assessments/:sessionId", async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);
        if (isNaN(sessionId)) {
            return res.status(400).json({
                success: false,
                error: "Invalid session ID",
            });
        }
        const assessments = await getSkillAssessmentsForSession(pool, sessionId);
        res.json({
            success: true,
            data: assessments,
        });
    }
    catch (error) {
        console.error("Error fetching skill assessments:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch skill assessments",
            error,
        });
    }
});
avatarSimulator.post("/save-roleplay-session", async (req, res) => {
    try {
        const { avatarId, knowledgeId, transcriptId, startTime, endTime, duration, audioUrl, } = req.body;
        // Get auth user ID from session (this is the UUID from auth_users table)
        const authUserId = req.user?.id;
        // Convert auth user ID (UUID) to legacy user ID (integer)
        let legacyUserId = 1; // Default to demo user
        if (authUserId) {
            const legacyUser = await storage.getLegacyUserByAuthUserId(authUserId);
            if (legacyUser) {
                legacyUserId = legacyUser.id;
            }
            else if (req.user?.username) {
                // Create legacy user if authenticated but not linked
                const created = await storage.getOrCreateLegacyUser(authUserId, req.user.username);
                legacyUserId = created.id;
            }
        }
        // Insert row
        const [newSession] = await db
            .insert(roleplaySession)
            .values({
            userId: legacyUserId,
            avatarId: avatarId || null,
            knowledgeId: knowledgeId || null,
            transcriptId,
            startTime: startTime ? new Date(startTime) : undefined,
            endTime: endTime ? new Date(endTime) : undefined,
            duration,
            audioUrl: audioUrl || null,
        })
            .returning();
        // ACTIVITY TRACKING: Track AI scenario/roleplay session completion
        if (legacyUserId && newSession) {
            try {
                // Get scenario/avatar details if available
                let scenarioName = 'AI Roleplay Session';
                if (knowledgeId) {
                    try {
                        const [scenario] = await db
                            .select()
                            .from(scenarios)
                            .where(eq(scenarios.knowledgeId, knowledgeId))
                            .limit(1);
                        if (scenario) {
                            scenarioName = scenario.name || scenarioName;
                        }
                    }
                    catch (err) {
                        console.log('[Activity Tracking] Could not fetch scenario details:', err);
                    }
                }
                const activityData = {
                    userId: legacyUserId,
                    activityType: 'ai_scenario_complete',
                    description: `Completed AI scenario: ${scenarioName}`,
                    metadata: {
                        roleplaySessionId: newSession.id,
                        avatarId: avatarId,
                        knowledgeId: knowledgeId,
                        scenarioName: scenarioName,
                        transcriptId: transcriptId,
                        startTime: startTime,
                        endTime: endTime,
                        audioUrl: audioUrl
                    },
                    duration: duration || 0,
                    sourceSystem: 'ai_roleplay'
                };
                // Check if activity tracking functions exist before calling
                if (typeof storage.createUserActivity === 'function') {
                    const createdActivity = await storage.createUserActivity(activityData);
                    if (typeof storage.addToAIProcessingQueue === 'function') {
                        await storage.addToAIProcessingQueue(legacyUserId, createdActivity.id);
                    }
                    console.log(`[Activity Tracking] AI scenario completion activity created for user ${legacyUserId}, session ${newSession.id}`);
                }
                else {
                    console.log(`[Activity Tracking] Activity tracking not available, skipping`);
                }
            }
            catch (activityError) {
                console.error("[Activity Tracking] Error creating AI scenario completion activity:", activityError);
            }
        }
        res.json({
            success: true,
            session: newSession,
        });
    }
    catch (error) {
        console.error("Error inserting roleplay session:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to create session", error });
    }
});
// avatarSimulator.post(
//   "/upload-recording",
//   upload.single("file"),
//   async (req, res) => {
//     try {
//       const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
//       const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
//       const region = process.env.AWS_REGION || "us-east-1";
//       const bucketName = process.env.S3_BUCKET_NAME?.split('/')[0]||'a3cendkb';
//       if (!accessKeyId || !secretAccessKey || !bucketName) {
//         console.error("Missing S3 credentials or bucket name");
//         return res.status(500).json({
//           success: false,
//           error: "Missing S3 configuration",
//         });
//       }
//       const file = req.file;
//       const { type='audio', sessionId, avatarId, knowledgeId, timestamp } = req.body;
//       const safeTimestamp = timestamp || new Date().toISOString();
//       if (!file) {
//         return res.status(400).json({
//           success: false,
//           error: "No file provided",
//         });
//       }
//       const fileExtension = file.originalname.split(".").pop();
//       const uniqueId = generateUniqueId();
//       const fileName = `${type}/${safeTimestamp.slice(0, 10)}/${uniqueId}-${file.originalname}`;
//       const uploadParams = {
//         Bucket: bucketName,
//         Key: fileName,
//         Body: file.buffer,
//         ContentType: file.mimetype,
//         Metadata: {
//           "session-id": sessionId || "unknown",
//           "avatar-id": avatarId || "unknown",
//           "knowledge-id": knowledgeId || "unknown",
//           timestamp: safeTimestamp,
//           type,
//         },
//       };
//       await s3Client.send(new PutObjectCommand(uploadParams));
//       const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
//       return res.status(200).json({
//         success: true,
//         fileUrl,
//         fileName,
//       });
//     } catch (error: any) {
//       console.error("Error uploading to S3:", error);
//       return res.status(500).json({
//         success: false,
//         error: error.message || "Unknown error during upload",
//       });
//     }
//   },
// );
avatarSimulator.post("/upload-recording", upload.single("file"), async (req, res) => {
    let tempFilePath = null;
    try {
        const file = req.file;
        const { type = "audio", sessionId, avatarId, knowledgeId, timestamp, } = req.body;
        const safeTimestamp = timestamp || new Date().toISOString();
        if (!file) {
            return res.status(400).json({
                success: false,
                error: "No file provided",
            });
        }
        tempFilePath = file.path; // Store path for cleanup
        // Read the file from disk instead of using file.buffer
        const fileBuffer = fs.readFileSync(file.path);
        // Log file info for debugging
        console.log("File info:", {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            bufferSize: fileBuffer.length,
            path: file.path,
        });
        if (fileBuffer.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Empty file provided",
            });
        }
        const uniqueId = generateUniqueId();
        const fileName = `${type}/${safeTimestamp.slice(0, 10)}/${uniqueId}-${file.originalname}`;
        // Upload using your utility function with the file buffer
        // const uploaded = await uploadFileToS3(
        //   fileBuffer,
        //   fileName,
        //   file.mimetype,
        // );
        const uploaded = await uploadAudioFileToS3(fileBuffer, fileName, file.mimetype);
        if (!uploaded) {
            return res.status(500).json({
                success: false,
                error: "Failed to upload file",
            });
        }
        return res.status(200).json({
            success: true,
            fileUrl: uploaded.url,
            fileName: uploaded.fileKey,
        });
    }
    catch (error) {
        console.error("Error uploading to S3:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Unknown error during upload",
        });
    }
    finally {
        // Clean up the temporary file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
                console.log("Temporary file cleaned up:", tempFilePath);
            }
            catch (cleanupError) {
                console.error("Error cleaning up temporary file:", cleanupError);
            }
        }
    }
});
avatarSimulator.post("/responses", async (req, res) => {
    const body = req.body;
    try {
        if (body.text?.format?.type === "json_schema") {
            const response = await openai.responses.parse({
                ...body,
                stream: false,
            });
            res.json(response);
        }
        else {
            const response = await openai.responses.create({
                ...body,
                stream: false,
            });
            res.json(response);
        }
    }
    catch (err) {
        console.error("responses proxy error", err);
        res.status(500).json({ error: "failed" });
    }
});
avatarSimulator.get("/session", async (req, res) => {
    try {
        const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-realtime-preview-2025-06-03",
            }),
        });
        const data = await response.json();
        res.json(data);
    }
    catch (error) {
        console.error("Error in /session:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
avatarSimulator.post("/pull-heygen-avatars", async (req, res) => {
    try {
        // 1️⃣ Fetch avatars from Heygen
        const response = await fetch("https://api.heygen.com/v1/streaming/avatar.list", {
            headers: {
                accept: "application/json",
                "x-api-key": process.env.HEYGEN_API_KEY,
            },
        });
        if (!response.ok) {
            const text = await response.text();
            return res.status(response.status).json({ error: text });
        }
        const data = await response.json();
        if (!data?.data) {
            return res.status(400).json({ error: "No avatars returned" });
        }
        function getGenderFromFullName(fullName) {
            if (!fullName) {
                return "unknown";
            }
            const parts = fullName.trim().split(/\s+/);
            // Always use the first word as the name
            const firstName = parts[0];
            return getGender(firstName);
        }
        const mappedAvatars = data.data
            .filter((a) => a.is_public && a.status === "ACTIVE" && a.normal_preview !== null)
            .map((a) => ({
            id: a.avatar_id,
            name: a.pose_name,
            gender: getGenderFromFullName(a.pose_name),
            imageUrl: a.normal_preview,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
        if (mappedAvatars?.length === 0) {
            return res.json({ message: "No avatars to insert" });
        }
        const result = await db
            .insert(avatars)
            .values(mappedAvatars)
            .onConflictDoNothing()
            .returning({
            id: avatars.id,
        });
        return res.json({
            message: "Insert complete",
            count: mappedAvatars.length,
            inserted: result?.length,
            heygenCount: data?.data?.length,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || "Server error" });
    }
});
avatarSimulator.get("/list", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { gender, role, ethnicity } = req.query;
        const offset = (page - 1) * limit;
        const filters = [];
        if (ethnicity)
            filters.push(eq(avatars.ethnicity, ethnicity));
        if (gender)
            filters.push(eq(avatars.gender, gender));
        if (role)
            filters.push(eq(avatars.role, role));
        const whereClause = filters.length > 0 ? and(...filters) : undefined;
        // Get total count of avatars
        const countResult = await db
            .select({ count: sql `count(*)` })
            .from(avatars)
            .where(whereClause);
        const totalCount = Number(countResult[0]?.count || 0);
        // Fetch paginated data
        const paginatedAvatars = await db
            .select()
            .from(avatars)
            .where(whereClause)
            .limit(limit)
            .offset(offset);
        res.json({
            gender,
            success: true,
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
            data: paginatedAvatars,
        });
    }
    catch (error) {
        console.error("Error fetching avatars:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
avatarSimulator.get("/avatar-roles", async (req, res) => {
    try {
        console.log("hitting avatar roles");
        const rows = await db
            .selectDistinct({ role: scenarios.avatarRole })
            .from(scenarios)
            .where(isNotNull(scenarios.avatarRole));
        if (!rows?.length) {
            console.log("no avatar found", rows);
            return res.json({
                success: true,
                data: "no avatar found",
            });
        }
        const roles = rows.map((r) => r.role);
        res.json({
            success: true,
            data: roles,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to fetch roles" });
    }
});
avatarSimulator.post("/analyse-session", async (req, res) => {
    try {
        const { transcriptId, transcript, sessionId, sessionType = "audio_roleplay", audioUrl, } = req.body;
        if (!transcript || !Array.isArray(transcript)) {
            return NextResponse.json({ error: "Invalid transcript data" }, { status: 400 });
        }
        const analysis = await db
            .select()
            .from(aiSessionAnalysis)
            .where(eq(aiSessionAnalysis.sessionId, sessionId));
        if (analysis?.length) {
            console.log("Analysis already exists:", analysis[0]);
            return res.json({
                success: true,
                analysis: analysis[0],
                sessionId: sessionId,
            });
        }
        const analysisResult = await generateSessionAnalysis(transcript);
        console.log("Analysis result:", JSON.stringify(analysisResult, null, 2));
        // const [session] = await db
        //   .insert(sessions)
        //   .values({
        //     audioUrl,
        //     totalDuration: analysisResult.totalDuration,
        //     overallScore: analysisResult.overallScore,
        //   })
        //   .returning()
        // const transcriptData = transcript.map((item) => ({
        //   sessionId: session.id,
        //   itemId: item.itemId,
        //   type: item.type,
        //   role: item.role,
        //   title: item.title,
        //   expanded: item.expanded,
        //   timestamp: item.timestamp,
        //   createdAtMs: item.createdAtMs,
        //   status: item.status,
        //   isHidden: item.isHidden,
        // }))
        // await db.insert(transcripts).values(transcriptData)
        const [inserted] = await db
            .insert(aiSessionAnalysis)
            .values({
            sessionId: sessionId,
            sessionType: sessionType,
            overallScore: analysisResult.overallScore,
            userTalkTime: analysisResult.talkTime.userTime,
            otherTalkTime: analysisResult.talkTime.otherTime,
            userTalkPercentage: analysisResult.talkTime.userPercentage,
            fillerWords: analysisResult.wordChoice.fillerWords,
            weakWords: analysisResult.wordChoice.weakWords,
            sentenceOpeners: analysisResult.wordChoice.sentenceOpeners,
            activeListening: analysisResult.listening.activeListening,
            engagementLevel: analysisResult.listening.engagementLevel,
            questionsAsked: analysisResult.listening.questionsAsked,
            acknowledgments: analysisResult.listening.acknowledgments,
            interruptions: analysisResult.listening.interruptions,
            averagePacing: analysisResult.delivery.averagePacing,
            pacingVariation: analysisResult.delivery.pacingVariation,
            tone: analysisResult.delivery.tone,
            pauseCount: analysisResult.delivery.pauseCount,
            averagePauseLength: analysisResult.delivery.averagePauseLength,
            strengths: analysisResult.feedback.strengths,
            growthAreas: analysisResult.feedback.growthAreas,
            followUpQuestions: analysisResult.feedback.followUpQuestions,
            summary: analysisResult.feedback.summary,
            pronunciationIssues: analysisResult.feedback.pronunciation.issues,
            pronunciationSuggestions: analysisResult.feedback.pronunciation.suggestions,
            transcriptId,
        })
            .returning();
        // Perform skill dimension assessment for this session
        let skillAssessments = [];
        try {
            const conversationText = transcript
                .map((item) => `${item.speaker}: ${item.text}`)
                .join("\n");
            const transcriptRecord = await pool.query(`SELECT scenario_id, custom_scenario_id FROM transcripts WHERE id = $1`, [transcriptId]);
            const scenarioId = transcriptRecord.rows[0]?.scenario_id || null;
            const customScenarioId = transcriptRecord.rows[0]?.custom_scenario_id || null;
            skillAssessments = await performSkillAssessmentForSession(pool, sessionId, scenarioId, conversationText, customScenarioId);
            console.log(`Completed skill dimension assessment: ${skillAssessments.length} skills assessed`);
        }
        catch (skillError) {
            console.error("Error during skill dimension assessment:", skillError);
        }
        return res.json({
            success: true,
            sessionId: sessionId,
            analysis: inserted,
            skillAssessments,
        });
    }
    catch (error) {
        console.error("Analysis error:", error);
        return res
            .status(500)
            .json({ success: false, error, message: "Failed to analyze transcript" });
    }
});
avatarSimulator.patch("/recommended-scenario", async (req, res) => {
    try {
        const assignmentId = parseInt(req.body.assignmentId);
        const scenarioId = parseInt(req.body.scenarioId);
        const userId = req.user?.id || req.body?.userId;
        const isSessionCompleted = req.body?.isSessionCompleted || true;
        const sessionTranscriptId = req.body?.transcriptId || null;
        const sessionId = req.body?.sessionId || null;
        if (!userId || !assignmentId || !scenarioId) {
            return res.status(400).json({
                success: false,
                message: "Invalid request",
            });
        }
        const updatedData = await db
            .update(assessmentRecommendedScenarios)
            .set({
            isScenarioSessionCompleted: isSessionCompleted,
            sessionTranscriptId,
            sessionId,
        })
            .where(and(eq(assessmentRecommendedScenarios.assessmentAssignmentId, assignmentId), eq(assessmentRecommendedScenarios.scenarioId, scenarioId), eq(assessmentRecommendedScenarios.userId, userId)))
            .returning();
        return res.json({
            success: true,
            data: updatedData,
        });
    }
    catch (error) {
        console.error("Error updating recommended scenarios:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update recommended scenarios",
            error,
        });
    }
});
avatarSimulator.get("/recommended-scenarios", async (req, res) => {
    try {
        const assignmentId = parseInt(req.query.assignmentId);
        const userId = req.user?.id || 21;
        console.log(`[Assessment Report] Requested assignment ID: ${assignmentId}`);
        if (isNaN(assignmentId)) {
            console.log(`[Assessment Report] Invalid assignment ID: ${req.query.assignmentId}`);
            return res.status(400).json({
                success: false,
                message: "Invalid assignment ID",
            });
        }
        const assignment = await storage.getAssessmentAssignment(assignmentId);
        if (!assignment) {
            console.log(`[Assessment Report] Assignment not found: ${assignmentId}`);
            return res.status(404).json({
                success: false,
                message: "Assessment assignment not found",
            });
        }
        // const isAssignedUser = assignment.assignedToUserId === req.user?.id;
        // const isAssignedBy = assignment.assignedByUserId === req.user?.id;
        // if (!isAssignedUser && !isAssignedBy && !req.user?.isAdmin) {
        //   console.log(
        //     `[Assessment Report] Permission denied for user ${req.user?.id} to access assignment ${assignmentId}`,
        //   );
        //   return res.status(403).json({
        //     success: false,
        //     message: "You don't have permission to access this report",
        //   });
        // }
        // console.log(
        //   `[Assessment Report] Permission granted for user ${req.user?.id} to access assignment ${assignmentId}`,
        // );
        const is360 = assignment.assessment?.type !== "external";
        console.log("assignment.assessment", JSON.stringify(assignment.assessment, null, 2));
        if (!is360) {
            return res.status(400).json({
                success: false,
                message: "This is not a 360 assessment",
            });
        }
        const selfAssessment = await storage.getSelfAssessmentResponse(assignmentId);
        const assessmentTitle = assignment?.assessment?.title;
        const questions = assignment?.assessment?.questions;
        const answers = selfAssessment?.responseData;
        if (!selfAssessment) {
            console.log(`[Assessment Report] No report data generated for assignment: ${assignmentId}`);
            return res.status(404).json({
                success: false,
                message: "No assessment response found",
            });
        }
        try {
            const existing = await db
                .select()
                .from(assessmentRecommendedScenarios)
                .where(and(eq(assessmentRecommendedScenarios.userId, userId), eq(assessmentRecommendedScenarios.assessmentAssignmentId, assignmentId)));
            // Fetch scenarios with enough info for AI to make decisions
            const scenariosResult = await db.select().from(scenarios);
            if (!scenariosResult?.length) {
                console.log("no scenarios found", scenariosResult);
                return res.json({
                    success: true,
                    data: [],
                });
            }
            if (existing?.length) {
                console.log("existing", JSON.stringify(existing, null, 2));
                // const selectedScenarios = existing[0].selectedScenarios;
                const selectedScenarios = existing.map((s) => s.scenarioId);
                const scenariosWithCompletion = scenariosResult
                    .filter((s) => selectedScenarios.includes(s.id))
                    .map((s) => {
                    const existingMatch = existing.find((e) => e.scenarioId === s.id);
                    return {
                        ...s,
                        sessionTranscriptId: existingMatch?.sessionTranscriptId ?? null,
                        sessionId: existingMatch?.sessionId ?? null,
                        isScenarioSessionCompleted: existingMatch?.isScenarioSessionCompleted ?? false,
                    };
                });
                return res.json({
                    success: true,
                    // data: scenariosResult.filter((s) => selectedScenarios.includes(s.id)),
                    data: scenariosWithCompletion,
                    message: "Returning existing data",
                });
            }
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                temperature: 0,
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "ScenarioSelection",
                        schema: {
                            title: "ScenarioSelection",
                            type: "object",
                            properties: {
                                selected_scenarios: {
                                    type: "array",
                                    items: { type: "integer" },
                                    minItems: 5,
                                    maxItems: 6,
                                    uniqueItems: true,
                                },
                            },
                            required: ["selected_scenarios"],
                        },
                    },
                },
                messages: [
                    {
                        role: "system",
                        content: "You are a coach AI. Select 3 scenarios most relevant to the learner. Only return scenario IDs from the list provided.",
                    },
                    {
                        role: "user",
                        content: JSON.stringify({
                            assessmentTitle,
                            questions,
                            answers,
                            scenarios: scenariosResult.map((s) => ({
                                id: s.id,
                                name: s.name,
                                description: s.description,
                                difficulty: s.difficulty,
                                context: s.context,
                                avatarRole: s.avatarRole,
                                avatarName: s.avatarName,
                            })),
                        }),
                    },
                ],
            });
            console.log("completion.choices[0].message?.content", completion.choices[0].message?.content);
            const picked = JSON.parse(completion.choices[0].message?.content?.trim() || "{}");
            const pickedScenarios = scenariosResult.filter((s) => picked.selected_scenarios.includes(s.id));
            console.log("pickedScenarios", JSON.stringify(pickedScenarios, null, 2));
            await db
                .insert(assessmentRecommendedScenarios)
                .values(picked.selected_scenarios.map((scenarioId) => ({
                assessmentAssignmentId: assignmentId,
                scenarioId,
                userId,
            })))
                .onConflictDoNothing();
            return res.status(200).json({
                success: true,
                data: pickedScenarios.map((s) => {
                    return {
                        ...s,
                        sessionTranscriptId: null,
                        sessionId: null,
                        isScenarioSessionCompleted: false,
                    };
                }),
            });
        }
        catch (e) {
            console.log("error fetching recommended scenarios", e);
            res.status(500).json({
                success: false,
                message: "Failed to get recommended scenarios",
                error: e.message,
            });
        }
    }
    catch (e) {
        console.error("Unexpected error in /recommended-scenarios", e);
        res
            .status(500)
            .json({ success: false, error: e, message: "Internal server error" });
    }
});
avatarSimulator.get("/get-avatar/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res
                .status(400)
                .json({ success: false, error: "Avatar ID is required" });
        }
        const avatar = await db.select().from(avatars).where(eq(avatars.id, id));
        if (!avatar) {
            return res
                .status(404)
                .json({ success: false, error: "Avatar not found" });
        }
        res.json({
            success: true,
            data: avatar,
        });
    }
    catch (error) {
        console.error("Error fetching avatar by ID:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
const SessionAnalysisSchema = {
    type: "object",
    additionalProperties: false,
    required: [
        "overallScore",
        "talkTime",
        "wordChoice",
        "listening",
        "delivery",
        "feedback",
    ],
    properties: {
        overallScore: { type: "number" },
        talkTime: {
            type: "object",
            additionalProperties: false,
            required: ["userTime", "otherTime", "userPercentage"],
            properties: {
                userTime: { type: "number" },
                otherTime: { type: "number" },
                userPercentage: { type: "number" },
            },
        },
        wordChoice: {
            type: "object",
            additionalProperties: false,
            required: ["fillerWords", "weakWords", "sentenceOpeners"],
            properties: {
                fillerWords: {
                    type: "array",
                    items: {
                        type: "object",
                        additionalProperties: false,
                        required: ["word", "count", "percentage", "timestamps"],
                        properties: {
                            word: { type: "string" },
                            count: { type: "number" },
                            percentage: { type: "number" },
                            timestamps: { type: "array", items: { type: "number" } },
                        },
                    },
                },
                weakWords: {
                    type: "array",
                    items: {
                        type: "object",
                        additionalProperties: false,
                        required: ["word", "count", "percentage", "timestamps"],
                        properties: {
                            word: { type: "string" },
                            count: { type: "number" },
                            percentage: { type: "number" },
                            timestamps: { type: "array", items: { type: "number" } },
                        },
                    },
                },
                sentenceOpeners: {
                    type: "array",
                    items: {
                        type: "object",
                        additionalProperties: false,
                        required: ["opener", "count"],
                        properties: {
                            opener: { type: "string" },
                            count: { type: "number" },
                        },
                    },
                },
            },
        },
        listening: {
            type: "object",
            additionalProperties: false,
            required: [
                "activeListening",
                "engagementLevel",
                "questionsAsked",
                "acknowledgments",
                "interruptions",
            ],
            properties: {
                activeListening: { type: "boolean" },
                engagementLevel: { type: "number" },
                questionsAsked: { type: "number" },
                acknowledgments: { type: "number" },
                interruptions: { type: "number" },
            },
        },
        delivery: {
            type: "object",
            additionalProperties: false,
            required: [
                "averagePacing",
                "pacingVariation",
                "tone",
                "pauseCount",
                "averagePauseLength",
            ],
            properties: {
                averagePacing: { type: "number" },
                pacingVariation: {
                    type: "array",
                    items: {
                        type: "object",
                        additionalProperties: false,
                        required: ["timestamp", "wpm"],
                        properties: {
                            timestamp: { type: "number" },
                            wpm: { type: "number" },
                        },
                    },
                },
                tone: { type: "array", items: { type: "string" } },
                pauseCount: { type: "number" },
                averagePauseLength: { type: "number" },
            },
        },
        feedback: {
            type: "object",
            additionalProperties: false,
            required: [
                "strengths",
                "growthAreas",
                "followUpQuestions",
                "summary",
                "pronunciation",
            ],
            properties: {
                strengths: { type: "array", items: { type: "string" } },
                growthAreas: { type: "array", items: { type: "string" } },
                followUpQuestions: { type: "array", items: { type: "string" } },
                summary: { type: "string" },
                pronunciation: {
                    type: "object",
                    additionalProperties: false,
                    required: ["issues", "suggestions"],
                    properties: {
                        issues: { type: "array", items: { type: "string" } },
                        suggestions: { type: "array", items: { type: "string" } },
                    },
                },
            },
        },
    },
};
async function generateSessionAnalysis(transcript) {
    const conversationText = transcript
        .map((i) => `${i.speaker}: ${i.text}, ${i.timestamp}`)
        .join("\n");
    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0,
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "session_analysis",
                strict: true,
                schema: SessionAnalysisSchema,
            },
        },
        messages: [
            {
                role: "system",
                content: "You are a formatter that outputs ONLY a single JSON object matching the provided JSON schema. No markdown, code fences, or extra text.",
            },
            {
                role: "user",
                content: `Analyze this conversation transcript and return the analysis as JSON only.

  Transcript:
  ${conversationText}`,
            },
        ],
    });
    const msg = completion.choices[0]?.message?.content?.trim();
    if (!msg)
        throw new Error("No analysis generated");
    try {
        return JSON.parse(msg);
    }
    catch (parseError) {
        console.error("Failed to parse OpenAI response:", analysisText);
        throw new Error("Invalid analysis format");
    }
}
export async function getTranscript(transcriptId) {
    if (!transcriptId) {
        throw new Error("transcriptId is required");
    }
    const query = `
    SELECT id, session_id, avatar_id, knowledge_id, context, instructions,
           scenario, skill, duration,scenario_id, created_at, updated_at
    FROM transcripts
    WHERE id = $1
  `;
    try {
        const result = await pool.query(query, [transcriptId]);
        if (result.rows.length === 0) {
            throw new Error(`Transcript with id "${transcriptId}" not found`);
        }
        return result.rows[0];
    }
    catch (error) {
        console.error("Error fetching transcript:", error);
        throw new Error("Failed to retrieve transcript");
    }
}
async function saveTranscriptToDatabase(transcript) {
    try {
        // Early check: userId is required by database schema (roleplay_session.user_id and transcripts.user_id are NOT NULL)
        if (!transcript.userId) {
            console.warn("⚠️ saveTranscriptToDatabase: No userId provided - skipping database save (anonymous session)");
            return {
                success: false,
                error: "User ID required for transcript save",
                transcriptId: null,
                roleplaySessionId: null
            };
        }
        const transcriptId = transcript.transcriptId || generateUniqueId("tr");
        let finalTranscriptId = transcriptId;
        // 1. First, create or get a roleplay_session record (session_id in transcripts is an integer FK)
        let roleplaySessionId = null;
        // Check if we already have a roleplay session for this HeyGen session
        // First try to find by knowledge_id alone (HeyGen session ID), then verify user ownership
        try {
            const existingRoleplay = await pool.query(`SELECT id, user_id FROM roleplay_session WHERE knowledge_id = $1 ORDER BY created_at DESC LIMIT 1`, [transcript.sessionId]);
            if (existingRoleplay.rows.length > 0) {
                const existingSession = existingRoleplay.rows[0];
                // Verify this session belongs to the current user
                if (existingSession.user_id === transcript.userId) {
                    roleplaySessionId = existingSession.id;
                    console.log(`📝 Using existing roleplay session ID: ${roleplaySessionId}`);
                }
                else {
                    console.log(`📝 Found roleplay session but for different user, will create new one`);
                }
            }
        }
        catch (e) {
            console.warn("Warning checking existing roleplay session:", e);
        }
        // If no existing roleplay session, create one
        if (!roleplaySessionId) {
            try {
                console.log(`📝 Creating new roleplay session for HeyGen session: ${transcript.sessionId}`);
                const roleplayResult = await pool.query(`INSERT INTO roleplay_session (user_id, avatar_id, knowledge_id, duration, start_time)
           VALUES ($1, $2, $3, $4, NOW())
           RETURNING id`, [
                    transcript.userId,
                    transcript.avatarId,
                    transcript.sessionId, // Store HeyGen session ID in knowledge_id for reference
                    transcript.duration || 0,
                ]);
                if (roleplayResult.rows.length > 0) {
                    roleplaySessionId = roleplayResult.rows[0].id;
                    console.log(`📝 Created roleplay session with ID: ${roleplaySessionId}`);
                }
            }
            catch (e) {
                console.error("Error creating roleplay session:", e);
            }
        }
        if (!roleplaySessionId) {
            throw new Error("Failed to create or find roleplay session");
        }
        // 2. Check if transcript with this roleplay session_id already exists
        let existingTranscript = null;
        try {
            const existingResult = await pool.query(`SELECT id FROM transcripts WHERE session_id = $1 LIMIT 1`, [roleplaySessionId]);
            if (existingResult.rows.length > 0) {
                existingTranscript = existingResult.rows[0];
            }
        }
        catch (e) {
            console.warn("Warning checking existing transcript:", e);
        }
        // 3. If transcript exists, use its ID; otherwise create new one
        if (existingTranscript) {
            finalTranscriptId = existingTranscript.id;
            console.log(`📝 Using existing transcript ID: ${finalTranscriptId}`);
        }
        else {
            // Create new transcript record
            console.log(`📝 Creating new transcript with ID: ${transcriptId}`);
            await pool.query(`INSERT INTO transcripts (id, session_id, avatar_id, knowledge_id, context, instructions, duration, user_id, skill_id, scenario_id, custom_scenario_id, session_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE
         SET session_id = EXCLUDED.session_id,
             avatar_id = EXCLUDED.avatar_id,
             knowledge_id = EXCLUDED.knowledge_id,
             context = EXCLUDED.context,
             instructions = EXCLUDED.instructions,
             duration = EXCLUDED.duration,
             user_id = EXCLUDED.user_id,
             skill_id = EXCLUDED.skill_id,
             scenario_id = EXCLUDED.scenario_id,
             custom_scenario_id = EXCLUDED.custom_scenario_id`, [
                transcriptId,
                roleplaySessionId, // Use the integer roleplay session ID
                transcript.avatarId,
                transcript.knowledgeId,
                transcript.context || null,
                transcript.instructions || null,
                transcript.duration,
                transcript.userId,
                transcript.skillId,
                transcript.scenarioId,
                transcript.customScenarioId,
                transcript.sessionType,
            ]);
            finalTranscriptId = transcriptId;
        }
        // 4. Only insert messages if we have a valid transcript ID
        if (transcript.messages?.length > 0 && finalTranscriptId) {
            const messageId = generateUniqueId("msg");
            console.log(`📝 Saving ${transcript.messages.length} messages for transcript ${finalTranscriptId}`);
            await pool.query(`INSERT INTO transcript_messages (id, transcript_id, messages)
           VALUES ($1, $2, $3)
           ON CONFLICT (id) DO UPDATE SET messages = EXCLUDED.messages`, [messageId, finalTranscriptId, JSON.stringify(transcript.messages)]);
        }
        // 5. Update roleplay_session with the transcript_id (needed for analysis query)
        if (roleplaySessionId && finalTranscriptId) {
            try {
                await pool.query(`UPDATE roleplay_session SET transcript_id = $1 WHERE id = $2`, [finalTranscriptId, roleplaySessionId]);
                console.log(`📝 Updated roleplay session ${roleplaySessionId} with transcript_id: ${finalTranscriptId}`);
            }
            catch (e) {
                console.warn("Warning updating roleplay session with transcript_id:", e);
            }
        }
        return { success: true, transcriptId: finalTranscriptId, roleplaySessionId };
    }
    catch (error) {
        console.error("Error saving transcript:", error);
        throw error;
    }
}
export const getAllTranscripts = async (userId) => {
    try {
        const result = await pool.query(`
        SELECT 
          t.*,
          COALESCE(cs.title, sc.name) as scenario_name,
          COALESCE(cs.user_description, sc.context) as scenario_context,
          COALESCE(cs.blueprint::text, sc.instructions) as scenario_instructions,
          sk.name as skill_name,
          sk.id as skill_id,
          cs.id as custom_scenario_id,
          (SELECT COUNT(*) FROM transcript_messages tm WHERE tm.transcript_id = t.id) as message_count,
          (SELECT json_agg(ss.*) 
           FROM streaming_sessions ss 
           WHERE ss.transcript_id = t.id) as streaming_sessions
        FROM transcripts t
        LEFT JOIN scenarios sc ON t.scenario_id = sc.id 
        LEFT JOIN custom_scenarios cs ON t.custom_scenario_id = cs.id
        LEFT JOIN skills sk ON t.skill_id = sk.id
        WHERE t.user_id = $1
        ORDER BY t.created_at DESC
        LIMIT 100
      `, [userId]);
        console.log(`✅ Found ${result.rows.length} transcripts for user ${userId}`);
        return { success: true, transcripts: result.rows, source: "database" };
    }
    catch (error) {
        console.error("❌ Error getting transcripts:", error);
        console.log("ℹ️ Falling back to in-memory storage");
        return {
            success: false,
            transcripts: Array.from(transcriptsMap.values()),
            source: "memory",
            error: error.message || "Failed to get transcripts",
        };
    }
};
const getTranscriptById = async (transcriptId) => {
    console.log(`🔍 Getting transcript by ID: ${transcriptId}`);
    if (transcriptsMap.has(transcriptId)) {
        console.log("✅ Found transcript in memory storage");
        return {
            success: true,
            transcript: transcriptsMap.get(transcriptId),
            source: "memory",
        };
    }
    let client;
    try {
        console.log("🔍 Getting database client");
        // client = await pool.connect();
        console.log("✅ Database client acquired");
        console.log("🔍 Querying for transcript");
        const transcriptResult = await pool.query(`SELECT t.*, tm.messages FROM transcripts t LEFT JOIN transcript_messages tm ON t.id = tm.transcript_id WHERE t.id = $1`, [transcriptId]);
        if (transcriptResult.rows.length === 0) {
            console.log("❌ Transcript not found in database");
            return { success: false, error: "Transcript not found" };
        }
        console.log("✅ Found transcript, fetching messages");
        const transcript = transcriptResult.rows[0];
        transcript.messages = transcript.messages
            ? typeof transcript.messages === "string"
                ? JSON.parse(transcript.messages)
                : transcript.messages
            : [];
        return { success: true, transcript, source: "database" };
    }
    catch (error) {
        console.error("❌ Error getting transcript:", error);
        return { success: false, error: error.message };
    }
    finally {
    }
};
const getSkills = async () => {
    console.log("🔍 Getting all skills");
    try {
        // const client = await pool.connect();
        const result = await pool.query("SELECT * FROM skills ORDER BY name");
        console.log(`✅ Found ${result.rows.length} skills`);
        return { success: true, skills: result.rows };
    }
    catch (error) {
        console.error("❌ Error getting skills:", error);
        return { success: false, error: error.message };
    }
};
const getScenariosBySkill = async (skillId) => {
    console.log(`🔍 Getting scenarios for skill ID: ${skillId}`);
    try {
        // const client = await pool.connect();
        const result = await pool.query("SELECT * FROM scenarios WHERE skill_id = $1 ORDER BY name", [skillId]);
        console.log(`✅ Found ${result.rows.length} scenarios`);
        return { success: true, scenarios: result.rows };
    }
    catch (error) {
        console.error("❌ Error getting scenarios:", error);
        return { success: false, error: error.message };
    }
};
const saveStreamingSession = async (sessionData) => {
    console.log("🔍 Saving streaming session");
    try {
        if (!sessionData.sessionId ||
            !sessionData.avatarId ||
            !sessionData.knowledgeId) {
            throw new Error("Missing required fields");
        }
        console.log("🔍 Getting database client");
        console.log("✅ Database client acquired");
        console.log("🔍 Ensuring tables exist");
        // Begin transaction
        const sessionUuid = generateUniqueId("ss");
        console.log("🔍 Inserting or updating streaming session");
        const query = `
        INSERT INTO streaming_sessions 
        (id, session_id, avatar_id, knowledge_id, start_time, end_time, transcript_id, user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (session_id) DO UPDATE SET
        end_time = EXCLUDED.end_time,
        transcript_id = EXCLUDED.transcript_id,
        user_id = EXCLUDED.user_id
        
        RETURNING id, session_id
      `;
        const result = await pool.query(query, [
            sessionUuid,
            sessionData.sessionId,
            sessionData.avatarId,
            sessionData.knowledgeId,
            sessionData.startTime || new Date().toISOString(),
            sessionData.endTime || new Date().toISOString(),
            sessionData.transcriptId,
            sessionData.userId,
        ]);
        if (!result.rows[0]) {
            throw new Error("Failed to save session - no rows returned");
        }
        console.log("✅ Streaming session saved successfully");
        return { success: true, sessionId: result.rows[0].session_id };
    }
    catch (error) {
        console.error("❌ Error saving streaming session:", error);
        return { success: false, error: error.message };
    }
    finally {
    }
};
const linkTranscriptToStreamingSession = async (transcriptId, streamingSessionId) => {
    console.log(`🔍 Linking transcript ${transcriptId} to streaming session ${streamingSessionId}`);
    // const client = await pool.connect();
    try {
        console.log("🔍 Getting database client");
        console.log("✅ Database client acquired");
        console.log("🔍 Updating streaming session with transcript ID");
        await pool.query(`UPDATE streaming_sessions 
         SET transcript_id = $1
         WHERE id = $2`, [transcriptId, streamingSessionId]);
        console.log("✅ Transcript linked successfully");
        return { success: true };
    }
    catch (error) {
        console.error("❌ Error linking transcript:", error);
        return { success: false, error: error.message };
    }
    finally {
        // if (client) {
        //   client.release();
        //   console.log("ℹ️ Database client released back to pool");
        // }
    }
};
avatarSimulator.post("/chat-response", async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, error: "Message is required" });
        }
        const messages = [
            {
                role: "system",
                content: `You are a friendly and helpful AI assistant having a natural conversation. 
Keep your responses concise (2-3 sentences) and conversational. 
Be warm, engaging, and helpful. Avoid long explanations unless specifically asked.`
            }
        ];
        for (const msg of conversationHistory) {
            messages.push({
                role: msg.role === "user" ? "user" : "assistant",
                content: msg.text
            });
        }
        messages.push({ role: "user", content: message });
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            max_tokens: 150,
            temperature: 0.7,
        });
        const response = completion.choices[0]?.message?.content || "I'm sorry, I didn't understand that.";
        return res.json({ success: true, response });
    }
    catch (error) {
        console.error("Error in chat-response:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Failed to generate response"
        });
    }
});
const saveAnalysisResults = async (analysisData) => {
    // const client = await pool.connect();
    try {
        const id = generateUniqueId("ar");
        await pool.query(`INSERT INTO analysis_results 
         (id, transcript_id, overall_rating, key_strengths, development_areas, 
          clarity_score, professional_score, information_score, question_handling_score, recommendations, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [
            id,
            analysisData.transcriptId,
            analysisData.overallRating,
            analysisData.keyStrengths,
            analysisData.developmentAreas,
            analysisData.clarityScore,
            analysisData.professionalScore,
            analysisData.informationScore,
            analysisData.questionHandlingScore,
            analysisData.recommendations,
            analysisData.userId,
        ]);
        return { success: true, analysisId: id };
    }
    catch (error) {
        console.error("Error saving analysis results:", error);
        return { success: false, error: error.message };
    }
    finally {
    }
};
const getAllScenarios = async () => {
    console.log("🔍 Getting all scenarios");
    try {
        // const client = await pool.connect();
        const result = await pool.query("SELECT * FROM scenarios ORDER BY name");
        console.log(`✅ Found ${result.rows.length} scenarios`);
        return { success: true, scenarios: result.rows };
    }
    catch (error) {
        console.error("❌ Error getting scenarios:", error);
        return { success: false, error: error.message };
    }
};
function generateUniqueId(prefix = "tr") {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${randomStr}`;
}
const transcriptsMap = new Map();
// =====================
// Custom Scenarios API
// =====================
avatarSimulator.post("/custom-scenarios", async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const { title, userDescription, blueprint, userRole, avatarRole } = req.body;
        if (!title || !userDescription || !blueprint) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const scenario = await storage.createCustomScenario({
            userId,
            title,
            userDescription,
            blueprint,
            userRole: userRole || null,
            avatarRole: avatarRole || null,
        });
        // Automatically analyze and map skills for the new scenario (async, non-blocking)
        mapCustomScenarioToSkills(scenario.id, title, userDescription, blueprint, pool).then(mappingResult => {
            console.log(`Skill mapping completed for scenario ${scenario.id}:`, mappingResult.mappings.length > 0
                ? `${mappingResult.mappings.length} skills mapped`
                : mappingResult.unmappedReason || "No matches");
        }).catch(err => {
            console.error(`Skill mapping failed for scenario ${scenario.id}:`, err);
        });
        res.json({ success: true, scenario });
    }
    catch (error) {
        console.error("Error creating custom scenario:", error);
        res.status(500).json({ error: "Failed to create custom scenario" });
    }
});
avatarSimulator.get("/custom-scenarios", async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const scenarios = await storage.getUserCustomScenarios(userId);
        res.json({ success: true, scenarios });
    }
    catch (error) {
        console.error("Error fetching custom scenarios:", error);
        res.status(500).json({ error: "Failed to fetch custom scenarios" });
    }
});
avatarSimulator.get("/custom-scenarios/:id", async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const scenarioId = parseInt(req.params.id);
        const scenario = await storage.getCustomScenario(scenarioId, userId);
        if (!scenario) {
            return res.status(404).json({ error: "Scenario not found" });
        }
        res.json({ success: true, scenario });
    }
    catch (error) {
        console.error("Error fetching custom scenario:", error);
        res.status(500).json({ error: "Failed to fetch custom scenario" });
    }
});
avatarSimulator.delete("/custom-scenarios/:id", async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const scenarioId = parseInt(req.params.id);
        const deleted = await storage.deleteCustomScenario(scenarioId, userId);
        if (!deleted) {
            return res.status(404).json({ error: "Scenario not found" });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error("Error deleting custom scenario:", error);
        res.status(500).json({ error: "Failed to delete custom scenario" });
    }
});
// Get skill mappings for a custom scenario
avatarSimulator.get("/custom-scenarios/:id/skills", async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const scenarioId = parseInt(req.params.id);
        const scenario = await storage.getCustomScenario(scenarioId, userId);
        if (!scenario) {
            return res.status(404).json({ error: "Scenario not found" });
        }
        const skillMappings = await getSkillMappingsForCustomScenario(scenarioId, pool);
        res.json({ success: true, skillMappings });
    }
    catch (error) {
        console.error("Error fetching skill mappings:", error);
        res.status(500).json({ error: "Failed to fetch skill mappings" });
    }
});
// Suggest roles for a custom scenario based on context
avatarSimulator.post("/custom-scenarios/suggest-roles", async (req, res) => {
    try {
        const { scenarioDescription } = req.body;
        if (!scenarioDescription || typeof scenarioDescription !== "string") {
            return res.status(400).json({ error: "scenarioDescription is required" });
        }
        const suggestion = await suggestRolesFromContext(scenarioDescription);
        res.json({ success: true, ...suggestion });
    }
    catch (error) {
        console.error("Error suggesting roles:", error);
        res.status(500).json({ error: "Failed to suggest roles" });
    }
});
// Manually trigger skill mapping for a custom scenario
avatarSimulator.post("/custom-scenarios/:id/map-skills", async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const scenarioId = parseInt(req.params.id);
        const scenario = await storage.getCustomScenario(scenarioId, userId);
        if (!scenario) {
            return res.status(404).json({ error: "Scenario not found" });
        }
        const mappingResult = await mapCustomScenarioToSkills(scenarioId, scenario.title, scenario.userDescription, scenario.blueprint, pool);
        res.json({
            success: true,
            mappings: mappingResult.mappings,
            unmappedReason: mappingResult.unmappedReason
        });
    }
    catch (error) {
        console.error("Error mapping skills:", error);
        res.status(500).json({ error: "Failed to map skills" });
    }
});
// Full scenario analysis - roles, relationship, challenges, objectives
avatarSimulator.post("/custom-scenarios/analyze", async (req, res) => {
    try {
        const { scenarioDescription } = req.body;
        if (!scenarioDescription || typeof scenarioDescription !== "string") {
            return res.status(400).json({ error: "scenarioDescription is required" });
        }
        const analysis = await analyzeScenarioContext(scenarioDescription);
        res.json({ success: true, ...analysis });
    }
    catch (error) {
        console.error("Error analyzing scenario:", error);
        res.status(500).json({ error: "Failed to analyze scenario" });
    }
});
