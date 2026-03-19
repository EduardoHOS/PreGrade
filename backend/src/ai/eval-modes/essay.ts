interface AssignmentContext { title: string; description: string; }

export function getModeContext(assignment: AssignmentContext): string {
  return [
    `Assignment: "${assignment.title}"`,
    assignment.description ? `Description: ${assignment.description}` : '',
    '',
    'Evaluation framework: Bloom\'s Taxonomy',
    'Assess the essay across cognitive levels:',
    '- Remember/Understand: Does the student recall and explain key concepts accurately?',
    '- Apply/Analyze: Does the student apply concepts to new situations and break down arguments?',
    '- Evaluate/Create: Does the student make reasoned judgments and synthesize original arguments?',
    '',
    'Also consider: thesis clarity, evidence quality, logical structure, academic voice, and proper attribution.',
  ].filter(Boolean).join('\n');
}
