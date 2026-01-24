/**
 * Comprehensive Competency Frameworks for Interview Planning
 *
 * This module defines structured frameworks for:
 * 1. Behavioral Competencies (10 core competencies)
 * 2. Leadership Competencies (8 leadership dimensions)
 * 3. Technical Assessment Areas (coding, case study, system design)
 * 4. Domain/Functional Knowledge Areas (company, market, industry)
 */

// ============================================================
// TYPES
// ============================================================

export interface CompetencyDimension {
  id: string;
  name: string;
  description: string;
  signals: {
    strong: string[];
    weak: string[];
  };
  sampleQuestions: {
    entry: string[];
    mid: string[];
    senior: string[];
  };
  followUpProbes: string[];
  assessmentWeight: number; // 1-5, relative importance
}

export interface CompetencyFramework {
  id: string;
  name: string;
  description: string;
  dimensions: CompetencyDimension[];
  interviewTypes: string[];
}

export interface TechnicalAssessmentArea {
  id: string;
  name: string;
  description: string;
  skillCategories: string[];
  assessmentFormats: ("coding" | "case_study" | "system_design" | "verbal" | "whiteboard")[];
  difficultyLevels: {
    entry: string;
    mid: string;
    senior: string;
    staff: string;
  };
  evaluationCriteria: string[];
}

export interface DomainKnowledgeArea {
  id: string;
  name: string;
  description: string;
  topicsToAssess: string[];
  sampleQuestions: string[];
  depthIndicators: {
    shallow: string;
    moderate: string;
    deep: string;
  };
}

// ============================================================
// BEHAVIORAL COMPETENCIES (10 Core Competencies)
// ============================================================

