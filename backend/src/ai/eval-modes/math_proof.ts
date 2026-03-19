interface AssignmentContext { title: string; description: string; }

export function getModeContext(assignment: AssignmentContext): string {
  return [
    `Assignment: "${assignment.title}"`,
    assignment.description ? `Description: ${assignment.description}` : '',
    '',
    'Evaluation framework: Logical Rigor',
    'Assess the mathematical proof across these dimensions:',
    '- Correctness: Is each logical step valid? Are there gaps in the reasoning chain?',
    '- Justification: Does the student cite relevant theorems, definitions, or axioms for each step?',
    '- Notation: Is mathematical notation used correctly and consistently?',
    '- Completeness: Does the proof address all cases (including edge cases and boundary conditions)?',
    '- Clarity: Is the proof structured so that each step follows clearly from the previous one?',
    '',
    'When an error exists, identify the FIRST step where it occurs.',
    'Flag `incomplete_proof` if the proof has logical gaps that break the chain of reasoning.',
    'If the proof involves advanced math beyond secondary level: set confidence = 0.3 and flag `advanced_math_low_confidence`.',
    'Do NOT penalize alternative valid proof strategies.',
  ].filter(Boolean).join('\n');
}
