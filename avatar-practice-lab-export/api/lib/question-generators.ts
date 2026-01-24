/**
 * Specialized Question Generators
 *
 * This module provides question generation for each interview type:
 * 1. Behavioral questions (10 competencies)
 * 2. Leadership questions (8 competencies)
 * 3. Technical questions (coding, case study, system design)
 * 4. Domain/Functional questions (company, market, industry)
 */

import { getOpenAI } from "../utils/openai-client.js";
import {
  BEHAVIORAL_COMPETENCIES,
  LEADERSHIP_COMPETENCIES,
  TECHNICAL_ASSESSMENT_AREAS,
  DOMAIN_KNOWLEDGE_AREAS,
  getCompetencyById,
  getQuestionsForCompetency,
  type CompetencyDimension,
  type TechnicalAssessmentArea,
  type DomainKnowledgeArea
} from "./competency-frameworks.js";
import type { EnhancedJDContext, CategorizedSkill } from "./jd-context-extractor.js";

// ============================================================
// TYPES
// ============================================================

export interface GeneratedQuestion {
  id: string;
  question: string;
  competencyId?: string;
  competencyName?: string;
  category: "behavioral" | "leadership" | "technical" | "domain" | "coding" | "case_study";
  interviewType: string;
  difficulty: "basic" | "intermediate" | "advanced" | "expert";
  followUps: string[];
  probes: {
    ifVague: string[];
    ifStrong: string[];
  };
  evaluationCriteria: {
    lookFor: string[];
    redFlags: string[];
  };
  skillsTested: string[];
  timeEstimate: number; // in seconds
  context?: string; // Company/role-specific context added to the question
}

export interface QuestionGenerationRequest {
  interviewType: string;
  seniority: "entry" | "mid" | "senior" | "staff";
  jdContext?: EnhancedJDContext;
  companyName?: string;
  roleTitle?: string;
  specificCompetencies?: string[];
  count?: number;
}

export interface QuestionPlan {
  interviewType: string;
  totalDuration: number;
  phases: QuestionPhase[];
  questions: GeneratedQuestion[];
  coverageAnalysis: {
    competenciesCovered: string[];
    skillsCovered: string[];
    gapsIdentified: string[];
  };
}

export interface QuestionPhase {
  name: string;
  duration: number;
  questions: GeneratedQuestion[];
  objectives: string[];
}

// ============================================================
// BEHAVIORAL QUESTION GENERATOR
// ============================================================

/**
 * Generate behavioral questions based on the 10 competency framework
 */
export async function generateBehavioralQuestions(
  request: QuestionGenerationRequest
): Promise<GeneratedQuestion[]> {
  const { seniority, jdContext, companyName, roleTitle, specificCompetencies, count = 5 } = request;

  // Determine which competencies to use
  let competenciesToCover: CompetencyDimension[];

  if (specificCompetencies && specificCompetencies.length > 0) {
    competenciesToCover = specificCompetencies
      .map(id => BEHAVIORAL_COMPETENCIES.dimensions.find(c => c.id === id))
      .filter((c): c is CompetencyDimension => c !== undefined);
  } else if (jdContext?.interviewFocus) {
    // Use JD-derived competencies
    const ids = [
      ...jdContext.interviewFocus.primaryCompetencies,
      ...jdContext.interviewFocus.secondaryCompetencies
    ];
    competenciesToCover = ids
      .map(id => BEHAVIORAL_COMPETENCIES.dimensions.find(c => c.id === id))
      .filter((c): c is CompetencyDimension => c !== undefined);
  } else {
    // Default to top-weighted competencies
    competenciesToCover = [...BEHAVIORAL_COMPETENCIES.dimensions]
      .sort((a, b) => b.assessmentWeight - a.assessmentWeight)
      .slice(0, count);
  }

  // Limit to requested count
  competenciesToCover = competenciesToCover.slice(0, count);

  const questions: GeneratedQuestion[] = [];
  const seniorityKey = seniority === "staff" ? "senior" : seniority;

  for (const competency of competenciesToCover) {
    // Get sample questions from framework
    const sampleQuestions = getQuestionsForCompetency(competency, seniorityKey);

    // Select a question and customize it
    const baseQuestion = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];

    // Customize question with company/role context
    let customizedQuestion = baseQuestion;
    if (companyName || roleTitle) {
      customizedQuestion = await customizeQuestionWithContext(
        baseQuestion,
        competency,
        companyName,
        roleTitle,
        jdContext
      );
    }

    questions.push({
      id: `behavioral-${competency.id}-${Date.now()}`,
      question: customizedQuestion,
      competencyId: competency.id,
      competencyName: competency.name,
      category: "behavioral",
      interviewType: "behavioral",
      difficulty: mapSeniorityToDifficulty(seniority),
      followUps: competency.followUpProbes.slice(0, 3),
      probes: {
        ifVague: [
          "Can you be more specific about what YOU personally did?",
          "What was the measurable outcome?",
          ...competency.followUpProbes.slice(0, 2)
        ],
        ifStrong: [
          "What did you learn from this experience?",
          "How would you handle this differently now?",
          "How has this shaped your approach since?"
        ]
      },
      evaluationCriteria: {
        lookFor: competency.signals.strong,
        redFlags: competency.signals.weak
      },
      skillsTested: [competency.name],
      timeEstimate: 180, // 3 minutes average
      context: jdContext ? `For ${roleTitle || "this role"} at ${companyName || "the company"}` : undefined
    });
  }

  return questions;
}