export const BEHAVIORAL_COMPETENCIES: CompetencyFramework = {
  id: "behavioral",
  name: "Behavioral Competencies",
  description: "10 core behavioral competencies assessed through STAR-format questions",
  interviewTypes: ["behavioral", "hr", "hiring_manager", "panel"],
  dimensions: [
    {
      id: "ownership_accountability",
      name: "Ownership & Accountability",
      description: "Taking responsibility for outcomes, going beyond job description, and following through on commitments",
      signals: {
        strong: [
          "Uses 'I' statements to describe personal contributions",
          "Describes taking initiative without being asked",
          "Shows end-to-end ownership from problem to solution",
          "Acknowledges mistakes and explains lessons learned",
          "Provides measurable impact of their work"
        ],
        weak: [
          "Uses 'we' without clarifying personal role",
          "Blames others or circumstances for failures",
          "Shows passive involvement in projects",
          "Cannot articulate specific personal impact",
          "Deflects responsibility for negative outcomes"
        ]
      },
      sampleQuestions: {
        entry: [
          "Tell me about a project where you took complete ownership. What was the outcome?",
          "Describe a time when you went above and beyond your assigned responsibilities.",
          "Give an example of when you made a mistake at work. How did you handle it?"
        ],
        mid: [
          "Tell me about a time when you identified a problem no one else noticed and took action to fix it.",
          "Describe a situation where you had to make a decision without all the information. What did you do?",
          "Give an example of when you took responsibility for a team failure. How did you handle it?"
        ],
        senior: [
          "Describe a time when you drove a major initiative end-to-end. What obstacles did you face?",
          "Tell me about a strategic decision you made that had significant business impact.",
          "How have you established a culture of accountability in your team?"
        ]
      },
      followUpProbes: [
        "What specifically did YOU do vs. the team?",
        "What would have happened if you hadn't stepped in?",
        "How did you measure the impact of your actions?",
        "What would you do differently next time?"
      ],
      assessmentWeight: 5
    },
    {
      id: "problem_solving",
      name: "Problem Solving & Analytical Thinking",
      description: "Ability to break down complex problems, identify root causes, and develop effective solutions",
      signals: {
        strong: [
          "Structures problems into manageable components",
          "Uses data and evidence to drive decisions",
          "Considers multiple solutions before acting",
          "Anticipates second-order effects",
          "Iterates based on feedback and results"
        ],
        weak: [
          "Jumps to solutions without understanding the problem",
          "Relies on intuition without data",
          "Cannot articulate their reasoning process",
          "Misses obvious alternatives",
          "Doesn't learn from failed approaches"
        ]
      },
      sampleQuestions: {
        entry: [
          "Walk me through how you would approach solving a new problem you've never seen before.",
          "Tell me about a time when you had to figure something out on your own.",
          "Describe a challenging problem you solved. What was your approach?"
        ],
        mid: [
          "Tell me about a complex problem you solved. What frameworks or methods did you use?",
          "Describe a time when your initial solution didn't work. How did you adapt?",
          "Give an example of when you used data to make a difficult decision."
        ],
        senior: [
          "Describe the most complex problem you've solved in your career. Walk me through your approach.",
          "Tell me about a time when you had to make a decision with incomplete or conflicting data.",
          "How do you approach problems that span multiple teams or systems?"
        ]
      },
      followUpProbes: [
        "What alternatives did you consider?",
        "How did you validate your solution?",
        "What data points informed your decision?",
        "What was the root cause vs. the symptoms?"
      ],
      assessmentWeight: 5
    },
    {
      id: "collaboration_teamwork",
      name: "Collaboration & Teamwork",
      description: "Working effectively with others, building relationships, and contributing to team success",
      signals: {
        strong: [
          "Shares credit and acknowledges others' contributions",
          "Actively seeks input from diverse perspectives",
          "Adapts communication style to different audiences",
          "Helps teammates succeed, even at personal cost",
          "Builds lasting professional relationships"
        ],
        weak: [
          "Takes individual credit for team achievements",
          "Works in isolation without engaging others",
          "Struggles to collaborate with different personalities",
          "Prioritizes personal goals over team objectives",
          "Cannot provide examples of helping others"
        ]
      },
      sampleQuestions: {
        entry: [
          "Tell me about a successful team project you were part of. What was your role?",
          "Describe a time when you helped a teammate who was struggling.",
          "How do you typically contribute to team discussions?"
        ],
        mid: [
          "Describe a time when you had to work with someone whose style was very different from yours.",
          "Tell me about a cross-functional project. How did you ensure alignment across teams?",
          "Give an example of when you had to build consensus among stakeholders with different priorities."
        ],
        senior: [
          "How do you foster collaboration across teams with competing priorities?",
          "Tell me about a time when you had to align multiple stakeholders on a controversial decision.",
          "Describe how you've built and maintained relationships with key partners or executives."
        ]
      },
      followUpProbes: [
        "How did you handle disagreements within the team?",
        "What did you do to ensure everyone's voice was heard?",
        "How did you build trust with this person/team?",
        "What was the outcome for the team?"
      ],
      assessmentWeight: 4
    },
    {
      id: "communication",
      name: "Communication & Influence",
      description: "Articulating ideas clearly, adapting to audiences, and persuading others effectively",
      signals: {
        strong: [
          "Tailors message to the audience's level and needs",
          "Uses concrete examples and data to support points",
          "Listens actively and incorporates feedback",
          "Structures communication logically",
          "Influences without authority"
        ],
        weak: [
          "Rambles or provides unclear explanations",
          "Uses jargon inappropriately",
          "Talks over others or doesn't listen",
          "Cannot adjust style for different audiences",
          "Relies on authority rather than persuasion"
        ]
      },
      sampleQuestions: {
        entry: [
          "Tell me about a time when you had to explain something technical to a non-technical person.",
          "Describe a situation where you had to persuade someone to see your point of view.",
          "How do you ensure your written communication is clear and effective?"
        ],
        mid: [
          "Describe a time when you had to deliver a difficult message. How did you approach it?",
          "Tell me about a situation where you influenced a decision without having direct authority.",
          "Give an example of when you had to adjust your communication style significantly."
        ],
        senior: [
          "Tell me about a time when you presented to executives or the board. How did you prepare?",
          "Describe how you've influenced organizational strategy or direction.",
          "How do you communicate bad news or push back on senior leadership?"
        ]
      },
      followUpProbes: [
        "How did you know your message was understood?",
        "What objections did you encounter and how did you address them?",
        "How did you prepare for this communication?",
        "What would you change about your approach?"
      ],
      assessmentWeight: 4
    },
    {
      id: "adaptability_resilience",
      name: "Adaptability & Resilience",
      description: "Handling change, bouncing back from setbacks, and thriving in ambiguous situations",
      signals: {
        strong: [
          "Maintains effectiveness during periods of change",
          "Views setbacks as learning opportunities",
          "Proactively adapts to new information or circumstances",
          "Stays calm under pressure",
          "Embraces ambiguity and uncertainty"
        ],
        weak: [
          "Resists change or clings to old ways",
          "Gets derailed by setbacks",
          "Needs extensive guidance in ambiguous situations",
          "Shows stress or frustration when plans change",
          "Struggles to prioritize in uncertain environments"
        ]
      },
      sampleQuestions: {
        entry: [
          "Tell me about a time when you had to adapt to a significant change at work or school.",
          "Describe a setback you faced. How did you handle it?",
          "How do you approach tasks when you don't have clear instructions?"
        ],
        mid: [
          "Describe a project where the requirements changed significantly mid-stream. How did you adapt?",
          "Tell me about a time when you failed. What did you learn and how did you bounce back?",
          "Give an example of when you thrived in an ambiguous situation."
        ],
        senior: [
          "Tell me about leading through a major organizational change. How did you maintain team morale?",
          "Describe the biggest professional setback of your career. How did it shape you?",
          "How do you make decisions when you have incomplete information and high stakes?"
        ]
      },
      followUpProbes: [
        "What was your initial reaction to the change?",
        "How did you maintain your effectiveness during this period?",
        "What strategies do you use to manage stress?",
        "How did this experience change your approach?"
      ],
      assessmentWeight: 4
    },
    {
      id: "customer_focus",
      name: "Customer Focus & Empathy",
      description: "Understanding customer needs, advocating for user experience, and delivering value",
      signals: {
        strong: [
          "Actively seeks customer feedback and insights",
          "Makes decisions with customer impact in mind",
          "Advocates for user experience improvements",
          "Understands the 'why' behind customer requests",
          "Balances customer needs with business constraints"
        ],
        weak: [
          "Doesn't consider end-user impact",
          "Makes assumptions without validating with customers",
          "Prioritizes technical elegance over user value",
          "Cannot articulate who the customer is",
          "Dismisses customer feedback or complaints"
        ]
      },
      sampleQuestions: {
        entry: [
          "Tell me about a time when you went out of your way to help a customer or end user.",
          "How do you typically gather feedback about your work from users?",
          "Describe a time when you had to balance what a customer wanted with what was feasible."
        ],
        mid: [
          "Describe a situation where you identified an unmet customer need. What did you do?",
          "Tell me about a time when you had to push back on a customer request. How did you handle it?",
          "Give an example of when customer feedback significantly changed your approach."
        ],
        senior: [
          "How do you build a customer-centric culture within your team?",
          "Tell me about a time when you made a controversial decision that prioritized long-term customer value.",
          "Describe how you've used customer insights to drive strategic decisions."
        ]
      },
      followUpProbes: [
        "How did you understand the customer's underlying needs?",
        "What tradeoffs did you have to make?",
        "How did you measure customer satisfaction?",
        "What did you learn about customer behavior?"
      ],
      assessmentWeight: 3
    },
    {
      id: "results_orientation",
      name: "Results Orientation & Drive",
      description: "Setting ambitious goals, maintaining focus, and delivering outcomes consistently",
      signals: {
        strong: [
          "Sets specific, measurable goals",
          "Maintains focus despite obstacles",
          "Prioritizes high-impact activities",
          "Delivers consistently against commitments",
          "Pushes for continuous improvement"
        ],
        weak: [
          "Sets vague or unambitious goals",
          "Gets distracted by low-priority tasks",
          "Misses deadlines or commitments",
          "Satisfied with 'good enough'",
          "Cannot articulate impact of their work"
        ]
      },
      sampleQuestions: {
        entry: [
          "Tell me about a goal you set for yourself. How did you achieve it?",
          "Describe a time when you had to work hard to meet a deadline.",
          "What's an accomplishment you're most proud of?"
        ],
        mid: [
          "Tell me about the most impactful project you've delivered. What made it successful?",
          "Describe a time when you exceeded expectations. What drove you?",
          "How do you prioritize when you have multiple competing deadlines?"
        ],
        senior: [
          "Tell me about a goal that seemed impossible but you achieved anyway.",
          "Describe how you've built a high-performing team that consistently delivers results.",
          "What's the biggest impact you've had on business metrics?"
        ]
      },
      followUpProbes: [
        "How did you measure success?",
        "What obstacles did you overcome?",
        "How did you stay motivated when things got difficult?",
        "What would 'great' have looked like vs. 'good'?"
      ],
      assessmentWeight: 4
    },
    {
      id: "learning_agility",
      name: "Learning Agility & Growth Mindset",
      description: "Continuously learning, seeking feedback, and applying new knowledge quickly",
      signals: {
        strong: [
          "Actively seeks feedback and acts on it",
          "Learns new skills quickly when needed",
          "Admits knowledge gaps openly",
          "Applies lessons from past experiences",
          "Stays current with industry trends"
        ],
        weak: [
          "Defensive when receiving feedback",
          "Relies only on existing knowledge",
          "Doesn't seek out learning opportunities",
          "Repeats same mistakes",
          "Shows fixed mindset about abilities"
        ]
      },
      sampleQuestions: {
        entry: [
          "Tell me about something new you learned recently. How did you go about learning it?",
          "Describe a time when you received constructive feedback. How did you respond?",
          "What do you do when you encounter something you don't know?"
        ],
        mid: [
          "Tell me about a skill you had to develop quickly for a project. How did you approach it?",
          "Describe a time when feedback changed your approach significantly.",
          "How do you stay current in your field?"
        ],
        senior: [
          "How do you continue to grow and learn at this stage of your career?",
          "Tell me about a time when you had to unlearn something to be effective.",
          "How do you create a learning culture within your team?"
        ]
      },
      followUpProbes: [
        "How did you apply what you learned?",
        "What was the hardest part of learning this?",
        "How do you typically seek out feedback?",
        "What's on your learning roadmap?"
      ],
      assessmentWeight: 3
    },
    {
      id: "conflict_resolution",
      name: "Conflict Resolution & Difficult Conversations",
      description: "Navigating disagreements constructively, having tough conversations, and finding win-win solutions",
      signals: {
        strong: [
          "Addresses conflicts directly and professionally",
          "Seeks to understand others' perspectives",
          "Finds solutions that satisfy multiple parties",
          "Doesn't avoid difficult conversations",
          "Maintains relationships through disagreements"
        ],
        weak: [
          "Avoids conflict or lets issues fester",
          "Takes disagreements personally",
          "Forces their view without listening",
          "Escalates conflicts unnecessarily",
          "Burns bridges in disagreements"
        ]
      },
      sampleQuestions: {
        entry: [
          "Tell me about a time when you disagreed with a teammate. How did you handle it?",
          "Describe a difficult conversation you had to have. What was the outcome?",
          "How do you typically handle situations where you and a colleague have different opinions?"
        ],
        mid: [
          "Describe a significant conflict you resolved at work. What was your approach?",
          "Tell me about a time when you had to give someone difficult feedback.",
          "How do you handle disagreements with your manager or leadership?"
        ],
        senior: [
          "Tell me about a time when you had to resolve a conflict between teams or departments.",
          "Describe the most difficult conversation you've had as a leader. How did you prepare?",
          "How do you create an environment where healthy conflict is encouraged?"
        ]
      },
      followUpProbes: [
        "What was the other person's perspective?",
        "How did you prepare for this conversation?",
        "What was the relationship like afterward?",
        "What would you do differently?"
      ],
      assessmentWeight: 4
    },
    {
      id: "integrity_ethics",
      name: "Integrity & Ethical Judgment",
      description: "Demonstrating honesty, ethical decision-making, and trustworthiness",
      signals: {
        strong: [
          "Speaks truth even when uncomfortable",
          "Keeps commitments and follows through",
          "Makes ethical decisions even under pressure",
          "Maintains confidentiality appropriately",
          "Owns mistakes transparently"
        ],
        weak: [
          "Exaggerates accomplishments or capabilities",
          "Makes promises they can't keep",
          "Cuts corners when convenient",
          "Blames others for their mistakes",
          "Shows inconsistency between words and actions"
        ]
      },
      sampleQuestions: {
        entry: [
          "Tell me about a time when you had to be honest even though it was difficult.",
          "Describe a situation where you saw something that didn't seem right. What did you do?",
          "How do you build trust with teammates?"
        ],
        mid: [
          "Tell me about a time when you faced an ethical dilemma at work. How did you handle it?",
          "Describe a situation where doing the right thing came at a personal cost.",
          "How do you handle situations where you're asked to do something you disagree with?"
        ],
        senior: [
          "Tell me about a time when you had to make an unpopular decision because it was the right thing to do.",
          "How do you set the ethical tone for your team?",
          "Describe a situation where business pressure conflicted with ethical considerations."
        ]
      },
      followUpProbes: [
        "What was at stake for you personally?",
        "How did you decide what the right thing to do was?",
        "What would have happened if you hadn't spoken up?",
        "How do you balance transparency with discretion?"
      ],
      assessmentWeight: 5
    }
  ]
};

