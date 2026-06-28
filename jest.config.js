module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  testTimeout: 30000,
  // Limit parallelism so MongoDB connections don't exhaust the local server.
  // 34 suites × (full parallel) = too many simultaneous connections;
  // 4 workers keeps total concurrent connections well within MongoDB's default limit.
  maxWorkers: 4,
  testPathIgnorePatterns: [
    '/node_modules/',
    'formatters\\.test\\.js$',
    '/backend/backend/',   // nested duplicate of source tree — not a test root
    '/frontend/test/',     // frontend tests run via Vitest, not Jest
  ],
  silent: false,
};
