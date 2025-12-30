import { db } from "./db.js";
import { eq, and, sql, desc, or } from "drizzle-orm";
import {
  authUsers,
  AuthUser,
  UpsertAuthUser,
  users,
  heygenSessions,
  heygenQueue,
  HeygenSession,
  InsertHeygenSession,
  HeygenQueue,
  InsertHeygenQueue,
  customScenarios,
  CustomScenario,
  InsertCustomScenario,
} from "../shared/schema.js";

// ===============================
// Auth User Operations (Username/Password Auth)
// ===============================

export async function getUserById(id: string): Promise<AuthUser | undefined> {
  const [user] = await db.select().from(authUsers).where(eq(authUsers.id, id));
  return user;
}

export async function getUserByUsername(username: string): Promise<AuthUser | undefined> {
  const [user] = await db.select().from(authUsers).where(eq(authUsers.username, username));
  return user;
}

export async function getUserByEmail(email: string): Promise<AuthUser | undefined> {
  const [user] = await db.select().from(authUsers).where(eq(authUsers.email, email));
  return user;
}

export async function createUser(userData: {
  username: string;
  email?: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
}): Promise<AuthUser> {
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

export async function getLegacyUserByAuthUserId(authUserId: string): Promise<{ id: number } | undefined> {
  const [legacyUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.authUserId, authUserId));
  return legacyUser;
}

export async function getOrCreateLegacyUser(authUserId: string, username: string): Promise<{ id: number }> {
  const existing = await getLegacyUserByAuthUserId(authUserId);
  if (existing) return existing;

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

export async function createCustomScenario(data: InsertCustomScenario): Promise<CustomScenario> {
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

export async function getCustomScenario(id: number, userId: string): Promise<CustomScenario | undefined> {
  const [scenario] = await db
    .select()
    .from(customScenarios)
    .where(and(eq(customScenarios.id, id), eq(customScenarios.userId, userId)));
  return scenario;
}

export async function getUserCustomScenarios(userId: string): Promise<CustomScenario[]> {
  return await db
    .select()
    .from(customScenarios)
    .where(eq(customScenarios.userId, userId))
    .orderBy(desc(customScenarios.createdAt));
}

export async function deleteCustomScenario(id: number, userId: string): Promise<boolean> {
  const result = await db
    .delete(customScenarios)
    .where(and(eq(customScenarios.id, id), eq(customScenarios.userId, userId)))
    .returning();
  return result.length > 0;
}

// ===============================
// HeyGen Session Management Methods
// ===============================

export async function createHeygenSession(sessionData: InsertHeygenSession): Promise<HeygenSession> {
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

export async function getHeygenSession(id: number): Promise<HeygenSession | undefined> {
  const [session] = await db
    .select()
    .from(heygenSessions)
    .where(eq(heygenSessions.id, id));
  return session;
}

export async function getHeygenSessionByHeygenId(heygenSessionId: string): Promise<HeygenSession | undefined> {
  const [session] = await db
    .select()
    .from(heygenSessions)
    .where(eq(heygenSessions.heygenSessionId, heygenSessionId));
  return session;
}

export async function getUserActiveHeygenSession(userId: number): Promise<HeygenSession | undefined> {
  const [session] = await db
    .select()
    .from(heygenSessions)
    .where(
      and(
        eq(heygenSessions.userId, userId),
        eq(heygenSessions.status, "active")
      )
    );
  return session;
}

export async function getActiveHeygenSessionsCount(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(heygenSessions)
    .where(eq(heygenSessions.status, "active"));
  return Number(result[0]?.count || 0);
}

export async function updateHeygenSession(id: number, data: Partial<HeygenSession>): Promise<HeygenSession> {
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

export async function endHeygenSession(id: number, reason: string): Promise<HeygenSession> {
  const session = await getHeygenSession(id);
  const actualDuration = session?.startedAt 
    ? Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
    : 0;
  
  const [updated] = await db
    .update(heygenSessions)
    .set({
      status: "ended",
      endedAt: new Date(),
      endReason: reason as any,
      actualDurationSec: actualDuration,
      updatedAt: new Date(),
    })
    .where(eq(heygenSessions.id, id))
    .returning();
  return updated;
}

export async function getExpiredHeygenSessions(): Promise<HeygenSession[]> {
  return await db
    .select()
    .from(heygenSessions)
    .where(
      and(
        eq(heygenSessions.status, "active"),
        sql`${heygenSessions.expiresAt} < NOW()`
      )
    );
}

export async function cleanupStaleHeygenSessions(): Promise<number> {
  const staleThreshold = new Date(Date.now() - 5 * 60 * 1000);
  
  const result = await db
    .update(heygenSessions)
    .set({
      status: "stale",
      endedAt: new Date(),
      endReason: "stale",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(heygenSessions.status, "active"),
        sql`${heygenSessions.lastSeenAt} < ${staleThreshold}`
      )
    )
    .returning();
  
  console.log(`[Storage] Cleaned up ${result.length} stale HeyGen sessions`);
  return result.length;
}

// ===============================
// HeyGen Queue Methods
// ===============================

export async function addToHeygenQueue(queueEntry: InsertHeygenQueue): Promise<HeygenQueue> {
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

export async function getHeygenQueueEntry(id: number): Promise<HeygenQueue | undefined> {
  const [entry] = await db
    .select()
    .from(heygenQueue)
    .where(eq(heygenQueue.id, id));
  return entry;
}

export async function getUserHeygenQueueEntry(userId: number): Promise<HeygenQueue | undefined> {
  const [entry] = await db
    .select()
    .from(heygenQueue)
    .where(
      and(
        eq(heygenQueue.userId, userId),
        eq(heygenQueue.status, "queued")
      )
    );
  return entry;
}

export async function getHeygenQueuePosition(id: number): Promise<number> {
  const entry = await getHeygenQueueEntry(id);
  if (!entry || entry.status !== "queued") return -1;

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(heygenQueue)
    .where(
      and(
        eq(heygenQueue.status, "queued"),
        or(
          sql`${heygenQueue.priority} > ${entry.priority}`,
          and(
            sql`${heygenQueue.priority} = ${entry.priority}`,
            sql`${heygenQueue.queuedAt} < ${entry.queuedAt}`
          )
        )
      )
    );
  return Number(result[0]?.count || 0) + 1;
}

export async function getNextInHeygenQueue(): Promise<HeygenQueue | undefined> {
  const [entry] = await db
    .select()
    .from(heygenQueue)
    .where(eq(heygenQueue.status, "queued"))
    .orderBy(desc(heygenQueue.priority), heygenQueue.queuedAt)
    .limit(1);
  return entry;
}

export async function assignHeygenQueueEntry(queueId: number, sessionId: number): Promise<HeygenQueue> {
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

export async function cancelHeygenQueueEntry(id: number): Promise<HeygenQueue> {
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

export async function getHeygenQueueLength(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(heygenQueue)
    .where(eq(heygenQueue.status, "queued"));
  return Number(result[0]?.count || 0);
}

export async function cleanupExpiredQueueEntries(): Promise<number> {
  const result = await db
    .update(heygenQueue)
    .set({
      status: "expired",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(heygenQueue.status, "queued"),
        sql`${heygenQueue.expiresAt} < NOW()`
      )
    )
    .returning();
  
  console.log(`[Storage] Cleaned up ${result.length} expired queue entries`);
  return result.length;
}
