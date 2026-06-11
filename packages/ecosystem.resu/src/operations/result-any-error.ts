import { Result } from '../classes/result'

/**
 * Broad `error` result instance type.
 */
export type ResultAnyError = {} & Result<'error', Result.AnyTag, Result.AnyData>
