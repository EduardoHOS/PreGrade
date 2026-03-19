interface AssignmentContext { title: string; description: string; }

export function getModeContext(assignment: AssignmentContext): string {
  return [
    `Assignment: "${assignment.title}"`,
    assignment.description ? `Description: ${assignment.description}` : '',
    '',
    'Evaluation framework: Comparative Analysis',
    'Assess the comparative essay across these dimensions:',
    '- Thesis: Does the student argue a position about the comparison, not just list differences?',
    '- Structure: Prefer point-by-point organization over subject-by-subject. If subject-by-subject is used, are cross-references made?',
    '- Balanced evidence: Are both sides given roughly equal analytical depth?',
    '- Analytical depth: Does the student explain WHY differences/similarities matter, not just WHAT they are?',
    '- Synthesis: Does the conclusion draw the comparison together into a meaningful insight?',
    '',
    'CRITICAL: An essay that describes Subject A fully, then Subject B fully = two separate descriptions, NOT a comparative essay. Score LOW on Analysis.',
    'Require explicit comparative language.',
    'The conclusion should note significance beyond the two subjects.',
    '',
    'A comparison that only summarizes each subject separately without connecting them should score low on structure and synthesis.',
  ].filter(Boolean).join('\n');
}
