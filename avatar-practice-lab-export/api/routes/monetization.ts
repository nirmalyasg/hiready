import { Router, Request, Response } from "express";
import { db } from "../db.js";
import { 
  interviewSets,
  companyShareLinks,
  interviewSetPurchases,
  paymentSubscriptions,
  userEntitlements
} from "../../shared/schema.js";
import { eq, desc, and } from "drizzle-orm";
import {
  getEntitlementStatus,
  checkInterviewAccess,
  validateShareToken,
  grantShareLinkAccess,
  createInterviewSet,
  createCompanyShareLink,
  recordPurchase,
  createSubscription,
  cancelSubscription,
  consumeFreeInterview,
  recordInterviewUsage
} from "../lib/entitlement-service.js";
import * as storage from "../storage.js";

const router = Router();

async function getLegacyUserId(authUserId: string): Promise<number | null> {
  const legacyUser = await storage.getLegacyUserByAuthUserId(authUserId);
  return legacyUser?.id ?? null;
}

router.get("/entitlements", async (req: Request, res: Response) => {
  try {
    const authUserId = (req as any).user?.id;
    if (!authUserId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const legacyUserId = await getLegacyUserId(authUserId);
    if (!legacyUserId) {
      return res.status(500).json({ error: "Failed to resolve user" });
    }

    const status = await getEntitlementStatus(legacyUserId);
    res.json(status);
  } catch (error) {
    console.error("Error fetching entitlements:", error);
    res.status(500).json({ error: "Failed to fetch entitlements" });
  }
});

router.get("/access-check", async (req: Request, res: Response) => {
  try {
    const authUserId = (req as any).user?.id;
    if (!authUserId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const legacyUserId = await getLegacyUserId(authUserId);
    if (!legacyUserId) {
      return res.status(500).json({ error: "Failed to resolve user" });
    }

    const interviewSetId = req.query.interviewSetId 
      ? parseInt(req.query.interviewSetId as string) 
      : undefined;

    const access = await checkInterviewAccess(legacyUserId, interviewSetId);
    res.json(access);
  } catch (error) {
    console.error("Error checking access:", error);
    res.status(500).json({ error: "Failed to check access" });
  }
});

router.get("/interview-sets", async (req: Request, res: Response) => {
  try {
    const sets = await db
      .select()
      .from(interviewSets)
      .where(eq(interviewSets.visibility, "public"))
      .orderBy(desc(interviewSets.createdAt));

    res.json(sets);
  } catch (error) {
    console.error("Error fetching interview sets:", error);
    res.status(500).json({ error: "Failed to fetch interview sets" });
  }
});

router.get("/interview-sets/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const set = await db.query.interviewSets.findFirst({
      where: eq(interviewSets.id, id)
    });

    if (!set) {
      return res.status(404).json({ error: "Interview set not found" });
    }

    res.json(set);
  } catch (error) {
    console.error("Error fetching interview set:", error);
    res.status(500).json({ error: "Failed to fetch interview set" });
  }
});

router.post("/interview-sets", async (req: Request, res: Response) => {
  try {
    const authUserId = (req as any).user?.id;
    if (!authUserId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const legacyUserId = await getLegacyUserId(authUserId);
    if (!legacyUserId) {
      return res.status(500).json({ error: "Failed to resolve user" });
    }

    const { 
      name, 
      description, 
      interviewTypes, 
      roleArchetypeId, 
      companyId, 
      jobDescription,
      visibility 
    } = req.body;

    if (!name || !interviewTypes || !Array.isArray(interviewTypes)) {
      return res.status(400).json({ error: "Name and interview types are required" });
    }

    const setId = await createInterviewSet(
      name,
      description || null,
      interviewTypes,
      legacyUserId,
      roleArchetypeId,
      companyId,
      jobDescription,
      visibility || 'private'
    );

    res.json({ id: setId, message: "Interview set created" });
  } catch (error) {
    console.error("Error creating interview set:", error);
    res.status(500).json({ error: "Failed to create interview set" });
  }
});

router.get("/share/validate/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const result = await validateShareToken(token);

    if (!result.valid) {
      return res.status(400).json({ valid: false, reason: result.reason });
    }

    res.json({
      valid: true,
      interviewSet: {
        id: result.interviewSet!.id,
        name: result.interviewSet!.name,
        description: result.interviewSet!.description,
        interviewTypes: result.interviewSet!.interviewTypes
      },
      companyName: result.shareLink!.companyName
    });
  } catch (error) {
    console.error("Error validating share token:", error);
    res.status(500).json({ error: "Failed to validate share token" });
  }
});

