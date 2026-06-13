import { FlowTrySync } from '../operations/flow-try-sync'
import { FlowTryAsync } from '../operations/flow-try-async'
import type { UtilsResultSource } from '../utils/utils-result-source'
import type { UtilsNonUndefinedSync } from '../utils/utils-non-undefined-sync'
import type { UtilsNonUndefinedAsync } from '../utils/utils-non-undefined-async'

/**
 * Types for wrapping functions into flow-safe functions.
 */
export namespace FlowFunctionWith {
	/**
	 * Function type returned after wrapping a callback.
	 *
	 * @template M
	 * Flow execution mode.
	 *
	 * @template A
	 * Arguments accepted by the wrapped callback.
	 *
	 * @template R
	 * Value returned by the wrapped callback.
	 */
	export type Return<
		M extends 'sync' | 'async',
		A extends unknown[],
		R,
	> =
		[M, A, R] extends [unknown, unknown, unknown]
			? M extends 'sync'
				? (...args: A) => FlowTrySync<R>
				: (...args: A) => FlowTryAsync<R>
			: never
}

/**
 * Factory type that wraps callbacks into sync or async flow functions.
 *
 * @template M
 * Flow execution mode.
 */
export type FlowFunctionWith<M extends 'sync' | 'async'> =
	[M] extends [unknown]
		? M extends 'sync'
			? <R, A extends unknown[]>(func: (...args: A) => UtilsNonUndefinedSync<UtilsResultSource<R>>) => FlowFunctionWith.Return<M, A, R>
			: <R, A extends unknown[]>(func: (...args: A) => UtilsNonUndefinedAsync<UtilsResultSource<R>>) => FlowFunctionWith.Return<M, A, R>
		: never

/**
 * Creates a wrapper for functions that should return flow results.
 *
 * @template M
 * Flow execution mode.
 *
 * @param mode
 * Sync or async mode used by wrapped functions.
 *
 * @returns
 * Function wrapper for the selected mode.
 *
 * @example
 * ```ts
 * const wrapSync = FlowFunctionWith('sync')
 * const readLength = wrapSync((value: string) => value.length)
 * ```
 *
 * @example
 * ```ts
 * const wrapAsync = FlowFunctionWith('async')
 * const readLength = wrapAsync(async (value: string) => value.length)
 * ```
 */
export function FlowFunctionWith<M extends 'sync' | 'async'>(mode: M): FlowFunctionWith<M> {
	return function (func: (...args: unknown[]) => unknown) {
		return function (...args: unknown[]) {
			return mode === 'sync'
				? FlowTrySync(() => func(...args))
				: FlowTryAsync(() => func(...args))
		}
	} as FlowFunctionWith<M>
}
