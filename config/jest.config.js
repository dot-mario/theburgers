module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
    rootDir: '../',
    globals: {
      'ts-jest': {
        tsconfig: './config/tsconfig.json'
      }
    }
  };