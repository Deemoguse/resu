/**
 * Value source type accepted by flow callbacks before result normalization.
 */
export type { UtilsResultSource as UtilsResultSource } from '../../utils/utils-result-source'

/**
 * Tuple type that requires at least one item.
 */
export type { UtilsNonAmptyArray as UtilsNonAmptyArray } from '../../utils/utils-non-empty-array'

/**
 * Synchronous value type excluding `undefined` and `void`.
 */
export type { UtilsNonUndefinedSync as NonUndefinedSync } from '../../utils/utils-non-undefined-sync'

/**
 * Async-capable value type excluding `undefined` and `void`.
 */
export type { UtilsNonUndefinedAsync as NonUndefinedAsync } from '../../utils/utils-non-undefined-async'

/**
 * Abort error result constructor and type.
 */
export { UtilsErrorAbort as AbortError } from '../../utils/utils-error-abort'

/**
 * Runtime error result constructor and type.
 */
export { UtilsErrorRuntime as RuntimeError } from '../../utils/utils-error-runtime'
