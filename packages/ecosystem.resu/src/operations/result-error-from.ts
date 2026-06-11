import { ResultFromWith } from '../factories/result-create-result-from-with'
import type { Result } from '../classes/result'

/**
 * `error` result produced from a source value or another result.
 *
 * @template V
 * Source value or result type.
 *
 * @template T
 * Optional tag override.
 */
export type ResultErrorFrom<
	V,
	T extends Result.Tag,
> =
	[V, T] extends [unknown, unknown]
		? ResultFromWith.Return<'error', V, T>
		: never

/**
 * Creates an `error` result from a plain value or another result.
 *
 * @param value
 * Source value or result whose payload should be used.
 *
 * @param tag
 * Optional tag override.
 *
 * @returns
 * New `error` result.
 *
 * @example
 * ```ts
 * const result = ResultErrorFrom(new Error('boom'), 'Failure')
 * ```
 *
 * @example
 * ```ts
 * const source = ResultOk({ tag: 'Ready', data: 1 })
 * const result = ResultErrorFrom(source, 'Failure')
 * ```
 */
export const ResultErrorFrom: ResultFromWith<'error'> = ResultFromWith('error')
