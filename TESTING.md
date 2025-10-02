# Testing Documentation

## Overview

This document provides a comprehensive guide to the testing strategy and implementation for the ChatMind application. The testing suite covers all aspects of the application including server-side services, client-side components, integration tests, and end-to-end tests.

## Test Structure

```
├── server/
│   └── __tests__/
│       ├── services/          # Unit tests for server services
│       ├── routes/            # Unit tests for API routes
│       ├── middleware/        # Unit tests for middleware
│       ├── integration/       # Integration tests
│       └── setup.ts           # Test setup configuration
├── client/
│   └── src/
│       └── __tests__/
│           ├── components/    # Component tests
│           ├── hooks/         # Hook tests
│           └── e2e/          # End-to-end tests
├── scripts/
│   └── test-runner.js         # Custom test runner
└── jest.config.js            # Jest configuration
```

## Test Categories

### 1. Server-Side Tests

#### Services Tests
- **compliance.test.ts**: Tests for ComplianceService
  - Compliance rules validation
  - Data protection checks
  - Financial compliance verification
  - Security event logging
  - Audit logging
  - Security middleware
  - Compliance reporting

- **aiAnalysis.test.ts**: Tests for AIAnalysisService
  - Trade pattern analysis
  - Risk analysis
  - Performance analysis
  - AI coaching
  - Report generation

- **csvParser.test.ts**: Tests for CSVParserService
  - Zerodha format parsing
  - ICICI Direct format parsing
  - Upstox format parsing
  - Interactive Brokers format parsing
  - Generic CSV parsing
  - Data validation
  - Error handling
  - Trade matching

#### Routes Tests
- **main.test.ts**: Tests for main API routes
  - User-related endpoints
  - Trade management (CRUD)
  - CSV upload
  - AI analysis generation
  - CSV template generation
  - Feedback management

- **auth.test.ts**: Tests for authentication routes
  - User registration
  - User login
  - User logout
  - Session management
  - Password reset
  - Token validation

- **compliance.test.ts**: Tests for compliance routes
  - Compliance checks
  - Rule management
  - Audit trail access
  - Compliance reports
  - Security event logging

- **security.test.ts**: Tests for security routes
  - Security monitoring
  - Threat detection
  - Access control
  - Rate limiting
  - Security reports

#### Middleware Tests
- **compliance.test.ts**: Tests for compliance middleware
  - Request validation
  - Rule enforcement
  - Data protection
  - Audit logging

- **security.test.ts**: Tests for security middleware
  - Authentication checks
  - Authorization checks
  - Rate limiting
  - Input sanitization
  - Security headers

- **auth.test.ts**: Tests for authentication middleware
  - Session validation
  - Token verification
  - User authentication
  - Role-based access

### 2. Client-Side Tests

#### Component Tests
- **TradeJournal.test.tsx**: Tests for TradeJournal component
  - Trade display
  - Trade creation
  - Trade editing
  - Trade deletion
  - CSV upload
  - Data export
  - Filtering and sorting
  - Pagination

- **Dashboard.test.tsx**: Tests for Dashboard component
  - Metrics display
  - Chart rendering
  - Recent trades table
  - Performance indicators
  - User statistics
  - Data refresh

- **Analysis.test.tsx**: Tests for Analysis component
  - AI analysis display
  - Trade patterns
  - Recommendations
  - Performance metrics
  - Chart interactions
  - Report generation

#### Hook Tests
- **useTrades.test.ts**: Tests for useTrades hook
  - Data fetching
  - Data caching
  - Error handling
  - Loading states
  - CRUD operations
  - Real-time updates

- **useAIAnalysis.test.ts**: Tests for useAIAnalysis hook
  - AI analysis fetching
  - Analysis generation
  - Pattern recognition
  - Recommendation handling
  - Report creation

- **useUsers.test.ts**: Tests for useUsers hook
  - User data fetching
  - User statistics
  - User management
  - Role handling
  - Authentication state

### 3. Integration Tests

- **api.test.ts**: API integration tests
  - Full API workflow
  - Data consistency
  - Error handling
  - Performance testing
  - Load testing

- **auth.test.ts**: Authentication integration tests
  - Full authentication flow
  - Session management
  - Token handling
  - Security validation

- **compliance.test.ts**: Compliance integration tests
  - Compliance workflow
  - Rule enforcement
  - Audit trail
  - Reporting

- **security.test.ts**: Security integration tests
  - Security workflow
  - Threat detection
  - Access control
  - Incident response

### 4. End-to-End Tests

- **app.test.tsx**: Full application tests
  - Navigation flow
  - User journey testing
  - Cross-page interactions
  - Data consistency
  - Error handling
  - Responsive design
  - Accessibility
  - Performance

