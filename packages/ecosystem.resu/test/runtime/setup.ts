import { afterEach, vi } from 'vitest'
import type { Emitter } from '../../src/classes/emitter'

// Each test owns its subscriptions, including browser-like global registries.
afterEach(() => {
	for (const context of [globalThis, Reflect.get(globalThis, 'window') as object | undefined]) {
		if (!context) continue
		const emitters = Reflect.get(context, '__RESU_EMITTERS__') as Set<Emitter> | undefined
		if (!emitters) continue
		for (const emitter of emitters) emitter.offAll()
		emitters.clear()
	}
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
	vi.useRealTimers()
})
