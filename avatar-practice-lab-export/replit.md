# Avatar Practice Lab

## Overview
AI-powered interview practice platform with voice conversations and detailed feedback.

## Project Structure
```
avatar-practice-lab-export/
├── api/                    # Backend Express server
│   ├── routes/             # API route handlers
│   │   ├── exercise-mode.ts # Interview Exercise Mode APIs
│   │   ├── interview.ts    # Interview practice APIs
│   │   └── ...
│   ├── middleware/         # Auth and other middleware
│   └── index.ts            # Server entry point
├── ui/                     # React frontend (Vite)
│   ├── pages/              # Page components
│   │   ├── exercise-mode/  # Interview Exercise Mode pages
│   │   │   ├── case-study/ # Case Study Mode
│   │   │   └── coding-lab/ # Coding Lab Mode
│   │   ├── interview/      # Interview practice pages
│   │   └── ...
│   ├── components/         # Reusable UI components
│   └── App.tsx             # Main router
└── shared/                 # Shared types and schema
    └── schema.ts           # Drizzle ORM schema
```

## Recent Changes (January 4, 2026)

### Interview Intelligence System (Latest)
Comprehensive AI-powered interview preparation with intelligent question patterns, skill tracking, and personalized coaching:

1. **Question Pattern Library**
   - 120+ question patterns with probe trees (ifVague, ifStrong, always, followUp)
   - Pattern types: resume_claim, behavioral, jd_requirement, scenario, technical, situational
   - Role-specific patterns for SWE, PM, Data, Design, Sales, Manager roles
   - Template variables filled from resume/JD context

2. **Answer Classification System**
   - Real-time answer evaluation using GPT-4o-mini
   - Quality classification: strong, adequate, weak, vague
   - Metrics detection: hasMetrics, hasSpecificExample, hasOwnership
   - Claims extraction for follow-up probing

3. **User Skill Memory**
   - Persistent skill tracking across sessions per dimension
   - Baseline vs latest score comparison
   - Trend detection: improving (score trending up), stable, declining
   - 10-session rolling history per dimension
   - Role-category specific tracking

4. **Enhanced Readiness Score**
   - Multi-factor scoring algorithm (100 points):
     - Skill Coverage: 40% (weighted by dimension importance)
     - Recent Performance: 25% (latest session scores)
     - JD Alignment: 25% (focus on job-critical dimensions)
     - Practice Volume: 5% (session count bonus)
     - Trend Bonus: up to 10 points for improving trends
   - Role-specific dimension weights (SWE prioritizes problem_solving, PM prioritizes clarity)
   - Gap identification with priority levels (critical, high, medium, low)
   - Personalized recommendations and estimated prep time

5. **Coach Agent (7-Day Practice Plans)**
   - Template-based and AI-powered plan generation
   - Activity types: mock_interview, exercise, review, research, self_practice
   - Commitment levels: light (≤30min), moderate (30-60min), intensive (>60min)
   - Gap distribution prioritizes critical gaps early in week
   - Mock interview days on Day 3 and Day 6
   - Week recap on Day 7
   - Daily time budgets strictly enforced

6. **Company Intelligence**
   - 50 companies seeded (25 India + 25 Global)
   - Company archetypes: faang, startup, enterprise, consulting, fintech, healthcare
   - Tier classification: tier1, tier2, tier3
   - Cultural signals and interview focus areas
   - Company role blueprints for common positions

### New Intelligence API Endpoints
- `GET /api/interview/intelligence/patterns` - Load question patterns by role/type
- `GET /api/interview/intelligence/companies` - Browse company database
- `GET /api/interview/intelligence/company/:name/blueprint` - Get company+role blueprint
- `POST /api/interview/intelligence/plan/generate` - Generate enhanced interview plan
- `POST /api/interview/intelligence/answer/classify` - Classify answer quality
- `POST /api/interview/intelligence/probe/select` - Get next probe question
- `GET /api/interview/intelligence/skill-trends` - Get user's skill history
- `POST /api/interview/intelligence/skill-memory/update` - Update skill memory after session
- `GET /api/interview/readiness/:jobTargetId` - Get readiness score for job
- `GET /api/interview/readiness-summary` - Get readiness for all saved jobs
- `POST /api/interview/coach/plan` - Generate 7-day practice plan (AI or template)
- `GET /api/interview/coach/plan/:jobTargetId` - Get plan for specific job
- `GET /api/interview/coach/today` - Get today's practice activities

### New Database Tables (Migration 009)
- `companies` - Company profiles with archetypes and interview style
- `question_patterns` - Question templates with probe trees
- `company_role_blueprints` - Role-specific interview guides per company
- `job_practice_links` - Links practice sessions to job targets
- `user_skill_memory` - Persistent skill tracking with trends

