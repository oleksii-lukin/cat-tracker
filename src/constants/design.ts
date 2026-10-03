export const Design = {
  colors: {
    background: '#FFF8F3',
    card: '#FFFFFF',
    surfaceLow: '#FCF2E8',
    surfaceContainer: '#F6ECE3',
    surfaceHigh: '#F0E7DD',
    text: '#1F1B15',
    textSecondary: '#56423C',
    outline: '#8A726A',
    outlineVariant: '#DDC0B7',
    primary: '#9D3E1A',
    primaryFixed: '#FFDBCF',
    onPrimaryFixed: '#390C00',
  },
  action: {
    food: { main: '#D96B43', soft: '#FBEBE4' },
    pee: { main: '#2B8A8D', soft: '#E5F4F4' },
    poop: { main: '#D9933D', soft: '#FAF0DF' },
    note: { main: '#7C6DAF', soft: '#EFEBFA' },
  },
  radius: {
    card: 16,
    sheet: 24,
    chip: 999,
  },
} as const;

export const CAT_COLORS = [
  '#D96B43',
  '#2B8A8D',
  '#D9933D',
  '#7C6DAF',
  '#43997A',
  '#C45C6A',
  '#5B7DB1',
  '#8A6D3B',
] as const;

export const ACTION_META: Record<
  'poop' | 'pee' | 'food',
  { label: string; emoji: string; main: string; soft: string }
> = {
  food: { label: 'Поела', emoji: '🍽', main: Design.action.food.main, soft: Design.action.food.soft },
  pee: { label: 'Пописяла', emoji: '💧', main: Design.action.pee.main, soft: Design.action.pee.soft },
  poop: { label: 'Покакала', emoji: '🐾', main: Design.action.poop.main, soft: Design.action.poop.soft },
};

export const NOTE_META = {
  label: 'Заметка',
  emoji: '📝',
  main: Design.action.note.main,
  soft: Design.action.note.soft,
} as const;

export const STOOL_LABELS: Record<string, string> = {
  normal: 'Норма',
  hard: 'Тугой-сухой',
  liquid: 'Жидкий',
  unusual: 'Необычный',
};

export const PEE_VOLUME_LABELS: Record<string, string> = {
  low: 'Мало',
  normal: 'Норма',
  high: 'Много',
};

export const FEED_UNIT_LABELS: Record<string, string> = {
  spoon: 'лож.',
  gram: 'г',
};
