import type { ru } from './ru';

/** Keys of the form `food_male`/`poop_female` — the gender variants of an action label. */
type GenderedActionKey = Extract<keyof typeof ru['action'], `${string}_male` | `${string}_female`>;

/**
 * Shape of a locale translation: every base key is mandatory, gender variants
 * are optional and only present in languages that inflect by gender
 * (currently ru/uk/be). Locales without them fall back to the base key.
 */
export type Translation = Omit<typeof ru, 'action'> & {
  action: Omit<typeof ru['action'], GenderedActionKey> &
    Partial<Pick<typeof ru['action'], GenderedActionKey>>;
};
