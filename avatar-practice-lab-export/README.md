# Avatar Practice Lab

AI-powered voice-first conversation practice platform with HeyGen streaming avatars.

## Features

- **Voice-First Practice**: Practice workplace conversations with AI avatars
- **HeyGen Integration**: Real-time streaming avatar with voice interaction
- **Scenario-Based Learning**: Pre-built scenarios mapped to skills
- **AI Analysis**: Get feedback on communication patterns, pacing, and delivery
- **Session Management**: Queue system for concurrent session handling

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Required keys:
- `DATABASE_URL` - PostgreSQL connection string
- `HEYGEN_API_KEY` - Get from [HeyGen](https://heygen.com)
- `OPENAI_API_KEY` - Get from [OpenAI](https://platform.openai.com)

### 3. Set Up Database

Run the migration script:

```bash
psql $DATABASE_URL -f database/migrations/001_create_tables.sql
```

Or use Drizzle:

```bash
npm run db:migrate
```

### 4. Seed Data (Optional)

Load sample scenarios, personas, and tones:

```bash
psql $DATABASE_URL -f database/seeds/scenarios.sql
psql $DATABASE_URL -f database/seeds/personas.sql
psql $DATABASE_URL -f database/seeds/tones.sql
```

### 5. Start Development Server

```bash
npm run dev
```

## Project Structure

```
avatar-practice-lab/
├── api/
│   ├── routes/
│   │   └── avatar-simulator.ts    # Main API endpoints
│   ├── storage.ts                 # Database operations
│   └── index.ts                   # Express server entry
├── ui/
│   ├── pages/                     # React page components
│   ├── components/                # Reusable UI components
│   ├── contexts/                  # React contexts
│   ├── hooks/                     # Custom React hooks
│   ├── lib/                       # Agent configurations
│   └── types/                     # TypeScript types
├── shared/
│   └── schema.ts                  # Drizzle database schema
├── database/
│   ├── migrations/                # SQL migration scripts
│   └── seeds/                     # Sample data
└── package.json
```

## API Endpoints

### Scenarios
- `GET /api/avatar/get-scenarios` - List all scenarios
- `POST /api/avatar/generate-scenario` - Generate new scenario with AI

### Sessions
- `POST /api/avatar/session/start` - Start HeyGen session
- `GET /api/avatar/session/status` - Check session status
- `POST /api/avatar/session/heartbeat` - Keep session alive
- `POST /api/avatar/session/end` - End session

### Transcription & Analysis
- `POST /api/avatar/transcribe` - Transcribe audio with Whisper
- `POST /api/avatar/analyze-session` - Get AI feedback on session

### Queue Management
- `GET /api/avatar/session/availability` - Check if sessions available
- `POST /api/avatar/session/queue/join` - Join waiting queue
- `GET /api/avatar/session/queue/position` - Check queue position

### Cultural Style Presets
- `GET /api/avatar/cultural-presets` - List all cultural communication presets
- `GET /api/avatar/cultural-presets/:id` - Get preset details
- `GET /api/avatar/cultural-presets/default` - Get default preset

## Cultural Communication Styles

The platform supports intercultural communication practice through GlobeSmart-based cultural style presets. These presets modify how the avatar behaves in conversation without changing the scenario, objective, or skill lens.

### Available Presets

| Preset ID | Name | Description |
|-----------|------|-------------|
| `direct_task_focused` | Direct & Task-Focused | Clear, explicit, outcome-oriented communication |
| `indirect_relationship_focused` | Indirect & Relationship-Focused | Subtle, context-rich, harmony-preserving communication |
| `hierarchical_formal` | Hierarchical & Formal | Role-aware, respect-driven communication |
| `expressive_persuasive` | Expressive & Persuasive | Energetic, emotion-forward, influence-driven communication |
| `analytical_reserved` | Analytical & Reserved | Precise, logic-driven, low-emotion communication |
| `global_professional_adaptive` | Global Professional (Adaptive) | Balanced, adaptive, globally fluent communication |

### Design Principles

- **Behavior, not nationality**: Presets use behavioral descriptors only - no stereotypes or caricatures
- **Optional and additive**: Cultural presets are optional; sessions work without them
- **Same objective, different path**: Cultural style affects HOW you communicate, not WHAT the objectives are
- **No heavy accent simulation**: Accent guidance is subtle (pacing, intonation) not exaggerated

### Usage

Pass `culturalPresetId` when starting a session:

```typescript
POST /api/avatar/session/start
{
  "heygenSessionId": "...",
  "scenarioId": 1,
  "avatarId": "avatar_id",
  "culturalPresetId": "direct_task_focused"  // optional
}
```

## Integration Guide

### Express.js

```typescript
import express from 'express';
import { avatarSimulator } from './api/routes/avatar-simulator';

const app = express();
app.use('/api/avatar', avatarSimulator);
```

### React

```tsx
import { AvatarSessionProvider } from './ui/contexts/AvatarSessionContext';

function App() {
  return (
    <AvatarSessionProvider>
      <YourRoutes />
    </AvatarSessionProvider>
  );
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| HEYGEN_API_KEY | HeyGen API key for avatar streaming | Yes |
| OPENAI_API_KEY | OpenAI API key for Whisper/GPT | Yes |
| AWS_ACCESS_KEY_ID | AWS key for S3 storage | Optional |
| AWS_SECRET_ACCESS_KEY | AWS secret for S3 | Optional |
| S3_BUCKET_NAME | S3 bucket for audio files | Optional |

## License

Private - All rights reserved.
