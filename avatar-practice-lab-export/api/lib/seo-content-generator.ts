import { db } from "../db.js";
import { 
  roleArchetypes, 
  roleInterviewStructureDefaults, 
  companies, 
  questionPatterns,
  companyRoleBlueprints,
  seoPages,
  seoPageSections
} from "../../shared/schema.js";
import { eq, and, inArray } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type SeoPageType = "pillar" | "role_prep" | "company_prep" | "company_role" | "skill_practice";

interface SeoSection {
  headingType: "h2" | "h3";
  heading: string;
  content: string;
  sourceTable?: string;
  sourceData?: Record<string, unknown>;
  isCta?: boolean;
  ctaType?: "practice_start" | "explore_roles" | "explore_companies" | "mock_interview";
  ctaLink?: string;
}

interface GeneratedSeoPage {
  pageType: SeoPageType;
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  sections: SeoSection[];
  jsonLd: Record<string, unknown>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatSkillDimensions(dimensions: string[]): string {
  const formatted = dimensions.map(d => d.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()));
  if (formatted.length <= 2) return formatted.join(" and ");
  return formatted.slice(0, -1).join(", ") + ", and " + formatted[formatted.length - 1];
}

function formatInterviewTypes(types: string[]): string {
  const typeMap: Record<string, string> = {
    "technical": "Technical Deep Dive",
    "coding": "Coding Assessment",
    "hiring_manager": "Hiring Manager Round",
    "behavioral": "Behavioral Interview",
    "hr": "HR Screening",
    "sql": "SQL Assessment",
    "analytics": "Analytics Case",
    "product": "Product Case",
    "case": "Case Interview",
    "ml": "Machine Learning Assessment",
    "portfolio": "Portfolio Review",
    "sales_roleplay": "Sales Role Play"
  };
  return types.map(t => typeMap[t] || t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())).join(", ");
}