// ============================================================
// LEADERSHIP COMPETENCIES (8 Leadership Dimensions)
// ============================================================

export const LEADERSHIP_COMPETENCIES: CompetencyFramework = {
  id: "leadership",
  name: "Leadership Competencies",
  description: "8 core leadership dimensions for manager, director, and executive roles",
  interviewTypes: ["leadership", "hiring_manager", "panel", "executive"],
  dimensions: [
    {
      id: "strategic_thinking",
      name: "Strategic Thinking & Vision",
      description: "Setting direction, anticipating future trends, and connecting team work to business strategy",
      signals: {
        strong: [
          "Articulates clear vision for team/org",
          "Connects day-to-day work to broader strategy",
          "Anticipates industry trends and disruptions",
          "Makes tradeoffs aligned with strategic priorities",
          "Thinks beyond immediate team to organizational impact"
        ],
        weak: [
          "Focuses only on tactical execution",
          "Cannot articulate team's strategic value",
          "Reactive rather than proactive",
          "Makes decisions without strategic context",
          "Misses broader organizational implications"
        ]
      },
      sampleQuestions: {
        entry: [
          "How do you connect your daily work to the company's bigger goals?",
          "What trends do you see in your industry that might affect your role?"
        ],
        mid: [
          "Describe how you've contributed to your team's strategic direction.",
          "Tell me about a time when you identified a strategic opportunity or risk."
        ],
        senior: [
          "How do you set the strategic direction for your team? Walk me through your process.",
          "Tell me about a time when you had to pivot your strategy based on market changes.",
          "How do you balance short-term execution with long-term strategic goals?",
          "Describe how you've influenced organizational strategy beyond your immediate team."
        ]
      },
      followUpProbes: [
        "How did you communicate this vision to your team?",
        "What data or insights informed your strategic thinking?",
        "How did you get buy-in for this direction?",
        "What tradeoffs did you have to make?"
      ],
      assessmentWeight: 5
    },
    {
      id: "people_development",
      name: "People Development & Coaching",
      description: "Growing team members, providing feedback, and building capabilities",
      signals: {
        strong: [
          "Provides regular, specific feedback",
          "Creates development plans for team members",
          "Delegates challenging work for growth",
          "Has track record of promoting people",
          "Invests time in coaching and mentoring"
        ],
        weak: [
          "Doesn't prioritize 1:1s or feedback",
          "Hoards work instead of delegating",
          "Team members don't grow or get promoted",
          "Only gives feedback during reviews",
          "Cannot articulate team members' career goals"
        ]
      },
      sampleQuestions: {
        entry: [
          "Have you ever helped mentor or train someone? How did you approach it?"
        ],
        mid: [
          "Describe how you've helped someone on your team develop and grow.",
          "Tell me about a time when you had to give difficult feedback. How did you handle it?"
        ],
        senior: [
          "Tell me about someone you've developed who went on to significant success.",
          "How do you approach performance management across your team?",
          "Describe your philosophy on delegation and development.",
          "How do you handle underperformers while maintaining team morale?"
        ]
      },
      followUpProbes: [
        "How did you identify their development needs?",
        "What specific actions did you take to help them grow?",
        "How do you balance pushing people with supporting them?",
        "What's your approach to feedback frequency and format?"
      ],
      assessmentWeight: 5
    },
    {
      id: "decision_making",
      name: "Decision Making & Judgment",
      description: "Making sound decisions with incomplete information, managing risk, and owning outcomes",
      signals: {
        strong: [
          "Makes timely decisions with available information",
          "Considers multiple perspectives before deciding",
          "Takes calculated risks appropriately",
          "Owns decision outcomes, including failures",
          "Knows when to escalate vs. decide independently"
        ],
        weak: [
          "Analysis paralysis or avoids decisions",
          "Makes decisions without stakeholder input",
          "Either too risk-averse or too reckless",
          "Blames others when decisions go wrong",
          "Always escalates instead of deciding"
        ]
      },
      sampleQuestions: {
        entry: [
          "Tell me about a decision you made with limited information. How did you approach it?"
        ],
        mid: [
          "Describe a high-stakes decision you made. What was your process?",
          "Tell me about a decision that didn't turn out as expected. What did you learn?"
        ],
        senior: [
          "Walk me through your decision-making framework for high-impact choices.",
          "Tell me about the toughest decision you've made as a leader.",
          "How do you balance speed of decision-making with thoroughness?",
          "Describe a time when you had to reverse a previous decision. How did you handle it?"
        ]
      },
      followUpProbes: [
        "What information did you have vs. what did you wish you had?",
        "Who did you involve in the decision process?",
        "How did you communicate the decision and rationale?",
        "What would you do differently knowing what you know now?"
      ],
      assessmentWeight: 5
    },
    {
      id: "team_building",
      name: "Team Building & Culture",
      description: "Building high-performing teams, fostering culture, and creating psychological safety",
      signals: {
        strong: [
          "Attracts and retains top talent",
          "Creates psychologically safe environment",
          "Builds diverse and inclusive teams",
          "Establishes clear team norms and values",
          "Team members speak highly of working with them"
        ],
        weak: [
          "High team turnover",
          "Creates fear-based culture",
          "Builds homogeneous teams",
          "Inconsistent standards or favoritism",
          "Team members don't feel safe to speak up"
        ]
      },
      sampleQuestions: {
        entry: [
          "What makes a great team in your experience? How do you contribute to that?"
        ],
        mid: [
          "Describe the best team you've been part of. What made it work?",
          "How do you build trust within a team?"
        ],
        senior: [
          "How do you build and maintain a high-performing team culture?",
          "Tell me about a team you built from scratch or significantly transformed.",
          "How do you create an environment where people feel safe to take risks and fail?",
          "What's your approach to building diverse and inclusive teams?"
        ]
      },
      followUpProbes: [
        "How do you handle cultural fit during hiring?",
        "What rituals or practices do you use to build team cohesion?",
        "How do you know if your team culture is healthy?",
        "How have you addressed toxic behaviors on your team?"
      ],
      assessmentWeight: 4
    },
    {
      id: "stakeholder_management",
      name: "Stakeholder Management & Influence",
      description: "Managing up, across, and down; navigating organizational dynamics; building alliances",
      signals: {
        strong: [
          "Effectively manages expectations up and across",
          "Builds strong relationships with key stakeholders",
          "Navigates organizational politics constructively",
          "Influences without direct authority",
          "Proactively communicates to stakeholders"
        ],
        weak: [
          "Surprises stakeholders with bad news",
          "Cannot navigate organizational dynamics",
          "Burns bridges or creates adversarial relationships",
          "Only manages in one direction (up or down)",
          "Avoids difficult stakeholder conversations"
        ]
      },
      sampleQuestions: {
        entry: [
          "How do you keep stakeholders informed about your work?"
        ],
        mid: [
          "Describe how you've managed expectations with a difficult stakeholder.",
          "Tell me about a time when you had to influence someone outside your reporting chain."
        ],
        senior: [
          "How do you manage relationships with executives and board members?",
          "Tell me about navigating a politically complex situation in your organization.",
          "How do you balance competing stakeholder priorities?",
          "Describe how you've built strategic alliances to accomplish your goals."
        ]
      },
      followUpProbes: [
        "How did you understand their priorities and concerns?",
        "What did you do when stakeholders disagreed with each other?",
        "How do you rebuild a damaged stakeholder relationship?",
        "How do you say no to powerful stakeholders?"
      ],
      assessmentWeight: 4
    },
    {
      id: "execution_delivery",
      name: "Execution & Delivery",
      description: "Translating strategy into action, driving accountability, and delivering results at scale",
      signals: {
        strong: [
          "Consistently delivers on commitments",
          "Removes blockers for team execution",
          "Creates clear milestones and accountability",
          "Balances quality with speed appropriately",
          "Scales execution processes as team grows"
        ],
        weak: [
          "Misses deadlines or over-promises",
          "Micromanages execution",
          "Cannot articulate why projects are delayed",
          "Team frequently firefighting",
          "Execution processes don't scale"
        ]
      },
      sampleQuestions: {
        entry: [
          "How do you ensure you deliver on your commitments?"
        ],
        mid: [
          "Tell me about a complex project you drove to completion. What challenges did you face?",
          "How do you handle competing priorities and ensure critical work gets done?"
        ],
        senior: [
          "How do you drive execution across your organization?",
          "Tell me about the largest or most complex initiative you've delivered.",
          "How do you create accountability without micromanaging?",
          "Describe how you've improved execution processes or systems at scale."
        ]
      },
      followUpProbes: [
        "How do you know if execution is on track?",
        "What do you do when a project starts slipping?",
        "How do you prioritize when everything seems urgent?",
        "What systems or processes have you put in place to drive accountability?"
      ],
      assessmentWeight: 4
    },
    {
      id: "change_leadership",
      name: "Change Leadership & Transformation",
      description: "Leading through change, driving transformation, and building change capability",
      signals: {
        strong: [
          "Successfully led significant change initiatives",
          "Communicates change vision effectively",
          "Manages resistance constructively",
          "Sustains change over time",
          "Builds organizational change capability"
        ],
        weak: [
          "Avoids or delays necessary changes",
          "Poor change communication",
          "Changes don't stick or backslide",
          "Creates change fatigue",
          "Doesn't prepare organization for change"
        ]
      },
      sampleQuestions: {
        entry: [
          "Tell me about a change you adapted to. How did you help others adapt?"
        ],
        mid: [
          "Describe a change initiative you led or contributed to significantly.",
          "How did you handle resistance to a change?"
        ],
        senior: [
          "Tell me about leading a major organizational transformation.",
          "How do you build a change-ready culture?",
          "Describe a change that failed and what you learned.",
          "How do you balance the pace of change with organizational capacity?"
        ]
      },
      followUpProbes: [
        "How did you communicate the need for change?",
        "How did you handle people who resisted?",
        "How did you sustain the change over time?",
        "What would you do differently?"
      ],
      assessmentWeight: 4
    },
    {
      id: "business_acumen",
      name: "Business Acumen & Financial Judgment",
      description: "Understanding business drivers, making commercially sound decisions, managing resources",
      signals: {
        strong: [
          "Understands business model and financials",
          "Makes decisions with ROI mindset",
          "Manages budgets and resources effectively",
          "Connects team work to business outcomes",
          "Understands competitive landscape"
        ],
        weak: [
          "Cannot articulate business impact",
          "Doesn't consider cost or resource constraints",
          "Focuses only on technical excellence",
          "Doesn't understand how company makes money",
          "Cannot prioritize based on business value"
        ]
      },
      sampleQuestions: {
        entry: [
          "How does your work contribute to the company's business goals?"
        ],
        mid: [
          "How do you make decisions about where to invest your team's time?",
          "Tell me about a time when you had to justify a project or investment."
        ],
        senior: [
          "How do you connect your team's work to business outcomes and metrics?",
          "Walk me through how you manage your budget and make resource allocation decisions.",
          "Tell me about a time when you made a difficult tradeoff between technical quality and business needs.",
          "How do you stay informed about the competitive landscape and industry trends?"
        ]
      },
      followUpProbes: [
        "How did you quantify the business impact?",
        "What metrics do you use to measure success?",
        "How do you prioritize investments?",
        "How do you explain technical decisions in business terms?"
      ],
      assessmentWeight: 4
    }
  ]
};

