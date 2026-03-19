import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../database';
import { asyncHandler } from '../middleware/errorHandler';
import { requireTeacher } from '../middleware/auth';
import { requireLegalGradeTransition } from '../middleware/gradeTransition';
import { GradeStatus } from '../../../shared/types';

const router = Router();

/**
 * GET /api/grading/queue — Submissions awaiting grading
 */
router.get(
  '/queue',
  requireTeacher,
  asyncHandler(async (req: any, res: any) => {
    const { page = '1', limit = '50', courseId: filterCourseId, statusFilter = 'pending' } = req.query;
    const take = Math.min(Number(limit) || 50, 200);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const courses = await prisma.course.findMany({
      where: { teacherId: req.user!.id },
      select: { id: true, title: true },
    });

    const courseIds = filterCourseId
      ? courses.filter((c: any) => c.id === filterCourseId).map((c: any) => c.id)
      : courses.map((c: any) => c.id);

    if (courseIds.length === 0) {
      return res.json({
        success: true,
        data: { submissions: [], stats: { pending: 0, gradedToday: 0, total: 0, confirmed: 0, aiPreGraded: 0, notStarted: 0 }, resumeInfo: null },
      });
    }

    const baseWhere = { assignment: { courseId: { in: courseIds } } };
    const submissionWhere = statusFilter === 'all'
      ? { ...baseWhere, status: { not: 'DRAFT' as any } }
      : { ...baseWhere, status: { in: ['SUBMITTED', 'LATE'] as any } };

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where: submissionWhere,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          assignment: {
            select: {
              id: true, title: true, maxPoints: true, dueDate: true, courseId: true,
              releaseMode: true, gradesReleasedAt: true,
              course: { select: { id: true, title: true } },
            },
          },
          grade: {
            select: { id: true, status: true, points: true, maxPoints: true, feedback: true, aiFlags: true, aiOverallComments: true },
          },
          preGradeJob: { select: { id: true, status: true } },
        },
        orderBy: [{ submittedAt: 'asc' }],
        take,
        skip,
      }),
      prisma.submission.count({ where: submissionWhere }),
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const gradedToday = await prisma.grade.count({
      where: { gradedAt: { gte: todayStart }, submission: { assignment: { courseId: { in: courseIds } } } },
    });

    const now = Date.now();
    const enriched = submissions.map((sub: any) => {
      const ageHours = (now - new Date(sub.submittedAt).getTime()) / (1000 * 60 * 60);
      return { ...sub, priority: ageHours > 72 ? 'high' : ageHours > 24 ? 'medium' : 'low' };
    });

    let confirmed = 0, aiPreGraded = 0, notStarted = 0;
    for (const sub of enriched) {
      const gs = sub.grade?.status;
      if (gs === 'COMPLETE' || gs === 'TEACHER_REVIEWED') confirmed++;
      else if (gs === 'AI_GRADED' || gs === 'PARTIAL') aiPreGraded++;
      else if (!gs) notStarted++;
    }

    res.json({
      success: true,
      data: {
        submissions: enriched,
        stats: { pending: total - confirmed, gradedToday, total, confirmed, aiPreGraded, notStarted },
        pagination: { page: Math.max(Number(page) || 1, 1), limit: take, total, totalPages: Math.ceil(total / take) },
      },
    });
  })
);

/**
 * PATCH /api/grading/submissions/:submissionId/answers/:answerId/grade — Manually grade a quiz answer
 */
router.patch(
  '/submissions/:submissionId/answers/:answerId/grade',
  requireTeacher,
  [
    body('points').isInt({ min: 0 }),
    body('feedback').optional().trim(),
  ],
  asyncHandler(async (req: any, res: any) => {
    const { submissionId, answerId } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: { include: { course: true, questions: true } },
        answers: { include: { question: true } },
      },
    });

    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found' });
    if (submission.assignment.course.teacherId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const answer = submission.answers.find((a: any) => a.id === answerId);
    if (!answer) return res.status(404).json({ success: false, error: 'Answer not found' });

    const maxPoints = answer.question.points;
    const points = Math.min(req.body.points, maxPoints);

    const updated = await prisma.answer.update({
      where: { id: answerId },
      data: {
        pointsAwarded: points,
        isCorrect: points === maxPoints,
        feedback: req.body.feedback || null,
      },
      include: { question: true },
    });

    // Recalculate grade total
    const allAnswers = await prisma.answer.findMany({
      where: { submissionId },
      select: { pointsAwarded: true },
    });
    const totalEarned = allAnswers.reduce((sum: number, a: any) => sum + (a.pointsAwarded || 0), 0);

    const existingGrade = await prisma.grade.findUnique({ where: { submissionId } });
    if (existingGrade) {
      await prisma.grade.update({
        where: { id: existingGrade.id },
        data: { points: totalEarned },
      });
    }

    res.json({ success: true, data: updated });
  })
);

/**
 * POST /api/grading/submissions/:submissionId/finalize-grade
 */
router.post(
  '/submissions/:submissionId/finalize-grade',
  requireTeacher,
  requireLegalGradeTransition(GradeStatus.COMPLETE),
  asyncHandler(async (req: any, res: any) => {
    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: { include: { course: true, questions: true } },
        answers: true,
        grade: true,
      },
    });

    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found' });
    if (submission.assignment.course.teacherId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const totalPoints = submission.assignment.questions.reduce((sum: number, q: any) => sum + q.points, 0);
    let earnedPoints = 0;
    for (const answer of submission.answers) {
      if (answer.pointsAwarded !== null) earnedPoints += answer.pointsAwarded;
    }

    const feedback = `Final Grade: ${earnedPoints}/${totalPoints} points (${((earnedPoints / totalPoints) * 100).toFixed(1)}%)`;

    if (submission.grade) {
      await prisma.grade.update({
        where: { id: submission.grade.id },
        data: { points: earnedPoints, maxPoints: totalPoints, feedback, status: 'COMPLETE', teacherConfirmedAt: new Date(), teacherConfirmedBy: req.user!.id },
      });
    } else {
      await prisma.grade.create({
        data: { submissionId, graderId: req.user!.id, points: earnedPoints, maxPoints: totalPoints, feedback, status: 'COMPLETE', teacherConfirmedAt: new Date(), teacherConfirmedBy: req.user!.id },
      });
    }

    await prisma.submission.update({ where: { id: submissionId }, data: { status: 'GRADED' } });

    const updated = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { grade: true, user: { select: { id: true, firstName: true, lastName: true } } },
    });

    res.json({ success: true, data: updated });
  })
);

export default router;
