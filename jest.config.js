module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  testTimeout: 30000,
  // Force Jest to exit after all tests complete — prevents CI hangs from leaked Mongoose connections
  forceExit: true,
  // Log open handles that prevent Jest from exiting (useful for debugging leaks in CI)
  detectOpenHandles: true,
  // Exclude Vitest-authored frontend tests and ESM files that Jest (CommonJS) cannot parse.
  // formatters.test.js uses `import ... from 'vitest'` — must be excluded from Jest collection.
  testPathIgnorePatterns: [
    '/node_modules/',
    '/frontend/',
    '/src/',
    'formatters\\.test\\.js$',
    '\\.vitest\\.',
  ],
  // Suppress verbose logs during test runs
  silent: false,
};