router.post("/share/claim/:token", async (req: Request, res: Response) => {
  try {
    const authUserId = (req as any).user?.id;
    if (!authUserId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const legacyUserId = await getLegacyUserId(authUserId);
    if (!legacyUserId) {
      return res.status(500).json({ error: "Failed to resolve user" });
    }

    const { token } = req.params;
    const result = await validateShareToken(token);

    if (!result.valid) {
      return res.status(400).json({ success: false, reason: result.reason });
    }

    await grantShareLinkAccess(
      legacyUserId,
      result.shareLink!.id,
      result.interviewSet!.id
    );

    res.json({
      success: true,
      interviewSetId: result.interviewSet!.id,
      message: "Access granted to interview set"
    });
  } catch (error) {
    console.error("Error claiming share link:", error);
    res.status(500).json({ error: "Failed to claim share link" });
  }
});

router.post("/share-links", async (req: Request, res: Response) => {
  try {
    const authUserId = (req as any).user?.id;
    if (!authUserId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const legacyUserId = await getLegacyUserId(authUserId);
    if (!legacyUserId) {
      return res.status(500).json({ error: "Failed to resolve user" });
    }

    const { 
      interviewSetId, 
      companyName, 
      companyEmail, 
      description, 
      maxUses, 
      expiresAt 
    } = req.body;

    if (!interviewSetId || !companyName) {
      return res.status(400).json({ error: "Interview set ID and company name are required" });
    }

    const set = await db.query.interviewSets.findFirst({
      where: and(
        eq(interviewSets.id, interviewSetId),
        eq(interviewSets.ownerUserId, legacyUserId)
      )
    });

    if (!set) {
      return res.status(403).json({ error: "You don't own this interview set" });
    }

    const shareToken = await createCompanyShareLink(
      interviewSetId,
      companyName,
      companyEmail,
      description,
      maxUses,
      expiresAt ? new Date(expiresAt) : undefined,
      legacyUserId
    );

    res.json({ 
      shareToken,
      shareUrl: `/invite/${shareToken}`,
      message: "Share link created" 
    });
  } catch (error) {
    console.error("Error creating share link:", error);
    res.status(500).json({ error: "Failed to create share link" });
  }
});

router.get("/share-links/:interviewSetId", async (req: Request, res: Response) => {
  try {
    const authUserId = (req as any).user?.id;
    if (!authUserId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const interviewSetId = parseInt(req.params.interviewSetId);

    const links = await db
      .select()
      .from(companyShareLinks)
      .where(eq(companyShareLinks.interviewSetId, interviewSetId))
      .orderBy(desc(companyShareLinks.createdAt));

    res.json(links);
  } catch (error) {
    console.error("Error fetching share links:", error);
    res.status(500).json({ error: "Failed to fetch share links" });
  }
});

router.post("/use-free-interview", async (req: Request, res: Response) => {
  try {
    const authUserId = (req as any).user?.id;
    if (!authUserId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const legacyUserId = await getLegacyUserId(authUserId);
    if (!legacyUserId) {
      return res.status(500).json({ error: "Failed to resolve user" });
    }

    const { interviewType, sessionId } = req.body;

    const access = await checkInterviewAccess(legacyUserId);
    
    if (!access.hasAccess) {
      return res.status(403).json({ 
        error: "No access available",
        reason: access.reason 
      });
    }

    if (access.accessType === 'free') {
      const consumed = await consumeFreeInterview(legacyUserId);
      if (!consumed) {
        return res.status(403).json({ error: "No free interviews remaining" });
      }
    }

    await recordInterviewUsage(
      legacyUserId,
      access.accessType!,
      undefined,
      sessionId,
      interviewType
    );

    res.json({ 
      success: true, 
      accessType: access.accessType,
      message: "Interview access granted" 
    });
  } catch (error) {
    console.error("Error using free interview:", error);
    res.status(500).json({ error: "Failed to use interview" });
  }
});

router.get("/my-purchases", async (req: Request, res: Response) => {
  try {
    const authUserId = (req as any).user?.id;
    if (!authUserId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const legacyUserId = await getLegacyUserId(authUserId);
    if (!legacyUserId) {
      return res.status(500).json({ error: "Failed to resolve user" });
    }

    const purchases = await db
      .select({
        purchase: interviewSetPurchases,
        interviewSet: interviewSets
      })
      .from(interviewSetPurchases)
      .innerJoin(interviewSets, eq(interviewSetPurchases.interviewSetId, interviewSets.id))
      .where(eq(interviewSetPurchases.userId, legacyUserId))
      .orderBy(desc(interviewSetPurchases.purchasedAt));

    res.json(purchases);
  } catch (error) {
    console.error("Error fetching purchases:", error);
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
});

router.get("/my-subscription", async (req: Request, res: Response) => {
  try {
    const authUserId = (req as any).user?.id;
    if (!authUserId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const legacyUserId = await getLegacyUserId(authUserId);
    if (!legacyUserId) {
      return res.status(500).json({ error: "Failed to resolve user" });
    }

    const subscription = await db.query.paymentSubscriptions.findFirst({
      where: and(
        eq(paymentSubscriptions.userId, legacyUserId),
        eq(paymentSubscriptions.status, 'active')
      )
    });

    res.json(subscription || null);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

router.get("/pricing", async (_req: Request, res: Response) => {
  res.json({
    free: {
      name: "Free Trial",
      interviews: 1,
      price: 0,
      features: [
        "1 free interview practice session",
        "Basic feedback and analysis",
        "Try any interview type"
      ]
    },
    interviewSet: {
      name: "Interview Set",
      price: 199,
      priceDisplay: "$199",
      features: [
        "Complete interview set for one role",
        "Includes HR, Technical, Case Study rounds",
        "Detailed feedback and improvement tips",
        "Lifetime access to purchased set"
      ]
    },
    subscription: {
      name: "Unlimited",
      price: 499,
      priceDisplay: "$499/month",
      features: [
        "Unlimited interview practice",
        "All roles and companies",
        "Advanced analytics and tracking",
        "Priority support",
        "Cancel anytime"
      ]
    }
  });
});

export default router;
