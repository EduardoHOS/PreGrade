const franc = require('franc');

export const LANG_NAMES: Record<string, string> = {
  eng: 'English',
  por: 'Portuguese',
  fra: 'French',
  spa: 'Spanish',
  deu: 'German',
  ita: 'Italian',
  zho: 'Chinese',
  jpn: 'Japanese',
  kor: 'Korean',
  ara: 'Arabic',
  hin: 'Hindi',
  rus: 'Russian',
  tur: 'Turkish',
  nld: 'Dutch',
  pol: 'Polish',
  swe: 'Swedish',
  dan: 'Danish',
  nor: 'Norwegian',
  fin: 'Finnish',
  ces: 'Czech',
  ron: 'Romanian',
  hun: 'Hungarian',
  ell: 'Greek',
  heb: 'Hebrew',
  tha: 'Thai',
  vie: 'Vietnamese',
  ind: 'Indonesian',
  msa: 'Malay',
  ukr: 'Ukrainian',
};

export interface LanguageDetectionResult {
  code: string;
  name: string;
  isEnglish: boolean;
}

export function detectSubmissionLanguage(text: string): LanguageDetectionResult {
  if (!text || text.trim().length < 50) {
    return { code: 'und', name: 'Undetermined', isEnglish: true };
  }
  const code = franc(text, { minLength: 50 });
  const name = LANG_NAMES[code] ?? 'Unknown';
  return { code, name, isEnglish: code === 'eng' || code === 'und' };
}
