interface AssignmentContext { title: string; description: string; }

export function getModeContext(assignment: AssignmentContext): string {
  return [
    `Assignment: "${assignment.title}"`,
    assignment.description ? `Description: ${assignment.description}` : '',
    '',
    'Evaluation framework: Roadmap Assessment',
    'This is a research outline — evaluate it as a PLAN, not as finished prose.',
    'Assess across these dimensions:',
    '- Thesis as claim: Does the thesis state an arguable claim, not just a topic?',
    '- Logical structure: Do the planned sections flow logically toward proving the thesis?',
    '- Source planning: Are planned sources relevant, diverse, and sufficient for the scope?',
    '- Feasibility: Is the proposed research achievable within the assignment constraints?',
    '- Specificity: Are section descriptions concrete enough to guide actual writing?',
    '',
    'Do NOT penalize incomplete prose or bullet-point format — this is an outline.',
    'Penalize vague section headers like "Body Paragraph 1" with no content plan.',
  ].filter(Boolean).join('\n');
}
