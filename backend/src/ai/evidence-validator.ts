// eslint-disable-next-line @typescript-eslint/no-var-requires
const stringSimilarity = require('string-similarity');

export interface ValidationResult {
  validEvidence: string[];
  rejectedEvidence: string[];
  allValid: boolean;
}

const MIN_QUOTE_LENGTH = 8;
const DEFAULT_THRESHOLD = 0.85;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^[^\w]+|[^\w]+$/g, '')
    .trim();
}

function buildChunks(source: string, quoteLen: number): string[] {
  const minLen = Math.max(MIN_QUOTE_LENGTH, Math.floor(quoteLen * 0.8));
  const maxLen = Math.ceil(quoteLen * 1.2);
  const chunks: string[] = [];

  for (let size = minLen; size <= maxLen; size++) {
    for (let i = 0; i <= source.length - size; i++) {
      chunks.push(source.slice(i, i + size));
    }
  }
  return chunks;
}

export function validateEvidence(
  quotes: string[],
  sourceText: string,
  threshold: number = DEFAULT_THRESHOLD,
): ValidationResult {
  if (quotes.length === 0) {
    return { validEvidence: [], rejectedEvidence: [], allValid: true };
  }

  const normalizedSource = normalize(sourceText);
  const validEvidence: string[] = [];
  const rejectedEvidence: string[] = [];

  for (const quote of quotes) {
    const normalizedQuote = normalize(quote);

    if (normalizedQuote.length < MIN_QUOTE_LENGTH) {
      rejectedEvidence.push(quote);
      continue;
    }

    if (!normalizedSource) {
      rejectedEvidence.push(quote);
      continue;
    }

    if (normalizedQuote.length > normalizedSource.length) {
      rejectedEvidence.push(quote);
      continue;
    }

    if (normalizedSource.includes(normalizedQuote)) {
      validEvidence.push(quote);
      continue;
    }

    const chunks = buildChunks(normalizedSource, normalizedQuote.length);
    if (chunks.length === 0) {
      rejectedEvidence.push(quote);
      continue;
    }

    const result = stringSimilarity.findBestMatch(normalizedQuote, chunks);
    if (result.bestMatch.rating >= threshold) {
      validEvidence.push(quote);
    } else {
      rejectedEvidence.push(quote);
    }
  }

  return {
    validEvidence,
    rejectedEvidence,
    allValid: rejectedEvidence.length === 0,
  };
}
