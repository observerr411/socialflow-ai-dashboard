require('@testing-library/jest-dom');

// Mock environment variables
process.env.API_KEY = 'test-api-key';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
