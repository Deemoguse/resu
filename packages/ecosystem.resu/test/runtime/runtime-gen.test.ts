import { describe, expect, it } from 'vitest'
import { RuntimeGenAsync } from '../../src/operations/runtime-gen-async'
import { RuntimeGenSync } from '../../src/operations/runtime-gen-sync'
import { RuntimeUnwrapAsync } from '../../src/operations/runtime-unwrap-async'
import { RuntimeUnwrapSync } from '../../src/operations/runtime-unwrap-sync'
import { RuntimeUnwrapTaggedAsync } from '../../src/operations/runtime-unwrap-tagged-async'
import { RuntimeUnwrapTaggedSync } from '../../src/operations/runtime-unwrap-tagged-sync'
import { ResultError } from '../../src/operations/result-error'
import { ResultOk } from '../../src/operations/result-ok'
import { expectErrorResult, expectOkResult } from './helpers/result-assertions'

describe('RuntimeGenSync', () => {
	it('supports flat result handling through yield* runtime unwrap helpers', () => {
		const result = RuntimeGenSync(function* () {
			const count = yield* RuntimeUnwrapSync(ResultOk({ data: 2 }))
			const tagged = yield* RuntimeUnwrapTaggedSync(ResultOk({ tag: 'Ready', data: count + 1 }))
			return `${tagged.tag}:${tagged.data}`
		})

		expectOkResult(result, { tag: null, data: 'Ready:3' })
	})

	it('stops processing and returns the unwrapped ResultError', () => {
		let afterFailure = false

		const result = RuntimeGenSync(function* () {
			yield* RuntimeUnwrapSync(ResultOk({ data: 1 }))
			yield* RuntimeUnwrapSync(ResultError({ tag: 'Failure', data: 'broken' }))
			afterFailure = true
			return 2
		})

		expect(afterFailure).toBe(false)
		expect(expectErrorResult(result, 'Failure').data).toBe('broken')
	})

	it('converts thrown exceptions to RuntimeError results', () => {
		const error = new Error('boom')
		const result = RuntimeGenSync(function* () {
			throw error
		})

		expect(expectErrorResult(result, 'RuntimeError').data).toBe(error)
	})

	it('returns RuntimeError when yield* is used with a non-result and non-iterable value', () => {
		const result = RuntimeGenSync(function* () {
			yield* (123 as unknown as Generator<unknown, unknown>)
			return 'never'
		})

		expect(expectErrorResult(result, 'RuntimeError').data).toBeInstanceOf(Error)
	})
})

describe('RuntimeGenAsync', () => {
	it('always returns Promise and supports flat handling with async unwrap helpers', async () => {
		const promise = RuntimeGenAsync(async function* () {
			const count = yield* RuntimeUnwrapAsync(
				Promise.resolve('ready'),
				async (value) => ResultOk({ tag: 'Mapped', data: value.length }),
			)
			const tagged = yield* RuntimeUnwrapTaggedAsync(
				Promise.resolve(ResultOk({ tag: 'Ready', data: count + 1 })),
			)

			return `${tagged.tag}:${tagged.data}`
		})

		expect(promise).toBeInstanceOf(Promise)
		expectOkResult(await promise, { tag: null, data: 'Ready:6' })
	})

	it('stops processing and returns the unwrapped ResultError', async () => {
		let afterFailure = false

		const result = await RuntimeGenAsync(async function* () {
			const _1 = yield* RuntimeUnwrapAsync(Promise.resolve(ResultOk({ data: 1 })))
			const _2 = yield* RuntimeUnwrapAsync(Promise.resolve(ResultError({ tag: 'Failure', data: 'broken' })))
			afterFailure = true
			return 2
		})

		expect(afterFailure).toBe(false)
		expect(expectErrorResult(result, 'Failure').data).toBe('broken')
	})

	it('converts thrown exceptions to RuntimeError results', async () => {
		const error = new Error('boom')
		const result = await RuntimeGenAsync(async function* () {
			throw error
		})

		expect(expectErrorResult(result, 'RuntimeError').data).toBe(error)
	})

	it('returns RuntimeError when yield* is used with a non-result and non-iterable value', async () => {
		const result = await RuntimeGenAsync(async function* () {
			yield* (123 as unknown as AsyncGenerator<unknown, unknown>)
			return 'never'
		})

		expect(expectErrorResult(result, 'RuntimeError').data).toBeInstanceOf(Error)
	})
})
