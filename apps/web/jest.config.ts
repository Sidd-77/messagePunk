import type { Config } from '@jest/types'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig: Config.InitialOptions = {
  testEnvironment: 'jsdom',
  // If you have no tests, this will make Jest pass without error
  testMatch: ['<rootDir>/__tests__/**/*.test.[jt]s?(x)', '<rootDir>/__tests__/**/*.spec.[jt]s?(x)'],
  preset: 'ts-jest',
}

// createJestConfig is exported this way to ensure the next.config.js 
// can load the custom config, which is async
export default createJestConfig(customJestConfig)