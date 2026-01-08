import { db } from "../db.js";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import {
  subscriptions,
  interviewSessions,
  interviewConfigs,
  employerCandidates,
  employerJobs,
} from "../../shared/schema.js";

export interface EntitlementResult {
  hasAccess: boolean;
  accessType: "employer_assessment" | "pro_subscription" | "role_pack" | "free_trial" | "none";
  reason: string;
  canStartSession: boolean;
  freeTrialUsed: boolean;
  remainingFreeTrials?: number;
}

export async function checkEntitlements(
  userId: string,
  options: {
    jobTargetId?: string;
    roleKitId?: number;
    employerJobId?: string;
  }
): Promise<EntitlementResult> {
  const { jobTargetId, roleKitId, employerJobId } = options;

  if (employerJobId) {
    const [candidate] = await db
      .select()
      .from(employerCandidates)
      .where(
        and(
          eq(employerCandidates.userId, userId),
          eq(employerCandidates.jobId, employerJobId)
        )
      )
      .limit(1);
    
    if (candidate) {
      return {
        hasAccess: true,
        accessType: "employer_assessment",
        reason: "Employer-sponsored assessment - no payment required",
        canStartSession: true,
        freeTrialUsed: false,
      };
    }
  }
  
  const [anyEmployerCandidate] = await db
    .select()
    .from(employerCandidates)
    .where(eq(employerCandidates.userId, userId))
    .limit(1);
  
  if (anyEmployerCandidate && !jobTargetId && !roleKitId) {
    return {
      hasAccess: true,
      accessType: "employer_assessment",
      reason: "Employer-sponsored assessment - no payment required",
      canStartSession: true,
      freeTrialUsed: false,
    };
  }

  const [proSubscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.planType, "pro"),
        eq(subscriptions.status, "active"),
        gte(subscriptions.expiresAt, new Date())
      )
    )
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (proSubscription) {
    return {
      hasAccess: true,
      accessType: "pro_subscription",
      reason: "Active Pro subscription",
      canStartSession: true,
      freeTrialUsed: true,
    };
  }

  let targetRoleKitId = roleKitId;
  
  if (!targetRoleKitId && jobTargetId) {
    const [latestConfig] = await db
      .select({ roleKitId: interviewConfigs.roleKitId })
      .from(interviewConfigs)
      .where(eq(interviewConfigs.jobTargetId, jobTargetId))
      .orderBy(desc(interviewConfigs.createdAt))
      .limit(1);
    
    if (latestConfig?.roleKitId) {
      targetRoleKitId = latestConfig.roleKitId;
    }
  }

  if (targetRoleKitId) {
    const [rolePackSubscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.planType, "role_pack"),
          eq(subscriptions.roleKitId, targetRoleKitId),
          eq(subscriptions.status, "active")
        )
      )
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (rolePackSubscription) {
      return {
        hasAccess: true,
        accessType: "role_pack",
        reason: "Role pack subscription active",
        canStartSession: true,
        freeTrialUsed: true,
      };
    }
  }

  if (!targetRoleKitId) {
    return {
      hasAccess: false,
      accessType: "none",
      reason: "Role selection required. Please select a role to determine pricing.",
      canStartSession: false,
      freeTrialUsed: false,
      remainingFreeTrials: 0,
    };
  }

  const completedSessionsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(interviewSessions)
    .innerJoin(interviewConfigs, eq(interviewSessions.interviewConfigId, interviewConfigs.id))
    .where(
      and(
        eq(interviewConfigs.userId, userId),
        eq(interviewConfigs.roleKitId, targetRoleKitId)
      )
    );

  const sessionCount = Number(completedSessionsResult[0]?.count || 0);
  const FREE_TRIAL_LIMIT = 1;
  const freeTrialUsed = sessionCount >= FREE_TRIAL_LIMIT;

  if (!freeTrialUsed) {
    return {
      hasAccess: true,
      accessType: "free_trial",
      reason: `Free trial available (${sessionCount}/${FREE_TRIAL_LIMIT} used)`,
      canStartSession: true,
      freeTrialUsed: false,
      remainingFreeTrials: FREE_TRIAL_LIMIT - sessionCount,
    };
  }

  return {
    hasAccess: false,
    accessType: "none",
    reason: "Free trial exhausted. Please purchase a role pack or Pro subscription.",
    canStartSession: false,
    freeTrialUsed: true,
    remainingFreeTrials: 0,
  };
}

export async function enforceEntitlements(
  userId: string,
  options: {
    jobTargetId?: string;
    roleKitId?: number;
    employerJobId?: string;
  }
): Promise<{ allowed: boolean; error?: string; entitlement: EntitlementResult }> {
  const entitlement = await checkEntitlements(userId, options);
  
  if (!entitlement.canStartSession) {
    return {
      allowed: false,
      error: entitlement.reason,
      entitlement,
    };
  }

  return {
    allowed: true,
    entitlement,
  };
}
