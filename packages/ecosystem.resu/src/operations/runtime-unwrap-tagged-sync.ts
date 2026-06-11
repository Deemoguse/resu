import { RuntimeUnwrapCreateWith } from '../factories/runtime-unwrap-create-with'
import type { ResultAny } from './result-any'

/**
 * Synchronous generator that yields a result and returns its tag with payload.
 *
 * @template R
 * Result type yielded by the generator.
 */
export type RuntimeUnwrapTaggedSync<R extends ResultAny> =
	[R] extends [unknown]
		? RuntimeUnwrapCreateWith.Return<'sync', 'tagged', R>
		: never

/**
 * Creates a sync generator helper that unwraps `{ tag, data }` for `yield*`.
 *
 * @param result
 * Result or value to unwrap.
 *
 * @param map
 * Optional mapper used when the first argument is not already a result.
 *
 * @returns
 * Generator that yields a result and returns its tag with data.
 *
 * @example
 * ```ts
 * function* runtime() {
 * 	const value = yield* RuntimeUnwrapTaggedSync(ResultOk({ tag: 'Ready', data: 1 }))
 * 	return value.tag
 * }
 * ```
 *
 * @example
 * ```ts
 * function* runtime() {
 * 	const value = yield* RuntimeUnwrapTaggedSync('ready', (input) => ResultOk({ tag: 'Mapped', data: input.length }))
 * 	return value.data
 * }
 * ```
 */
export const RuntimeUnwrapTaggedSync: RuntimeUnwrapCreateWith<'sync', 'tagged'> = RuntimeUnwrapCreateWith('sync', 'tagged')
