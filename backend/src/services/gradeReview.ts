import { prisma } from '../database';
import { GradeStatus, ReviewAction } from '../../../shared/types';
import { assertLegalTransition } from '../ai/grade-state-machine';
import { createError } from '../middleware/errorHandler';

export async function getGradeForReview(gradeId: string, teacherId: string) {
  const grade = await prisma.grade.findUnique({
    where: { id: gradeId },
    include: {
      submission: {
        include: {
          assignment: { include: { course: true } },
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
      rubricScores: { include: { criterion: true } },
    },
  });

  if (!grade) throw createError('Grade not found', 404);
  if (grade.submission.assignment.course.teacherId !== teacherId) {
    throw createError('You do not have permission to review this grade', 403);
  }

  return {
    ...grade,
    status: (grade.status as string).toLowerCase() as GradeStatus,
    rubricScores: grade.rubricScores.map((rs) => ({
      ...rs,
      teacherReviewAction: rs.teacherReviewAction
        ? (rs.teacherReviewAction as string).toLowerCase()
        : null,
    })),
  };
}

export async function reviewCriterion(params: {
  gradeId: string;
  criterionId: string;
  finalPoints: number;
  finalFeedback?: string;
  overrideReason?: string;
  teacherId: string;
}) {
  const { gradeId, criterionId, finalPoints, finalFeedback, overrideReason, teacherId } = params;

  const grade = await prisma.grade.findUnique({
    where: { id: gradeId },
    include: {
      rubricScores: { include: { criterion: true } },
      submission: { include: { assignment: { include: { course: true } } } },
    },
  });

  if (!grade) throw createError('Grade not found', 404);
  if (grade.submission.assignment.course.teacherId !== teacherId) {
    throw createError('You do not have permission to review this grade', 403);
  }

  const rubricScore = grade.rubricScores.find((rs) => rs.criterionId === criterionId);
  if (!rubricScore) throw createError('Rubric criterion not found for this grade', 404);

  const maxPoints = rubricScore.criterion.maxPoints;
  if (finalPoints < 0 || finalPoints > maxPoints) {
    throw createError(`Points must be between 0 and ${maxPoints}`, 400);
  }

  let action: ReviewAction;
  if (rubricScore.aiSuggestedPoints === null) {
    action = ReviewAction.REJECT;
  } else if (
    finalPoints === rubricScore.aiSuggestedPoints &&
    (!finalFeedback || finalFeedback === rubricScore.aiSuggestedFeedback)
  ) {
    action = ReviewAction.ACCEPT;
  } else if (Math.abs(finalPoints - rubricScore.aiSuggestedPoints) > maxPoints * 0.2) {
    action = ReviewAction.REJECT;
  } else {
    action = ReviewAction.MODIFY;
  }

  const teacherOverrode = finalPoints !== rubricScore.aiSuggestedPoints;
  const prismaAction = action.toUpperCase() as any;

  const updatedScore = await prisma.$transaction(async (tx) => {
    const updated = await tx.rubricScore.update({
      where: { gradeId_criterionId: { gradeId, criterionId } },
      data: {
        points: finalPoints,
        ...(finalFeedback !== undefined && { feedback: finalFeedback }),
        teacherOverrode,
        teacherReviewAction: prismaAction,
        ...(action === ReviewAction.REJECT && overrideReason ? { teacherOverrideReason: overrideReason } : {}),
      },
      include: { criterion: true },
    });

    const currentStatus = (grade.status as string).toLowerCase() as GradeStatus;
    if (currentStatus === GradeStatus.AI_GRADED) {
      assertLegalTransition(GradeStatus.AI_GRADED, GradeStatus.PARTIAL, 'teacher');
      await tx.grade.updateMany({
        where: { id: gradeId, status: 'AI_GRADED' },
        data: { status: 'PARTIAL' },
      });
    }

    const aggregate = await tx.rubricScore.aggregate({
      where: { gradeId },
      _sum: { points: true },
    });

    await tx.grade.update({
      where: { id: gradeId },
      data: { points: aggregate._sum.points || 0 },
    });

    return updated;
  });

  return { ...updatedScore, teacherReviewAction: action };
}

export async function finalizeReview(gradeId: string, teacherId: string, reviewStartedAt: number) {
  const grade = await prisma.grade.findUnique({
    where: { id: gradeId },
    include: {
      rubricScores: true,
      submission: { include: { assignment: { include: { course: true } } } },
    },
  });

  if (!grade) throw createError('Grade not found', 404);
  if (grade.submission.assignment.course.teacherId !== teacherId) {
    throw createError('You do not have permission to finalize this grade', 403);
  }

  const unreviewed = grade.rubricScores.filter((rs) => rs.teacherReviewAction === null);
  if (unreviewed.length > 0) {
    const error = createError(`${unreviewed.length} criterion(s) have not been reviewed`, 400);
    (error as any).unreviewedCriterionIds = unreviewed.map((rs) => rs.criterionId);
    throw error;
  }

  const currentStatus = (grade.status as string).toLowerCase() as GradeStatus;
  assertLegalTransition(currentStatus, GradeStatus.COMPLETE, 'teacher');

  const withAI = grade.rubricScores.filter((rs) => rs.aiSuggestedPoints !== null);
  const accepted = withAI.filter((rs) => (rs.teacherReviewAction as string).toLowerCase() === ReviewAction.ACCEPT);
  const teacherAgreementRate = withAI.length > 0 ? accepted.length / withAI.length : null;
  const teacherReviewMs = Date.now() - reviewStartedAt;

  const finalized = await prisma.$transaction(async (tx) => {
    await tx.gradeHistory.create({
      data: {
        submissionId: grade.submissionId,
        previousPoints: grade.points,
        newPoints: grade.points,
        previousFeedback: grade.feedback,
        newFeedback: grade.feedback,
        previousStatus: grade.status,
        newStatus: 'COMPLETE',
        changedBy: teacherId,
        changeReason: 'Teacher review finalized',
      },
    });

    const updated = await tx.grade.update({
      where: { id: gradeId },
      data: {
        status: 'COMPLETE',
        teacherAgreementRate,
        teacherReviewedAt: new Date(),
        teacherReviewMs,
        teacherConfirmedAt: new Date(),
        teacherConfirmedBy: teacherId,
      },
      include: { rubricScores: { include: { criterion: true } } },
    });

    await tx.submission.update({
      where: { id: grade.submissionId },
      data: { status: 'GRADED' },
    });

    return updated;
  });

  // Auto-release for ROLLING mode
  await setReleasedOnConfirm(gradeId);

  return { ...finalized, status: GradeStatus.COMPLETE, teacherAgreementRate };
}

async function setReleasedOnConfirm(gradeId: string): Promise<void> {
  const grade = await prisma.grade.findUnique({
    where: { id: gradeId },
    select: {
      id: true,
      releasedToStudentAt: true,
      submission: {
        select: {
          userId: true,
          assignmentId: true,
          assignment: { select: { releaseMode: true, title: true, courseId: true } },
        },
      },
    },
  });

  if (!grade) return;
  if (grade.submission.assignment.releaseMode !== 'ROLLING') return;
  if (grade.releasedToStudentAt) return;

  await prisma.grade.update({
    where: { id: gradeId },
    data: { releasedToStudentAt: new Date() },
  });
}
