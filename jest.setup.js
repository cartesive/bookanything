import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock DuckDB WebAssembly
jest.mock('@duckdb/duckdb-wasm', () => ({
  getJsDelivrBundles: jest.fn(),
  selectBundle: jest.fn(),
  AsyncDuckDB: jest.fn(),
  ConsoleLogger: jest.fn(),
}))

// Mock DuckDB Async
jest.mock('duckdb-async', () => ({
  Database: {
    create: jest.fn(),
  },
}))

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  mkdirSync: jest.fn(),
}))

// Mock path module
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}))

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
}

// Global test helpers
global.fetch = jest.fn()

beforeEach(() => {
  fetch.mockClear()
})