// ============================================================
// LEADERSHIP QUESTION GENERATOR
// ============================================================

/**
 * Generate leadership questions based on the 8 leadership competency framework
 */
export async function generateLeadershipQuestions(
  request: QuestionGenerationRequest
): Promise<GeneratedQuestion[]> {
  const { seniority, jdContext, companyName, roleTitle, specificCompetencies, count = 5 } = request;

  // For leadership, we need senior level at minimum
  const effectiveSeniority = ["senior", "staff"].includes(seniority) ? seniority : "senior";

  // Determine which competencies to use
  let competenciesToCover: CompetencyDimension[];

  if (specificCompetencies && specificCompetencies.length > 0) {
    competenciesToCover = specificCompetencies
      .map(id => LEADERSHIP_COMPETENCIES.dimensions.find(c => c.id === id))
      .filter((c): c is CompetencyDimension => c !== undefined);
  } else if (jdContext?.leadershipSignals.requiredCompetencies.length) {
    // Use JD-derived leadership competencies
    competenciesToCover = jdContext.leadershipSignals.requiredCompetencies
      .map(id => LEADERSHIP_COMPETENCIES.dimensions.find(c => c.id === id))
      .filter((c): c is CompetencyDimension => c !== undefined);
  } else {
    // Default to all leadership competencies, prioritized by weight
    competenciesToCover = [...LEADERSHIP_COMPETENCIES.dimensions]
      .sort((a, b) => b.assessmentWeight - a.assessmentWeight)
      .slice(0, count);
  }

  // Limit to requested count
  competenciesToCover = competenciesToCover.slice(0, count);

  const questions: GeneratedQuestion[] = [];

  for (const competency of competenciesToCover) {
    const sampleQuestions = competency.sampleQuestions.senior;
    const baseQuestion = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];

    // Customize with leadership context
    let customizedQuestion = baseQuestion;
    if (jdContext?.leadershipSignals) {
      customizedQuestion = await customizeLeadershipQuestion(
        baseQuestion,
        competency,
        jdContext.leadershipSignals,
        companyName,
        roleTitle
      );
    }

    questions.push({
      id: `leadership-${competency.id}-${Date.now()}`,
      question: customizedQuestion,
      competencyId: competency.id,
      competencyName: competency.name,
      category: "leadership",
      interviewType: "leadership",
      difficulty: effectiveSeniority === "staff" ? "expert" : "advanced",
      followUps: competency.followUpProbes.slice(0, 3),
      probes: {
        ifVague: [
          "How did you measure success?",
          "What was the impact on the team/organization?",
          ...competency.followUpProbes.slice(0, 2)
        ],
        ifStrong: [
          "How did this shape your leadership philosophy?",
          "What would you do differently with more resources?",
          "How have you applied this learning since?"
        ]
      },
      evaluationCriteria: {
        lookFor: competency.signals.strong,
        redFlags: competency.signals.weak
      },
      skillsTested: [competency.name, "Leadership"],
      timeEstimate: 240, // 4 minutes average for leadership questions
      context: jdContext?.leadershipSignals.teamSize ?
        `For a ${jdContext.leadershipSignals.leadershipLevel} role managing ${jdContext.leadershipSignals.teamSize}` : undefined
    });
  }

  return questions;
}

// ============================================================
// TECHNICAL QUESTION GENERATOR
// ============================================================

/**
 * Generate technical questions based on skills and technical areas
 */
export async function generateTechnicalQuestions(
  request: QuestionGenerationRequest
): Promise<GeneratedQuestion[]> {
  const { seniority, jdContext, companyName, roleTitle, count = 5 } = request;

  const questions: GeneratedQuestion[] = [];

  // Get technical skills from JD context
  const technicalSkills = jdContext?.skills.technical || [];
  const mustHaveSkills = technicalSkills.filter(s => s.priority === "must_have");
  const importantSkills = technicalSkills.filter(s => s.priority === "important");

  // Combine and limit
  const skillsToAssess = [...mustHaveSkills, ...importantSkills].slice(0, count);

  if (skillsToAssess.length === 0) {
    // Fallback to generic technical questions
    return await generateGenericTechnicalQuestions(request);
  }

  for (const skill of skillsToAssess) {
    const question = await generateSkillBasedTechnicalQuestion(
      skill,
      seniority,
      companyName,
      roleTitle,
      jdContext
    );
    questions.push(question);
  }

  return questions;
}

