module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
    rootDir: '../',
    transform: {
      '^.+\\.ts$': ['ts-jest', {
        tsconfig: './config/tsconfig.json'
      }]
    }
  };