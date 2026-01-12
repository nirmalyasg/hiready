import { Request, Response, NextFunction } from "express";
import { 
  checkInterviewAccess, 
  consumeFreeInterview, 
  recordInterviewUsage 
} from "../lib/entitlement-service.js";

export async function requireInterviewAccess(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        error: "Authentication required",
        code: "AUTH_REQUIRED"
      });
    }

    const interviewSetId = req.body?.interviewSetId || req.query?.interviewSetId;
    const parsedSetId = interviewSetId ? parseInt(interviewSetId) : undefined;

    const access = await checkInterviewAccess(userId, parsedSetId);

    if (!access.hasAccess) {
      return res.status(403).json({
        error: "Access denied",
        code: "NO_ACCESS",
        reason: access.reason,
        upgradeRequired: true
      });
    }

    (req as any).accessInfo = access;
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
