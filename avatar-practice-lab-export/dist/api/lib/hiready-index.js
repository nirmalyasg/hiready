import { db } from "../db.js";
import { eq, and, desc } from "drizzle-orm";
import { randomBytes } from "crypto";
import { interviewSessions, interviewAnalysis, interviewConfigs, jobTargets, roleKits, hireadyRoleIndex, } from "../../shared/schema.js";
const INTERVIEW_TYPE_WEIGHTS = {
    technical: 3.0,
    technical_interview: 3.0,
    coding: 2.5,
    coding_interview: 2.5,
    hr: 1.5,
    hr_interview: 1.5,
    behavioral: 1.5,
    behavioral_interview: 1.5,
    case_study: 2.0,
    case: 2.0,
    case_interview: 2.0,
    hiring_manager: 2.0,
    system_design: 2.5,
    system_design_interview: 2.5,
    panel: 2.0,
    panel_interview: 2.0,
    general: 1.0,
};
function normalizeInterviewType(type) {
    return type.toLowerCase().replace(/_interview$/, '').replace(/-/g, '_');
}
function getTypeWeight(interviewType) {
    const normalized = normalizeInterviewType(interviewType);
    return INTERVIEW_TYPE_WEIGHTS[normalized] || INTERVIEW_TYPE_WEIGHTS[interviewType] || 1.0;
}
function getReadinessLevel(score) {
    const clampedScore = Math.min(100, Math.max(0, score));
    if (clampedScore >= 85)
        return "exceptional";
    if (clampedScore >= 70)
        return "strong";
    if (clampedScore >= 55)
        return "ready";
    if (clampedScore >= 40)
        return "developing";
    return "not_ready";
}
function normalizeScore(score, maxScore = 5) {
    const normalized = Math.round((score / maxScore) * 100);
    return Math.min(100, Math.max(0, normalized));
}
export async function calculateConsolidatedHireadyIndex(userId, options) {
    const { jobTargetId, roleKitId, employerJobId } = options;
    const sessionsQuery = db
        .select({
        session: interviewSessions,
        config: interviewConfigs,
        analysis: interviewAnalysis,
    })
        .from(interviewSessions)
        .innerJoin(interviewConfigs, eq(interviewSessions.interviewConfigId, interviewConfigs.id))
        .leftJoin(interviewAnalysis, eq(interviewAnalysis.interviewSessionId, interviewSessions.id))
        .where(and(eq(interviewConfigs.userId, userId), eq(interviewSessions.status, "analyzed"), jobTargetId ? eq(interviewConfigs.jobTargetId, jobTargetId) : undefined, roleKitId ? eq(interviewConfigs.roleKitId, roleKitId) : undefined))
        .orderBy(desc(interviewSessions.createdAt));
    const sessions = await sessionsQuery;
    if (sessions.length === 0) {
        return null;
    }
    const dimensionAggregates = {};
    const sessionBreakdown = [];
    const completedInterviewTypes = new Set();
    const allStrengths = [];
    const allImprovements = [];
    let weightedScoreSum = 0;
    let totalWeight = 0;
    for (const { session, config, analysis } of sessions) {
        if (!analysis)
            continue;
        const interviewType = config.interviewType || "general";
        const normalizedType = normalizeInterviewType(interviewType);
        completedInterviewTypes.add(normalizedType);
        const typeWeight = getTypeWeight(interviewType);
        if (analysis.dimensionScores && Array.isArray(analysis.dimensionScores)) {
            for (const dim of analysis.dimensionScores) {
                if (!dimensionAggregates[dim.dimension]) {
                    dimensionAggregates[dim.dimension] = { totalScore: 0, count: 0, evidence: [], maxScore: 5, weightedSum: 0, totalWeight: 0 };
                }
                dimensionAggregates[dim.dimension].totalScore += dim.score;
                dimensionAggregates[dim.dimension].count += 1;
                dimensionAggregates[dim.dimension].weightedSum += dim.score * typeWeight;
                dimensionAggregates[dim.dimension].totalWeight += typeWeight;
                if (dim.evidence && Array.isArray(dim.evidence)) {
                    dimensionAggregates[dim.dimension].evidence.push(...dim.evidence.slice(0, 2));
                }
            }
            const avgSessionScore = analysis.dimensionScores.reduce((sum, d) => sum + d.score, 0) /
                analysis.dimensionScores.length;
            const normalizedSessionScore = normalizeScore(avgSessionScore);
            weightedScoreSum += normalizedSessionScore * typeWeight;
            totalWeight += typeWeight;
            sessionBreakdown.push({
                sessionId: session.id,
                interviewType: normalizedType,
                score: normalizedSessionScore,
                completedAt: session.createdAt?.toISOString() || new Date().toISOString(),
            });
        }
        if (analysis.strengths && Array.isArray(analysis.strengths)) {
            allStrengths.push(...analysis.strengths.slice(0, 2));
        }
        if (analysis.improvements && Array.isArray(analysis.improvements)) {
            allImprovements.push(...analysis.improvements.slice(0, 2));
        }
    }
    const dimensionScores = Object.entries(dimensionAggregates).map(([dimension, data]) => {
        const weightedAvg = data.totalWeight > 0
            ? data.weightedSum / data.totalWeight
            : data.totalScore / data.count;
        return {
            dimension,
            score: Math.round(Math.min(5, weightedAvg) * 10) / 10,
            maxScore: data.maxScore,
            evidence: [...new Set(data.evidence)].slice(0, 3),
            weight: 1 / Object.keys(dimensionAggregates).length,
        };
    });
    const rawOverallScore = totalWeight > 0 ? Math.round(weightedScoreSum / totalWeight) : 0;
    const overallScore = Math.min(100, Math.max(0, rawOverallScore));
    let roleContext;
    if (jobTargetId) {
        const [jobTarget] = await db
            .select()
            .from(jobTargets)
            .where(eq(jobTargets.id, jobTargetId))
            .limit(1);
        if (jobTarget) {
            roleContext = {
                roleName: jobTarget.roleTitle,
                companyName: jobTarget.companyName || undefined,
                jobTargetId: jobTarget.id,
            };
        }
    }
    else if (roleKitId) {
        const [roleKit] = await db
            .select()
            .from(roleKits)
            .where(eq(roleKits.id, roleKitId))
            .limit(1);
        if (roleKit) {
            roleContext = {
                roleName: roleKit.name,
                roleKitId: roleKit.id,
            };
        }
    }
    const uniqueStrengths = [...new Set(allStrengths)].slice(0, 5);
    const uniqueImprovements = [...new Set(allImprovements)].slice(0, 5);
    return {
        overallScore,
        dimensionScores,
        completedInterviewTypes: Array.from(completedInterviewTypes),
        totalSessions: sessions.filter(s => s.analysis).length,
        sessionBreakdown: sessionBreakdown.slice(0, 10),
        strengths: uniqueStrengths,
        improvements: uniqueImprovements,
        readinessLevel: getReadinessLevel(overallScore),
        roleContext,
    };
}
function generateSecureShareToken() {
    const timestamp = Date.now().toString(36);
    const randomPart = randomBytes(12).toString('base64url');
    return `hi_${timestamp}_${randomPart}`;
}
export async function saveHireadyIndex(userId, indexData, options) {
    const shareToken = generateSecureShareToken();
    const existing = await db
        .select()
        .from(hireadyRoleIndex)
        .where(and(eq(hireadyRoleIndex.userId, userId), options.jobTargetId
        ? eq(hireadyRoleIndex.jobTargetId, options.jobTargetId)
        : options.roleKitId
            ? eq(hireadyRoleIndex.roleKitId, options.roleKitId)
            : undefined))
        .limit(1);
    if (existing.length > 0) {
        await db
            .update(hireadyRoleIndex)
            .set({
            overallScore: indexData.overallScore,
            dimensionScores: indexData.dimensionScores,
            completedInterviewTypes: indexData.completedInterviewTypes,
            totalSessions: indexData.totalSessions,
            sessionBreakdown: indexData.sessionBreakdown,
            strengths: indexData.strengths,
            improvements: indexData.improvements,
            readinessLevel: indexData.readinessLevel,
            lastUpdatedAt: new Date(),
        })
            .where(eq(hireadyRoleIndex.id, existing[0].id));
        return existing[0].shareToken || shareToken;
    }
    await db.insert(hireadyRoleIndex).values({
        userId,
        jobTargetId: options.jobTargetId || null,
        roleKitId: options.roleKitId || null,
        employerJobId: options.employerJobId || null,
        overallScore: indexData.overallScore,
        dimensionScores: indexData.dimensionScores,
        completedInterviewTypes: indexData.completedInterviewTypes,
        totalSessions: indexData.totalSessions,
        sessionBreakdown: indexData.sessionBreakdown,
        strengths: indexData.strengths,
        improvements: indexData.improvements,
        readinessLevel: indexData.readinessLevel,
        shareToken,
        isPublic: false,
    });
    return shareToken;
}
export async function getPublicHireadyIndex(shareToken) {
    const [index] = await db
        .select()
        .from(hireadyRoleIndex)
        .where(and(eq(hireadyRoleIndex.shareToken, shareToken), eq(hireadyRoleIndex.isPublic, true)))
        .limit(1);
    return index;
}
