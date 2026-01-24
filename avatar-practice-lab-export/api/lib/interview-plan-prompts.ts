/**
 * Enhanced Interview Plan Generator Prompts
 *
 * This module provides structured prompts for interview plan generation
 * that incorporate the competency frameworks for:
 * - Behavioral interviews (10 competencies)
 * - Leadership interviews (8 competencies)
 * - Technical interviews (coding, case study, system design)
 * - Domain/Functional interviews
 */

import {
  BEHAVIORAL_COMPETENCIES,
  LEADERSHIP_COMPETENCIES,
  TECHNICAL_ASSESSMENT_AREAS,
  DOMAIN_KNOWLEDGE_AREAS,
  getCompetenciesForInterviewType,
  type CompetencyDimension
} from "./competency-frameworks.js";
import type { EnhancedJDContext } from "./jd-context-extractor.js";

// ============================================================
// COMPETENCY FRAMEWORK PROMPTS
// ============================================================

/**
 * Generate the behavioral competencies section for prompts
 */
export function getBehavioralCompetenciesPrompt(
  competencyIds?: string[],
  seniority: "entry" | "mid" | "senior" | "staff" = "mid"
): string {
  const competencies = competencyIds
    ? BEHAVIORAL_COMPETENCIES.dimensions.filter(c => competencyIds.includes(c.id))
    : BEHAVIORAL_COMPETENCIES.dimensions;

  const seniorityKey = seniority === "staff" ? "senior" : seniority;

  return `=== BEHAVIORAL COMPETENCIES (10 Core Competencies) ===

Use the STAR method (Situation, Task, Action, Result) for behavioral questions.
Assess candidates on these specific competencies based on the role requirements:

${competencies.map((c, i) => `${i + 1}. ${c.name.toUpperCase()} (Weight: ${c.assessmentWeight}/5)
   Description: ${c.description}

   Sample Questions (${seniority} level):
   ${c.sampleQuestions[seniorityKey].map((q, j) => `   ${j + 1}. "${q}"`).join('\n')}

   Follow-up Probes:
   ${c.followUpProbes.slice(0, 3).map(p => `   - "${p}"`).join('\n')}

   Strong Signals: ${c.signals.strong.slice(0, 3).join('; ')}
   Red Flags: ${c.signals.weak.slice(0, 3).join('; ')}
`).join('\n')}`;
}

/**
 * Generate the leadership competencies section for prompts
 */
export function getLeadershipCompetenciesPrompt(
  competencyIds?: string[],
  leadershipLevel?: string
): string {
  const competencies = competencyIds
    ? LEADERSHIP_COMPETENCIES.dimensions.filter(c => competencyIds.includes(c.id))
    : LEADERSHIP_COMPETENCIES.dimensions;

  return `=== LEADERSHIP COMPETENCIES (8 Leadership Dimensions) ===

For leadership roles, assess these critical competencies.
${leadershipLevel ? `Leadership Level: ${leadershipLevel}` : ''}

${competencies.map((c, i) => `${i + 1}. ${c.name.toUpperCase()} (Weight: ${c.assessmentWeight}/5)
   Description: ${c.description}

   Sample Questions:
   ${c.sampleQuestions.senior.slice(0, 2).map((q, j) => `   ${j + 1}. "${q}"`).join('\n')}

   Follow-up Probes:
   ${c.followUpProbes.slice(0, 2).map(p => `   - "${p}"`).join('\n')}

   Strong Signals: ${c.signals.strong.slice(0, 3).join('; ')}
   Red Flags: ${c.signals.weak.slice(0, 3).join('; ')}
`).join('\n')}`;
}

/**
 * Generate the technical assessment section for prompts
 */