## Test Configuration

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/server', '<rootDir>/client'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
  collectCoverageFrom: [
    'server/**/*.ts',
    'shared/**/*.ts',
    '!server/**/*.d.ts',
    '!shared/**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/server/__tests__/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
```

### Test Setup (`server/__tests__/setup.ts`)

```typescript
import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'sqlite:///:memory:';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.JWT_SECRET = 'test-jwt-secret';

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set up global test utilities
global.beforeEach(() => {
  jest.clearAllMocks();
});

global.afterEach(() => {
  jest.clearAllMocks();
});

// Mock file system for testing
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

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
```

## Running Tests

### Individual Test Files

```bash
# Run server tests
npm test -- server/__tests__/services/compliance.test.ts
npm test -- server/__tests__/routes/main.test.ts
npm test -- server/__tests__/middleware/auth.test.ts

# Run client tests
npm test -- client/src/__tests__/components/TradeJournal.test.tsx
npm test -- client/src/__tests__/hooks/useTrades.test.ts

# Run integration tests
npm test -- server/__tests__/integration/api.test.ts

# Run E2E tests
npm test -- client/src/__tests__/e2e/app.test.tsx
```

### Test Categories

```bash
# Run all server tests
npm test -- --testPathPattern=server/__tests__

# Run all client tests
npm test -- --testPathPattern=client/src/__tests__

# Run all integration tests
npm test -- --testPathPattern=integration

# Run all E2E tests
npm test -- --testPathPattern=e2e
```

### Comprehensive Test Suite

```bash
# Run all tests with coverage
npm test -- --coverage

# Run all tests with verbose output
npm test -- --verbose

# Run tests and watch for changes
npm test -- --watch

# Run tests with custom test runner
node scripts/test-runner.js
```

### Test Runner Script

The custom test runner (`scripts/test-runner.js`) provides:

1. **Organized Test Execution**: Runs tests by category (server, client, integration, E2E)
2. **Detailed Reporting**: Provides comprehensive test results with timing
3. **HTML Report Generation**: Creates a visual HTML report
4. **Error Handling**: Gracefully handles test failures
5. **Performance Monitoring**: Tracks test execution times

Usage:
```bash
node scripts/test-runner.js
```

## Test Coverage

### Coverage Targets

- **Server Coverage**: 90%+
- **Client Coverage**: 85%+
- **Integration Coverage**: 80%+
- **E2E Coverage**: 75%+

### Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- `lcov-report/`: HTML coverage report
- `coverage/lcov.info`: LCOV format report
- `coverage/coverage-final.json`: JSON coverage data

### Coverage Exclusions

The following files are excluded from coverage:
- Type definition files (`*.d.ts`)
- Node modules (`**/node_modules/**`)
- Test files (`**/__tests__/**`)
- Configuration files

## Best Practices

### 1. Test Organization

- **Descriptive Test Names**: Use clear, descriptive test names that explain what is being tested
- **Test Grouping**: Group related tests using `describe` blocks
- **Test Isolation**: Each test should be independent and not rely on other tests
- **Setup and Teardown**: Use `beforeEach` and `afterEach` for test setup and cleanup

### 2. Mocking Strategy

- **Mock External Dependencies**: Mock database, API calls, and external services
- **Mock File System**: Mock file operations for predictable test behavior
- **Mock Environment Variables**: Use test-specific environment variables
- **Mock Console**: Reduce test noise by mocking console methods

### 3. Test Data

- **Realistic Test Data**: Use realistic test data that matches production scenarios
- **Edge Cases**: Include edge cases and error conditions
- **Data Variations**: Test with different data types and formats
- **Data Cleanup**: Clean up test data after each test

### 4. Assertion Strategy

- **Specific Assertions**: Use specific assertions rather than generic ones
- **Error Assertions**: Test both success and error cases
- **Async Handling**: Properly handle asynchronous operations
- **State Verification**: Verify both the action and the resulting state

### 5. Performance Testing

- **Test Performance**: Monitor test execution times
- **Load Testing**: Test with large datasets
- **Memory Testing**: Check for memory leaks
- **Concurrent Testing**: Test concurrent operations

## Troubleshooting

### Common Issues

1. **Test Timeout**: Increase test timeout in Jest configuration
2. **Mock Failures**: Ensure all dependencies are properly mocked
3. **Async Issues**: Use proper async/await or Promise handling
4. **Import Issues**: Check module resolution and imports
5. **Environment Issues**: Verify environment variables and setup

### Debugging Tests

```bash
# Run tests with debug output
npm test -- --verbose --detectOpenHandles --forceExit

# Run specific test with debugging
npm test -- --testNamePattern="specific test name" --verbose

# Run tests with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Test Maintenance

1. **Regular Updates**: Keep tests updated with code changes
2. **Test Reviews**: Review tests as part of code review process
3. **Test Documentation**: Document complex test scenarios
4. **Test Refactoring**: Refactor tests when refactoring code
5. **Test Monitoring**: Monitor test coverage and flakiness

## Continuous Integration

### GitHub Actions

The test suite is integrated with GitHub Actions for continuous testing:

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - run: node scripts/test-runner.js
```

### Test Reporting

- **GitHub Actions**: Test results are displayed in GitHub Actions
- **Coverage Reports**: Coverage reports are uploaded as artifacts
- **HTML Reports**: HTML reports are generated for detailed analysis
- **Notifications**: Failed tests trigger notifications

## Future Enhancements

### Planned Improvements

1. **Visual Testing**: Add visual regression testing
2. **Performance Testing**: Implement comprehensive performance testing
3. **Security Testing**: Add security-focused testing
4. **Accessibility Testing**: Implement accessibility testing
5. **Contract Testing**: Add API contract testing

### Test Automation

1. **Automated Test Generation**: Explore AI-powered test generation
2. **Test Data Generation**: Automated test data generation
3. **Test Maintenance**: Automated test maintenance tools
4. **Test Parallelization**: Improved test parallelization
5. **Test Analytics**: Test analytics and insights

## Conclusion

This comprehensive testing strategy ensures the ChatMind application is thoroughly tested across all layers, from individual components to full end-to-end workflows. The testing suite provides confidence in code quality, helps catch bugs early, and supports continuous delivery practices.
