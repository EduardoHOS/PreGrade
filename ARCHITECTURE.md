# Architecture

## Layered Diagram

```
+-----------------------------------------------------------+
|                      FRONTEND                              |
|  React 18 + Chakra UI + React Query + Framer Motion        |
|  Pages: Login | GradingCenter | SubmissionReview |          |
|         Gradebook | MyGrades                               |
+----------------------------+------------------------------+
                             | REST API (/api/*)
                             v
+-----------------------------------------------------------+
|                      BACKEND                               |
|  Express.js + TypeScript                                   |
|  +-------------------------------------------------------+ |
|  | Middleware Layer                                       | |
|  |  JWT Auth | Error Handler | Grade State Machine Guard  | |
|  +-------------------------------------------------------+ |
|  | Route Layer                                           | |
|  |  /auth | /grading | /grades | /submissions |          | |
|  |  /gradebook | /grade-release | /my-grades             | |
|  +-------------------------------------------------------+ |
|  | Service Layer                                         | |
|  |  GradingService | GradeReview | GradeRelease |        | |
|  |  AuditLog                                             | |
|  +-------------------------------------------------------+ |
|  | AI Layer                                              | |
|  |  PreGradeService | PromptBuilder | ProviderAdapter |   | |
|  |  PII Stripper | EvidenceValidator | 17 Eval Modes     | |
|  +-------------------------------------------------------+ |
|  | Data Layer                                            | |
|  |  Prisma ORM                                           | |
|  +-------------------------------------------------------+ |
+----------------------------+------------------------------+
                             |
                             v
+-----------------------------------------------------------+
|                    POSTGRESQL                              |
|  Users | Courses | Assignments | Submissions | Grades      |
|  Rubrics | RubricScores | Questions | Answers              |
|  PreGradeJobs | AiDataAuditLog | GradeHistory              |
+-----------------------------------------------------------+
```

## Data Flow

```
Student submits essay/quiz
        |
        v
  Submission stored in DB (status: SUBMITTED)
        |
        v
  +----- Is ESSAY with AI enabled? -----+
  |                                      |
  YES                                    NO (QUIZ)
  |                                      |
  v                                      v
  PreGradeService                   GradingService
  1. Validate gates                 1. Auto-grade MC/TF/CB/SA
  2. Strip PII                      2. Mark PARAGRAPH as manual
  3. Build prompt (eval mode)       3. Store grade (PARTIAL/AUTO_GRADED)
  4. Call LLM via ProviderAdapter        |
  5. Parse JSON response                 v
  6. Validate evidence quotes       Teacher manually grades
  7. Store Grade + RubricScores     PARAGRAPH questions
        |                                |
        v                                v
  Teacher reviews in UI            Teacher finalizes grade
  Accept/Modify/Reject each             |
  rubric criterion                       v
        |                           Grade status: COMPLETE
        v
  Confirm grade
  (status: COMPLETE)
        |
        v
  Gradebook -> Release grades -> Students see results
```

## LLM Integration Flow

```
  Assignment + Rubric + Submission Content
        |
        v
  PII Stripper (regex: email, phone, SSN, names)
        |
        v
  Language Detector (franc library)
        |
        v
  Prompt Builder
  - Selects eval mode (17 modes: essay, coding, case_study, etc.)
  - Infers mode from assignment type/title if not set
  - Builds system prompt + user prompt
  - Includes rubric criteria with max points
  - Adds JSON schema for structured output
        |
        v
  Provider Adapter
  - Groq (llama-3.3-70b-versatile) -- FREE tier
  - OpenAI (gpt-4o-mini) -- fallback
  - OpenAI SDK compatible interface
  - 60s timeout, temperature 0.2
        |
        v
  Response Parser
  - Extracts JSON from LLM response
  - Validates all criteria are scored
  - Validates evidence quotes exist in source text
  - Flags low-confidence scores
        |
        v
  Atomic DB Write (transaction)
  - Grade record with AI metadata
  - RubricScore per criterion with AI suggestions
  - PreGradeJob status update
  - AiDataAuditLog entry (GDPR compliance)
```

## Key Design Decisions

- **Pre-baked grades**: Demo ships with seed data so it works without an API key
- **Human-in-the-loop**: AI never auto-publishes grades; teacher must review and confirm
- **State machine**: Grade status transitions are enforced (AI_GRADED -> PARTIAL -> COMPLETE)
- **PII safety**: Student data is stripped before sending to LLM providers
- **Audit trail**: Every AI interaction is logged with provider, model, and retention metadata
