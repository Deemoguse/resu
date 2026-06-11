import { IsResultWith } from '../factories/result-create-is-result-with'

/**
 * Compile-time ok-result check for a value type.
 *
 * @template V
 * Value type to test.
 */
export type ResultIsOk<V> = [V] extends [unknown]
	? IsResultWith.Return<'ok', V>
	: never

/**
 * Checks whether a value is an `ok` result instance.
 *
 * @param value
 * Value to test.
 *
 * @returns
 * `true` when the value is an `ok` result instance.
 *
 * @example
 * ```ts
 * ResultIsOk(ResultOk({ data: 1 }))
 * ```
 *
 * @example
 * ```ts
 * ResultIsOk(ResultError({ tag: 'Failure' }))
 * ```
 */
export const ResultIsOk: IsResultWith<'ok'> = IsResultWith('ok')
