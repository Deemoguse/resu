import { describe, expect, it, vi } from 'vitest'
import { Flow, Result } from '../../src/namespaces/index'
import { expectErrorResult, expectOkResult, expectResult } from './helpers/result-assertions'

describe('Flow.Function.Sync', () => {
	describe('arguments and invocation', () => {
		it('runs only when the wrapper is called', () => {
			const source = vi.fn((value: number) => value + 1)
			const wrapped = Flow.Function.Sync(source)
			expect(source).not.toHaveBeenCalled()
			expectOkResult(wrapped(2), { tag: null, data: 3 })
			expect(source).toHaveBeenCalledExactlyOnceWith(2)
		})

		it('preserves optional and rest arguments', () => {
			const source = vi.fn((prefix = 'sum', ...values: number[]) => prefix + ':' + values.reduce((a, b) => a + b, 0))
			const wrapped = Flow.Function.Sync(source)
			expectOkResult(wrapped(undefined, 2, 3), { tag: null, data: 'sum:5' })
			expect(source).toHaveBeenCalledWith(undefined, 2, 3)
		})

		it('runs the source again on each call', () => {
			let count = 0
			const wrapped = Flow.Function.Sync(() => ++count)
			expectOkResult(wrapped(), { tag: null, data: 1 })
			expectOkResult(wrapped(), { tag: null, data: 2 })
		})
	})

	describe('return values', () => {
		it.each([0, false, '', null])('preserves a falsy return value: %j', (data) => {
			expectOkResult(Flow.Function.Sync(() => data)(), { tag: null, data })
		})

		it.each([
			{ status: 'ok', source: Result.Ok({ tag: 'Ready', data: { id: 1 } }) },
			{ status: 'error', source: Result.Error({ tag: 'Failure', data: { id: 1 } }) },
		] as const)('normalizes a returned $status result without nesting', ({ source, status }) => {
			const result = Flow.Function.Sync(() => source)()
			expectResult(result, { status, tag: source.tag, data: source.data })
			expect(result).not.toBe(source)
			expect(result.data).toBe(source.data)
		})
	})

	it('converts a thrown exception into RuntimeError', () => {
		const error = new Error('source failed')
		const result = Flow.Function.Sync(() => { throw error })()
		expect(expectErrorResult(result, 'RuntimeError').data).toBe(error)
	})
})

describe('Flow.Function.Async', () => {
	describe('arguments and invocation', () => {
		it('runs only when the wrapper is called', async () => {
			const source = vi.fn(async (value: string) => value.length)
			const wrapped = Flow.Function.Async(source)
			expect(source).not.toHaveBeenCalled()
			const promise = wrapped('ready')
			expect(promise).toBeInstanceOf(Promise)
			expectOkResult(await promise, { tag: null, data: 5 })
			expect(source).toHaveBeenCalledExactlyOnceWith('ready')
		})

		it('preserves optional and rest arguments', async () => {
			const source = vi.fn(async (base = 1, ...values: number[]) => base + values.reduce((a, b) => a + b, 0))
			const wrapped = Flow.Function.Async(source)
			expectOkResult(await wrapped(undefined, 2, 3), { tag: null, data: 6 })
			expect(source).toHaveBeenCalledWith(undefined, 2, 3)
		})

		it('keeps concurrent calls independent', async () => {
			const wrapped = Flow.Function.Async(async (value: number) => value * 2)
			const [first, second] = await Promise.all([wrapped(2), wrapped(5)])
			expectOkResult(first, { tag: null, data: 4 })
			expectOkResult(second, { tag: null, data: 10 })
			expect(first).not.toBe(second)
		})
	})

	describe('return values', () => {
		it('accepts a synchronous source and still returns a Promise', async () => {
			const promise = Flow.Function.Async((value: number) => value + 1)(2)
			expect(promise).toBeInstanceOf(Promise)
			expectOkResult(await promise, { tag: null, data: 3 })
		})

		it.each([0, false, '', null])('preserves a falsy resolved value: %j', async (data) => {
			expectOkResult(await Flow.Function.Async(async () => data)(), { tag: null, data })
		})

		it.each([
			{ status: 'ok', source: Result.Ok({ tag: 'Ready', data: 1 }) },
			{ status: 'error', source: Result.Error({ tag: 'Failure', data: 2 }) },
		] as const)('normalizes a returned $status result without nesting', async ({ source, status }) => {
			const result = await Flow.Function.Async(async () => source)()
			expectResult(result, { status, tag: source.tag, data: source.data })
			expect(result).not.toBe(source)
		})
	})

	describe('exceptions', () => {
		it('converts a synchronous throw into RuntimeError', async () => {
			const error = new Error('source threw')
			const result = await Flow.Function.Async(() => { throw error })()
			expect(expectErrorResult(result, 'RuntimeError').data).toBe(error)
		})

		it('converts a rejected Promise into RuntimeError', async () => {
			const error = new Error('source rejected')
			const result = await Flow.Function.Async(() => Promise.reject(error))()
			expect(expectErrorResult(result, 'RuntimeError').data).toBe(error)
		})
	})
})
