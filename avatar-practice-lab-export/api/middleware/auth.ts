import { Request, Response, NextFunction } from "express";
import { db } from "../db.js";
import { userRoles } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string | null;
        role?: string;
        username?: string;
      };
      userRole?: "admin" | "coach" | "learner";
    }
  }
}

export async function getUserRole(authUserId: string): Promise<"admin" | "coach" | "learner"> {
  try {
    const roles = await db.select().from(userRoles).where(eq(userRoles.authUserId, authUserId));
    if (roles.length > 0) {
      return roles[0].role as "admin" | "coach" | "learner";
    }
    return "learner";
  } catch (error) {
    console.error("Error getting user role:", error);
    return "learner";
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function requireCoach(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.userRole !== "coach") {
    return res.status(403).json({ error: "Coach access required" });
  }
  next();
}

export function requireCoachOrLearner(req: Request, res: Response, next: NextFunction) {
  if (!req.user || (req.userRole !== "coach" && req.userRole !== "learner")) {
    return res.status(403).json({ error: "Coach or learner access required" });
  }
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  try {
    const role = await getUserRole(req.user.id);
    req.userRole = role;
    
    if (role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (error) {
    console.error("Error checking admin role:", error);
    return res.status(500).json({ error: "Failed to verify admin access" });
  }
}

export function requireCurrentUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export async function populateUserRole(req: Request, res: Response, next: NextFunction) {
  if (req.user && req.user.id) {
    try {
      req.userRole = await getUserRole(req.user.id);
    } catch (error) {
      console.error("Error populating user role:", error);
    }
  }
  next();
}

export const fileUploadMiddleware = null;
