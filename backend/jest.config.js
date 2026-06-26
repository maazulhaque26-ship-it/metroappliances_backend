module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  testTimeout: 30000,
  // Exclude Vitest-authored frontend tests (formatters.test.js uses ESM
  // `import ... from 'vitest'` which Jest's CommonJS runner cannot parse).
  // These are run by Vitest in the frontend repo, not by Jest here.
  testPathIgnorePatterns: ['/node_modules/', 'formatters\\.test\\.js$'],
  // Suppress verbose logs during test runs
  silent: false,
};
