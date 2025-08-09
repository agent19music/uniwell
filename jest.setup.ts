import '@testing-library/jest-native/extend-expect'
import { jest } from '@jest/globals'

// Use modern fake timers for precise control in async timing tests
jest.useFakeTimers({ now: Date.now() })

// Silence noisy console during tests; surface errors
const originalError = console.error
console.error = (...args: any[]) => {
  // Allow React act warnings to show; silence non-critical noise if needed
  originalError.apply(console, args)
}
