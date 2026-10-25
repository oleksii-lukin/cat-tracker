// Детерминизм: язык устройства в тестах всегда "ru",
// чтобы i18n-вызовы (в т.ч. сид пресетов в миграции) были предсказуемы.
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'ru' }],
}));

// При первом обращении к Modal в jest react-native-css роняет циклический
// импорт (react-native → Modal → LogBox → Image → react-native-css).
// Подменяем Modal на лёгкую заглушку с семантикой visible.
jest.mock('react-native/Libraries/Modal/Modal', () => ({
  __esModule: true,
  default: ({ visible, children }: { visible?: boolean; children?: unknown }) =>
    visible === false ? null : children,
}));
