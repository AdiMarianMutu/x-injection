import type { Config } from 'jest';

const config: Config = {
  rootDir: '../',
  moduleFileExtensions: ['ts', 'json', 'js'],
  setupFiles: ['./tests/setup/mocks.ts'],
  testTimeout: 5000,
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  bail: 1,
  testRegex: '.*\\.test\\.ts$',
  notify: false,
  collectCoverage: true,
  coverageDirectory: './coverage',
  collectCoverageFrom: ['./src/core/**/*.ts'],
  coveragePathIgnorePatterns: ['index.ts', 'constants.ts'],
  coverageThreshold: {
    global: {
      branches: 80, // The number of the branches of the control structures, like if-then, that have been executed.
      functions: 80, // The number of functions that have been called.
      lines: 80, // The number of lines of source code that have been tested. a Line can have multiply statements e.g. const a = 1; b = 2;
      statements: 80, // The number of statements that have been executed.
    },
  },
};

export default config;
