# Avatar Practice Lab

## Overview
Avatar Practice Lab is a voice-first AI conversation platform for practicing real-life workplace communication skills using AI avatars. It provides scenario-based learning with post-session feedback, supporting intercultural communication and skill-based assessments. The platform leverages HeyGen for streaming avatars and OpenAI for conversation intelligence, aiming to enhance user communication proficiency in a safe and realistic environment.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Brand Color Palette** (January 2026): Modern, professional color scheme applied across the entire application:
  - Primary/Dark: #042c4c (deep navy blue) - Headers, sidebar, text
  - Accent: #ee7e65 (coral/salmon) - CTAs, highlights, active states
  - Light: #768c9c (slate blue) - Secondary elements
  - Muted: #6c8194 (gray-blue) - Subtle text, borders
  - Background: #f8f9fb (light gray) - App page backgrounds
- **Sidebar Navigation Layout** (January 2026): Modern app-like experience with collapsible dark sidebar:
  - Dark navy sidebar with navigation links (Dashboard, Practice, Interviews, Results)
  - User profile and sign-out in sidebar footer
  - Collapsible sidebar toggle for desktop
  - Mobile: Hamburger menu with slide-out sidebar overlay
  - Located in `ui/components/layout/sidebar-layout.tsx`
- **Home Page Hero Design**: Bold dark hero section with gradient backgrounds, floating visual elements, coral accent text, and dual CTA buttons.
- **Bento-Grid Dashboard**: Stat cards in grid layout, featured action cards with gradients, progress bars, quick actions panel, and activity summary.
- **Split-Screen Auth Pages**: Login and register pages use 50/50 split layout with branding panel (dark navy) on left and form panel (light) on right.
- **Card-Based Browsing**: Practice and interview pages use card grids with colored icons, difficulty/level badges, and hover effects.
- **Modern Design System**: Consistent rounded-2xl corners, subtle shadows, smooth transitions (200ms), hover/focus states across all components. Clean, minimal aesthetic prioritizing readability and usability.
- **Mobile Responsiveness**: Comprehensive mobile responsiveness across all pages, including a mobile hamburger menu, adaptive layouts, and app-like UX patterns such as fixed bottom action bars and progressive content disclosure.
- **Admin Console**: A 6-page SaaS-style dashboard for analytics, user management, session tracking, content performance, avatar usage, and cost monitoring.
- **Voice Input**: Redesigned voice input with flag-based language selection and auto-detection, supporting 22 languages including 8 Indian languages with code-mixing capabilities.

### Technical Implementations
- **Frontend**: React 18 (TypeScript), Vite, React Router DOM v6, React Query, React Context, Tailwind CSS, Radix UI.
- **Backend**: Node.js (Express), TypeScript (ES modules) with RESTful API.
- **Data Storage**: PostgreSQL (Neon serverless) with Drizzle ORM, AWS S3 for audio recordings and session artifacts.
- **Real-time Capabilities**: OpenAI Agents SDK for real-time voice, HeyGen Streaming Avatar SDK for avatar streaming.
- **Dual-Mode Avatar System**: Mode selector in pre-session page routes to Video mode (HeyGen streaming avatar) or Voice mode (OpenAI Realtime + TTS). Both paths use the shared `buildFullScenarioPrompt()` function in `ui/lib/conversation-framework.ts` for prompt parity including: role assignment, language rules, counter-persona behavior, persona overlay guidance, opening directive, and anti-hallucination safeguards.
- **Authentication**: Custom username/password authentication with bcrypt hashing and PostgreSQL-backed session storage.

### Feature Specifications
- **Scenario-Based Learning**: Customizable scenarios with avatar preferences (persona, tone, cultural style).
- **Persona Overlay System**: Role-based practice levels (IC/Junior, Manager, Director, CXO) that adjust avatar behavior (pushback level, expectations) and feedback interpretation. Each persona includes authority constraints, success criteria, common mistakes to watch for, and tone guidance. Stored in `persona_overlays` JSONB field on scenarios table.
  - **Role-Level Auto-Mapping**: Users can type their job title (e.g., "Product Manager", "Software Engineer") and the system auto-detects the appropriate practice level using a dictionary of 77+ job titles with fuzzy matching. Supports exact matches, partial matches, and token-based matching with confidence scoring. Located in `ui/lib/role-level-mapping.ts`.
  - **Dynamic Opening Directives**: Avatar greetings adapt contextually based on scenario mood (crisis, coaching, feedback, negotiation, conflict, formal_meeting, casual_check_in), counter-persona emotional state, and user practice level. The `buildOpeningDirective` helper in `ui/lib/conversation-framework.ts` generates natural opening lines that set realistic conversation tone.
