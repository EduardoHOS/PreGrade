interface AssignmentContext { title: string; description: string; }

export function getModeContext(assignment: AssignmentContext): string {
  return [
    `Assignment: "${assignment.title}"`,
    assignment.description ? `Description: ${assignment.description}` : '',
    '',
    'Evaluation framework: Feedback Quality',
    'This is a PEER REVIEW — evaluate the QUALITY OF FEEDBACK the student gave, not the reviewed work.',
    'Assess across these dimensions:',
    '- Specificity: Does the reviewer point to exact passages, sentences, or paragraphs?',
    '- Constructiveness: Does each critique include a suggestion for improvement?',
    '- Evidence-based: Are comments grounded in rubric criteria, course concepts, or writing principles?',
    '- Balance: Does the review acknowledge strengths as well as weaknesses?',
    '- Tone: Is the feedback respectful and encouraging while still being honest?',
    '',
    'You do NOT have access to the original work being reviewed. Evaluate only the quality of feedback given.',
    'If the review is under 100 words, flag `low_confidence_overall`.',
    '',
    'Generic feedback like "good job" or "needs work" without specifics should score low.',
  ].filter(Boolean).join('\n');
}
