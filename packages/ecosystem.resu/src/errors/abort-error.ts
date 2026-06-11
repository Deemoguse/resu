import { InternalErrorWith } from '../factories/internal-create-error-with'
import type { Result } from '../classes/result'

/**
 * Error result tagged as `AbortError`.
 *
 * @template D
 * Payload carried by the abort error result.
 */
export type AbortError<D = Result.AnyData> = [D] extends [unknown] ? InternalErrorWith.Return<'AbortError', D> : never

/**
 * Creates an error result tagged as `AbortError`.
 *
 * @param data
 * Optional payload to place into the result.
 *
 * @returns
 * Abort error result with the provided payload.
 *
 * @example
 * ```ts
 * const result = AbortError()
 * ```
 *
 * @example
 * ```ts
 * const result = AbortError({ reason: 'cancelled' })
 * ```
 */
export const AbortError: InternalErrorWith<'AbortError'> = InternalErrorWith('AbortError')
