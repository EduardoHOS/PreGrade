import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { requireTeacher } from '../middleware/auth';
import { releaseGradesForAssignment, getReleaseStatus, recallGradeRelease } from '../services/gradeRelease';

const router = Router();

/**
 * GET /api/grade-release/:assignmentId/status
 */
router.get(
  '/:assignmentId/status',
  requireTeacher,
  asyncHandler(async (req: any, res: any) => {
    const data = await getReleaseStatus(req.params.assignmentId);
    res.json({ success: true, data });
  })
);

/**
 * POST /api/grade-release/:assignmentId/release
 */
router.post(
  '/:assignmentId/release',
  requireTeacher,
  [
    body('message').optional().trim(),
    body('contestsAllowed').optional().isInt({ min: 0 }),
    body('contestDeadlineDays').optional().isInt({ min: 1 }),
  ],
  asyncHandler(async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed' });
    }

    const result = await releaseGradesForAssignment({
      assignmentId: req.params.assignmentId,
      teacherId: req.user!.id,
      message: req.body.message,
      contestsAllowed: req.body.contestsAllowed,
      contestDeadlineDays: req.body.contestDeadlineDays,
    });

    res.json({ success: true, data: result });
  })
);

/**
 * POST /api/grade-release/:assignmentId/recall
 */
router.post(
  '/:assignmentId/recall',
  requireTeacher,
  asyncHandler(async (req: any, res: any) => {
    const result = await recallGradeRelease({
      assignmentId: req.params.assignmentId,
      teacherId: req.user!.id,
    });
    res.json({ success: true, data: result });
  })
);

export default router;
