import { IsResultWith } from '../factories/result-create-is-result-with'

/**
 * Compile-time result check for a value type.
 *
 * @template V
 * Value type to test.
 */
export type ResultIs<V> = [V] extends [unknown]
	? IsResultWith.Return<'any', V>
	: never

/**
 * Checks whether a value is a result instance.
 *
 * @param value
 * Value to test.
 *
 * @returns
 * `true` when the value is an `ok` or `error` result instance.
 *
 * @example
 * ```ts
 * ResultIs(ResultOk({ data: 1 }))
 * ```
 *
 * @example
 * ```ts
 * ResultIs({ status: 'ok', tag: null, data: 1 })
 * ```
 */
export const ResultIs: IsResultWith<'any'> = IsResultWith('any')
