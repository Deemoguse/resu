import { describe, expect, it, vi } from 'vitest'
import { Emitter } from '../../src/classes/emitter'
import { Flow, Result } from '../../src/namespaces/index'
import { expectOkResult } from './helpers/result-assertions'

describe('Emitter subscriptions', () => {
	it('delivers the original result synchronously to all subscribers', () => {
		const emitter = new Emitter({})
		const first = vi.fn()
		const second = vi.fn()
		emitter.on(first)
		emitter.on(second)
		const input = Result.Ok({ data: 1 })
		emitter.emit(input)
		expect(first).toHaveBeenCalledExactlyOnceWith(input, expect.any(Function))
		expect(second).toHaveBeenCalledExactlyOnceWith(input, expect.any(Function))
	})

	it('passes the returned unsubscribe function to its handler', () => {
		const emitter = new Emitter({})
		const listener = vi.fn()
		const unsubscribe = emitter.on(listener)
		emitter.emit(Result.Ok({ data: 1 }))
		expect(listener.mock.calls[0]?.[1]).toBe(unsubscribe)
	})

	it('supports self-unsubscription during emission', () => {
		const emitter = new Emitter({})
		const listener = vi.fn((_result: Result.Any, off: () => void) => off())
		emitter.on(listener)
		emitter.emit(Result.Ok({ data: 1 }))
		emitter.emit(Result.Ok({ data: 2 }))
		expect(listener).toHaveBeenCalledTimes(1)
	})

	it('makes unsubscribe idempotent and keeps other listeners', () => {
		const emitter = new Emitter({})
		const removed = vi.fn()
		const remaining = vi.fn()
		const off = emitter.on(removed)
		emitter.on(remaining)
		off()
		off()
		emitter.emit(Result.Ok({ data: 1 }))
		expect(removed).not.toHaveBeenCalled()
		expect(remaining).toHaveBeenCalledTimes(1)
	})

	it('removes a listener by identity', () => {
		const emitter = new Emitter({})
		const listener = vi.fn()
		emitter.on(listener)
		emitter.off(listener)
		emitter.emit(Result.Ok({ data: 1 }))
		expect(listener).not.toHaveBeenCalled()
	})

	it('ignores removal of an unknown listener', () => {
		const emitter = new Emitter({})
		const listener = vi.fn()
		emitter.on(listener)
		emitter.off(vi.fn())
		emitter.emit(Result.Ok({ data: 1 }))
		expect(listener).toHaveBeenCalledTimes(1)
	})

	it('replaces duplicate subscriptions for the same handler', () => {
		const emitter = new Emitter({})
		const listener = vi.fn()
		emitter.on(listener)
		emitter.on(listener)
		emitter.emit(Result.Ok({ data: 1 }))
		expect(listener).toHaveBeenCalledTimes(1)
	})

	it('removes every listener and allows new subscriptions afterwards', () => {
		const emitter = new Emitter({})
		const oldListener = vi.fn()
		const newListener = vi.fn()
		emitter.on(oldListener)
		emitter.offAll()
		emitter.offAll()
		emitter.on(newListener)
		emitter.emit(Result.Ok({ data: 1 }))
		expect(oldListener).not.toHaveBeenCalled()
		expect(newListener).toHaveBeenCalledTimes(1)
	})

	it('keeps subscriptions on different emitter instances independent', () => {
		const first = new Emitter({})
		const second = new Emitter({})
		const listener = vi.fn()
		first.on(listener)
		second.emit(Result.Ok({ data: 1 }))
		expect(listener).not.toHaveBeenCalled()
	})

	it('allows manual emission regardless of default filters', () => {
		const emitter = new Emitter({ emitOk: false })
		const listener = vi.fn()
		emitter.on(listener)
		const input = Result.Ok({ data: 1, emit: false })
		emitter.emit(input)
		expect(listener).toHaveBeenCalledTimes(1)
		expect(listener.mock.calls[0]?.[0]).toBe(input)
	})
})