async function generateSkillBasedTechnicalQuestion(
  skill: CategorizedSkill,
  seniority: string,
  companyName?: string,
  roleTitle?: string,
  jdContext?: EnhancedJDContext
): Promise<GeneratedQuestion> {
  const openai = getOpenAI();

  const difficultyLevel = mapSeniorityToDifficulty(seniority as any);
  const complexityGuidance = getComplexityGuidance(difficultyLevel);

  const prompt = `Generate a technical interview question for the skill: "${skill.name}"

Role: ${roleTitle || "Software Engineer"}
Company: ${companyName || "a technology company"}
Seniority: ${seniority}
Skill Proficiency Required: ${skill.proficiency}

${complexityGuidance}

Generate a JSON object with:
{
  "question": "The main interview question (calibrated to ${difficultyLevel} level)",
  "followUps": ["2-3 follow-up questions to probe deeper"],
  "ifVagueProbes": ["2 probes if the answer is vague"],
  "ifStrongProbes": ["2 probes for strong answers to explore further"],
  "lookFor": ["3-4 signals of a strong answer"],
  "redFlags": ["2-3 signals of a weak answer"],
  "timeEstimate": number (in seconds, typically 120-300)
}

Make the question practical and relevant to real-world scenarios at ${companyName || "a tech company"}.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a senior technical interviewer creating ${difficultyLevel}-level questions. Your questions should be specific, practical, and appropriately challenging for ${seniority}-level candidates.`
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      id: `technical-${skill.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
      question: result.question || `Tell me about your experience with ${skill.name}.`,
      competencyId: skill.competencyId,
      category: "technical",
      interviewType: skill.interviewType,
      difficulty: difficultyLevel,
      followUps: result.followUps || [],
      probes: {
        ifVague: result.ifVagueProbes || ["Can you give me a specific example?", "What challenges did you face?"],
        ifStrong: result.ifStrongProbes || ["How would you optimize this further?", "What alternatives did you consider?"]
      },
      evaluationCriteria: {
        lookFor: result.lookFor || ["Clear understanding", "Practical experience", "Problem-solving approach"],
        redFlags: result.redFlags || ["Vague answers", "No concrete examples", "Misunderstanding of concepts"]
      },
      skillsTested: [skill.name],
      timeEstimate: result.timeEstimate || 180,
      context: `For ${roleTitle || "this role"} at ${companyName || "the company"}`
    };
  } catch (error) {
    console.error("Error generating technical question:", error);
    // Return a fallback question
    return {
      id: `technical-${skill.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
      question: `Tell me about your experience with ${skill.name}. What's a challenging problem you solved using it?`,
      category: "technical",
      interviewType: skill.interviewType,
      difficulty: difficultyLevel,
      followUps: [
        "What was the most challenging aspect?",
        "How did you ensure quality?",
        "What would you do differently?"
      ],
      probes: {
        ifVague: ["Can you give me a specific example?", "What was your specific contribution?"],
        ifStrong: ["How would you scale this solution?", "What edge cases did you consider?"]
      },
      evaluationCriteria: {
        lookFor: ["Clear understanding", "Practical experience", "Problem-solving approach"],
        redFlags: ["Vague answers", "No concrete examples"]
      },
      skillsTested: [skill.name],
      timeEstimate: 180
    };
  }
}

async function generateGenericTechnicalQuestions(
  request: QuestionGenerationRequest
): Promise<GeneratedQuestion[]> {
  const { seniority, count = 5 } = request;
  const difficulty = mapSeniorityToDifficulty(seniority);

  const genericQuestions: GeneratedQuestion[] = [
    {
      id: `technical-problem-solving-${Date.now()}`,
      question: "Walk me through your approach to debugging a complex production issue. Give me a specific example.",
      category: "technical",
      interviewType: "technical",
      difficulty,
      followUps: [
        "How did you identify the root cause?",
        "What tools did you use?",
        "How did you prevent it from recurring?"
      ],
      probes: {
        ifVague: ["Can you walk me through the specific steps?", "What data did you look at?"],
        ifStrong: ["How did you balance speed vs thoroughness?", "How did you communicate status to stakeholders?"]
      },
      evaluationCriteria: {
        lookFor: ["Systematic approach", "Use of logging/monitoring", "Root cause analysis"],
        redFlags: ["No clear process", "Guessing without data", "No follow-up actions"]
      },
      skillsTested: ["Problem Solving", "Debugging", "Communication"],
      timeEstimate: 240
    },
    {
      id: `technical-architecture-${Date.now()}`,
      question: "Describe a system or feature you designed from scratch. What were the key decisions you made?",
      category: "technical",
      interviewType: "technical",
      difficulty,
      followUps: [
        "What tradeoffs did you consider?",
        "How would you scale it?",
        "What would you change knowing what you know now?"
      ],
      probes: {
        ifVague: ["Can you draw out the architecture?", "What were the specific components?"],
        ifStrong: ["How did you handle failure scenarios?", "What were the performance characteristics?"]
      },
      evaluationCriteria: {
        lookFor: ["Clear reasoning", "Tradeoff awareness", "Scalability thinking"],
        redFlags: ["No consideration of alternatives", "Over-engineering", "Missing key concerns"]
      },
      skillsTested: ["System Design", "Architecture", "Technical Decision Making"],
      timeEstimate: 300
    },
    {
      id: `technical-code-quality-${Date.now()}`,
      question: "How do you ensure code quality in your work? Tell me about your testing and review practices.",
      category: "technical",
      interviewType: "technical",
      difficulty,
      followUps: [
        "How do you balance testing coverage with development speed?",
        "How do you handle code reviews?",
        "What's your approach to refactoring legacy code?"
      ],
      probes: {
        ifVague: ["What types of tests do you write?", "Can you give me a specific example?"],
        ifStrong: ["How do you measure code quality?", "How do you foster quality culture in a team?"]
      },
      evaluationCriteria: {
        lookFor: ["Testing discipline", "Code review engagement", "Continuous improvement"],
        redFlags: ["No testing", "Defensive about feedback", "No quality standards"]
      },
      skillsTested: ["Code Quality", "Testing", "Best Practices"],
      timeEstimate: 180
    }
  ];

  return genericQuestions.slice(0, count);
}

