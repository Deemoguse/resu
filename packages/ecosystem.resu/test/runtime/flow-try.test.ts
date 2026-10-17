import { describe, expect, it, vi } from 'vitest'
import { Flow, Result } from '../../src/namespaces/index'
import { createDeferred } from './helpers/deferred'
import { expectErrorResult, expectOkResult, expectResult } from './helpers/result-assertions'

describe('Flow.Try.Sync', () => {
	describe('successful execution', () => {
		it('executes the callback immediately and exactly once', () => {
			const operation = vi.fn(() => 5)
			const result = Flow.Try.Sync(operation)
			expect(operation).toHaveBeenCalledExactlyOnceWith()
			expectOkResult(result, { tag: null, data: 5 })
		})

		it('accepts the object form without a catch callback', () => {
			expectOkResult(Flow.Try.Sync({ try: () => 5 }), { tag: null, data: 5 })
		})

		it.each([0, false, '', null])('preserves a falsy return value: %j', (data) => {
			expectOkResult(Flow.Try.Sync(() => data), { tag: null, data })
		})

		it.each([
			{ source: Result.Ok({ tag: 'Ready', data: { id: 1 } }) },
			{ source: Result.Error({ tag: 'Failure', data: { id: 2 } }) },
		])('preserves the returned result fields: $source.status', ({ source }) => {
			const result = Flow.Try.Sync(() => source)
			expectResult(result, { status: source.status, tag: source.tag, data: source.data })
			expect(result).not.toBe(source)
			expect(result.data).toBe(source.data)
		})
	})

	describe('recovery', () => {
		it('does not call catch after success', () => {
			const recover = vi.fn(() => 'fallback')
			Flow.Try.Sync({ try: () => 1, catch: recover })
			expect(recover).not.toHaveBeenCalled()
		})

		it('does not call catch for a returned domain error', () => {
			const recover = vi.fn(() => 'fallback')
			const result = Flow.Try.Sync({
				try: () => Result.Error({ tag: 'Invalid', data: 1 }),
				catch: recover,
			})
			expectErrorResult(result, 'Invalid')
			expect(recover).not.toHaveBeenCalled()
		})

		it('normalizes a recovered plain value', () => {
			const recover = vi.fn(() => 'fallback')
			const result = Flow.Try.Sync({ try: () => { throw new Error('failed') }, catch: recover })
			expectOkResult(result, { tag: null, data: 'fallback' })
			expect(recover).toHaveBeenCalledTimes(1)
		})

		it.each([
			{ recovered: Result.Ok({ tag: 'Recovered', data: 1 }) },
			{ recovered: Result.Error({ tag: 'DomainFailure', data: 2 }) },
		])('preserves a recovered $recovered.status result', ({ recovered }) => {
			const result = Flow.Try.Sync({ try: () => { throw new Error('failed') }, catch: () => recovered })
			expectResult(result, { status: recovered.status, tag: recovered.tag, data: recovered.data })
			expect(result).not.toBe(recovered)
		})

		it('converts an exception from catch into RuntimeError', () => {
			const error = new Error('recovery failed')
			const result = Flow.Try.Sync({
				try: () => { throw new Error('source failed') },
				catch: () => { throw error },
			})
			expect(expectErrorResult(result, 'RuntimeError').data).toBe(error)
		})
	})

	describe('unhandled exceptions', () => {
		it('keeps a thrown Error as the payload', () => {
			const error = new Error('source failed')
			expect(expectErrorResult(Flow.Try.Sync(() => { throw error }), 'RuntimeError').data).toBe(error)
		})

		it('converts a thrown message into an Error', () => {
			const result = Flow.Try.Sync(() => { throw 'source failed' })
			const payload = expectErrorResult(result, 'RuntimeError').data
			expect(payload).toBeInstanceOf(Error)
			expect((payload as Error).message).toBe('source failed')
		})

		it.each([0, false, null, { code: 1 }])('preserves a non-string thrown payload: %j', (error) => {
			expect(expectErrorResult(Flow.Try.Sync(() => { throw error }), 'RuntimeError').data).toBe(error)
		})
	})
})

