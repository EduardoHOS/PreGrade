// ── Enums ──────────────────────────────────────────────────────

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}

export enum AssignmentType {
  ESSAY = 'essay',
  QUIZ = 'quiz',
  EXAM = 'exam',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  CHECKBOXES = 'checkboxes',
  SHORT_ANSWER = 'short_answer',
  PARAGRAPH = 'paragraph',
  FILE_UPLOAD = 'file_upload',
}

export enum GradeStatus {
  AUTO_GRADED = 'auto_graded',
  PARTIAL = 'partial',
  PENDING_MANUAL = 'pending_manual',
  COMPLETE = 'complete',
  AI_PENDING = 'ai_pending',
  AI_GRADED = 'ai_graded',
  PROCESSING_AI = 'processing_ai',
  TEACHER_REVIEWED = 'teacher_reviewed',
}

export enum ReleaseMode {
  BATCH = 'batch',
  ROLLING = 'rolling',
}

export enum ContestStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  RESOLVED_UPHELD = 'resolved_upheld',
  RESOLVED_ADJUSTED = 'resolved_adjusted',
}

export enum ReviewAction {
  ACCEPT = 'accept',
  MODIFY = 'modify',
  REJECT = 'reject',
  SKIP = 'skip',
}

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
  CANCELLED = 'cancelled',
}

export enum EnrollmentStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  DROPPED = 'dropped',
}

export enum SubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
  LATE = 'LATE',
}

export enum AssignmentEvalMode {
  ESSAY = 'essay',
  SHORT_ANSWER = 'short_answer',
  CODING_TASK = 'coding_task',
  REFLECTION = 'reflection',
  CASE_STUDY = 'case_study',
  RESEARCH_SUMMARY = 'research_summary',
  CREATIVE_WRITING = 'creative_writing',
  LAB_REPORT = 'lab_report',
  COMPARATIVE_ESSAY = 'comparative_essay',
  PERSUASIVE_WRITING = 'persuasive_writing',
  POETRY_RESPONSE = 'poetry_response',
  RESEARCH_OUTLINE = 'research_outline',
  PEER_REVIEW = 'peer_review',
  ANNOTATED_BIBLIOGRAPHY = 'annotated_bibliography',
  MATH_PROOF = 'math_proof',
  MULTILINGUAL = 'multilingual',
  DEFAULT = 'default',
}

// ── Interfaces ─────────────────────────────────────────────────

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface QuizResult {
  submissionId: string;
  totalPoints: number;
  maxPoints: number;
  status: string;
  isLate: boolean;
  questionResults: QuestionResult[];
}

export interface QuestionResult {
  questionId: string;
  answerId: string;
  isCorrect: boolean;
  pointsAwarded: number;
  studentAnswer: string | null;
  correctAnswer?: string[];
  partialCredit?: PartialCreditBreakdown;
}

export interface PartialCreditBreakdown {
  correctSelections: number;
  incorrectSelections: number;
  totalCorrect: number;
  formula: string;
}
