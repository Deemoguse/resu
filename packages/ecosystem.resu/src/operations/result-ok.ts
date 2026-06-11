import { Result } from '../classes/result'
import { ResultWith } from '../factories/result-create-result-with'

/**
 * Result instance with `ok` status.
 *
 * @template T
 * Tag carried by the result.
 *
 * @template D
 * Payload carried by the result.
 */
export type ResultOk<
	T extends Result.Tag,
	D,
> =
	[T, D] extends [unknown, unknown]
		? Result<'ok', T, D>
		: never

/**
 * Creates an `ok` result.
 *
 * @param params
 * Optional tag, payload, and emission options for the result.
 *
 * @returns
 * Immutable result with `ok` status.
 *
 * @example
 * ```ts
 * const result = ResultOk()
 * ```
 *
 * @example
 * ```ts
 * const result = ResultOk({ tag: 'Ready', data: 42 })
 * ```
 */
export const ResultOk: ResultWith<'ok'> = ResultWith('ok')