// ============================================================
// DOMAIN/FUNCTIONAL QUESTION GENERATOR
// ============================================================

/**
 * Generate domain/functional questions based on company, market, and industry context
 */
export async function generateDomainQuestions(
  request: QuestionGenerationRequest
): Promise<GeneratedQuestion[]> {
  const { seniority, jdContext, companyName, roleTitle, count = 5 } = request;

  const questions: GeneratedQuestion[] = [];

  // Company Knowledge Questions
  if (companyName || jdContext?.company.name) {
    questions.push(generateCompanyKnowledgeQuestion(
      companyName || jdContext?.company.name || "",
      jdContext,
      seniority
    ));
  }

  // Industry/Market Questions
  if (jdContext?.market.industry) {
    questions.push(generateIndustryQuestion(jdContext, seniority));
  }

  // Business Domain Questions
  if (jdContext?.company.businessDomain) {
    questions.push(generateBusinessDomainQuestion(jdContext, roleTitle || "", seniority));
  }

  // Functional Expertise Questions
  if (jdContext?.role.function) {
    questions.push(generateFunctionalExpertiseQuestion(jdContext, seniority));
  }

  // Fill remaining with contextual questions
  while (questions.length < count) {
    questions.push(generateGenericDomainQuestion(seniority, companyName, roleTitle));
  }

  return questions.slice(0, count);
}

function generateCompanyKnowledgeQuestion(
  companyName: string,
  jdContext: EnhancedJDContext | undefined,
  seniority: string
): GeneratedQuestion {
  const questions = DOMAIN_KNOWLEDGE_AREAS.company_knowledge.sampleQuestions;
  const baseQuestion = questions[Math.floor(Math.random() * questions.length)];

  let customQuestion = baseQuestion;
  if (companyName) {
    customQuestion = baseQuestion.replace(/our company/gi, companyName);
  }

  return {
    id: `domain-company-${Date.now()}`,
    question: customQuestion,
    category: "domain",
    interviewType: "domain",
    difficulty: mapSeniorityToDifficulty(seniority as any),
    followUps: [
      `What specific challenges do you think ${companyName || "we"} face?`,
      `How does your experience align with ${companyName || "our"} needs?`,
      `What excites you most about joining ${companyName || "us"}?`
    ],
    probes: {
      ifVague: ["Can you be more specific about what you know?", "Have you used our products?"],
      ifStrong: ["How would you approach those challenges?", "What opportunities do you see?"]
    },
    evaluationCriteria: {
      lookFor: DOMAIN_KNOWLEDGE_AREAS.company_knowledge.depthIndicators.deep.split(" "),
      redFlags: [DOMAIN_KNOWLEDGE_AREAS.company_knowledge.depthIndicators.shallow]
    },
    skillsTested: ["Company Research", "Market Awareness", "Role Fit"],
    timeEstimate: 180,
    context: `Assessing knowledge of ${companyName || "the company"}`
  };
}

function generateIndustryQuestion(
  jdContext: EnhancedJDContext,
  seniority: string
): GeneratedQuestion {
  const industry = jdContext.market.industry;
  const questions = DOMAIN_KNOWLEDGE_AREAS.industry_knowledge.sampleQuestions;
  const baseQuestion = questions[Math.floor(Math.random() * questions.length)];

  return {
    id: `domain-industry-${Date.now()}`,
    question: baseQuestion.replace(/our industry/gi, `the ${industry} industry`),
    category: "domain",
    interviewType: "domain",
    difficulty: mapSeniorityToDifficulty(seniority as any),
    followUps: [
      `How do you stay current with ${industry} trends?`,
      `What emerging technologies might disrupt this space?`,
      `How do you see the competitive landscape evolving?`
    ],
    probes: {
      ifVague: ["Can you give specific examples?", "What sources do you follow?"],
      ifStrong: ["How would you apply this knowledge in the role?", "What's your contrarian view?"]
    },
    evaluationCriteria: {
      lookFor: ["Industry awareness", "Trend understanding", "Competitive knowledge"],
      redFlags: ["No industry knowledge", "Outdated information", "Surface-level understanding"]
    },
    skillsTested: ["Industry Knowledge", "Market Awareness", "Strategic Thinking"],
    timeEstimate: 180
  };
}

function generateBusinessDomainQuestion(
  jdContext: EnhancedJDContext,
  roleTitle: string,
  seniority: string
): GeneratedQuestion {
  const domain = jdContext.company.businessDomain;

  return {
    id: `domain-business-${Date.now()}`,
    question: `As a ${roleTitle}, how would you approach understanding the ${domain} domain? What's your experience in this space?`,
    category: "domain",
    interviewType: "domain",
    difficulty: mapSeniorityToDifficulty(seniority as any),
    followUps: [
      "What domain-specific challenges have you solved?",
      "How do you stay current with domain best practices?",
      "What metrics would you track in this domain?"
    ],
    probes: {
      ifVague: ["Can you give a specific example from your experience?", "What tools have you used?"],
      ifStrong: ["What innovations would you bring?", "How would you mentor others in this domain?"]
    },
    evaluationCriteria: {
      lookFor: ["Domain expertise", "Practical experience", "Continuous learning"],
      redFlags: ["No domain experience", "Surface-level knowledge", "Outdated practices"]
    },
    skillsTested: ["Domain Expertise", roleTitle, "Business Acumen"],
    timeEstimate: 180
  };
}

