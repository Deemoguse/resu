import { ResultFromUnlessWith } from '../factories/result-create-result-from-unless-with'
import type { Result } from '../classes/result'

/**
 * `error` result from a value unless the value is already an ok result.
 *
 * @template V
 * Source value or result type.
 *
 * @template T
 * Optional tag assigned when an error result is created.
 */
export type ResultErrorFromUnlessOk<
	V,
	T extends Result.Tag = never,
> =
	[V, T] extends [unknown, unknown]
		? ResultFromUnlessWith.Return<'error', V, T>
		: never

/**
 * Creates an `error` result unless the input is already an `ok` result.
 *
 * @param value
 * Source value or result to normalize.
 *
 * @param tag
 * Optional tag assigned when an `error` result is created.
 *
 * @returns
 * Existing ok payload as an ok result, or a new `error` result.
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
