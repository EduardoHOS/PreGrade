import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database';
import { GradeStatus } from '../../../shared/types';
import { assertLegalTransition, GradeTransitionError } from '../ai/grade-state-machine';

/**
 * Middleware that validates grade status transitions before the handler runs.
 * Expects submissionId in req.params.
 */
export function requireLegalGradeTransition(targetStatus: GradeStatus) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const submissionId = req.params.submissionId;
      if (!submissionId) return next();

      const grade = await prisma.grade.findUnique({
        where: { submissionId },
        select: { status: true },
      });

      if (!grade) return next(); // No grade yet — will be created

      const currentStatus = (grade.status as string).toLowerCase() as GradeStatus;
      const actor = req.user?.role === 'admin' ? 'admin' : 'teacher';

      assertLegalTransition(currentStatus, targetStatus, actor as any);
      next();
    } catch (error) {
      if (error instanceof GradeTransitionError) {
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  };
}
