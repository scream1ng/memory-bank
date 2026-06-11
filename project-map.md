# Memory Bank — Project Map

**Version:** 1.2
**Date:** June 2026
**Author:** Oakky

**Changelog**
- v1.2 — Added AI strategy (context file + BYO subscription), layout reference, login-required policy, pricing decision
- v1.1 — Added problem statement, goals/non-goals, roles matrix, constraints, risks, metrics, competitors
- v1.0 — Initial map

---

## 1. Problem Statement

Information gets scattered the moment it's created. A photo goes to the phone camera roll. A note goes to WhatsApp or a random memo app. A receipt gets emailed. An observation gets typed into a Word doc on the wrong computer. By the time you need to do something useful with it — write a report, file a claim, brief a colleague — you're hunting across four apps and two devices to piece it together.

**Memory Bank solves this with one rule: everything about a topic goes in one place, and you can ask AI about all of it.**

One project per topic. Dump text and photos freely, no formatting required. Then ask AI to summarise, categorise, draft, or extract — from everything you've collected, including the photos.

---

## 2. Goals & Non-Goals

### In scope
- One project = one topic. All text and photos for that topic live together — the project is a **store hub** for everything on that topic.
- Freeform capture — no templates, no required fields, no categories to pick upfront.
- AI chat scoped to a project — reads all collected content, produces any output you ask for.
- Login required for everyone — Google sign-in or email account. No anonymous access.
- Private by default. Share with specific people (they sign in to view).
- Works on web and mobile. Mobile can shoot photos directly into a project.
- Small team support — teammates can add to the same project in real time.
- Users connect their **own AI subscription** — the app does not pay per-call API costs.

### Out of scope (deliberately)
- Not a task manager — no due dates, assignees, or kanban boards.
- Not a full accounting or expense app — no bank sync, no tax categories, no P&L.
- Not a real-time collaborative editor like Notion or Google Docs.
- Not a file manager — not designed to store PDFs, spreadsheets, or arbitrary documents.
- Not a chat tool — there is no messaging between team members, only shared content.
- No anonymous/public access — every viewer signs in.

---

## 3. What We're Building

A project-scoped capture and analysis tool for individuals and small teams. Each project is a **store hub**: users dump text notes and photos into a freeform canvas, and the right panel holds an AI chat that works from everything collected. Private by default, shareable with signed-in people on demand.

### Layout

Same shape as claude.ai — familiar to anyone who has used a modern AI chat app:

```
┌────────────┬──────────────────────────┬────────────────┐
│  LEFT      │  MIDDLE                  │  RIGHT         │
│            │                          │                │
│  Project   │  Memo canvas             │  Two tabs:     │
│  list      │  — text blocks           │                │
│            │  — photo blocks          │  [Summary]     │
│  + New     │  — drag-drop upload      │  stats + AI    │
│  project   │                          │  summary card  │
│            │  No AI here — just       │                │
│  User      │  capture and dump        │  [Ask AI]      │
│  account   │                          │  chat scoped   │
│  (bottom)  │                          │  to project    │
└────────────┴──────────────────────────┴────────────────┘
```

**Mobile:** single panel at a time with bottom navigation (Projects / Canvas / AI).

### How the AI works (plain language)

1. Every time content is added or changed, Memory Bank automatically builds a **summary file** (a `.md` document) of everything in the project — all notes condensed, all photos described.
2. When you open the AI chat, the AI reads that summary file first, so it already knows the whole project without re-processing everything.
3. You ask for anything — summarise, make a table, draft a report. If the question needs detail from specific photos, the AI pulls in just those photos.
4. This keeps the AI fast and cheap — it doesn't re-read 50 photos on every message.

### AI subscription model (BYO — bring your own)

Instead of Memory Bank paying per-message API costs (which gets expensive and forces us to charge users), users **connect their existing AI subscription** — e.g. their Claude or ChatGPT account — the same pattern tools like OpenClaw use. Memory Bank routes AI requests through the user's own plan.

- App AI cost: near zero.
- User cost: nothing extra if they already have an AI subscription.
- Fallback: an option to enter their own API key for users without a subscription.

⚠️ **Note:** subscription-connection methods depend on what the AI providers officially allow, and their terms can change. This needs verification at build time — see Risks.

---

## 4. Users & Roles

Everyone signs in — Google or email account. No anonymous viewing.

| Action | Owner | Editor | Viewer |
|---|:---:|:---:|:---:|
| View project content | ✓ | ✓ | ✓ |
| Add / edit memo blocks | ✓ | ✓ | — |
| Upload photos | ✓ | ✓ | — |
| Delete blocks | ✓ | ✓ | — |
| Use AI chat | ✓ | ✓ | ✓ (own subscription) |
| Invite members | ✓ | — | — |
| Change member roles | ✓ | — | — |
| Rename / archive project | ✓ | — | — |
| Delete project | ✓ | — | — |

