import { Result } from '../classes/result'
import type { ResultAny } from '../operations/result-any'
import type { ResultAnyOk } from '../operations/result-any-ok'
import type { ResultAnyError } from '../operations/result-any-error'

/**
 * Types for status-specific result guards.
 */
export declare namespace IsResultWith {
	/**
	 * Boolean type produced when a value is tested against a result status.
	 *
	 * @template S
	 * Status selector used by the guard.
	 *
	 * @template V
	 * Value type being tested.
	 */
	export type Return<
		S extends 'any' | Result.Status,
		V,
	> =
		[S, V] extends [unknown, unknown]
			? S extends 'any'
				? V extends ResultAny ? true : false
				: S extends 'ok'
					? V extends ResultAnyOk ? true : false
					: V extends ResultAnyError ? true : false
			: never
}

/**
 * Type guard function for results with a fixed status selector.
 *
 * @template S
 * Status selector used by the guard.
 */
export type IsResultWith<
	S extends 'any' | Result.Status,
> =
	[S] extends [unknown]
		? (value: unknown) => value is S extends 'ok' ? ResultAnyOk : ResultAnyError
		: never

/**
 * Creates a result guard for any result or a specific status.
 *
 * @template S
 * Status selector used by the guard.
 *
 * @param status
 * Result status selector to bind.
 *
 * @returns
 * Type guard for the requested result status selector.
 *
 * @example
 * ```ts
 * const isResult = IsResultWith('any')
 * isResult(ResultOk({ data: 1 }))
 * ```
 *
 * @example
 * ```ts
 * const isError = IsResultWith('error')
 * isError(ResultError({ tag: 'Failure' }))
 * ```
 */
export function IsResultWith<S extends 'any' | Result.Status>(status: S): IsResultWith<S> {
	return (value): value is S extends 'ok' ? ResultAnyOk : ResultAnyError => {
		const isResultInstance = value instanceof Result
		if (!isResultInstance) return false

		return status === 'any'
			? value.status === 'ok' || value.status === 'error'
			: value.status === status
	}
}