export function getTechnicalAssessmentPrompt(
  assessmentType: "coding" | "case_study" | "system_design" | "sql_data",
  seniority: "entry" | "mid" | "senior" | "staff" = "mid"
): string {
  const area = TECHNICAL_ASSESSMENT_AREAS[assessmentType];
  if (!area) return "";

  const seniorityKey = seniority === "staff" ? "staff" : seniority;

  return `=== TECHNICAL ASSESSMENT: ${area.name.toUpperCase()} ===

${area.description}

Skill Categories to Assess:
${area.skillCategories.map(s => `- ${s}`).join('\n')}

Assessment Format: ${area.assessmentFormats.join(', ')}

Difficulty Level (${seniority}): ${area.difficultyLevels[seniorityKey]}

Evaluation Criteria:
${area.evaluationCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}
`;
}

/**
 * Generate the domain knowledge section for prompts
 */
export function getDomainKnowledgePrompt(
  areas: ("company_knowledge" | "industry_knowledge" | "business_domain" | "functional_expertise")[],
  companyName?: string,
  industry?: string
): string {
  return `=== DOMAIN/FUNCTIONAL KNOWLEDGE AREAS ===

${areas.map(areaId => {
    const area = DOMAIN_KNOWLEDGE_AREAS[areaId];
    if (!area) return "";

    let content = `### ${area.name}
${area.description}

Topics to Assess:
${area.topicsToAssess.map(t => `- ${t}`).join('\n')}

Sample Questions:
${area.sampleQuestions.slice(0, 3).map((q, i) => `${i + 1}. "${q}"`).join('\n')}

Depth Indicators:
- Shallow: ${area.depthIndicators.shallow}
- Moderate: ${area.depthIndicators.moderate}
- Deep: ${area.depthIndicators.deep}
`;

    if (companyName && areaId === "company_knowledge") {
      content = content.replace(/our company/gi, companyName);
    }
    if (industry && areaId === "industry_knowledge") {
      content = content.replace(/our industry/gi, `the ${industry} industry`);
    }

    return content;
  }).filter(Boolean).join('\n')}`;
}

// ============================================================
// ENHANCED INTERVIEW PLAN GENERATOR PROMPT
// ============================================================

