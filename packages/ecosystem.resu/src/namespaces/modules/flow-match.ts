/**
 * Creates a chain whose `result()` preserves unmatched status, tag, and data.
 */
export { FlowMatchLoose as Loose } from '../../operations/flow-match-loose'

/**
 * Creates a chain requiring exhaustive cases for `result()` in TypeScript.
 * Use `result(true)` while variants remain to preserve unmatched results.
 */
export { FlowMatchStrict as Strict } from '../../operations/flow-match-strict'
