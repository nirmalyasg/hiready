import { db } from "../db.js";
import { 
  userEntitlements, 
  paymentSubscriptions, 
  interviewSetPurchases, 
  companyShareLinkAccess,
  interviewUsage,
  interviewSets,
  companyShareLinks
} from "../../shared/schema.js";
import { eq, and, gte, sql } from "drizzle-orm";

export type AccessType = 'free' | 'purchased' | 'company_shared' | 'subscription';

export interface UserAccessResult {
  hasAccess: boolean;
  accessType: AccessType | null;
  reason: string;
  freeInterviewsRemaining?: number;
  isSubscriber?: boolean;
  purchasedSetIds?: number[];
  sharedSetIds?: number[];
}

export interface EntitlementStatus {
  tier: 'free' | 'set_access' | 'subscriber';
  freeInterviewsRemaining: number;
  isSubscriber: boolean;
  subscriptionExpiresAt?: Date;
  purchasedSets: { id: number; name: string }[];
  sharedAccessSets: { id: number; name: string }[];
}

export async function getOrCreateEntitlement(userId: number) {
  const existing = await db.query.userEntitlements.findFirst({
    where: eq(userEntitlements.userId, userId)
  });

  if (existing) return existing;

  const [newEntitlement] = await db.insert(userEntitlements)
    .values({ userId, tier: 'free', freeInterviewsRemaining: 1 })
    .returning();

  return newEntitlement;
}

export async function getEntitlementStatus(userId: number): Promise<EntitlementStatus> {
  const entitlement = await getOrCreateEntitlement(userId);

  const activeSubscription = await db.query.paymentSubscriptions.findFirst({
    where: and(
      eq(paymentSubscriptions.userId, userId),
      eq(paymentSubscriptions.status, 'active'),
      gte(paymentSubscriptions.currentPeriodEnd, new Date())
    )
  });

  const purchases = await db
    .select({
      id: interviewSets.id,
      name: interviewSets.name
    })
    .from(interviewSetPurchases)
    .innerJoin(interviewSets, eq(interviewSetPurchases.interviewSetId, interviewSets.id))
    .where(and(
      eq(interviewSetPurchases.userId, userId),
      eq(interviewSetPurchases.status, 'completed')
    ));

  const sharedAccess = await db
    .select({
      id: interviewSets.id,
      name: interviewSets.name
    })
    .from(companyShareLinkAccess)
    .innerJoin(interviewSets, eq(companyShareLinkAccess.interviewSetId, interviewSets.id))
    .where(eq(companyShareLinkAccess.userId, userId));

  return {
    tier: activeSubscription ? 'subscriber' : (purchases.length > 0 || sharedAccess.length > 0 ? 'set_access' : 'free'),
    freeInterviewsRemaining: entitlement.freeInterviewsRemaining,
    isSubscriber: !!activeSubscription,
    subscriptionExpiresAt: activeSubscription?.currentPeriodEnd ?? undefined,
    purchasedSets: purchases,
    sharedAccessSets: sharedAccess
  };
}

export async function checkInterviewAccess(
  userId: number, 
  interviewSetId?: number
): Promise<UserAccessResult> {
  const status = await getEntitlementStatus(userId);

  if (status.isSubscriber) {
    return {
      hasAccess: true,
      accessType: 'subscription',
      reason: 'Active subscription - unlimited access',
      isSubscriber: true
    };
  }

  if (interviewSetId) {
    const hasPurchased = status.purchasedSets.some(s => s.id === interviewSetId);
    if (hasPurchased) {
      return {
        hasAccess: true,
        accessType: 'purchased',
        reason: 'Purchased interview set',
        purchasedSetIds: status.purchasedSets.map(s => s.id)
      };
    }

    const hasSharedAccess = status.sharedAccessSets.some(s => s.id === interviewSetId);
    if (hasSharedAccess) {
      return {
        hasAccess: true,
        accessType: 'company_shared',
        reason: 'Access granted via company share link',
        sharedSetIds: status.sharedAccessSets.map(s => s.id)
      };
    }
  }

  if (status.freeInterviewsRemaining > 0) {
    return {
      hasAccess: true,
      accessType: 'free',
      reason: `Free interview available (${status.freeInterviewsRemaining} remaining)`,
      freeInterviewsRemaining: status.freeInterviewsRemaining
    };
  }

  return {
    hasAccess: false,
    accessType: null,
    reason: 'No access - free interview used and no active subscription or purchase',
    freeInterviewsRemaining: 0,
    purchasedSetIds: status.purchasedSets.map(s => s.id),
    sharedSetIds: status.sharedAccessSets.map(s => s.id)
  };
}

export async function consumeFreeInterview(userId: number): Promise<boolean> {
  const entitlement = await getOrCreateEntitlement(userId);
  
  if (entitlement.freeInterviewsRemaining <= 0) {
    return false;
  }

  await db.update(userEntitlements)
    .set({ 
      freeInterviewsRemaining: entitlement.freeInterviewsRemaining - 1,
      updatedAt: new Date()
    })
    .where(eq(userEntitlements.userId, userId));

  return true;
}

export async function recordInterviewUsage(
  userId: number,
  accessType: AccessType,
  interviewSetId?: number,
  sessionId?: number,
  interviewType?: string
): Promise<void> {
  await db.insert(interviewUsage).values({
    userId,
    interviewSetId: interviewSetId ?? null,
    sessionId: sessionId ?? null,
    interviewType: interviewType ?? null,
    accessType,
    startedAt: new Date()
  });
}

