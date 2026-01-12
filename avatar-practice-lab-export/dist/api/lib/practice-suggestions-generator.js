import { db } from "../db.js";
import { companies, companyRoleBlueprints } from "../../shared/schema.js";
import { eq, sql } from "drizzle-orm";
const ROUND_TYPE_LABELS = {
    phone_screen: "Phone Screen",
    onsite: "On-site Interview",
    bar_raiser: "Bar Raiser",
    hiring_manager_round: "Hiring Manager",
    technical: "Technical Round",
    behavioral: "Behavioral Round",
    system_design: "System Design",
    online_test: "Online Assessment",
    superday: "Super Day",
    culture_fit: "Culture Fit",
    values: "Values Interview",
    machine_coding: "Machine Coding",
    debugging: "Debugging Exercise",
};
const FOCUS_AREA_LABELS = {
    coding: "Coding",
    algorithms: "Algorithms",
    "system-design": "System Design",
    behavioral: "Behavioral",
    leadership: "Leadership",
    "leadership-principles": "Leadership Principles",
    googleyness: "Googleyness",
    "product-sense": "Product Sense",
    analytical: "Analytical",
    technical: "Technical",
    dsa: "Data Structures & Algorithms",
    "machine-coding": "Machine Coding",
    debugging: "Debugging",
    scale: "Scale & Performance",
    reliability: "Reliability",
    payments: "Payments Domain",
    "culture-fit": "Culture Fit",
    values: "Company Values",
    execution: "Execution",
    ownership: "Ownership",
    "dive-deep": "Dive Deep",
    "customer-obsession": "Customer Obsession",
};
function detectRoleCategory(roleTitle) {
    const roleLower = roleTitle.toLowerCase();
    if (roleLower.includes("software") || roleLower.includes("engineer") ||
        roleLower.includes("developer") || roleLower.includes("sde") ||
        roleLower.includes("swe") || roleLower.includes("backend") ||
        roleLower.includes("frontend") || roleLower.includes("fullstack") ||
        roleLower.includes("full-stack") || roleLower.includes("full stack")) {
        return "swe";
    }
    if (roleLower.includes("data scientist") || roleLower.includes("data analyst") ||
        roleLower.includes("machine learning") || roleLower.includes("ml engineer") ||
        roleLower.includes("data engineer")) {
        return "data";
    }
    if (roleLower.includes("product manager") || roleLower.includes("pm") ||
        roleLower.includes("product lead") || roleLower.includes("apm")) {
        return "pm";
    }
    if (roleLower.includes("design") || roleLower.includes("ux") || roleLower.includes("ui")) {
        return "design";
    }
    if (roleLower.includes("sales") || roleLower.includes("account executive") ||
        roleLower.includes("business development")) {
        return "sales";
    }
    if (roleLower.includes("marketing") || roleLower.includes("growth")) {
        return "marketing";
    }
    if (roleLower.includes("operations") || roleLower.includes("ops")) {
        return "ops";
    }
    if (roleLower.includes("consultant") || roleLower.includes("consulting") ||
        roleLower.includes("strategy")) {
        return "consulting";
    }
    if (roleLower.includes("finance") || roleLower.includes("analyst")) {
        return "finance";
    }
    if (roleLower.includes("hr") || roleLower.includes("human resources") ||
        roleLower.includes("people ops") || roleLower.includes("recruiter")) {
        return "hr";
    }
    if (roleLower.includes("security") || roleLower.includes("infosec")) {
        return "security";
    }
    return "swe";
}
function detectSeniority(roleTitle, experienceLevel) {
    const roleLower = roleTitle.toLowerCase();
    const expLower = (experienceLevel || "").toLowerCase();
    if (roleLower.includes("principal") || roleLower.includes("distinguished") ||
        roleLower.includes("fellow") || roleLower.includes("architect")) {
        return "principal";
    }
    if (roleLower.includes("staff") || roleLower.includes("lead") ||
        expLower.includes("8+") || expLower.includes("10+")) {
        return "staff";
    }
    if (roleLower.includes("senior") || roleLower.includes("sr.") || roleLower.includes("sr ") ||
        expLower.includes("5+") || expLower.includes("6+") || expLower.includes("7+")) {
        return "senior";
    }
    if (roleLower.includes("junior") || roleLower.includes("jr.") || roleLower.includes("jr ") ||
        roleLower.includes("associate") || roleLower.includes("entry") ||
        expLower.includes("0-1") || expLower.includes("0-2") || expLower.includes("1-2")) {
        return "entry";
    }
    return "mid";
}
export async function findCompanyBlueprint(companyName, roleTitle, experienceLevel) {
    if (!companyName)
        return null;
    const companyNameClean = companyName.trim().toLowerCase();
    const companyResults = await db
        .select()
        .from(companies)
        .where(sql `LOWER(${companies.name}) = ${companyNameClean} OR LOWER(${companies.name}) LIKE ${'%' + companyNameClean + '%'}`)
        .limit(1);
    if (companyResults.length === 0)
        return null;
    const company = companyResults[0];
    const roleCategory = detectRoleCategory(roleTitle);
    const seniority = detectSeniority(roleTitle, experienceLevel);
    const blueprints = await db
        .select()
        .from(companyRoleBlueprints)
        .where(eq(companyRoleBlueprints.companyId, company.id));
    let bestMatch = blueprints.find(b => b.roleCategory === roleCategory && b.seniority === seniority);
    if (!bestMatch) {
        bestMatch = blueprints.find(b => b.roleCategory === roleCategory);
    }
    if (!bestMatch && blueprints.length > 0) {
        bestMatch = blueprints[0];
    }
    return {
        companyId: company.id,
        companyName: company.name,
        archetype: company.archetype || "enterprise",
        tier: company.tier || "tier2",
        blueprint: bestMatch ? {
            id: bestMatch.id,
            roleCategory: bestMatch.roleCategory,
            seniority: bestMatch.seniority,
            skillFocus: bestMatch.skillFocus || [],
            interviewRounds: bestMatch.interviewRounds || [],
            notes: bestMatch.notes,
            rubricOverrides: bestMatch.rubricOverrides,
        } : null,
    };
}
export function generatePracticeOptions(blueprintData, jdParsed, roleTitle) {
    const options = [];
    if (blueprintData?.blueprint) {
        const { blueprint, companyName, archetype } = blueprintData;
        const interviewRounds = blueprint.interviewRounds || [];
        const uniqueRoundTypes = new Map();
        interviewRounds.forEach(round => {
            const key = `${round.type}-${round.focus.sort().join(",")}`;
            if (!uniqueRoundTypes.has(round.type)) {
                uniqueRoundTypes.set(round.type, round);
            }
        });
        const roundEntries = Array.from(uniqueRoundTypes.entries());
        roundEntries.forEach(([roundType, round], index) => {
            const focusLabels = round.focus.map(f => FOCUS_AREA_LABELS[f] || f);
            const roundLabel = ROUND_TYPE_LABELS[roundType] || roundType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
            const roundDuration = round.duration || round.durationMins || 45;
            const isTechnical = round.focus.some(f => ["coding", "algorithms", "dsa", "system-design", "machine-coding", "debugging", "technical"].includes(f));
            const isBehavioral = round.focus.some(f => ["behavioral", "leadership", "leadership-principles", "googleyness", "values", "culture-fit", "ownership"].includes(f));
            let practiceType = "interview_round";
            if (isTechnical && round.focus.includes("system-design")) {
                practiceType = "case_study";
            }
            else if (round.focus.includes("coding") || round.focus.includes("dsa") || round.focus.includes("machine-coding")) {
                practiceType = "coding_practice";
            }
            else if (isBehavioral && !isTechnical) {
                practiceType = "behavioral";
            }
            options.push({
                id: `round-${round.round}-${roundType}`,
                type: practiceType,
                priority: index === 0 ? "high" : (index < 3 ? "medium" : "low"),
                title: `Practice ${companyName} ${roundLabel}`,
                description: `${roundDuration} min | Focus: ${focusLabels.slice(0, 3).join(", ")}`,
                roundNumber: round.round,
                roundType,
                focusAreas: round.focus,
                duration: roundDuration,
                companySpecific: true,
                action: {
                    type: practiceType === "coding_practice" ? "start_coding"
                        : practiceType === "case_study" ? "start_case"
                            : "start_interview",
                    interviewType: isBehavioral ? "behavioral" : (isTechnical ? "technical" : "hr"),
                    focusAreas: round.focus,
                    roundType,
                    companyContext: {
                        companyName,
                        archetype,
                        blueprintNotes: blueprint.notes || undefined,
                    },
                },
            });
        });
        if (blueprint.notes && archetype === "faang") {
            options.push({
                id: "company-prep",
                type: "behavioral",
                priority: "medium",
                title: `${companyName} Interview Prep Guide`,
                description: `Learn about ${companyName}'s interview culture and expectations`,
                focusAreas: ["culture", "preparation"],
                companySpecific: true,
                action: {
                    type: "view_guide",
                    companyContext: {
                        companyName,
                        archetype,
                        blueprintNotes: blueprint.notes,
                    },
                },
            });
        }
    }
    else {
        const roleCategory = detectRoleCategory(roleTitle);
        const isTechnical = ["swe", "data", "security"].includes(roleCategory);
        options.push({
            id: "generic-interview",
            type: "generic_interview",
            priority: "high",
            title: "Practice General Interview",
            description: jdParsed?.focusAreas
                ? `Focus on: ${jdParsed.focusAreas.slice(0, 3).join(", ")}`
                : "Practice common interview questions",
            focusAreas: jdParsed?.focusAreas || [],
            companySpecific: false,
            action: {
                type: "start_interview",
                focusAreas: jdParsed?.focusAreas,
            },
        });
        if (isTechnical) {
            const technicalSkills = jdParsed?.requiredSkills?.filter(s => {
                const sLower = s.toLowerCase();
                return sLower.includes("python") || sLower.includes("javascript") ||
                    sLower.includes("java") || sLower.includes("sql") ||
                    sLower.includes("coding") || sLower.includes("programming") ||
                    sLower.includes("c++") || sLower.includes("go") ||
                    sLower.includes("rust") || sLower.includes("typescript");
            }) || [];
            if (technicalSkills.length > 0 || isTechnical) {
                options.push({
                    id: "coding-practice",
                    type: "coding_practice",
                    priority: "medium",
                    title: "Coding Challenge Practice",
                    description: technicalSkills.length > 0
                        ? `Sharpen skills in: ${technicalSkills.slice(0, 3).join(", ")}`
                        : "Practice coding problems and algorithms",
                    focusAreas: technicalSkills,
                    companySpecific: false,
                    action: {
                        type: "start_coding",
                        focusAreas: technicalSkills,
                    },
                });
            }
        }
        if (roleCategory === "pm" || roleCategory === "consulting" || roleCategory === "finance") {
            options.push({
                id: "case-study",
                type: "case_study",
                priority: "medium",
                title: "Case Study Practice",
                description: "Practice analytical thinking and problem-solving",
                focusAreas: ["analytical", "problem-solving", "communication"],
                companySpecific: false,
                action: {
                    type: "start_case",
                },
            });
        }
        options.push({
            id: "behavioral",
            type: "behavioral",
            priority: "low",
            title: "Behavioral Interview Practice",
            description: "Practice STAR-format responses to common behavioral questions",
            focusAreas: ["behavioral", "leadership", "communication"],
            companySpecific: false,
            action: {
                type: "start_interview",
                interviewType: "behavioral",
            },
        });
    }
    return options;
}
export async function getCompanyAwarePracticeOptions(companyName, roleTitle, jdParsed) {
    const companyData = await findCompanyBlueprint(companyName, roleTitle, jdParsed?.experienceLevel);
    const options = generatePracticeOptions(companyData, jdParsed, roleTitle);
    return { options, companyData };
}
