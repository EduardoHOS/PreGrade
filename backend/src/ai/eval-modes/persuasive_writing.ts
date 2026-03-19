interface AssignmentContext { title: string; description: string; }

export function getModeContext(assignment: AssignmentContext): string {
  const descLower = (assignment.description ?? '').toLowerCase();
  const isLetter = /\bletter\b/.test(descLower) || /\bop[\s.-]ed\b/.test(descLower);

  const lines = [
    `Assignment: "${assignment.title}"`,
    assignment.description ? `Description: ${assignment.description}` : '',
    '',
    'Evaluation framework: Rhetorical Analysis',
    'Assess the persuasive writing across these dimensions:',
    '- Claim clarity: Is the central argument stated clearly and early?',
    '- Logos: Are logical arguments well-structured with credible evidence?',
    '- Ethos: Does the writer establish credibility and authority on the topic?',
    '- Pathos: Does the piece effectively engage the reader\'s emotions without manipulation?',
    '- Counterargument: Does the writer acknowledge and refute opposing viewpoints?',
    '- Logical fallacies: Check for straw man, ad hominem, false dichotomy, slippery slope, and other common fallacies. Name them explicitly when found.',
    '- Audience awareness: Is the tone and language appropriate for the intended audience?',
  ];

  if (isLetter) {
    lines.push(
      '',
      'This appears to be a letter or op-ed. Also evaluate:',
      '- Salutation & closing: Are they appropriate for the format and audience?',
      '- Register: Is the formality level appropriate for the format?',
      '- Call to action: Does the piece end with a clear, actionable request?',
    );
  }

  lines.push(
    '',
    'Reward strong argumentation even if the position is unpopular. Evaluate reasoning quality, not the opinion itself.',
  );

  return lines.filter(Boolean).join('\n');
}
