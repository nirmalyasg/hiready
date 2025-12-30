import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export async function suggestRolesFromContext(scenarioDescription) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an expert at analyzing workplace conversation scenarios and identifying the roles of participants.

Given a scenario description, identify:
1. The role the user/learner is practicing (e.g., "Product Manager", "Team Lead", "Sales Representative")
2. The role the AI avatar should play as the counterpart (e.g., "Engineering Lead", "CEO", "Skeptical Client")

Focus on workplace professional roles. Be specific but concise (2-4 words per role).

Respond in JSON format:
{
  "userRole": "The role the user is practicing",
  "avatarRole": "The role the AI avatar will play",
  "rationale": "Brief explanation of why these roles fit the scenario"
}`
                },
                {
                    role: "user",
                    content: `Analyze this scenario and suggest appropriate roles for the user and avatar:\n\n${scenarioDescription}`
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
            max_tokens: 300,
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No response from OpenAI");
        }
        const parsed = JSON.parse(content);
        return {
            userRole: parsed.userRole || "Professional",
            avatarRole: parsed.avatarRole || "Stakeholder",
            rationale: parsed.rationale || "Roles inferred from context",
        };
    }
    catch (error) {
        console.error("Error suggesting roles:", error);
        return {
            userRole: "Professional",
            avatarRole: "Stakeholder",
            rationale: "Default roles (AI suggestion failed)",
        };
    }
}
export async function analyzeScenarioContext(scenarioDescription) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an expert at analyzing workplace conversation scenarios. Given a scenario description, provide a complete analysis with:

1. **Title**: A clear, concise title for this practice scenario (5-8 words, action-oriented, e.g., "Giving Constructive Feedback to Junior Designer")
2. **Roles**: Identify specific professional roles for both the user and the person they're talking to
3. **Relationship**: Determine the relationship dynamic between the two parties
4. **Challenges**: Identify 2-3 specific challenges that make this conversation difficult (unique to this scenario, not generic)
5. **Objective**: What the user likely wants to achieve

Be specific to THIS scenario - avoid generic options. Generate context-specific challenges and relationship descriptors.

Respond in JSON format:
{
  "title": "Clear scenario title (5-8 words)",
  "userRole": "Specific professional role (2-4 words)",
  "avatarRole": "Specific professional role for the counterpart (2-4 words)",
  "rationale": "Brief explanation of why these roles and analysis fit",
  "relationshipType": {
    "id": "snake_case_id",
    "label": "Human readable label",
    "description": "One sentence describing the power/role dynamic"
  },
  "challenges": [
    {
      "id": "unique_snake_case_id",
      "label": "Short challenge name (2-4 words)",
      "description": "Why this makes the conversation harder"
    }
  ],
  "suggestedObjective": {
    "id": "objective_id",
    "label": "What the user wants to achieve",
    "description": "More detail on the goal"
  }
}`
                },
                {
                    role: "user",
                    content: `Analyze this scenario completely:\n\n${scenarioDescription}`
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.4,
            max_tokens: 800,
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No response from OpenAI");
        }
        const parsed = JSON.parse(content);
        return {
            title: parsed.title || "Practice Scenario",
            userRole: parsed.userRole || "Professional",
            avatarRole: parsed.avatarRole || "Stakeholder",
            rationale: parsed.rationale || "Analysis based on context",
            relationshipType: parsed.relationshipType || {
                id: "professional_peer",
                label: "Professional Peer",
                description: "Working relationship between colleagues"
            },
            challenges: parsed.challenges || [{
                    id: "communication_gap",
                    label: "Communication Gap",
                    description: "Difficulty in clearly conveying needs or expectations"
                }],
            suggestedObjective: parsed.suggestedObjective || {
                id: "resolve",
                label: "Resolve the situation",
                description: "Find a workable solution"
            }
        };
    }
    catch (error) {
        console.error("Error analyzing scenario:", error);
        return {
            title: "Practice Scenario",
            userRole: "Professional",
            avatarRole: "Stakeholder",
            rationale: "Default analysis (AI analysis failed)",
            relationshipType: {
                id: "professional_relationship",
                label: "Professional Relationship",
                description: "General workplace relationship"
            },
            challenges: [{
                    id: "general_difficulty",
                    label: "Challenging Conversation",
                    description: "This conversation requires careful navigation"
                }],
            suggestedObjective: {
                id: "resolve",
                label: "Resolve the situation",
                description: "Find a workable solution"
            }
        };
    }
}
