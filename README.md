# PreGrade -- AI Pre-Grading Demo

## Problem

Teachers spend hours grading essays and written assignments manually. For a class of 30 students with 4-page essays, that's 120+ pages of reading, scoring against rubrics, and writing feedback -- per assignment. This bottleneck delays feedback to students and burns out educators.

## Solution

PreGrade is an AI-powered pre-grading system that generates draft scores and feedback for each rubric criterion before the teacher ever opens a submission. Teachers review AI suggestions (accept, modify, or reject), dramatically reducing grading time while maintaining full control over final grades.

**AI never publishes grades directly.** Every score goes through mandatory teacher review.

## Target Users

- **Teachers / Professors** who grade essay-based or written assignments against rubrics
- **Teaching Assistants** who support large courses with high grading volume
- **Educational Institutions** exploring AI-assisted assessment with human-in-the-loop safeguards

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/EduardoHOS/PreGrade.git
cd PreGrade

# 2. Install dependencies
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 3. Set up environment
cp .env.example backend/.env
# Edit backend/.env with your database URL and optionally your GROQ_API_KEY

# 4. Start PostgreSQL (via Docker)
docker-compose up -d

# 5. Push schema & seed demo data
cd backend
npx prisma db push
npx prisma db seed
cd ..

# 6. Run the app
npm run dev
```

Open **http://localhost:5173**

## Demo Video

[![PreGrade Demo](https://img.youtube.com/vi/mY4pVONYops/maxresdefault.jpg)](https://youtu.be/mY4pVONYops)

**Watch the full demo (< 5 min):** https://youtu.be/mY4pVONYops

> No AI media tools (voiceover, avatars, etc.) were used in the production of this video.

## Slide Decks

- **Pitch Deck (11-15 slides):** [View on Canva](https://www.canva.com/design/DAHEbZUorng/pZUfioYNMBSnJxf0yGoYGw/edit?utm_content=DAHEbZUorng&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)
- **10-Layer Architecture Slides:** [View on Canva](https://www.canva.com/design/DAHB39GGdPQ/0qYs0MR0SFqGPQmWtlWQYQ/edit?utm_content=DAHB39GGdPQ&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Teacher | teacher@pregrade.demo | demo1234 |
| Student | alice@pregrade.demo | demo1234 |
| Student | bob@pregrade.demo | demo1234 |
| Student | carol@pregrade.demo | demo1234 |

## Demo Flow

1. **Teacher logs in** -> Grading Center shows AI-pre-graded essays + quiz submissions
2. **Click a submission** -> Split view: essay text with evidence highlights (left) + rubric scores with AI suggestions (right)
3. **Each criterion** shows: AI score, confidence meter, evidence quotes highlighted in the text
4. **Accept / Modify / Reject** each criterion -> **Confirm Grade**
5. **Quiz submissions** -> Auto-graded answers shown, manual grading UI for paragraph questions, then finalize
6. **Gradebook** -> View grade grid -> **Release Grades** to students
7. **Student logs in** -> Sees released grades with rubric breakdown and feedback

## AI & Guardrails

### Where AI Is Used

AI is used in **one place**: pre-grading essay submissions against rubric criteria. The system generates suggested scores, feedback, and evidence quotes per criterion. AI is **not** used for quiz auto-grading (that's deterministic logic), grade publishing, or any student-facing interaction.

### LLM Models & Inference

| | Default | Alternative |
|--|---------|-------------|
| **Model** | Llama 3.3 70B Versatile | GPT-4o-mini |
| **Provider** | Groq (cloud API) | OpenAI (cloud API) |
| **Inference location** | Groq cloud (US) | OpenAI cloud (US) |
| **Architecture** | Open-weight LLM | Proprietary |
| **Prompt strategy** | Single-pass structured JSON output with system + user prompt | Same |
| **RAG pipeline** | None -- rubric + submission sent directly (no embeddings, no retrieval) | Same |
| **Agents** | None -- single deterministic API call per submission | Same |

### Why These Models

| Decision | Rationale |
|----------|-----------|
| **Llama 3.3 70B as default** | Free tier on Groq eliminates cost barrier for education; 70B parameter size provides strong structured output quality; open weights allow auditability |
| **Groq as default provider** | Sub-second inference latency enables interactive grading; free tier supports ~30 req/min (sufficient for classroom use) |
| **GPT-4o-mini as alternative** | Higher accuracy for complex rubrics at ~$0.002/submission; familiar to institutions already using OpenAI |
| **No RAG/embeddings** | Rubric criteria + submission text fit within context window; retrieval adds complexity without benefit for this use case |
| **Single-pass grading** | One API call grades all criteria at once (not one per criterion), minimizing cost and latency |
| **Temperature 0.2** | Low temperature for consistent, deterministic scoring; reduces need for retry/aggregation |
| **No caching** | Each submission is unique; caching would not provide meaningful savings |

### Guardrails Implemented

**Input Filters:**
- **PII Stripping** (`pii-stripper.ts`): Regex-based removal of emails, phone numbers, dates of birth, student IDs, and name patterns before any data reaches the LLM
- **Prompt Injection Detection** (`prompt-builder.ts:detectInjection()`): Scans submission content for common injection patterns (e.g., "ignore previous instructions", system prompt leaks)
- **Language Detection** (`language-detector.ts`): Identifies submission language via `franc` library; includes language-specific grading guidance in prompt

**Output Filters:**
- **JSON Schema Enforcement**: LLM must return structured JSON matching a strict schema; malformed responses are rejected
- **Evidence Validation** (`evidence-validator.ts`): AI-quoted evidence is verified against actual submission text using string similarity (configurable threshold); invalid quotes are rejected
- **Score Bounds**: AI scores are validated against criterion max points; out-of-range values are rejected
- **Confidence Scoring**: Each criterion receives a 0-1 confidence score displayed to the teacher

**Operational Controls:**
- **Max tokens**: Bounded by provider defaults (~4K output)
- **Temperature**: Fixed at 0.2 (configurable via `AI_TEMPERATURE` env var)
- **Timeout**: 60-second hard timeout on provider calls
- **Rate limiting**: Inherits provider rate limits (Groq: ~30 req/min free tier)
- **Tool-use whitelist**: No tool use -- pure text-in/JSON-out inference
- **Data residency**: PII-stripped text sent to US-based providers; all application data stays in your PostgreSQL instance
- **Human-in-the-loop**: Mandatory teacher review before any grade is finalized (enforced by grade state machine)

### Quality & Observability

| Area | Implementation |
|------|---------------|
| **Prompt versioning** | `AI_PROMPT_VERSION` env var tracked per grade; stored in `aiPromptVersion` field |
| **Model tracking** | Model name stored per grade in `aiModelUsed` field |
| **Token telemetry** | Input/output token counts logged per grading job (`tokensInput`, `tokensOutput` in PreGradeJob) |
| **Processing time** | `aiProcessingMs` recorded per grade; `teacherReviewMs` for review duration |
| **Teacher agreement rate** | % of AI suggestions accepted without modification, calculated on confirm |
| **Structured logging** | Pino logger with automatic redaction of sensitive fields |
| **Audit trail** | `AiDataAuditLog` table: submission ID, data categories, PII stripped flag, provider, model, legal basis, retention policy |
| **Fallback behavior** | On AI failure: grade job marked FAILED with error message; teacher can re-trigger or grade manually |
| **Timeout handling** | 60s timeout -> job fails gracefully, no partial writes (atomic transactions) |
| **Pre-baked mode** | Demo ships with pre-computed grades; works fully without any API key |

### Known Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| **Hallucinated evidence** | Evidence validator checks quoted text against source; invalid quotes rejected and flagged |
| **Scoring bias** | Teacher must review every criterion; agreement rate tracking surfaces systematic AI biases over time |
| **Prompt injection via submissions** | Injection detection scans content before inclusion in prompt; flagged but not silently dropped (transparency) |
| **PII leakage to AI** | Regex-based PII stripper runs before all API calls; audit log confirms stripping |
| **Model inconsistency** | Low temperature (0.2) + structured JSON output reduces variance; prompt version tracked per grade |
| **Provider outage** | Graceful failure with error surfaced to teacher; manual grading always available as fallback |
| **Cost overrun** | On-demand only (no batch/auto grading); free tier default; single-pass design minimizes calls |
| **What the app refuses to do** | Will not auto-publish grades, will not grade without a rubric, will not process submissions without data consent flag, will not skip teacher review |

See [RAI.md](RAI.md) for detailed Responsible & Frugal AI documentation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Chakra UI, React Query, Framer Motion, React Router |
| Backend | Express.js, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 (Docker or Supabase) |
| AI | Groq (Llama 3.3 70B) or OpenAI (GPT-4o-mini) |

## Project Structure

```
backend/src/
  ai/           # AI system: prompt builder, provider adapter, PII stripper, 17 eval modes
  routes/       # REST API endpoints
  services/     # Business logic (grading, review, release)
  middleware/   # JWT auth, error handling, grade state machine

frontend/src/
  pages/        # Login, Grading Center, Submission Review, Gradebook, My Grades
  components/   # AI Badge, Confirm Button, Empty State
  contexts/     # Auth context
  layouts/      # Notion-inspired sidebar layout
  theme/        # Chakra UI theme with custom design tokens

shared/
  types.ts      # Shared TypeScript enums and interfaces
```

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) -- System architecture, data flow, LLM integration
- [SECURITY.md](SECURITY.md) -- Secrets, authentication, PII handling, data residency
- [RAI.md](RAI.md) -- Responsible AI choices, guardrails, model selection, cost controls
- [CHANGELOG.md](CHANGELOG.md) -- Version history

## Team

| Name | Role |
|------|------|
| Eduardo HOS | Full-Stack Developer |

## License

This project is part of the KOAN-EFI-OXFORD program. All rights reserved.
