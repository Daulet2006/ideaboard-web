const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.{js,jsx}'],
  clearMocks: true,
  restoreMocks: true,
}

module.exports = createJestConfig(customJestConfig)

