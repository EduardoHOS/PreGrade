import { prisma } from '../database';

export async function releaseGradesForAssignment(params: {
  assignmentId: string;
  teacherId: string;
  message?: string;
  contestsAllowed?: number;
  contestDeadlineDays?: number | null;
}): Promise<{ releasedCount: number; assignmentTitle: string; gradesReleasedAt: Date }> {
  const { assignmentId, teacherId, message, contestsAllowed, contestDeadlineDays } = params;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { course: { select: { id: true, title: true, teacherId: true } } },
  });

  if (!assignment) throw Object.assign(new Error('Assignment not found'), { statusCode: 404 });
  if (assignment.course.teacherId !== teacherId) throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  if ((assignment.releaseMode as string) !== 'BATCH') throw Object.assign(new Error('Only BATCH assignments use explicit release'), { statusCode: 400 });
  if (assignment.gradesReleasedAt) throw Object.assign(new Error('Grades already released'), { statusCode: 400 });

  const submissions = await prisma.submission.findMany({
    where: { assignmentId },
    include: {
      grade: { select: { id: true, status: true, teacherConfirmedAt: true } },
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  const pendingStudents: { id: string; name: string }[] = [];
  for (const sub of submissions) {
    if (!sub.grade) continue;
    if (sub.grade.status !== 'COMPLETE' || !sub.grade.teacherConfirmedAt) {
      pendingStudents.push({ id: sub.user.id, name: `${sub.user.firstName} ${sub.user.lastName}` });
    }
  }

  if (pendingStudents.length > 0) {
    throw Object.assign(new Error(`${pendingStudents.length} grade(s) not yet confirmed`), { statusCode: 400, pending: pendingStudents });
  }

  const now = new Date();
  const submissionsWithGrades = submissions.filter((s) => s.grade);

  const assignmentUpdateData: Record<string, any> = { gradesReleasedAt: now, gradesReleasedBy: teacherId };
  if (contestsAllowed !== undefined) assignmentUpdateData.contestsAllowed = contestsAllowed;
  if (contestDeadlineDays !== undefined) assignmentUpdateData.contestDeadlineDays = contestDeadlineDays;

  await prisma.$transaction([
    prisma.grade.updateMany({
      where: { submission: { assignmentId } },
      data: { releasedToStudentAt: now },
    }),
    prisma.assignment.update({
      where: { id: assignmentId },
      data: assignmentUpdateData,
    }),
  ]);

  return { releasedCount: submissionsWithGrades.length, assignmentTitle: assignment.title, gradesReleasedAt: now };
}

export async function getReleaseStatus(assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, releaseMode: true, gradesReleasedAt: true, courseId: true, maxPoints: true, contestsAllowed: true, contestDeadlineDays: true },
  });

  if (!assignment) throw Object.assign(new Error('Assignment not found'), { statusCode: 404 });

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: assignment.courseId, status: 'ACTIVE' },
    select: { userId: true, user: { select: { id: true, firstName: true, lastName: true } } },
  });

  const submissions = await prisma.submission.findMany({
    where: { assignmentId },
    include: {
      grade: { select: { status: true, teacherConfirmedAt: true, points: true, maxPoints: true, aiGradedAt: true } },
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  const submittedCount = submissions.filter((s) => s.status !== 'DRAFT').length;
  const gradedCount = submissions.filter((s) => s.grade?.status === 'COMPLETE').length;
  const confirmedCount = submissions.filter((s) => s.grade?.status === 'COMPLETE' && s.grade?.teacherConfirmedAt).length;

  const completeGrades = submissions.filter((s) => s.grade?.status === 'COMPLETE').map((s) => s.grade!);
  let aiAssistedCount = 0, manualCount = 0, averagePoints: number | null = null, highestPoints: number | null = null, lowestPoints: number | null = null;

  if (completeGrades.length > 0) {
    let total = 0;
    for (const g of completeGrades) {
      if (g.aiGradedAt) aiAssistedCount++; else manualCount++;
      const pts = g.points ?? 0;
      total += pts;
      if (highestPoints === null || pts > highestPoints) highestPoints = pts;
      if (lowestPoints === null || pts < lowestPoints) lowestPoints = pts;
    }
    averagePoints = Math.round((total / completeGrades.length) * 100) / 100;
  }

  const unconfirmedStudents = submissions
    .filter((s) => s.grade && (s.grade.status !== 'COMPLETE' || !s.grade.teacherConfirmedAt))
    .map((s) => ({ id: s.user.id, name: `${s.user.firstName} ${s.user.lastName}` }));

  const submittedUserIds = new Set(submissions.map((s) => s.userId));
  const unsubmittedStudents = enrollments
    .filter((e) => !submittedUserIds.has(e.userId))
    .map((e) => ({ id: e.user.id, name: `${e.user.firstName} ${e.user.lastName}` }));

  return {
    totalEnrolled: enrollments.length, submittedCount, gradedCount, confirmedCount,
    unconfirmedStudents, unsubmittedStudents,
    alreadyReleased: !!assignment.gradesReleasedAt,
    releaseMode: (assignment.releaseMode as string).toLowerCase(),
    gradesReleasedAt: assignment.gradesReleasedAt,
    aiAssistedCount, manualCount, averagePoints, highestPoints, lowestPoints,
    maxPoints: assignment.maxPoints,
    contestsAllowed: assignment.contestsAllowed, contestDeadlineDays: assignment.contestDeadlineDays,
  };
}

export async function recallGradeRelease(params: { assignmentId: string; teacherId: string }): Promise<{ recalledCount: number }> {
  const { assignmentId, teacherId } = params;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { course: { select: { id: true, teacherId: true } } },
  });

  if (!assignment) throw Object.assign(new Error('Assignment not found'), { statusCode: 404 });
  if (assignment.course.teacherId !== teacherId) throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  if (!assignment.gradesReleasedAt) throw Object.assign(new Error('Grades have not been released'), { statusCode: 400 });

  const elapsedMs = Date.now() - new Date(assignment.gradesReleasedAt).getTime();
  if (elapsedMs >= 5 * 60 * 1000) {
    throw Object.assign(new Error('Undo window has expired'), { statusCode: 400 });
  }

  const gradeCount = await prisma.grade.count({ where: { submission: { assignmentId } } });

  await prisma.$transaction([
    prisma.grade.updateMany({ where: { submission: { assignmentId } }, data: { releasedToStudentAt: null } }),
    prisma.assignment.update({ where: { id: assignmentId }, data: { gradesReleasedAt: null, gradesReleasedBy: null } }),
  ]);

  return { recalledCount: gradeCount };
}
