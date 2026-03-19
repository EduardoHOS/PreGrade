# Responsible & Frugal AI

## Design Philosophy

PreGrade is built on the principle that **AI assists but never decides**. Every AI-generated grade is a suggestion that requires explicit teacher review and confirmation before it reaches students.

## Guardrails

### Human-in-the-Loop (Mandatory)
- AI grades are **never auto-published** to students
- Teachers must review each rubric criterion individually (Accept / Modify / Reject)
- A grade cannot be finalized until every criterion has been explicitly reviewed
- Grade state machine enforces this: `AI_GRADED -> PARTIAL -> COMPLETE` (no shortcuts)

### Confidence Transparency
- Every AI rubric score includes a **confidence meter** (0-100%) shown to the teacher
- Low-confidence scores are visually flagged, prompting closer teacher review
- AI flags (anomalies, concerns) are displayed as badges in the grading queue

### Evidence-Based Scoring
- The AI must provide **key evidence quotes** from the submission for each criterion score
- Evidence quotes are **validated**: the system checks that quoted text actually appears in the submission using string similarity matching
- Invalid evidence is rejected and flagged
- Evidence is highlighted directly in the submission text for easy teacher verification

### PII Protection
- Student identifying information is **stripped before AI processing** (emails, phone numbers, names, student IDs)
- Only sanitized academic content reaches the AI provider
- Full audit trail of what data was sent, to which provider, and when

### Prompt Injection Detection
- Submission content is scanned for common prompt injection patterns before being included in the LLM prompt
- Suspicious content is flagged but not silently discarded (transparency over hidden filtering)

## Model Selection

| Provider | Model | Why |
|----------|-------|-----|
| **Groq** (default) | `llama-3.3-70b-versatile` | Free tier, fast inference, open-weight model, good at structured output |
| OpenAI (optional) | `gpt-4o-mini` | Higher accuracy for complex rubrics, cost-effective among OpenAI models |

### Selection Rationale
- **Groq + Llama 3.3 70B** chosen as the default because:
  - **Free tier**: No cost barrier for educational institutions
  - **Open weights**: Model behavior is auditable and reproducible
  - **Fast inference**: Sub-second responses enable interactive grading workflows
  - **Structured output**: Reliable JSON generation for rubric scoring
- OpenAI offered as an alternative for institutions that prefer it

## Cost Controls

### Frugal by Design
- **Pre-baked grades**: Demo ships with pre-computed AI grades, so the app works without any API calls
- **On-demand grading only**: AI is triggered manually per submission ("Re-run AI Grading" button), never in bulk
- **Low temperature** (0.2): Deterministic outputs reduce the need for multiple inference calls
- **Single-pass grading**: One API call per submission grades all rubric criteria at once (not one call per criterion)
- **Token efficiency**: Prompts are structured to minimize input tokens while maintaining grading quality

### Cost Estimates
- **Groq (Llama 3.3 70B)**: Free tier covers ~30 requests/minute, sufficient for classroom use
- **OpenAI (gpt-4o-mini)**: ~$0.002-0.005 per submission (depending on essay length)
- A class of 30 students with 5 essay assignments = ~150 API calls = ~$0.30-0.75 total with OpenAI

## Evaluation Modes

17 specialized evaluation modes ensure the AI receives domain-appropriate grading instructions:

| Mode | Use Case |
|------|----------|
| `essay` | Standard academic essays |
| `short_answer` | Brief factual responses |
| `coding_task` | Programming assignments |
| `reflection` | Personal learning reflections |
| `case_study` | Business/medical case analyses |
| `research_summary` | Literature review summaries |
| `creative_writing` | Fiction, narratives |
| `lab_report` | Scientific lab write-ups |
| `comparative_essay` | Compare/contrast assignments |
| `persuasive_writing` | Argumentative pieces |
| `poetry_response` | Poetry analysis/creation |
| `research_outline` | Research proposal outlines |
| `peer_review` | Peer feedback assignments |
| `annotated_bibliography` | Source annotation tasks |
| `math_proof` | Mathematical proofs |
| `multilingual` | Non-English submissions |
| `default` | Fallback for unclassified types |

Each mode provides specialized rubric interpretation guidance, ensuring the AI evaluates submissions appropriately for the assignment type rather than applying a one-size-fits-all approach.

## Teacher Agreement Tracking

- After teacher review, the system calculates a **teacher agreement rate** (% of AI suggestions accepted without modification)
- This metric is stored per grade and can be used to:
  - Assess AI grading quality over time
  - Identify rubric criteria where AI consistently under/over-performs
  - Inform model selection and prompt tuning decisions

## Limitations & Transparency

- AI grading is **not a replacement** for teacher judgment; it is a time-saving pre-grading tool
- The system is designed for **formative assessment and draft feedback**, not high-stakes examinations
- AI suggestions may contain biases present in the underlying language model
- Multilingual support depends on the base model's training data coverage
- The system does not currently support image-based or handwritten submissions
