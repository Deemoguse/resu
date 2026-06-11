import { RuntimeUnwrapCreateWith } from '../factories/runtime-unwrap-create-with'
import type { ResultAny } from './result-any'

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
 * @param result
 * Result or value to unwrap.
 *
 * @param map
 * Optional mapper used when the first argument is not already a result.
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
