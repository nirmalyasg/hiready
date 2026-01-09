# Hiready (formerly Avatar Practice Lab)

## Overview
AI-powered interview preparation platform with two core user journeys:
1. **Employer Assessment Flow** - Candidates access jobs via assessment links (e.g., /apply/acme-engineer-xyz), complete interviews, and employers view consolidated Hiready Index scores
2. **Self-Practice Flow** - Users practice for roles at /readycheck with 1 free interview type, then pay for role packs or subscribe for unlimited access

### Hiready Index™
Role/JD-specific scoring system that consolidates scores across multiple interview types with weighted averaging:
- Technical interviews: 3.0x weight
- Coding assessments: 2.5x weight
- Case studies: 2.0x weight
- HR/Behavioral: 1.5x weight

## Pricing Tiers
- **Free Trial**: 1 completed interview per role
- **Role Pack** (₹199): 4 interview types for specific role
- **Pro Monthly** (₹499): Unlimited access
- **Pro Yearly** (₹3999): Unlimited access (33% savings)

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

## Brand Colors (January 2026)
- **Primary Coral**: #ee7e65 - CTAs, active states, accents
- **Secondary Coral**: #e06a50 - Button hover states
- **Dark Navy**: #042c4c - Sidebar, header backgrounds, dark text
- **Navy Gradient**: #0a3d62 - Gradient secondary
- **Gray-Blue**: #768c9c - Secondary elements, muted text
- **Background**: #f8f9fb - Page backgrounds
- **CTA Gradient Pattern**: from-[#ee7e65] to-[#e06a50]
- **Dark Gradient Pattern**: from-[#042c4c] to-[#0a3d62]

## Recent Changes (January 9, 2026)

### Dynamic JD-Specific Assessment Dimensions
Interview analysis now creates assessment dimensions directly from JD-extracted skills instead of mapping to fixed dimensions:
- **JD-First Approach**: analysisDimensions from JD parsing become actual rubric dimensions (e.g., "Python", "SQL", "Data Analysis")
- **Weight Distribution**: JD dimensions receive 60% of scoring weight, core competencies (Communication, Ownership, Role Fit) receive 40%
- **Evaluator Prompt**: Explicit instructions to use exact JD dimension names in output
- **Normalization**: Handles both string arrays and object arrays from JD parsing
- **Fallback**: Uses standard 8-dimension rubric when no JD data available
- **Location**: `buildDynamicRubric()` in `api/lib/interview-intelligence.ts`

## Recent Changes (January 8, 2026)

### JD-Specific Skill Dimension Mapping
Interview analysis now maps skill dimensions to the actual skills from the job description instead of using fixed 8-dimension rubric:
- **Priority Order**: JD skills → Rubric dimensions → Role-based fallback
- **Comprehensive Extraction**: Skills extracted from multiple sources (jdParsed, jobTarget.parsedData, config.jdDocId)
- **Robust Parsing**: Handles both JSON objects and stringified JSON
- **Field Coverage**: Extracts requiredSkills, preferredSkills, technicalSkills, softSkills, and generic skills

### UI Revamp - Coral/Navy Theme
Complete visual refresh with coral accent theme for modern, engaging UX:
- Home page redesigned with modern hero, coral CTAs, trust indicators
- Readycheck page with coral gradient accents and smart input
- Auth pages (login/register) with split layout and navy branding panel
- Dashboard with navy gradient KPI strip and coral action buttons
- Sidebar uses navy gradient (from-[#042c4c] to-[#0a3d62])
- Mobile bottom nav with coral active states
- All pages share coherent coral/navy visual hierarchy
- Target demographic: Young job seekers aged 20-40

### Hiready Platform Transformation
Complete platform rebranding and new features:

1. **Employer Assessment Flow** (`/apply/:slug`)
   - Public job application page with company branding
   - Candidate registration for assessments
   - Assessment launch/completion tracking
   - API routes: `/api/employer/apply/:slug` (GET, POST /start, POST /complete)

2. **Employer Workspace** (`/company`)
   - Company and job management dashboard
   - Candidate list with Hiready Index scores
   - Status updates (shortlist/reject)
   - CSV export functionality
   - Access control via company membership

3. **Self-Practice Landing** (`/readycheck`)
   - Simplified two-tab input: Paste JD or LinkedIn URL
   - Session storage preserves data through auth redirect
   - `/readycheck/launch` hydrates data post-auth and auto-routes to `/jobs/:jobTargetId`
   - LinkedIn URL parsing via `/api/readycheck/parse-linkedin`

4. **Payment System** (Razorpay integration)
   - Order creation and signature verification
   - Test mode fallback when keys not configured
   - Subscription management (role_pack, pro_monthly, pro_yearly)
   - API routes: `/api/payments/*`

5. **Hiready Index Calculation Engine** (`api/lib/hiready-index.ts`)
   - Weighted scoring by interview type
   - Type normalization
   - Dimension aggregation with 0-100 clamping

6. **Public Scorecard Sharing** (`/share/:shareToken`)
   - Secure token generation using crypto
   - HireadyIndexCard component with circular gauge

7. **Database Schema Additions**
   - `employer_companies`, `employer_jobs`, `employer_candidates`
   - `subscriptions`, `payments`
   - `hiready_role_index`

---

## Previous Changes (January 6, 2026)

### Exercise Content Generation During Plan Creation (Latest)
Actual exercise content (coding problems, case studies, puzzles) is now generated during plan creation rather than using empty placeholders:

1. **Coding Problems**
   - Full problem with title, description, examples, constraints, hints, starterCode
   - Language-appropriate templates (JavaScript, Python, etc.)
   - Role-tailored problems (React for frontend, SQL for data, algorithms for SWE)
   - Support for multiple problems via `codingProblems` array

2. **Case Studies**
   - Complete case study with scenario, prompt, materials, hints, sampleApproach
   - Materials array with id, title, type (text/table/chart/data), content
   - Category-based (strategy, product, metrics, market_sizing, operations)
   - Support for multiple cases via `caseStudies` array

3. **Puzzles**
   - Array of puzzles with type, question, hints, approach, solution
   - Role-matched (Fermi estimation for PM, logic for SWE, probability for Data)
   - Only included when `includePuzzles` is enabled

4. **Data Flow**
   - Plan generation normalizes GPT output to populate both singular and array fields
   - `normalizePlanExercises()` ensures backwards compatibility with singular fields
   - Session endpoint preserves generated content (only adds defaults if missing)

5. **Frontend Display**
   - InlineCaseStudyPanel shows scenario, materials (collapsible), hints
   - Materials displayed with type icons (text, table, chart, data)
   - Hints section with amber styling (collapsed by default)

---

### Interview Mode Customization Options
Added customization options for interview practice sessions:

1. **Exercise Count Selection** (for Coding & Case Study modes)
   - Users can choose 1-3 exercises per session
   - Quick (1), Standard (2), or Deep Dive (3) options
   - Affects plan generation to include multiple distinct problems

2. **Brain Teaser/Puzzle Toggle** (for problem-solving modes)
   - Optional inclusion of logical puzzles, estimation questions, brain teasers
   - Role-relevant puzzles (Fermi estimation for PM, logic puzzles for SWE)
   - Adds a dedicated "Puzzle" phase to interview structure

3. **Session Overview Card** (config page)
   - Prominent display of selected role name
   - Difficulty level (seniority) clearly shown
   - Skills being tested from role archetype
   - Badges for exercise count and puzzle inclusion

4. **State Persistence**
   - Exercise count and puzzle settings persist across navigation
   - Restored when returning to mode-setup from config page

---

### Simplified Interview Round Taxonomy
Removed panel_interview and merged presentation into case_study for cleaner round structure:

1. **Removed Panel Interview** - Eliminated duplicate/confusing round category
2. **Merged Presentation into Case Study** - Presentation rounds now map to case_study category and practice mode
3. **Updated Mappings** - ROLE_INTERVIEW_TYPE_TO_COMPONENTS, COMPONENT_TO_ROLE_TYPES, BLUEPRINT_ROUND_MAPPING all updated
4. **Coding & Case Study** - These remain embedded in interview experience (panel-style) as requested

---

### Role-Aware Interview Intersection System
Smart filtering that combines company interview components with role archetype requirements:

1. **Intersection-Based Round Filtering**
   - `getUnifiedInterviewPlan()` now intersects company components with role archetype's `common_interview_types`
   - Universal rounds (HR, Behavioral, Hiring Manager) always included
   - Role-critical rounds added even if company doesn't list them
   - Provenance tracking: "both" (company + role), "company" (company-only), "role" (role-added)

2. **Role Task Blueprints**
   - 36 task blueprints seeded for 6 role archetypes × 6 interview types
   - Each blueprint contains: promptTemplate, expectedSignals[], probeQuestions[], difficultyBand
   - Attached to each practice option via `getEnrichedInterviewPlan()`

3. **Enhanced Practice Options API**
   - Returns `phaseId` (unique identifier per phase)
   - Returns `provenance` ("both" | "company" | "role")
   - Returns `roleBlueprint` (primary matching blueprint with all fields)
   - Returns `allBlueprints` (all matching blueprints for the phase)

4. **Smart Exclusion Logic**
   - PM at tech company: excludes Coding/System Design, includes Case Study
   - SWE at same company: includes Coding/System Design, excludes Case Study
   - Uses `ROLE_INTERVIEW_TYPE_TO_COMPONENTS` and `COMPONENT_TO_ROLE_TYPES` mappings

5. **Database Changes**
   - New table: `role_task_blueprints` with 36 seeded entries
   - Fields: roleArchetypeId, interviewType, taskType, promptTemplate, expectedSignals, probeTree, difficultyBand

---

### Unified Archetype-Based Interview Structure
Refactored to use a single coherent interview flow that combines archetype defaults with company-specific context:

1. **Unified Interview Plan Generation**
   - Role archetype structure defaults are now the PRIMARY source for interview phases/timing
   - Company notes/blueprints layer on top as optional overrides
   - `getUnifiedInterviewPlan()` function in archetype-resolver.ts combines both sources
   - Generates phases with category, name, duration, description, subphases, and practiceMode

2. **Simplified Practice Options API**
   - `/api/jobs/job-targets/:id/practice-options` now uses unified interview plan
   - Returns both `options` (practice buttons) and `interviewPlan` (full structure)
   - Includes `companyContext` for blueprint notes and badges
   - Interview phases generated directly from role archetype + seniority

3. **Streamlined Job Detail Page UI**
   - Removed duplicate practice option sections (was showing both main list AND sidebar list)
   - Single "Interview Preparation" section with archetype badges
   - Sidebar simplified to "Quick Start" with just first-round button + Coding Lab
   - Archetype dropdown changes now regenerate interview structure in real-time

4. **Connected Archetype Overrides**
   - Changing company type or role type dropdown refetches practice options
   - Also refreshes companyData for blueprint notes display
   - Confidence badges update based on detection vs manual selection

---

### Company & Role Archetype Integration
Enhanced interview preparation with intelligent company and role classification:

1. **Company Archetypes (18 types)**
   - IT Services, Big Tech, BFSI, FMCG, Manufacturing, Consulting, BPM, Telecom, Conglomerate
   - Startup, Enterprise, SaaS, Fintech, EdTech, Consumer Tech, Regulated, Services, Industrial
   - 96 Indian companies seeded with archetype assignments
   - 3-stage matching: direct name → alias matching → JD inference

2. **Role Archetypes (18 types)**
   - Tech roles: Core SWE, Infra/Platform, Security, QA/Test
   - Data roles: Analyst, Engineer, Scientist, ML Engineer
   - Product roles: PM, TPM, Designer
   - Business roles: Marketing/Growth, Sales, Customer Success, BizOps, Operations, Finance, Consulting
   - 54 interview structure defaults by role × seniority (entry/mid/senior)

3. **Auto-Detection & Override**
   - Automatic archetype detection when jobs are created
   - Confidence badges: high (green), medium (amber), low (gray)
   - Manual override dropdowns in job detail page
   - Role family classification: tech, data, product, sales, business

4. **Interview Structure Defaults**
   - Phase-based interview configurations per role archetype
   - Seniority-adjusted timing and emphasis weights
   - Recommended scoring dimensions per phase

5. **New API Endpoints**
   - `GET /api/jobs/archetypes/roles` - List all role archetypes
   - `GET /api/jobs/archetypes/companies` - List company archetype counts
   - `GET /api/jobs/archetypes/structure/:roleArchetypeId/:seniority` - Get interview structure
   - `PUT /api/jobs/job-targets/:id/archetype` - Manual override
   - `POST /api/jobs/job-targets/:id/resolve-archetypes` - Re-run detection

6. **Database Changes**
   - `role_archetypes` table: 18 role types with skill dimensions
   - `role_interview_structure_defaults` table: 54 structure configs
   - New fields in `job_targets`: companyArchetype, archetypeConfidence, roleArchetypeId, roleFamily
   - New fields in `companies`: archetype, confidence, aliases, interviewComponents

---

## Previous Changes (January 4, 2026)

### Interview Intelligence System
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

7. **Company Role Blueprints (26 blueprints)**
   - **Global Tech Giants**: Google (SWE mid/senior, PM), Amazon (SWE mid/senior, PM), Microsoft (SWE, PM), Meta (SWE, PM), Apple (SWE), Netflix (SWE senior), Stripe (SWE), Uber (SWE), Airbnb (SWE), Salesforce (SWE), LinkedIn (SWE), Atlassian (SWE), Goldman Sachs (SWE)
   - **Indian Unicorns**: Flipkart (SWE, PM), Razorpay (SWE), Freshworks (SWE), Swiggy (SWE), Zomato (SWE), PhonePe (SWE)
   - Each blueprint includes:
     - Skill focus areas specific to company culture
     - Interview round structure (phone screen, onsite, bar raiser, etc.)
     - Rubric dimension weights and passing scores
     - Detailed notes about interview style and what to expect
   - Company-specific insights: Amazon Leadership Principles, Google Googleyness, Meta coding-heavy, Netflix culture fit, Stripe debugging exercise

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
