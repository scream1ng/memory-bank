# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Memory Bank

Scoped capture-and-analysis tool. One project = one topic. Users dump text and photos, then chat with AI over everything collected.

Stack: Next.js 16 / React 19 / Tailwind 4 / TypeScript. Reference `project-map.md` for full spec.

> **Note:** Read `AGENTS.md` before writing Next.js code — APIs may differ from training data.
>
> **Breaking changes vs. training data:**
> - `middleware.ts` is deprecated → use `proxy.ts` with `export function proxy()`
> - `cookies()` from `next/headers` is async → `await cookies()`
> - `@supabase/ssr` cookie adapter uses `getAll`/`setAll` (not `get`/`set`/`remove`)

## Commands

```bash
npm run dev      # dev server (localhost:3000)
npm run build    # production build
npm run lint     # eslint

npx supabase start   # start local Supabase (Docker required)
npx supabase stop    # stop local Supabase
npx supabase db reset  # reset DB + re-run migrations
```

Local Supabase ports (shifted +10 to avoid conflict with other projects on 5432x):
- API / Project URL: http://127.0.0.1:54331
- Studio: http://127.0.0.1:54333
- DB: postgresql://postgres:postgres@127.0.0.1:54332/postgres

---

## Planned Stack

| Layer | Tech |
|---|---|
| Web frontend | Next.js 14 (App Router) |
| Mobile | Expo (React Native) |
| API | Next.js API Routes + tRPC |
| DB | Supabase (Postgres + RLS) |
| Storage | Supabase Storage (per-project buckets) |
| Auth | Supabase Auth (email + Google OAuth) |
| Realtime | Supabase Realtime |
| AI | BYO subscription (user's own Claude/ChatGPT) or personal API key |
| Hosting | Vercel (web) + Expo EAS (mobile) |

---

## Architecture

### Layout (3-panel, claude.ai-style)
- **Left:** project list + new project + user account
- **Middle:** memo canvas — freeform text blocks + photo grid, drag-drop upload, no AI here
- **Right:** two tabs — Summary (AI-generated .md card) and Ask AI (chat scoped to project)
- **Mobile:** single panel with bottom nav (Projects / Canvas / AI)

### Context Engine (core concept)
When content changes, the app auto-generates a `.md` summary file for the project — all notes condensed, all photos described once. The AI reads this file on every chat message rather than re-processing raw content. Targeted photo retrieval only when a message needs specific image detail. This is what makes AI fast and cheap.

### AI model
- No API costs to the app — users connect their own Claude or ChatGPT subscription
- Fallback: personal API key entry
- The connector must be a swappable module (provider terms can change)

### Auth policy
- Login required for ALL access — no anonymous viewing, no public projects
- Roles: Owner / Editor / Viewer (see `project-map.md` §4 for permission matrix)

---

## Data Model (planned tables)

| Table | Purpose |
|---|---|
| `users` | Supabase Auth managed |
| `ai_connections` | Per-user AI subscription / API key (encrypted) |
| `teams` | Team workspace |
| `team_members` | team_id, user_id, role |
| `projects` | id, team_id (nullable), owner_id, name |
| `project_members` | project_id, user_id, role |
| `memo_blocks` | id, project_id, type (text/photo), content, order |
| `media` | id, project_id, memo_block_id, storage_path |
| `context_files` | id, project_id, generated .md, version, updated_at |
| `ai_messages` | id, project_id, user_id, role (user/assistant), content |

Supabase RLS enforces all access — only project members can read, only editors/owners can write.

---

## Build Phases

1. **MVP (web):** auth, personal projects, memo canvas, context engine, AI panel, invite by email
2. **Team:** team workspace, roles, realtime sync
3. **Mobile:** Expo app, camera capture, share sheet, offline drafts
4. **Export & polish:** DOCX/CSV export, activity log, full-text search

---

## Key Constraints

- Photos stored: JPEG, PNG, HEIC (convert on upload), WebP. Max 20MB/photo, 500MB/project (MVP).
- Offline mobile: text only — photo upload queues until reconnected.
- HEIC conversion: test against real iOS camera output specifically.
- AI chat history scope (per-user vs shared) — open question, decide before building AI panel.
- Default team member role (editor vs viewer) — open question, decide before team workspace.
