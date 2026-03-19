import { AssignmentEvalMode } from '../../../shared/types';

export interface PromptInput {
  submission: { content: string };
  assignment: {
    title: string;
    description: string;
    aiEvaluationMode: AssignmentEvalMode | null;
    aiGradingInstructions: string | null;
  };
  rubric: {
    criteria: Array<{
      id: string;
      name: string;
      description: string;
      maxPoints: number;
      levels?: Array<{ points: number; description: string }>;
    }>;
  };
  studentName?: string;
  evalMode?: string;
}

export interface GradingRequest {
  prompt: string;
  systemPrompt: string;
  maxTokens?: number;
}

export interface GradingResponse {
  content: string;
  modelUsed: string;
  promptVersion: string;
  tokensInput: number;
  tokensOutput: number;
  processingMs: number;
  promptHash: string;
}

export interface ParsedGradingResult {
  overallComments: string;
  criteriaScores: Array<{
    criterionId: string;
    suggestedPoints: number;
    feedback: string;
    confidence: number;
    keyEvidence: string[];
  }>;
  flags: string[];
}

export type PreGradeLogEvent =
  | { event: 'job_enqueued'; submissionId: string; assignmentId: string }
  | { event: 'job_started'; submissionId: string; attempt: number; workerVersion: string }
  | { event: 'gate_failed'; submissionId: string; gate: string }
  | { event: 'pii_detected'; submissionId: string; detectedTypes: string[] }
  | { event: 'eval_mode_detected'; submissionId: string; mode: string; wasAutoDetected: boolean }
  | { event: 'ai_call_started'; submissionId: string; model: string; promptVersion: string; promptHash: string }
  | { event: 'ai_call_completed'; submissionId: string; model: string; tokensInput: number; tokensOutput: number; processingMs: number }
  | { event: 'ai_call_failed'; submissionId: string; errorCode: string }
  | { event: 'evidence_rejected'; submissionId: string; rejectedCount: number }
  | { event: 'db_write_completed'; submissionId: string; status: string }
  | { event: 'job_done'; submissionId: string; processingMs: number; tokensTotal: number }
  | { event: 'job_failed'; submissionId: string; errorCode: string; attempt: number; willRetry: boolean }
  | { event: 'illegal_transition'; gradeId: string; from: string; to: string; actor: string };
