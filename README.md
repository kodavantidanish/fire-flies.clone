# Firelog — Meeting Notes & Transcription Platform

A full-stack clone of Fireflies.ai's core meeting-assistant experience: a meetings library, an
interactive transcript synced to audio playback, AI-style summaries, topics, and action items —
all backed by a real REST API and a normalized SQLite database.

> Built as a fullstack assignment. UI is deliberately modeled closely on Fireflies.ai's layout and
> interaction patterns; all code, components, and data are original.

---

## 1. Tech Stack

**Frontend**
- Next.js 14 (App Router) + TypeScript
- TailwindCSS (custom design tokens, no UI kit dependency)
- TanStack React Query — server state, caching, optimistic updates
- React Hook Form + Zod — form state & validation
- lucide-react — icons
- react-hot-toast — notifications

**Backend**
- FastAPI
- SQLAlchemy 2.0 (ORM + relationships)
- Pydantic v2 (request/response schemas & validation)
- SQLite (file-based, zero external services required)

---

## 2. Architecture

```
Browser (Next.js app, :3000)
   │  fetch('/api/...')
   ▼
Next.js rewrite (next.config.mjs) ──proxies──▶ FastAPI (:8000)
                                                    │
                                                    ▼
                                            SQLAlchemy ORM
                                                    │
                                                    ▼
                                              SQLite (firelog.db)
```

The frontend never talks to a hardcoded backend origin — `next.config.mjs` rewrites any
`/api/*` request to `NEXT_PUBLIC_API_URL`, so the same code works locally and in production
without CORS headaches from the browser's perspective (FastAPI still sets CORS headers for
direct API access / tooling).

### Folder structure

```
meeting-ai-clone/
├── backend/
│   ├── app/
│   │   ├── main.py            FastAPI app, CORS, static audio mount
│   │   ├── database.py        SQLAlchemy engine/session
│   │   ├── models.py          ORM models (Meeting, Participant, TranscriptSegment, Topic, ActionItem)
│   │   ├── schemas.py         Pydantic request/response models
│   │   ├── crud.py            DB operations + transcript-paste parser
│   │   ├── seed_data.py       Raw content for 8 seeded meetings
│   │   └── routers/
│   │       └── meetings.py    All /api/meetings routes
│   ├── seed.py                 Wipes + repopulates the database
│   ├── static/audio/           Sample audio file served at /audio/*
│   ├── requirements.txt
│   ├── Procfile                 Render/Heroku-style start command
│   └── runtime.txt
│
└── frontend/
    ├── app/
    │   ├── page.tsx                     Dashboard
    │   ├── meetings/[id]/page.tsx       Meeting detail (notes + transcript)
    │   ├── layout.tsx / providers.tsx
    │   └── (placeholders: ask-fred, uploads, integrations, analytics, ...)
    ├── components/
    │   ├── layout/     Sidebar, Navbar, ComingSoonPage
    │   ├── meetings/    MeetingCard, MeetingModal, TranscriptPanel, TranscriptRow,
    │   │                SummaryPanel, ActionItems, MediaPlayer
    │   └── ui/          LoadingSpinner, EmptyState, DeleteModal
    ├── hooks/useMeetings.ts   All React Query hooks (list/detail/create/update/delete/action items)
    ├── lib/api.ts             Typed fetch client
    ├── lib/utils.ts           Formatting helpers (duration, timestamps, dates)
    └── types/index.ts         Shared TypeScript types mirroring backend schemas
```

---

## 3. Database schema

```
Meeting
 ├─ id (str, PK)            title, host_name, host_initial, meeting_date,
 │                          duration_seconds, language, audio_url, overview,
 │                          is_starred, created_at, updated_at
 │
 ├──1:N── Participant       (meeting_id FK, name, initial, color)
 ├──1:N── TranscriptSegment (meeting_id FK, order_index, speaker_name,
 │                            speaker_color, start_time, end_time, text)
 ├──1:N── Topic             (meeting_id FK, name)
 └──1:N── ActionItem        (meeting_id FK, order_index, text, assignee, completed)
```

### ER Diagram

```
┌────────────────┐        ┌──────────────────┐
│    Meeting      │───1:N──▶│   Participant    │
│ id (PK)         │        │ id (PK)           │
│ title           │        │ meeting_id (FK)   │
│ host_name       │        │ name              │
│ meeting_date    │        │ initial           │
│ duration_seconds│        │ color             │
│ language        │        └──────────────────┘
│ audio_url       │
│ overview        │        ┌──────────────────────┐
│ is_starred      │───1:N──▶│  TranscriptSegment    │
└────────────────┘        │ id (PK)                │
       │                    │ meeting_id (FK)        │
       │                    │ order_index            │
       │                    │ speaker_name/color      │
       │                    │ start_time / end_time    │
       │                    │ text                     │
       │                    └──────────────────────┘
       │
       │            ┌──────────────┐
       ├───1:N───────▶│    Topic     │
       │            │ id (PK)       │
       │            │ meeting_id FK │
       │            │ name          │
       │            └──────────────┘
       │
       │            ┌──────────────────┐
       └───1:N───────▶│   ActionItem      │
                     │ id (PK)            │
                     │ meeting_id (FK)    │
                     │ text / assignee    │
                     │ completed          │
                     └──────────────────┘
```

