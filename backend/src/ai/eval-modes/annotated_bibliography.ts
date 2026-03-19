interface AssignmentContext { title: string; description: string; }

export function getModeContext(assignment: AssignmentContext): string {
  return [
    `Assignment: "${assignment.title}"`,
    assignment.description ? `Description: ${assignment.description}` : '',
    '',
    'Evaluation framework: Per-Entry + Cross-Entry Assessment',
    'Assess the annotated bibliography at TWO levels:',
    '',
    'Per-entry evaluation:',
    '- Citation format: Is each source cited in the required format (APA, MLA, Chicago, etc.)?',
    '- Summary: Does the annotation accurately summarize the source\'s main argument and findings?',
    '- Critical evaluation: Does the student assess the source\'s credibility, methodology, or bias?',
    '- Relevance: Does the annotation explain how this source connects to the research topic?',
    '',
    'Cross-entry evaluation:',
    '- Source diversity: Are sources varied in type (journal articles, books, reports) and perspective?',
    '- Coverage: Do the sources collectively cover the key aspects of the research topic?',
    '- Thematic connections: Does the student identify relationships between sources?',
    '',
    'Do NOT evaluate the research topic itself — only source selection and annotation quality.',
    'If no citation format is specified in the rubric, do not penalize format choice — evaluate consistency.',
    'Flag `low_confidence_no_source_docs` if sources cannot be verified.',
  ].filter(Boolean).join('\n');
}
