import { detectSubmissionLanguage } from './language-detector';
import { aiLogger } from './ai-logger';

export interface StripResult {
  strippedText: string;
  piiDetected: boolean;
  detectedTypes: string[];
  detectedLanguage: string;
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const LABELED_ID_RE = /\b(?:ID|Student\s*#|s\/n)\s*:?\s*\d{4,10}\b/gi;
const BARE_ID_RE = /(?<![,.\d])\b\d{6,10}\b(?![,.\d])/g;
const SELF_ID_RE = /\b(?:[Mm]y name is|[Ii] am|[Tt]his is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/g;
const PHONE_RE = /(?:\+\d{1,3}[\s.-])?(?:\(\d{2,4}\)|\d{2,4})[\s.-]\d{3,4}[\s.-]\d{3,4}/g;
const DOB_RE = /\b(?:DOB|Date of Birth)\s*:\s*\d{1,2}[\s/.-]\d{1,2}[\s/.-]\d{2,4}/gi;

function normalize(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function stripPII(text: string, studentName?: string): StripResult {
  try {
    const langResult = detectSubmissionLanguage(text);
    let result = text;
    const detectedTypes = new Set<string>();

    if (EMAIL_RE.test(result)) {
      detectedTypes.add('email');
      result = result.replace(EMAIL_RE, '[EMAIL]');
    }

    if (DOB_RE.test(result)) {
      detectedTypes.add('dob');
      result = result.replace(DOB_RE, '[DOB]');
    }

    if (PHONE_RE.test(result)) {
      detectedTypes.add('phone');
      result = result.replace(PHONE_RE, '[PHONE]');
    }

    if (LABELED_ID_RE.test(result)) {
      detectedTypes.add('student_id');
      result = result.replace(LABELED_ID_RE, '[STUDENT_ID]');
    }

    if (BARE_ID_RE.test(result)) {
      detectedTypes.add('student_id');
      result = result.replace(BARE_ID_RE, '[STUDENT_ID]');
    }

    if (studentName) {
      const parts = studentName.trim().split(/\s+/);
      const normalizedResult = normalize(result);

      const fullNamePattern = parts.map((p) => escapeRegex(normalize(p))).join('\\s+');
      const fullNameRe = new RegExp(fullNamePattern, 'gi');
      if (fullNameRe.test(normalizedResult)) {
        detectedTypes.add('name_pattern');
        result = normalize(result).replace(fullNameRe, '[STUDENT]');
      }

      for (const part of parts) {
        if (part.length < 2) continue;
        const partRe = new RegExp(`\\b${escapeRegex(normalize(part))}\\b`, 'gi');
        if (partRe.test(result)) {
          detectedTypes.add('name_pattern');
          result = result.replace(partRe, '[STUDENT]');
        }
      }
    }

    if (SELF_ID_RE.test(result)) {
      detectedTypes.add('name_pattern');
      result = result.replace(SELF_ID_RE, (match, _name) => {
        const trigger = match.slice(0, match.length - _name.length);
        return `${trigger}[STUDENT]`;
      });
    }

    return {
      strippedText: result,
      piiDetected: detectedTypes.size > 0,
      detectedTypes: [...detectedTypes],
      detectedLanguage: langResult.code,
    };
  } catch (error) {
    aiLogger.error({ msg: 'stripPII error', err: error });
    return {
      strippedText: text,
      piiDetected: false,
      detectedTypes: ['ERROR'],
      detectedLanguage: 'und',
    };
  }
}