// ============================================================
// TECHNICAL ASSESSMENT AREAS
// ============================================================

export const TECHNICAL_ASSESSMENT_AREAS: Record<string, TechnicalAssessmentArea> = {
  coding: {
    id: "coding",
    name: "Coding & Programming",
    description: "Ability to write clean, efficient, and correct code to solve problems",
    skillCategories: [
      "Data Structures",
      "Algorithms",
      "Problem Decomposition",
      "Code Quality",
      "Testing & Edge Cases",
      "Time/Space Complexity"
    ],
    assessmentFormats: ["coding", "whiteboard"],
    difficultyLevels: {
      entry: "Single concept, clear requirements, standard data structures (arrays, strings, basic loops)",
      mid: "Multiple concepts, moderate complexity, hash maps, trees, common algorithms",
      senior: "Complex problems, optimization required, advanced data structures, system considerations",
      staff: "Architecture-level coding, cross-system integration, performance at scale"
    },
    evaluationCriteria: [
      "Problem understanding and clarification",
      "Approach explanation and tradeoffs",
      "Code correctness and edge cases",
      "Code readability and style",
      "Time and space complexity analysis",
      "Testing approach"
    ]
  },
  case_study: {
    id: "case_study",
    name: "Case Study & Business Analysis",
    description: "Ability to analyze business problems, structure thinking, and provide recommendations",
    skillCategories: [
      "Framework Application",
      "Quantitative Analysis",
      "Logical Structuring",
      "Business Judgment",
      "Communication",
      "Recommendation Quality"
    ],
    assessmentFormats: ["case_study", "verbal"],
    difficultyLevels: {
      entry: "Straightforward case with clear data, single objective, guided structure",
      mid: "Multi-dimensional case, some ambiguity, requires prioritization and estimation",
      senior: "Complex case with incomplete data, multiple stakeholders, strategic implications",
      staff: "Executive-level case with organizational change, board presentation, cross-functional impact"
    },
    evaluationCriteria: [
      "Problem structuring and framework",
      "Hypothesis generation",
      "Quantitative analysis and estimation",
      "Synthesis of insights",
      "Actionable recommendations",
      "Communication and stakeholder awareness"
    ]
  },
  system_design: {
    id: "system_design",
    name: "System Design & Architecture",
    description: "Ability to design scalable, reliable, and maintainable systems",
    skillCategories: [
      "Requirements Gathering",
      "High-Level Design",
      "Component Design",
      "Data Modeling",
      "Scalability",
      "Reliability & Fault Tolerance"
    ],
    assessmentFormats: ["whiteboard", "verbal", "system_design"],
    difficultyLevels: {
      entry: "Simple system with limited components, focus on basic API design",
      mid: "Moderate system with multiple components, basic scaling considerations",
      senior: "Complex distributed system, detailed scaling, caching, consistency tradeoffs",
      staff: "Large-scale system, cross-team coordination, organizational constraints, cost optimization"
    },
    evaluationCriteria: [
      "Requirements clarification",
      "Capacity estimation",
      "API and data model design",
      "Component architecture",
      "Scalability and reliability patterns",
      "Tradeoff analysis"
    ]
  },
  sql_data: {
    id: "sql_data",
    name: "SQL & Data Analysis",
    description: "Ability to query, manipulate, and analyze data using SQL",
    skillCategories: [
      "Query Writing",
      "Joins and Aggregations",
      "Window Functions",
      "Query Optimization",
      "Data Modeling",
      "Data Quality"
    ],
    assessmentFormats: ["coding", "verbal"],
    difficultyLevels: {
      entry: "Basic SELECT, WHERE, simple JOINs, basic aggregations",
      mid: "Complex JOINs, subqueries, GROUP BY with HAVING, basic window functions",
      senior: "Advanced window functions, CTEs, query optimization, data modeling decisions",
      staff: "Performance tuning, large-scale data architecture, data pipeline design"
    },
    evaluationCriteria: [
      "Query correctness",
      "Efficiency and optimization",
      "Edge case handling",
      "Code readability",
      "Data modeling awareness",
      "Business context understanding"
    ]
  }
};

