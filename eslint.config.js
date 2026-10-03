// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      // Асинхронная загрузка из SQLite при монтировании/смене параметра —
      // стандартный паттерн в RN без фреймворка; правило v7 слишком строгое
      // (нарушает даже шаблон create-expo-app use-color-scheme.web.ts).
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
