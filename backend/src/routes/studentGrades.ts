import { Router } from 'express';
import { prisma } from '../database';
import { asyncHandler } from '../middleware/errorHandler';
import { requireStudent } from '../middleware/auth';

const router = Router();

/**
 * GET /api/my-grades — Student's released grades
 */
router.get(
  '/',
  requireStudent,
  asyncHandler(async (req: any, res: any) => {
    const studentId = req.user!.id;

    const submissions = await prisma.submission.findMany({
      where: { userId: studentId },
      include: {
        assignment: {
          select: {
            id: true, title: true, maxPoints: true, dueDate: true, type: true,
            course: { select: { id: true, title: true } },
          },
        },
        grade: {
          include: {
            rubricScores: {
              include: { criterion: true },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Only return released grades
    const gradesData = submissions
      .filter((s: any) => s.grade?.releasedToStudentAt)
      .map((s: any) => ({
        submissionId: s.id,
        assignment: s.assignment,
        submittedAt: s.submittedAt,
        grade: {
          id: s.grade.id,
          points: s.grade.points,
          maxPoints: s.grade.maxPoints,
          feedback: s.grade.feedback,
          status: s.grade.status.toLowerCase(),
          releasedAt: s.grade.releasedToStudentAt,
          rubricScores: s.grade.rubricScores.map((rs: any) => ({
            criterionName: rs.criterion.title,
            criterionDescription: rs.criterion.description,
            points: rs.points,
            maxPoints: rs.criterion.maxPoints,
            feedback: rs.feedback,
          })),
        },
      }));

    // Unreleased submissions (submitted but no released grade)
    const pendingSubmissions = submissions
      .filter((s: any) => !s.grade?.releasedToStudentAt && s.status !== 'DRAFT')
      .map((s: any) => ({
        submissionId: s.id,
        assignment: s.assignment,
        submittedAt: s.submittedAt,
        status: s.grade ? 'grading_in_progress' : 'submitted',
      }));

    res.json({
      success: true,
      data: {
        grades: gradesData,
        pending: pendingSubmissions,
      },
    });
  })
);

export default router;
