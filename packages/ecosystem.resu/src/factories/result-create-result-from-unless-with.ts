import { ResultIs } from '../operations/result-is'
import { ResultIsOk } from '../operations/result-is-ok'
import { ResultIsError } from '../operations/result-is-error'
import { ResultOkFrom } from '../operations/result-ok-from'
import { ResultErrorFrom } from '../operations/result-error-from'
import type { Result } from '../classes/result'
import type { ResultAnyOk } from '../operations/result-any-ok'
import type { ResultAnyError } from '../operations/result-any-error'
import type { UtilsNonUndefined } from '../utils/utils-non-undefined'

/**
 * Types for converting values while retaining an opposite result status.
 */
export namespace ResultFromUnlessWith {
	/**
	 * Result type produced by an opposite-status-preserving conversion.
	 *
	 * @template S
	 * Requested status for non-opposite inputs.
	 *
	 * @template V
	 * Source value or result type.
	 *
	 * @template T
	 * Optional tag assigned when conversion is needed.
	 */
	export type Return<
		S extends Result.Status,
		V,
		T extends Result.Tag = never,
	> =
		[S, V, T] extends [unknown, unknown, unknown]
			? S extends 'ok'
				? V extends ResultAnyError ? V : ResultOkFrom<V, T>
				: V extends ResultAnyOk ? V : ResultErrorFrom<V, T>
			: never
}

/**
 * Function type for converting values while retaining opposite result fields.
 *
 * @template S
 * Requested status for non-opposite inputs.
 */
export type ResultFromUnlessWith<
	S extends Result.Status,
> =
	[S] extends [unknown]
		? <
			V,
			T extends Result.Tag,
		> (
			value: UtilsNonUndefined<V>,
			tag?: T,
		) => (
			ResultFromUnlessWith.Return<S, V, T>
		)
		: never

/**
 * Creates a converter that uses a status unless the source already has the opposite one.
 *
 * An input with the opposite status produces a new result with the same status,
 * tag, and data; the supplied tag is ignored. Every other input is converted
 * to the requested status.
 *
 * @template S
 * Requested status for non-opposite inputs.
 *
 * @param status
 * Result status to bind.
 *
 * @returns
 * Converter that retains opposite result fields and wraps every other value.
 *
 * @example
 * ```ts
 * const OkUnlessError = ResultFromUnlessWith('ok')
 * const result = OkUnlessError('ready', 'State')
 * ```
 *
 * @example
 * ```ts
 * const ErrorUnlessOk = ResultFromUnlessWith('error')
 * const result = ErrorUnlessOk(ResultOk({ tag: 'Ready', data: 1 }))
 * ```
 */
export function ResultFromUnlessWith<
	S extends Result.Status,
>(
	status: S,
): (
	ResultFromUnlessWith<S>
) {
	const isResultWithStatus = status === 'ok' ? ResultIsOk : ResultIsError
	const resultResolve = status === 'ok' ? ResultOkFrom : ResultErrorFrom
	const resultResolveOpposite = status === 'ok' ? ResultErrorFrom : ResultOkFrom
	return ((value: unknown, tag) => {
		return !ResultIs(value) || isResultWithStatus(value)
			? resultResolve(value, tag)
			: resultResolveOpposite(value)
	}) as ResultFromUnlessWith<S>
}
