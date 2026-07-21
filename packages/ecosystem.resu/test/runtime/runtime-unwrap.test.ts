import { describe, expect, it } from 'vitest'
import { RuntimeUnwrapAsync } from '../../src/operations/runtime-unwrap-async'
import { RuntimeUnwrapSync } from '../../src/operations/runtime-unwrap-sync'
import { RuntimeUnwrapTaggedAsync } from '../../src/operations/runtime-unwrap-tagged-async'
import { RuntimeUnwrapTaggedSync } from '../../src/operations/runtime-unwrap-tagged-sync'
import { ResultOk } from '../../src/operations/result-ok'
import { expectErrorResult, expectOkResult } from './helpers/result-assertions'

describe('RuntimeUnwrapSync', () => {
	it('returns a generator that yields the result and gives Result.data back to yield*', () => {
		function* runtime() {
			const value = yield* RuntimeUnwrapSync(ResultOk({ tag: 'Ready', data: 5 }))
			return value + 1
		}

		const iter = runtime()

		expectOkResult(iter.next().value, { tag: 'Ready', data: 5 })
		expect(iter.next()).toEqual({ value: 6, done: true })
	})

	it('maps a non-result value through the callback before unwrapping it', () => {
		function* runtime() {
			const value = yield* RuntimeUnwrapSync(
				'ready',
				(input) => ResultOk({ tag: 'Mapped', data: input.length }),
			)
			return value * 2
		}

		const iter = runtime()

		expectOkResult(iter.next().value, { tag: 'Mapped', data: 5 })
		expect(iter.next()).toEqual({ value: 10, done: true })
	})

	it('returns a RuntimeError result generator for a non-result without a mapper', () => {
		const iter = (RuntimeUnwrapSync as unknown as (value: unknown) => Generator<unknown, unknown>)('ready')
		const first = iter.next()

		expect(first.done).toBe(false)
		expect(expectErrorResult(first.value, 'RuntimeError').data).toBeInstanceOf(Error)
	})
})

describe('RuntimeUnwrapTaggedSync', () => {
	it('returns { data, tag } from yield*', () => {
		function* runtime() {
			const value = yield* RuntimeUnwrapTaggedSync(ResultOk({ tag: 'Ready', data: 7 }))
			return `${value.tag}:${value.data}`
		}

		const iter = runtime()

		expectOkResult(iter.next().value, { tag: 'Ready', data: 7 })
		expect(iter.next()).toEqual({ value: 'Ready:7', done: true })
	})
})

describe('RuntimeUnwrapAsync', () => {
	it('returns an async generator that yields the result and gives Result.data back to yield*', async () => {
		async function* runtime() {
			const value = yield* RuntimeUnwrapAsync(
				Promise.resolve('ready'),
				async (input) => ResultOk({ tag: 'Mapped', data: input.length }),
			)
			return value + 1
		}

		const iter = runtime()

		expectOkResult((await iter.next()).value, { tag: 'Mapped', data: 5 })
		expect(await iter.next()).toEqual({ value: 6, done: true })
	})

	it('returns a RuntimeError result generator for a non-result without a mapper', async () => {
		const iter = (RuntimeUnwrapAsync as unknown as (value: Promise<unknown>) => AsyncGenerator<unknown, unknown>)(Promise.resolve('ready'))
		const first = await iter.next()

		expect(first.done).toBe(false)
		expect(expectErrorResult(first.value, 'RuntimeError').data).toBeInstanceOf(Error)
	})
})

describe('RuntimeUnwrapTaggedAsync', () => {
	it('returns { data, tag } from yield*', async () => {
		async function* runtime() {
			const value = yield* RuntimeUnwrapTaggedAsync(
				Promise.resolve(ResultOk({ tag: 'Ready', data: 9 })),
			)
			return `${value.tag}:${value.data}`
		}

		const iter = runtime()

		expectOkResult((await iter.next()).value, { tag: 'Ready', data: 9 })
		expect(await iter.next()).toEqual({ value: 'Ready:9', done: true })
	})
})
