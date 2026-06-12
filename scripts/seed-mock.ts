import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from '../lib/schema'
import { users, subjects, projects, memo_blocks, context_files } from '../lib/schema'
import { eq } from 'drizzle-orm'

const sql = postgres(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

const EMAIL = 'imbaoak@gmail.com'

async function main() {
  const [user] = await db.select().from(users).where(eq(users.email, EMAIL)).limit(1)
  if (!user) throw new Error(`User not found: ${EMAIL}`)
  console.log('Found user:', user.id)

  // Subjects
  const [subjectWork] = await db.insert(subjects).values({ owner_id: user.id, name: 'Work' }).returning()
  const [subjectPersonal] = await db.insert(subjects).values({ owner_id: user.id, name: 'Personal' }).returning()
  const [subjectResearch] = await db.insert(subjects).values({ owner_id: user.id, name: 'Research' }).returning()

  // Projects + blocks
  const projectDefs = [
    {
      name: 'Q3 Product Roadmap',
      subject_id: subjectWork.id,
      pinned: true,
      blocks: [
        'Ship the context engine by end of June. Priority #1.',
        'Mobile app MVP target: August. Expo + camera capture.',
        'Team collaboration (roles, realtime sync) pushed to Q4.',
        'Key metric: <2s context generation for projects up to 500 blocks.',
      ],
    },
    {
      name: 'Sprint Planning Notes',
      subject_id: subjectWork.id,
      pinned: false,
      blocks: [
        'Sprint 12 goals:\n- Context engine live\n- AI panel v1\n- Bug: photo upload race condition on slow connections',
        'Blockers: Railway Postgres latency spikes during EU peak hours. Investigate pgbouncer.',
        'Retro action item: add error boundaries around the canvas panel.',
      ],
    },
    {
      name: '1:1 Meeting Notes',
      subject_id: subjectWork.id,
      pinned: false,
      blocks: [
        'Discussed promotion timeline — review in September.',
        'Feedback: need to communicate blockers earlier instead of solving solo.',
        'Action: set up weekly async loom update for stakeholders.',
      ],
    },
    {
      name: 'Trip to Japan 🇯🇵',
      subject_id: subjectPersonal.id,
      pinned: true,
      blocks: [
        'Dates: October 10–24, 2026. 2 weeks.',
        'Cities: Tokyo (5 nights) → Kyoto (4 nights) → Osaka (3 nights) → back.',
        'Must-do: teamLab Planets, Fushimi Inari at 5am, Dotonbori ramen crawl.',
        'Budget: ~$3,500 total including flights. Use Wise card for JPY.',
        'Book: JR Pass (7-day), Kyoto ryokan (Airbnb), teamLab tickets 2 months ahead.',
      ],
    },
    {
      name: 'Fitness Goals 2026',
      subject_id: subjectPersonal.id,
      pinned: false,
      blocks: [
        'Target: run 10km under 55 min by September.',
        'Current: 10km in 62 min. Improve by ~1 min/month.',
        'Plan: 4 runs/week. Long run Sunday, tempo Tuesday, easy x2.',
        'Nutrition: 180g protein/day. Track with Cronometer.',
      ],
    },
    {
      name: 'Books to Read',
      subject_id: subjectPersonal.id,
      pinned: false,
      blocks: [
        '✅ The Mom Test — Rob Fitzpatrick\n✅ Shape Up — Ryan Singer\n📖 Currently: Working in Public — Nadia Eghbal\n⏳ Next: The Pragmatic Programmer',
        'Genres this year: product, indie hacking, systems thinking, some fiction.',
      ],
    },
    {
      name: 'LLM Context Window Research',
      subject_id: subjectResearch.id,
      pinned: true,
      blocks: [
        'Core question: at what context size does retrieval beat full-context for cost/quality tradeoff?',
        'Finding: Anthropic claude-opus-4-8 handles 1M tokens but latency grows non-linearly past 200K. Sweet spot ~50K for interactive use.',
        'RAG vs full-context: RAG wins on cost for large corpora (>10K chunks), full-context wins on coherence for bounded projects (<500 blocks).',
        'Memory Bank bet: generate a single .md summary per project. AI reads summary, not raw blocks. Avoids retrieval complexity at MVP scale.',
        'Open question: when summary diverges from raw blocks (user edits old block), is staleness detectable? Add updated_at diff check.',
      ],
    },
    {
      name: 'Competitor Analysis',
      subject_id: subjectResearch.id,
      pinned: false,
      blocks: [
        'Notion AI: great editor, weak on personal capture. Requires structure upfront.',
        'Mem.ai: closest competitor. Automatic linking is impressive, but no BYO key, $8/mo AI tax.',
        'Obsidian + plugins: power users love it, high friction for casual capture.',
        'Differentiation: Memory Bank = zero-structure capture + BYO AI key + context engine. No recurring AI fee.',
      ],
    },
  ]

  for (const def of projectDefs) {
    const [proj] = await db.insert(projects).values({
      owner_id: user.id,
      subject_id: def.subject_id,
      name: def.name,
      pinned_at: def.pinned ? new Date().toISOString() : null,
    }).returning()

    const blockRows = def.blocks.map((content, i) => ({
      project_id: proj.id,
      author_id: user.id,
      position: i,
      type: 'text' as const,
      content,
    }))
    await db.insert(memo_blocks).values(blockRows)

    // Generate context file
    const textBlocks = blockRows.filter(b => b.content.trim())
    const lines = ['# Project Notes']
    for (const b of textBlocks) lines.push('', b.content.trim())
    const content = lines.join('\n')

    await db.insert(context_files).values({ project_id: proj.id, content })
      .onConflictDoUpdate({ target: context_files.project_id, set: { content, updated_at: new Date().toISOString() } })

    console.log('Created:', def.name)
  }

  console.log('\nDone! Created 3 subjects, 8 projects.')
}

main()
  .then(() => sql.end())
  .catch(err => { console.error(err); sql.end().then(() => process.exit(1)) })
