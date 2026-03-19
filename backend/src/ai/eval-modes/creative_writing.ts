interface AssignmentContext { title: string; description: string; }

export function getModeContext(assignment: AssignmentContext): string {
  return [
    `Assignment: "${assignment.title}"`,
    assignment.description ? `Description: ${assignment.description}` : '',
    '',
    'Evaluation framework: Craft & Voice',
    'Assess the creative writing submission across these dimensions:',
    '- Voice & authenticity: Does the piece have a distinct, consistent narrative voice?',
    '- Originality: Does the writing offer a fresh angle or unexpected imagery? Clichés lower the score.',
    '- Structure & pacing: Is there a satisfying arc with deliberate structural choices?',
    '- Show vs. tell: Does the writing use concrete detail? ("Her hands shook" > "She was nervous")',
    '- Effect on reader: Does the piece create tension, empathy, humor, wonder, or unease?',
    '',
    'Do NOT penalize unconventional grammar if it appears intentional. Distinguish "error" from "craft choice".',
    'Flag `possible_ai_written` if the writing is polished but generic and lifeless.',
  ].filter(Boolean).join('\n');
}