async function generateNarrativeContent(prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert career coach and interview preparation specialist who has conducted thousands of interviews. Write from the interviewer's perspective, revealing what candidates usually only learn after multiple rejections.

Key guidelines:
- Write from the interviewer's point of view - what they notice, assess, and decide
- Be specific and diagnostic, not generic or encouraging
- Reveal hidden evaluation criteria candidates don't know about
- Describe how strong candidates differ from weak ones in subtle ways
- Keep paragraphs concise (2-3 sentences)
- Use bullet points or numbered lists only when they genuinely improve clarity
- Output only the content, no headings
- Avoid academic language - keep it grounded in interview-room reality`
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    });
    return response.choices[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error("Error generating narrative content:", error);
    return "";
  }
}

export async function generatePillarPage(type: "mock-interview" | "interview-preparation"): Promise<GeneratedSeoPage> {
  const interviewStructures = await db.select().from(roleInterviewStructureDefaults).limit(10);
  const patterns = await db.select().from(questionPatterns).limit(20);
  const archetypes = await db.select().from(roleArchetypes).limit(10);

  const sections: SeoSection[] = [];

  if (type === "mock-interview") {
    sections.push({
      headingType: "h2",
      heading: "What a Mock Interview Actually Tests",
      content: await generateNarrativeContent(
        `Explain what mock interviews actually test beyond surface-level knowledge. Write from the interviewer's perspective. Show how interviewers assess thinking under pressure, clarity of explanation, handling ambiguity, and recovery from mistakes. Describe what interviewers notice in the first few minutes versus later in the conversation. Make it feel like insight candidates usually only learn after multiple rejections.`
      ),
      sourceTable: "editorial"
    });

    const interviewTypes = [...new Set(archetypes.flatMap(a => a.commonInterviewTypes || []))];
    sections.push({
      headingType: "h2",
      heading: "Common Interview Types (HR, Technical, Case, Behavioral)",
      content: await generateNarrativeContent(
        `Explain the four main interview types candidates encounter: HR screening, technical interviews, case interviews, and behavioral rounds. For each, describe how the interviewer's mindset changes and what they are primarily trying to confirm or eliminate. Emphasize how the same answer can be judged differently across interview types. Interview types to reference: ${interviewTypes.join(", ")}.`
      ),
      sourceTable: "role_archetypes",
      sourceData: { interviewTypes }
    });

    const phasesData = interviewStructures.slice(0, 3).map(s => s.phasesJson);
    sections.push({
      headingType: "h2",
      heading: "Typical Interview Structure",
      content: await generateNarrativeContent(
        `Describe the typical flow of an interview from opening to close, based on this structure data: ${JSON.stringify(phasesData)}. Explain what interviewers are evaluating at each phase, how candidates often misread these moments, and where interviews are usually won or lost. Include realistic timing and pacing, not idealized versions.`
      ),
      sourceTable: "role_interview_structure_defaults",
      sourceData: { phasesData }
    });

    sections.push({
      headingType: "h2",
      heading: "Why Practicing Interviews Works",
      content: await generateNarrativeContent(
        `Explain why interview practice works from a behavioral and cognitive perspective. Describe how repeated exposure changes response quality, confidence, and clarity under pressure. Show the difference between candidates who "know the answers" versus those who have practiced saying them out loud. Avoid academic language — keep it grounded in interview-room reality.`
      ),
      sourceTable: "editorial"
    });

    sections.push({
      headingType: "h2",
      heading: "How Hiready Mock Interviews Work",
      content: `Hiready provides AI-powered mock interviews that simulate real interview scenarios with realistic questions and feedback. Our system adapts to your target role, company, and experience level to give you personalized practice. After each session, you receive detailed analysis of your performance across key dimensions like communication clarity, structured thinking, and role-specific competencies.`,
      isCta: true,
      ctaType: "mock_interview",
      ctaLink: "/interview"
    });

    return {
      pageType: "pillar",
      slug: "mock-interview",
      title: "Mock Interview Online – Practice Real Interviews with AI | Hiready",
      metaTitle: "Mock Interview Online – Practice Real Interviews with AI | Hiready",
      metaDescription: "Prepare for your next interview with AI-powered mock interviews. Practice with realistic scenarios, get instant feedback, and improve your interview skills.",
      h1: "Mock Interview Practice – Prepare with Real Interview Simulations",
      sections,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Mock Interview Practice",
        "description": "AI-powered mock interview practice platform",
        "provider": { "@type": "Organization", "name": "Hiready" }
      }
    };
  } else {
    sections.push({
      headingType: "h2",
      heading: "What Interviewers Really Look For",
      content: await generateNarrativeContent(
        `Reveal what interviewers are actually evaluating beyond the obvious answers. Describe the hidden criteria that separate good from great candidates: how they approach problems, how they communicate uncertainty, and how they signal cultural fit without trying. Explain what interviewers notice in the first 5 minutes that often determines the outcome.`
      ),
      sourceTable: "editorial"
    });

    sections.push({
      headingType: "h2",
      heading: "Interview Rounds Explained",
      content: await generateNarrativeContent(
        `Break down the typical interview process from application to offer, explaining the distinct purpose of each stage. Describe how interviewers' expectations shift from screening to final rounds, and what candidates often underestimate at each stage. Reveal the common handoff notes that interviewers pass between rounds.`
      ),
      sourceTable: "role_interview_structure_defaults"
    });

    const patternTypes = [...new Set(patterns.map(p => p.patternType))];
    sections.push({
      headingType: "h2",
      heading: "Common Question Patterns",
      content: await generateNarrativeContent(
        `Explain the main categories of interview questions candidates face, using these pattern types: ${patternTypes.join(", ")}. For each category, describe what interviewers are really probing for beneath the surface question, and how the same question type reveals different signals across candidate responses.`
      ),
      sourceTable: "question_patterns",
      sourceData: { patternTypes }
    });

    sections.push({
      headingType: "h2",
      heading: "Practice vs Theory",
      content: await generateNarrativeContent(
        `Make the case for active practice over passive reading. Explain how repeated exposure changes response quality, confidence, and clarity under pressure. Show the difference between candidates who "know the answers" versus those who have practiced saying them out loud in real time.`
      ),
      sourceTable: "editorial"
    });

    sections.push({
      headingType: "h2",
      heading: "Start Interview Practice",
      content: `Ready to put your preparation into action? Hiready offers personalized interview practice for 19 different role types, from Software Engineers to Product Managers to Data Scientists. Choose your target role and company to get customized practice sessions with AI-powered feedback.`,
      isCta: true,
      ctaType: "practice_start",
      ctaLink: "/interview"
    });

    return {
      pageType: "pillar",
      slug: "interview-preparation",
      title: "Interview Preparation – How to Prepare for Interviews Effectively | Hiready",
      metaTitle: "Interview Preparation – How to Prepare for Interviews Effectively | Hiready",
      metaDescription: "Learn how to prepare for job interviews effectively. Understand interview rounds, common question patterns, and what interviewers really look for.",
      h1: "Interview Preparation – A Complete Guide to Getting Ready",
      sections,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Interview Preparation Guide",
        "description": "Comprehensive interview preparation guide",
        "provider": { "@type": "Organization", "name": "Hiready" }
      }
    };
  }
}

