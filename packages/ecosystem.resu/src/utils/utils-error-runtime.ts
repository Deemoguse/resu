import { UtilsCreateErrorWith } from '../factories/utils-create-error-with'
import type { Result } from '../classes/result'

/**
 * Error result tagged as `RuntimeError`.
 *
 * @template D
 * Payload carried by the runtime error result.
 */
export type UtilsErrorRuntime<D = Result.AnyData> = [D] extends [unknown]
	? UtilsCreateErrorWith.Return<'RuntimeError', D>
	: never

/**
 * Creates an error result tagged as `RuntimeError`.
 *
 * @param data
 * Error message or payload to place into the result.
 *
 * @returns
 * Runtime error result with the provided payload.
 *
 * @example
 * ```ts
 * const result = RuntimeError('Unexpected value')
 * ```
 *
 * @example
 * ```ts
 * const result = RuntimeError({ reason: 'invalid-state' })
 * ```
 */
export const UtilsErrorRuntime: UtilsCreateErrorWith<'RuntimeError'> = UtilsCreateErrorWith('RuntimeError')
