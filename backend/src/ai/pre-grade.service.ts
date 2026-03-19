import { prisma } from '../database';
import { buildGradingPrompt, detectInjection, inferEvalMode } from './prompt-builder';
import { callGradingModel } from './provider-adapter';
import { validateEvidence } from './evidence-validator';
import { stripPII } from './pii-stripper';
import { PromptInput, ParsedGradingResult } from './types';
import { AssignmentEvalMode } from '../../../shared/types';
import { AuditLogService } from '../services/auditLog.service';
import { aiLogger, Logger } from './ai-logger';

const WORKER_VERSION = '1.0.0';

export class PreGradeService {
  async run(submissionId: string, log?: Logger): Promise<'done' | 'skipped' | 'failed'> {
    const logger = log ?? aiLogger.child({ submissionId });

    try {
      // Phase 1a — Mark as PROCESSING
      await prisma.preGradeJob.update({
        where: { submissionId },
        data: {
          status: 'PROCESSING',
          startedAt: new Date(),
          attempts: { increment: 1 },
          workerVersion: WORKER_VERSION,
        },
      });

      // Phase 1b — Load submission with relations
      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
          assignment: {
            include: {
              course: { select: { teacherId: true } },
              rubric: { include: { criteria: true } },
            },
          },
          user: { select: { firstName: true, lastName: true } },
          grade: { select: { id: true } },
        },
      });

      if (!submission) {
        await this.markFailed(submissionId, 'Submission not found', 'SUBMISSION_NOT_FOUND');
        return 'failed';
      }

      const { assignment } = submission;
      const rubric = assignment.rubric;
      const course = assignment.course;

      // Phase 1c — Gate checks
      const gates: Array<{ condition: boolean; errorCode: string }> = [
        { condition: assignment.aiGradingEnabled !== true, errorCode: 'AI_GRADING_DISABLED' },
        { condition: assignment.aiDataConsent !== true, errorCode: 'NO_DATA_CONSENT' },
        { condition: !rubric || rubric.criteria.length === 0, errorCode: 'NO_RUBRIC' },
        { condition: !submission.content?.trim(), errorCode: 'EMPTY_SUBMISSION' },
      ];

      for (const gate of gates) {
        if (gate.condition) {
          logger.info({ event: 'gate_failed', submissionId, gate: gate.errorCode });
          await prisma.preGradeJob.update({
            where: { submissionId },
            data: { status: 'CANCELLED', errorCode: gate.errorCode, completedAt: new Date() },
          });
          return 'skipped';
        }
      }

      // Phase 2 — Build Prompt
      const studentName = `${submission.user.firstName} ${submission.user.lastName}`;
      const stripResult = stripPII(submission.content, studentName);
      const hasInjectionFlag = detectInjection(submission.content);

      if (stripResult.piiDetected) {
        logger.info({ event: 'pii_detected', submissionId, detectedTypes: stripResult.detectedTypes });
      }

      if (stripResult.detectedLanguage) {
        await prisma.submission.update({
          where: { id: submissionId },
          data: { detectedLanguage: stripResult.detectedLanguage },
        });
      }

      const evalMode = inferEvalMode({
        title: assignment.title,
        description: assignment.description,
        type: assignment.type,
      });

      const promptInput: PromptInput = {
        submission: { content: submission.content },
        assignment: {
          title: assignment.title,
          description: assignment.description,
          aiEvaluationMode: assignment.aiEvaluationMode
            ? (assignment.aiEvaluationMode.toLowerCase() as AssignmentEvalMode)
            : null,
          aiGradingInstructions: assignment.aiGradingInstructions,
        },
        rubric: {
          criteria: rubric!.criteria.map((c) => ({
            id: c.id,
            name: c.title,
            description: c.description,
            maxPoints: c.maxPoints,
          })),
        },
        studentName,
        evalMode,
      };

      logger.info({ event: 'eval_mode_detected', submissionId, mode: evalMode ?? 'default', wasAutoDetected: !assignment.aiEvaluationMode });

      const gradingRequest = buildGradingPrompt(promptInput);

      // Phase 3 — Call AI
      logger.info({ event: 'ai_call_started', submissionId, model: 'pending', promptVersion: '1.0.0', promptHash: '' });
      const response = await callGradingModel(gradingRequest);
      logger.info({ event: 'ai_call_completed', submissionId, model: response.modelUsed, tokensInput: response.tokensInput, tokensOutput: response.tokensOutput, processingMs: response.processingMs });

      // Phase 4 — Parse & Validate
      let parsed: ParsedGradingResult;
      try {
        parsed = JSON.parse(response.content) as ParsedGradingResult;
      } catch {
        logger.error({ event: 'ai_call_failed', submissionId, errorCode: 'INVALID_JSON' });
        await this.markFailed(submissionId, 'AI response is not valid JSON', 'INVALID_JSON');
        return 'failed';
      }

      const criteriaById = new Map(rubric!.criteria.map((c) => [c.id, c]));

      const validScores = (parsed.criteriaScores || [])
        .filter((cs) => criteriaById.has(cs.criterionId))
        .map((cs) => {
          const criterion = criteriaById.get(cs.criterionId)!;
          const clamped = Math.max(0, Math.min(cs.suggestedPoints, criterion.maxPoints));
          const evidenceResult = validateEvidence(cs.keyEvidence || [], submission.content);
          return {
            ...cs,
            suggestedPoints: clamped,
            keyEvidence: evidenceResult.validEvidence,
          };
        });

      const totalRejected = validScores.reduce((sum, cs) => {
        const original = parsed.criteriaScores.find((o) => o.criterionId === cs.criterionId);
        const originalCount = original?.keyEvidence?.length ?? 0;
        return sum + (originalCount - cs.keyEvidence.length);
      }, 0);
      if (totalRejected > 0) {
        logger.info({ event: 'evidence_rejected', submissionId, rejectedCount: totalRejected });
      }

      const mergedFlags = [
        ...new Set([
          ...(parsed.flags || []),
          ...(hasInjectionFlag ? ['prompt_injection_detected'] : []),
        ]),
      ].slice(0, 10);

      // Phase 5 — Atomic DB Write
      const maxPoints = rubric!.criteria.reduce((sum, c) => sum + c.maxPoints, 0);

      await prisma.$transaction(async (tx) => {
        const grade = await tx.grade.upsert({
          where: { submissionId },
          create: {
            submissionId,
            graderId: course.teacherId,
            points: 0,
            maxPoints,
            feedback: '',
            status: 'AI_GRADED',
            aiRawResponse: JSON.parse(response.content),
            aiOverallComments: parsed.overallComments,
            aiModelUsed: response.modelUsed,
            aiPromptVersion: response.promptVersion,
            aiGradedAt: new Date(),
            aiFlags: mergedFlags,
            aiTokensUsed: response.tokensInput + response.tokensOutput,
            aiProcessingMs: response.processingMs,
          },
          update: {
            status: 'AI_GRADED',
            aiRawResponse: JSON.parse(response.content),
            aiOverallComments: parsed.overallComments,
            aiModelUsed: response.modelUsed,
            aiPromptVersion: response.promptVersion,
            aiGradedAt: new Date(),
            aiFlags: mergedFlags,
            aiTokensUsed: response.tokensInput + response.tokensOutput,
            aiProcessingMs: response.processingMs,
          },
        });

        for (const cs of validScores) {
          await tx.rubricScore.upsert({
            where: { gradeId_criterionId: { gradeId: grade.id, criterionId: cs.criterionId } },
            create: {
              gradeId: grade.id,
              criterionId: cs.criterionId,
              points: 0,
              feedback: '',
              aiSuggestedPoints: cs.suggestedPoints,
              aiSuggestedFeedback: cs.feedback,
              aiConfidence: cs.confidence,
              aiKeyEvidence: cs.keyEvidence,
            },
            update: {
              aiSuggestedPoints: cs.suggestedPoints,
              aiSuggestedFeedback: cs.feedback,
              aiConfidence: cs.confidence,
              aiKeyEvidence: cs.keyEvidence,
            },
          });
        }

        // Audit log (no institutionId requirement in demo)
        await AuditLogService.record({
          submissionId,
          institutionId: 'demo',
          dataCategories: ['submission_content', 'rubric_criteria'],
          piiStripped: stripResult.piiDetected,
          provider: response.modelUsed.includes('gpt') ? 'openai' : 'groq',
          providerModel: response.modelUsed,
          legalBasis: 'legitimate_interest_with_consent',
          retentionPolicy: '90_days',
          retentionExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        }, tx);

        await tx.preGradeJob.update({
          where: { submissionId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            promptHash: response.promptHash,
            tokensInput: response.tokensInput,
            tokensOutput: response.tokensOutput,
          },
        });
      });

      logger.info({ event: 'db_write_completed', submissionId, status: 'COMPLETED' });

      return 'done';
    } catch (error: any) {
      logger.error({ event: 'job_failed', submissionId, errorCode: error.code ?? 'UNKNOWN', attempt: 0, willRetry: false, err: error });
      try {
        await prisma.preGradeJob.update({
          where: { submissionId },
          data: {
            status: 'FAILED',
            errorMessage: error.message?.slice(0, 500),
            completedAt: new Date(),
          },
        });
      } catch (updateError: any) {
        logger.error({ msg: 'Failed to update job status', submissionId, err: updateError });
      }
      return 'failed';
    }
  }

  private async markFailed(submissionId: string, message: string, errorCode: string): Promise<void> {
    await prisma.preGradeJob.update({
      where: { submissionId },
      data: {
        status: 'FAILED',
        errorMessage: message,
        errorCode,
        completedAt: new Date(),
      },
    });
  }
}

export const preGradeService = new PreGradeService();
