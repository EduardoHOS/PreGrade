interface AssignmentContext { title: string; description: string; }

export function getModeContext(assignment: AssignmentContext): string {
  return [
    `Assignment: "${assignment.title}"`,
    assignment.description ? `Description: ${assignment.description}` : '',
    '',
    'Evaluation framework: Synthesis & Attribution',
    'Assess the research summary across these dimensions:',
    '- Source accuracy: Are facts and claims correctly represented from the source material?',
    '- Attribution: Does the student clearly distinguish the author\'s ideas from their own commentary?',
    '- Synthesis vs. copying: Is the summary in the student\'s own language? Flag `possible_plagiarism` if more than 3 consecutive sentences closely mirror the source.',
    '- Critical engagement: Does the student evaluate the source, not just describe it?',
    '- Own voice: Does the student position the summary within a larger argument or framing?',
    '',
    'Accurate summaries with no critical framing score mid-range, not top.',
  ].filter(Boolean).join('\n');
}
