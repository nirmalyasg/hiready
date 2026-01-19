import { Request, Response, NextFunction } from "express";
import { 
  checkInterviewAccess, 
  consumeFreeInterview, 
  recordInterviewUsage 
} from "../lib/entitlement-service.js";
import { db } from "../db.js";
import { users } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

async function getLegacyUserId(authUserId: string): Promise<number | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.authUserId, authUserId)
  });
  return user?.id ?? null;
}

export async function requireInterviewAccess(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  try {
    const authUserId = (req as any).user?.id;
    
    if (!authUserId) {
      return res.status(401).json({ 
        error: "Authentication required",
        code: "AUTH_REQUIRED"
      });
    }

    const legacyUserId = await getLegacyUserId(authUserId);
    if (!legacyUserId) {
      return res.status(500).json({ 
        error: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    const interviewSetId = req.body?.interviewSetId || req.query?.interviewSetId;
    const parsedSetId = interviewSetId ? parseInt(interviewSetId) : undefined;

    const access = await checkInterviewAccess(legacyUserId, parsedSetId, authUserId);

    if (!access.hasAccess) {
      return res.status(403).json({
        error: "Access denied",
        code: "NO_ACCESS",
        reason: access.reason,
        upgradeRequired: true
      });
    }

    (req as any).accessInfo = access;
    (req as any).legacyUserId = legacyUserId;
    next();
  } catch (error) {
    console.error("Access control error:", error);
    return res.status(500).json({ error: "Failed to check access" });
  }
}

export async function consumeInterviewCredit(
  userId: number,
  accessType: string,
  interviewSetId?: number,
  sessionId?: number,
  interviewType?: string
): Promise<boolean> {
  if (accessType === 'free') {
    const consumed = await consumeFreeInterview(userId);
    if (!consumed) {
      return false;
    }
  }

  await recordInterviewUsage(
    userId,
    accessType as any,
    interviewSetId,
    sessionId,
    interviewType
  );

  return true;
}
