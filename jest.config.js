module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  testTimeout: 30000,
  // Run tests serially to avoid connection pool conflicts across suites
  runInBand: true,
  // Suppress verbose logs during test runs
  silent: false,
};