describe('Result.Emitters registration', () => {
	it('starts observing results only after Add', () => {
		const emitter = new Emitter({ emitOk: true, emitError: true })
		const listener = vi.fn()
		emitter.on(listener)
		Result.Ok({ data: 'before' })
		expect(listener).not.toHaveBeenCalled()
		Result.Emitters.Add(emitter)
		const success = Result.Ok({ data: 1 })
		const failure = Result.Error({ data: 2 })
		expect(listener.mock.calls.map(([result]) => result)).toEqual([success, failure])
	})

	it('registers the same emitter only once', () => {
		const emitter = new Emitter({ emitOk: true })
		const listener = vi.fn()
		emitter.on(listener)
		Result.Emitters.Add(emitter)
		Result.Emitters.Add(emitter)
		Result.Ok({ data: 1 })
		expect(listener).toHaveBeenCalledTimes(1)
	})

	it('notifies multiple registered emitters', () => {
		const first = new Emitter({ emitOk: true })
		const second = new Emitter({ emitOk: true })
		const firstListener = vi.fn()
		const secondListener = vi.fn()
		first.on(firstListener)
		second.on(secondListener)
		Result.Emitters.Add(first)
		Result.Emitters.Add(second)
		Result.Ok({ data: 1 })
		expect(firstListener).toHaveBeenCalledTimes(1)
		expect(secondListener).toHaveBeenCalledTimes(1)
	})

	it('Delete stops automatic and manual delivery to previous listeners', () => {
		const emitter = new Emitter({ emitOk: true })
		const listener = vi.fn()
		emitter.on(listener)
		Result.Emitters.Add(emitter)
		Result.Emitters.Delete(emitter)
		Result.Emitters.Delete(emitter)
		const input = Result.Ok({ data: 1 })
		emitter.emit(input)
		expect(listener).not.toHaveBeenCalled()
	})

	it('Delete preserves other registered emitters', () => {
		const first = new Emitter({ emitOk: true })
		const second = new Emitter({ emitOk: true })
		const listener = vi.fn()
		second.on(listener)
		Result.Emitters.Add(first)
		Result.Emitters.Add(second)
		Result.Emitters.Delete(first)
		Result.Ok({ data: 1 })
		expect(listener).toHaveBeenCalledTimes(1)
	})

	it('ignores Delete for an emitter that was never registered', () => {
		const emitter = new Emitter({})
		const listener = vi.fn()
		emitter.on(listener)
		Result.Emitters.Delete(emitter)
		emitter.emit(Result.Ok({ data: 1 }))
		expect(listener).toHaveBeenCalledTimes(1)
	})

	it('can register a deleted emitter again with a new subscription', () => {
		const emitter = new Emitter({ emitOk: true })
		Result.Emitters.Add(emitter)
		Result.Emitters.Delete(emitter)
		const listener = vi.fn()
		emitter.on(listener)
		Result.Emitters.Add(emitter)
		Result.Ok({ data: 1 })
		expect(listener).toHaveBeenCalledTimes(1)
	})

	it('works without a browser window global', () => {
		vi.stubGlobal('window', undefined)
		const emitter = new Emitter({ emitOk: true })
		const listener = vi.fn()
		emitter.on(listener)
		Result.Emitters.Add(emitter)
		Result.Ok({ data: 1 })
		expect(listener).toHaveBeenCalledTimes(1)
	})

	it('works with a separate browser-like window context', () => {
		vi.stubGlobal('window', {})
		const emitter = new Emitter({ emitOk: true })
		const listener = vi.fn()
		emitter.on(listener)
		Result.Emitters.Add(emitter)
		Result.Ok({ data: 1 })
		expect(listener).toHaveBeenCalledTimes(1)
	})

	it('publishes a frozen result to observers', () => {
		const emitter = new Emitter({ emitOk: true })
		const frozenAtDelivery: boolean[] = []
		emitter.on((result) => frozenAtDelivery.push(Object.isFrozen(result)))
		Result.Emitters.Add(emitter)
		Result.Ok({ data: 1 })
		expect(frozenAtDelivery).toEqual([true])
	})
})