**Personal projects** — Owner only until shared.
**Team projects** — visible to all team members by default at Editor level.
**Share links** — a link can be sent to anyone, but they must sign in; the owner approves or pre-assigns their role.

---

## 5. Use Cases

### 5.1 SOP — Design change documentation
On the floor documenting DC-048 (press brake tooling change). Create a project, shoot photos of the new tooling setup, type a quick note ("replaced 4mm punch with 6mm, die clearance adjusted, R&D sign-off pending"). Ask AI: *"Summarise this as an SOP change description."* Get a structured paragraph ready to paste into the SOP document. Previously: photos in WhatsApp, notes in a Word doc, write-up done from memory two days later.

### 5.2 Machinery inspection
Walking a Q3 inspection across 20 machines. Dump photos of flagged items into the project. Add a short note per issue. Ask AI: *"List all issues found and generate a corrective action table with machine ID, fault, priority, and recommended action."* Team can see the project live as you walk the floor.

### 5.3 Work trip expenses
Travelling to Melbourne for a supplier visit. Shoot each receipt as you go, type quick notes ("$38 taxi", "$142 client dinner × 3 pax"). Ask AI at the end: *"Format this as an expense claim table."* AI flags the client dinner as potentially over policy limit. Copy-paste into the company claim form.

### 5.4 Personal monthly budget
One project per month. Type spending as it happens. Shoot receipts where needed. Ask AI: *"Where am I spending the most?"* or *"Am I on track for under $800?"* Month-on-month comparison without a spreadsheet.

### 5.5 Client site survey
Visiting a client site with the team. Multiple people in different areas simultaneously — each adds photos and notes to the same project in real time. Back at the office, ask AI to consolidate into a single site report.

### 5.6 Supplier audit
Documenting a multi-day audit. Photos of equipment, certifications, floor conditions. Notes on non-conformances. Ask AI: *"Draft a formal audit findings summary."* Invite the client as a signed-in Viewer.

---

## 6. Scope of Work

### Auth & identity
Sign up and log in — Google OAuth or email/password. Password reset, profile management, session handling across web and mobile. Login required for all access.

### AI subscription connector
Connect the user's own AI subscription (Claude / ChatGPT) or personal API key. Store the connection securely per user. All AI requests route through the user's own plan.

### Team workspace
Create a named team, invite members by email, assign roles, remove members, rename or delete the workspace.

### Projects
Create, rename, archive, delete projects. Scoped to a team or personal. Searchable by name and date.

### Sharing & access control
Invite specific people by email with editor or viewer role. Share links require sign-in. Change member roles at any time.

### Memo canvas
Freeform text blocks and photo grid blocks. Drag-and-drop or paste to upload. Reorder blocks. Inline edit or delete. Real-time sync — teammates see new blocks appear live.

### Context engine
Auto-generates and refreshes the project summary `.md` whenever content changes — notes condensed, photos described once. This file is what the AI reads.

### AI panel
Two tabs. Summary tab: the generated summary with key stats, refreshable on demand. Ask AI tab: persistent chat scoped to the project, powered by the context engine + targeted photo retrieval. Quick-prompt shortcuts for common tasks.

### Mobile (Expo)
Camera capture direct to a project. iOS/Android share sheet integration. Offline draft with sync on reconnect. Push notifications for teammate activity.

---

## 7. Stack

| Layer | Choice | Reason |
|---|---|---|
| Web frontend | Next.js 14 (App Router) | SSR, file upload, responsive, existing Vercel workflow |
| Mobile | Expo (React Native) | Camera access, share sheet, shared API logic with web |
| API | Next.js API Routes + tRPC | Co-located, type-safe, no separate server at MVP |
| Database | Supabase (Postgres) | Row-level security enforces project access natively |
| File storage | Supabase Storage | Buckets scoped per project, signed URLs, direct upload |
| Auth | Supabase Auth | Email/password + Google OAuth, invite flow built-in |
| Realtime | Supabase Realtime | Live memo updates across team members |
| AI | User's own subscription (BYO) or personal API key | Near-zero AI cost to the app; verify provider terms at build time |
| Hosting (web) | Vercel | Zero-config, fits existing setup |
| Hosting (mobile) | Expo EAS | OTA updates, iOS + Android builds |

**MVP running cost:** Vercel free + Supabase free + AI cost carried by users = **~$0/month** until meaningful traffic.

---

## 8. Data Model

| Table | Purpose |
|---|---|
| `users` | Managed by Supabase Auth |
| `ai_connections` | Per-user AI subscription / API key connection (encrypted) |
| `teams` | Team workspace — id, name, owner_id |
| `team_members` | team_id, user_id, role |
| `projects` | id, team_id (nullable), owner_id, name |
| `project_members` | project_id, user_id, role (owner / editor / viewer) |
| `memo_blocks` | id, project_id, author_id, type (text / photo), content, order |
| `media` | id, project_id, memo_block_id, storage_path, mime_type |
| `context_files` | id, project_id, generated .md summary, version, updated_at |
| `ai_messages` | id, project_id, user_id, role (user / assistant), content |