// ============================================================
// DOMAIN/FUNCTIONAL KNOWLEDGE AREAS
// ============================================================

export const DOMAIN_KNOWLEDGE_AREAS: Record<string, DomainKnowledgeArea> = {
  company_knowledge: {
    id: "company_knowledge",
    name: "Company Knowledge",
    description: "Understanding of the target company's products, services, culture, and strategic direction",
    topicsToAssess: [
      "Company mission and values",
      "Products and services overview",
      "Recent news and developments",
      "Competitive positioning",
      "Company culture and work style",
      "Growth trajectory and funding (if relevant)"
    ],
    sampleQuestions: [
      "What do you know about our company and what attracted you to this role?",
      "How do you see our products/services fitting into the market?",
      "What do you think are the biggest challenges facing our company right now?",
      "Have you used any of our products? What was your experience?",
      "What aspects of our company culture appeal to you?"
    ],
    depthIndicators: {
      shallow: "Only knows company name and basic description from job posting",
      moderate: "Has researched products, recent news, and competitive landscape",
      deep: "Understands business model, strategic challenges, and has insights on opportunities"
    }
  },
  industry_knowledge: {
    id: "industry_knowledge",
    name: "Industry & Market Knowledge",
    description: "Understanding of the broader industry, market dynamics, and trends",
    topicsToAssess: [
      "Industry trends and disruptions",
      "Key players and competitive landscape",
      "Regulatory environment",
      "Customer/market segments",
      "Technology trends affecting the industry",
      "Business models in the space"
    ],
    sampleQuestions: [
      "What trends do you see shaping our industry over the next 3-5 years?",
      "Who do you see as our main competitors and why?",
      "How is technology changing this industry?",
      "What challenges do customers in this space typically face?",
      "What regulatory or compliance considerations are important in this industry?"
    ],
    depthIndicators: {
      shallow: "General awareness of industry without specific insights",
      moderate: "Can discuss trends, competitors, and basic market dynamics",
      deep: "Has nuanced understanding of industry evolution, can identify non-obvious opportunities/risks"
    }
  },
  business_domain: {
    id: "business_domain",
    name: "Business Domain Expertise",
    description: "Deep knowledge of the specific business domain relevant to the role",
    topicsToAssess: [
      "Domain-specific terminology and concepts",
      "Key metrics and KPIs",
      "Common problems and solutions",
      "Best practices and standards",
      "Domain-specific tools and technologies",
      "Stakeholder ecosystem"
    ],
    sampleQuestions: [
      "Walk me through the key metrics you would track for [domain function].",
      "What are the most common challenges in [domain] and how have you addressed them?",
      "Describe a best practice in [domain] that you've implemented.",
      "How do you stay current with developments in [domain]?",
      "What tools or technologies are essential for [domain] work?"
    ],
    depthIndicators: {
      shallow: "Textbook knowledge without practical application",
      moderate: "Has applied domain knowledge in real situations with concrete examples",
      deep: "Recognized expert who can challenge assumptions and introduce new approaches"
    }
  },
  functional_expertise: {
    id: "functional_expertise",
    name: "Functional Expertise",
    description: "Mastery of the specific functional area (engineering, product, data, etc.)",
    topicsToAssess: [
      "Core functional skills",
      "Methodologies and frameworks",
      "Tools and technologies",
      "Best practices",
      "Cross-functional collaboration",
      "Emerging approaches"
    ],
    sampleQuestions: [
      "What methodologies or frameworks do you use in your [function] work?",
      "How do you approach [specific functional challenge]?",
      "What tools are essential for your work and why?",
      "How do you collaborate with other functions (e.g., engineering with product)?",
      "What emerging trends in [function] are you most excited about?"
    ],
    depthIndicators: {
      shallow: "Can describe basic concepts but lacks practical depth",
      moderate: "Has hands-on experience and can discuss tradeoffs",
      deep: "Has shaped practices, mentored others, or contributed thought leadership"
    }
  }
};

