interface AssignmentContext { title: string; description: string; }

export function getModeContext(assignment: AssignmentContext): string {
  return [
    `Assignment: "${assignment.title}"`,
    assignment.description ? `Description: ${assignment.description}` : '',
    '',
    'Evaluate the submission against each rubric criterion.',
    'Base your scores strictly on the evidence present in the submission.',
    'Where the rubric provides level descriptors, use them to calibrate your scores.',
  ].filter(Boolean).join('\n');
}
