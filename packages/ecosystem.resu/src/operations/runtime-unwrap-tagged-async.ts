import { RuntimeUnwrapCreateWith } from '../factories/runtime-unwrap-create-with'
import type { ResultAny } from './result-any'

/**
 * Async generator that yields a result and returns its tag with payload.
 *
 * @template R
 * Result type yielded by the generator.
 */
export type RuntimeUnwrapTaggedAsync<R extends ResultAny> =
	[R] extends [unknown]
		? RuntimeUnwrapCreateWith.Return<'async', 'tagged', R>
		: never

/**
 * Creates an async generator helper that unwraps `{ tag, data }` for `yield*`.
 *
 * @param result
 * Result, promise, or value to unwrap.
 *
 * @param map
 * Optional mapper used when the first argument is not already a result.
 *
 * @returns
 * Async generator that yields a result and returns its tag with data.
 *
 * @example
 * ```ts
 * async function* runtime() {
 * 	const value = yield* RuntimeUnwrapTaggedAsync(Promise.resolve(ResultOk({ tag: 'Ready', data: 1 })))
 * 	return value.tag
 * }
 * ```
 *
 * @example
 * ```ts
 * async function* runtime() {
 * 	const value = yield* RuntimeUnwrapTaggedAsync(Promise.resolve('ready'), async (input) => ResultOk({ tag: 'Mapped', data: input.length }))
 * 	return value.data
 * }
 * ```
 */
export const RuntimeUnwrapTaggedAsync: RuntimeUnwrapCreateWith<'async', 'tagged'> = RuntimeUnwrapCreateWith('async', 'tagged')
