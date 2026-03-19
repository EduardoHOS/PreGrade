interface AssignmentContext { title: string; description: string; rubricCriteriaNames?: string[]; }

type PoetrySubMode = 'analysis' | 'original';

function detectSubMode(criteriaNames: string[]): PoetrySubMode {
  const joined = criteriaNames.join(' ').toLowerCase();
  const originalKeywords = ['imagery', 'voice', 'line breaks', 'original', 'creative expression', 'poetic craft'];
  const analysisKeywords = ['analysis', 'interpretation', 'literary devices', 'close reading', 'textual evidence'];

  let originalScore = 0;
  let analysisScore = 0;

  for (const kw of originalKeywords) { if (joined.includes(kw)) originalScore++; }
  for (const kw of analysisKeywords) { if (joined.includes(kw)) analysisScore++; }

  return originalScore > analysisScore ? 'original' : 'analysis';
}

export function getModeContext(assignment: AssignmentContext): string {
  const subMode = detectSubMode(assignment.rubricCriteriaNames ?? []);

  const lines = [
    `Assignment: "${assignment.title}"`,
    assignment.description ? `Description: ${assignment.description}` : '',
    '',
  ];

  if (subMode === 'original') {
    lines.push(
      'Evaluation framework: Creative Craft (Original Poetry)',
      'Assess the original poem across these dimensions:',
      '- Imagery & sensory detail: Does the poem create vivid images through specific, concrete language?',
      '- Voice & tone: Is there a distinct, consistent poetic voice?',
      '- Line breaks & form: Are line breaks deliberate? Do they create meaning, rhythm, or emphasis?',
      '- Sound & rhythm: Does the poem use sound devices (alliteration, assonance, meter) effectively?',
      '- Emotional impact: Does the poem create a felt experience for the reader?',
      '',
      'Do NOT penalize free verse unless the rubric specifically requires a particular form.',
      'Do NOT penalize unconventional punctuation, capitalization, or grammar if intentional.',
      'Distinguish craft choices from errors. Flag `possible_ai_written` if the poem is technically correct but lacks genuine voice.',
    );
  } else {
    lines.push(
      'Evaluation framework: Literary Analysis (Poetry Response)',
      'Assess the poetry analysis across these dimensions:',
      '- Close reading: Does the student quote specific lines and explain their significance?',
      '- Literary devices: Are devices (metaphor, imagery, symbolism, tone) identified AND analyzed for effect?',
      '- Interpretation: Does the student offer a coherent reading of the poem\'s meaning or theme?',
      '- Textual evidence: Are claims supported by direct reference to the text?',
      '- Context awareness: If relevant, does the student consider historical or biographical context?',
      '',
      'Reward original interpretation over surface-level summary. A strong analysis explains HOW poetic choices create meaning.',
    );
  }

  return lines.filter(Boolean).join('\n');
}
