import { IsResultWith } from '../factories/result-create-is-result-with'

/**
 * Compile-time error-result check for a value type.
 *
 * @template V
 * Value type to test.
 */
export type ResultIsError<V> = [V] extends [unknown]
	? IsResultWith.Return<'error', V>
	: never

/**
 * Checks whether a value is an `error` result instance.
 *
 * @param value
 * Value to test.
 *
 * @returns
 * `true` when the value is an `error` result instance.
 *
 * @example
 * ```ts
 * ResultIsError(ResultError({ tag: 'Failure' }))
 * ```
 *
 * @example
 * ```ts
 * ResultIsError(ResultOk({ data: 1 }))
 * ```
 */
export const ResultIsError: IsResultWith<'error'> = IsResultWith('error')
