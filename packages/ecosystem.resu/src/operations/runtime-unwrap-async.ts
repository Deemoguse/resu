import { RuntimeUnwrapCreateWith } from '../factories/runtime-unwrap-create-with'
import type { ResultAny } from './result-any'

/**
 * Async generator that yields a result and returns its payload.
 *
 * @template R
 * Result type yielded by the generator.
 */
export type RuntimeUnwrapAsync<R extends ResultAny> =
	[R] extends [unknown]
		? RuntimeUnwrapCreateWith.Return<'async', 'untagged', R>
		: never

/**
 * Creates an async generator helper that unwraps result data for `yield*`.
 *
 * Mapper errors and rejections are converted into yielded `RuntimeError` results.
 *
 * @param result
 * Existing result, a promise resolving to one, or a source value or promise
 * that must be converted by `map`.
 *
 * @param map
 * Mapper required when the resolved first argument is not already a result.
 *
 * @returns
 * Async generator that yields a result and returns its data.
 *
 * @example
 * ```ts
 * async function* runtime() {
 * 	const value = yield* RuntimeUnwrapAsync(Promise.resolve(ResultOk({ data: 1 })))
 * 	return value + 1
 * }
 * ```
 *
 * @example
 * ```ts
 * async function* runtime() {
 * 	const value = yield* RuntimeUnwrapAsync(Promise.resolve('ready'), async (input) => ResultOk({ data: input.length }))
 * 	return value
 * }
 * ```
 */
export const RuntimeUnwrapAsync: RuntimeUnwrapCreateWith<'async', 'untagged'> = RuntimeUnwrapCreateWith('async', 'untagged')
