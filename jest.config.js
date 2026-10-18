// https://docs.expo.dev/guides/jest/
const path = require('path');

module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/\\.expo/',
    '/e2e/',
    '<rootDir>/components/ui/',
    // helper для тестов БД, а не тестовое сьюит
    '<rootDir>/src/db/__tests__/test-db\\.ts$',
  ],
};
