import { Router } from 'express';
import { prisma } from '../database';
import { asyncHandler } from '../middleware/errorHandler';
import { requireTeacher, authMiddleware } from '../middleware/auth';
import { preGradeService } from '../ai/pre-grade.service';

const router = Router();

/**
 * GET /api/submissions/:submissionId — Get a submission with grade data
 */
router.get(
  '/:submissionId',
  authMiddleware,
  asyncHandler(async (req: any, res: any) => {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.submissionId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignment: {
          include: {
            rubric: { include: { criteria: { orderBy: { order: 'asc' } } } },
            course: { select: { id: true, title: true, teacherId: true } },
          },
        },
        grade: {
          include: { rubricScores: { include: { criterion: true } } },
        },
        preGradeJob: true,
        answers: { include: { question: true } },
      },
    });

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    // Students can only see their own; teachers can see their course submissions
    if (req.user.role === 'student' && submission.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    if (req.user.role === 'teacher' && submission.assignment.course.teacherId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    res.json({ success: true, data: submission });
  })
);

/**
 * POST /api/submissions/:submissionId/trigger-ai — Trigger AI pre-grading
 */
router.post(
  '/:submissionId/trigger-ai',
  requireTeacher,
  asyncHandler(async (req: any, res: any) => {
    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: { include: { course: { select: { teacherId: true } } } },
      },
    });

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    if (submission.assignment.course.teacherId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // Create or reset PreGradeJob
    await prisma.preGradeJob.upsert({
      where: { submissionId },
      create: { submissionId, status: 'PENDING' },
      update: { status: 'PENDING', attempts: 0, errorMessage: null, errorCode: null, completedAt: null, startedAt: null },
    });

    // Run in-process (no BullMQ in demo)
    const result = await preGradeService.run(submissionId);

    res.json({ success: true, data: { result } });
  })
);

export default router;
