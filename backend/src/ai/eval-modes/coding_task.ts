interface AssignmentContext { title: string; description: string; }

export function getModeContext(assignment: AssignmentContext): string {
  return [
    `Assignment: "${assignment.title}"`,
    assignment.description ? `Description: ${assignment.description}` : '',
    '',
    'Evaluation framework: Correctness + Complexity + Style',
    'Assess the code submission across three dimensions:',
    '- Correctness: Does the code produce the expected output for typical and edge-case inputs?',
    '- Complexity: Is the algorithmic approach efficient? Note time/space complexity where relevant.',
    '- Style: Is the code readable, well-structured, and following language conventions?',
    '',
    'Also consider: error handling, meaningful variable names, and appropriate use of comments.',
  ].filter(Boolean).join('\n');
}
