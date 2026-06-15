/**
 * Flow callback source type accepted before result normalization.
 */
export type { UtilsSource as Source } from '../../utils/utils-source'

/**
 * Non-promise flow callback source type without `undefined` or `void`.
 */
export type { UtilsNonUndefinedSource as NonUndefinedSource } from '../../utils/utils-non-undefined-source'

/**
 * Tuple type that requires at least one item.
 */
export type { UtilsNonAmptyArray as NonAmptyArray } from '../../utils/utils-non-empty-array'

/**
 * Value type without `undefined` or `void`.
 */
export type { UtilsNonUndefined as NonUndefined } from '../../utils/utils-non-undefined'

/**
 * Abort error result constructor and type.
 */
export { UtilsErrorAbort as AbortError } from '../../utils/utils-error-abort'

/**
 * Runtime error result constructor and type.
 */
export { UtilsErrorRuntime as RuntimeError } from '../../utils/utils-error-runtime'