export async function validateShareToken(shareToken: string): Promise<{
  valid: boolean;
  interviewSet?: typeof interviewSets.$inferSelect;
  shareLink?: typeof companyShareLinks.$inferSelect;
  reason?: string;
}> {
  const shareLink = await db.query.companyShareLinks.findFirst({
    where: and(
      eq(companyShareLinks.shareToken, shareToken),
      eq(companyShareLinks.isActive, true)
    )
  });

  if (!shareLink) {
    return { valid: false, reason: 'Invalid or inactive share link' };
  }

  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
    return { valid: false, reason: 'Share link has expired' };
  }

  if (shareLink.maxUses && shareLink.currentUses >= shareLink.maxUses) {
    return { valid: false, reason: 'Share link has reached maximum uses' };
  }

  const interviewSet = await db.query.interviewSets.findFirst({
    where: eq(interviewSets.id, shareLink.interviewSetId)
  });

  if (!interviewSet) {
    return { valid: false, reason: 'Interview set not found' };
  }

  return { valid: true, interviewSet, shareLink };
}

export async function grantShareLinkAccess(
  userId: number, 
  shareLinkId: number,
  interviewSetId: number
): Promise<boolean> {
  const existing = await db.query.companyShareLinkAccess.findFirst({
    where: and(
      eq(companyShareLinkAccess.shareLinkId, shareLinkId),
      eq(companyShareLinkAccess.userId, userId)
    )
  });

  if (existing) {
    return true;
  }

  await db.transaction(async (tx) => {
    await tx.insert(companyShareLinkAccess).values({
      shareLinkId,
      userId,
      interviewSetId,
      accessedAt: new Date()
    });

    await tx.update(companyShareLinks)
      .set({ 
        currentUses: sql`${companyShareLinks.currentUses} + 1`,
        updatedAt: new Date()
      })
      .where(eq(companyShareLinks.id, shareLinkId));
  });

  return true;
}

export async function createSubscription(
  userId: number,
  stripeSubscriptionId: string,
  stripeCustomerId: string,
  currentPeriodStart: Date,
  currentPeriodEnd: Date
): Promise<string> {
  const [subscription] = await db.insert(paymentSubscriptions)
    .values({
      userId,
      stripeSubscriptionId,
      stripeCustomerId,
      status: 'active',
      planType: 'monthly',
      amountCents: 49900,
      currentPeriodStart,
      currentPeriodEnd
    })
    .returning();

  await db.update(userEntitlements)
    .set({ 
      tier: 'subscriber',
      paymentSubscriptionId: subscription.id,
      updatedAt: new Date()
    })
    .where(eq(userEntitlements.userId, userId));

  return subscription.id;
}

export async function cancelSubscription(userId: number): Promise<void> {
  await db.update(paymentSubscriptions)
    .set({ 
      status: 'canceled',
      canceledAt: new Date(),
      updatedAt: new Date()
    })
    .where(and(
      eq(paymentSubscriptions.userId, userId),
      eq(paymentSubscriptions.status, 'active')
    ));

  await db.update(userEntitlements)
    .set({ 
      tier: 'free',
      paymentSubscriptionId: null,
      updatedAt: new Date()
    })
    .where(eq(userEntitlements.userId, userId));
}

export async function recordPurchase(
  userId: number,
  interviewSetId: number,
  stripePaymentIntentId: string,
  amountCents: number = 19900
): Promise<void> {
  await db.insert(interviewSetPurchases)
    .values({
      userId,
      interviewSetId,
      stripePaymentIntentId,
      amountCents,
      status: 'completed',
      purchasedAt: new Date()
    })
    .onConflictDoNothing();

  const entitlement = await getOrCreateEntitlement(userId);
  if (entitlement.tier === 'free') {
    await db.update(userEntitlements)
      .set({ tier: 'set_access', updatedAt: new Date() })
      .where(eq(userEntitlements.userId, userId));
  }
}

export async function generateShareToken(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function createInterviewSet(
  name: string,
  description: string | null,
  interviewTypes: string[],
  ownerUserId: number,
  roleArchetypeId?: string,
  companyId?: string,
  jobDescription?: string,
  visibility: 'private' | 'public' | 'company_shared' = 'private'
): Promise<number> {
  const shareToken = visibility === 'company_shared' ? await generateShareToken() : null;

  const [interviewSet] = await db.insert(interviewSets)
    .values({
      name,
      description,
      roleArchetypeId: roleArchetypeId ?? null,
      companyId: companyId ?? null,
      jobDescription: jobDescription ?? null,
      interviewTypes,
      priceCents: 19900,
      ownerUserId,
      visibility,
      shareToken
    })
    .returning();

  return interviewSet.id;
}

export async function createCompanyShareLink(
  interviewSetId: number,
  companyName: string,
  companyEmail?: string,
  description?: string,
  maxUses?: number,
  expiresAt?: Date,
  createdByUserId?: number
): Promise<string> {
  const shareToken = await generateShareToken();

  await db.insert(companyShareLinks)
    .values({
      interviewSetId,
      shareToken,
      companyName,
      companyEmail: companyEmail ?? null,
      description: description ?? null,
      maxUses: maxUses ?? null,
      expiresAt: expiresAt ?? null,
      isActive: true,
      createdByUserId: createdByUserId ?? null
    });

  return shareToken;
}