Supabase RLS policies enforce: only signed-in project members can read; only editors and owners can write.

---

## 9. Benefits

**One place for everything**
Stop hunting across camera roll, WhatsApp, email, and shared drives. One project, one place. Text and photos together.

**Ask AI from your own evidence**
The AI reads your actual notes and photos — not generic knowledge. Outputs are grounded in what you collected.

**No formatting required at capture time**
Dump information the way you naturally would. Structure it later by asking AI.

**Time saved on write-ups**
Raw notes captured in 5 minutes on-site. AI drafts a structured SOP change, expense claim, or inspection report in 30 seconds.

**Near-zero AI running cost**
BYO subscription model means the app doesn't bleed money per message, and users who already pay for Claude or ChatGPT pay nothing extra.

**Team alignment without extra steps**
Teammates see updates live. The project is the briefing.

**Searchable, permanent record**
Every project stays stored with full context. Find any past DC, inspection, trip, or month's spending in seconds.

---

## 10. Build Phases

**Phase 1 — MVP (web only)**
Auth (Google + email), personal projects, memo canvas (text + photos), context engine (auto .md summary), AI panel with BYO subscription connector, invite by email.

**Phase 2 — Team**
Team workspace, member roles, real-time canvas sync, role-based access control.

**Phase 3 — Mobile**
Expo app with camera capture, share sheet integration, offline drafts, push notifications.

**Phase 4 — Export & polish**
DOCX export, CSV export for expenses, activity log, full-text search across all projects.

---

## 11. Pricing

**Free while it's an MVP.** The BYO-AI model makes this sustainable — the app's only real costs are hosting and storage, both near zero on free tiers.

If it grows beyond personal/small-team use:
- **Personal: free forever** — own projects, own AI subscription.
- **Team plan: ~AU$5 per user/month** — team workspace, roles, realtime sync, priority support.
- Storage cap on free tier (e.g. 500MB/project); paid lifts it.

No ads, no selling data — the product is the subscription.

---

## 12. Constraints & Assumptions

- Login required for all access — no anonymous viewing.
- File types supported at MVP: JPEG, PNG, HEIC (converted on upload), WebP.
- Max upload size per photo: 20MB.
- Max storage per project at MVP: 500MB.
- Max team members at MVP: 10.
- Photos are described once by AI when uploaded (stored in the context file) — not re-processed every chat message.
- Offline mode (mobile): text notes only. Photo upload queues until reconnected.
- Browser support: Chrome, Safari, Firefox — last 2 major versions.
- No end-to-end encryption at MVP. Data encrypted at rest by Supabase. AI connection credentials encrypted.
- AI model names checked at build time — not hardcoded in this document.

---

## 13. Risks & Open Questions

| Risk | Mitigation |
|---|---|
| **BYO subscription connection may violate AI provider terms or break when providers change auth** | Verify officially supported methods at build time; design the connector as a swappable module; API-key fallback always available |
| Context file goes stale or drifts from actual content | Regenerate on every content change; version the file; manual refresh button |
| Storage costs at scale from large photo libraries | Per-project storage limit; compression on upload |
| Shared link spam (mass invite requests) | Owner approval required; rate limiting |
| Data retention — how long do deleted projects persist? | Soft delete with 30-day recovery window, then hard purge |
| HEIC conversion reliability on server | Test against iOS camera output specifically; fallback to client-side conversion |
| Supabase Realtime at scale (>200 concurrent) | Acceptable at MVP; migrate to Ably if needed at growth |

**Open questions:**
- Should AI chat history be shared across all project members, or per-user?
- What is the right default for team projects — all members are editors, or all are viewers?

---

## 14. Success Metrics

| Metric | Target (3 months post-launch) |
|---|---|
| Time from project creation to first AI output | Under 10 minutes |
| Projects created per active user per month | 3+ |
| % of projects with at least one AI chat message | 60%+ |
| % of users who successfully connect an AI subscription | 80%+ |
| 30-day user retention | 40%+ |
| Data-loss bug reports | 0 |

---

## 15. Competitor Landscape

| Tool | What it does | Why Memory Bank is different |
|---|---|---|
| Notion | Docs and databases with structure | Requires upfront structure; no AI over your own photos |
| Google Keep | Quick notes and photo capture | No projects, no AI, no team sharing with access control |
| Evernote | Notebook-based capture | Dated UX, no vision AI, expensive for teams |
| Apple Notes / Samsung Notes | Device-native notes + photos | No team sharing, no AI, siloed to device ecosystem |
| Expensify | Expense tracking with receipt scan | Single-purpose, no freeform notes, no general AI chat |
| WhatsApp / Telegram groups | Team photo and note sharing | No structure, no AI, no search, content gets buried |

Memory Bank's distinction: **scoped projects + freeform capture + AI that reads both text and photos — at near-zero AI cost via BYO subscription**.

---

*Memory Bank — project map v1.2*
