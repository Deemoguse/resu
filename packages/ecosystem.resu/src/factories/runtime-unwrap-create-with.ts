import { ResultIs } from '../operations/result-is'
import { FlowTryAsync } from '../operations/flow-try-async'
import { FlowTrySync } from '../operations/flow-try-sync'
import type { ResultAny } from '../operations/result-any'
import type { UtilsNonUndefinedSync } from '../utils/utils-non-undefined-sync'
import type { UtilsNonUndefinedAsync } from '../utils/utils-non-undefined-async'
import type { ResultExtractOk } from '../operations/result-extract-ok'
import type { ResultAnyOk } from '../operations/result-any-ok'

/**
 * Types for generator helpers that unwrap result values.
 */
export namespace RuntimeUnwrapCreateWith {
	/**
	 * Generator type returned by sync or async unwrap helpers.
	 *
	 * @template T1
	 * Runtime execution mode.
	 *
	 * @template T2
	 * Unwrap shape returned to `yield*`.
	 *
	 * @template R
	 * Result type yielded by the helper.
	 */
	export type Return<
		T1 extends 'sync' | 'async',
		T2 extends 'untagged' | 'tagged',
		R extends ResultAny,
	> =
		[T1, T2, R] extends [unknown, unknown, unknown]
			? T1 extends 'async'
				? AsyncGenerator<FlowTryAsync<R>, ResultExtractOk<R> extends infer U extends ResultAnyOk
					? T2 extends 'tagged'
						? {
							/**
							 * Tag carried by the unwrapped ok result.
							 */
							tag: U['tag']
							/**
							 * Data carried by the unwrapped ok result.
							 */
							data: U['data']
						}
						: U['data']
					: never
				>
				: Generator<FlowTrySync<R>, ResultExtractOk<R> extends infer U extends ResultAnyOk
					? T2 extends 'tagged'
						? {
							/**
							 * Tag carried by the unwrapped ok result.
							 */
							tag: U['tag']
							/**
							 * Data carried by the unwrapped ok result.
							 */
							data: U['data']
						}
						: U['data']
					: never
				>
			: never

}

/**
 * Function type for sync or async result unwrap helpers.
 *
 * @template T1
 * Runtime execution mode.
 *
 * @template T2
 * Unwrap shape returned to `yield*`.
 */
export type RuntimeUnwrapCreateWith<
	T1 extends 'sync' | 'async',
	T2 extends 'untagged' | 'tagged',
> =
	[T1, T2] extends [unknown, unknown]
		? {
			/**
			 * Maps a non-result value before yielding it to the runtime.
			 *
			 * @template V
			 * Source value type.
			 *
			 * @template R
			 * Result type produced by the mapper.
			 *
			 * @param value
			 * Source value or promise accepted by the selected mode.
			 *
			 * @param map
			 * Mapper that converts the source value into a result.
			 *
			 * @returns
			 * Generator helper for the selected runtime mode and unwrap shape.
			 */
			<V, R extends ResultAny>(
				value: T1 extends 'async'
					? UtilsNonUndefinedAsync<V>
					: UtilsNonUndefinedSync<V>,
				map: (value: V) => T1 extends 'async'
					? UtilsNonUndefinedAsync<R>
					: UtilsNonUndefinedSync<R>
			): (
				RuntimeUnwrapCreateWith.Return<T1, T2, R>
			)

			/**
			 * Yields an existing result to the runtime.
			 *
			 * @template R
			 * Result type yielded by the helper.
			 *
			 * @param result
			 * Result value or promise accepted by the selected mode.
			 *
			 * @returns
			 * Generator helper for the selected runtime mode and unwrap shape.
			 */
			<R extends ResultAny>(
				result: T1 extends 'async'
					? UtilsNonUndefinedAsync<R>
					: UtilsNonUndefinedSync<R>
			): (
				RuntimeUnwrapCreateWith.Return<T1, T2, R>
			)
		}
		: never

/**
 * Creates a result unwrap helper for generator runtimes.
 *
 * The returned helper yields a result to the runtime and gives either the
 * result payload or `{ tag, data }` back to `yield*`.
 *
 * @template T1
 * Runtime execution mode.
 *
 * @template T2
 * Unwrap shape returned to `yield*`.
 *
 * @param type
 * Sync or async runtime mode.
 *
 * @param subtype
 * Whether `yield*` receives only data or both tag and data.
 *
 * @returns
 * Unwrap helper for generator runtimes.
 *
 * @example
 * ```ts
 * const unwrap = RuntimeUnwrapCreateWith('sync', 'untagged')
 * function* runtime() {
 * 	const value = yield* unwrap(ResultOk({ data: 1 }))
 * 	return value
 * }
 * ```
 *
 * @example
 * ```ts
 * const unwrapTagged = RuntimeUnwrapCreateWith('async', 'tagged')
 * async function* runtime() {
 * 	const value = yield* unwrapTagged(Promise.resolve(ResultOk({ tag: 'Ready', data: 1 })))
 * 	return value.tag
 * }
 * ```
 */
export function RuntimeUnwrapCreateWith<
	T1 extends 'sync' | 'async',
	T2 extends 'untagged' | 'tagged',
>(
	type: T1,
	subtype: T2,
): (
	RuntimeUnwrapCreateWith<T1, T2>
) {
	if (type === 'async') return async function* (value, map) {
		const resolvedValue = await value
		const result = !ResultIs(resolvedValue)
			? await FlowTryAsync<ResultAny>(() => map(resolvedValue))
			: resolvedValue

		yield result

		return subtype === 'tagged'
			? { data: result.data, tag: result.tag }
			: result.data
	} as RuntimeUnwrapCreateWith<'async', T2> as RuntimeUnwrapCreateWith<T1, T2>

	else return function* (value, map) {
		const result = !ResultIs(value)
			? FlowTrySync<ResultAny>(() => map(value))
			: value

		yield result

		return subtype === 'tagged'
			? { data: result.data, tag: result.tag }
			: result.data
	} as RuntimeUnwrapCreateWith<'sync', T2> as RuntimeUnwrapCreateWith<T1, T2>
}
