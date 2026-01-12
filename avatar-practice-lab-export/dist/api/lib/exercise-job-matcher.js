import { db } from "../db.js";
import { jobTargets, roleKits, caseTemplates, codingExercises, exerciseSessions } from "../../shared/schema.js";
import { eq, desc, and, isNotNull } from "drizzle-orm";
function normalizeText(text) {
    return text.toLowerCase().trim();
}
function extractKeywords(text) {
    const stopWords = new Set([
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "from", "up", "about", "into", "through", "during",
        "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
        "do", "does", "did", "will", "would", "could", "should", "may", "might",
        "must", "shall", "can", "need", "dare", "ought", "used", "better"
    ]);
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word));
}
function calculateTextSimilarity(text1, text2) {
    const words1 = new Set(extractKeywords(text1));
    const words2 = new Set(extractKeywords(text2));
    if (words1.size === 0 || words2.size === 0)
        return 0;
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
}
function calculateSkillOverlap(exerciseSkills, jobSkills) {
    if (exerciseSkills.length === 0 || jobSkills.length === 0)
        return 0;
    const normalizedExercise = exerciseSkills.map(normalizeText);
    const normalizedJob = jobSkills.map(normalizeText);
    let matches = 0;
    for (const skill of normalizedExercise) {
        for (const jobSkill of normalizedJob) {
            if (skill.includes(jobSkill) || jobSkill.includes(skill)) {
                matches++;
                break;
            }
            if (calculateTextSimilarity(skill, jobSkill) > 0.5) {
                matches += 0.5;
                break;
            }
        }
    }
    return matches / normalizedExercise.length;
}
function checkRoleTypeMatch(roleKit, template, jobTarget) {
    const roleTitle = normalizeText(jobTarget.roleTitle);
    const rolePatterns = {
        "product": ["product", "pm", "product manager", "product owner"],
        "engineering": ["engineer", "developer", "software", "swe", "backend", "frontend", "fullstack"],
        "data": ["data", "analyst", "analytics", "scientist", "ml", "machine learning"],
        "design": ["design", "ux", "ui", "user experience", "product design"],
        "consulting": ["consult", "strategy", "management consulting"],
        "marketing": ["marketing", "growth", "brand", "content"],
        "sales": ["sales", "account", "business development", "bd"],
        "operations": ["operations", "ops", "supply chain", "logistics"],
        "finance": ["finance", "fp&a", "accounting", "financial"],
        "hr": ["hr", "human resources", "people", "talent", "recruiting"],
    };
    const templateTags = template?.tags || [];
    const roleKitDomain = roleKit?.domain?.toLowerCase() || "";
    const roleKitName = roleKit?.name?.toLowerCase() || "";
    for (const [category, patterns] of Object.entries(rolePatterns)) {
        const jobMatchesCategory = patterns.some(p => roleTitle.includes(p));
        if (!jobMatchesCategory)
            continue;
        const templateMatchesCategory = templateTags.some(tag => patterns.some(p => tag.toLowerCase().includes(p))) || patterns.some(p => roleKitDomain.includes(p) || roleKitName.includes(p));
        if (templateMatchesCategory)
            return true;
    }
    return false;
}
function checkDomainMatch(roleKit, jobTarget) {
    if (!roleKit?.domain)
        return false;
    const domain = normalizeText(roleKit.domain);
    const roleTitle = normalizeText(jobTarget.roleTitle);
    const companyContext = jobTarget.jdParsed?.companyContext?.toLowerCase() || "";
    if (roleTitle.includes(domain) || domain.includes(roleTitle.split(" ")[0])) {
        return true;
    }
    if (companyContext && calculateTextSimilarity(domain, companyContext) > 0.3) {
        return true;
    }
    return false;
}
export async function getAutoLinkSuggestion(userId, context) {
    const userJobs = await db
        .select()
        .from(jobTargets)
        .where(eq(jobTargets.userId, userId))
        .orderBy(desc(jobTargets.updatedAt));
    if (userJobs.length === 0) {
        return null;
    }
    let template = null;
    let codingExercise = null;
    let roleKit = null;
    if (context.exerciseType === "case_study" && context.templateId) {
        const [t] = await db.select().from(caseTemplates).where(eq(caseTemplates.id, context.templateId));
        template = t || null;
        if (template?.roleKitId) {
            const [rk] = await db.select().from(roleKits).where(eq(roleKits.id, template.roleKitId));
            roleKit = rk || null;
        }
    }
    else if (context.exerciseType === "coding_lab" && context.codingExerciseId) {
        const [ce] = await db.select().from(codingExercises).where(eq(codingExercises.id, context.codingExerciseId));
        codingExercise = ce || null;
        if (codingExercise?.roleKitId) {
            const [rk] = await db.select().from(roleKits).where(eq(roleKits.id, codingExercise.roleKitId));
            roleKit = rk || null;
        }
    }
    if (context.roleKitId && !roleKit) {
        const [rk] = await db.select().from(roleKits).where(eq(roleKits.id, context.roleKitId));
        roleKit = rk || null;
    }
    const exerciseSkills = [];
    if (template?.evaluationFocus)
        exerciseSkills.push(...template.evaluationFocus);
    if (template?.tags)
        exerciseSkills.push(...template.tags);
    if (template?.name)
        exerciseSkills.push(...extractKeywords(template.name));
    if (template?.caseType)
        exerciseSkills.push(template.caseType.replace(/_/g, " "));
    if (template?.promptStatement) {
        const promptKeywords = extractKeywords(template.promptStatement).slice(0, 10);
        exerciseSkills.push(...promptKeywords);
    }
    if (roleKit?.skillsFocus)
        exerciseSkills.push(...roleKit.skillsFocus);
    if (roleKit?.coreCompetencies)
        exerciseSkills.push(...roleKit.coreCompetencies);
    if (roleKit?.trackTags)
        exerciseSkills.push(...roleKit.trackTags);
    if (roleKit?.name)
        exerciseSkills.push(...extractKeywords(roleKit.name));
    if (roleKit?.domain)
        exerciseSkills.push(roleKit.domain.toLowerCase());
    if (codingExercise?.tags)
        exerciseSkills.push(...codingExercise.tags);
    if (codingExercise?.name)
        exerciseSkills.push(...extractKeywords(codingExercise.name));
    if (codingExercise?.language)
        exerciseSkills.push(codingExercise.language.toLowerCase());
    if (codingExercise?.activityType)
        exerciseSkills.push(codingExercise.activityType.replace(/_/g, " "));
    const recentSessionsRaw = await db
        .select({ jobTargetId: exerciseSessions.jobTargetId })
        .from(exerciseSessions)
        .where(and(eq(exerciseSessions.userId, userId), isNotNull(exerciseSessions.jobTargetId)))
        .orderBy(desc(exerciseSessions.createdAt))
        .limit(5);
    const recentJobIds = new Set(recentSessionsRaw
        .map(s => s.jobTargetId)
        .filter((id) => id !== null));
    const scoredJobs = userJobs.map(job => {
        const jobSkills = [];
        if (job.jdParsed?.requiredSkills)
            jobSkills.push(...job.jdParsed.requiredSkills);
        if (job.jdParsed?.preferredSkills)
            jobSkills.push(...job.jdParsed.preferredSkills);
        if (job.jdParsed?.focusAreas)
            jobSkills.push(...job.jdParsed.focusAreas);
        if (job.roleTitle)
            jobSkills.push(...extractKeywords(job.roleTitle));
        if (job.jdText) {
            const jdKeywords = extractKeywords(job.jdText).slice(0, 15);
            jobSkills.push(...jdKeywords);
        }
        const skillOverlap = calculateSkillOverlap(exerciseSkills, jobSkills);
        const roleTypeMatch = checkRoleTypeMatch(roleKit, template, job);
        const domainMatch = checkDomainMatch(roleKit, job);
        const recentActivity = recentJobIds.has(job.id);
        let score = 0;
        score += skillOverlap * 35;
        score += roleTypeMatch ? 30 : 0;
        score += domainMatch ? 15 : 0;
        score += recentActivity ? 15 : 0;
        if (job.status === "interview")
            score += 8;
        if (job.status === "applied")
            score += 5;
        if (userJobs.length === 1)
            score += 10;
        let confidence = "low";
        if (score >= 35)
            confidence = "high";
        else if (score >= 15)
            confidence = "medium";
        const rationalePoints = [];
        if (roleTypeMatch)
            rationalePoints.push(`Matches ${job.roleTitle}`);
        if (domainMatch)
            rationalePoints.push("Domain alignment");
        if (skillOverlap > 0.1)
            rationalePoints.push(`${Math.round(skillOverlap * 100)}% skill overlap`);
        if (recentActivity)
            rationalePoints.push("Recently practiced");
        if (job.status === "interview")
            rationalePoints.push("Active interview process");
        if (job.status === "applied")
            rationalePoints.push("Applied");
        const rationale = rationalePoints.length > 0
            ? rationalePoints.join(" • ")
            : "Saved job target";
        return {
            jobTargetId: job.id,
            jobTarget: {
                id: job.id,
                roleTitle: job.roleTitle,
                companyName: job.companyName,
                status: job.status,
            },
            confidence,
            score,
            rationale,
            matchSignals: {
                skillOverlap,
                roleTypeMatch,
                recentActivity,
                domainMatch,
            },
        };
    });
    scoredJobs.sort((a, b) => b.score - a.score);
    const topMatch = scoredJobs[0];
    if (topMatch.confidence === "low" && topMatch.score < 10) {
        return null;
    }
    return topMatch;
}
export async function getRankedJobSuggestions(userId, context, limit = 3) {
    const userJobs = await db
        .select()
        .from(jobTargets)
        .where(eq(jobTargets.userId, userId))
        .orderBy(desc(jobTargets.updatedAt));
    if (userJobs.length === 0) {
        return [];
    }
    let template = null;
    let codingExercise = null;
    let roleKit = null;
    if (context.exerciseType === "case_study" && context.templateId) {
        const [t] = await db.select().from(caseTemplates).where(eq(caseTemplates.id, context.templateId));
        template = t || null;
        if (template?.roleKitId) {
            const [rk] = await db.select().from(roleKits).where(eq(roleKits.id, template.roleKitId));
            roleKit = rk || null;
        }
    }
    else if (context.exerciseType === "coding_lab" && context.codingExerciseId) {
        const [ce] = await db.select().from(codingExercises).where(eq(codingExercises.id, context.codingExerciseId));
        codingExercise = ce || null;
        if (codingExercise?.roleKitId) {
            const [rk] = await db.select().from(roleKits).where(eq(roleKits.id, codingExercise.roleKitId));
            roleKit = rk || null;
        }
    }
    if (context.roleKitId && !roleKit) {
        const [rk] = await db.select().from(roleKits).where(eq(roleKits.id, context.roleKitId));
        roleKit = rk || null;
    }
    const exerciseSkills = [];
    if (template?.evaluationFocus)
        exerciseSkills.push(...template.evaluationFocus);
    if (template?.tags)
        exerciseSkills.push(...template.tags);
    if (template?.name)
        exerciseSkills.push(...extractKeywords(template.name));
    if (template?.caseType)
        exerciseSkills.push(template.caseType.replace(/_/g, " "));
    if (template?.promptStatement) {
        const promptKeywords = extractKeywords(template.promptStatement).slice(0, 10);
        exerciseSkills.push(...promptKeywords);
    }
    if (roleKit?.skillsFocus)
        exerciseSkills.push(...roleKit.skillsFocus);
    if (roleKit?.coreCompetencies)
        exerciseSkills.push(...roleKit.coreCompetencies);
    if (roleKit?.trackTags)
        exerciseSkills.push(...roleKit.trackTags);
    if (roleKit?.name)
        exerciseSkills.push(...extractKeywords(roleKit.name));
    if (roleKit?.domain)
        exerciseSkills.push(roleKit.domain.toLowerCase());
    if (codingExercise?.tags)
        exerciseSkills.push(...codingExercise.tags);
    if (codingExercise?.name)
        exerciseSkills.push(...extractKeywords(codingExercise.name));
    if (codingExercise?.language)
        exerciseSkills.push(codingExercise.language.toLowerCase());
    if (codingExercise?.activityType)
        exerciseSkills.push(codingExercise.activityType.replace(/_/g, " "));
    const recentSessionsRaw = await db
        .select({ jobTargetId: exerciseSessions.jobTargetId })
        .from(exerciseSessions)
        .where(and(eq(exerciseSessions.userId, userId), isNotNull(exerciseSessions.jobTargetId)))
        .orderBy(desc(exerciseSessions.createdAt))
        .limit(5);
    const recentJobIds = new Set(recentSessionsRaw
        .map(s => s.jobTargetId)
        .filter((id) => id !== null));
    const scoredJobs = userJobs.map(job => {
        const jobSkills = [];
        if (job.jdParsed?.requiredSkills)
            jobSkills.push(...job.jdParsed.requiredSkills);
        if (job.jdParsed?.preferredSkills)
            jobSkills.push(...job.jdParsed.preferredSkills);
        if (job.jdParsed?.focusAreas)
            jobSkills.push(...job.jdParsed.focusAreas);
        if (job.roleTitle)
            jobSkills.push(...extractKeywords(job.roleTitle));
        if (job.jdText) {
            const jdKeywords = extractKeywords(job.jdText).slice(0, 15);
            jobSkills.push(...jdKeywords);
        }
        const skillOverlap = calculateSkillOverlap(exerciseSkills, jobSkills);
        const roleTypeMatch = checkRoleTypeMatch(roleKit, template, job);
        const domainMatch = checkDomainMatch(roleKit, job);
        const recentActivity = recentJobIds.has(job.id);
        let score = 0;
        score += skillOverlap * 35;
        score += roleTypeMatch ? 30 : 0;
        score += domainMatch ? 15 : 0;
        score += recentActivity ? 15 : 0;
        if (job.status === "interview")
            score += 8;
        if (job.status === "applied")
            score += 5;
        if (userJobs.length === 1)
            score += 10;
        let confidence = "low";
        if (score >= 35)
            confidence = "high";
        else if (score >= 15)
            confidence = "medium";
        const rationalePoints = [];
        if (roleTypeMatch)
            rationalePoints.push(`Matches ${job.roleTitle}`);
        if (domainMatch)
            rationalePoints.push("Domain alignment");
        if (skillOverlap > 0.1)
            rationalePoints.push(`${Math.round(skillOverlap * 100)}% skill overlap`);
        if (recentActivity)
            rationalePoints.push("Recently practiced");
        if (job.status === "interview")
            rationalePoints.push("Active interview process");
        if (job.status === "applied")
            rationalePoints.push("Applied");
        const rationale = rationalePoints.length > 0
            ? rationalePoints.join(" • ")
            : "Saved job target";
        return {
            jobTargetId: job.id,
            jobTarget: {
                id: job.id,
                roleTitle: job.roleTitle,
                companyName: job.companyName,
                status: job.status,
            },
            confidence,
            score,
            rationale,
            matchSignals: {
                skillOverlap,
                roleTypeMatch,
                recentActivity,
                domainMatch,
            },
        };
    });
    scoredJobs.sort((a, b) => b.score - a.score);
    return scoredJobs.slice(0, limit);
}
