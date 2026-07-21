import { ResultFromUnlessWith } from '../factories/result-create-result-from-unless-with'
import type { Result } from '../classes/result'

/**
 * Result produced as `error` unless the source is an `ok` result.
 *
 * @template V
 * Source value or result type.
 *
 * @template T
 * Optional tag assigned to an `error` result and ignored for an `ok` source.
 */
export type ResultErrorFromUnlessOk<
	V,
	T extends Result.Tag = never,
> =
	[V, T] extends [unknown, unknown]
		? ResultFromUnlessWith.Return<'error', V, T>
		: never

/**
 * Creates a new `error` result unless the source is an `ok` result.
 *
 * An `ok` source produces a new result with the source status, tag, and data.
 *
 * @param value
 * Source value or result to normalize.
 *
 * @param tag
 * Optional tag assigned to an `error` result and ignored for an `ok` source.
 *
 * @returns
 * New `ok` result retaining source fields, or a new `error` result.
 *
 * @example
 * ```ts
 * const result = ResultErrorFromUnlessOk('broken', 'Failure')
 * ```
 *
 * @example
 * ```ts
 * const success = ResultOk({ tag: 'Ready', data: 1 })
 * const result = ResultErrorFromUnlessOk(success)
 * ```
 */
export const ResultErrorFromUnlessOk: ResultFromUnlessWith<'error'> = ResultFromUnlessWith('error')
