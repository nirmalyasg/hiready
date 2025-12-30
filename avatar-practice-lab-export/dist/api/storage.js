import { db } from "./db.js";
import { eq, and, sql, desc, or } from "drizzle-orm";
import { authUsers, users, heygenSessions, heygenQueue, customScenarios, } from "../shared/schema.js";
// ===============================
// Auth User Operations (Username/Password Auth)
// ===============================
export async function getUserById(id) {
    const [user] = await db.select().from(authUsers).where(eq(authUsers.id, id));
    return user;
}
export async function getUserByUsername(username) {
    const [user] = await db.select().from(authUsers).where(eq(authUsers.username, username));
    return user;
}
export async function getUserByEmail(email) {
    const [user] = await db.select().from(authUsers).where(eq(authUsers.email, email));
    return user;
}
export async function createUser(userData) {
    const [user] = await db
        .insert(authUsers)
        .values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
    })
        .returning();
    return user;
}
export async function getLegacyUserByAuthUserId(authUserId) {
    const [legacyUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.authUserId, authUserId));
    return legacyUser;
}
export async function getOrCreateLegacyUser(authUserId, username) {
    const existing = await getLegacyUserByAuthUserId(authUserId);
    if (existing)
        return existing;
    const [created] = await db
        .insert(users)
        .values({
        username,
        password: "placeholder",
        email: `${username}@placeholder.local`,
        authUserId,
    })
        .returning({ id: users.id });
    return created;
}
// ===============================
// Custom Scenarios
// ===============================
export async function createCustomScenario(data) {
    const [created] = await db
        .insert(customScenarios)
        .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
    })
        .returning();
    return created;
}
export async function getCustomScenario(id, userId) {
    const [scenario] = await db
        .select()
        .from(customScenarios)
        .where(and(eq(customScenarios.id, id), eq(customScenarios.userId, userId)));
    return scenario;
}
export async function getUserCustomScenarios(userId) {
    return await db
        .select()
        .from(customScenarios)
        .where(eq(customScenarios.userId, userId))
        .orderBy(desc(customScenarios.createdAt));
}
export async function deleteCustomScenario(id, userId) {
    const result = await db
        .delete(customScenarios)
        .where(and(eq(customScenarios.id, id), eq(customScenarios.userId, userId)))
        .returning();
    return result.length > 0;
}
// ===============================
// HeyGen Session Management Methods
// ===============================
export async function createHeygenSession(sessionData) {
    console.log(`[Storage] Creating HeyGen session for user ${sessionData.userId}`);
    const [created] = await db
        .insert(heygenSessions)
        .values({
        ...sessionData,
        createdAt: new Date(),
        updatedAt: new Date(),
    })
        .returning();
    return created;
}
export async function getHeygenSession(id) {
    const [session] = await db
        .select()
        .from(heygenSessions)
        .where(eq(heygenSessions.id, id));
    return session;
}
export async function getHeygenSessionByHeygenId(heygenSessionId) {
    const [session] = await db
        .select()
        .from(heygenSessions)
        .where(eq(heygenSessions.heygenSessionId, heygenSessionId));
    return session;
}
export async function getUserActiveHeygenSession(userId) {
    const [session] = await db
        .select()
        .from(heygenSessions)
        .where(and(eq(heygenSessions.userId, userId), eq(heygenSessions.status, "active")));
    return session;
}
export async function getActiveHeygenSessionsCount() {
    const result = await db
        .select({ count: sql `count(*)` })
        .from(heygenSessions)
        .where(eq(heygenSessions.status, "active"));
    return Number(result[0]?.count || 0);
}
export async function updateHeygenSession(id, data) {
    const [updated] = await db
        .update(heygenSessions)
        .set({
        ...data,
        updatedAt: new Date(),
    })
        .where(eq(heygenSessions.id, id))
        .returning();
    return updated;
}
export async function endHeygenSession(id, reason) {
    const session = await getHeygenSession(id);
    const actualDuration = session?.startedAt
        ? Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
        : 0;
    const [updated] = await db
        .update(heygenSessions)
        .set({
        status: "ended",
        endedAt: new Date(),
        endReason: reason,
        actualDurationSec: actualDuration,
        updatedAt: new Date(),
    })
        .where(eq(heygenSessions.id, id))
        .returning();
    return updated;
}
export async function getExpiredHeygenSessions() {
    return await db
        .select()
        .from(heygenSessions)
        .where(and(eq(heygenSessions.status, "active"), sql `${heygenSessions.expiresAt} < NOW()`));
}
export async function cleanupStaleHeygenSessions() {
    const staleThreshold = new Date(Date.now() - 5 * 60 * 1000);
    const result = await db
        .update(heygenSessions)
        .set({
        status: "stale",
        endedAt: new Date(),
        endReason: "stale",
        updatedAt: new Date(),
    })
        .where(and(eq(heygenSessions.status, "active"), sql `${heygenSessions.lastSeenAt} < ${staleThreshold}`))
        .returning();
    console.log(`[Storage] Cleaned up ${result.length} stale HeyGen sessions`);
    return result.length;
}
// ===============================
// HeyGen Queue Methods
// ===============================
export async function addToHeygenQueue(queueEntry) {
    console.log(`[Storage] Adding user ${queueEntry.userId} to HeyGen queue`);
    const [created] = await db
        .insert(heygenQueue)
        .values({
        ...queueEntry,
        createdAt: new Date(),
        updatedAt: new Date(),
    })
        .returning();
    return created;
}
export async function getHeygenQueueEntry(id) {
    const [entry] = await db
        .select()
        .from(heygenQueue)
        .where(eq(heygenQueue.id, id));
    return entry;
}
export async function getUserHeygenQueueEntry(userId) {
    const [entry] = await db
        .select()
        .from(heygenQueue)
        .where(and(eq(heygenQueue.userId, userId), eq(heygenQueue.status, "queued")));
    return entry;
}
export async function getHeygenQueuePosition(id) {
    const entry = await getHeygenQueueEntry(id);
    if (!entry || entry.status !== "queued")
        return -1;
    const result = await db
        .select({ count: sql `count(*)` })
        .from(heygenQueue)
        .where(and(eq(heygenQueue.status, "queued"), or(sql `${heygenQueue.priority} > ${entry.priority}`, and(sql `${heygenQueue.priority} = ${entry.priority}`, sql `${heygenQueue.queuedAt} < ${entry.queuedAt}`))));
    return Number(result[0]?.count || 0) + 1;
}
export async function getNextInHeygenQueue() {
    const [entry] = await db
        .select()
        .from(heygenQueue)
        .where(eq(heygenQueue.status, "queued"))
        .orderBy(desc(heygenQueue.priority), heygenQueue.queuedAt)
        .limit(1);
    return entry;
}
export async function assignHeygenQueueEntry(queueId, sessionId) {
    const [updated] = await db
        .update(heygenQueue)
        .set({
        status: "assigned",
        assignedAt: new Date(),
        assignedSessionId: sessionId,
        updatedAt: new Date(),
    })
        .where(eq(heygenQueue.id, queueId))
        .returning();
    return updated;
}
export async function cancelHeygenQueueEntry(id) {
    const [updated] = await db
        .update(heygenQueue)
        .set({
        status: "cancelled",
        updatedAt: new Date(),
    })
        .where(eq(heygenQueue.id, id))
        .returning();
    return updated;
}
export async function getHeygenQueueLength() {
    const result = await db
        .select({ count: sql `count(*)` })
        .from(heygenQueue)
        .where(eq(heygenQueue.status, "queued"));
    return Number(result[0]?.count || 0);
}
export async function cleanupExpiredQueueEntries() {
    const result = await db
        .update(heygenQueue)
        .set({
        status: "expired",
        updatedAt: new Date(),
    })
        .where(and(eq(heygenQueue.status, "queued"), sql `${heygenQueue.expiresAt} < NOW()`))
        .returning();
    console.log(`[Storage] Cleaned up ${result.length} expired queue entries`);
    return result.length;
}
