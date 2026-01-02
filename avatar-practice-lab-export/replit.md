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

## Recent Changes (January 2, 2026)

### Job-Centric Career Preparation Feature (Complete)
Implemented comprehensive job targeting system with career memory and readiness tracking:

1. **Job Targets Management**
   - Save target jobs with role title, company, location, and full job description
   - Track job status: Saved → Applied → Interviewing → Offer/Rejected
   - AI-powered JD parsing using GPT-4o extracts required skills, focus areas, experience level
   - Paste-and-parse feature: paste full JD text, AI extracts all fields automatically

2. **Job-Aware Practice Sessions (Phase 2)**
   - JobTargetSelector component added to all practice modes (Interview Custom, Case Study, Coding Lab)
   - Users can optionally link practice sessions to specific job targets
   - Session creation APIs accept and validate jobTargetId with proper user authorization
   - Backward compatible: generic practice without job linkage still works

3. **Readiness Score System (Phase 3)**
   - 3-component scoring algorithm (100 points max):
     - Practice Volume: 30 points (3pts per session, max 10 sessions)
     - Performance Score: 50 points (average score across all linked sessions)
     - Skill Coverage: 20 points (requires 3+ sessions and parsed JD with focus areas)
   - Visual progress bar on job cards (color-coded: green ≥70%, amber ≥40%, coral <40%)
   - Score updates automatically as users complete practice sessions

4. **Career Memory System**
   - Skill patterns tracking with rolling averages and trend detection
   - Trends: improving (score > avg+5), declining (score < avg-5), stagnant
   - Occurrence counting to track which dimensions are practiced most
   - Auto-increments when same dimension is practiced across sessions

5. **Navigation Updates**
   - "My Jobs" added to sidebar navigation (desktop)
   - "Jobs" added to mobile bottom navigation
   - Job detail page with AI-analyzed requirements display

### New Database Tables
- `job_targets` - User's saved target jobs with JD parsing and readiness scores
- `user_skill_patterns` - Career memory for tracking practice patterns and trends
- Added `job_target_id` foreign key to `interview_configs` and `exercise_sessions`

### New API Endpoints
- `/api/jobs/job-targets` - CRUD for job targets
- `/api/jobs/job-targets/:id/parse-jd` - AI parse job description
- `/api/jobs/job-targets/parse-paste` - Paste JD, auto-extract and save
- `/api/jobs/job-targets/:id/practice-suggestions` - Get practice recommendations
- `/api/jobs/job-targets/:id/readiness-score` - Compute readiness score from linked sessions
- `/api/jobs/skill-patterns` - Get user's career memory skill patterns
- `/api/jobs/skill-patterns/update` - Update patterns after session analysis

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
