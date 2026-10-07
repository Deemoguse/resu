import { describe, expect, it, vi } from 'vitest'
import { Flow, Result } from '../../src/namespaces/index'
import { Emitter } from '../../src/classes/emitter'
import { Result as ResultClass } from '../../src/classes/result'
import { ResultEmitterSubscribe } from '../../src/operations/result-emitter-subscribe'
import { ResultEmitterUnsubscribe } from '../../src/operations/result-emitter-unsubscribe'
import { expectOkResult, expectResult } from './helpers/result-assertions'

describe('Result.Emitter subscriptions', () => {
	it.each([
		{ status: 'ok', make: Result.Ok },
		{ status: 'error', make: Result.Error },
	] as const)('delivers the original frozen $status result synchronously to all subscribers', ({ status, make }) => {
		const first = vi.fn((result: Result.Any) => {
			expect(Object.isFrozen(result)).toBe(true)
		})
		const second = vi.fn()
		Result.Emitter.Subscribe(first)
		Result.Emitter.Subscribe(second)
		const data = { nested: { count: 1 } }
		const input = make({ tag: 'Observed', data })
		expect(first).toHaveBeenCalledExactlyOnceWith(input, expect.any(Function))
		expect(second).toHaveBeenCalledExactlyOnceWith(input, expect.any(Function))
		expectResult(first.mock.calls[0]?.[0], { status, tag: 'Observed', data })
		expect(second.mock.calls[0]?.[0]).toBe(input)
		expect(input.data).toBe(data)
		expect(input.data.nested).toBe(data.nested)
	})

	it('protects result fields while sharing payload changes with later subscribers', () => {
		const data = { nested: { count: 1 } }
		const fieldWrites: boolean[] = []
		const second = vi.fn()
		Result.Emitter.Subscribe((result) => {
			fieldWrites.push(Reflect.set(result, 'status', 'error'))
			fieldWrites.push(Reflect.set(result, 'tag', 'Changed'))
			fieldWrites.push(Reflect.set(result, 'data', {}))
			const payload = result.data as typeof data
			payload.nested.count = 2
		})
		Result.Emitter.Subscribe(second)
		const input = Result.Ok({ tag: 'Original', data })
		expect(fieldWrites).toEqual([false, false, false])
		expect(second).toHaveBeenCalledExactlyOnceWith(input, expect.any(Function))
		expectOkResult(input, { tag: 'Original', data: { nested: { count: 2 } } })
		expect(input.data).toBe(data)
	})

	it('starts observing at subscription time without replaying earlier results', () => {
		Result.Ok({ data: 'before' })
		const listener = vi.fn()
		const off = Result.Emitter.Subscribe(listener)
		expect(listener).not.toHaveBeenCalled()
		const success = Result.Ok({ data: 1 })
		const failure = Result.Error({ data: 2 })
		expect(listener.mock.calls).toEqual([[success, off], [failure, off]])
	})

	it('preserves function payload identity', () => {
		const listener = vi.fn()
		const off = Result.Emitter.Subscribe(listener)
		const data = () => 1
		const input = Result.Ok({ data })
		expect(listener).toHaveBeenCalledExactlyOnceWith(input, off)
		expect(input.data).toBe(data)
	})

	it('allows consumers to filter results in the callback', () => {
		const errors = vi.fn()
		Result.Emitter.Subscribe((result) => {
			if (result.status === 'error') errors(result)
		})
		Result.Ok({ data: 1 })
		const failure = Result.Error({ tag: 'Failure', data: 2 })
		expect(errors).toHaveBeenCalledExactlyOnceWith(failure)
	})

	it('passes the returned unsubscribe function to the callback', () => {
		const listener = vi.fn()
		const off = Result.Emitter.Subscribe(listener)
		const input = Result.Ok()
		expect(listener).toHaveBeenCalledExactlyOnceWith(input, off)
	})

	it('supports self-unsubscription through the callback argument', () => {
		const listener = vi.fn((_result: Result.Any, off: () => void) => off())
		const off = Result.Emitter.Subscribe(listener)
		const first = Result.Ok({ data: 1 })
		Result.Error({ data: 2 })
		expect(listener).toHaveBeenCalledExactlyOnceWith(first, off)
	})

	it('lets consumers unsubscribe on the first matching result before creating a nested result', () => {
		const errors = vi.fn()
		Result.Emitter.Subscribe((result, off) => {
			if (result.status !== 'error') return
			off()
			errors(result)
			Result.Error({ tag: 'Nested' })
		})
		Result.Ok()
		const failure = Result.Error({ tag: 'Failure' })
		Result.Error({ tag: 'Later' })
		expect(errors).toHaveBeenCalledExactlyOnceWith(failure)
	})

	it('makes unsubscribe idempotent and preserves other subscribers', () => {
		const removed = vi.fn()
		const remaining = vi.fn()
		const off = Result.Emitter.Subscribe(removed)
		const remainingOff = Result.Emitter.Subscribe(remaining)
		off()
		off()
		const input = Result.Ok({ data: 1 })
		expect(removed).not.toHaveBeenCalled()
		expect(remaining).toHaveBeenCalledExactlyOnceWith(input, remainingOff)
	})

	it('removes a subscriber by callback identity and ignores unknown callbacks', () => {
		const removed = vi.fn()
		const remaining = vi.fn()
		Result.Emitter.Subscribe(removed)
		const off = Result.Emitter.Subscribe(remaining)
		Result.Emitter.Unsubscribe(vi.fn())
		Result.Emitter.Unsubscribe(removed)
		const input = Result.Ok({ data: 1 })
		expect(removed).not.toHaveBeenCalled()
		expect(remaining).toHaveBeenCalledExactlyOnceWith(input, off)
	})

	it('keeps one subscription for a callback and passes the latest unsubscribe function', () => {
		const listener = vi.fn()
		const originalOff = Result.Emitter.Subscribe(listener)
		const currentOff = Result.Emitter.Subscribe(listener)
		const first = Result.Ok()
		const second = Result.Error()
		expect(listener.mock.calls).toEqual([[first, currentOff], [second, currentOff]])
		expect(currentOff).not.toBe(originalOff)
		originalOff()
		currentOff()
		Result.Ok()
		expect(listener).toHaveBeenCalledTimes(2)
	})

	it('allows a removed callback to subscribe again', () => {
		const listener = vi.fn()
		Result.Emitter.Subscribe(listener)()
		Result.Ok({ data: 'hidden' })
		const off = Result.Emitter.Subscribe(listener)
		const input = Result.Ok({ data: 'visible' })
		expect(listener).toHaveBeenCalledExactlyOnceWith(input, off)
	})

	it('shares subscribers between namespace, direct operations, and the emitter', () => {
		const direct = vi.fn()
		const shared = vi.fn()
		const directOff = ResultEmitterSubscribe(direct)
		const sharedOff = Emitter.subscribe(shared)
		const first = Result.Ok({ data: 1 })
		expect(direct).toHaveBeenCalledExactlyOnceWith(first, directOff)
		expect(shared).toHaveBeenCalledExactlyOnceWith(first, sharedOff)
		Result.Emitter.Unsubscribe(direct)
		ResultEmitterUnsubscribe(shared)
		Result.Ok({ data: 2 })
		expect(direct).toHaveBeenCalledTimes(1)
		expect(shared).toHaveBeenCalledTimes(1)
	})
})