- **Cultural Communication Style Presets**: Modifies avatar behavior based on GlobeSmart-based presets (e.g., Direct & Task-Focused, Indirect & Relationship-Focused).
- **Skill Framework Assessment**: Uses OpenAI GPT-4o to evaluate transcripts against predefined skill dimensions (e.g., Impromptu Communication, Effective Presentation, TKI, GROW, Emotional Intelligence), providing detailed feedback and scores.
- **Analytics & Dashboards**: Comprehensive session analysis, practice dashboard with AI-recommended focus areas, and a results page for historical analytics and skill progression.
- **Custom Scenarios**: Users can create, save, and have AI analyze custom scenarios for dynamic role generation, context, objectives, and automatic skill mapping.
- **Impromptu Speaking**: Auto-categorization of topics, category-specific avatar conversation styles, and real-time fact enrichment using Tavily Search with anti-hallucination guardrails.
- **Presentation Practice**: Skill-based assessment and document analysis for uploaded presentations, providing structure, clarity, and visual design feedback. Includes language selection (15 languages) with strict enforcement—avatars speak only in the chosen language and politely redirect users if they switch.
- **Session Management**: Queue system for HeyGen, session timer with heartbeat monitoring, and pre-warming for reduced latency.
- **Interview Practice Lab**: Realistic job interview practice with AI avatars. Users upload resume and job description, select from 15 pre-built role kits (Software Engineer, Data Analyst, Product Manager, UX Designer, Sales, Marketing, Operations, Consulting, Finance, HR, Recruiting, Engineering Management), and receive personalized interview plans. Post-session analysis includes 8-dimension rubric scoring (Clarity & Structure, Depth & Evidence, Problem Solving, Role Fit, Confidence & Composure, Communication Hygiene, Ownership & Impact, Consistency & Honesty), actionable feedback, improved answer examples, and a 7-day practice plan.
  - **Interview API Routes**: Located in `api/routes/interview.ts` with endpoints for role kits, document upload/parsing, interview config, plan generation, session management, and analysis.
  - **Interview Frontend Pages**: Role selection (`/interview`), context upload (`/interview/context`), pre-session plan preview (`/interview/pre-session`), and results analysis (`/interview/results`).
- **Voice Connection Optimization**: `RealtimeSessionPrewarmContext` pre-warms OpenAI Realtime tokens and Tavily research during avatar selection, reducing connection latency by front-loading API calls before user clicks "Start". Performance instrumentation logs token fetch, research fetch, agent preparation, and WebRTC connection timings.
- **Anti-Hallucination & Language Enforcement**: Avatars use only provided information, ask for clarification when details are missing, and strictly maintain the chosen language.

## External Dependencies

### Third-Party Services
- **HeyGen**: Streaming avatar service.
- **OpenAI**: AI models for conversation intelligence and analysis.
- **Neon Database**: Serverless PostgreSQL hosting.
- **AWS S3**: Cloud storage for audio recordings and session artifacts.
- **Tavily Search API**: For real-time fact research in impromptu conversations.

### Key NPM Packages
- `@heygen/streaming-avatar`
- `@openai/agents`
- `drizzle-orm`
- `@tanstack/react-query`
- `framer-motion`
- `react-speech-recognition`

## Database Migration & Seeding

### Commands
- `npm run db:setup` - Run all migrations and seeds (use for fresh deployments)
- `npm run db:migrate:sql` - Run only SQL migration files
- `npm run db:seed` - Run only seed files
- `npm run db:migrate` - Drizzle kit push (syncs schema.ts to database)

### Migration Files
Located in `database/migrations/`:
- 001_create_tables.sql - Core tables (users, skills, scenarios, avatars, sessions, transcripts)
- 002_fix_tables.sql - Table fixes
- 003_skill_framework_assessment.sql - Skill assessment tables
- 004_cultural_style_presets.sql - Cultural presets
- 005_custom_scenario_roles.sql - Custom scenario roles
- 006_presentation_scenarios.sql - Presentation practice tables
- 007_admin_analytics_tables.sql - Admin console, analytics, and budget tracking tables
- 008_interview_practice_lab.sql - Interview Practice Lab tables (role_kits, interview_rubrics, user_documents, user_profile_extracted, interview_configs, interview_plans, interview_sessions, interview_analysis, interview_artifacts)

### Seed Files
Located in `database/seeds/`:
- init.sql - Core data (users, skills, scenarios, avatars, admin settings, budget guards)
- cultural_presets.sql - Cultural communication presets
- interview_practice.sql - Interview Practice Lab data (15 role kits, 8-dimension rubric)

### Admin Console Access
- Username: `admin`
- Password: `admin123`
- Route: `/admin`