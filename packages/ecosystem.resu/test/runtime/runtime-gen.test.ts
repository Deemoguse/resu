import { describe, expect, it, vi } from 'vitest'
import { Result, Runtime } from '../../src/namespaces/index'
import { expectErrorResult, expectOkResult, expectResult } from './helpers/result-assertions'

describe('Runtime.Gen.Sync', () => {
	describe('completion', () => {
		it('returns null for an empty generator', () => {
			expectOkResult(Runtime.Gen.Sync(function* () {}), { tag: null, data: null })
		})

		it.each([0, false, '', null])('normalizes a final plain value: %j', (data) => {
			expectOkResult(Runtime.Gen.Sync(function* () { return data }), { tag: null, data })
		})

		it.each([
			{ source: Result.Ok({ tag: 'Ready', data: { id: 1 } }) },
			{ source: Result.Error({ tag: 'Failure', data: { id: 2 } }) },
		])('preserves a final $source.status result without nesting', ({ source }) => {
			const result = Runtime.Gen.Sync(function* () { return source })
			expectResult(result, { status: source.status, tag: source.tag, data: source.data })
			expect(result).not.toBe(source)
			expect(result.data).toBe(source.data)
		})

		it('composes untagged and tagged unwrap steps', () => {
			const result = Runtime.Gen.Sync(function* () {
				const count = yield* Runtime.Unwrap.Sync(Result.Ok({ data: 2 }))
				const tagged = yield* Runtime.UnwrapTagged.Sync(Result.Ok({ tag: 'Ready', data: count + 1 }))
				return tagged.tag + ':' + tagged.data
			})
			expectOkResult(result, { tag: null, data: 'Ready:3' })
		})
	})

	describe('early exit', () => {
		it('stops at the first yielded error and skips later steps', () => {
			const laterStep = vi.fn(() => 2)
			const first = Result.Error({ tag: 'FirstFailure', data: 'broken' })
			const result = Runtime.Gen.Sync(function* () {
				yield* Runtime.Unwrap.Sync(Result.Ok({ data: 1 }))
				yield* Runtime.Unwrap.Sync(first)
				laterStep()
				yield* Runtime.Unwrap.Sync(Result.Error({ tag: 'SecondFailure', data: 2 }))
				return 'unreachable'
			})
			expectResult(result, { status: 'error', tag: 'FirstFailure', data: 'broken' })
			expect(laterStep).not.toHaveBeenCalled()
		})

		it('runs finally cleanup when stopping on a yielded error', () => {
			const cleanup = vi.fn()
			const result = Runtime.Gen.Sync(function* () {
				try {
					yield* Runtime.Unwrap.Sync(Result.Error({ tag: 'Failure', data: 1 }))
					return 'unreachable'
				}
				finally { cleanup() }
			})
			expectErrorResult(result, 'Failure')
			expect(cleanup).toHaveBeenCalledTimes(1)
		})
	})

	describe('exceptions', () => {
		it('converts an exception after a successful step into RuntimeError', () => {
			const error = new Error('step failed')
			const result = Runtime.Gen.Sync(function* () {
				yield* Runtime.Unwrap.Sync(Result.Ok({ data: 1 }))
				throw error
			})
			expect(expectErrorResult(result, 'RuntimeError').data).toBe(error)
		})

		it('converts a generator factory exception into RuntimeError', () => {
			const error = new Error('factory failed')
			const factory = (): Generator<Result.Any, number> => { throw error }
			expect(expectErrorResult(Runtime.Gen.Sync(factory), 'RuntimeError').data).toBe(error)
		})

		it('converts an invalid delegated iterator into RuntimeError', () => {
			const result = Runtime.Gen.Sync(function* () {
				// Deliberately simulate an untyped JavaScript caller.
				yield* (123 as unknown as Generator<Result.Any, number>)
				return 'unreachable'
			})
			expect(expectErrorResult(result, 'RuntimeError').data).toBeInstanceOf(Error)
		})
	})
})