---

## Previous Changes (January 2, 2026)

### Resume Persistence & Profile Management
Users can now save their resume once and reuse it across all interview practice sessions:
- **Profile Page Resume Section**: Shows saved resume with upload date, replace/delete options
- **Interview Custom Integration**: Auto-detects saved resume and offers "Use This Resume" or "Upload New"
- **Smart Resume Deletion**: When deleting the current resume, system auto-promotes the next most recent resume
- **API Endpoints**: Added DELETE /api/interview/documents/:id for resume management

### Interview Custom 2-Step Wizard Flow
Redesigned the Interview Custom page into a streamlined 2-step wizard:
- **Step 1: Select Target Job**
  - Choose from saved jobs or add a new one via:
    - LinkedIn URL import (auto-scrapes with Puppeteer)
    - Paste full JD text (AI parses details)
    - Manual entry (title, company, location)
  - Selected job displayed with company/location context
- **Step 2: Configure Interview**
  - Upload resume (drag-drop, parsed via AI)
  - Choose interview type (HR, Hiring Manager, Technical, Panel)
  - Select interviewer style (Friendly, Neutral, Challenging)
  - Resume cached per job via `lastResumeDocId` for repeat sessions
- **Jobs Page Practice Buttons**: Direct "Practice" button on each job card routes to Interview Custom with job pre-selected

### Job-Centric Career Preparation Feature (Complete)
Implemented comprehensive job targeting system with career memory and readiness tracking:

1. **Job Targets Management**
   - Save target jobs with role title, company, location, and full job description
   - Track job status: Saved → Applied → Interviewing → Offer/Rejected
   - AI-powered JD parsing using GPT-4o extracts required skills, focus areas, experience level
   - **LinkedIn URL Import**: Paste a LinkedIn job URL, Puppeteer scrapes the page and auto-extracts title, company, location, and description
   - Paste-and-parse feature: paste full JD text, AI extracts all fields automatically

2. **Job-Aware Practice Sessions (Phase 2)**
   - JobTargetSelector component added to all practice modes (Interview Custom, Case Study, Coding Lab)
   - Users can optionally link practice sessions to specific job targets
   - Session creation APIs accept and validate jobTargetId with proper user authorization
   - Backward compatible: generic practice without job linkage still works
   - **Automatic Smart Job Linking**: When selecting a case study or coding exercise:
     - System automatically suggests the most relevant saved job based on skill overlap, role type match, and recent activity
     - Confidence-based scoring (high ≥35pts, medium ≥15pts) using weighted factors: role type (30%), skill overlap (35%), domain (15%), recency (15%)
     - "Smart Match" badge displays suggestion with rationale on avatar-select page
     - Users can override or dismiss the suggestion
     - Auto-link metadata (confidence, signals) persisted with session for analytics

3. **Readiness Score System (Phase 3)**
   - 3-component scoring algorithm (100 points max):
     - Practice Volume: 30 points (3pts per session, max 10 sessions)
     - Performance Score: 50 points (average score across all linked sessions)
     - Skill Coverage: 20 points (requires 3+ sessions and parsed JD with focus areas)
   - Visual progress bar on job cards (color-coded: green ≥70%, amber ≥40%, coral <40%)
   - Score updates automatically as users complete practice sessions

4. **Career Memory System**
   - Skill patterns tracking with rolling averages and trend detection
   - Trends: improving (score > avg+0.3), declining (score < avg-0.3), stagnant
   - Occurrence counting to track which dimensions are practiced most
   - Auto-increments when same dimension is practiced across sessions
   - **AI Insights Dashboard Section**: Displays personalized career observations including:
     - Persistent weaknesses (dimensions with avgScore < 3 across 2+ sessions)
     - Consistent strengths (dimensions with avgScore >= 4 across 2+ sessions)
     - Improving/declining trend alerts
     - Summary stats: skills tracked, improving count, declining count

5. **Interview Results Enhancements**
   - **Job Readiness Card**: Shows readiness score, delta from previous session, trend badge
   - **Strongest/Weakest Dimensions**: Color-coded display with edge-case handling
   - **7-Day Practice Plans**: Day-by-day tasks with time estimates in "Plan" tab
   - **Better Answer Examples**: Question/answer pairs showing improved responses in "Answers" tab
   - **Practice Again CTA**: Purple gradient banner linking back to practice with job context

6. **Navigation Updates**
   - "My Jobs" added to sidebar navigation (desktop)
   - "Jobs" added to mobile bottom navigation
   - Job detail page with AI-analyzed requirements display

