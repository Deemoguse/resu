import { Result } from '../classes/result'
import { ResultWith } from '../factories/result-create-result-with'

/**
 * Result instance with `error` status.
 *
 * @template T
 * Tag carried by the result.
 *
 * @template D
 * Payload carried by the result.
 */
export type ResultError<
	T extends Result.Tag,
	D extends Result.Data,
> =
	[T, D] extends [unknown, unknown]
		? Result<'error', T, D>
		: never

/**
 * Creates an `error` result.
 *
 * @param params
 * Optional tag, payload, and emission options for the result.
 *
 * @returns
 * Immutable result with `error` status.
 *
 * @example
 * ```ts
 * const result = ResultError()
 * ```
 *
 * @example
 * ```ts
 * const result = ResultError({ tag: 'Failure', data: new Error('boom') })
 * ```
 */
export const ResultError: ResultWith<'error'> = ResultWith('error')