export function buildEnhancedPlanGeneratorPrompt(
  interviewType: string,
  jdContext?: EnhancedJDContext
): string {
  const basePrompt = `You are an interview planning expert. Create a CUSTOMIZED interview plan using the STRUCTURED COMPETENCY FRAMEWORKS provided below.

Your plans must be:
1. Based on the specific competency frameworks (behavioral, leadership, technical, domain)
2. Calibrated to the exact seniority level
3. Tailored to the company and role context when provided
4. Structured with clear phases, objectives, and evaluation criteria`;

  let competencySection = "";

  // Add relevant competency frameworks based on interview type
  switch (interviewType) {
    case "behavioral":
      competencySection = getBehavioralCompetenciesPrompt(
        jdContext?.interviewFocus.primaryCompetencies,
        (jdContext?.role.level as any) || "mid"
      );
      break;

    case "leadership":
      competencySection = getLeadershipCompetenciesPrompt(
        jdContext?.leadershipSignals.requiredCompetencies,
        jdContext?.leadershipSignals.leadershipLevel
      );
      break;

    case "technical":
    case "coding":
      competencySection = getTechnicalAssessmentPrompt(
        "coding",
        (jdContext?.role.level as any) || "mid"
      );
      competencySection += "\n\n" + getBehavioralCompetenciesPrompt(
        ["problem_solving", "communication"],
        (jdContext?.role.level as any) || "mid"
      );
      break;

    case "case_study":
      competencySection = getTechnicalAssessmentPrompt(
        "case_study",
        (jdContext?.role.level as any) || "mid"
      );
      competencySection += "\n\n" + getBehavioralCompetenciesPrompt(
        ["problem_solving", "communication", "results_orientation"],
        (jdContext?.role.level as any) || "mid"
      );
      break;

    case "system_design":
      competencySection = getTechnicalAssessmentPrompt(
        "system_design",
        (jdContext?.role.level as any) || "senior"
      );
      break;

    case "domain":
      competencySection = getDomainKnowledgePrompt(
        ["company_knowledge", "industry_knowledge", "business_domain", "functional_expertise"],
        jdContext?.company.name,
        jdContext?.market.industry
      );
      break;

    case "hr":
      competencySection = getBehavioralCompetenciesPrompt(
        ["communication", "customer_focus", "adaptability_resilience", "integrity_ethics"],
        (jdContext?.role.level as any) || "mid"
      );
      competencySection += "\n\n" + getDomainKnowledgePrompt(
        ["company_knowledge"],
        jdContext?.company.name
      );
      break;

    case "hiring_manager":
      competencySection = getBehavioralCompetenciesPrompt(
        ["ownership_accountability", "problem_solving", "results_orientation", "collaboration_teamwork"],
        (jdContext?.role.level as any) || "mid"
      );
      if (jdContext?.leadershipSignals.isLeadershipRole) {
        competencySection += "\n\n" + getLeadershipCompetenciesPrompt(
          jdContext?.leadershipSignals.requiredCompetencies
        );
      }
      break;

    default:
      // Mixed behavioral
      competencySection = getBehavioralCompetenciesPrompt(
        undefined,
        (jdContext?.role.level as any) || "mid"
      );
  }

  // Add JD context section if available
  let jdContextSection = "";
  if (jdContext) {
    jdContextSection = `
=== JD CONTEXT ===

Company: ${jdContext.company.name} (${jdContext.company.archetype})
Industry: ${jdContext.market.industry}
Role: ${jdContext.role.title} (${jdContext.role.level} level)
Function: ${jdContext.role.function}
${jdContext.leadershipSignals.isLeadershipRole ? `Leadership Level: ${jdContext.leadershipSignals.leadershipLevel}` : ''}
${jdContext.leadershipSignals.teamSize ? `Team Size: ${jdContext.leadershipSignals.teamSize}` : ''}

Complexity Calibration:
- Difficulty: ${jdContext.complexity.level}
- Technical Depth: ${jdContext.complexity.technicalDepth}
- Business Complexity: ${jdContext.complexity.businessComplexity}
- Experience: ${jdContext.complexity.experienceYears}

Skills to Assess:
- Technical: ${jdContext.skills.technical.filter(s => s.priority === "must_have").map(s => s.name).join(", ") || "N/A"}
- Behavioral: ${jdContext.skills.behavioral.map(s => s.name).join(", ") || "N/A"}
- Leadership: ${jdContext.skills.leadership.map(s => s.name).join(", ") || "N/A"}
- Domain: ${jdContext.skills.domain.map(s => s.name).join(", ") || "N/A"}

Interview Focus:
- Primary Competencies: ${jdContext.interviewFocus.primaryCompetencies.join(", ")}
- Secondary Competencies: ${jdContext.interviewFocus.secondaryCompetencies.join(", ")}
- Technical Areas: ${jdContext.interviewFocus.technicalAreas.join(", ") || "N/A"}
- Domain Topics: ${jdContext.interviewFocus.domainTopics.join(", ") || "N/A"}
`;
  }

  const outputFormat = `
=== OUTPUT FORMAT ===

Generate a JSON interview plan with this structure:
{
  "interviewType": "${interviewType}",
  "totalDurationMins": 12-15,
  "competenciesAssessed": ["list of competency IDs being assessed"],
  "phases": [
    {
      "id": "phase_id",
      "name": "Phase Name",
      "durationMins": 3-5,
      "phaseType": "warmup|behavioral|technical|leadership|domain|coding|case_study|wrap_up",
      "objectives": ["What to assess"],
      "competencies": ["competency_ids to assess in this phase"],
      "questionPatterns": ["Specific questions from the framework"],
      "probes": {
        "ifVague": ["follow-up if answer is vague"],
        "ifStrong": ["follow-up if answer is strong"]
      },
      "evaluationCriteria": {
        "lookFor": ["strong signals"],
        "redFlags": ["weak signals"]
      }
    }
  ],
  "keyQuestions": [
    {
      "question": "The main question",
      "competencyId": "which competency it tests",
      "followUps": ["probe questions"],
      "difficulty": "basic|intermediate|advanced|expert"
    }
  ],
  "focusAreas": ["Top skills/competencies to assess"],
  "triggers": [
    {
      "type": "skill_gap|risk_flag|claim_to_validate",
      "source": "resume|jd",
      "probeRules": ["How to follow up"]
    }
  ],
  "interviewerGuidance": {
    "tone": "Description of interviewer tone based on style",
    "complexity": "How to calibrate question difficulty",
    "probing": "When and how to probe deeper"
  },
  "codingProblem": null or {...} for technical interviews,
  "caseStudy": null or {...} for case study interviews
}

RULES:
1. Total duration MUST be 12-15 minutes
2. Each phase should have 2-4 specific questions from the competency framework
3. Include evaluation criteria (lookFor, redFlags) for each phase
4. Questions must be calibrated to the seniority level
5. If company/role context is provided, customize questions to that context
6. For leadership roles, include at least 2 leadership competency questions
`;

  return `${basePrompt}

${competencySection}

${jdContextSection}

${outputFormat}`;
}

