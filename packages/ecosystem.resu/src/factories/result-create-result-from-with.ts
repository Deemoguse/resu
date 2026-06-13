import { Result } from '../classes/result'
import { ResultOk } from '../operations/result-ok'
import { ResultError } from '../operations/result-error'
import { ResultIs } from '../operations/result-is'
import type { UtilsNonUndefinedSync } from '../utils/utils-non-undefined-sync'

/**
 * Types for converting values into results with a fixed status.
 */
export namespace ResultFromWith {
	/**
	 * Result type produced from a source value or another structured result.
	 *
	 * @template S
	 * Status assigned to the produced result.
	 *
	 * @template V
	 * Source value or result type.
	 *
	 * @template T
	 * Optional tag override.
	 */
	export type Return<
		S extends Result.Status,
		V,
		T extends Result.Tag = never,
	> =
		[S, V, T] extends [unknown, unknown, unknown]
			? V extends Result<{
				status: Result.Status
				tag: infer T1 extends Result.Tag
				data: infer V1 extends Result.Data
			}>
				? Result<{ status: S, tag: [T] extends [never] ? T1 : T, data: V1 }>
				: Result<{ status: S, tag: [T] extends [never] ? null : T, data: V }>
			: never
}

/**
 * Function type for creating a result with a fixed status from a value.
 *
 * @template S
 * Status assigned to every produced result.
 *
 * @public
 */
export type ResultFromWith<
	S extends Result.Status,
> =
	[S] extends [unknown]
		? <
			V,
			T extends Result.Tag = never,
		> (
			value: UtilsNonUndefinedSync<V>,
			tag?: T,
		) => (
			ResultFromWith.Return<S, V, T>
		)
		: never

/**
 * Creates a converter that wraps values into results with a fixed status.
 *
 * If the source is already a result, the converter keeps its payload and tag
 * unless a new tag is provided.
 *
 * @template S
 * Status assigned to every produced result.
 *
 * @param status
 * Result status to bind.
 *
 * @returns
 * Converter from plain values or existing results to the bound result status.
 *
 * @example
 * ```ts
 * const OkFrom = ResultFromWith('ok')
 * const result = OkFrom('ready', 'State')
 * ```
 *
 * @example
 * ```ts
 * const ErrorFrom = ResultFromWith('error')
 * const result = ErrorFrom(ResultOk({ tag: 'Old', data: 1 }), 'New')
 * ```
 *
 * @public
 */
export function ResultFromWith<
	S extends Result.Status,
>(
	status: S,
): (
	ResultFromWith<S>
) {
	return function (value, tag) {
		const contructor = status === 'ok' ? ResultOk : ResultError
		return ResultIs(value)
			? contructor({ data: value.data, tag: tag ?? value.tag })
			: contructor({ data: value, tag: tag })
	} as ResultFromWith<S>
}
