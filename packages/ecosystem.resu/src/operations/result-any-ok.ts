import { Result } from '../classes/result'

/**
 * Broad `ok` result instance shape.
 */
export type ResultAnyOk = {} & Result<{ status: 'ok', tag: Result.Tag, data: Result.Data }>
