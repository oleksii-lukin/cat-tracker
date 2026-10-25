import type { Sex } from '@/types/domain';

/**
 * Signature accepted by `eventLabel`.
 *
 * i18next's `TFunction` narrows the `context` option per literal key, while
 * event labels arrive as plain strings from the registry — so the helper
 * takes the generic shape of `t()` instead.
 */
export type EventLabelTranslate = (key: string, options?: { context?: string }) => string;

/**
 * Resolve an event/action label for a cat.
 *
 * Uses i18next context variants (`action.food_male`, `action.food_female`).
 * Locales that don't define gender variants — and cats with an unknown sex —
 * fall back to the base key, which holds the neutral form.
 */
export function eventLabel(t: EventLabelTranslate, labelKey: string, sex?: Sex): string {
  if (sex === 'male' || sex === 'female') {
    return t(labelKey, { context: sex });
  }
  return t(labelKey);
}