export async function generateRolePrepPage(roleArchetypeId: string): Promise<GeneratedSeoPage | null> {
  const [archetype] = await db.select().from(roleArchetypes).where(eq(roleArchetypes.id, roleArchetypeId));
  if (!archetype) return null;

  const structures = await db.select().from(roleInterviewStructureDefaults)
    .where(eq(roleInterviewStructureDefaults.roleArchetypeId, roleArchetypeId));
  
  const roleCategory = archetype.roleCategory || "general";
  const patterns = await db.select().from(questionPatterns)
    .where(eq(questionPatterns.roleCategory, roleCategory as any))
    .limit(15);

  const roleName = archetype.name;
  const roleSlug = slugify(roleName);
  const sections: SeoSection[] = [];

  const skillDimensions = archetype.primarySkillDimensions || [];
  sections.push({
    headingType: "h2",
    heading: `What Interviewers Evaluate in ${roleName}s`,
    content: await generateNarrativeContent(
      `For ${roleName} interviews, explain what interviewers actually listen for when candidates speak. Use these dimensions: ${formatSkillDimensions(skillDimensions)}. Describe how each dimension shows up naturally in conversation, not as a checklist. Contrast how strong candidates demonstrate these traits versus weaker ones.`
    ),
    sourceTable: "role_archetypes",
    sourceData: { skillDimensions }
  });

  const structure = structures[0];
  if (structure?.phasesJson) {
    sections.push({
      headingType: "h2",
      heading: `Typical ${roleName} Interview Structure`,
      content: await generateNarrativeContent(
        `Describe the interview structure commonly used for ${roleName} roles, based on this data: ${JSON.stringify(structure.phasesJson)}. Explain how expectations shift across rounds and what candidates often underestimate at each stage. Focus on preparation mistakes candidates make for each phase.`
      ),
      sourceTable: "role_interview_structure_defaults",
      sourceData: { phases: structure.phasesJson }
    });
  }

  if (patterns.length > 0) {
    const patternSamples = patterns.slice(0, 5).map(p => p.template);
    sections.push({
      headingType: "h2",
      heading: "Common Question Patterns You'll Face",
      content: await generateNarrativeContent(
        `Describe the recurring question patterns ${roleName} candidates face, using these examples: ${patternSamples.join("; ")}. Explain why interviewers rely on these patterns and what they reveal about candidates beyond the surface answer. Emphasize structure and reasoning, not memorization.`
      ),
      sourceTable: "question_patterns",
      sourceData: { patternCount: patterns.length }
    });
  }

  const failureModes = archetype.commonFailureModes || [];
  sections.push({
    headingType: "h2",
    heading: "Common Mistakes Candidates Make",
    content: await generateNarrativeContent(
      `Explain the most common ways ${roleName} candidates fail interviews, based on these failure modes: ${failureModes.join("; ")}. Describe how these mistakes typically appear in conversation and why candidates don't realize they're happening. Keep the tone diagnostic, not judgmental.`
    ),
    sourceTable: "role_archetypes",
    sourceData: { failureModes }
  });

  sections.push({
    headingType: "h2",
    heading: `Practice a ${roleName} Interview on Hiready`,
    content: `Ready to practice for your ${roleName} interview? Hiready offers tailored mock interviews specifically designed for ${roleName} roles. Our AI interviewer asks the same types of questions you'll face in real interviews, then provides detailed feedback on your performance across dimensions like ${formatSkillDimensions(skillDimensions.slice(0, 3))}.`,
    isCta: true,
    ctaType: "practice_start",
    ctaLink: `/interview?role=${roleArchetypeId}`
  });

  return {
    pageType: "role_prep",
    slug: `prepare/${roleSlug}-interview`,
    title: `${roleName} Interview Preparation – Process, Questions & Practice | Hiready`,
    metaTitle: `${roleName} Interview Preparation – Process, Questions & Practice | Hiready`,
    metaDescription: `Prepare for your ${roleName} interview with our comprehensive guide. Learn what interviewers look for, common questions, and practice with AI mock interviews.`,
    h1: `${roleName} Interview Preparation – What to Expect & How to Practice`,
    sections,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": `${roleName} Interview Preparation`,
      "description": `Interview preparation guide for ${roleName} roles`,
      "provider": { "@type": "Organization", "name": "Hiready" }
    }
  };
}

