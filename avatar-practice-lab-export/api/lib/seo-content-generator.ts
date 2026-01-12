import { db } from "../db";
import { 
  roleArchetypes, 
  roleInterviewStructureDefaults, 
  companies, 
  questionPatterns,
  companyRoleBlueprints,
  seoPages,
  seoPageSections
} from "../../shared/schema";
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
          content: `You are an expert career coach and interview preparation specialist. Write engaging, helpful content for job seekers preparing for interviews. 
          
Key guidelines:
- Be specific and actionable
- Use a professional but approachable tone
- Avoid generic advice - provide real insights
- Focus on what actually happens in interviews
- Keep paragraphs concise (2-3 sentences)
- Do NOT use bullet points or numbered lists
- Write in flowing prose
- Output only the content, no headings`
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
        `Write 2-3 paragraphs explaining what mock interviews really test beyond technical skills. 
        Cover: communication under pressure, structured thinking, ability to handle curveballs, 
        and how interviewers assess candidates in real-time. Make it feel like insider knowledge.`
      ),
      sourceTable: "editorial"
    });

    const interviewTypes = [...new Set(archetypes.flatMap(a => a.commonInterviewTypes || []))];
    sections.push({
      headingType: "h2",
      heading: "Common Interview Types (HR, Technical, Case, Behavioral)",
      content: await generateNarrativeContent(
        `Explain the 4 main interview types that candidates face: HR screening, technical interviews, 
        case studies, and behavioral rounds. For each, briefly explain what they're looking for and 
        how they differ. Interview types found in data: ${interviewTypes.join(", ")}`
      ),
      sourceTable: "role_archetypes",
      sourceData: { interviewTypes }
    });

    const phasesData = interviewStructures.slice(0, 3).map(s => s.phasesJson);
    sections.push({
      headingType: "h2",
      heading: "Typical Interview Structure",
      content: await generateNarrativeContent(
        `Describe the typical flow of an interview from start to finish. 
        Based on this structure data: ${JSON.stringify(phasesData)}. 
        Explain what happens in each phase and how long each typically takes.`
      ),
      sourceTable: "role_interview_structure_defaults",
      sourceData: { phasesData }
    });

    sections.push({
      headingType: "h2",
      heading: "Why Practicing Interviews Works",
      content: await generateNarrativeContent(
        `Explain the science and psychology behind why practice interviews improve performance. 
        Cover: reducing anxiety through exposure, building muscle memory for common questions, 
        getting feedback loops, and the compound effect of deliberate practice.`
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
        `Reveal what interviewers are actually evaluating beyond the obvious. 
        Cover: problem-solving approach, communication style, cultural fit signals, 
        and the hidden criteria that separate good from great candidates.`
      ),
      sourceTable: "editorial"
    });

    sections.push({
      headingType: "h2",
      heading: "Interview Rounds Explained",
      content: await generateNarrativeContent(
        `Break down the typical interview process from application to offer. 
        Explain what happens at each stage: initial screening, technical rounds, 
        hiring manager interviews, and final rounds. What's the purpose of each?`
      ),
      sourceTable: "role_interview_structure_defaults"
    });

    const patternTypes = [...new Set(patterns.map(p => p.patternType))];
    sections.push({
      headingType: "h2",
      heading: "Common Question Patterns",
      content: await generateNarrativeContent(
        `Explain the main categories of interview questions candidates face. 
        Pattern types include: ${patternTypes.join(", ")}. 
        For each category, give a sense of what interviewers are probing for.`
      ),
      sourceTable: "question_patterns",
      sourceData: { patternTypes }
    });

    sections.push({
      headingType: "h2",
      heading: "Practice vs Theory",
      content: await generateNarrativeContent(
        `Make the case for active practice over passive reading. 
        Explain why reading about interviews isn't enough, and how 
        simulated practice builds the real skills needed to succeed.`
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
      `For ${roleName} interviews, explain what specific skills and dimensions interviewers assess. 
      Key dimensions include: ${formatSkillDimensions(skillDimensions)}. 
      Explain how each dimension is typically tested and what good vs weak answers look like.`
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
        `Describe the typical interview structure for ${roleName} roles. 
        Based on this phase data: ${JSON.stringify(structure.phasesJson)}. 
        Explain what happens in each phase and how candidates should prepare for each.`
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
        `Describe the types of questions ${roleName} candidates typically face. 
        Sample patterns include: ${patternSamples.join("; ")}. 
        Explain the intent behind these questions and how to approach them strategically.`
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
      `Explain the most common mistakes ${roleName} candidates make in interviews. 
      Common failure modes include: ${failureModes.join("; ")}. 
      For each mistake, explain why it happens and how to avoid it.`
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
      `Describe the typical interview process at ${companyName}. 
      They are in the ${company.sector || "tech"} sector with archetype ${company.archetype || "enterprise"}. 
      Their interview typically includes: ${Object.keys(interviewComponents).filter(k => interviewComponents[k as keyof typeof interviewComponents]).join(", ")}. 
      Explain what candidates should expect at each stage.`
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
        `Explain what skills and qualities ${companyName} particularly values in candidates. 
        Based on their hiring patterns, they focus on: ${skillFocusAreas.join(", ")}. 
        Describe how they assess these skills during interviews.`
      ),
      sourceTable: "company_role_blueprints",
      sourceData: { skillFocusAreas }
    });
  }

  sections.push({
    headingType: "h2",
    heading: `Interview Question Styles at ${companyName}`,
    content: await generateNarrativeContent(
      `Describe the types of interview questions ${companyName} is known for asking. 
      Given their ${company.archetype} archetype in the ${company.sector} sector, 
      explain the typical question styles and what they're trying to assess.`
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
      `Explain what ${companyName} specifically looks for when hiring ${roleName}s. 
      Combine their company archetype (${company.archetype}) with the role's key dimensions: ${formatSkillDimensions(skillDimensions)}. 
      Describe how ${companyName}'s culture and industry (${company.sector}) shapes their expectations.`
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
        `Describe the interview structure for ${roleName} roles at ${companyName}. 
        General ${roleName} structure: ${JSON.stringify(structure.phasesJson)}. 
        Adapt this for ${companyName}'s known interview components: ${Object.keys(company.interviewComponents || {}).filter(k => company.interviewComponents?.[k as keyof typeof company.interviewComponents]).join(", ")}.`
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
        `Describe the types of questions asked in ${roleName} interviews at companies like ${companyName}. 
        Common patterns include questions about: ${patterns.slice(0, 5).map(p => p.patternType).join(", ")}. 
        Explain how ${companyName}'s ${company.sector} focus might influence these questions.`
      ),
      sourceTable: "question_patterns",
      sourceData: { patternTypes: patterns.map(p => p.patternType) }
    });
  }

  sections.push({
    headingType: "h2",
    heading: "How to Prepare Effectively",
    content: await generateNarrativeContent(
      `Provide a synthesis of how to prepare specifically for a ${roleName} interview at ${companyName}. 
      Combine: role skills (${skillDimensions.slice(0, 3).join(", ")}), 
      company culture (${company.archetype}, ${company.sector}), 
      and common failure modes (${(archetype.commonFailureModes || []).slice(0, 3).join(", ")}). 
      Give 3-4 concrete preparation strategies.`
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
      `Explain what a ${skill.name} specifically tests and evaluates. 
      What core competencies is the interviewer assessing? 
      How does this interview type differ from others?`
    ),
    sourceTable: "editorial"
  });

  if (patterns.length > 0) {
    sections.push({
      headingType: "h2",
      heading: "Common Question Patterns",
      content: await generateNarrativeContent(
        `Describe the most common question patterns in ${skill.name}s. 
        Examples include: ${patterns.slice(0, 5).map(p => p.template?.substring(0, 50)).join("; ")}... 
        Explain the underlying structure of these questions and what interviewers want to see.`
      ),
      sourceTable: "question_patterns",
      sourceData: { patternCount: patterns.length }
    });
  }

  sections.push({
    headingType: "h2",
    heading: "How Interviewers Evaluate Responses",
    content: await generateNarrativeContent(
      `Explain the evaluation criteria interviewers use in ${skill.name}s. 
      What distinguishes a good answer from a great one? 
      What red flags cause concern? What signals impress interviewers?`
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
