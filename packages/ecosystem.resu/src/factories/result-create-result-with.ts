import { Result } from '../classes/result'
import type { UtilsNonUndefinedSync } from '../utils/utils-non-undefined-sync'

/**
 * Types for status-specific result constructors.
 */
export declare namespace ResultWith {
	/**
	 * Parameters accepted by an `ok` or `error` result constructor.
	 *
	 * @template T
	 * Tag assigned to the constructed result.
	 *
	 * @template D
	 * Payload assigned to the constructed result.
	 */
	export type Param<
		T extends Result.Tag,
		D,
	> =
		[T, D] extends [unknown, unknown]
			? {
				/**
				 * Optional tag assigned to the result.
				 */
				tag?: UtilsNonUndefinedSync<T>
				/**
				 * Optional payload assigned to the result.
				 */
				data?: UtilsNonUndefinedSync<D>
				/**
				 * Optional logging flag kept for constructor compatibility.
				 */
				log?: boolean
			}
			: never
}

/**
 * Function type for constructing results with a fixed status.
 *
 * @template S
 * Status assigned to every result created by the function.
 */
export type ResultWith<
	S extends Result.Status,
> =
	[S] extends [unknown]
		? <
			T extends Result.Tag = null,
			D = null,
		> (
			params?: ResultWith.Param<T, D>,
		) => (
			Result<{ status: S, tag: T, data: D }>
		)
		: never

/**
 * Creates a result constructor bound to a fixed status.
 *
 * @template S
 * Status assigned to every produced result.
 *
 * @param status
 * Result status to bind.
 *
 * @returns
 * Constructor function that creates results with the bound status.
 *
 * @example
 * ```ts
 * const Ok = ResultWith('ok')
 * const result = Ok({ tag: 'Ready', data: 1 })
 * ```
 *
 * @example
 * ```ts
 * const ErrorResult = ResultWith('error')
 * const result = ErrorResult({ tag: 'Failure', data: 'broken' })
 * ```
 */
export function ResultWith<S extends Result.Status>(status: S): ResultWith<S> {
	return (params) => new Result({ status, ...params })
}