export async function generateCompanyPrepPage(companyId: string): Promise<GeneratedSeoPage | null> {
  const [company] = await db.select().from(companies).where(eq(companies.id, companyId));
  if (!company) return null;

  const blueprints = await db.select().from(companyRoleBlueprints)
    .where(eq(companyRoleBlueprints.companyId, companyId));

  const patterns = await db.select().from(questionPatterns).limit(10);

  const companyName = company.name;
  const companySlug = slugify(companyName);
  const sections: SeoSection[] = [];

  const interviewComponents = company.interviewComponents || {};
  sections.push({
    headingType: "h2",
    heading: `How Interviews at ${companyName} Typically Work`,
    content: await generateNarrativeContent(
      `Describe how interviews at ${companyName} typically unfold in practice. Use their sector (${company.sector || "tech"}) and archetype (${company.archetype || "enterprise"}) to explain pacing, depth, and interviewer expectations. Reference these interview components: ${Object.keys(interviewComponents).filter(k => interviewComponents[k as keyof typeof interviewComponents]).join(", ")}. Focus on what surprises candidates most.`
    ),
    sourceTable: "companies",
    sourceData: { interviewComponents }
  });

  if (blueprints.length > 0) {
    const skillFocusAreas = blueprints.flatMap(b => Object.keys(b.skillFocus || {}));
    sections.push({
      headingType: "h2",
      heading: `Skills ${companyName} Interviewers Emphasize`,
      content: await generateNarrativeContent(
        `Explain which skills ${companyName} consistently prioritizes during interviews, based on: ${skillFocusAreas.join(", ")}. Describe how interviewers test these skills indirectly through questions, follow-ups, and problem framing. Avoid stating values — show how they surface in interviews.`
      ),
      sourceTable: "company_role_blueprints",
      sourceData: { skillFocusAreas }
    });
  }

  sections.push({
    headingType: "h2",
    heading: `Interview Question Styles at ${companyName}`,
    content: await generateNarrativeContent(
      `Describe the types of interview questions ${companyName} is known for asking. Given their ${company.archetype} archetype in the ${company.sector} sector, explain the typical question styles, how interviewers probe for depth, and the subtle signals they're evaluating beyond the answer itself.`
    ),
    sourceTable: "question_patterns"
  });

  const archetypes = await db.select().from(roleArchetypes).limit(6);
  const roleLinks = archetypes.map(a => `${a.name}`).join(", ");
  sections.push({
    headingType: "h2",
    heading: `Common Roles Hired at ${companyName}`,
    content: `${companyName} frequently hires for roles including ${roleLinks}. Each role has its own interview format and evaluation criteria. Click on any role below to see role-specific interview preparation guides, or explore combined company+role preparation pages for the most targeted practice.`,
    sourceTable: "role_archetypes",
    sourceData: { roleCount: archetypes.length }
  });

  sections.push({
    headingType: "h2",
    heading: `Practice ${companyName}-Style Interviews on Hiready`,
    content: `Get ready for your ${companyName} interview with Hiready's AI-powered practice platform. Our system simulates the interview styles and question patterns typical of ${company.sector} companies like ${companyName}, giving you realistic practice with detailed performance feedback.`,
    isCta: true,
    ctaType: "practice_start",
    ctaLink: `/interview?company=${companyId}`
  });

  return {
    pageType: "company_prep",
    slug: `interview-prep/${companySlug}`,
    title: `${companyName} Interview Preparation – Process, Questions & Practice | Hiready`,
    metaTitle: `${companyName} Interview Preparation – Process, Questions & Practice | Hiready`,
    metaDescription: `Prepare for your ${companyName} interview. Learn about their interview process, common questions, and practice with AI mock interviews.`,
    h1: `${companyName} Interview Preparation – What to Expect & How to Prepare`,
    sections,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": `${companyName} Interview Preparation`,
      "description": `Interview preparation guide for ${companyName}`,
      "provider": { "@type": "Organization", "name": "Hiready" }
    }
  };
}