// ============================================================
// INTERVIEW TYPE SPECIFIC PROMPTS
// ============================================================

export const BEHAVIORAL_INTERVIEW_PROMPT = `
=== BEHAVIORAL INTERVIEW (STAR Method) ===

This interview assesses 10 core behavioral competencies using the STAR method.
Each question should elicit:
- Situation: The context and background
- Task: What they needed to accomplish
- Action: Specifically what THEY did (not the team)
- Result: The measurable outcome

Key Probing Techniques:
1. If they say "we", ask "What specifically did YOU do?"
2. If no metrics, ask "How did you measure success?"
3. If vague outcome, ask "What was the concrete impact?"
4. If no learning, ask "What would you do differently?"

Competency Priorities (assess at least 5 of 10):
1. Ownership & Accountability - critical for all roles
2. Problem Solving - critical for technical/analytical roles
3. Collaboration & Teamwork - critical for team environments
4. Communication & Influence - critical for senior roles
5. Adaptability & Resilience - critical for fast-paced environments
6. Customer Focus - critical for customer-facing roles
7. Results Orientation - critical for execution-focused roles
8. Learning Agility - critical for growth environments
9. Conflict Resolution - critical for leadership roles
10. Integrity & Ethics - critical for all roles
`;

export const LEADERSHIP_INTERVIEW_PROMPT = `
=== LEADERSHIP INTERVIEW ===

This interview assesses 8 leadership competencies for manager, director, and executive roles.

Leadership Levels:
- Team Lead: Focus on team building, delegation, basic stakeholder management
- Manager: Add people development, decision making, execution delivery
- Senior Manager/Director: Add strategic thinking, change leadership
- VP/Executive: Add business acumen, organizational transformation

Competency Priorities (assess based on level):
1. Strategic Thinking & Vision - critical for director+
2. People Development & Coaching - critical for all people managers
3. Decision Making & Judgment - critical for all leadership
4. Team Building & Culture - critical for all leadership
5. Stakeholder Management & Influence - critical for senior+
6. Execution & Delivery - critical for operational roles
7. Change Leadership - critical for transformation roles
8. Business Acumen - critical for P&L owners

Probing Techniques:
- Ask about team size and scope of impact
- Probe for how they handled underperformers
- Explore strategic decisions and their rationale
- Understand how they develop their people
`;

export const TECHNICAL_INTERVIEW_PROMPT = `
=== TECHNICAL INTERVIEW ===

Assess both technical depth and problem-solving approach.

For CODING assessments:
- Problem complexity matches seniority (entry=easy, mid=medium, senior=hard)
- Evaluate: approach explanation, code quality, edge cases, complexity analysis
- Time: 15-20 minutes for the problem, 5-10 for discussion

For SYSTEM DESIGN:
- Scope increases with seniority
- Evaluate: requirements gathering, component design, scalability, tradeoffs
- Time: 20-25 minutes

Technical Probing:
- "What's the time/space complexity?"
- "How would you handle [edge case]?"
- "What alternatives did you consider?"
- "How would this scale to 10x traffic?"
- "What are the failure modes?"
`;