### New Database Tables
- `job_targets` - User's saved target jobs with JD parsing and readiness scores
- `user_skill_patterns` - Career memory for tracking practice patterns and trends
- Added `job_target_id` foreign key to `interview_configs` and `exercise_sessions`

### New API Endpoints
- `/api/jobs` - GET list jobs, POST create job (simplified)
- `/api/jobs/import-linkedin` - Scrape LinkedIn URL and create job (simplified)
- `/api/jobs/job-targets` - CRUD for job targets (full version)
- `/api/jobs/job-targets/:id/parse-jd` - AI parse job description
- `/api/jobs/job-targets/parse-paste` - Paste JD, auto-extract and save
- `/api/jobs/job-targets/parse-url` - Scrape LinkedIn job URL with Puppeteer, auto-extract and AI-parse
- `/api/jobs/job-targets/:id/practice-suggestions` - Get practice recommendations
- `/api/jobs/job-targets/:id/readiness-score` - Compute readiness score from linked sessions
- `/api/jobs/skill-patterns` - Get user's career memory skill patterns
- `/api/jobs/skill-patterns/update` - Update patterns after session analysis
- `/api/exercise-mode/auto-link` - Get automatic job suggestions for case study/coding exercises

### New Frontend Components
- `JobTargetSelector` - Reusable dropdown for linking practice to jobs
- Enhanced job cards with readiness progress bars

### New Frontend Routes
- `/jobs` - List of saved job targets with status filtering and readiness display
- `/jobs/:jobId` - Job detail with AI analysis and practice history

---

### Interview Exercise Mode Feature (Previous)
Added two new flagship interview practice tracks with full avatar integration:

1. **Case Study Mode**
   - Practice structured case interviews (business diagnosis, execution planning, stakeholder)
   - **Avatar-based interface** - Same experience as presentation mode with virtual AI interviewer
   - AI interviewer with probing behavior (ifVague, ifWrong, ifStrong responses)
   - 60-second thinking time before session + lobby screen before joining
   - Real-time voice interaction with transcript display
   - 6-dimension scorecard with evidence snippets in results

2. **Coding Lab Mode**
   - Three activity types: Explain Code, Debug Code, Modify Code
   - **Avatar-based interface** - Virtual technical interviewer with voice interaction
   - Code display panel on left, avatar/transcript on right
   - Signal tracking (expected signals, failure modes) in interviewer prompts
   - Bug description or modification requirement shown in context panel
   - Suggested fix display in results

### Technical Implementation
Both session pages now use:
- `TranscriptProvider` and `EventProvider` contexts (same as presentation mode)
- `useRealtimeSession` hook for OpenAI Realtime voice connection
- `RealtimeAgent` with mode-specific interviewer prompts
- Audio element for TTS playback with speaking state detection
- Same layout pattern as presentation mode (content left, avatar+transcript right)

### New Database Tables
- `case_templates` - Case study exercise templates
- `coding_exercises` - Coding exercise templates
- `exercise_sessions` - User exercise sessions
- `exercise_rubrics` - Scoring rubrics with dimensions
- `exercise_analysis` - Detailed session feedback

### New API Endpoints
- `/api/exercise-mode/case-templates` - Browse/retrieve case templates
- `/api/exercise-mode/coding-exercises` - Browse/retrieve coding exercises
- `/api/exercise-mode/sessions` - Create and manage exercise sessions
- `/api/exercise-mode/sessions/:id/analysis` - Retrieve session analysis
- `/api/exercise-mode/sessions/:id/interviewer-prompt` - Get AI interviewer prompt

### New Frontend Routes
- `/exercise-mode` - Main exercise mode entry page
- `/exercise-mode/case-study` - Case study selection
- `/exercise-mode/case-study/session` - Active case session
- `/exercise-mode/case-study/results` - Case study results
- `/exercise-mode/coding-lab` - Coding lab selection
- `/exercise-mode/coding-lab/session` - Active coding session
- `/exercise-mode/coding-lab/results` - Coding lab results

## Development

### Running Locally
```bash
cd avatar-practice-lab-export
npm run dev          # API server on port 3001
npx vite            # Frontend on port 5000
```

### Database
- PostgreSQL with Drizzle ORM
- Push schema changes: `npm run db:push`

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Express session secret
- `OPENAI_API_KEY` - OpenAI API key for AI features

## Tech Stack
- Frontend: React, TypeScript, Vite, TailwindCSS, Radix UI
- Backend: Express.js, TypeScript
- Database: PostgreSQL, Drizzle ORM
- AI: OpenAI API for interview simulation
