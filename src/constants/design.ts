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

export const NOTE_META = {
  emoji: '📝',
  main: Design.action.note.main,
  soft: Design.action.note.soft,
} as const;