describe('automatic emission filters', () => {
	it.each([
		{ label: 'no options', options: {}, expected: [] },
		{ label: 'ok only', options: { emitOk: true }, expected: ['ok'] },
		{ label: 'error only', options: { emitError: true }, expected: ['error'] },
		{ label: 'both statuses', options: { emitOk: true, emitError: true }, expected: ['ok', 'error'] },
		{ label: 'both disabled', options: { emitOk: false, emitError: false }, expected: [] },
	])('applies $label', ({ options, expected }) => {
		const emitter = new Emitter(options)
		const listener = vi.fn()
		emitter.on(listener)
		Result.Emitters.Add(emitter)
		Result.Ok({ data: 1 })
		Result.Error({ data: 2 })
		expect(listener.mock.calls.map(([result]) => (result as Result.Any).status)).toEqual(expected)
	})

	it('filters each status with its own predicate', () => {
		const emitOk = vi.fn((result: Result.Any) => result.tag === 'Visible')
		const emitError = vi.fn((result: Result.Any) => result.data === 'visible')
		const emitter = new Emitter({ emitOk, emitError })
		const listener = vi.fn()
		emitter.on(listener)
		Result.Emitters.Add(emitter)
		const visibleOk = Result.Ok({ tag: 'Visible', data: 1 })
		Result.Ok({ tag: 'Hidden', data: 2 })
		const visibleError = Result.Error({ data: 'visible' })
		Result.Error({ data: 'hidden' })
		expect(listener.mock.calls.map(([result]) => result)).toEqual([visibleOk, visibleError])
		expect(emitOk).toHaveBeenCalledTimes(2)
		expect(emitError).toHaveBeenCalledTimes(2)
		expect(emitOk).toHaveBeenCalledWith(visibleOk)
		expect(emitError).toHaveBeenCalledWith(visibleError)
	})

	it('emit:true bypasses a disabled predicate', () => {
		const predicate = vi.fn(() => false)
		const emitter = new Emitter({ emitOk: predicate })
		const listener = vi.fn()
		emitter.on(listener)
		Result.Emitters.Add(emitter)
		const input = Result.Ok({ data: 1, emit: true })
		expect(listener).toHaveBeenCalledExactlyOnceWith(input, expect.any(Function))
		expect(predicate).not.toHaveBeenCalled()
	})

	it('emit:false suppresses delivery and predicate evaluation', () => {
		const predicate = vi.fn(() => true)
		const emitter = new Emitter({ emitOk: predicate, emitError: predicate })
		const listener = vi.fn()
		emitter.on(listener)
		Result.Emitters.Add(emitter)
		Result.Ok({ data: 1, emit: false })
		Result.Error({ data: 2, emit: false })
		expect(listener).not.toHaveBeenCalled()
		expect(predicate).not.toHaveBeenCalled()
	})

	it('observes conversion results without modifying the source', () => {
		const source = Result.Error({ tag: 'Failure', data: 1 })
		const emitter = new Emitter({ emitOk: true })
		const listener = vi.fn()
		emitter.on(listener)
		Result.Emitters.Add(emitter)
		const converted = Result.OkFrom(source)
		expect(listener.mock.calls[0]?.[0]).toBe(converted)
		expect(source.status).toBe('error')
		expectOkResult(converted, { tag: 'Failure', data: 1 })
	})

	it('does not emit a late AbortError after an operation has completed', async () => {
		const emitter = new Emitter({ emitError: true })
		const listener = vi.fn()
		emitter.on(listener)
		Result.Emitters.Add(emitter)
		const controller = new AbortController()
		await Flow.Try.Async({ signal: controller.signal, try: () => 1 })
		controller.abort()
		expect(listener).not.toHaveBeenCalled()
	})
})
