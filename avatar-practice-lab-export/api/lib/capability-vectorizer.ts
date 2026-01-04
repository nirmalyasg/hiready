import OpenAI from "openai";

export interface SkillTag {
  skill: string;
  category: "language" | "framework" | "tool" | "concept" | "domain" | "soft_skill";
  weight: number;
  source: "jd" | "resume" | "role_kit" | "inferred";
}

export interface CapabilityProfile {
  skills: SkillTag[];
  primaryLanguages: string[];
  frameworks: string[];
  domains: string[];
  seniorityLevel: "junior" | "mid" | "senior" | "lead";
  combinedRequirements: string[];
}

const SKILL_SYNONYMS: Record<string, string[]> = {
  "javascript": ["js", "ecmascript", "es6", "es2015", "vanilla js"],
  "typescript": ["ts"],
  "nodejs": ["node", "node.js", "express", "express.js", "nestjs"],
  "react": ["reactjs", "react.js", "react native", "jsx"],
  "python": ["py", "python3", "django", "flask", "fastapi"],
  "api": ["rest", "restful", "graphql", "api design", "api integration", "web services"],
  "database": ["sql", "postgresql", "postgres", "mysql", "mongodb", "nosql", "orm", "drizzle", "prisma"],
  "testing": ["unit testing", "jest", "pytest", "testing frameworks", "tdd", "bdd", "cypress"],
  "devops": ["ci/cd", "docker", "kubernetes", "k8s", "aws", "gcp", "azure", "cloud"],
  "git": ["version control", "github", "gitlab", "bitbucket"],
  "agile": ["scrum", "kanban", "sprint", "jira"],
};

function normalizeSkillName(skill: string): string {
  const lower = skill.toLowerCase().trim();
  for (const [canonical, synonyms] of Object.entries(SKILL_SYNONYMS)) {
    if (synonyms.includes(lower) || lower === canonical) {
      return canonical;
    }
  }
  return lower;
}

function categorizeSkill(skill: string): SkillTag["category"] {
  const lower = skill.toLowerCase();
  
  const languages = ["javascript", "typescript", "python", "java", "go", "rust", "c++", "c#", "ruby", "php", "swift", "kotlin"];
  const frameworks = ["react", "angular", "vue", "nodejs", "express", "django", "flask", "spring", "rails", "nextjs", "nestjs"];
  const tools = ["git", "docker", "kubernetes", "jenkins", "terraform", "webpack", "vite", "npm", "yarn"];
  const concepts = ["api", "testing", "devops", "microservices", "architecture", "algorithms", "data structures", "design patterns"];
  const domains = ["frontend", "backend", "fullstack", "mobile", "cloud", "ml", "ai", "data science", "security"];
  
  if (languages.some(l => lower.includes(l))) return "language";
  if (frameworks.some(f => lower.includes(f))) return "framework";
  if (tools.some(t => lower.includes(t))) return "tool";
  if (concepts.some(c => lower.includes(c))) return "concept";
  if (domains.some(d => lower.includes(d))) return "domain";
  return "soft_skill";
}

