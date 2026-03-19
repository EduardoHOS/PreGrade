interface AssignmentContext { title: string; description: string; }

export function getModeContext(assignment: AssignmentContext): string {
  return [
    `Assignment: "${assignment.title}"`,
    assignment.description ? `Description: ${assignment.description}` : '',
    '',
    'Evaluation framework: Depth of Reflection Scale',
    'Assess the reflection at these levels:',
    '- Descriptive: Student simply recounts events without analysis (lowest).',
    '- Analytical: Student identifies causes, effects, and connections.',
    '- Critical: Student examines assumptions, considers alternative perspectives, and challenges ideas.',
    '- Transformative: Student articulates how the experience changes their understanding or future behavior (highest).',
    '',
    'Look for: personal insight, connection to course concepts, honesty, and evidence of growth.',
  ].filter(Boolean).join('\n');
}
