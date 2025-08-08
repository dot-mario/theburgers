module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
    rootDir: '../',
    transform: {
      '^.+\\.ts$': ['ts-jest', {
        tsconfig: './config/tsconfig.json'
      }]
    },
    collectCoverageFrom: [
      'src/**/*.ts',
      '!src/**/*.d.ts',
      '!src/types/**',
      '!src/web/public/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts']
  };