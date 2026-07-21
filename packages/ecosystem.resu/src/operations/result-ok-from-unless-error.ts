import { ResultFromUnlessWith } from '../factories/result-create-result-from-unless-with'
import type { Result } from '../classes/result'

/**
 * Result produced as `ok` unless the source is an `error` result.
 *
 * @template V
 * Source value or result type.
 *
 * @template T
 * Optional tag assigned to an `ok` result and ignored for an `error` source.
 */
export type ResultOkFromUnlessError<
	V,
	T extends Result.Tag = never,
> =
	[V, T] extends [unknown, unknown]
		? ResultFromUnlessWith.Return<'ok', V, T>
		: never

/**
 * Creates a new `ok` result unless the source is an `error` result.
 *
 * An `error` source produces a new result with the source status, tag, and data.
 *
 * @param value
 * Source value or result to normalize.
 *
 * @param tag
 * Optional tag assigned to an `ok` result and ignored for an `error` source.
 *
 * @returns
 * New `error` result retaining source fields, or a new `ok` result.
 *
 * @example
 * ```ts
 * const result = ResultOkFromUnlessError('ready', 'State')
 * ```
 *
 * @example
 * ```ts
 * const failure = ResultError({ tag: 'Failure', data: 'broken' })
 * const result = ResultOkFromUnlessError(failure)
 * ```
 */
export const ResultOkFromUnlessError: ResultFromUnlessWith<'ok'> = ResultFromUnlessWith('ok')
