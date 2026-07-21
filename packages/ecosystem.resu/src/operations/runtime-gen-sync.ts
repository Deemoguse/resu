import { RuntimeGenCreateWith } from '../factories/runtime-gen-create-with'
import type { ResultOkFromUnlessError } from './result-ok-from-unless-error'

/**
 * Result returned by a synchronous generator runtime.
 *
 * @template V
 * Final value returned by the generator.
 */
export type RuntimeGenSync<V> =
	[V] extends [unknown]
		? RuntimeGenCreateWith.Return<'sync', ResultOkFromUnlessError<V>, V>
		: never

/**
 * Runs a synchronous generator-based result flow.
 *
 * @param gen
 * Generator factory that yields runtime unwrap results and returns a final value.
 *
 * @returns
 * Sync flow result for the generator completion value or first yielded error.
 *
 * @example
 * ```ts
 * const result = RuntimeGenSync(function* () {
 * 	return 1
 * })
 * ```
 *
 * @example
 * ```ts
 * const result = RuntimeGenSync(function* () {
 * 	const value = yield* RuntimeUnwrapSync(ResultOk({ data: 1 }))
 * 	return value + 1
 * })
 * ```
 */
export const RuntimeGenSync: RuntimeGenCreateWith<'sync'> = RuntimeGenCreateWith('sync')
