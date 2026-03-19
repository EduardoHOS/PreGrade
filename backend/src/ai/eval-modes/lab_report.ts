interface AssignmentContext { title: string; description: string; }

export function getModeContext(assignment: AssignmentContext): string {
  return [
    `Assignment: "${assignment.title}"`,
    assignment.description ? `Description: ${assignment.description}` : '',
    '',
    'Evaluation framework: Scientific Method Structure',
    'Assess the lab report section by section:',
    '- Hypothesis: Is there a clear, testable hypothesis stated before the methodology?',
    '- Methodology: Are procedures described with enough detail to be reproducible?',
    '- Data presentation: Are results organized (tables, figures) and labeled correctly?',
    '- Analysis: Does the student interpret data accurately and connect findings to the hypothesis?',
    '- Conclusion: Are conclusions supported by the data? Are limitations and sources of error acknowledged?',
    '',
    'Do NOT verify arithmetic — evaluate interpretation, not calculation.',
    'Flag implausibly brief or templated methodology.',
    'Each section is evaluated independently; never average absent sections into other scores.',
    '',
    'Evaluate scientific rigor. Minor formatting issues are secondary to reasoning quality.',
    'If data is fabricated or implausible, flag `low_confidence_overall`.',
  ].filter(Boolean).join('\n');
}