export async function generateCompanyRolePage(companyId: string, roleArchetypeId: string): Promise<GeneratedSeoPage | null> {
  const [company] = await db.select().from(companies).where(eq(companies.id, companyId));
  const [archetype] = await db.select().from(roleArchetypes).where(eq(roleArchetypes.id, roleArchetypeId));
  
  if (!company || !archetype) return null;

  const structures = await db.select().from(roleInterviewStructureDefaults)
    .where(eq(roleInterviewStructureDefaults.roleArchetypeId, roleArchetypeId));

  const roleCategory = archetype.roleCategory || "general";
  const patterns = await db.select().from(questionPatterns)
    .where(eq(questionPatterns.roleCategory, roleCategory as any))
    .limit(10);

  const companyName = company.name;
  const roleName = archetype.name;
  const companySlug = slugify(companyName);
  const roleSlug = slugify(roleName);
  const sections: SeoSection[] = [];

  const skillDimensions = archetype.primarySkillDimensions || [];
  sections.push({
    headingType: "h2",
    heading: `What ${companyName} Looks for in ${roleName}s`,
    content: await generateNarrativeContent(
      `Explain what ${companyName} specifically looks for when hiring ${roleName}s. Combine their company archetype (${company.archetype}) with the role's key dimensions: ${formatSkillDimensions(skillDimensions)}. Describe how ${companyName}'s culture and industry (${company.sector}) shapes the specific behaviors and signals interviewers watch for.`
    ),
    sourceTable: "role_archetypes",
    sourceData: { skillDimensions, companyArchetype: company.archetype }
  });

  const structure = structures[0];
  if (structure?.phasesJson) {
    sections.push({
      headingType: "h2",
      heading: `${companyName} ${roleName} Interview Structure`,
      content: await generateNarrativeContent(
        `Describe the interview structure for ${roleName} roles at ${companyName}. General ${roleName} structure: ${JSON.stringify(structure.phasesJson)}. Adapt this for ${companyName}'s known interview components: ${Object.keys(company.interviewComponents || {}).filter(k => company.interviewComponents?.[k as keyof typeof company.interviewComponents]).join(", ")}. Focus on what surprises candidates most and common preparation gaps.`
      ),
      sourceTable: "role_interview_structure_defaults",
      sourceData: { phases: structure.phasesJson, companyComponents: company.interviewComponents }
    });
  }

  if (patterns.length > 0) {
    sections.push({
      headingType: "h2",
      heading: "Common Question Patterns Asked",
      content: await generateNarrativeContent(
        `Describe the types of questions asked in ${roleName} interviews at companies like ${companyName}. Common patterns include questions about: ${patterns.slice(0, 5).map(p => p.patternType).join(", ")}. Explain how ${companyName}'s ${company.sector} focus shapes these questions and what interviewers are really probing for beneath the surface.`
      ),
      sourceTable: "question_patterns",
      sourceData: { patternTypes: patterns.map(p => p.patternType) }
    });
  }

  sections.push({
    headingType: "h2",
    heading: "How to Prepare Effectively",
    content: await generateNarrativeContent(
      `Provide a synthesis of how to prepare specifically for a ${roleName} interview at ${companyName}. Combine: role skills (${skillDimensions.slice(0, 3).join(", ")}), company culture (${company.archetype}, ${company.sector}), and common failure modes (${(archetype.commonFailureModes || []).slice(0, 3).join(", ")}). Focus on the preparation mistakes that lead to rejection even when candidates know the material.`
    ),
    sourceTable: "editorial"
  });

  sections.push({
    headingType: "h2",
    heading: `Practice ${companyName} ${roleName} Interview on Hiready`,
    content: `Get targeted practice for your ${roleName} interview at ${companyName}. Hiready's AI interviewer simulates the specific question types and evaluation criteria that ${companyName} uses for ${roleName} roles. Practice with questions tailored to both the role requirements and ${companyName}'s interview style.`,
    isCta: true,
    ctaType: "practice_start",
    ctaLink: `/interview?company=${companyId}&role=${roleArchetypeId}`
  });

  return {
    pageType: "company_role",
    slug: `interview-prep/${companySlug}-${roleSlug}`,
    title: `${companyName} ${roleName} Interview – Process, Questions & Practice | Hiready`,
    metaTitle: `${companyName} ${roleName} Interview – Process, Questions & Practice | Hiready`,
    metaDescription: `Prepare for the ${roleName} interview at ${companyName}. Learn their specific interview process, common questions, and practice with AI mock interviews.`,
    h1: `${companyName} ${roleName} Interview Preparation Guide`,
    sections,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": `${companyName} ${roleName} Interview Preparation`,
      "description": `Interview preparation guide for ${roleName} roles at ${companyName}`,
      "provider": { "@type": "Organization", "name": "Hiready" }
    }
  };
}

