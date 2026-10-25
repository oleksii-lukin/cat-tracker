import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { AppProvider } from '@/context/app-context';
import { ReloadableSQLiteProvider } from '@/context/reload-context';
import { migrateDbIfNeeded } from '@/db/migrate';
import '@/src/global.css';

const LIGHT_ONLY = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFF8F3',
    card: '#FFF8F3',
    text: '#1F1B15',
    primary: '#9D3E1A',
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <GluestackUIProvider mode={colorScheme === 'dark' ? 'dark' : 'light'}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : LIGHT_ONLY}>
        <ReloadableSQLiteProvider databaseName="cat-tracker.db" onInit={migrateDbIfNeeded}>
          <AppProvider>
            <KeyboardProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              />
            </KeyboardProvider>
          </AppProvider>
        </ReloadableSQLiteProvider>
      </ThemeProvider>
    </GluestackUIProvider>
  );
}
