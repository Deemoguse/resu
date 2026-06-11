import { ResultFromUnlessWith } from '../factories/result-create-result-from-unless-with'
import type { Result } from '../classes/result'

/**
 * `ok` result from a value unless the value is already an error result.
 *
 * @template V
 * Source value or result type.
 *
 * @template T
 * Optional tag assigned when an ok result is created.
 */
export type ResultOkFromUnlessError<
	V,
	T extends Result.Tag = never,
> =
	[V, T] extends [unknown, unknown]
		? ResultFromUnlessWith.Return<'ok', V, T>
		: never

/**
 * Creates an `ok` result unless the input is already an `error` result.
 *
 * @param value
 * Source value or result to normalize.
 *
 * @param tag
 * Optional tag assigned when an `ok` result is created.
 *
 * @returns
 * Existing error payload as an error result, or a new `ok` result.
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
