interface AssignmentContext { title: string; description: string; }

export function getModeContext(assignment: AssignmentContext): string {
  return [
    `Assignment: "${assignment.title}"`,
    assignment.description ? `Description: ${assignment.description}` : '',
    '',
    'Evaluation framework: Applied Analysis',
    'Assess the case study response across these dimensions:',
    '- Problem identification: Does the student accurately define the core problem or decision point?',
    '- Framework application: Are relevant analytical frameworks (SWOT, Porter\'s Five Forces, stakeholder analysis, etc.) applied appropriately?',
    '- Evidence-based reasoning: Are claims and recommendations supported by facts from the case?',
    '- Solution feasibility: Are recommendations realistic given the constraints described in the case?',
    '- Alternative consideration: Does the student acknowledge other viable approaches and explain trade-offs?',
    '',
    'Reward depth over breadth. Do NOT penalize for using a different framework if the reasoning is sound.',
  ].filter(Boolean).join('\n');
}
