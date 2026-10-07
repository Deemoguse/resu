import { afterEach, vi } from 'vitest'
import { Emitter } from '../../src/classes/emitter'

// The shared emitter must not carry subscriptions between tests.
afterEach(() => {
	for (const callback of Emitter.subscribers.keys()) Emitter.unsubscribe(callback)
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
	vi.useRealTimers()
})
