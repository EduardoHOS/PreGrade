interface AssignmentContext { title: string; description: string; }

export function getModeContext(assignment: AssignmentContext): string {
  return [
    `Assignment: "${assignment.title}"`,
    assignment.description ? `Description: ${assignment.description}` : '',
    '',
    'Evaluation framework: Key Concept Matching',
    'Assess each answer for:',
    '- Accuracy: Does the response contain the correct key concepts and facts?',
    '- Completeness: Are all expected components of the answer addressed?',
    '- Precision: Is the response concise without unnecessary filler?',
    '- Terminology: Does the student use domain-specific vocabulary correctly?',
    '',
    'Partial credit is appropriate when core concepts are present but incomplete.',
  ].filter(Boolean).join('\n');
}
