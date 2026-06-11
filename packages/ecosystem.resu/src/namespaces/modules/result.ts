/**
 * Creates error results while preserving existing ok results.
 */
export { ResultErrorFromUnlessOk as ErrorFromUnlessOk } from '../../operations/result-error-from-unless-ok'

/**
 * Creates error results from plain values or existing results.
 */
export { ResultErrorFrom as ErrorFrom } from '../../operations/result-error-from'

/**
 * Creates error results.
 */
export { ResultError as Error } from '../../operations/result-error'

/**
 * Checks whether a value is a result.
 */
export { ResultIs as Is } from '../../operations/result-is'

/**
 * Checks whether a value is an error result.
 */
export { ResultIsError as IsError } from '../../operations/result-is-error'

/**
 * Checks whether a value is an ok result.
 */
export { ResultIsOk as IsOk } from '../../operations/result-is-ok'

/**
 * Creates ok results while preserving existing error results.
 */
export { ResultOkFromUnlessError as OkFromUnlessError } from '../../operations/result-ok-from-unless-error'

/**
 * Creates ok results from plain values or existing results.
 */
export { ResultOkFrom as OkFrom } from '../../operations/result-ok-from'

/**
 * Creates ok results.
 */
export { ResultOk as Ok } from '../../operations/result-ok'

/**
 * Broad error result type.
 */
export type { ResultAnyError as AnyError } from '../../operations/result-any-error'

/**
 * Broad ok result type.
 */
export type { ResultAnyOk as AnyOk } from '../../operations/result-any-ok'

/**
 * Broad result union type.
 */
export type { ResultAny as Any } from '../../operations/result-any'

/**
 * Emitter helpers for result construction events.
 */
export * as Emitters from './result-emitters'
