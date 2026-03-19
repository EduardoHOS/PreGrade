import { Router } from 'express';
import { prisma } from '../database';
import { asyncHandler } from '../middleware/errorHandler';
import { requireTeacher } from '../middleware/auth';

const router = Router();

/**
 * GET /api/gradebook/course/:courseId — Full gradebook grid
 */
router.get(
  '/course/:courseId',
  requireTeacher,
  asyncHandler(async (req: any, res: any) => {
    const { courseId } = req.params;

    // Verify teacher owns this course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, teacherId: true },
    });

    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
    if (course.teacherId !== req.user!.id) return res.status(403).json({ success: false, error: 'Not authorized' });

    // Parallel queries
    const [students, assignments, submissions] = await Promise.all([
      prisma.enrollment.findMany({
        where: { courseId, status: 'ACTIVE' },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { user: { lastName: 'asc' } },
      }),
      prisma.assignment.findMany({
        where: { courseId, isActive: true },
        select: {
          id: true, title: true, maxPoints: true, dueDate: true, type: true,
          aiGradingEnabled: true, releaseMode: true, gradesReleasedAt: true,
        },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.submission.findMany({
        where: { assignment: { courseId } },
        include: {
          grade: {
            select: {
              id: true, points: true, maxPoints: true, status: true,
              releasedToStudentAt: true, aiGradedAt: true,
              teacherConfirmedAt: true,
            },
          },
        },
      }),
    ]);

    // Build grid: students x assignments
    const submissionMap = new Map<string, any>();
    for (const sub of submissions) {
      submissionMap.set(`${sub.userId}:${sub.assignmentId}`, sub);
    }

    const grid = students.map((enrollment: any) => ({
      student: enrollment.user,
      grades: assignments.map((assignment: any) => {
        const sub = submissionMap.get(`${enrollment.userId}:${assignment.id}`);
        return {
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          maxPoints: assignment.maxPoints,
          submissionId: sub?.id || null,
          status: sub?.grade?.status?.toLowerCase() || (sub ? 'submitted' : 'missing'),
          points: sub?.grade?.points ?? null,
          isAiGraded: !!sub?.grade?.aiGradedAt,
          isConfirmed: !!sub?.grade?.teacherConfirmedAt,
          isReleased: !!sub?.grade?.releasedToStudentAt,
        };
      }),
    }));

    res.json({
      success: true,
      data: {
        course,
        assignments,
        grid,
        stats: {
          totalStudents: students.length,
          totalAssignments: assignments.length,
        },
      },
    });
  })
);

export default router;