export async function generateSkillPracticePage(skillType: string): Promise<GeneratedSeoPage | null> {
  const skillTypes: Record<string, { name: string; interviewType: string }> = {
    "behavioral-interview": { name: "Behavioral Interview", interviewType: "behavioral" },
    "technical-interview": { name: "Technical Interview", interviewType: "technical" },
    "case-interview": { name: "Case Interview", interviewType: "case" },
    "sql-interview": { name: "SQL Interview", interviewType: "sql" },
    "coding-interview": { name: "Coding Interview", interviewType: "coding" },
    "system-design": { name: "System Design Interview", interviewType: "system_design" },
    "product-sense": { name: "Product Sense Interview", interviewType: "product" },
    "hiring-manager": { name: "Hiring Manager Interview", interviewType: "hiring_manager" }
  };

  const skill = skillTypes[skillType];
  if (!skill) return null;

  const patterns = await db.select().from(questionPatterns)
    .where(eq(questionPatterns.interviewType, skill.interviewType as any))
    .limit(15);

  const sections: SeoSection[] = [];

  sections.push({
    headingType: "h2",
    heading: "What This Interview Tests",
    content: await generateNarrativeContent(
      `Explain what a ${skill.name} interview truly evaluates beyond correctness. Describe how interviewers judge thinking process, communication clarity, and adaptability under questioning. Explain how this interview type differs in tone and expectations from others.`
    ),
    sourceTable: "editorial"
  });

  if (patterns.length > 0) {
    sections.push({
      headingType: "h2",
      heading: "Common Question Patterns",
      content: await generateNarrativeContent(
        `Describe the most common question structures used in ${skill.name} interviews. Use examples like: ${patterns.slice(0, 5).map(p => p.template?.substring(0, 50)).join("; ")}. Explain the logic behind these patterns and what interviewers are trying to surface about the candidate.`
      ),
      sourceTable: "question_patterns",
      sourceData: { patternCount: patterns.length }
    });
  }

  sections.push({
    headingType: "h2",
    heading: "How Interviewers Evaluate Responses",
    content: await generateNarrativeContent(
      `Explain how interviewers evaluate answers during ${skill.name} interviews in real time. Describe what makes an answer feel confident and trustworthy versus risky or unclear. Highlight subtle signals interviewers react to, including pacing, framing, and handling follow-ups.`
    ),
    sourceTable: "editorial"
  });

  sections.push({
    headingType: "h2",
    heading: "Practice This Interview Type",
    content: `Ready to practice ${skill.name}s? Hiready offers targeted practice sessions specifically for this interview format. Our AI interviewer asks realistic questions, then provides detailed feedback on your responses, helping you identify improvement areas before your real interview.`,
    isCta: true,
    ctaType: "practice_start",
    ctaLink: `/practice?type=${skillType}`
  });

  return {
    pageType: "skill_practice",
    slug: `practice/${skillType}`,
    title: `${skill.name} Practice – Common Patterns & Practice | Hiready`,
    metaTitle: `${skill.name} Practice – Common Patterns & Practice | Hiready`,
    metaDescription: `Practice ${skill.name}s with AI-powered mock sessions. Learn common question patterns, evaluation criteria, and get personalized feedback.`,
    h1: `${skill.name} Practice – Master This Interview Format`,
    sections,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": `${skill.name} Practice`,
      "description": `Practice guide for ${skill.name}s`,
      "provider": { "@type": "Organization", "name": "Hiready" }
    }
  };
}

