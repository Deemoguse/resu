import { Result } from '../classes/result'

/**
 * Broad `error` result instance shape.
 */
export type ResultAnyError = {} & Result<{ status: 'error', tag: Result.Tag, data: Result.Data }>
