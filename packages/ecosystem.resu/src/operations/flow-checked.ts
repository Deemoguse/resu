import type { UtilsErrorRuntime } from '../utils/utils-error-runtime'
import type { ResultOkFromUnlessError } from './result-ok-from-unless-error'

/**
 * Result union returned by checked flow operations.
 *
 * @template T
 * Value or result type to normalize into the flow result.
 */
export type FlowChecked<T> = [T] extends [unknown]
	? UtilsErrorRuntime | ResultOkFromUnlessError<T>
	: never