function generateFunctionalExpertiseQuestion(
  jdContext: EnhancedJDContext,
  seniority: string
): GeneratedQuestion {
  const functionArea = jdContext.role.function;
  const questions = DOMAIN_KNOWLEDGE_AREAS.functional_expertise.sampleQuestions;
  const baseQuestion = questions[Math.floor(Math.random() * questions.length)];

  return {
    id: `domain-functional-${Date.now()}`,
    question: baseQuestion.replace(/\[function\]/gi, functionArea),
    category: "domain",
    interviewType: "domain",
    difficulty: mapSeniorityToDifficulty(seniority as any),
    followUps: [
      "What methodologies have been most effective for you?",
      "How do you measure success in your work?",
      "What emerging trends are you excited about?"
    ],
    probes: {
      ifVague: ["Can you walk me through your process?", "What tools do you use daily?"],
      ifStrong: ["How have you evolved your approach over time?", "How do you drive improvement?"]
    },
    evaluationCriteria: {
      lookFor: ["Functional expertise", "Methodology awareness", "Tool proficiency"],
      redFlags: ["No clear methodology", "Outdated tools", "Unable to explain approach"]
    },
    skillsTested: [functionArea, "Methodology", "Best Practices"],
    timeEstimate: 180
  };
}

function generateGenericDomainQuestion(
  seniority: string,
  companyName?: string,
  roleTitle?: string
): GeneratedQuestion {
  return {
    id: `domain-generic-${Date.now()}`,
    question: `Why are you interested in this ${roleTitle || "role"}${companyName ? ` at ${companyName}` : ""}? What specific aspects appeal to you?`,
    category: "domain",
    interviewType: "domain",
    difficulty: mapSeniorityToDifficulty(seniority as any),
    followUps: [
      "What research have you done about this opportunity?",
      "How does this fit into your career goals?",
      "What would success look like for you here?"
    ],
    probes: {
      ifVague: ["What specifically do you know about us?", "Why now?"],
      ifStrong: ["What would you prioritize in your first 90 days?", "What concerns do you have?"]
    },
    evaluationCriteria: {
      lookFor: ["Genuine interest", "Research done", "Career alignment"],
      redFlags: ["Generic answers", "No research", "Unclear motivation"]
    },
    skillsTested: ["Motivation", "Research", "Self-Awareness"],
    timeEstimate: 120
  };
}

// ============================================================
// CODING QUESTION GENERATOR
// ============================================================

/**
 * Generate coding questions calibrated to seniority
 */
export async function generateCodingQuestion(
  request: QuestionGenerationRequest
): Promise<GeneratedQuestion> {
  const { seniority, jdContext, companyName, roleTitle } = request;

  const codingArea = TECHNICAL_ASSESSMENT_AREAS.coding;
  const difficulty = mapSeniorityToDifficulty(seniority);
  const difficultyDescription = codingArea.difficultyLevels[seniority === "staff" ? "staff" : seniority];

  // Get relevant skills to test
  const technicalSkills = jdContext?.skills.technical
    .filter(s => s.interviewType === "coding" || s.interviewType === "technical")
    .map(s => s.name) || [];

  const openai = getOpenAI();

  const prompt = `Generate a coding interview question for:
Role: ${roleTitle || "Software Engineer"}
Company: ${companyName || "a technology company"}
Seniority: ${seniority}
Skills to test: ${technicalSkills.length > 0 ? technicalSkills.join(", ") : "general programming"}

Difficulty level: ${difficulty}
${difficultyDescription}

Generate JSON:
{
  "title": "Problem title",
  "question": "Full problem description with context, inputs, outputs, and constraints",
  "examples": [{"input": "example input", "output": "expected output", "explanation": "why"}],
  "constraints": ["constraint 1", "constraint 2"],
  "hints": ["hint 1 for when stuck"],
  "followUps": ["follow-up questions about complexity, optimization"],
  "lookFor": ["what makes a strong answer"],
  "redFlags": ["what indicates weakness"],
  "timeEstimate": number (in minutes, 15-45),
  "skillsTested": ["skill1", "skill2"]
}

Make it relevant to ${companyName || "a tech company"}'s domain if possible.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a senior interviewer creating ${difficulty}-level coding questions. Questions should be practical, clear, and appropriately challenging.`
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      id: `coding-${Date.now()}`,
      question: result.question || "Implement a solution to the given problem.",
      category: "coding",
      interviewType: "coding",
      difficulty,
      followUps: result.followUps || ["What's the time complexity?", "How would you optimize this?"],
      probes: {
        ifVague: ["Can you explain your approach?", "What data structures are you considering?"],
        ifStrong: ["How would you scale this?", "What edge cases should we consider?"]
      },
      evaluationCriteria: {
        lookFor: result.lookFor || codingArea.evaluationCriteria,
        redFlags: result.redFlags || ["No clear approach", "Ignores edge cases", "Poor code quality"]
      },
      skillsTested: result.skillsTested || technicalSkills.slice(0, 3),
      timeEstimate: (result.timeEstimate || 20) * 60, // Convert to seconds
      context: `${result.title || "Coding Problem"} - ${difficulty} difficulty`
    };
  } catch (error) {
    console.error("Error generating coding question:", error);
    return generateFallbackCodingQuestion(seniority, technicalSkills);
  }
}