describe('Result.Emitter delivery', () => {
	it('calls subscribers in registration order', () => {
		const order: string[] = []
		Result.Emitter.Subscribe(() => order.push('first'))
		Result.Emitter.Subscribe(() => order.push('second'))
		Result.Ok()
		expect(order).toEqual(['first', 'second'])
	})

	it('starts notifying subscriptions added during delivery with the next result', () => {
		const late = vi.fn()
		Result.Emitter.Subscribe((_result, off) => {
			off()
			Result.Emitter.Subscribe(late)
		})
		Result.Ok({ tag: 'Current' })
		expect(late).not.toHaveBeenCalled()
		const next = Result.Error({ tag: 'Next' })
		expect(late).toHaveBeenCalledExactlyOnceWith(next, expect.any(Function))
	})

	it('still notifies subscribers removed after the current delivery has started', () => {
		const removed = vi.fn()
		Result.Emitter.Subscribe(() => Result.Emitter.Unsubscribe(removed))
		const off = Result.Emitter.Subscribe(removed)
		const current = Result.Ok()
		Result.Error()
		expect(removed).toHaveBeenCalledExactlyOnceWith(current, off)
	})

	it('does not repeat the current delivery when a subscriber removes and registers itself again', () => {
		const listener = vi.fn((_result: Result.Any, off: () => void) => {
			// Bound re-entry so a live-collection regression cannot loop indefinitely.
			if (listener.mock.calls.length === 1) {
				off()
				Result.Emitter.Subscribe(listener)
			}
		})
		Result.Emitter.Subscribe(listener)
		const first = Result.Ok()
		expect(listener).toHaveBeenCalledTimes(1)
		const second = Result.Error()
		expect(listener.mock.calls.map(([result]) => result)).toEqual([first, second])
	})

	it('logs synchronous callback exceptions and continues delivery without creating service results', () => {
		const log = vi.spyOn(console, 'error').mockImplementation(() => {})
		const failure = new Error('subscriber failed')
		const broken = vi.fn(() => { throw failure })
		const healthy = vi.fn()
		const brokenOff = Result.Emitter.Subscribe(broken)
		const healthyOff = Result.Emitter.Subscribe(healthy)
		let input: Result.Any | undefined
		expect(() => { input = Result.Ok({ tag: 'Observed' }) }).not.toThrow()
		expect(broken).toHaveBeenCalledExactlyOnceWith(input, brokenOff)
		expect(healthy).toHaveBeenCalledExactlyOnceWith(input, healthyOff)
		expect(log).toHaveBeenCalledExactlyOnceWith('Result Emitter Subscriber Execution Error:', failure)
	})

	it('ignores callback return values, including error results with emission suppressed', () => {
		const log = vi.spyOn(console, 'error').mockImplementation(() => {})
		const returned = Result.Error({ tag: 'Returned', emit: false })
		const listener = vi.fn(() => returned)
		const other = vi.fn()
		const off = Result.Emitter.Subscribe(listener)
		const otherOff = Result.Emitter.Subscribe(other)
		const input = Result.Ok()
		expect(listener).toHaveBeenCalledExactlyOnceWith(input, off)
		expect(other).toHaveBeenCalledExactlyOnceWith(input, otherOff)
		expect(log).not.toHaveBeenCalled()
	})

	it('does not await returned promises before notifying the next subscriber', async () => {
		const order: string[] = []
		const completed: Promise<void>[] = []
		Result.Emitter.Subscribe(() => {
			order.push('started')
			completed.push(Promise.resolve().then(() => { order.push('completed') }))
			return completed[0]
		})
		Result.Emitter.Subscribe(() => { order.push('next') })
		Result.Ok()
		expect(order).toEqual(['started', 'next'])
		await Promise.all(completed)
		expect(order).toEqual(['started', 'next', 'completed'])
	})
})

