import { describe, expect, it, vi } from 'vitest'
import { FlowTryAsync } from '../../src/operations/flow-try-async'
import { FlowTrySync } from '../../src/operations/flow-try-sync'
import { ResultError } from '../../src/operations/result-error'
import { expectErrorResult, expectOkResult } from './helpers/result-assertions'

describe('FlowTrySync', () => {
	it('wraps a plain callback return value into ResultOk', () => {
		expectOkResult(FlowTrySync(() => 5), { tag: null, data: 5 })
	})

	it('clones a returned result instead of reusing the instance', () => {
		const source = ResultError({ tag: 'Failure', data: 'broken' })
		const next = FlowTrySync(() => source)

		expect(next).not.toBe(source)
		expectErrorResult(next, 'Failure')
		expect(next.data).toBe('broken')
	})

	it('converts thrown errors to RuntimeError results', () => {
		const error = new Error('boom')
		const result = FlowTrySync(() => { throw error })

		const failure = expectErrorResult(result, 'RuntimeError')
		expect(failure.data).toBe(error)
	})

	it('uses the catch callback when try throws and still wraps its result', () => {
		const result = FlowTrySync({
			try: () => { throw new Error('boom') },
			catch: () => 'fallback',
		})

		expectOkResult(result, { tag: null, data: 'fallback' })
	})

	it('converts catch callback exceptions to RuntimeError results', () => {
		const error = new Error('catch failed')
		const result = FlowTrySync({
			try: () => { throw new Error('boom') },
			catch: () => { throw error },
		})

		const failure = expectErrorResult(result, 'RuntimeError')
		expect(failure.data).toBe(error)
	})
})

describe('FlowTryAsync', () => {
	it('accepts sync callbacks and still returns a promise with ResultOk', async () => {
		const promise = FlowTryAsync(() => 8)
		expect(promise).toBeInstanceOf(Promise)
		expectOkResult(await promise, { tag: null, data: 8 })
	})

	it('accepts async callbacks and wraps resolved values into ResultOk', async () => {
		expectOkResult(await FlowTryAsync(async () => 13), { tag: null, data: 13 })
	})

	it('clones a returned result instance', async () => {
		const source = ResultError({ tag: 'Failure', data: 'broken' })
		const next = await FlowTryAsync(async () => source)

		expect(next).not.toBe(source)
		expectErrorResult(next, 'Failure')
		expect(next.data).toBe('broken')
	})

	it('converts thrown or rejected async callback errors to RuntimeError results', async () => {
		const thrown = new Error('thrown')
		const rejected = new Error('rejected')

		const thrownResult = await FlowTryAsync(() => { throw thrown })
		const rejectedResult = await FlowTryAsync(async () => Promise.reject(rejected))

		expect(expectErrorResult(thrownResult, 'RuntimeError').data).toBe(thrown)
		expect(expectErrorResult(rejectedResult, 'RuntimeError').data).toBe(rejected)
	})

	it('uses the async catch callback when try rejects', async () => {
		const result = await FlowTryAsync({
			try: async () => Promise.reject(new Error('boom')),
			catch: async () => 'fallback',
		})

		expectOkResult(result, { tag: null, data: 'fallback' })
	})

	it('converts async catch callback exceptions to RuntimeError results', async () => {
		const error = new Error('catch failed')
		const result = await FlowTryAsync({
			try: async () => Promise.reject(new Error('boom')),
			catch: async () => { throw error },
		})

		expect(expectErrorResult(result, 'RuntimeError').data).toBe(error)
	})

	it('passes signal into try when it is provided', async () => {
		const controller = new AbortController()
		const tryFn = vi.fn((signal: AbortSignal) => signal.aborted ? 0 : 21)

		const result = await FlowTryAsync({
			signal: controller.signal,
			try: tryFn,
		})

		expect(tryFn).toHaveBeenCalledWith(controller.signal)
		expectOkResult(result, { tag: null, data: 21 })
	})

	it('returns AbortError without calling try when the signal is already aborted', async () => {
		const controller = new AbortController()
		controller.abort()
		const tryFn = vi.fn(() => 1)

		const result = await FlowTryAsync({
			signal: controller.signal,
			try: tryFn,
		})

		expect(tryFn).not.toHaveBeenCalled()
		expectErrorResult(result, 'AbortError')
	})

	it('returns AbortError when a pending async operation is aborted', async () => {
		const controller = new AbortController()
		const resultPromise = FlowTryAsync({
			signal: controller.signal,
			try: () => new Promise<number>(() => {}),
		})

		controller.abort()

		expectErrorResult(await resultPromise, 'AbortError')
	})
})