function generateFallbackCodingQuestion(seniority: string, skills: string[]): GeneratedQuestion {
  return {
    id: `coding-fallback-${Date.now()}`,
    question: "Given an array of integers, write a function to find the two numbers that add up to a specific target. Return the indices of the two numbers.",
    category: "coding",
    interviewType: "coding",
    difficulty: mapSeniorityToDifficulty(seniority as any),
    followUps: [
      "What's the time complexity of your solution?",
      "How would you optimize this?",
      "What if the array is sorted?"
    ],
    probes: {
      ifVague: ["Can you explain your approach step by step?", "What data structure would help here?"],
      ifStrong: ["How would you handle multiple pairs?", "What about duplicate values?"]
    },
    evaluationCriteria: {
      lookFor: ["Clear problem solving", "Optimal solution", "Code quality", "Edge case handling"],
      redFlags: ["Brute force without optimization", "No consideration of edge cases", "Poor communication"]
    },
    skillsTested: skills.length > 0 ? skills.slice(0, 3) : ["Problem Solving", "Data Structures", "Algorithms"],
    timeEstimate: 1200 // 20 minutes
  };
}

// ============================================================
// CASE STUDY QUESTION GENERATOR
// ============================================================

/**
 * Generate case study questions calibrated to seniority and role
 */
export async function generateCaseStudyQuestion(
  request: QuestionGenerationRequest
): Promise<GeneratedQuestion> {
  const { seniority, jdContext, companyName, roleTitle } = request;

  const caseArea = TECHNICAL_ASSESSMENT_AREAS.case_study;
  const difficulty = mapSeniorityToDifficulty(seniority);
  const difficultyDescription = caseArea.difficultyLevels[seniority === "staff" ? "staff" : seniority];

  const openai = getOpenAI();

  const industry = jdContext?.market.industry || "technology";
  const businessDomain = jdContext?.company.businessDomain || "business";

  const prompt = `Generate a case study interview question for:
Role: ${roleTitle || "Business Analyst"}
Company: ${companyName || "a company"}
Industry: ${industry}
Business Domain: ${businessDomain}
Seniority: ${seniority}

Difficulty level: ${difficulty}
${difficultyDescription}

Generate JSON:
{
  "title": "Case study title",
  "scenario": "Full scenario description (2-3 paragraphs setting up the business context)",
  "question": "The specific question or task for the candidate",
  "materials": [{"title": "Data Point 1", "content": "Relevant data"}],
  "framework": "Suggested framework approach",
  "followUps": ["follow-up questions to probe thinking"],
  "lookFor": ["what makes a strong answer"],
  "redFlags": ["what indicates weakness"],
  "timeEstimate": number (in minutes, 15-30),
  "skillsTested": ["skill1", "skill2"]
}

Tailor the case to ${industry} and ${companyName || "the company"}'s context.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a senior interviewer creating ${difficulty}-level case study questions. Cases should be realistic, relevant to the industry, and appropriately complex.`
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    const fullQuestion = `${result.scenario}\n\n**Task:** ${result.question}`;

    return {
      id: `case-${Date.now()}`,
      question: fullQuestion,
      category: "case_study",
      interviewType: "case_study",
      difficulty,
      followUps: result.followUps || ["Walk me through your framework.", "What data would you need?"],
      probes: {
        ifVague: ["Can you structure your approach?", "What assumptions are you making?"],
        ifStrong: ["What's your recommendation?", "How would you measure success?"]
      },
      evaluationCriteria: {
        lookFor: result.lookFor || caseArea.evaluationCriteria,
        redFlags: result.redFlags || ["No structure", "Poor quantitative reasoning", "Unfocused recommendations"]
      },
      skillsTested: result.skillsTested || ["Analytical Thinking", "Business Acumen", "Communication"],
      timeEstimate: (result.timeEstimate || 20) * 60,
      context: `${result.title || "Business Case"} - ${industry} industry`
    };
  } catch (error) {
    console.error("Error generating case study question:", error);
    return generateFallbackCaseStudyQuestion(seniority, industry);
  }
}

function generateFallbackCaseStudyQuestion(seniority: string, industry: string): GeneratedQuestion {
  return {
    id: `case-fallback-${Date.now()}`,
    question: `Your company is considering entering a new market segment. The leadership team wants your analysis and recommendation.\n\n**Context:** Current market share is 15%, growing at 5% YoY. The new segment has 3x the growth rate but requires significant investment.\n\n**Task:** Structure your analysis and provide a recommendation.`,
    category: "case_study",
    interviewType: "case_study",
    difficulty: mapSeniorityToDifficulty(seniority as any),
    followUps: [
      "What frameworks would you use?",
      "What data would you need to make this decision?",
      "How would you measure success?"
    ],
    probes: {
      ifVague: ["Can you structure your thinking?", "What are the key considerations?"],
      ifStrong: ["What risks are you most concerned about?", "How would you phase the investment?"]
    },
    evaluationCriteria: {
      lookFor: ["Structured approach", "Quantitative analysis", "Clear recommendation"],
      redFlags: ["No framework", "Ignores key factors", "Unfocused response"]
    },
    skillsTested: ["Analytical Thinking", "Business Strategy", "Communication"],
    timeEstimate: 1200
  };
}

