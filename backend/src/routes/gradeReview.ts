import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { requireTeacher } from '../middleware/auth';
import { getGradeForReview, reviewCriterion, finalizeReview } from '../services/gradeReview';

const router = Router();

/**
 * GET /api/grades/:gradeId/review — Get grade with AI suggestions for review
 */
router.get(
  '/:gradeId/review',
  requireTeacher,
  asyncHandler(async (req: any, res: any) => {
    const grade = await getGradeForReview(req.params.gradeId, req.user!.id);
    res.json({ success: true, data: grade });
  })
);

/**
 * PATCH /api/grades/:gradeId/criteria/:criterionId — Review a single criterion
 */
router.patch(
  '/:gradeId/criteria/:criterionId',
  requireTeacher,
  [
    body('finalPoints').isInt({ min: 0 }),
    body('finalFeedback').optional().trim(),
    body('overrideReason').optional().trim(),
  ],
  asyncHandler(async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }

    const result = await reviewCriterion({
      gradeId: req.params.gradeId,
      criterionId: req.params.criterionId,
      finalPoints: req.body.finalPoints,
      finalFeedback: req.body.finalFeedback,
      overrideReason: req.body.overrideReason,
      teacherId: req.user!.id,
    });

    res.json({ success: true, data: result });
  })
);

/**
 * POST /api/grades/:gradeId/confirm — Finalize teacher review
 */
router.post(
  '/:gradeId/confirm',
  requireTeacher,
  asyncHandler(async (req: any, res: any) => {
    const reviewStartedAt = req.body.reviewStartedAt ?? Date.now() - 60000;
    const result = await finalizeReview(req.params.gradeId, req.user!.id, reviewStartedAt);
    res.json({ success: true, data: result });
  })
);

export default router;
