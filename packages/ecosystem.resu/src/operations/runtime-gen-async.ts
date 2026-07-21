import { RuntimeGenCreateWith } from '../factories/runtime-gen-create-with'
import type { ResultOkFromUnlessError } from './result-ok-from-unless-error'

/**
 * Promise resolving to the result returned by an async generator runtime.
 *
 * @template V
 * Final value returned by the generator.
 */
export type RuntimeGenAsync<V> =
	[V] extends [unknown]
		? RuntimeGenCreateWith.Return<'async', ResultOkFromUnlessError<V>, V>
		: never

/**
 * Runs an async generator-based result flow.
 *
 * @param gen
 * Async generator factory that yields runtime unwrap results and returns a final value.
 *
 * @returns
 * Async flow result for the generator completion value or first yielded error.
 *
 * @example
 * ```ts
 * const result = await RuntimeGenAsync(async function* () {
 * 	return 1
 * })
 * ```
 *
 * @example
 * ```ts
 * const result = await RuntimeGenAsync(async function* () {
 * 	const value = yield* RuntimeUnwrapAsync(Promise.resolve(ResultOk({ data: 1 })))
 * 	return value + 1
 * })
 * ```
 */
export const RuntimeGenAsync: RuntimeGenCreateWith<'async'> = RuntimeGenCreateWith('async')