describe('Flow.Try.Async', () => {
	describe('successful execution', () => {
		it('accepts a synchronous callback and returns a Promise', async () => {
			const operation = vi.fn(() => 5)
			const promise = Flow.Try.Async(operation)
			expect(promise).toBeInstanceOf(Promise)
			expectOkResult(await promise, { tag: null, data: 5 })
			expect(operation).toHaveBeenCalledTimes(1)
		})

		it('awaits an asynchronous callback', async () => {
			const source = createDeferred<number>()
			const promise = Flow.Try.Async(() => source.promise)
			source.resolve(7)
			expectOkResult(await promise, { tag: null, data: 7 })
		})

		it.each([0, false, '', null])('preserves a falsy resolved value: %j', async (data) => {
			expectOkResult(await Flow.Try.Async(async () => data), { tag: null, data })
		})

		it.each([
			{ source: Result.Ok({ tag: 'Ready', data: { id: 1 } }) },
			{ source: Result.Error({ tag: 'Failure', data: { id: 2 } }) },
		])('preserves a resolved $source.status result without nesting', async ({ source }) => {
			const result = await Flow.Try.Async(async () => source)
			expectResult(result, { status: source.status, tag: source.tag, data: source.data })
			expect(result).not.toBe(source)
			expect(result.data).toBe(source.data)
		})
	})

	describe('exceptions and recovery', () => {
		it('converts a synchronous throw into RuntimeError', async () => {
			const error = new Error('source threw')
			const result = await Flow.Try.Async(() => { throw error })
			expect(expectErrorResult(result, 'RuntimeError').data).toBe(error)
		})

		it('converts a rejection into RuntimeError', async () => {
			const error = new Error('source rejected')
			const result = await Flow.Try.Async(() => Promise.reject(error))
			expect(expectErrorResult(result, 'RuntimeError').data).toBe(error)
		})

		it('passes the rejected payload to catch', async () => {
			const error = { code: 'NETWORK' }
			const recover = vi.fn((received: unknown) => received === error ? 'fallback' : 'unexpected')
			const result = await Flow.Try.Async({ try: () => Promise.reject(error), catch: recover })
			expect(recover).toHaveBeenCalledExactlyOnceWith(error)
			expectOkResult(result, { tag: null, data: 'fallback' })
		})

		it('awaits an asynchronous recovery', async () => {
			const result = await Flow.Try.Async({
				try: () => Promise.reject(new Error('source failed')),
				catch: async () => Result.Error({ tag: 'RecoveredError', data: 'offline' }),
			})
			expectResult(result, { status: 'error', tag: 'RecoveredError', data: 'offline' })
		})

		it.each([
			{ label: 'successful value', source: () => 1 },
			{ label: 'domain error', source: () => Result.Error({ tag: 'Invalid', data: 1 }) },
		])('does not call catch for a $label', async ({ source }) => {
			const recover = vi.fn(() => 'fallback')
			await Flow.Try.Async<Result.Any | number, string>({ try: source, catch: recover })
			expect(recover).not.toHaveBeenCalled()
		})

		it('converts a synchronous exception from catch into RuntimeError', async () => {
			const error = new Error('recovery threw')
			const result = await Flow.Try.Async({ try: () => Promise.reject(1), catch: () => { throw error } })
			expect(expectErrorResult(result, 'RuntimeError').data).toBe(error)
		})

		it('converts a rejected catch Promise into RuntimeError', async () => {
			const error = new Error('recovery rejected')
			const result = await Flow.Try.Async({ try: () => Promise.reject(1), catch: () => Promise.reject(error) })
			expect(expectErrorResult(result, 'RuntimeError').data).toBe(error)
		})
	})

	describe('cancellation', () => {
		it('passes the exact signal to try', async () => {
			const controller = new AbortController()
			const operation = vi.fn((signal: AbortSignal) => signal.aborted ? 0 : 1)
			expectOkResult(await Flow.Try.Async({ signal: controller.signal, try: operation }), { tag: null, data: 1 })
			expect(operation).toHaveBeenCalledExactlyOnceWith(controller.signal)
		})

		it('returns AbortError without invoking try or catch for an already aborted signal', async () => {
			const controller = new AbortController()
			controller.abort('cancelled')
			const operation = vi.fn(() => 1)
			const recover = vi.fn(() => 2)
			const result = await Flow.Try.Async({ signal: controller.signal, try: operation, catch: recover })
			expectErrorResult(result, 'AbortError')
			expect(operation).not.toHaveBeenCalled()
			expect(recover).not.toHaveBeenCalled()
		})

		it('returns a Promise even when the signal is already aborted', () => {
			const controller = new AbortController()
			controller.abort()
			expect(Flow.Try.Async({ signal: controller.signal, try: () => 1 })).toBeInstanceOf(Promise)
		})

		it('aborts a pending operation without using the recovery callback', async () => {
			const controller = new AbortController()
			const source = createDeferred<number>()
			const recover = vi.fn(() => 2)
			const promise = Flow.Try.Async({ signal: controller.signal, try: () => source.promise, catch: recover })
			await Promise.resolve()
			controller.abort()
			const result = await promise
			expectErrorResult(result, 'AbortError')
			expect(recover).not.toHaveBeenCalled()
			source.resolve(5)
			await source.promise
			expect(await promise).toBe(result)
		})

		it('does not replace a completed result after a later abort', async () => {
			const controller = new AbortController()
			const promise = Flow.Try.Async({ signal: controller.signal, try: () => 1 })
			const result = await promise
			controller.abort()
			expect(await promise).toBe(result)
			expectOkResult(result, { tag: null, data: 1 })
		})

		it('allows cancellation while asynchronous recovery is pending', async () => {
			const controller = new AbortController()
			const recoveryStarted = createDeferred<void>()
			const recovered = createDeferred<number>()
			const promise = Flow.Try.Async({
				signal: controller.signal,
				try: () => Promise.reject(new Error('source failed')),
				catch: () => {
					recoveryStarted.resolve()
					return recovered.promise
				},
			})

			await recoveryStarted.promise
			controller.abort()
			const result = await promise
			expectErrorResult(result, 'AbortError')
			recovered.resolve(5)
			await recovered.promise
			expect(await promise).toBe(result)
		})

		it('handles a source rejection after the caller has already cancelled', async () => {
			const controller = new AbortController()
			const source = createDeferred<number>()
			const sourceStarted = createDeferred<void>()
			const promise = Flow.Try.Async({
				signal: controller.signal,
				try: () => {
					sourceStarted.resolve()
					return source.promise
				},
			})

			await sourceStarted.promise
			controller.abort()
			const result = await promise
			source.reject(new Error('late rejection'))
			await expect(source.promise).rejects.toThrow('late rejection')
			expect(await promise).toBe(result)
			expectErrorResult(result, 'AbortError')
		})

		it.each([
			{ label: 'success', source: () => Promise.resolve(1) },
			{ label: 'failure', source: () => Promise.reject(new Error('failed')) },
		])('releases the abort subscription after $label', async ({ source }) => {
			const controller = new AbortController()
			const subscribe = vi.spyOn(controller.signal, 'addEventListener')
			await Flow.Try.Async({ signal: controller.signal, try: source })

			expect(subscribe).toHaveBeenCalledTimes(1)
			const [event, , options] = subscribe.mock.calls[0]!
			expect(event).toBe('abort')
			expect(options).toMatchObject({ once: true })
			expect((options as AddEventListenerOptions).signal?.aborted).toBe(true)
		})

		it('keeps two operations with different signals independent', async () => {
			const firstController = new AbortController()
			const secondController = new AbortController()
			const source = createDeferred<number>()
			const first = Flow.Try.Async({ signal: firstController.signal, try: () => source.promise })
			const second = Flow.Try.Async({ signal: secondController.signal, try: () => source.promise })
			firstController.abort()
			source.resolve(5)
			expectErrorResult(await first, 'AbortError')
			expectOkResult(await second, { tag: null, data: 5 })
		})
	})
})