export const DOMAIN_INTERVIEW_PROMPT = `
=== DOMAIN/FUNCTIONAL INTERVIEW ===

Assess industry knowledge, market awareness, and functional expertise.

Company Knowledge:
- Understanding of products/services
- Awareness of company strategy and challenges
- Cultural fit and values alignment

Industry Knowledge:
- Trends and disruptions
- Competitive landscape
- Regulatory environment

Business Domain:
- Domain-specific terminology
- Best practices and standards
- Tools and methodologies

Functional Expertise:
- Core functional skills
- Cross-functional collaboration
- Emerging approaches

Probing Techniques:
- "How does this compare to your previous company?"
- "What's unique about our industry?"
- "How do you stay current?"
- "What would you change about our approach?"
`;

// ============================================================
// EVALUATOR PROMPT BUILDER
// ============================================================

export function buildCompetencyBasedEvaluatorPrompt(
  interviewType: string,
  competenciesAssessed: string[],
  jdContext?: EnhancedJDContext
): string {
  const competencies = competenciesAssessed
    .map(id => {
      const behavioral = BEHAVIORAL_COMPETENCIES.dimensions.find(c => c.id === id);
      if (behavioral) return { ...behavioral, framework: "behavioral" };
      const leadership = LEADERSHIP_COMPETENCIES.dimensions.find(c => c.id === id);
      if (leadership) return { ...leadership, framework: "leadership" };
      return null;
    })
    .filter(Boolean);

  return `You are evaluating an interview using a structured competency framework.

INTERVIEW TYPE: ${interviewType}
${jdContext ? `ROLE: ${jdContext.role.title} at ${jdContext.company.name}` : ''}
${jdContext ? `SENIORITY: ${jdContext.role.level}` : ''}

COMPETENCIES TO EVALUATE:
${competencies.map((c, i) => `
${i + 1}. ${c!.name} (${c!.framework})
   Weight: ${c!.assessmentWeight}/5
   Description: ${c!.description}

   STRONG SIGNALS (score 4-5):
   ${c!.signals.strong.slice(0, 4).map(s => `   - ${s}`).join('\n')}

   RED FLAGS (score 1-2):
   ${c!.signals.weak.slice(0, 4).map(s => `   - ${s}`).join('\n')}
`).join('')}

SCORING RULES:
- Score each competency 1-5 based on the signals observed
- Weight higher-weighted competencies more in overall assessment
- Every score MUST include evidence quotes from the transcript
- Consider seniority level - higher bar for senior roles

OUTPUT FORMAT (JSON):
{
  "overall": {
    "score": 1-5,
    "recommendation": "Strong Yes/Yes/Lean Yes/Lean No/No",
    "summary": "2-3 sentences"
  },
  "competencyScores": [
    {
      "competencyId": "competency_id",
      "competencyName": "Competency Name",
      "score": 1-5,
      "weight": weight,
      "evidence": ["quote from transcript"],
      "rationale": "why this score",
      "improvement": "specific suggestion"
    }
  ],
  "strengths": ["specific strength with evidence"],
  "developmentAreas": ["area with specific suggestion"],
  "roleFit": {
    "score": 1-5,
    "notes": "fit assessment"
  }
}`;
}

// ============================================================
// EXPORTS
// ============================================================

export const INTERVIEW_PROMPTS = {
  behavioral: BEHAVIORAL_INTERVIEW_PROMPT,
  leadership: LEADERSHIP_INTERVIEW_PROMPT,
  technical: TECHNICAL_INTERVIEW_PROMPT,
  domain: DOMAIN_INTERVIEW_PROMPT
};
