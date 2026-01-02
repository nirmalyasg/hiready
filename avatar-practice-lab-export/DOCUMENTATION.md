# Avatar Practice Lab - Complete Documentation

*Last Updated: January 2026*

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [Feature Documentation](#feature-documentation)
4. [Technical Architecture](#technical-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend Architecture](#backend-architecture)
7. [Database Schema](#database-schema)
8. [API Reference](#api-reference)
9. [Third-Party Integrations](#third-party-integrations)
10. [Authentication & Security](#authentication--security)
11. [Mobile Experience](#mobile-experience)
12. [Admin Console](#admin-console)
13. [Development Guide](#development-guide)
14. [Deployment](#deployment)

---

## Executive Summary

**Avatar Practice Lab** is a voice-first AI conversation platform designed for practicing real-life workplace communication skills. Users interact with AI-powered avatars in realistic scenarios to improve their interview skills, communication abilities, and professional presence.

### Key Value Propositions
- **Realistic Practice**: AI avatars simulate real interview and workplace scenarios
- **Personalized Feedback**: Post-session analysis with actionable improvement suggestions
- **Skill-Based Assessment**: Structured evaluation against proven communication frameworks
- **Safe Environment**: Practice difficult conversations without real-world consequences

### Target Users
- Job seekers preparing for interviews
- Professionals improving communication skills
- Students developing presentation abilities
- Teams practicing stakeholder management

---

## Product Overview

### Core Practice Modes

The platform offers three main practice experiences accessible from the `/avatar/start` page:

| Mode | Description | Target Use Case |
|------|-------------|-----------------|
| **Interview Practice** | Realistic job interview simulations with AI interviewer | Job interview preparation |
| **Custom Interview** | Create personalized interview scenarios | Specific role preparation |
| **Case Study & Coding** | Technical interview exercises | Consulting/engineering interviews |

### User Journey

```
Home Page → Login/Register → Dashboard → Select Practice Mode → Avatar Selection → Practice Session → Results & Feedback
```

---

## Feature Documentation

### 1. Interview Practice Lab

**Location**: `/interview`

Users can practice job interviews with AI-powered interviewers. The system provides:

- **15 Pre-built Role Kits**: Software Engineer, Data Analyst, Product Manager, UX Designer, Sales, Marketing, Operations, Consulting, Finance, HR, Recruiting, Engineering Management, and more
- **Document Upload**: Resume and job description parsing for personalized interviews
- **Interview Plan Generation**: AI creates tailored question sequences
- **8-Dimension Assessment Rubric**:
  1. Clarity & Structure
  2. Depth & Evidence
  3. Problem Solving
  4. Role Fit
  5. Confidence & Composure
  6. Communication Hygiene
  7. Ownership & Impact
  8. Consistency & Honesty

**User Flow**:
1. Select role kit (`/interview`)
2. Upload resume/JD (`/interview/config`)
3. Review interview plan (`/interview/pre-session`)
4. Complete interview session
5. View detailed results (`/interview/results`)

### 2. Custom Interview Creation

**Location**: `/interview/custom`

Users can create their own interview scenarios by providing:
- Company information
- Role description
- Specific focus areas
- Custom questions

The AI analyzes the input and generates appropriate interview dynamics.

### 3. Case Study & Coding Lab

**Location**: `/exercise-mode`

Two specialized tracks for technical interviews:

#### Case Study Mode
- Business diagnosis scenarios
- Execution planning exercises
- Stakeholder alignment cases
- 6-dimension scorecard with evidence-based feedback

#### Coding Lab Mode
- Code explanation exercises
- Bug identification and fixing
- Code modification challenges
- Signal tracking for algorithmic thinking

### 4. Dashboard & Analytics

**Location**: `/avatar/dashboard`

Users see:
- Total practice time
- Completed sessions
- Skill progress visualization
- AI-recommended focus areas
- Recent activity summary

### 5. Results & History

**Location**: `/avatar/results`

Comprehensive view of all practice sessions with:
- Session transcripts
- Skill scores over time
- Improvement trends
- Detailed feedback for each session

### 6. Profile Management

**Location**: `/profile`

User account management:
- Profile information
- Settings
- Logout functionality

---

## Technical Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    React Frontend (Vite)                     ││
│  │  - React 18 + TypeScript                                     ││
│  │  - React Router DOM v6                                       ││
│  │  - TanStack React Query                                      ││
│  │  - Tailwind CSS + Radix UI                                   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVER (Node.js)                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Express Backend                           ││
│  │  - TypeScript (ES Modules)                                   ││
│  │  - RESTful API Design                                        ││
│  │  - Session-based Authentication                              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│    PostgreSQL    │ │   AWS S3     │ │ External APIs    │
│  (Neon Serverless)│ │  (Storage)   │ │ - OpenAI         │
│  - Drizzle ORM   │ │  - Audio     │ │ - HeyGen         │
│                  │ │  - Files     │ │ - Tavily         │
└──────────────────┘ └──────────────┘ └──────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend Framework | React 18 | UI components and state management |
| Build Tool | Vite | Fast development and bundling |
| Styling | Tailwind CSS | Utility-first CSS framework |
| UI Components | Radix UI | Accessible component primitives |
| State Management | React Query + Context | Server state and app state |
| Routing | React Router DOM v6 | Client-side navigation |
| Backend Runtime | Node.js | JavaScript server runtime |
| API Framework | Express | HTTP server and routing |
| Database ORM | Drizzle | Type-safe database queries |
| Database | PostgreSQL (Neon) | Serverless relational database |
| Language | TypeScript | Type-safe JavaScript |

---

## Frontend Architecture

### Directory Structure

```
ui/
├── App.tsx                    # Main app component with routes
├── main.tsx                   # React entry point
├── components/
│   ├── layout/
│   │   ├── sidebar-layout.tsx    # Main layout with sidebar (desktop)
│   │   └── mobile-bottom-nav.tsx # Bottom navigation (mobile)
│   ├── ui/                    # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── ...
│   └── auth/
│       └── ProtectedRoute.tsx # Auth guard component
├── pages/
│   ├── home/                  # Landing page
│   ├── auth/                  # Login/Register pages
│   ├── dashboard/             # User dashboard
│   ├── practice/              # Practice mode pages
│   ├── interview/             # Interview practice pages
│   ├── exercise-mode/         # Case study & coding pages
│   ├── results/               # Results and history
│   ├── profile/               # User profile
│   └── admin/                 # Admin console
├── contexts/
│   ├── AvatarSessionContext.tsx    # Avatar session state
│   └── RealtimeSessionPrewarmContext.tsx  # Connection pre-warming
├── hooks/
│   ├── useAuth.ts             # Authentication hook
│   └── ...
├── lib/
│   ├── utils.ts               # Utility functions
│   ├── conversation-framework.ts  # Prompt building utilities
│   └── role-level-mapping.ts  # Job title to level mapping
├── styles/
│   └── globals.css            # Global styles and CSS variables
└── assets/                    # Static assets
```

### Key Components

#### SidebarLayout (`ui/components/layout/sidebar-layout.tsx`)
- Desktop: Full sidebar with navigation and user info
- Mobile: Hidden sidebar, replaced with bottom navigation
- Collapsible sidebar toggle on desktop
- Navigation items with expandable sub-menus

#### MobileBottomNav (`ui/components/layout/mobile-bottom-nav.tsx`)
- Fixed bottom navigation for mobile devices
- Four tabs: Home, Practice, Results, Profile
- Active state detection for nested routes
- Safe area padding for iPhone notch support

#### ProtectedRoute (`ui/components/auth/ProtectedRoute.tsx`)
- Guards routes requiring authentication
- Redirects unauthenticated users to login

### State Management

**React Query** handles server state:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['skills'],
  queryFn: () => fetch('/api/avatar/get-skills').then(r => r.json())
});
```

**React Context** handles app state:
- `AvatarSessionContext`: Current practice session state
- `RealtimeSessionPrewarmContext`: Pre-warming connections for reduced latency

### Brand Color Palette

```css
:root {
  --primary: #042c4c;        /* Deep navy - headers, text */
  --accent: #ee7e65;         /* Coral - CTAs, highlights */
  --secondary: #768c9c;      /* Slate blue - secondary elements */
  --muted: #6c8194;          /* Gray-blue - subtle text */
  --background: #f8f9fb;     /* Light gray - page backgrounds */
}
```

---

## Backend Architecture

### Directory Structure

```
api/
├── index.ts                   # Express app setup and middleware
├── replitAuth.ts              # Authentication routes
├── routes/
│   ├── avatar-simulator.ts    # Core avatar/practice endpoints
│   ├── interview.ts           # Interview practice endpoints
│   ├── exercise-mode.ts       # Case study & coding endpoints
│   ├── admin.ts               # Admin console endpoints
│   └── realtime.ts            # OpenAI Realtime token endpoint
└── storage.ts                 # Database query functions

shared/
├── schema.ts                  # Drizzle ORM schema definitions
└── types.ts                   # Shared TypeScript types

database/
├── migrations/                # SQL migration files
│   ├── 001_create_tables.sql
│   ├── 002_fix_tables.sql
│   └── ...
└── seeds/                     # SQL seed data files
    ├── init.sql
    ├── cultural_presets.sql
    └── interview_practice.sql
```

### Express Middleware Stack

```typescript
app.use(express.json());           // JSON body parsing
app.use(cors());                   // CORS headers
app.use(sessionMiddleware);        // Session management

// Route mounting
app.use("/api/avatar", avatarSimulator);
app.use("/api/admin", adminRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/exercise-mode", exerciseModeRouter);
app.use("/api/realtime", realtimeRouter);
```

---

## Database Schema

### Entity Relationship Overview

```
auth_users ──────┬──────── sessions (session storage)
                 │
                 ├──────── user_login_events
                 │
                 ├──────── roleplay_session ──── transcripts
                 │
                 ├──────── custom_scenarios ──── custom_scenario_skill_mappings
                 │
                 ├──────── presentation_sessions ──── presentation_feedback
                 │
                 ├──────── interview_sessions ──── interview_analysis
                 │                                ──── interview_artifacts
                 │
                 └──────── exercise_sessions ──── exercise_analysis

skills ──────────── scenarios

role_kits ──────── interview_rubrics
            ├───── case_templates
            └───── coding_exercises
```

### Core Tables

#### Authentication Tables

| Table | Purpose |
|-------|---------|
| `auth_users` | User accounts with bcrypt-hashed passwords |
| `sessions` | Express session storage |
| `user_login_events` | Login/logout tracking for analytics |
| `user_roles` | User role assignments (admin, user) |

#### Practice Tables

| Table | Purpose |
|-------|---------|
| `skills` | Skill definitions with frameworks |
| `scenarios` | Practice scenario configurations |
| `avatars` | Available AI avatar configurations |
| `roleplay_session` | Practice session records |
| `transcripts` | Session transcripts with analysis |

#### Interview Tables

| Table | Purpose |
|-------|---------|
| `role_kits` | Pre-built interview role configurations |
| `interview_rubrics` | Assessment rubric definitions |
| `user_documents` | Uploaded resumes and JDs |
| `user_profile_extracted` | Parsed profile data from documents |
| `interview_configs` | Session configuration |
| `interview_plans` | Generated interview question plans |
| `interview_sessions` | Interview session records |
| `interview_analysis` | Post-interview analysis |
| `interview_artifacts` | Session recordings and files |

#### Exercise Mode Tables

| Table | Purpose |
|-------|---------|
| `case_templates` | Case study exercise templates |
| `coding_exercises` | Coding challenge definitions |
| `exercise_sessions` | Exercise session records |
| `exercise_rubrics` | Exercise scoring rubrics |
| `exercise_analysis` | Post-exercise analysis |

#### Admin & Analytics Tables

| Table | Purpose |
|-------|---------|
| `api_usage_events` | API call tracking |
| `api_cost_daily_rollup` | Daily cost aggregation |
| `budget_guards` | Cost limit configurations |
| `budget_alerts` | Cost threshold alerts |
| `admin_settings` | System configuration |
| `session_journey_events` | User journey tracking |

---

## API Reference

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new user account |
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/logout` | End user session |
| GET | `/api/auth/user` | Get current user info |

### Avatar/Practice Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/avatar/get-skills` | List all skills with scenarios |
| GET | `/api/avatar/get-scenarios` | List available scenarios |
| GET | `/api/avatar/get-avatar/:id` | Get avatar configuration |
| POST | `/api/avatar/save-transcript` | Save session transcript |
| GET | `/api/avatar/get-transcripts` | Get user's session history |
| POST | `/api/avatar/session-analysis` | Analyze completed session |
| GET | `/api/avatar/skill-progress` | Get user's skill progress |
| GET | `/api/avatar/cultural-presets` | List cultural communication presets |

### Interview Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/interview/role-kits` | List interview role kits |
| GET | `/api/interview/role-kits/:id` | Get specific role kit |
| POST | `/api/interview/documents/upload` | Upload resume/JD |
| POST | `/api/interview/config` | Create interview config |
| POST | `/api/interview/plans/generate` | Generate interview plan |
| POST | `/api/interview/sessions` | Create interview session |
| POST | `/api/interview/sessions/:id/analyze` | Analyze interview |

### Exercise Mode Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exercise-mode/case-templates` | List case study templates |
| GET | `/api/exercise-mode/coding-exercises` | List coding exercises |
| GET | `/api/exercise-mode/rubrics` | List assessment rubrics |
| POST | `/api/exercise-mode/sessions` | Create exercise session |
| POST | `/api/exercise-mode/sessions/:id/analyze` | Analyze exercise |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/analytics/summary` | Dashboard summary |
| GET | `/api/admin/analytics/users` | User list with stats |
| GET | `/api/admin/analytics/sessions` | Session analytics |
| GET | `/api/admin/costs/summary` | API cost summary |
| GET | `/api/admin/config/settings` | System settings |
| POST | `/api/admin/run-sql-migrations` | Run database migrations |
| POST | `/api/admin/run-sql-seeds` | Run seed data |

### Realtime Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/realtime/token` | Get OpenAI Realtime ephemeral token |

---

## Third-Party Integrations

### OpenAI

**Purpose**: AI conversation intelligence, session analysis, and real-time voice

**APIs Used**:
- GPT-4o: Transcript analysis, feedback generation, plan creation
- Realtime API: Live voice conversations with avatars
- Whisper: Audio transcription

**Configuration**:
```
Environment Variable: OPENAI_API_KEY
```

### HeyGen

**Purpose**: Streaming video avatars for realistic practice sessions

**Features**:
- Video avatar streaming
- Session queue management
- Avatar customization

**Integration Points**:
- Session start/end management
- Heartbeat monitoring
- Queue position tracking

### AWS S3

**Purpose**: File storage for recordings and documents

**Stored Content**:
- Audio recordings from practice sessions
- Uploaded resumes and job descriptions
- Presentation files

### Tavily Search API

**Purpose**: Real-time fact research for impromptu conversations

**Features**:
- Topic research during sessions
- Fact verification
- Context enrichment

---

## Authentication & Security

### Authentication Flow

```
User Login Request
       │
       ▼
  Validate Credentials
       │
       ▼
  bcrypt.compare(password, hash)
       │
       ▼
  Create Express Session
       │
       ▼
  Store Session in PostgreSQL
       │
       ▼
  Return Session Cookie
```

### Session Management

- **Storage**: PostgreSQL-backed sessions using `connect-pg-simple`
- **Duration**: Configurable session expiry
- **Security**: HTTP-only cookies, secure flag in production

### Password Security

- **Hashing**: bcrypt with configurable salt rounds
- **Minimum Length**: 6 characters
- **Storage**: Only hash stored, never plain text

### Protected Routes

Frontend routes are protected using `ProtectedRoute` component:
```typescript
<Route path="/avatar/dashboard" element={
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
} />
```

Backend routes use `requireAuth` middleware:
```typescript
router.post("/documents/upload", requireAuth, async (req, res) => {
  // Only authenticated users can access
});
```

---

## Mobile Experience

### Navigation Architecture

| Screen Size | Navigation Type | Component |
|-------------|-----------------|-----------|
| Desktop (≥1024px) | Collapsible sidebar | `SidebarLayout` |
| Mobile (<1024px) | Fixed bottom tabs | `MobileBottomNav` |

### Bottom Navigation Tabs

| Tab | Icon | Routes Covered |
|-----|------|----------------|
| Home | House | `/avatar/dashboard` |
| Practice | Target | `/avatar/start`, `/interview/*`, `/exercise-mode/*` |
| Results | Bar Chart | `/avatar/results/*`, `*session-analysis*` |
| Profile | User | `/profile` |

### Mobile-Specific Features

- **Safe Area Insets**: CSS support for iPhone notch
- **Touch-Friendly Targets**: Minimum 44px touch areas
- **Smooth Scrolling**: iOS-optimized scroll behavior
- **Bottom Padding**: Content padded above fixed nav

### CSS Utilities

```css
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

@media (hover: none) and (pointer: coarse) {
  button, a, [role="button"] {
    min-height: 44px;
  }
}
```

---

## Admin Console

### Access

- **URL**: `/admin`
- **Credentials**: Username `admin`, Password `admin123`

### Features

#### 1. Analytics Dashboard
- Total users and active users (7-day, 30-day)
- Session counts and average duration
- Login event tracking

#### 2. User Management
- User list with statistics
- Individual user detail pages
- Session history per user

#### 3. Session Tracking
- All sessions across platform
- Session quality metrics
- Funnel analysis

#### 4. Content Performance
- Scenario usage analytics
- Skill coverage tracking

#### 5. Avatar Usage
- Avatar popularity metrics
- Session distribution by avatar

#### 6. Cost Monitoring
- API usage tracking by service
- Cost breakdown by user
- Daily cost rollups
- Budget guards and alerts

### Admin-Only Endpoints

All admin endpoints require the `requireAdmin` middleware, which checks for admin role in user session.

---

## Development Guide

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon recommended)
- OpenAI API key
- (Optional) HeyGen API key for video avatars
- (Optional) AWS S3 for file storage

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...

# Optional
HEYGEN_API_KEY=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
TAVILY_API_KEY=...
```

### Getting Started

```bash
# Install dependencies
npm install

# Run database setup (migrations + seeds)
npm run db:setup

# Start development servers
npm run dev
```

### Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start both frontend and backend |
| `npm run db:setup` | Run migrations and seeds |
| `npm run db:migrate:sql` | Run SQL migrations only |
| `npm run db:seed` | Run seed files only |
| `npm run db:migrate` | Drizzle schema push |

### Code Conventions

- **TypeScript**: Strict mode enabled
- **ES Modules**: `"type": "module"` in package.json
- **Formatting**: Consistent indentation, no trailing semicolons preference
- **Component Structure**: Function components with hooks
- **API Responses**: `{ success: boolean, data/error: ... }`

### Adding New Features

1. **Database Changes**: Add to `shared/schema.ts`, run `npm run db:push`
2. **API Endpoints**: Add route file in `api/routes/`, mount in `api/index.ts`
3. **Frontend Pages**: Add page in `ui/pages/`, add route in `ui/App.tsx`
4. **Components**: Add to `ui/components/` with appropriate subdirectory

---

## Deployment

### Workflows Configuration

Two development workflows are configured:

| Workflow | Command | Purpose |
|----------|---------|---------|
| API Server | `cd avatar-practice-lab-export && npm run dev` | Backend server |
| Vite Frontend | `cd avatar-practice-lab-export && npx vite` | Frontend dev server |

### Production Deployment

The app is designed for Replit deployment with:
- Autoscale deployment target for web serving
- PostgreSQL database (Neon-backed)
- Environment secrets management
- Static file serving from Vite build

### Health Check

```
GET /health → { status: 'ok' }
```

---

## Appendix

### Glossary

| Term | Definition |
|------|------------|
| Role Kit | Pre-configured interview setup for a specific job role |
| Scenario | A practice situation with defined context and objectives |
| Rubric | Assessment criteria for evaluating performance |
| Avatar | AI-powered character that interacts with the user |
| Transcript | Complete record of a practice session conversation |
| Cultural Preset | Communication style configuration (e.g., direct vs. indirect) |

### File Naming Conventions

- React components: `PascalCase.tsx`
- Utility files: `kebab-case.ts`
- Page files: `page.tsx` in feature directory
- API routes: `kebab-case.ts`

### Related Documentation

- [React Documentation](https://react.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [OpenAI API Reference](https://platform.openai.com/docs/)
- [HeyGen Documentation](https://docs.heygen.com/)

---

*This documentation is maintained alongside the codebase. For the latest updates, refer to the `replit.md` file in the project root.*
