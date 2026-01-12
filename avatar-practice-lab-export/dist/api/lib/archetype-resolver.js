import { db } from "../db.js";
import { companies, roleArchetypes, roleInterviewStructureDefaults, jobTargets, roleTaskBlueprints } from "../../shared/schema.js";
import { eq, sql, ilike, and } from "drizzle-orm";
import { extractSkillsFromText } from "./capability-vectorizer.js";
export function normalizeCompanyName(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[.,()]/g, "")
        .replace(/\s*(private|pvt|ltd|limited|inc|llc|corp|corporation|india|technologies|solutions|consulting|services)\s*/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
}
export async function matchCompanyDirect(companyName) {
    const normalized = normalizeCompanyName(companyName);
    const directMatch = await db
        .select()
        .from(companies)
        .where(sql `LOWER(${companies.name}) = ${normalized.toLowerCase()}`)
        .limit(1);
    if (directMatch.length > 0) {
        const company = directMatch[0];
        return {
            companyId: company.id,
            companyName: company.name,
            archetype: company.archetype,
            confidence: company.confidence || "medium",
            matchType: "direct",
            interviewComponents: company.interviewComponents,
        };
    }
    const likeMatch = await db
        .select()
        .from(companies)
        .where(ilike(companies.name, `%${companyName}%`))
        .limit(1);
    if (likeMatch.length > 0) {
        const company = likeMatch[0];
        return {
            companyId: company.id,
            companyName: company.name,
            archetype: company.archetype,
            confidence: "medium",
            matchType: "direct",
            interviewComponents: company.interviewComponents,
        };
    }
    return null;
}
export async function matchCompanyByAlias(companyName) {
    const normalized = normalizeCompanyName(companyName);
    const allCompanies = await db
        .select()
        .from(companies)
        .where(sql `${companies.aliases} IS NOT NULL`);
    for (const company of allCompanies) {
        const aliases = company.aliases || [];
        for (const alias of aliases) {
            const normalizedAlias = normalizeCompanyName(alias);
            if (normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized)) {
                return {
                    companyId: company.id,
                    companyName: company.name,
                    archetype: company.archetype,
                    confidence: "medium",
                    matchType: "alias",
                    interviewComponents: company.interviewComponents,
                };
            }
        }
    }
    return null;
}
export function inferCompanyArchetypeFromJD(jdText, companyName) {
    const text = (jdText || "").toLowerCase();
    const company = (companyName || "").toLowerCase();
    const archetypePatterns = [
        { archetype: "big_tech", patterns: ["faang", "maang", "google", "amazon", "microsoft", "meta", "apple", "netflix", "system design", "scale", "distributed systems"], confidence: "medium" },
        { archetype: "consulting", patterns: ["consulting", "mbb", "mckinsey", "bcg", "bain", "deloitte", "pwc", "ey", "kpmg", "case study", "client engagement"], confidence: "medium" },
        { archetype: "bfsi", patterns: ["banking", "financial services", "investment", "trading", "risk management", "compliance", "regulatory", "fintech"], confidence: "medium" },
        { archetype: "it_services", patterns: ["it services", "outsourcing", "service delivery", "client project", "onsite", "offshore", "tcs", "infosys", "wipro", "cognizant"], confidence: "medium" },
        { archetype: "fmcg", patterns: ["fmcg", "consumer goods", "brand management", "trade marketing", "distribution", "supply chain", "retail"], confidence: "medium" },
        { archetype: "saas", patterns: ["saas", "subscription", "b2b software", "enterprise software", "cloud platform", "api"], confidence: "medium" },
        { archetype: "fintech", patterns: ["fintech", "payments", "lending", "digital banking", "neobank", "crypto", "blockchain"], confidence: "medium" },
        { archetype: "edtech", patterns: ["edtech", "education", "learning", "e-learning", "online courses", "upskilling"], confidence: "medium" },
        { archetype: "consumer", patterns: ["consumer tech", "app", "mobile", "consumer internet", "marketplace", "delivery", "food tech"], confidence: "medium" },
        { archetype: "startup", patterns: ["startup", "series a", "series b", "venture", "fast-paced", "hypergrowth", "founder"], confidence: "low" },
        { archetype: "enterprise", patterns: ["enterprise", "fortune 500", "mnc", "legacy", "transformation"], confidence: "low" },
    ];
    for (const { archetype, patterns, confidence } of archetypePatterns) {
        const matchCount = patterns.filter(p => text.includes(p) || company.includes(p)).length;
        if (matchCount >= 2) {
            return {
                companyName,
                archetype,
                confidence,
                matchType: "inference",
            };
        }
    }
    return {
        companyName,
        archetype: null,
        confidence: "low",
        matchType: "none",
    };
}
export async function resolveCompanyArchetype(companyName, jdText) {
    const directMatch = await matchCompanyDirect(companyName);
    if (directMatch)
        return directMatch;
    const aliasMatch = await matchCompanyByAlias(companyName);
    if (aliasMatch)
        return aliasMatch;
    if (jdText) {
        return inferCompanyArchetypeFromJD(jdText, companyName);
    }
    return {
        companyName,
        archetype: null,
        confidence: "low",
        matchType: "none",
    };
}
const ROLE_KEYWORDS = {
    core_software_engineer: {
        roleArchetypeId: "core_software_engineer",
        patterns: ["software engineer", "software developer", "sde", "backend", "frontend", "fullstack", "full stack", "full-stack", "mobile developer", "ios developer", "android developer", "web developer"],
    },
    data_analyst: {
        roleArchetypeId: "data_analyst",
        patterns: ["data analyst", "business analyst", "analytics", "bi analyst", "business intelligence"],
    },
    data_engineer: {
        roleArchetypeId: "data_engineer",
        patterns: ["data engineer", "etl developer", "data platform", "data infrastructure", "big data engineer"],
    },
    data_scientist: {
        roleArchetypeId: "data_scientist",
        patterns: ["data scientist", "data science", "applied scientist", "research scientist"],
    },
    ml_engineer: {
        roleArchetypeId: "ml_engineer",
        patterns: ["ml engineer", "machine learning engineer", "mlops", "ai engineer", "deep learning"],
    },
    infra_platform: {
        roleArchetypeId: "infra_platform",
        patterns: ["devops", "sre", "site reliability", "platform engineer", "infrastructure", "cloud engineer", "kubernetes", "devsecops"],
    },
    security_engineer: {
        roleArchetypeId: "security_engineer",
        patterns: ["security engineer", "security analyst", "cybersecurity", "infosec", "penetration tester", "appsec"],
    },
    qa_test_engineer: {
        roleArchetypeId: "qa_test_engineer",
        patterns: ["qa engineer", "quality assurance", "test engineer", "sdet", "automation engineer", "quality engineer"],
    },
    product_manager: {
        roleArchetypeId: "product_manager",
        patterns: ["product manager", "pm", "product owner", "apm", "associate product manager", "group product manager"],
    },
    technical_program_manager: {
        roleArchetypeId: "technical_program_manager",
        patterns: ["technical program manager", "tpm", "program manager", "engineering program manager"],
    },
    product_designer: {
        roleArchetypeId: "product_designer",
        patterns: ["product designer", "ux designer", "ui designer", "ux/ui", "interaction designer", "visual designer"],
    },
    marketing_growth: {
        roleArchetypeId: "marketing_growth",
        patterns: ["marketing", "growth", "digital marketing", "performance marketing", "brand marketing", "content marketing"],
    },
    sales_account: {
        roleArchetypeId: "sales_account",
        patterns: ["sales", "account executive", "account manager", "business development", "sales executive", "enterprise sales"],
    },
    customer_success: {
        roleArchetypeId: "customer_success",
        patterns: ["customer success", "csm", "customer success manager", "client success", "customer experience"],
    },
    bizops_strategy: {
        roleArchetypeId: "bizops_strategy",
        patterns: ["bizops", "business operations", "strategy", "chief of staff", "strategy analyst", "corporate strategy"],
    },
    operations_general: {
        roleArchetypeId: "operations_general",
        patterns: ["operations", "ops manager", "operations manager", "supply chain", "logistics", "process improvement"],
    },
    finance_strategy: {
        roleArchetypeId: "finance_strategy",
        patterns: ["finance", "fp&a", "financial analyst", "investment banking", "corporate finance", "treasury"],
    },
    consulting_general: {
        roleArchetypeId: "consulting_general",
        patterns: ["consultant", "management consultant", "strategy consultant", "associate consultant", "senior consultant"],
    },
};
const ROLE_FAMILY_MAP = {
    core_software_engineer: "tech",
    data_analyst: "data",
    data_engineer: "data",
    data_scientist: "data",
    ml_engineer: "data",
    infra_platform: "tech",
    security_engineer: "tech",
    qa_test_engineer: "tech",
    product_manager: "product",
    technical_program_manager: "product",
    product_designer: "product",
    marketing_growth: "business",
    sales_account: "sales",
    customer_success: "sales",
    bizops_strategy: "business",
    operations_general: "business",
    finance_strategy: "business",
    consulting_general: "business",
};
export async function resolveRoleArchetype(roleTitle, jdText) {
    const normalizedTitle = roleTitle.toLowerCase().trim();
    const normalizedJd = (jdText || "").toLowerCase();
    let bestMatch = null;
    for (const [archetypeId, config] of Object.entries(ROLE_KEYWORDS)) {
        const titleMatchCount = config.patterns.filter(p => normalizedTitle.includes(p)).length;
        if (titleMatchCount > 0 && (!bestMatch || titleMatchCount > bestMatch.matchCount)) {
            bestMatch = { archetypeId, matchCount: titleMatchCount, matchType: "keyword" };
        }
    }
    if (!bestMatch && jdText) {
        for (const [archetypeId, config] of Object.entries(ROLE_KEYWORDS)) {
            const jdMatchCount = config.patterns.filter(p => normalizedJd.includes(p)).length;
            if (jdMatchCount >= 2 && (!bestMatch || jdMatchCount > bestMatch.matchCount)) {
                bestMatch = { archetypeId, matchCount: jdMatchCount, matchType: "jd_inference" };
            }
        }
    }
    if (bestMatch) {
        const archetype = await db
            .select()
            .from(roleArchetypes)
            .where(eq(roleArchetypes.id, bestMatch.archetypeId))
            .limit(1);
        if (archetype.length > 0) {
            return {
                roleArchetypeId: archetype[0].id,
                roleArchetypeName: archetype[0].name,
                roleFamily: ROLE_FAMILY_MAP[bestMatch.archetypeId] || null,
                confidence: bestMatch.matchType === "keyword" ? "high" : "medium",
                matchType: bestMatch.matchType,
                primarySkillDimensions: archetype[0].primarySkillDimensions,
            };
        }
    }
    return {
        roleArchetypeId: null,
        roleArchetypeName: null,
        roleFamily: null,
        confidence: "low",
        matchType: "none",
    };
}
export async function getRoleInterviewStructure(roleArchetypeId, seniority) {
    const structure = await db
        .select()
        .from(roleInterviewStructureDefaults)
        .where(sql `${roleInterviewStructureDefaults.roleArchetypeId} = ${roleArchetypeId} 
          AND ${roleInterviewStructureDefaults.seniority} = ${seniority}`)
        .limit(1);
    if (structure.length > 0) {
        return {
            phases: structure[0].phasesJson,
            emphasisWeights: structure[0].emphasisWeightsJson,
        };
    }
    return null;
}
export async function getRoleArchetypeDetails(roleArchetypeId) {
    const archetype = await db
        .select()
        .from(roleArchetypes)
        .where(eq(roleArchetypes.id, roleArchetypeId))
        .limit(1);
    if (archetype.length > 0) {
        return archetype[0];
    }
    return null;
}
export async function listAllRoleArchetypes() {
    return db.select().from(roleArchetypes).where(eq(roleArchetypes.isActive, true));
}
export async function listAllCompanyArchetypes() {
    const result = await db
        .select({
        archetype: companies.archetype,
        count: sql `COUNT(*)::int`,
    })
        .from(companies)
        .where(sql `${companies.archetype} IS NOT NULL`)
        .groupBy(companies.archetype);
    return result.map(r => ({
        archetype: r.archetype || "unknown",
        count: r.count,
    }));
}
export async function updateJobArchetypes(jobTargetId, companyArchetype, archetypeConfidence, roleArchetypeId, roleFamily) {
    await db
        .update(jobTargets)
        .set({
        companyArchetype: companyArchetype,
        archetypeConfidence: archetypeConfidence,
        roleArchetypeId,
        roleFamily: roleFamily,
        updatedAt: new Date(),
    })
        .where(eq(jobTargets.id, jobTargetId));
}
const PHASE_TO_CATEGORY_MAP = {
    "Aptitude Assessment": { category: "aptitude_assessment", practiceMode: "coding_lab", description: "Quantitative, logical, and verbal reasoning assessment" },
    "HR Screening": { category: "hr_screening", practiceMode: "live_interview", description: "Behavioral assessment, motivation, background, and cultural fit" },
    "Phone Screen": { category: "hr_screening", practiceMode: "live_interview", description: "Initial screening call covering background and basic fit" },
    "Technical Interview": { category: "technical_interview", practiceMode: "live_interview", description: "Technical discussion covering domain expertise and problem-solving" },
    "Coding Round": { category: "coding_assessment", practiceMode: "coding_lab", description: "Hands-on coding problems to demonstrate programming skills" },
    "DSA Round": { category: "coding_assessment", practiceMode: "coding_lab", description: "Data structures and algorithms problem solving" },
    "System Design": { category: "system_design", practiceMode: "case_study", description: "Design scalable systems and discuss architectural tradeoffs" },
    "Hiring Manager": { category: "hiring_manager", practiceMode: "live_interview", description: "Deep-dive into role requirements, domain expertise, and team fit" },
    "Behavioral": { category: "behavioral", practiceMode: "live_interview", description: "STAR-format questions about past experiences and competencies" },
    "Case Study": { category: "case_study", practiceMode: "case_study", description: "Analyze business problems, structure approach, present recommendations" },
    "Product Sense": { category: "case_study", practiceMode: "case_study", description: "Product thinking, prioritization, and user-focused problem solving" },
    "Analytics Case": { category: "case_study", practiceMode: "case_study", description: "Data-driven problem solving and metric analysis" },
    "SQL Round": { category: "coding_assessment", practiceMode: "coding_lab", description: "SQL query writing and database problem solving" },
    "ML Round": { category: "technical_interview", practiceMode: "live_interview", description: "Machine learning concepts, algorithms, and implementation" },
    "Culture Fit": { category: "culture_values", practiceMode: "live_interview", description: "Assessment of values alignment and collaboration style" },
    "Bar Raiser": { category: "bar_raiser", practiceMode: "live_interview", description: "Cross-functional interview focused on raising the hiring bar" },
    "Group Discussion": { category: "group_discussion", practiceMode: "live_interview", description: "Group discussion evaluating communication and teamwork" },
    "Presentation": { category: "case_study", practiceMode: "case_study", description: "Present analysis, recommendations, or technical work to interviewers" },
};
const DEFAULT_PHASES_BY_ROLE_FAMILY = {
    tech: [
        { name: "HR Screening", mins: 30 },
        { name: "Technical Interview", mins: 45 },
        { name: "Coding Round", mins: 60 },
        { name: "System Design", mins: 45 },
        { name: "Hiring Manager", mins: 45 },
    ],
    data: [
        { name: "HR Screening", mins: 30 },
        { name: "Technical Interview", mins: 45 },
        { name: "SQL Round", mins: 45 },
        { name: "Analytics Case", mins: 45 },
        { name: "Hiring Manager", mins: 45 },
    ],
    product: [
        { name: "HR Screening", mins: 30 },
        { name: "Product Sense", mins: 45 },
        { name: "Case Study", mins: 45 },
        { name: "Behavioral", mins: 45 },
        { name: "Hiring Manager", mins: 45 },
    ],
    sales: [
        { name: "HR Screening", mins: 30 },
        { name: "Behavioral", mins: 45 },
        { name: "Case Study", mins: 30 },
        { name: "Hiring Manager", mins: 45 },
    ],
    business: [
        { name: "HR Screening", mins: 30 },
        { name: "Case Study", mins: 45 },
        { name: "Behavioral", mins: 45 },
        { name: "Hiring Manager", mins: 45 },
    ],
};
async function getCompanyInterviewComponents(companyName) {
    if (!companyName)
        return null;
    const normalizedName = companyName.toLowerCase().trim();
    const [company] = await db
        .select({ interviewComponents: companies.interviewComponents })
        .from(companies)
        .where(sql `LOWER(${companies.name}) LIKE ${'%' + normalizedName + '%'}`);
    if (company?.interviewComponents) {
        return company.interviewComponents;
    }
    return null;
}
const COMPONENT_TO_ROUND = {
    aptitude: { name: "Aptitude Assessment", mins: 60, priority: 1 },
    hrScreen: { name: "HR Screening", mins: 30, priority: 2 },
    codingChallenge: { name: "Coding Round", mins: 60, priority: 3 },
    technicalDsaSql: { name: "Technical Interview", mins: 45, priority: 4 },
    systemDesign: { name: "System Design", mins: 45, priority: 5 },
    caseStudy: { name: "Case Study", mins: 45, priority: 6 },
    behavioral: { name: "Behavioral", mins: 45, priority: 7 },
    hiringManager: { name: "Hiring Manager", mins: 45, priority: 8 },
    groupDiscussion: { name: "Group Discussion", mins: 60, priority: 9 },
    presentation: { name: "Case Study", mins: 45, priority: 6 },
};
// Maps role archetype common_interview_types to company component keys
// Role interview types → Which company components are relevant for that role
const ROLE_INTERVIEW_TYPE_TO_COMPONENTS = {
    "technical": ["technicalDsaSql", "codingChallenge", "systemDesign"],
    "coding": ["codingChallenge", "technicalDsaSql"],
    "hiring_manager": ["hiringManager"],
    "behavioral": ["behavioral"],
    "hr": ["hrScreen"],
    "case": ["caseStudy", "presentation"],
    "product": ["caseStudy", "presentation"],
    "portfolio": ["caseStudy", "presentation"],
    "sales_roleplay": ["behavioral", "hiringManager"],
    "aptitude": ["aptitude"],
    "group": ["groupDiscussion"],
};
// Maps company components to relevant role interview types
// Used to check if a company component is relevant for a given role
const COMPONENT_TO_ROLE_TYPES = {
    aptitude: ["aptitude"],
    hrScreen: ["hr"],
    codingChallenge: ["technical", "coding"],
    technicalDsaSql: ["technical", "coding"],
    systemDesign: ["technical"],
    caseStudy: ["case", "product", "portfolio"],
    behavioral: ["behavioral", "sales_roleplay"],
    hiringManager: ["hiring_manager", "sales_roleplay"],
    groupDiscussion: ["group"],
    presentation: ["case", "product", "portfolio"],
};
export async function getUnifiedInterviewPlan(roleArchetypeId, roleFamily, companyArchetype, archetypeConfidence, experienceLevel, companyNotes = null, companyName = null) {
    const seniority = experienceLevel === "senior" || experienceLevel === "lead" || experienceLevel === "executive" ? "senior" :
        experienceLevel === "entry" ? "entry" : "mid";
    let roleArchetypeDetails = null;
    let structureDefaults = null;
    if (roleArchetypeId) {
        const details = await getRoleArchetypeDetails(roleArchetypeId);
        if (details) {
            roleArchetypeDetails = {
                id: details.id,
                name: details.name,
                roleFamily: details.roleCategory || null,
                commonInterviewTypes: details.commonInterviewTypes || [],
                commonFailureModes: details.commonFailureModes || [],
                primarySkillDimensions: details.primarySkillDimensions || [],
            };
        }
        structureDefaults = await getRoleInterviewStructure(roleArchetypeId, seniority);
    }
    let phases = [];
    let emphasisWeights = {};
    const companyComponents = companyName ? await getCompanyInterviewComponents(companyName) : null;
    const roleInterviewTypes = roleArchetypeDetails?.commonInterviewTypes || [];
    // CORE INTERSECTION LOGIC
    // Only show rounds that are relevant to BOTH company AND role
    if (companyComponents && roleInterviewTypes.length > 0) {
        const relevantRounds = [];
        // Get company's active components
        const activeCompanyComponents = Object.entries(companyComponents)
            .filter(([_, value]) => value === true)
            .map(([key]) => key);
        // For each company component, check if it's relevant for this role
        for (const componentKey of activeCompanyComponents) {
            const componentRoleTypes = COMPONENT_TO_ROLE_TYPES[componentKey] || [];
            const roundConfig = COMPONENT_TO_ROUND[componentKey];
            if (!roundConfig)
                continue;
            // Check if any of this component's role types match the role's interview types
            const isRelevantForRole = componentRoleTypes.some(roleType => roleInterviewTypes.includes(roleType));
            // Always include hr_screen, behavioral, hiring_manager as they're common to most roles
            const isUniversalRound = ["hrScreen", "behavioral", "hiringManager"].includes(componentKey);
            if (isRelevantForRole || isUniversalRound) {
                relevantRounds.push({
                    ...roundConfig,
                    provenance: isRelevantForRole ? "both" : "company",
                });
            }
        }
        // Add role-critical rounds that company might not have (e.g., case study for PM)
        for (const roleType of roleInterviewTypes) {
            const relevantComponents = ROLE_INTERVIEW_TYPE_TO_COMPONENTS[roleType] || [];
            for (const componentKey of relevantComponents) {
                const roundConfig = COMPONENT_TO_ROUND[componentKey];
                if (!roundConfig)
                    continue;
                // If company doesn't have this component but role needs it, add as role-only
                const alreadyAdded = relevantRounds.some(r => r.name === roundConfig.name);
                if (!alreadyAdded && !activeCompanyComponents.includes(componentKey)) {
                    // Only add if it's a core role requirement (case for PM, coding for SWE)
                    const isCoreRoleRound = ["case", "product", "technical", "coding", "portfolio"].includes(roleType);
                    if (isCoreRoleRound) {
                        relevantRounds.push({
                            ...roundConfig,
                            provenance: "role",
                        });
                    }
                }
            }
        }
        // Sort by priority and deduplicate
        relevantRounds.sort((a, b) => a.priority - b.priority);
        phases = relevantRounds.map(round => {
            const mapping = PHASE_TO_CATEGORY_MAP[round.name] || {
                category: "technical_interview",
                practiceMode: "live_interview",
                description: "Interview round"
            };
            return {
                name: round.name,
                category: mapping.category,
                mins: round.mins,
                practiceMode: mapping.practiceMode,
                description: mapping.description,
                emphasisWeight: 1,
                provenance: round.provenance,
            };
        });
    }
    else if (companyComponents) {
        // No role archetype - use company components only (fallback)
        const activeRounds = [];
        for (const [key, value] of Object.entries(companyComponents)) {
            if (value === true && COMPONENT_TO_ROUND[key]) {
                activeRounds.push(COMPONENT_TO_ROUND[key]);
            }
        }
        activeRounds.sort((a, b) => a.priority - b.priority);
        phases = activeRounds.map(round => {
            const mapping = PHASE_TO_CATEGORY_MAP[round.name] || {
                category: "technical_interview",
                practiceMode: "live_interview",
                description: "Interview round"
            };
            return {
                name: round.name,
                category: mapping.category,
                mins: round.mins,
                practiceMode: mapping.practiceMode,
                description: mapping.description,
                emphasisWeight: 1,
            };
        });
    }
    else if (structureDefaults && structureDefaults.phases.length > 0) {
        // No company - use role archetype structure defaults
        phases = structureDefaults.phases.map(phase => {
            const mapping = PHASE_TO_CATEGORY_MAP[phase.name] || {
                category: "technical_interview",
                practiceMode: "live_interview",
                description: "Interview round"
            };
            return {
                name: phase.name,
                category: mapping.category,
                mins: phase.mins,
                practiceMode: mapping.practiceMode,
                description: mapping.description,
                subphases: phase.subphases,
                emphasisWeight: structureDefaults.emphasisWeights[phase.name] || 1,
            };
        });
        emphasisWeights = structureDefaults.emphasisWeights;
    }
    else {
        // No company and no role archetype - use role family defaults
        const family = roleFamily || "tech";
        const defaultPhases = DEFAULT_PHASES_BY_ROLE_FAMILY[family] || DEFAULT_PHASES_BY_ROLE_FAMILY.tech;
        phases = defaultPhases.map(phase => {
            const mapping = PHASE_TO_CATEGORY_MAP[phase.name] || {
                category: "technical_interview",
                practiceMode: "live_interview",
                description: "Interview round"
            };
            return {
                name: phase.name,
                category: mapping.category,
                mins: phase.mins,
                practiceMode: mapping.practiceMode,
                description: mapping.description,
                emphasisWeight: 1,
            };
        });
    }
    return {
        roleArchetype: roleArchetypeDetails ? {
            id: roleArchetypeDetails.id,
            name: roleArchetypeDetails.name,
            family: roleArchetypeDetails.roleFamily,
        } : null,
        companyArchetype: companyArchetype ? {
            type: companyArchetype,
            confidence: archetypeConfidence || "low",
        } : null,
        phases,
        emphasisWeights,
        companyNotes,
        seniority,
    };
}
export async function resolveAndSaveJobArchetypes(jobTargetId, companyName, roleTitle, jdText) {
    const companyResolution = await resolveCompanyArchetype(companyName, jdText);
    const roleResolution = await resolveRoleArchetype(roleTitle, jdText);
    await updateJobArchetypes(jobTargetId, companyResolution.archetype, companyResolution.confidence, roleResolution.roleArchetypeId, roleResolution.roleFamily);
    return { companyResolution, roleResolution };
}
export async function getRoleTaskBlueprints(roleArchetypeId, taskTypes) {
    if (!roleArchetypeId)
        return [];
    const query = db
        .select({
        id: roleTaskBlueprints.id,
        taskType: roleTaskBlueprints.taskType,
        difficultyBand: roleTaskBlueprints.difficultyBand,
        promptTemplate: roleTaskBlueprints.promptTemplate,
        expectedSignalsJson: roleTaskBlueprints.expectedSignalsJson,
        probeTreeJson: roleTaskBlueprints.probeTreeJson,
        tagsJson: roleTaskBlueprints.tagsJson,
    })
        .from(roleTaskBlueprints)
        .where(and(eq(roleTaskBlueprints.roleArchetypeId, roleArchetypeId), eq(roleTaskBlueprints.isActive, true)));
    const results = await query;
    let blueprints = results.map(r => ({
        id: r.id,
        taskType: r.taskType,
        difficultyBand: r.difficultyBand || "entry-mid",
        promptTemplate: r.promptTemplate,
        expectedSignals: r.expectedSignalsJson || [],
        probeTree: r.probeTreeJson || [],
        tags: r.tagsJson || [],
    }));
    if (taskTypes && taskTypes.length > 0) {
        blueprints = blueprints.filter(b => taskTypes.includes(b.taskType));
    }
    return blueprints;
}
// Maps phase names to likely task types for blueprint matching
const PHASE_TO_TASK_TYPES = {
    "Case Study": ["case_interview", "metrics_case", "execution_scenario"],
    "HR Screening": ["behavioral_star"],
    "Behavioral": ["behavioral_star"],
    "Hiring Manager": ["behavioral_star", "execution_scenario"],
    "Technical Interview": ["coding_explain", "debugging", "code_review"],
    "Coding Round": ["coding_explain", "debugging", "code_modification"],
    "System Design": ["code_review"],
    "Presentation": ["portfolio_walkthrough", "insight_storytelling"],
    "Panel Interview": ["behavioral_star", "case_interview"],
    "Aptitude Assessment": [],
    "Group Discussion": [],
};
const INTERVIEW_TYPE_METADATA = {
    technical: {
        label: "Technical Interview",
        description: "Technical problem solving including coding, algorithms, system design, and domain expertise",
        typicalDuration: "10-15 min",
        icon: "code",
        practiceMode: "live_interview",
        taskTypes: ["coding_explain", "debugging", "code_modification", "code_review"],
    },
    coding: {
        label: "Coding Assessment",
        description: "Hands-on coding challenges with data structures, algorithms, and problem solving",
        typicalDuration: "10-15 min",
        icon: "terminal",
        practiceMode: "coding_lab",
        taskTypes: ["coding_explain", "debugging", "code_modification"],
    },
    hiring_manager: {
        label: "Hiring Manager Round",
        description: "Deep-dive conversation on role expectations, team fit, and leadership assessment",
        typicalDuration: "10-15 min",
        icon: "user",
        practiceMode: "live_interview",
        taskTypes: ["behavioral_star", "execution_scenario"],
    },
    behavioral: {
        label: "Behavioral Interview",
        description: "STAR-format questions about past experiences, teamwork, and competencies",
        typicalDuration: "10-15 min",
        icon: "message-circle",
        practiceMode: "live_interview",
        taskTypes: ["behavioral_star"],
    },
    hr: {
        label: "HR Screening",
        description: "Initial screening covering background, motivation, and cultural fit",
        typicalDuration: "10-15 min",
        icon: "phone",
        practiceMode: "live_interview",
        taskTypes: ["behavioral_star"],
    },
    case: {
        label: "Case Study",
        description: "Business case analysis with structured problem-solving and recommendations",
        typicalDuration: "10-15 min",
        icon: "briefcase",
        practiceMode: "case_study",
        taskTypes: ["case_interview", "metrics_case", "execution_scenario"],
    },
    product: {
        label: "Product Sense",
        description: "Product thinking, prioritization, and user-focused problem solving",
        typicalDuration: "10-15 min",
        icon: "layout",
        practiceMode: "case_study",
        taskTypes: ["case_interview", "metrics_case", "execution_scenario"],
    },
    portfolio: {
        label: "Portfolio Review",
        description: "Walk through your design portfolio and explain your design process",
        typicalDuration: "10-15 min",
        icon: "image",
        practiceMode: "presentation",
        taskTypes: ["portfolio_walkthrough", "insight_storytelling"],
    },
    sales_roleplay: {
        label: "Sales Roleplay",
        description: "Sales pitch and objection handling in simulated customer scenarios",
        typicalDuration: "10-15 min",
        icon: "dollar-sign",
        practiceMode: "live_interview",
        taskTypes: ["behavioral_star"],
    },
    aptitude: {
        label: "Aptitude Assessment",
        description: "Quantitative, logical, and verbal reasoning evaluation",
        typicalDuration: "10-15 min",
        icon: "brain",
        practiceMode: "live_interview",
        taskTypes: [],
    },
    group: {
        label: "Group Discussion",
        description: "Collaborative discussion evaluating communication and teamwork",
        typicalDuration: "10-15 min",
        icon: "users",
        practiceMode: "live_interview",
        taskTypes: [],
    },
    sql: {
        label: "SQL Assessment",
        description: "SQL query writing and database problem solving",
        typicalDuration: "10-15 min",
        icon: "database",
        practiceMode: "coding_lab",
        taskTypes: ["sql_case"],
    },
    analytics: {
        label: "Analytics Case",
        description: "Data-driven problem solving, metric analysis, and insights presentation",
        typicalDuration: "10-15 min",
        icon: "bar-chart",
        practiceMode: "case_study",
        taskTypes: ["metrics_investigation", "insight_storytelling"],
    },
    ml: {
        label: "ML/AI Round",
        description: "Machine learning concepts, model design, and implementation discussion",
        typicalDuration: "10-15 min",
        icon: "cpu",
        practiceMode: "live_interview",
        taskTypes: ["coding_explain", "code_review"],
    },
};
export async function getRolePracticeOptions(roleArchetypeId, experienceLevel) {
    // Get role archetype details
    const archetype = await getRoleArchetypeDetails(roleArchetypeId);
    if (!archetype) {
        return [];
    }
    // Get common interview types from role archetype
    const interviewTypes = archetype.commonInterviewTypes || ["technical", "hiring_manager", "behavioral"];
    // Get all task blueprints for this role
    const allBlueprints = await getRoleTaskBlueprints(roleArchetypeId);
    // Build practice options from interview types
    const options = [];
    for (const interviewType of interviewTypes) {
        const metadata = INTERVIEW_TYPE_METADATA[interviewType];
        if (!metadata)
            continue;
        // Match blueprints to this interview type
        const matchingBlueprints = allBlueprints.filter(b => metadata.taskTypes.includes(b.taskType));
        // Get focus areas from primary skill dimensions
        const focusAreas = archetype.primarySkillDimensions || [];
        options.push({
            id: `${roleArchetypeId}-${interviewType}`,
            roundCategory: interviewType,
            label: metadata.label,
            description: metadata.description,
            typicalDuration: metadata.typicalDuration,
            icon: metadata.icon,
            practiceMode: metadata.practiceMode,
            focusAreas: focusAreas.slice(0, 3),
            blueprints: matchingBlueprints,
        });
    }
    return options;
}
export async function getEnrichedInterviewPlan(roleArchetypeId, roleFamily, companyArchetype, archetypeConfidence, experienceLevel, companyNotes = null, companyName = null) {
    const basePlan = await getUnifiedInterviewPlan(roleArchetypeId, roleFamily, companyArchetype, archetypeConfidence, experienceLevel, companyNotes, companyName);
    const allBlueprints = await getRoleTaskBlueprints(roleArchetypeId);
    const enrichedPhases = basePlan.phases.map((phase, index) => {
        const taskTypes = PHASE_TO_TASK_TYPES[phase.name] || [];
        const matchingBlueprints = allBlueprints.filter(b => taskTypes.includes(b.taskType));
        const phaseId = `${phase.category}-${index}`;
        return {
            ...phase,
            phaseId,
            blueprints: matchingBlueprints,
        };
    });
    return {
        ...basePlan,
        phases: enrichedPhases,
    };
}
const EMPLOYER_PHASE_TEMPLATES = {
    tech: {
        phases: [
            { name: "Introduction", baseMins: 2, category: "warmup", description: "Greeting and setting expectations" },
            { name: "Technical Assessment", baseMins: 5, category: "technical", description: "Core technical skills and problem-solving ability" },
            { name: "Behavioral", baseMins: 3, category: "behavioral", description: "Work style, collaboration, and situational responses" },
            { name: "Wrap-up", baseMins: 2, category: "closing", description: "Questions and next steps" },
        ],
    },
    data: {
        phases: [
            { name: "Introduction", baseMins: 2, category: "warmup", description: "Greeting and setting expectations" },
            { name: "Analytical Assessment", baseMins: 5, category: "technical", description: "Data analysis skills and problem-solving" },
            { name: "Behavioral", baseMins: 3, category: "behavioral", description: "Work style and data-driven decision making" },
            { name: "Wrap-up", baseMins: 2, category: "closing", description: "Questions and next steps" },
        ],
    },
    product: {
        phases: [
            { name: "Introduction", baseMins: 2, category: "warmup", description: "Greeting and setting expectations" },
            { name: "Product Thinking", baseMins: 5, category: "case_study", description: "Product sense, prioritization, and strategic thinking" },
            { name: "Behavioral", baseMins: 3, category: "behavioral", description: "Leadership, stakeholder management, and execution" },
            { name: "Wrap-up", baseMins: 2, category: "closing", description: "Questions and next steps" },
        ],
    },
    sales: {
        phases: [
            { name: "Introduction", baseMins: 2, category: "warmup", description: "Greeting and rapport building" },
            { name: "Sales Assessment", baseMins: 5, category: "behavioral", description: "Sales approach, objection handling, and closing skills" },
            { name: "Role Play", baseMins: 3, category: "situational", description: "Simulated sales conversation" },
            { name: "Wrap-up", baseMins: 2, category: "closing", description: "Questions and next steps" },
        ],
    },
    business: {
        phases: [
            { name: "Introduction", baseMins: 2, category: "warmup", description: "Greeting and setting expectations" },
            { name: "Case Discussion", baseMins: 5, category: "case_study", description: "Business problem-solving and analytical thinking" },
            { name: "Behavioral", baseMins: 3, category: "behavioral", description: "Work style, collaboration, and leadership" },
            { name: "Wrap-up", baseMins: 2, category: "closing", description: "Questions and next steps" },
        ],
    },
};
const DEFAULT_EMPLOYER_PHASES = EMPLOYER_PHASE_TEMPLATES.business.phases;
const TARGET_INTERVIEW_DURATION = 12;
export async function buildEmployerInterviewPlan(roleTitle, jdText, companyName, seniority = "mid") {
    const roleResolution = await resolveRoleArchetype(roleTitle, jdText);
    const companyResolution = companyName
        ? await resolveCompanyArchetype(companyName, jdText)
        : { archetype: null, confidence: "low" };
    const extractedSkills = extractSkillsFromText(jdText, "jd");
    const sortedSkills = [...extractedSkills].sort((a, b) => b.weight - a.weight);
    const primarySkills = sortedSkills.slice(0, 5).map(s => s.skill);
    const secondarySkills = sortedSkills.slice(5, 10).map(s => s.skill);
    const domains = sortedSkills
        .filter(s => s.category === "domain")
        .slice(0, 3)
        .map(s => s.skill);
    const roleFamily = roleResolution.roleFamily || "business";
    const phaseTemplate = EMPLOYER_PHASE_TEMPLATES[roleFamily] || { phases: DEFAULT_EMPLOYER_PHASES };
    const totalBaseMins = phaseTemplate.phases.reduce((sum, p) => sum + p.baseMins, 0);
    const scaleFactor = TARGET_INTERVIEW_DURATION / totalBaseMins;
    const phases = phaseTemplate.phases.map((p) => {
        const scaledMins = Math.max(1, Math.round(p.baseMins * scaleFactor));
        const focusAreas = [];
        if (p.category === "technical" || p.category === "case_study") {
            focusAreas.push(...primarySkills.slice(0, 3));
        }
        else if (p.category === "behavioral") {
            focusAreas.push("Communication", "Collaboration", "Problem-solving");
        }
        return {
            name: p.name,
            mins: scaledMins,
            category: p.category,
            description: p.description,
            focusAreas,
        };
    });
    const adjustedTotalMins = phases.reduce((sum, p) => sum + p.mins, 0);
    if (adjustedTotalMins !== TARGET_INTERVIEW_DURATION) {
        const diff = TARGET_INTERVIEW_DURATION - adjustedTotalMins;
        const mainPhaseIndex = phases.findIndex(p => p.category === "technical" || p.category === "case_study");
        if (mainPhaseIndex >= 0) {
            phases[mainPhaseIndex].mins = Math.max(3, phases[mainPhaseIndex].mins + diff);
        }
    }
    const focusAreas = [
        ...(roleResolution.primarySkillDimensions || []).slice(0, 2),
        ...primarySkills.slice(0, 2),
    ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);
    let interviewStyle = "Standard Assessment";
    if (roleResolution.roleFamily === "tech") {
        interviewStyle = "Technical Interview";
    }
    else if (roleResolution.roleFamily === "product") {
        interviewStyle = "Product Thinking Interview";
    }
    else if (roleResolution.roleFamily === "data") {
        interviewStyle = "Analytical Interview";
    }
    else if (roleResolution.roleFamily === "sales") {
        interviewStyle = "Sales Assessment";
    }
    return {
        roleArchetype: {
            id: roleResolution.roleArchetypeId,
            name: roleResolution.roleArchetypeName,
            family: roleResolution.roleFamily,
        },
        companyArchetype: {
            type: companyResolution.archetype,
            confidence: companyResolution.confidence,
        },
        phases,
        totalMins: phases.reduce((sum, p) => sum + p.mins, 0),
        extractedSkills: sortedSkills,
        skillSummary: {
            primarySkills,
            secondarySkills,
            domains,
        },
        focusAreas,
        interviewStyle,
    };
}
