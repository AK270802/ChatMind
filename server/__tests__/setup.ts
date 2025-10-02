import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'sqlite:///:memory:';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.JWT_SECRET = 'test-jwt-secret';

// Mock console methods to reduce noise during tests
(global as any).console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set up global test utilities
(global as any).beforeEach(() => {
  jest.clearAllMocks();
});

(global as any).afterEach(() => {
  jest.clearAllMocks();
});

// Mock file system for testing
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs') as any;
  return {
    ...actualFs,
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
  };
});

// Mock database operations
jest.mock('../db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock storage
jest.mock('../storage', () => ({
  storage: {
    getUser: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    getTrades: jest.fn(),
    createTrade: jest.fn(),
    updateTrade: jest.fn(),
    deleteTrade: jest.fn(),
    // Add other storage methods as needed
  },
}));
