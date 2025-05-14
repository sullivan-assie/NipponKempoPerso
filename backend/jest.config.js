module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: ['**/*.js'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/coverage/',
    'jest.config.js',
  ],
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
};