import { UtilsCreateErrorWith } from '../factories/utils-create-error-with'
import type { Result } from '../classes/result'

/**
 * Error result tagged as `AbortError`.
 *
 * @template D
 * Payload carried by the abort error result.
 */
export type UtilsErrorAbort<D = Result.AnyData> = [D] extends [unknown]
	? UtilsCreateErrorWith.Return<'AbortError', D>
	: never

/**
 * Creates an error result tagged as `AbortError`.
 *
 * @param data
 * Optional error message converted into an `Error`, or custom payload stored unchanged.
 *
 * @returns
 * Abort error result with an `Error` for a string input or the provided payload.
 *
 * @example
 * ```ts
 * const result = UtilsErrorAbort()
 * ```
 *
 * @example
 * ```ts
 * const result = UtilsErrorAbort({ reason: 'cancelled' })
 * ```
 */
export const UtilsErrorAbort: UtilsCreateErrorWith<'AbortError'> = UtilsCreateErrorWith('AbortError')
