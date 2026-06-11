import { ResultFromWith } from '../factories/result-create-result-from-with'
import type { Result } from '../classes/result'

/**
 * `ok` result produced from a source value or another result.
 *
 * @template V
 * Source value or result type.
 *
 * @template T
 * Optional tag override.
 */
export type ResultOkFrom<
	V,
	T extends Result.Tag,
> =
	[V, T] extends [unknown, unknown]
		? ResultFromWith.Return<'ok', V, T>
		: never

/**
 * Creates an `ok` result from a plain value or another result.
 *
 * @param value
 * Source value or result whose payload should be used.
 *
 * @param tag
 * Optional tag override.
 *
 * @returns
 * New `ok` result.
 *
 * @example
 * ```ts
 * const result = ResultOkFrom('ready', 'State')
 * ```
 *
 * @example
 * ```ts
 * const source = ResultError({ tag: 'Failure', data: 'broken' })
 * const result = ResultOkFrom(source)
 * ```
 */
export const ResultOkFrom: ResultFromWith<'ok'> = ResultFromWith('ok')
