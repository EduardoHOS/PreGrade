import { prisma } from '../database';
import { QuestionType, QuizResult, QuestionResult, PartialCreditBreakdown } from '../../../shared/types';

export class GradingService {
  async autoGradeSubmission(submissionId: string): Promise<QuizResult> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: { include: { questions: { orderBy: { order: 'asc' } } } },
        answers: { include: { question: true } },
        user: true,
      },
    });

    if (!submission) throw new Error('Submission not found');
    if (!submission.assignment.questions?.length) throw new Error('No questions found');

    const course = await prisma.course.findUnique({
      where: { id: submission.assignment.courseId },
      select: { teacherId: true },
    });
    if (!course) throw new Error('Course not found');

    const graderId = course.teacherId;
    let totalPoints = 0;
    let autoGradedPoints = 0;
    let manualGradingPending = false;
    const questionResults: QuestionResult[] = [];
    const answerUpdates: { id: string; isCorrect: boolean | null; pointsAwarded: number | null }[] = [];

    for (const question of submission.assignment.questions) {
      totalPoints += question.points;
      const studentAnswer = submission.answers?.find((a) => a.questionId === question.id);

      if (!studentAnswer) {
        questionResults.push({ questionId: question.id, answerId: '', isCorrect: false, pointsAwarded: 0, studentAnswer: null });
        continue;
      }

      const result = this.gradeQuestion(question, studentAnswer.answerValue);
      answerUpdates.push({ id: studentAnswer.id, isCorrect: result.isCorrect, pointsAwarded: result.pointsAwarded });

      if (result.isCorrect !== null) {
        autoGradedPoints += result.pointsAwarded || 0;
      } else {
        manualGradingPending = true;
      }

      questionResults.push({
        questionId: question.id,
        answerId: studentAnswer.id,
        isCorrect: result.isCorrect === true,
        pointsAwarded: result.pointsAwarded || 0,
        studentAnswer: studentAnswer.answerValue,
        correctAnswer: result.isCorrect !== null ? question.correctAnswers : undefined,
        partialCredit: result.partialCreditBreakdown,
      });
    }

    if (answerUpdates.length > 0) {
      await prisma.$transaction(
        answerUpdates.map((update) =>
          prisma.answer.update({
            where: { id: update.id },
            data: { isCorrect: update.isCorrect, pointsAwarded: update.pointsAwarded },
          })
        )
      );
    }

    const hasAutoGradable = submission.assignment.questions.some((q) =>
      ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'CHECKBOXES', 'SHORT_ANSWER'].includes(q.type)
    );
    const hasManualGradable = submission.assignment.questions.some((q) =>
      ['PARAGRAPH', 'FILE_UPLOAD'].includes(q.type)
    );

    let gradeStatus: string;
    if (hasAutoGradable && !hasManualGradable) gradeStatus = 'AUTO_GRADED';
    else if (hasManualGradable && !hasAutoGradable) gradeStatus = 'PENDING_MANUAL';
    else gradeStatus = 'PARTIAL';

    const existingGrade = await prisma.grade.findUnique({ where: { submissionId } });
    const gradeData = {
      points: autoGradedPoints,
      maxPoints: totalPoints,
      feedback: manualGradingPending
        ? `Auto-graded portion: ${autoGradedPoints}/${totalPoints} points. Some questions require manual grading.`
        : `Score: ${autoGradedPoints}/${totalPoints} points (${((autoGradedPoints / totalPoints) * 100).toFixed(1)}%)`,
      status: gradeStatus as any,
      autoPoints: autoGradedPoints,
    };

    if (existingGrade) {
      await prisma.grade.update({ where: { id: existingGrade.id }, data: gradeData });
    } else {
      await prisma.grade.create({ data: { ...gradeData, submissionId, graderId } });
    }

    return {
      submissionId,
      totalPoints: autoGradedPoints,
      maxPoints: totalPoints,
      status: gradeStatus,
      isLate: submission.submittedAt > submission.assignment.dueDate,
      questionResults,
    };
  }

  private gradeQuestion(question: any, studentAnswerValue: string): {
    isCorrect: boolean | null;
    pointsAwarded: number | null;
    partialCreditBreakdown?: PartialCreditBreakdown;
  } {
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
      case 'TRUE_FALSE': {
        const isCorrect = studentAnswerValue === question.correctAnswers[0];
        return { isCorrect, pointsAwarded: isCorrect ? question.points : 0 };
      }
      case 'CHECKBOXES': {
        let studentAnswers: string[];
        try { studentAnswers = JSON.parse(studentAnswerValue); } catch { studentAnswers = [studentAnswerValue]; }
        const correctAnswers = question.correctAnswers || [];
        const correctSelected = studentAnswers.filter((a: string) => correctAnswers.includes(a)).length;
        const incorrectSelected = studentAnswers.filter((a: string) => !correctAnswers.includes(a)).length;
        const ratio = Math.max(0, (correctSelected - incorrectSelected) / correctAnswers.length);
        const pointsAwarded = Math.max(0, Math.round(ratio * question.points));
        return {
          isCorrect: correctSelected === correctAnswers.length && incorrectSelected === 0,
          pointsAwarded,
          partialCreditBreakdown: {
            correctSelections: correctSelected,
            incorrectSelections: incorrectSelected,
            totalCorrect: correctAnswers.length,
            formula: `(${correctSelected} - ${incorrectSelected}) / ${correctAnswers.length} = ${ratio.toFixed(2)}`,
          },
        };
      }
      case 'SHORT_ANSWER': {
        const correct = question.correctAnswers[0];
        const caseSensitive = question.caseSensitive ?? false;
        const isCorrect = caseSensitive
          ? studentAnswerValue.trim() === correct
          : studentAnswerValue.trim().toLowerCase() === correct.toLowerCase();
        return { isCorrect, pointsAwarded: isCorrect ? question.points : 0 };
      }
      case 'PARAGRAPH':
      case 'FILE_UPLOAD':
        return { isCorrect: null, pointsAwarded: null };
      default:
        throw new Error(`Unsupported question type: ${question.type}`);
    }
  }
}

export const gradingService = new GradingService();
