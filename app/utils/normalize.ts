const NON_BREAKING_SPACE = /\u00A0/g
const CONTROL_CHARS = /[\u200B-\u200D\uFEFF]/g
const WHITESPACE = /\s+/g
const TATWEEL = /ـ/g
const ARABIC_ALEF = /[أإآ]/g
const TAA_MARBOUTA = /ة/g
const YAA = /ي/g
const ARABIC_INDIC_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/g

const DIGIT_MAP: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9'
}

export function cleanText(text: string): string {
  return text
    .replace(NON_BREAKING_SPACE, ' ')
    .replace(CONTROL_CHARS, '')
    .replace(TATWEEL, '')
    .replace(WHITESPACE, ' ')
    .trim()
}

export function normalizeArabic(text: string): string {
  return text
    .replace(ARABIC_ALEF, 'ا')
    .replace(TAA_MARBOUTA, 'ه')
    .replace(YAA, 'ى')
}

export function normalizeStage(stage: string): string {
  return normalizeArabic(cleanText(stage))
}

export function normalizeGender(gender: string): string {
  const normalized = cleanText(gender)

  if (normalized === 'نكث' || normalized === 'نكين') {
    return 'بنين'
  }

  if (normalized === 'بنات' || normalized === 'للبنات') {
    return 'بنات'
  }

  if (normalized.includes('بنات')) {
    return 'بنات'
  }

  return normalized
}

export function toEnglishDigits(text: string): string {
  return text.replace(ARABIC_INDIC_DIGITS, digit => DIGIT_MAP[digit] ?? digit)
}

export function normalizeHeader(text: string): string {
  return normalizeArabic(cleanText(text.replace(/[()]/g, ''))).toLocaleLowerCase('ar')
}
