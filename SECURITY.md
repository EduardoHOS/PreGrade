# Security Policy

## Secrets Management

- **No secrets in code**: All sensitive values are loaded from environment variables via `.env` files
- **`.env` is gitignored**: The `.env` file is listed in `.gitignore` and never committed
- **`.env.example` provided**: Contains placeholder values only (no real keys or passwords)
- **JWT secret**: Configurable via `JWT_SECRET` env var; the demo default should be changed in production
- **API keys**: `GROQ_API_KEY` and `OPENAI_API_KEY` are optional and only needed for live AI grading
- **Database credentials**: Connection strings in env vars; demo uses Docker with default credentials

## Authentication & Authorization (AuthN/AuthZ)

### Authentication
- JWT-based authentication with 7-day token expiration
- Passwords hashed with **bcryptjs** (salt rounds: 10)
- Token stored in `localStorage` on the client
- Bearer token sent via `Authorization` header on every API request
- Automatic redirect to `/login` on 401 responses

### Authorization
- **Role-based access control** with three roles: `STUDENT`, `TEACHER`, `ADMIN`
- Middleware guards:
  - `authMiddleware` — Validates JWT and attaches user to request
  - `requireTeacher` — Rejects non-teacher requests with 403
  - `requireStudent` — Rejects non-student requests with 403
- **Resource-level checks**: Teachers can only access their own courses' data; students can only view their own submissions and released grades
- **Grade state machine**: Enforces legal status transitions (e.g., only teachers can confirm grades, system cannot set COMPLETE)

## PII Handling

### PII Stripping Before AI Processing
- The `PII Stripper` module runs before any data is sent to external AI providers
- **Detected and removed patterns**:
  - Email addresses
  - Phone numbers
  - Dates of birth
  - Student ID numbers
  - Common name patterns
- Stripped data is replaced with generic placeholders (e.g., `[EMAIL]`, `[PHONE]`)
- Original data remains in the database; only sanitized text is sent to the LLM

### Audit Logging
- Every AI grading interaction is recorded in the `AiDataAuditLog` table
- Logged fields: submission ID, data categories sent, PII stripped (boolean), provider, model, legal basis, retention policy, timestamp
- Supports GDPR compliance requirements

### Data Minimization
- Only the submission content, rubric criteria, and assignment description are sent to the AI
- Student names, emails, and identifying information are stripped before processing
- AI responses are stored as structured data (scores, feedback, evidence) not raw conversation logs

## Data Residency

- **Database**: PostgreSQL, hosted wherever the user configures (local Docker, Supabase, or self-hosted)
- **AI Provider data transit**:
  - **Groq**: Data sent to Groq's API servers (US-based)
  - **OpenAI**: Data sent to OpenAI's API servers (US-based)
  - Both providers receive only PII-stripped submission content
- **No persistent storage at AI providers**: API calls use standard inference endpoints; Groq and OpenAI do not retain API request data for training (per their API terms)
- **Local-first architecture**: All application data (grades, feedback, submissions) remains in your PostgreSQL instance

## Input Validation & Safety

- **Express-validator** used for all route input validation
- **Prompt injection detection**: The `detectInjection()` function in the prompt builder scans submission content for common injection patterns before sending to the LLM
- **Evidence validation**: AI-provided evidence quotes are verified against the actual submission text using string similarity matching
- **JSON schema enforcement**: LLM responses must conform to a strict JSON schema; malformed responses are rejected
- **CORS**: Restricted to configured frontend origins only

## Known Limitations (Demo Context)

- JWT tokens stored in localStorage (production should use httpOnly cookies)
- No rate limiting on API endpoints
- No CSRF protection (acceptable for API-only backend with CORS)
- Demo credentials are hardcoded in seed data (not for production use)
- No TLS/HTTPS configuration (handled by deployment platform in production)