describe('Runtime.Gen.Async', () => {
	describe('completion', () => {
		it('returns a Promise for an empty generator', async () => {
			const promise = Runtime.Gen.Async(async function* () {})
			expect(promise).toBeInstanceOf(Promise)
			expectOkResult(await promise, { tag: null, data: null })
		})

		it.each([0, false, '', null])('normalizes a final plain value: %j', async (data) => {
			expectOkResult(await Runtime.Gen.Async(async function* () { return data }), { tag: null, data })
		})

		it.each([
			{ source: Result.Ok({ tag: 'Ready', data: { id: 1 } }) },
			{ source: Result.Error({ tag: 'Failure', data: { id: 2 } }) },
		])('preserves a final $source.status result without nesting', async ({ source }) => {
			const result = await Runtime.Gen.Async(async function* () { return source })
			expectResult(result, { status: source.status, tag: source.tag, data: source.data })
			expect(result).not.toBe(source)
		})

		it('composes async mappings and tagged unwrap steps', async () => {
			const result = await Runtime.Gen.Async(async function* () {
				const count = yield* Runtime.Unwrap.Async(Promise.resolve('ready'), async (value) => Result.Ok({ data: value.length }))
				const tagged = yield* Runtime.UnwrapTagged.Async(Promise.resolve(Result.Ok({ tag: 'Ready', data: count + 1 })))
				return tagged.tag + ':' + tagged.data
			})
			expectOkResult(result, { tag: null, data: 'Ready:6' })
		})
	})

	describe('early exit', () => {
		it('stops at the first yielded error and skips later steps', async () => {
			const laterStep = vi.fn(() => 2)
			const result = await Runtime.Gen.Async(async function* () {
				yield* Runtime.Unwrap.Async(Promise.resolve(Result.Error({ tag: 'FirstFailure', data: 'broken' })))
				laterStep()
				return 'unreachable'
			})
			expectResult(result, { status: 'error', tag: 'FirstFailure', data: 'broken' })
			expect(laterStep).not.toHaveBeenCalled()
		})

		it('awaits finally cleanup when stopping on a yielded error', async () => {
			const cleanup = vi.fn(async () => {})
			const result = await Runtime.Gen.Async(async function* () {
				try {
					yield* Runtime.Unwrap.Async(Result.Error({ tag: 'Failure', data: 1 }))
					return 'unreachable'
				}
				finally { await cleanup() }
			})
			expectErrorResult(result, 'Failure')
			expect(cleanup).toHaveBeenCalledTimes(1)
		})
	})

	describe('exceptions', () => {
		it('converts a thrown exception into RuntimeError', async () => {
			const error = new Error('step failed')
			const result = await Runtime.Gen.Async(async function* () { throw error })
			expect(expectErrorResult(result, 'RuntimeError').data).toBe(error)
		})

		it('converts a rejected step into RuntimeError', async () => {
			const error = new Error('input rejected')
			const result = await Runtime.Gen.Async(async function* () {
				const value = yield* Runtime.Unwrap.Async(Promise.reject(error) as Promise<Result.AnyOk>)
				return value
			})
			expect(expectErrorResult(result, 'RuntimeError').data).toBe(error)
		})

		it('converts a rejected final value into RuntimeError', async () => {
			const error = new Error('final value rejected')
			const result = await Runtime.Gen.Async(async function* () { return Promise.reject(error) })
			expect(expectErrorResult(result, 'RuntimeError').data).toBe(error)
		})

		it('converts a generator factory exception into a resolved RuntimeError', async () => {
			const error = new Error('factory failed')
			const factory = (): AsyncGenerator<Result.Any, number> => { throw error }
			expect(expectErrorResult(await Runtime.Gen.Async(factory), 'RuntimeError').data).toBe(error)
		})

		it('converts an invalid delegated iterator into RuntimeError', async () => {
			const result = await Runtime.Gen.Async(async function* () {
				yield* (123 as unknown as AsyncGenerator<Result.Any, number>)
				return 'unreachable'
			})
			expect(expectErrorResult(result, 'RuntimeError').data).toBeInstanceOf(Error)
		})
	})
})
