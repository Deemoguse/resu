import { RuntimeUnwrapCreateWith } from '../factories/runtime-unwrap-create-with'
import type { ResultAny } from './result-any'
import { ResultOkFrom } from './result-ok-from'

/**
 * Synchronous generator that yields a result and returns its payload.
 *
 * @template R
 * Result type yielded by the generator.
 */
export type RuntimeUnwrapSync<R extends ResultAny> =
	[R] extends [unknown]
		? RuntimeUnwrapCreateWith.Return<'sync', 'untagged', R>
		: never

/**
 * Creates a sync generator helper that unwraps result data for `yield*`.
 *
 * Mapper errors are converted into yielded `RuntimeError` results.
 *
 * @param result
 * Existing result, or source value that must be converted by `map`.
 *
 * @param map
 * Mapper required when the first argument is not already a result.
 *
 * @returns
 * Generator that yields a result and returns its data.
 *
 * @example
 * ```ts
 * function* runtime() {
 * 	const value = yield* RuntimeUnwrapSync(ResultOk({ data: 1 }))
 * 	return value + 1
 * }
 * ```
 *
 * @example
 * ```ts
 * function* runtime() {
 * 	const value = yield* RuntimeUnwrapSync('ready', (input) => ResultOk({ data: input.length }))
 * 	return value
 * }
 * ```
 */
export const RuntimeUnwrapSync: RuntimeUnwrapCreateWith<'sync', 'untagged'> = RuntimeUnwrapCreateWith('sync', 'untagged')
