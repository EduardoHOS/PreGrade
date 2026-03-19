import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PreGrade demo data...');

  // Clean existing data
  await prisma.aiDataAuditLog.deleteMany();
  await prisma.gradeContest.deleteMany();
  await prisma.gradeHistory.deleteMany();
  await prisma.rubricScore.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.preGradeJob.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.question.deleteMany();
  await prisma.rubricCriterion.deleteMany();
  await prisma.rubric.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('demo1234', 12);

  // ── Users ──
  const teacher = await prisma.user.create({
    data: { email: 'teacher@pregrade.demo', passwordHash, firstName: 'Dr. Sarah', lastName: 'Mitchell', role: 'TEACHER' },
  });

  const alice = await prisma.user.create({
    data: { email: 'alice@pregrade.demo', passwordHash, firstName: 'Alice', lastName: 'Chen', role: 'STUDENT' },
  });

  const bob = await prisma.user.create({
    data: { email: 'bob@pregrade.demo', passwordHash, firstName: 'Bob', lastName: 'Martinez', role: 'STUDENT' },
  });

  const carol = await prisma.user.create({
    data: { email: 'carol@pregrade.demo', passwordHash, firstName: 'Carol', lastName: 'Williams', role: 'STUDENT' },
  });

  console.log('  Users created');

  // ── Course ──
  const course = await prisma.course.create({
    data: { title: 'Introduction to Academic Writing', description: 'A foundational course on essay writing, argumentation, and critical thinking.', teacherId: teacher.id },
  });

  // Enroll students
  for (const student of [alice, bob, carol]) {
    await prisma.enrollment.create({ data: { userId: student.id, courseId: course.id, status: 'ACTIVE' } });
  }

  console.log('  Course & enrollments created');

  // ── Essay Assignment with Rubric ──
  const essayAssignment = await prisma.assignment.create({
    data: {
      title: 'Argumentative Essay: The Impact of Social Media on Democracy',
      description: 'Write a 1000-1500 word argumentative essay examining whether social media strengthens or weakens democratic participation. Support your thesis with at least 3 scholarly sources.',
      type: 'ESSAY',
      courseId: course.id,
      maxPoints: 100,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      aiGradingEnabled: true,
      aiDataConsent: true,
      aiEvaluationMode: 'ESSAY',
      releaseMode: 'BATCH',
    },
  });

  const rubric = await prisma.rubric.create({
    data: { assignmentId: essayAssignment.id, title: 'Essay Rubric' },
  });

  const criteria = await Promise.all([
    prisma.rubricCriterion.create({
      data: { rubricId: rubric.id, title: 'Thesis & Argument', description: 'Clear, arguable thesis with logical progression of ideas. Arguments are well-developed and supported.', maxPoints: 30, order: 0 },
    }),
    prisma.rubricCriterion.create({
      data: { rubricId: rubric.id, title: 'Evidence & Sources', description: 'Effective use of scholarly sources. Evidence directly supports claims. Proper citation format.', maxPoints: 25, order: 1 },
    }),
    prisma.rubricCriterion.create({
      data: { rubricId: rubric.id, title: 'Critical Analysis', description: 'Demonstrates higher-order thinking. Considers counterarguments. Shows depth of understanding.', maxPoints: 25, order: 2 },
    }),
    prisma.rubricCriterion.create({
      data: { rubricId: rubric.id, title: 'Writing Quality', description: 'Clear, academic prose. Proper grammar, spelling, and punctuation. Appropriate tone and voice.', maxPoints: 20, order: 3 },
    }),
  ]);

  console.log('  Essay assignment with rubric created');

  // ── Essay Submissions with Mock AI Grades ──

  const essaySubmissions = [
    {
      student: alice,
      content: `Social media has fundamentally transformed the landscape of democratic participation in the 21st century. While critics argue that platforms like Twitter and Facebook have become breeding grounds for misinformation, a closer examination reveals that social media has, on balance, strengthened democratic engagement by lowering barriers to political participation, amplifying marginalized voices, and enabling rapid mobilization for social causes.

The democratization of information sharing is perhaps the most significant contribution of social media to democratic life. Prior to the digital age, access to public discourse was largely controlled by traditional media gatekeepers. Scholars such as Shirky (2011) argue that social media has created a "many-to-many" communication paradigm that fundamentally alters the power dynamics of public discourse. Citizens can now directly engage with elected officials, share eyewitness accounts of events, and organize grassroots movements without institutional intermediaries.

Furthermore, social media has proven instrumental in amplifying voices that have historically been excluded from mainstream political discourse. Research by Freelon et al. (2018) demonstrates that movements like Black Lives Matter leveraged social media platforms to bring issues of racial justice to national attention in ways that traditional media had failed to do. The hashtag activism that emerged from these movements, while sometimes dismissed as "slacktivism," has been shown to correlate with real-world political engagement and policy changes.

However, the relationship between social media and democracy is not without complications. The spread of misinformation and the creation of echo chambers present genuine threats to informed democratic decision-making. Sunstein (2017) warns that algorithmic curation can create "filter bubbles" that reinforce existing beliefs and reduce exposure to diverse perspectives. This is a valid concern that demands attention from both technology companies and policymakers.

Nevertheless, the solution to these challenges lies not in retreating from digital democracy but in developing better digital literacy and platform governance. Countries like Finland have demonstrated that media literacy education can effectively combat misinformation while preserving the democratic benefits of open online discourse (Lessenski, 2019). The answer is more democracy, not less.

In conclusion, while social media poses real challenges to democratic processes, its capacity to expand participation, amplify diverse voices, and enable collective action represents a net positive for democratic society. The task before us is not to abandon these tools but to wield them more wisely.`,
      aiScores: [
        { criterionIdx: 0, points: 27, confidence: 0.92, feedback: 'Strong, clear thesis presented in the opening paragraph. The argument follows a logical progression from general claims to specific evidence and back to broader implications. The acknowledgment of counterarguments strengthens the overall argumentative structure.', evidence: ['Social media has, on balance, strengthened democratic engagement by lowering barriers to political participation, amplifying marginalized voices, and enabling rapid mobilization for social causes'] },
        { criterionIdx: 1, points: 22, confidence: 0.88, feedback: 'Good use of scholarly sources (Shirky, Freelon et al., Sunstein, Lessenski). Sources are integrated naturally into the argument rather than simply dropped in. Minor concern: some claims could use additional citation support.', evidence: ['Scholars such as Shirky (2011) argue that social media has created a "many-to-many" communication paradigm', 'Research by Freelon et al. (2018) demonstrates that movements like Black Lives Matter leveraged social media platforms'] },
        { criterionIdx: 2, points: 23, confidence: 0.85, feedback: 'Demonstrates strong critical thinking by acknowledging counterarguments (echo chambers, misinformation) before presenting a nuanced rebuttal. The Finland example adds depth. Could push further into analyzing the structural incentives of platform design.', evidence: ['Sunstein (2017) warns that algorithmic curation can create "filter bubbles"', 'the solution to these challenges lies not in retreating from digital democracy but in developing better digital literacy'] },
        { criterionIdx: 3, points: 18, confidence: 0.95, feedback: 'Well-written academic prose with appropriate tone throughout. Clear paragraph structure with effective transitions. Minor stylistic note: the conclusion could be more impactful.', evidence: ['Social media has fundamentally transformed the landscape of democratic participation in the 21st century'] },
      ],
      overallComments: 'A well-structured argumentative essay that demonstrates strong understanding of the topic. The student effectively balances supporting evidence with acknowledgment of counterarguments. The writing is clear and academic in tone. Main area for improvement: deeper engagement with the structural critiques of social media platforms.',
      flags: [],
    },
    {
      student: bob,
      content: `Social media is bad for democracy. In this essay I will explain why social media is hurting our democratic society.

First of all, social media spreads fake news. People share articles without reading them and this causes lots of problems. For example, during elections there are lots of fake stories that go viral. This is really bad for democracy because people cant make good decisions if they dont have good information.

Second, social media creates echo chambers. This means people only see stuff they already agree with. The algorithms show you content that keeps you engaged which means controversial and extreme content. This makes people more polarized and less willing to compromise.

Third, social media companies are too powerful. Companies like Facebook and Twitter have too much control over what people see and say. They can ban people or promote certain content. This is a threat to free speech which is important for democracy.

Some people say social media is good for democracy because it lets more people participate. But I think the bad outweighs the good. Yes more people can share their opinions but most of those opinions are uninformed or based on misinformation.

In conclusion social media is harmful to democracy because of fake news, echo chambers, and corporate power. We need to regulate these companies better to protect our democratic values.`,
      aiScores: [
        { criterionIdx: 0, points: 15, confidence: 0.78, feedback: 'The thesis is stated but lacks nuance — "social media is bad for democracy" is overly simplistic. The essay follows a basic three-point structure but arguments remain at surface level without deep development. The acknowledgment of counterarguments is dismissed too quickly.', evidence: ['Social media is bad for democracy', 'Some people say social media is good for democracy because it lets more people participate. But I think the bad outweighs the good'] },
        { criterionIdx: 1, points: 8, confidence: 0.90, feedback: 'No scholarly sources cited. Claims are presented as general knowledge without attribution. Statements like "during elections there are lots of fake stories" need specific examples and academic support.', evidence: ['during elections there are lots of fake stories that go viral'] },
        { criterionIdx: 2, points: 10, confidence: 0.72, feedback: 'Limited critical analysis. Points are stated but not deeply examined. The counterargument section is weak — it acknowledges the opposing view but dismisses it without substantive engagement. No consideration of structural or systemic factors.', evidence: ['most of those opinions are uninformed or based on misinformation'] },
        { criterionIdx: 3, points: 12, confidence: 0.85, feedback: 'Writing is generally clear but informal in places. Several grammatical issues (missing apostrophes, run-on sentences). Academic tone needs improvement. Paragraph structure is adequate.', evidence: ['people cant make good decisions if they dont have good information'] },
      ],
      overallComments: 'The essay addresses the prompt but remains at a surface level throughout. The main weaknesses are the lack of scholarly sources and the limited depth of analysis. The writing would benefit from a more nuanced thesis, specific evidence, and deeper engagement with counterarguments.',
      flags: [],
    },
    {
      student: carol,
      content: `The relationship between social media and democratic governance presents one of the most pressing questions in contemporary political science. Drawing on deliberative democracy theory (Habermas, 1996) and recent empirical studies, this essay argues that social media simultaneously enables and constrains democratic participation, and that its ultimate impact depends on the institutional frameworks within which it operates.

From the perspective of participatory democracy, social media platforms have undeniably expanded the public sphere. Benkler et al. (2018) demonstrate in their comprehensive study of the 2016 U.S. election that online platforms created new spaces for political discourse, even as those spaces were contested. The Arab Spring movements of 2010-2011 remain the most dramatic illustration of social media's mobilization capacity, though Howard and Hussain (2013) caution against technological determinism, noting that pre-existing social networks and organizational structures were equally crucial.

The deliberative quality of social media discourse, however, raises concerns that strike at the heart of democratic theory. Habermas's ideal of rational-critical debate requires access to accurate information, mutual respect among participants, and the possibility of genuine persuasion. Empirical research by Bail et al. (2018) found that exposure to opposing political views on Twitter actually increased political polarization rather than promoting the kind of understanding that deliberative democracy requires. This finding challenges the naive assumption that more information necessarily leads to better democratic outcomes.

The political economy of social media introduces another layer of complexity. Zuboff's (2019) concept of "surveillance capitalism" highlights how the business models of social media platforms — built on attention extraction and behavioral prediction — create structural incentives that may be fundamentally at odds with democratic values. When the most profitable content is the most emotionally provocative, the architecture of these platforms may systematically undermine the conditions necessary for healthy democratic deliberation.

Yet dismissing social media's democratic potential would be premature. Tucker et al. (2017) provide evidence that social media has been particularly valuable for democratic participation in countries with weak traditional media institutions. In contexts where press freedom is limited, social media may represent the only viable channel for democratic expression and organization.

The critical variable, I argue, is institutional design. Nordic democracies, which combine strong public media institutions with high levels of digital literacy, have demonstrated greater resilience to the pathologies of social media discourse (Humprecht et al., 2020). This suggests that the impact of social media on democracy is not predetermined but is shaped by the broader institutional ecosystem in which it operates.

In conclusion, social media neither saves nor destroys democracy. Its impact is mediated by institutional frameworks, digital literacy levels, and the regulatory choices societies make. The most productive path forward lies not in celebration or condemnation of these technologies, but in building the institutional capacity to harness their democratic potential while mitigating their risks.`,
      aiScores: [
        { criterionIdx: 0, points: 29, confidence: 0.94, feedback: 'Excellent thesis that avoids binary framing and stakes out a nuanced position. The argument is sophisticated, moving from participation to deliberation to political economy to institutional design. Each section builds logically on the previous one, creating a compelling overall argument.', evidence: ['social media simultaneously enables and constrains democratic participation, and that its ultimate impact depends on the institutional frameworks within which it operates'] },
        { criterionIdx: 1, points: 24, confidence: 0.91, feedback: 'Outstanding use of scholarly sources. Seven distinct academic references are integrated seamlessly into the argument. Each source is used purposefully — not just cited but analyzed. The range of sources (Habermas, Benkler, Zuboff, etc.) shows breadth of research.', evidence: ['Benkler et al. (2018) demonstrate in their comprehensive study', 'Empirical research by Bail et al. (2018) found that exposure to opposing political views'] },
        { criterionIdx: 2, points: 24, confidence: 0.88, feedback: 'Exceptional critical analysis. The essay moves beyond surface-level claims to examine structural factors (surveillance capitalism, institutional design). The engagement with deliberative democracy theory elevates the analysis. The conclusion resists easy answers. Only minor gap: could address the role of AI/algorithms more specifically.', evidence: ['Zuboff\'s (2019) concept of "surveillance capitalism" highlights how the business models of social media platforms', 'The critical variable, I argue, is institutional design'] },
        { criterionIdx: 3, points: 19, confidence: 0.93, feedback: 'Sophisticated academic prose with varied sentence structure and precise vocabulary. Strong transitions between paragraphs. The writing demonstrates command of academic conventions. Very minor: a few sentences could be more concise.', evidence: ['The relationship between social media and democratic governance presents one of the most pressing questions in contemporary political science'] },
      ],
      overallComments: 'An outstanding essay that demonstrates sophisticated understanding of the topic and strong academic writing skills. The theoretical framework (deliberative democracy) grounds the analysis effectively, and the range of evidence is impressive. This represents work at the upper end of undergraduate quality. The institutional design argument in the final body paragraphs is particularly strong.',
      flags: [],
    },
  ];

  for (const essaySub of essaySubmissions) {
    const submission = await prisma.submission.create({
      data: {
        userId: essaySub.student.id,
        assignmentId: essayAssignment.id,
        content: essaySub.content,
        status: 'SUBMITTED',
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    });

    // Create PreGradeJob (completed)
    await prisma.preGradeJob.create({
      data: {
        submissionId: submission.id,
        status: 'COMPLETED',
        attempts: 1,
        workerVersion: '1.0.0',
        startedAt: new Date(Date.now() - 1.9 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 1.9 * 24 * 60 * 60 * 1000),
      },
    });

    // Create Grade with AI data
    const totalAiPoints = essaySub.aiScores.reduce((sum, s) => sum + s.points, 0);
    const grade = await prisma.grade.create({
      data: {
        submissionId: submission.id,
        graderId: teacher.id,
        points: 0,
        maxPoints: 100,
        feedback: '',
        status: 'AI_GRADED',
        aiOverallComments: essaySub.overallComments,
        aiModelUsed: 'llama-3.3-70b-versatile',
        aiPromptVersion: '1.0.0',
        aiGradedAt: new Date(Date.now() - 1.9 * 24 * 60 * 60 * 1000),
        aiFlags: essaySub.flags,
        aiTokensUsed: 2500,
        aiProcessingMs: 3200,
        aiRawResponse: { overallComments: essaySub.overallComments, criteriaScores: essaySub.aiScores, flags: essaySub.flags },
      },
    });

    // Create RubricScores
    for (const score of essaySub.aiScores) {
      await prisma.rubricScore.create({
        data: {
          gradeId: grade.id,
          criterionId: criteria[score.criterionIdx].id,
          points: 0,
          feedback: '',
          aiSuggestedPoints: score.points,
          aiSuggestedFeedback: score.feedback,
          aiConfidence: score.confidence,
          aiKeyEvidence: score.evidence,
        },
      });
    }
  }

  console.log('  Essay submissions with AI grades created');

  // ── Quiz Assignment ──
  const quizAssignment = await prisma.assignment.create({
    data: {
      title: 'Quiz: Research Methods Fundamentals',
      description: 'Test your understanding of basic research methodology concepts.',
      type: 'QUIZ',
      courseId: course.id,
      maxPoints: 20,
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      aiGradingEnabled: false,
      releaseMode: 'ROLLING',
    },
  });

  const questions = await Promise.all([
    prisma.question.create({
      data: {
        assignmentId: quizAssignment.id, text: 'What is the primary purpose of a literature review?',
        type: 'MULTIPLE_CHOICE', options: JSON.parse('["To summarize all published work","To identify gaps in existing research","To prove your hypothesis","To list your sources"]'),
        correctAnswers: ['To identify gaps in existing research'], points: 4, order: 0,
      },
    }),
    prisma.question.create({
      data: {
        assignmentId: quizAssignment.id, text: 'A hypothesis must be testable.',
        type: 'TRUE_FALSE', options: JSON.parse('["True","False"]'),
        correctAnswers: ['True'], points: 4, order: 1,
      },
    }),
    prisma.question.create({
      data: {
        assignmentId: quizAssignment.id, text: 'Which of the following are types of research bias? (Select all that apply)',
        type: 'CHECKBOXES', options: JSON.parse('["Confirmation bias","Selection bias","Publication bias","Citation bias"]'),
        correctAnswers: ['Confirmation bias', 'Selection bias', 'Publication bias'], points: 4, order: 2,
      },
    }),
    prisma.question.create({
      data: {
        assignmentId: quizAssignment.id, text: 'What does "p < 0.05" indicate in statistical analysis?',
        type: 'SHORT_ANSWER', correctAnswers: ['statistical significance'], points: 4, order: 3,
      },
    }),
    prisma.question.create({
      data: {
        assignmentId: quizAssignment.id, text: 'Explain the difference between qualitative and quantitative research methods.',
        type: 'PARAGRAPH', correctAnswers: [], points: 4, order: 4,
      },
    }),
  ]);

  // Quiz submissions
  const quizAnswers = [
    { student: alice, answers: ['To identify gaps in existing research', 'True', '["Confirmation bias","Selection bias","Publication bias"]', 'statistical significance', 'Qualitative research focuses on understanding phenomena through observation, interviews, and textual analysis, while quantitative research uses numerical data and statistical methods to test hypotheses.'] },
    { student: bob, answers: ['To summarize all published work', 'True', '["Confirmation bias","Selection bias"]', 'the result is significant', 'Qualitative is about words and quantitative is about numbers.'] },
    { student: carol, answers: ['To identify gaps in existing research', 'True', '["Confirmation bias","Selection bias","Publication bias","Citation bias"]', 'statistical significance', 'Qualitative research employs interpretive methods such as interviews, ethnography, and discourse analysis to explore meanings and experiences. Quantitative research, by contrast, relies on measurable data, controlled experiments, and statistical testing to establish causal or correlational relationships. The key epistemological difference lies in their treatment of objectivity: quantitative methods assume a positivist framework, while qualitative approaches often adopt constructivist or interpretivist paradigms.'] },
  ];

  for (const qa of quizAnswers) {
    const submission = await prisma.submission.create({
      data: {
        userId: qa.student.id,
        assignmentId: quizAssignment.id,
        status: 'SUBMITTED',
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 15 * 60 * 1000),
      },
    });

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      let isCorrect: boolean | null = null;
      let pointsAwarded: number | null = null;

      if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') {
        isCorrect = qa.answers[i] === q.correctAnswers[0];
        pointsAwarded = isCorrect ? q.points : 0;
      } else if (q.type === 'SHORT_ANSWER') {
        isCorrect = qa.answers[i].toLowerCase() === q.correctAnswers[0].toLowerCase();
        pointsAwarded = isCorrect ? q.points : 0;
      } else if (q.type === 'CHECKBOXES') {
        const selected = JSON.parse(qa.answers[i]);
        const correct = q.correctAnswers;
        const correctCount = selected.filter((a: string) => correct.includes(a)).length;
        const incorrectCount = selected.filter((a: string) => !correct.includes(a)).length;
        const ratio = Math.max(0, (correctCount - incorrectCount) / correct.length);
        pointsAwarded = Math.round(ratio * q.points);
        isCorrect = correctCount === correct.length && incorrectCount === 0;
      }
      // PARAGRAPH: isCorrect=null, pointsAwarded=null (needs manual)

      await prisma.answer.create({
        data: { submissionId: submission.id, questionId: q.id, answerValue: qa.answers[i], isCorrect, pointsAwarded },
      });
    }

    // Create auto-grade for quiz
    const autoPoints = qa.answers.reduce((sum, ans, i) => {
      const q = questions[i];
      if (q.type === 'PARAGRAPH') return sum;
      if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') {
        return sum + (ans === q.correctAnswers[0] ? q.points : 0);
      }
      if (q.type === 'SHORT_ANSWER') {
        return sum + (ans.toLowerCase() === q.correctAnswers[0].toLowerCase() ? q.points : 0);
      }
      if (q.type === 'CHECKBOXES') {
        const selected = JSON.parse(ans);
        const correct = q.correctAnswers;
        const correctCount = selected.filter((a: string) => correct.includes(a)).length;
        const incorrectCount = selected.filter((a: string) => !correct.includes(a)).length;
        return sum + Math.max(0, Math.round(Math.max(0, (correctCount - incorrectCount) / correct.length) * q.points));
      }
      return sum;
    }, 0);

    await prisma.grade.create({
      data: {
        submissionId: submission.id,
        graderId: teacher.id,
        points: autoPoints,
        maxPoints: 20,
        feedback: `Auto-graded portion: ${autoPoints}/16 points. 1 question requires manual grading.`,
        status: 'PARTIAL',
        autoPoints,
      },
    });
  }

  console.log('  Quiz submissions with auto-grades created');
  console.log('\nSeed complete!');
  console.log('\nDemo accounts:');
  console.log('  Teacher: teacher@pregrade.demo / demo1234');
  console.log('  Student: alice@pregrade.demo / demo1234');
  console.log('  Student: bob@pregrade.demo / demo1234');
  console.log('  Student: carol@pregrade.demo / demo1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