// ============================================================
// COMPREHENSIVE QUESTION PLAN GENERATOR
// ============================================================

/**
 * Generate a complete question plan for an interview
 */
export async function generateQuestionPlan(
  request: QuestionGenerationRequest
): Promise<QuestionPlan> {
  const { interviewType, seniority, jdContext, companyName, roleTitle, count = 10 } = request;

  let questions: GeneratedQuestion[] = [];

  switch (interviewType) {
    case "behavioral":
      questions = await generateBehavioralQuestions({ ...request, count });
      break;

    case "leadership":
      questions = await generateLeadershipQuestions({ ...request, count });
      break;

    case "technical":
      questions = await generateTechnicalQuestions({ ...request, count });
      break;

    case "coding":
      const codingQ = await generateCodingQuestion(request);
      questions = [codingQ];
      // Add follow-up behavioral questions
      const behavioralForCoding = await generateBehavioralQuestions({
        ...request,
        count: 2,
        specificCompetencies: ["problem_solving", "communication"]
      });
      questions.push(...behavioralForCoding);
      break;

    case "case_study":
      const caseQ = await generateCaseStudyQuestion(request);
      questions = [caseQ];
      // Add analytical behavioral questions
      const behavioralForCase = await generateBehavioralQuestions({
        ...request,
        count: 2,
        specificCompetencies: ["problem_solving", "results_orientation"]
      });
      questions.push(...behavioralForCase);
      break;

    case "domain":
      questions = await generateDomainQuestions({ ...request, count });
      break;

    case "hr":
      // Mix of behavioral and domain questions
      const hrBehavioral = await generateBehavioralQuestions({
        ...request,
        count: Math.ceil(count * 0.6),
        specificCompetencies: ["communication", "customer_focus", "adaptability_resilience", "integrity_ethics"]
      });
      const hrDomain = await generateDomainQuestions({
        ...request,
        count: Math.floor(count * 0.4)
      });
      questions = [...hrBehavioral, ...hrDomain];
      break;

    case "hiring_manager":
      // Mix of behavioral, domain, and potentially case questions
      const hmBehavioral = await generateBehavioralQuestions({
        ...request,
        count: Math.ceil(count * 0.5),
        specificCompetencies: ["ownership_accountability", "problem_solving", "results_orientation"]
      });
      const hmDomain = await generateDomainQuestions({
        ...request,
        count: Math.floor(count * 0.3)
      });
      let hmLeadership: GeneratedQuestion[] = [];
      if (jdContext?.leadershipSignals.isLeadershipRole) {
        hmLeadership = await generateLeadershipQuestions({
          ...request,
          count: Math.floor(count * 0.2)
        });
      }
      questions = [...hmBehavioral, ...hmDomain, ...hmLeadership];
      break;

    default:
      // Default to mixed behavioral
      questions = await generateBehavioralQuestions({ ...request, count });
  }

  // Calculate coverage
  const competenciesCovered = [...new Set(questions.filter(q => q.competencyId).map(q => q.competencyId!))];
  const skillsCovered = [...new Set(questions.flatMap(q => q.skillsTested))];

  // Identify gaps
  const gapsIdentified: string[] = [];
  if (jdContext?.skills.technical.filter(s => s.priority === "must_have").some(s =>
    !skillsCovered.some(sc => sc.toLowerCase().includes(s.name.toLowerCase()))
  )) {
    gapsIdentified.push("Some must-have technical skills not covered");
  }

  // Organize into phases
  const phases = organizeQuestionsIntoPhases(questions, interviewType);
  const totalDuration = phases.reduce((sum, p) => sum + p.duration, 0);

  return {
    interviewType,
    totalDuration,
    phases,
    questions,
    coverageAnalysis: {
      competenciesCovered,
      skillsCovered,
      gapsIdentified
    }
  };
}