// ============================================================
// INTERVIEW TYPE TO COMPETENCY MAPPING
// ============================================================

export const INTERVIEW_TYPE_COMPETENCY_MAP: Record<string, {
  primary: string[];
  secondary: string[];
  technicalAreas?: string[];
  domainAreas?: string[];
}> = {
  behavioral: {
    primary: [
      "ownership_accountability",
      "problem_solving",
      "collaboration_teamwork",
      "communication",
      "adaptability_resilience"
    ],
    secondary: [
      "customer_focus",
      "results_orientation",
      "conflict_resolution",
      "integrity_ethics",
      "learning_agility"
    ]
  },
  leadership: {
    primary: [
      "strategic_thinking",
      "people_development",
      "decision_making",
      "team_building",
      "stakeholder_management"
    ],
    secondary: [
      "execution_delivery",
      "change_leadership",
      "business_acumen"
    ]
  },
  technical: {
    primary: [
      "problem_solving",
      "communication"
    ],
    secondary: [
      "learning_agility",
      "collaboration_teamwork"
    ],
    technicalAreas: ["coding", "system_design"]
  },
  coding: {
    primary: ["problem_solving"],
    secondary: ["communication", "learning_agility"],
    technicalAreas: ["coding"]
  },
  case_study: {
    primary: ["problem_solving", "communication"],
    secondary: ["results_orientation", "business_acumen"],
    technicalAreas: ["case_study"]
  },
  system_design: {
    primary: ["problem_solving"],
    secondary: ["communication", "collaboration_teamwork"],
    technicalAreas: ["system_design"]
  },
  hr: {
    primary: [
      "communication",
      "customer_focus",
      "adaptability_resilience",
      "integrity_ethics"
    ],
    secondary: [
      "collaboration_teamwork",
      "learning_agility"
    ],
    domainAreas: ["company_knowledge"]
  },
  hiring_manager: {
    primary: [
      "ownership_accountability",
      "problem_solving",
      "results_orientation",
      "collaboration_teamwork"
    ],
    secondary: [
      "communication",
      "adaptability_resilience"
    ],
    domainAreas: ["company_knowledge", "business_domain"]
  },
  domain: {
    primary: [
      "problem_solving",
      "communication"
    ],
    secondary: [
      "learning_agility",
      "customer_focus"
    ],
    domainAreas: ["company_knowledge", "industry_knowledge", "business_domain", "functional_expertise"]
  },
  panel: {
    primary: [
      "communication",
      "problem_solving",
      "collaboration_teamwork",
      "ownership_accountability"
    ],
    secondary: [
      "adaptability_resilience",
      "results_orientation",
      "integrity_ethics"
    ]
  }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get competencies for a specific interview type
 */
export function getCompetenciesForInterviewType(
  interviewType: string,
  seniority: "entry" | "mid" | "senior" | "staff" = "mid"
): {
  behavioral: CompetencyDimension[];
  leadership: CompetencyDimension[];
  technical: TechnicalAssessmentArea[];
  domain: DomainKnowledgeArea[];
} {
  const mapping = INTERVIEW_TYPE_COMPETENCY_MAP[interviewType] || INTERVIEW_TYPE_COMPETENCY_MAP.behavioral;

  // Get behavioral competencies
  const behavioralIds = [...mapping.primary, ...mapping.secondary];
  const behavioral = BEHAVIORAL_COMPETENCIES.dimensions.filter(d => behavioralIds.includes(d.id));

  // Get leadership competencies for senior/staff or leadership interview types
  let leadership: CompetencyDimension[] = [];
  if (seniority === "senior" || seniority === "staff" || interviewType === "leadership") {
    leadership = LEADERSHIP_COMPETENCIES.dimensions;
  }

  // Get technical areas
  const technical = (mapping.technicalAreas || []).map(id => TECHNICAL_ASSESSMENT_AREAS[id]).filter(Boolean);

  // Get domain areas
  const domain = (mapping.domainAreas || []).map(id => DOMAIN_KNOWLEDGE_AREAS[id]).filter(Boolean);

  return { behavioral, leadership, technical, domain };
}

/**
 * Generate questions for a specific competency dimension
 */
export function getQuestionsForCompetency(
  competency: CompetencyDimension,
  seniority: "entry" | "mid" | "senior" | "staff" = "mid"
): string[] {
  const seniorityKey = seniority === "staff" ? "senior" : seniority;
  return competency.sampleQuestions[seniorityKey] || competency.sampleQuestions.mid;
}

/**
 * Get evaluation signals for a competency
 */
export function getSignalsForCompetency(competency: CompetencyDimension): {
  lookFor: string[];
  redFlags: string[];
} {
  return {
    lookFor: competency.signals.strong,
    redFlags: competency.signals.weak
  };
}

/**
 * Build a comprehensive interview assessment framework
 */
export function buildInterviewAssessmentFramework(
  interviewType: string,
  seniority: "entry" | "mid" | "senior" | "staff",
  includeLeadership: boolean = false
): {
  dimensions: {
    id: string;
    name: string;
    weight: number;
    questions: string[];
    lookFor: string[];
    redFlags: string[];
    followUps: string[];
  }[];
  technicalAreas: TechnicalAssessmentArea[];
  domainAreas: DomainKnowledgeArea[];
} {
  const competencies = getCompetenciesForInterviewType(interviewType, seniority);

  const dimensions = [
    ...competencies.behavioral.map(c => ({
      id: c.id,
      name: c.name,
      weight: c.assessmentWeight,
      questions: getQuestionsForCompetency(c, seniority),
      lookFor: c.signals.strong,
      redFlags: c.signals.weak,
      followUps: c.followUpProbes
    })),
    ...(includeLeadership || seniority === "senior" || seniority === "staff" ?
      competencies.leadership.map(c => ({
        id: c.id,
        name: c.name,
        weight: c.assessmentWeight,
        questions: getQuestionsForCompetency(c, seniority),
        lookFor: c.signals.strong,
        redFlags: c.signals.weak,
        followUps: c.followUpProbes
      })) : [])
  ];

  return {
    dimensions,
    technicalAreas: competencies.technical,
    domainAreas: competencies.domain
  };
}

/**
 * Get all competency IDs for a given interview type
 */
export function getCompetencyIdsForInterview(interviewType: string): string[] {
  const mapping = INTERVIEW_TYPE_COMPETENCY_MAP[interviewType];
  if (!mapping) return [];
  return [...mapping.primary, ...mapping.secondary];
}

/**
 * Validate if a competency ID exists
 */
export function isValidCompetencyId(competencyId: string): boolean {
  const allBehavioral = BEHAVIORAL_COMPETENCIES.dimensions.map(d => d.id);
  const allLeadership = LEADERSHIP_COMPETENCIES.dimensions.map(d => d.id);
  return allBehavioral.includes(competencyId) || allLeadership.includes(competencyId);
}

/**
 * Get a competency by ID
 */
export function getCompetencyById(competencyId: string): CompetencyDimension | undefined {
  const behavioral = BEHAVIORAL_COMPETENCIES.dimensions.find(d => d.id === competencyId);
  if (behavioral) return behavioral;
  return LEADERSHIP_COMPETENCIES.dimensions.find(d => d.id === competencyId);
}

// Export all frameworks
export const COMPETENCY_FRAMEWORKS = {
  behavioral: BEHAVIORAL_COMPETENCIES,
  leadership: LEADERSHIP_COMPETENCIES
};
