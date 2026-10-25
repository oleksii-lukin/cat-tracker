import i18n from '@/i18n';
import { eventLabel } from '@/i18n/event-label';

type Lang = 'ru' | 'uk' | 'be' | 'en' | 'de';

/** Смена языка возвращает привязанную к i18n функцию `t`. */
function tFor(lng: Lang) {
  return i18n.changeLanguage(lng);
}

describe('eventLabel', () => {
  const savedLanguage = i18n.language;

  afterAll(async () => {
    await i18n.changeLanguage(savedLanguage);
  });

  it('ru: выбирает форму по полу кота', async () => {
    const t = await tFor('ru');

    expect(eventLabel(t, 'action.food', 'male')).toBe('Поел');
    expect(eventLabel(t, 'action.pee', 'male')).toBe('Пописял');
    expect(eventLabel(t, 'action.poop', 'male')).toBe('Покакал');

    expect(eventLabel(t, 'action.food', 'female')).toBe('Поела');
    expect(eventLabel(t, 'action.pee', 'female')).toBe('Пописяла');
    expect(eventLabel(t, 'action.poop', 'female')).toBe('Покакала');
  });

  it('ru: пол не указан → нейтральная форма', async () => {
    const t = await tFor('ru');

    expect(eventLabel(t, 'action.food', 'unknown')).toBe('Поел(а)');
    expect(eventLabel(t, 'action.food')).toBe('Поел(а)');
    expect(eventLabel(t, 'action.pee', 'unknown')).toBe('Пописял(а)');
    expect(eventLabel(t, 'action.poop', 'unknown')).toBe('Покакал(а)');
  });

  it('uk и be: свои мужские/женские формы', async () => {
    const uk = await tFor('uk');
    expect(eventLabel(uk, 'action.food', 'male')).toBe('Поїв');
    expect(eventLabel(uk, 'action.food', 'female')).toBe('Поїла');

    const be = await tFor('be');
    expect(eventLabel(be, 'action.poop', 'male')).toBe('Пакакаў');
    expect(eventLabel(be, 'action.poop', 'female')).toBe('Пакакала');
  });

  it('языки без гендерных вариантов (en/de): берёт базовый ключ', async () => {
    const en = await tFor('en');
    expect(eventLabel(en, 'action.food', 'male')).toBe('Ate');
    expect(eventLabel(en, 'action.food', 'female')).toBe('Ate');

    const de = await tFor('de');
    expect(eventLabel(de, 'action.poop', 'female')).toBe('Gekackt');
  });

  it('записи без гендерных форм (hairball): базовый ключ при любом поле', async () => {
    const t = await tFor('ru');

    expect(eventLabel(t, 'action.hairball', 'male')).toBe('Паста');
    expect(eventLabel(t, 'action.hairball', 'female')).toBe('Паста');
    expect(eventLabel(t, 'action.hairball', 'unknown')).toBe('Паста');
  });
});
