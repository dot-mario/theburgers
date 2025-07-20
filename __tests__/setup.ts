// Test setup file
import { jest } from '@jest/globals';

// Global test configuration
global.console = {
  ...console,
  // Mock console methods to reduce noise in tests
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
};

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.DISCORD_BOT_TOKEN = 'test-bot-token';
process.env.DISCORD_CHANNEL_ID = 'test-channel-id';
process.env.CHZZK_CHANNEL_ID = 'test-chzzk-channel';

// Global timeout for tests
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});