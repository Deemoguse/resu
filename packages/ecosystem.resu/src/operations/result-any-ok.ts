import { Result } from '../classes/result'

/**
 * Broad `ok` result instance type.
 */
export type ResultAnyOk = {} & Result<'ok', Result.AnyTag, Result.AnyData>