describe('Result creation events', () => {
	it.each([
		{ status: 'ok', make: Result.Ok },
		{ status: 'error', make: Result.Error },
	] as const)('emits $status by default and with emit:true, but suppresses emit:false', ({ make }) => {
		const listener = vi.fn()
		const off = Result.Emitter.Subscribe(listener)
		make({ data: 'hidden', emit: false })
		const defaultResult = make({ data: 'default' })
		const explicitResult = make({ data: 'explicit', emit: true })
		expect(listener.mock.calls).toEqual([[defaultResult, off], [explicitResult, off]])
	})

	it('observes direct Result construction', () => {
		const listener = vi.fn()
		const off = Result.Emitter.Subscribe(listener)
		const input = new ResultClass({ status: 'error', tag: 'Direct', data: 1 })
		expect(listener).toHaveBeenCalledExactlyOnceWith(input, off)
	})

	it('observes conversion results without modifying the source', () => {
		const source = Result.Error({ tag: 'Failure', data: 1 })
		const listener = vi.fn()
		const off = Result.Emitter.Subscribe(listener)
		const converted = Result.OkFrom(source)
		expect(listener).toHaveBeenCalledExactlyOnceWith(converted, off)
		expectOkResult(converted, { tag: 'Failure', data: 1 })
		expect(source.status).toBe('error')
	})

	it('lets consumers suppress nested results explicitly', () => {
		const listener = vi.fn(() => {
			// Bound re-entry so a regression fails without overflowing the stack.
			if (listener.mock.calls.length === 1) Result.Error({ data: 'nested', emit: false })
		})
		const off = Result.Emitter.Subscribe(listener)
		const input = Result.Ok({ data: 'outer' })
		expect(listener).toHaveBeenCalledExactlyOnceWith(input, off)
	})

	it('delivers nested results when the consumer leaves emission enabled', () => {
		const seen: Result.Any[] = []
		let nested: Result.Any | undefined
		Result.Emitter.Subscribe((result) => {
			seen.push(result)
			if (result.tag === 'Outer') nested = Result.Error({ tag: 'Nested' })
		})
		const outer = Result.Ok({ tag: 'Outer' })
		expect(seen).toEqual([outer, nested])
		expectResult(nested, { status: 'error', tag: 'Nested', data: null })
	})

	it('does not emit a late AbortError after an operation has completed', async () => {
		const errors = vi.fn()
		Result.Emitter.Subscribe((result) => {
			if (result.status === 'error') errors(result)
		})
		const controller = new AbortController()
		await Flow.Try.Async({ signal: controller.signal, try: () => 1 })
		controller.abort()
		expect(errors).not.toHaveBeenCalled()
	})
})