function organizeQuestionsIntoPhases(
  questions: GeneratedQuestion[],
  interviewType: string
): QuestionPhase[] {
  const phases: QuestionPhase[] = [];

  // Always start with warmup
  const warmupQuestions = questions.filter(q =>
    q.category === "domain" || q.competencyId === "communication"
  ).slice(0, 1);

  phases.push({
    name: "Introduction & Warmup",
    duration: warmupQuestions.length > 0 ? 3 : 2,
    questions: warmupQuestions,
    objectives: ["Establish rapport", "Set expectations", "Initial context gathering"]
  });

  // Main assessment phase(s)
  const mainQuestions = questions.filter(q => !warmupQuestions.includes(q));

  if (interviewType === "coding" || interviewType === "case_study") {
    // Single main phase for exercises
    const exerciseQuestions = mainQuestions.filter(q =>
      q.category === "coding" || q.category === "case_study"
    );
    const otherQuestions = mainQuestions.filter(q =>
      q.category !== "coding" && q.category !== "case_study"
    );

    phases.push({
      name: interviewType === "coding" ? "Coding Exercise" : "Case Study",
      duration: Math.ceil(exerciseQuestions.reduce((sum, q) => sum + q.timeEstimate, 0) / 60),
      questions: exerciseQuestions,
      objectives: interviewType === "coding"
        ? ["Assess problem solving", "Evaluate code quality", "Test technical communication"]
        : ["Assess analytical thinking", "Evaluate business acumen", "Test structured reasoning"]
    });

    if (otherQuestions.length > 0) {
      phases.push({
        name: "Follow-up Discussion",
        duration: Math.ceil(otherQuestions.reduce((sum, q) => sum + q.timeEstimate, 0) / 60),
        questions: otherQuestions,
        objectives: ["Explore approach", "Assess depth", "Evaluate self-reflection"]
      });
    }
  } else {
    // Split into multiple phases for interview types
    const technicalQuestions = mainQuestions.filter(q => q.category === "technical");
    const behavioralQuestions = mainQuestions.filter(q => q.category === "behavioral");
    const leadershipQuestions = mainQuestions.filter(q => q.category === "leadership");
    const domainQuestions = mainQuestions.filter(q => q.category === "domain" && !warmupQuestions.includes(q));

    if (technicalQuestions.length > 0) {
      phases.push({
        name: "Technical Assessment",
        duration: Math.ceil(technicalQuestions.reduce((sum, q) => sum + q.timeEstimate, 0) / 60),
        questions: technicalQuestions,
        objectives: ["Assess technical depth", "Evaluate problem solving", "Test practical knowledge"]
      });
    }

    if (behavioralQuestions.length > 0) {
      phases.push({
        name: "Behavioral Assessment",
        duration: Math.ceil(behavioralQuestions.reduce((sum, q) => sum + q.timeEstimate, 0) / 60),
        questions: behavioralQuestions,
        objectives: ["Assess competencies", "Evaluate past behavior", "Identify patterns"]
      });
    }

    if (leadershipQuestions.length > 0) {
      phases.push({
        name: "Leadership Assessment",
        duration: Math.ceil(leadershipQuestions.reduce((sum, q) => sum + q.timeEstimate, 0) / 60),
        questions: leadershipQuestions,
        objectives: ["Assess leadership capability", "Evaluate strategic thinking", "Test people skills"]
      });
    }

    if (domainQuestions.length > 0) {
      phases.push({
        name: "Domain Knowledge",
        duration: Math.ceil(domainQuestions.reduce((sum, q) => sum + q.timeEstimate, 0) / 60),
        questions: domainQuestions,
        objectives: ["Assess industry knowledge", "Evaluate company fit", "Test domain expertise"]
      });
    }
  }

  // Always end with wrap-up
  phases.push({
    name: "Closing",
    duration: 2,
    questions: [],
    objectives: ["Candidate questions", "Summarize discussion", "Explain next steps"]
  });

  return phases;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function mapSeniorityToDifficulty(
  seniority: "entry" | "mid" | "senior" | "staff"
): "basic" | "intermediate" | "advanced" | "expert" {
  const mapping = {
    entry: "basic",
    mid: "intermediate",
    senior: "advanced",
    staff: "expert"
  } as const;
  return mapping[seniority] || "intermediate";
}

function getComplexityGuidance(difficulty: string): string {
  const guidance = {
    basic: "Ask foundational questions. Test understanding of core concepts. Keep requirements clear and unambiguous.",
    intermediate: "Ask practical questions with moderate complexity. Test real-world application. Include some ambiguity.",
    advanced: "Ask challenging questions requiring deep expertise. Test system-level thinking and edge cases.",
    expert: "Ask highly complex questions requiring architectural insight. Test leadership in technical decisions."
  };
  return guidance[difficulty as keyof typeof guidance] || guidance.intermediate;
}

async function customizeQuestionWithContext(
  baseQuestion: string,
  competency: CompetencyDimension,
  companyName?: string,
  roleTitle?: string,
  jdContext?: EnhancedJDContext
): Promise<string> {
  // Simple customization without AI call for basic cases
  let customized = baseQuestion;

  if (companyName) {
    customized = customized.replace(/your (?:previous )?company/gi, companyName);
    customized = customized.replace(/at work/gi, `at ${companyName}`);
  }

  if (roleTitle) {
    customized = customized.replace(/in your role/gi, `as a ${roleTitle}`);
  }

  return customized;
}

async function customizeLeadershipQuestion(
  baseQuestion: string,
  competency: CompetencyDimension,
  leadershipSignals: EnhancedJDContext["leadershipSignals"],
  companyName?: string,
  roleTitle?: string
): Promise<string> {
  let customized = baseQuestion;

  // Add context based on leadership level
  if (leadershipSignals.teamSize) {
    customized = customized.replace(/your team/gi, `your team of ${leadershipSignals.teamSize}`);
  }

  if (leadershipSignals.leadershipLevel === "director" || leadershipSignals.leadershipLevel === "executive") {
    customized = customized.replace(/team/gi, "organization");
    customized = customized.replace(/manager/gi, "executive");
  }

  return customized;
}
