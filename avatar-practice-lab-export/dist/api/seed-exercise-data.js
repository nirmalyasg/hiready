import { db } from "./db.js";
import { caseTemplates, codingExercises, exerciseRubrics } from "../shared/schema.js";
async function seedExerciseData() {
    console.log("Seeding exercise data...");
    const caseTemplateData = [
        {
            roleKitId: 5,
            name: "E-Commerce Platform Revenue Decline",
            caseType: "business_diagnosis",
            difficulty: "medium",
            promptStatement: "ShopFlow, a B2C e-commerce platform focused on home goods, has seen a 15% decline in revenue over the past quarter despite increased marketing spend. The CEO wants you to diagnose what's going wrong.",
            context: `Key facts:
- Revenue: $50M annually, down from $58M same quarter last year
- Customer base: 500,000 active users
- Average order value: $85
- Marketing spend increased 20% this quarter
- Main competitors: Wayfair, Overstock, Amazon Home`,
            clarifyingQuestionsAllowed: 3,
            evaluationFocus: ["Problem structuring", "Hypothesis generation", "Data-driven analysis", "Root cause identification", "Actionable recommendations"],
            probingMap: {
                ifVague: [
                    "Can you be more specific about what data you'd look at?",
                    "How would you structure that analysis?",
                    "What exactly would you measure?"
                ],
                ifWrong: [
                    "That's an interesting hypothesis, but the data doesn't support it. What else might explain the decline?",
                    "Actually, our customer acquisition is up. What else could be causing revenue decline?",
                    "Our conversion rate is stable. Let's think about other factors."
                ],
                ifStrong: [
                    "Good insight. How would you prioritize addressing these issues?",
                    "That's exactly right. What would be your first action?",
                    "Strong analysis. How would you measure success of your recommendations?"
                ]
            },
            expectedDurationMinutes: 25,
            tags: ["revenue", "e-commerce", "customer analytics", "marketing"],
            isActive: true
        },
        {
            roleKitId: 5,
            name: "SaaS Churn Rate Investigation",
            caseType: "business_diagnosis",
            difficulty: "medium",
            promptStatement: "CloudMetrics, a B2B SaaS analytics platform, has seen their monthly churn rate increase from 3% to 7% over the past 6 months. Help diagnose the root causes.",
            context: `Key facts:
- ARR: $12M
- Customer count: 800 active accounts
- Average contract value: $15,000/year
- NPS score dropped from 45 to 28
- Support ticket volume increased 40%
- Recent product update 4 months ago`,
            clarifyingQuestionsAllowed: 3,
            evaluationFocus: ["Customer journey analysis", "Data segmentation", "Problem prioritization", "Stakeholder communication", "Strategic recommendations"],
            probingMap: {
                ifVague: [
                    "How specifically would you segment the churned customers?",
                    "What metrics would indicate the root cause?",
                    "Can you walk me through your analysis framework?"
                ],
                ifWrong: [
                    "The data shows churning customers are actually our largest accounts. Why might that be?",
                    "Support ticket content suggests something different. What might you be missing?",
                    "The timing doesn't align with that hypothesis. What happened 4 months ago?"
                ],
                ifStrong: [
                    "Excellent segmentation. What would your recovery plan look like?",
                    "You've identified the core issue. How would you present this to the board?",
                    "Great analysis. What leading indicators would you track going forward?"
                ]
            },
            expectedDurationMinutes: 25,
            tags: ["saas", "churn", "customer success", "retention"],
            isActive: true
        },
        {
            roleKitId: 2,
            name: "API Performance Degradation",
            caseType: "business_diagnosis",
            difficulty: "hard",
            promptStatement: "PayFast, a payment processing company, has seen their core API endpoint latency increase from 50ms to 250ms average over the past month, causing customer complaints and potential SLA violations.",
            context: `Key facts:
- API handles 10M requests/day
- Tech stack: Node.js, PostgreSQL, Redis, AWS
- Traffic increased 30% in past month
- Database query times appear normal
- No recent major code deployments
- Some customers report intermittent timeouts`,
            clarifyingQuestionsAllowed: 4,
            evaluationFocus: ["Technical problem decomposition", "System architecture understanding", "Performance debugging methodology", "Root cause analysis", "Solution prioritization"],
            probingMap: {
                ifVague: [
                    "Which specific metrics would you examine first?",
                    "How would you isolate the bottleneck layer?",
                    "What tools would you use to investigate?"
                ],
                ifWrong: [
                    "Database metrics show queries are fast. What else in the stack could cause this?",
                    "Our Redis hit rate is actually 95%. What else should we check?",
                    "CPU and memory look fine. What about network or connection pooling?"
                ],
                ifStrong: [
                    "Excellent systematic approach. What would be your first quick win?",
                    "You've identified the bottleneck. How would you fix it without downtime?",
                    "Great investigation. How would you prevent this in the future?"
                ]
            },
            expectedDurationMinutes: 30,
            tags: ["api", "performance", "debugging", "infrastructure"],
            isActive: true
        },
        {
            roleKitId: 5,
            name: "Product Launch Go-to-Market Plan",
            caseType: "execution_planning",
            difficulty: "medium",
            promptStatement: "DataViz, a business intelligence platform, is launching an AI-powered automated insights feature in 2 weeks. Create a go-to-market strategy targeting enterprise customers.",
            context: `Key facts:
- Feature ready for beta in 2 weeks
- Target: Enterprise customers ($100K+ ACV)
- Current customer base: 200 enterprise accounts
- Sales team of 15 reps
- Marketing budget for launch: $500K
- Main competitor launched similar feature 3 months ago`,
            clarifyingQuestionsAllowed: 3,
            evaluationFocus: ["Launch strategy development", "Stakeholder coordination", "Timeline management", "Risk assessment", "Success metrics definition"],
            probingMap: {
                ifVague: [
                    "What specific activities would you include in week 1 vs week 2?",
                    "How would you allocate the $500K budget?",
                    "What does 'success' look like 30 days post-launch?"
                ],
                ifWrong: [
                    "A broad market launch might dilute our message. How would you focus?",
                    "Sales enablement needs more time. What's a realistic timeline?",
                    "That metric is lagging. What leading indicators would you track?"
                ],
                ifStrong: [
                    "Great phased approach. Who are the key stakeholders you'd align?",
                    "Solid plan. How would you handle if the competitor responds?",
                    "Excellent framework. What's your contingency if beta feedback is negative?"
                ]
            },
            expectedDurationMinutes: 25,
            tags: ["product launch", "go-to-market", "strategy", "enterprise"],
            isActive: true
        },
        {
            roleKitId: 2,
            name: "Technical Debt Reduction Roadmap",
            caseType: "execution_planning",
            difficulty: "medium",
            promptStatement: "Create a plan to reduce technical debt by 30% over the next quarter while maintaining feature delivery velocity. The CTO has given you this mandate.",
            context: `Key facts:
- Engineering team: 25 developers across 4 squads
- Current sprint velocity: 40 story points/sprint
- Identified tech debt items: 150+
- Critical bugs from tech debt: 5-10 per week
- Upcoming features committed to customers
- DevOps maturity is low`,
            clarifyingQuestionsAllowed: 3,
            evaluationFocus: ["Technical prioritization", "Resource allocation", "Stakeholder management", "Progress tracking", "Risk mitigation"],
            probingMap: {
                ifVague: [
                    "How would you categorize the 150 tech debt items?",
                    "What percentage of sprint capacity would you allocate?",
                    "How would you measure the 30% reduction?"
                ],
                ifWrong: [
                    "A full sprint dedicated to tech debt might stall features too long. What's an alternative?",
                    "That prioritization misses the bug-causing items. How would you rank by impact?",
                    "Engineering alone can't decide this. Who else needs to buy in?"
                ],
                ifStrong: [
                    "Great categorization. How would you sequence the work?",
                    "Solid allocation strategy. How would you communicate this to stakeholders?",
                    "Excellent plan. What early wins would build momentum?"
                ]
            },
            expectedDurationMinutes: 25,
            tags: ["technical debt", "engineering", "planning", "prioritization"],
            isActive: true
        },
        {
            roleKitId: 5,
            name: "Feature Prioritization Conflict",
            caseType: "stakeholder",
            difficulty: "hard",
            promptStatement: "You're a PM preparing for quarterly planning. VP Sales wants a $2M enterprise feature, Engineering wants a 2-month payment refactor, and Customer Success wants top 5 bug fixes. You can only deliver 2 of 3. Navigate this conflict.",
            context: `Three stakeholders with conflicting priorities:
1. VP Sales: New enterprise feature for a $2M deal, needs it in Q2
2. Engineering: Payment system refactor (2-month project), technical risk if delayed
3. Customer Success: Bug fixes for top 5 customer complaints, NPS at risk

Your team has capacity for approximately 2 of these 3 priorities.`,
            clarifyingQuestionsAllowed: 4,
            evaluationFocus: ["Stakeholder communication", "Conflict resolution", "Data-driven decision making", "Negotiation skills", "Alignment building"],
            probingMap: {
                ifVague: [
                    "How specifically would you evaluate the tradeoffs?",
                    "What data would you gather before the meeting?",
                    "How would you structure the conversation with each stakeholder?"
                ],
                ifWrong: [
                    "Delaying the sales feature loses the deal entirely. Is there a middle ground?",
                    "The payment system has had 3 incidents this quarter. Can we really defer it?",
                    "Two of our top 5 complaints are from the $2M prospect. How does that change things?"
                ],
                ifStrong: [
                    "Great framework. How would you communicate the decision?",
                    "Solid analysis. How would you get buy-in from the losing stakeholder?",
                    "Excellent approach. How would you prevent this conflict next quarter?"
                ]
            },
            expectedDurationMinutes: 30,
            tags: ["stakeholder management", "prioritization", "negotiation", "communication"],
            isActive: true
        },
        {
            roleKitId: 11,
            name: "Executive Buy-in for Analytics Investment",
            caseType: "stakeholder",
            difficulty: "medium",
            promptStatement: "Convince the CFO and CEO to approve a $500K investment in data infrastructure upgrade when the company is in cost-cutting mode.",
            context: `Key facts:
- Current data tools are 5 years old
- Reports take 3-5 days to generate
- Data accuracy issues causing wrong decisions
- Competitors are investing heavily in analytics
- Company is in cost-cutting mode`,
            clarifyingQuestionsAllowed: 3,
            evaluationFocus: ["Business case development", "Executive communication", "ROI analysis", "Objection handling", "Strategic alignment"],
            probingMap: {
                ifVague: [
                    "What's the specific ROI calculation?",
                    "How does this align with cost-cutting priorities?",
                    "What hard numbers can you show me?"
                ],
                ifWrong: [
                    "Soft benefits don't justify half a million. What's the hard ROI?",
                    "Our current tools still work. Why can't we just improve processes?",
                    "The competitor argument doesn't resonate during cost-cutting. What else?"
                ],
                ifStrong: [
                    "Compelling ROI. How quickly would we see returns?",
                    "Good strategic alignment. What's the implementation risk?",
                    "Strong case. How would you measure success?"
                ]
            },
            expectedDurationMinutes: 25,
            tags: ["executive communication", "business case", "analytics", "investment"],
            isActive: true
        }
    ];
    const codingExerciseData = [
        {
            roleKitId: 2,
            name: "Rate Limiter Implementation",
            activityType: "explain",
            difficulty: "medium",
            language: "python",
            codeSnippet: `import time
from collections import defaultdict
from threading import Lock

class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
        self.lock = Lock()
    
    def is_allowed(self, client_id: str) -> bool:
        with self.lock:
            current_time = time.time()
            window_start = current_time - self.window_seconds
            
            # Remove expired timestamps
            self.requests[client_id] = [
                ts for ts in self.requests[client_id] 
                if ts > window_start
            ]
            
            if len(self.requests[client_id]) < self.max_requests:
                self.requests[client_id].append(current_time)
                return True
            return False
    
    def get_retry_after(self, client_id: str) -> float:
        if not self.requests[client_id]:
            return 0
        oldest = min(self.requests[client_id])
        return max(0, oldest + self.window_seconds - time.time())`,
            expectedBehavior: "Walk through how this rate limiter works and what design decisions were made.",
            expectedSignals: [
                { signal: "Explains sliding window algorithm correctly", importance: "critical" },
                { signal: "Identifies thread safety with Lock", importance: "critical" },
                { signal: "Understands time complexity (O(n) for cleanup)", importance: "important" },
                { signal: "Discusses memory implications of storing timestamps", importance: "important" },
                { signal: "Suggests improvements like using sorted containers", importance: "nice_to_have" }
            ],
            commonFailureModes: [
                { mistake: "Cannot explain basic rate limiting concept", feedback: "Start by explaining what rate limiting is and why it's needed" },
                { mistake: "Misses thread safety implications", feedback: "What happens if two requests come in simultaneously?" },
                { mistake: "Doesn't understand time/space tradeoffs", feedback: "How does memory grow with request volume?" }
            ],
            probingQuestions: [
                "What's the time complexity of the is_allowed method?",
                "How would this behave under high concurrency?",
                "What would happen if a client makes 1000 requests per second?",
                "How would you modify this for a distributed system?"
            ],
            edgeCases: ["Clock skew", "High concurrency", "Memory growth", "Distributed deployment"],
            tags: ["algorithms", "concurrency", "system design"],
            isActive: true
        },
        {
            roleKitId: 2,
            name: "Memory Leak in Event Handler",
            activityType: "debug",
            difficulty: "medium",
            language: "typescript",
            codeSnippet: `import React, { useState, useEffect } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
}

const DataDashboard: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('wss://api.example.com/stream');
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log('Connected');
    };

    ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      setData(prevData => [...prevData, message.data]);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Missing cleanup!
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Data count:', data.length);
    }, 5000);
    
    // Missing cleanup for interval too
  }, [data.length]);

  return (
    <div>
      <h1>Data Dashboard {isConnected ? '🟢' : '🔴'}</h1>
      <ul>
        {data.slice(-10).map((item, i) => (
          <li key={i}>{JSON.stringify(item)}</li>
        ))}
      </ul>
    </div>
  );
};`,
            bugDescription: "This component is causing memory issues in production. Users report the page slowing down over time.",
            expectedBehavior: "Debug and fix the memory leak issues in this React component.",
            expectedSignals: [
                { signal: "Identifies missing WebSocket cleanup in useEffect", importance: "critical" },
                { signal: "Identifies missing interval cleanup", importance: "critical" },
                { signal: "Notes unbounded data growth issue", importance: "important" },
                { signal: "Explains React useEffect cleanup pattern", importance: "important" },
                { signal: "Provides correct fix with return cleanup function", importance: "critical" }
            ],
            commonFailureModes: [
                { mistake: "Cannot identify memory leak sources", feedback: "What resources are allocated in useEffect that need cleanup?" },
                { mistake: "Doesn't understand useEffect cleanup", feedback: "What does the return function in useEffect do?" },
                { mistake: "Fixes one issue but misses others", feedback: "There are multiple cleanup issues here" }
            ],
            suggestedFix: `// Add cleanup return functions to both useEffects
useEffect(() => {
  const ws = new WebSocket('wss://api.example.com/stream');
  // ... handlers ...
  return () => ws.close(); // Cleanup
}, []);

useEffect(() => {
  const interval = setInterval(() => {...}, 5000);
  return () => clearInterval(interval); // Cleanup
}, [data.length]);

// Also limit data array size to prevent unbounded growth`,
            probingQuestions: [
                "What happens when this component unmounts?",
                "How would you test for memory leaks?",
                "What's the React pattern for cleanup?",
                "Any other issues you see with data handling?"
            ],
            edgeCases: ["Rapid mount/unmount", "Long-running session", "High message volume"],
            tags: ["react", "memory leak", "debugging", "websocket"],
            isActive: true
        },
        {
            roleKitId: 2,
            name: "Add Caching to API Client",
            activityType: "modify",
            difficulty: "medium",
            language: "typescript",
            codeSnippet: `interface User {
  id: string;
  name: string;
  email: string;
}

class UserApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getUser(userId: string): Promise<User> {
    const response = await fetch(\`\${this.baseUrl}/users/\${userId}\`);
    if (!response.ok) {
      throw new Error(\`Failed to fetch user: \${response.statusText}\`);
    }
    return response.json();
  }

  async getUsers(userIds: string[]): Promise<User[]> {
    const users = await Promise.all(
      userIds.map(id => this.getUser(id))
    );
    return users;
  }
}`,
            modificationRequirement: "Add an in-memory cache with configurable TTL that caches getUser results and uses the cache in getUsers.",
            expectedBehavior: "Implement caching to reduce redundant API calls.",
            expectedSignals: [
                { signal: "Adds cache data structure (Map with timestamps)", importance: "critical" },
                { signal: "Implements TTL expiration logic", importance: "critical" },
                { signal: "Handles cache invalidation", importance: "important" },
                { signal: "Considers cache for getUsers batch method", importance: "important" },
                { signal: "Discusses cache key strategy", importance: "nice_to_have" }
            ],
            commonFailureModes: [
                { mistake: "No TTL implementation (infinite cache)", feedback: "What happens when user data changes?" },
                { mistake: "Doesn't handle cache expiration correctly", feedback: "How do you know when a cached item is stale?" },
                { mistake: "Misses opportunity to use cache in getUsers", feedback: "Can getUsers benefit from the cache?" }
            ],
            suggestedFix: `// Add cache with TTL
private cache = new Map<string, { user: User; timestamp: number }>();
private ttlMs: number;

constructor(baseUrl: string, ttlMs: number = 60000) {
  this.baseUrl = baseUrl;
  this.ttlMs = ttlMs;
}

async getUser(userId: string): Promise<User> {
  const cached = this.cache.get(userId);
  if (cached && Date.now() - cached.timestamp < this.ttlMs) {
    return cached.user;
  }
  // ... fetch and cache
}`,
            probingQuestions: [
                "How would you handle cache invalidation?",
                "What's your cache key strategy?",
                "How would you handle concurrent requests for the same user?",
                "How would you extend this for a distributed cache?"
            ],
            edgeCases: ["Cache stampede", "Concurrent requests", "Cache invalidation timing"],
            tags: ["caching", "api", "optimization", "typescript"],
            isActive: true
        },
        {
            roleKitId: 4,
            name: "Pandas Data Pipeline Analysis",
            activityType: "explain",
            difficulty: "medium",
            language: "python",
            codeSnippet: `import pandas as pd
import numpy as np

def process_sales_data(df: pd.DataFrame) -> pd.DataFrame:
    # Clean and transform sales data
    df = df.copy()
    
    # Handle missing values
    df['quantity'] = df['quantity'].fillna(0)
    df['unit_price'] = df['unit_price'].fillna(df['unit_price'].mean())
    
    # Create derived columns
    df['total_value'] = df['quantity'] * df['unit_price']
    df['date'] = pd.to_datetime(df['date_string'], errors='coerce')
    df['month'] = df['date'].dt.to_period('M')
    
    # Remove outliers (> 3 std from mean)
    mean_val = df['total_value'].mean()
    std_val = df['total_value'].std()
    df = df[np.abs(df['total_value'] - mean_val) <= 3 * std_val]
    
    # Aggregate by month and category
    monthly_summary = df.groupby(['month', 'category']).agg({
        'total_value': ['sum', 'mean', 'count'],
        'quantity': 'sum'
    }).reset_index()
    
    monthly_summary.columns = ['month', 'category', 'total_revenue', 
                                'avg_transaction', 'num_transactions', 
                                'total_quantity']
    
    return monthly_summary`,
            expectedBehavior: "Walk through this data pipeline and identify any potential issues.",
            expectedSignals: [
                { signal: "Explains each transformation step clearly", importance: "critical" },
                { signal: "Identifies potential issue with fillna(mean) before outlier removal", importance: "important" },
                { signal: "Notes date parsing might fail silently", importance: "important" },
                { signal: "Understands groupby aggregation", importance: "critical" },
                { signal: "Suggests improvements for production readiness", importance: "nice_to_have" }
            ],
            commonFailureModes: [
                { mistake: "Cannot explain pandas operations", feedback: "Walk through what each line does step by step" },
                { mistake: "Misses data quality issues", feedback: "What assumptions does this code make about the input?" },
                { mistake: "Doesn't understand aggregation logic", feedback: "What does the groupby produce?" }
            ],
            probingQuestions: [
                "What happens if date_string has invalid formats?",
                "Is the outlier removal approach correct?",
                "How would you handle this at scale?",
                "What tests would you write for this function?"
            ],
            edgeCases: ["Empty dataframe", "All null values", "Invalid dates", "No variance in data"],
            tags: ["pandas", "data engineering", "etl", "python"],
            isActive: true
        }
    ];
    const rubricData = [
        {
            name: "Case Study Standard Rubric",
            exerciseType: "case_study",
            dimensions: [
                {
                    name: "Problem Structuring",
                    description: "Ability to break down complex problems into logical components",
                    weight: 25,
                    anchors: [
                        { score: 1, description: "No clear structure; jumps to conclusions" },
                        { score: 2, description: "Attempts structure but misses key components" },
                        { score: 3, description: "Basic structure with some gaps" },
                        { score: 4, description: "Well-organized approach covering main areas" },
                        { score: 5, description: "Excellent MECE framework with comprehensive coverage" }
                    ]
                },
                {
                    name: "Analytical Depth",
                    description: "Quality of analysis and use of data",
                    weight: 25,
                    anchors: [
                        { score: 1, description: "Surface-level analysis with no data consideration" },
                        { score: 2, description: "Basic analysis with limited data use" },
                        { score: 3, description: "Adequate analysis using available data" },
                        { score: 4, description: "Strong analysis with good data interpretation" },
                        { score: 5, description: "Exceptional analysis with creative data insights" }
                    ]
                },
                {
                    name: "Communication Clarity",
                    description: "Ability to explain reasoning clearly and concisely",
                    weight: 25,
                    anchors: [
                        { score: 1, description: "Unclear, rambling explanations" },
                        { score: 2, description: "Some clarity but lacks structure" },
                        { score: 3, description: "Generally clear with occasional confusion" },
                        { score: 4, description: "Clear and well-structured communication" },
                        { score: 5, description: "Exceptionally articulate with perfect clarity" }
                    ]
                },
                {
                    name: "Actionable Recommendations",
                    description: "Quality and feasibility of proposed solutions",
                    weight: 25,
                    anchors: [
                        { score: 1, description: "No actionable recommendations" },
                        { score: 2, description: "Vague or impractical suggestions" },
                        { score: 3, description: "Reasonable recommendations with gaps" },
                        { score: 4, description: "Clear, prioritized action items" },
                        { score: 5, description: "Exceptional recommendations with implementation roadmap" }
                    ]
                }
            ],
            isDefault: true
        },
        {
            name: "Coding Lab Standard Rubric",
            exerciseType: "coding_lab",
            dimensions: [
                {
                    name: "Code Understanding",
                    description: "Ability to read and understand existing code",
                    weight: 30,
                    anchors: [
                        { score: 1, description: "Cannot explain basic code logic" },
                        { score: 2, description: "Understands simple parts but misses complexity" },
                        { score: 3, description: "Reasonable understanding with some gaps" },
                        { score: 4, description: "Strong understanding of most components" },
                        { score: 5, description: "Complete understanding including edge cases" }
                    ]
                },
                {
                    name: "Problem Solving",
                    description: "Approach to debugging and modifying code",
                    weight: 35,
                    anchors: [
                        { score: 1, description: "Random changes without methodology" },
                        { score: 2, description: "Trial and error approach" },
                        { score: 3, description: "Systematic but slow approach" },
                        { score: 4, description: "Efficient debugging with good hypotheses" },
                        { score: 5, description: "Expert-level problem solving" }
                    ]
                },
                {
                    name: "Technical Communication",
                    description: "Ability to explain technical concepts clearly",
                    weight: 35,
                    anchors: [
                        { score: 1, description: "Cannot articulate technical concepts" },
                        { score: 2, description: "Uses jargon without clarity" },
                        { score: 3, description: "Adequate explanation with some gaps" },
                        { score: 4, description: "Clear technical explanations" },
                        { score: 5, description: "Excellent at explaining complex concepts simply" }
                    ]
                }
            ],
            isDefault: true
        }
    ];
    try {
        console.log("Inserting case templates...");
        for (const caseData of caseTemplateData) {
            await db.insert(caseTemplates).values(caseData);
        }
        console.log(`Inserted ${caseTemplateData.length} case templates`);
        console.log("Inserting coding exercises...");
        for (const exercise of codingExerciseData) {
            await db.insert(codingExercises).values(exercise);
        }
        console.log(`Inserted ${codingExerciseData.length} coding exercises`);
        console.log("Inserting scoring rubrics...");
        for (const rubric of rubricData) {
            await db.insert(exerciseRubrics).values(rubric);
        }
        console.log(`Inserted ${rubricData.length} rubrics`);
        console.log("Seed data complete!");
    }
    catch (error) {
        console.error("Error seeding data:", error);
        throw error;
    }
}
seedExerciseData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
