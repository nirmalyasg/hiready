export interface Scenario {
  key: string;
  name: string;
  description: string;
  context?: string;
  instructions?: string;
  avatarRole?: string;
  avatarName?: string;
  skillId?: string;
}

export const SCENARIOS: Scenario[] = [
  {
    key: "difficult-feedback",
    name: "Delivering Difficult Feedback",
    description: "Practice delivering constructive but difficult feedback to a direct report about their performance issues.",
    context: "You are an employee who has been underperforming recently. You may be defensive or emotional when receiving feedback.",
    instructions: "React realistically to the feedback. Start somewhat defensive but be open to genuine, well-delivered feedback.",
    avatarRole: "employee",
    avatarName: "Alex",
    skillId: "feedback",
  },
  {
    key: "salary-negotiation",
    name: "Salary Negotiation",
    description: "Practice negotiating a salary increase with your manager during a performance review.",
    context: "You are a manager who has budget constraints but values this employee. You can offer some flexibility but not unlimited.",
    instructions: "Be fair but firm about budget limitations. Respond positively to well-reasoned arguments.",
    avatarRole: "manager",
    avatarName: "Jordan",
    skillId: "negotiation",
  },
  {
    key: "conflict-resolution",
    name: "Team Conflict Resolution",
    description: "Practice mediating a conflict between two team members with different working styles.",
    context: "You are a frustrated team member who feels their concerns haven't been heard. You want resolution but are skeptical.",
    instructions: "Express frustration initially but be willing to find common ground if the mediator is skilled.",
    avatarRole: "team member",
    avatarName: "Sam",
    skillId: "conflict",
  },
  {
    key: "project-pushback",
    name: "Handling Project Pushback",
    description: "Practice responding to stakeholder pushback on project timelines or scope.",
    context: "You are a stakeholder who is unhappy with the proposed timeline. You have pressure from above to deliver faster.",
    instructions: "Be demanding but reasonable. Respond well to clear explanations and alternative solutions.",
    avatarRole: "stakeholder",
    avatarName: "Taylor",
    skillId: "stakeholder",
  },
  {
    key: "delegation",
    name: "Effective Delegation",
    description: "Practice delegating a complex task to a team member while ensuring clarity and buy-in.",
    context: "You are an employee who is already feeling overworked. You're uncertain about taking on new responsibilities.",
    instructions: "Express concerns about workload. Be receptive to clear explanations of priority and support.",
    avatarRole: "employee",
    avatarName: "Casey",
    skillId: "delegation",
  },
];

export default function RoleplayScenariosPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Practice Scenarios</h1>
      <div className="grid gap-4">
        {SCENARIOS.map((scenario) => (
          <div key={scenario.key} className="p-4 border rounded-lg">
            <h2 className="font-semibold">{scenario.name}</h2>
            <p className="text-gray-600">{scenario.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
