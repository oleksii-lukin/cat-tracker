import type { Sex } from '@/types/domain';

type Translate = (key: string) => string;

export function sexLabel(sex: Sex, t: Translate): string {
  if (sex === 'male') return t('settings.sexMale');
  if (sex === 'female') return t('settings.sexFemale');
  return t('settings.sexNotSpecified');
}
