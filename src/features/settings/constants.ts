import { LANGUAGE_AUTO, type LanguagePref } from '@/i18n';
import type { Sex } from '@/types/domain';

export const SEX_OPTIONS: { value: Sex; labelKey: 'settings.sexMale' | 'settings.sexFemale' | null }[] = [
  { value: 'male', labelKey: 'settings.sexMale' },
  { value: 'female', labelKey: 'settings.sexFemale' },
  { value: 'unknown', labelKey: null },
];

export const LANGUAGE_OPTIONS: {
  value: LanguagePref;
  labelKey:
    | 'settings.langAuto'
    | 'settings.langRu'
    | 'settings.langUk'
    | 'settings.langBe'
    | 'settings.langEn'
    | 'settings.langEs'
    | 'settings.langDe'
    | 'settings.langIt'
    | 'settings.langFr';
}[] = [
  { value: LANGUAGE_AUTO, labelKey: 'settings.langAuto' },
  { value: 'ru', labelKey: 'settings.langRu' },
  { value: 'uk', labelKey: 'settings.langUk' },
  { value: 'be', labelKey: 'settings.langBe' },
  { value: 'en', labelKey: 'settings.langEn' },
  { value: 'es', labelKey: 'settings.langEs' },
  { value: 'de', labelKey: 'settings.langDe' },
  { value: 'it', labelKey: 'settings.langIt' },
  { value: 'fr', labelKey: 'settings.langFr' },
];
