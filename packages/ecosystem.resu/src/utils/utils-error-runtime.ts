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
 * Error message converted into an `Error`, or custom payload stored unchanged.
 *
 * @returns
 * Runtime error result with an `Error` for a string input or the provided payload.
 *
 * @example
 * ```ts
 * const result = UtilsErrorRuntime('Unexpected value')
 * ```
 *
 * @example
 * ```ts
 * const result = UtilsErrorRuntime({ reason: 'invalid-state' })
 * ```
 */
export const UtilsErrorRuntime: UtilsCreateErrorWith<'RuntimeError'> = UtilsCreateErrorWith('RuntimeError')
