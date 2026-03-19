import { GradeStatus } from '../../../shared/types';

export class GradeTransitionError extends Error {
  public readonly from: GradeStatus;
  public readonly to: GradeStatus;

  constructor(from: GradeStatus, to: GradeStatus, reason: string) {
    super(`ILLEGAL_TRANSITION: ${reason}`);
    this.name = 'GradeTransitionError';
    this.from = from;
    this.to = to;
  }
}

const LEGAL_TRANSITIONS: Record<GradeStatus, GradeStatus[]> = {
  [GradeStatus.PENDING_MANUAL]:   [GradeStatus.COMPLETE],
  [GradeStatus.PROCESSING_AI]:    [GradeStatus.PARTIAL, GradeStatus.PENDING_MANUAL],
  [GradeStatus.AI_GRADED]:        [GradeStatus.PARTIAL],
  [GradeStatus.PARTIAL]:          [GradeStatus.COMPLETE],
  [GradeStatus.AUTO_GRADED]:      [GradeStatus.COMPLETE],
  [GradeStatus.COMPLETE]:         [],
  [GradeStatus.AI_PENDING]:       [GradeStatus.PROCESSING_AI],
  [GradeStatus.TEACHER_REVIEWED]: [],
};

export function assertLegalTransition(
  from: GradeStatus,
  to: GradeStatus,
  actor: 'system' | 'teacher' | 'admin',
): void {
  if (actor === 'admin') return;

  if (to === GradeStatus.PROCESSING_AI && actor !== 'system') {
    throw new GradeTransitionError(from, to, 'only worker can set PROCESSING_AI');
  }

  if (to === GradeStatus.COMPLETE && actor === 'system') {
    throw new GradeTransitionError(from, to, 'system cannot set COMPLETE');
  }

  const allowed = LEGAL_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new GradeTransitionError(from, to, `${from} → ${to} is not allowed`);
  }
}