export function extractSkillsFromText(text: string, source: SkillTag["source"]): SkillTag[] {
  const skillPatterns = [
    /\b(JavaScript|TypeScript|Python|Java|Go|Rust|C\+\+|C#|Ruby|PHP|Swift|Kotlin)\b/gi,
    /\b(React|Angular|Vue|Node\.?js|Express|Django|Flask|Spring|Rails|Next\.?js|Nest\.?js)\b/gi,
    /\b(REST|GraphQL|API|SQL|PostgreSQL|MongoDB|Redis|Docker|Kubernetes|AWS|GCP|Azure)\b/gi,
    /\b(Git|CI\/CD|Jenkins|Terraform|Webpack|Vite|Jest|Pytest|Cypress)\b/gi,
    /\b(microservices?|serverless|cloud native|distributed systems?)\b/gi,
    /\b(unit testing|integration testing|e2e testing|TDD|BDD)\b/gi,
    /\b(Agile|Scrum|Kanban|DevOps|SRE)\b/gi,
  ];

  const skills: Map<string, SkillTag> = new Map();

  for (const pattern of skillPatterns) {
    const matches = text.match(pattern) || [];
    for (const match of matches) {
      const normalized = normalizeSkillName(match);
      if (!skills.has(normalized)) {
        skills.set(normalized, {
          skill: normalized,
          category: categorizeSkill(normalized),
          weight: 1,
          source,
        });
      } else {
        const existing = skills.get(normalized)!;
        existing.weight += 0.5;
      }
    }
  }

  return Array.from(skills.values());
}

export function combineSkillProfiles(
  jdSkills: SkillTag[],
  resumeSkills: SkillTag[],
  roleKitSkills: string[]
): CapabilityProfile {
  const skillMap: Map<string, SkillTag> = new Map();

  for (const skill of jdSkills) {
    skill.weight *= 1.5;
    skillMap.set(skill.skill, skill);
  }

  for (const skill of resumeSkills) {
    if (skillMap.has(skill.skill)) {
      const existing = skillMap.get(skill.skill)!;
      existing.weight += skill.weight;
    } else {
      skillMap.set(skill.skill, skill);
    }
  }

  for (const skillName of roleKitSkills) {
    const normalized = normalizeSkillName(skillName);
    if (skillMap.has(normalized)) {
      const existing = skillMap.get(normalized)!;
      existing.weight += 0.5;
    } else {
      skillMap.set(normalized, {
        skill: normalized,
        category: categorizeSkill(normalized),
        weight: 0.5,
        source: "role_kit",
      });
    }
  }

  const allSkills = Array.from(skillMap.values()).sort((a, b) => b.weight - a.weight);

  const primaryLanguages = allSkills
    .filter(s => s.category === "language")
    .slice(0, 3)
    .map(s => s.skill);

  const frameworks = allSkills
    .filter(s => s.category === "framework")
    .slice(0, 3)
    .map(s => s.skill);

  const domains = allSkills
    .filter(s => s.category === "domain")
    .slice(0, 2)
    .map(s => s.skill);

  const combinedRequirements: string[] = [];
  const topSkills = allSkills.slice(0, 5);
  for (let i = 0; i < topSkills.length - 1; i++) {
    for (let j = i + 1; j < Math.min(i + 2, topSkills.length); j++) {
      combinedRequirements.push(`${topSkills[i].skill} + ${topSkills[j].skill}`);
    }
  }

  return {
    skills: allSkills,
    primaryLanguages,
    frameworks,
    domains,
    seniorityLevel: determineSeniorityLevel(allSkills),
    combinedRequirements: combinedRequirements.slice(0, 5),
  };
}

function determineSeniorityLevel(skills: SkillTag[]): CapabilityProfile["seniorityLevel"] {
  const conceptSkills = skills.filter(s => s.category === "concept" || s.category === "domain");
  const totalWeight = skills.reduce((sum, s) => sum + s.weight, 0);
  
  if (conceptSkills.length >= 5 && totalWeight > 20) return "lead";
  if (conceptSkills.length >= 3 && totalWeight > 15) return "senior";
  if (totalWeight > 8) return "mid";
  return "junior";
}

export async function generateCompositeProblem(
  profile: CapabilityProfile,
  existingExercises: { name: string; activityType: string }[],
  openai: OpenAI
): Promise<{
  title: string;
  description: string;
  activityType: "explain" | "debug" | "modify";
  language: string;
  difficulty: "easy" | "medium" | "hard";
  codeSnippet: string;
  expectedBehavior: string;
  skillsCovered: string[];
}> {
  const topSkills = profile.skills.slice(0, 4).map(s => s.skill);
  const primaryLanguage = profile.primaryLanguages[0] || "javascript";
  const combination = profile.combinedRequirements[0] || topSkills.join(" + ");

  const prompt = `Generate a coding exercise that tests multiple skills together: ${combination}.

Target language: ${primaryLanguage}
Difficulty: ${profile.seniorityLevel === "junior" ? "easy" : profile.seniorityLevel === "senior" || profile.seniorityLevel === "lead" ? "hard" : "medium"}
Skills to combine: ${topSkills.join(", ")}

Existing exercises to avoid duplicating:
${existingExercises.map(e => `- ${e.name} (${e.activityType})`).join("\n")}

Create a realistic, practical problem that:
1. Tests at least 2 of the listed skills together
2. Is based on a real-world scenario
3. Has clear success criteria
4. Takes 15-20 minutes to complete

Return JSON with this structure:
{
  "title": "Problem title",
  "description": "Detailed problem description with context",
  "activityType": "explain" | "debug" | "modify",
  "language": "${primaryLanguage}",
  "difficulty": "easy" | "medium" | "hard",
  "codeSnippet": "The code to work with (properly escaped)",
  "expectedBehavior": "What the correct solution should do",
  "skillsCovered": ["skill1", "skill2"]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  
  return {
    title: result.title || `${combination} Challenge`,
    description: result.description || `Apply your ${combination} skills to solve this problem.`,
    activityType: result.activityType || "explain",
    language: result.language || primaryLanguage,
    difficulty: result.difficulty || "medium",
    codeSnippet: result.codeSnippet || "// Your code here",
    expectedBehavior: result.expectedBehavior || "Complete the task successfully",
    skillsCovered: result.skillsCovered || topSkills,
  };
}

export function matchExercisesToProfile(
  exercises: Array<{
    id: number;
    name: string;
    activityType: string;
    language: string;
    difficulty: string;
    codeSnippet: string;
  }>,
  profile: CapabilityProfile
): Array<{ exercise: typeof exercises[0]; score: number; matchedSkills: string[] }> {
  const results: Array<{ exercise: typeof exercises[0]; score: number; matchedSkills: string[] }> = [];

  for (const exercise of exercises) {
    let score = 0;
    const matchedSkills: string[] = [];
    const exerciseText = `${exercise.name} ${exercise.codeSnippet}`.toLowerCase();

    for (const skill of profile.skills) {
      const skillLower = skill.skill.toLowerCase();
      if (exerciseText.includes(skillLower)) {
        score += skill.weight;
        matchedSkills.push(skill.skill);
      }
    }

    const exerciseLanguageLower = exercise.language.toLowerCase();
    if (profile.primaryLanguages.some(lang => lang.toLowerCase() === exerciseLanguageLower)) {
      score += 2;
    }

    if (matchedSkills.length >= 2) {
      score += 3;
    }

    results.push({ exercise, score, matchedSkills });
  }

  return results.sort((a, b) => b.score - a.score);
}