export async function saveSeoPage(page: GeneratedSeoPage, roleArchetypeId?: string, companyId?: string): Promise<string> {
  const [existingPage] = await db.select().from(seoPages).where(eq(seoPages.slug, page.slug));
  
  const pageData = {
    pageType: page.pageType,
    slug: page.slug,
    title: page.title,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    h1: page.h1,
    status: "draft" as const,
    roleArchetypeId: roleArchetypeId || null,
    companyId: companyId || null,
    jsonLd: page.jsonLd,
    lastGeneratedAt: new Date(),
    refreshDueAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  };

  let pageId: string;
  
  if (existingPage) {
    await db.update(seoPages)
      .set({ ...pageData, generationVersion: (existingPage.generationVersion || 1) + 1 })
      .where(eq(seoPages.id, existingPage.id));
    pageId = existingPage.id;
    
    await db.delete(seoPageSections).where(eq(seoPageSections.seoPageId, pageId));
  } else {
    const [newPage] = await db.insert(seoPages).values(pageData).returning();
    pageId = newPage.id;
  }

  for (let i = 0; i < page.sections.length; i++) {
    const section = page.sections[i];
    await db.insert(seoPageSections).values({
      seoPageId: pageId,
      sectionOrder: i + 1,
      headingType: section.headingType,
      heading: section.heading,
      content: section.content,
      sourceTable: section.sourceTable,
      sourceData: section.sourceData,
      isCta: section.isCta || false,
      ctaType: section.ctaType,
      ctaLink: section.ctaLink
    });
  }

  return pageId;
}