Cascade deletes are configured on every child relationship (`cascade="all, delete-orphan"`), so
deleting a meeting cleanly removes its participants, transcript, topics, and action items.

---

## 4. API Endpoints

Base URL: `/api`

| Method | Path                                            | Description                              |
|--------|--------------------------------------------------|-------------------------------------------|
| GET    | `/meetings`                                      | List meetings — `?search=&participant=&sort=recent|oldest|title|duration` |
| POST   | `/meetings`                                      | Create a meeting (accepts participants, topics, action items, segments, or `raw_transcript` text to auto-parse) |
| GET    | `/meetings/{id}`                                 | Full meeting detail (segments, topics, action items, participants) |
| PUT    | `/meetings/{id}`                                 | Update meeting metadata / participants / topics |
| DELETE | `/meetings/{id}`                                 | Delete a meeting (204, cascades to children) |
| POST   | `/meetings/{id}/action-items`                    | Add an action item                        |
| PUT    | `/meetings/{id}/action-items/{item_id}`           | Update text / assignee / completed state  |
| DELETE | `/meetings/{id}/action-items/{item_id}`           | Remove an action item                     |
| GET    | `/health`                                        | Health check                              |

All endpoints return proper status codes (`201` create, `204` no-content delete, `404` not found,
`422` validation errors from Pydantic). Interactive docs are available at `/docs` (Swagger) and
`/redoc` when the backend is running.

### Pasted-transcript format

When creating a meeting, `raw_transcript` accepts plain text like:

```
Priya Sharma [00:00]: Let's get started.
Danish Kodavanti [00:12]: Sounds good, quick status update first.
```

`crud._parse_raw_transcript` converts each line into a `TranscriptSegment` with an auto-estimated
5-second window, assigning a consistent color per speaker.

---

## 5. Features implemented

**Dashboard**
- Meeting list with search (title/overview), sort (recent/oldest/title/duration), tabbed views
  (Recent / Upcoming / AI Feed placeholders), participant avatars, starred meetings
- Quick Start shortcuts, welcome hero, settings/profile placeholders

**Meeting detail**
- HTML5 audio player with seek bar, playback speed, skip ±10s, download
- Interactive transcript: click a line to seek audio; audio time auto-highlights and
  auto-scrolls to the active line; transcript search with match highlighting
- Summary panel (overview + topic chips), Notes/Video tabs
- Action items: add, complete/uncomplete (optimistic UI), delete

**CRUD**
- Create meeting via form, or paste a transcript to auto-generate segments
- Edit meeting metadata (title, host, date, participants, overview)
- Delete meeting (confirmation modal, cascades in DB)
- Full action item CRUD

**Persistence**
- Everything lives in SQLite via SQLAlchemy; `seed.py` seeds 8 realistic multi-speaker meetings
  (roadmap syncs, standups, design reviews, sprint planning, client onboarding, retros, 1:1s,
  cross-team syncs) with 15–30 transcript lines each, topics, and action items.

---

## 6. Setup & Installation

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt
python seed.py                # creates + seeds firelog.db
uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Frontend runs at `http://localhost:3000`.

Run both together and visit `http://localhost:3000` — the dashboard loads seeded meetings
immediately.

---

## 7. Deployment

**Backend → Render**
1. New Web Service → point at `backend/`
2. Build command: `pip install -r requirements.txt && python seed.py`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (or use the included `Procfile`)
4. Env vars: `CORS_ORIGINS=https://your-frontend.vercel.app`
5. Note: Render's free tier filesystem is ephemeral — for a persistent demo DB, either reseed on
   each boot (as above) or attach a persistent disk / swap `DATABASE_URL` for a managed Postgres.

**Frontend → Vercel**
1. Import `frontend/` as the project root
2. Env var: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`
3. Deploy — the `next.config.mjs` rewrite handles proxying `/api/*` to the backend at build/runtime.

---

## 8. Assumptions

- Single logged-in user ("Danish") — no authentication/authorization layer, per assignment scope.
- Real speech-to-text and live meeting bots are out of scope; transcripts are seeded or
  user-pasted with a lightweight `Speaker [mm:ss]: text` parser.
- Audio playback uses one shared sample track (`/audio/sample-meeting.mp3`, ffmpeg-generated tone)
  rather than per-meeting real recordings — durations/timestamps are still meeting-specific in the
  transcript data model.
- "Upcoming" and "AI Feed" dashboard tabs, and sidebar items like Integrations, Analytics, Voice
  Agents, Team, and AskFred are intentionally placeholder ("Coming Soon") screens, as permitted by
  the assignment.
- Sort/search/filter happen server-side via query params; there's no pagination since seeded data
  is small (8 meetings) — would add cursor pagination for production scale.

---

## Running the Backend

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install the required dependencies:

```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the `backend` folder by copying the contents of `.env.example` and replacing the placeholder values with your actual credentials.

4. Seed the database:

```bash
python seed.py
```

5. Start the backend server:

```bash
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

> **Note:** If your virtual environment is located elsewhere, update the path accordingly.

---

## Running the Frontend

1. Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

2. Install the dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev



